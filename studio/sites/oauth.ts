import { AuthorizationError, CimdFetchError, OAuthProvider, insufficientScope, type ConsentDescription, type OAuthHelpers, type OAuthResourceAuth } from '@cloudflare/workers-oauth-provider';
import { SitesOAuthStore } from './oauth-store.js';
import type { SitesDatabase } from './store.js';

export interface ConnectorProfile { id: string; name: string }
interface ConnectorEnv { OAUTH_KV: SitesOAuthStore; OAUTH_PROVIDER?: OAuthHelpers }
type ProviderContext = Parameters<OAuthProvider<ConnectorEnv>['fetch']>[2];
const escape = (value: string) => value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
async function digest(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}
function consentPage(details: ConsentDescription, handle: string, profile: ConnectorProfile): string {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect · Forward Deployed</title><style>body{margin:0;background:#f4f2ed;color:#24261f;font:17px/1.55 system-ui}main{max-width:520px;margin:10vh auto;padding:32px}small{letter-spacing:.12em}h1{font-size:34px;line-height:1.15;font-weight:550}button{background:#263e2d;color:white;border:0;border-radius:6px;padding:12px 22px;font:inherit;cursor:pointer}button+button{background:transparent;color:#263e2d}p{color:#55594e}</style><main><small>FORWARD DEPLOYED</small><h1>Connect ${escape(details.clientName)}</h1><p>Signed in as <strong>${escape(profile.name)}</strong>.</p><p>Allow this app to read and update your saved engagements, requirements and Field Lab cases.</p><p>${details.clientDomain ? `Published by <strong>${escape(details.clientDomain)}</strong>.` : 'The app name is supplied by its developer.'} Access returns to <strong>${escape(details.redirectHost)}</strong>.</p>${details.redirectIsLoopback ? '<p>This connects an app on your computer. Continue only if you started this connection.</p>' : ''}<p>Permissions: ${details.scope.map(escape).join(', ')}.</p><form method="post" action="/connect/authorize"><input type="hidden" name="handle" value="${escape(handle)}"><button name="decision" value="approve">Connect</button><button name="decision" value="deny">Cancel</button></form></main></html>`;
}

/** Public connector OAuth is separate from the native Sites /mcp route.
 * `profile` must come from Sites' verified visitor identity. MCP identity comes
 * exclusively from the provider's encrypted grant props, never request headers.
 */
export async function handleConnectorOAuth(request: Request, database: SitesDatabase | undefined, profile: ConnectorProfile | undefined, mcp: (profile: ConnectorProfile) => Promise<Response>): Promise<Response | null> {
  const url = new URL(request.url);
  const paths = ['/connect/mcp', '/connect/authorize', '/connect/token', '/connect/register', '/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource/connect/mcp'];
  if (!paths.includes(url.pathname)) return null;
  if (!database) return new Response('Connection storage is temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const origin = url.origin;
  const store = new SitesOAuthStore(database);
  const provider = new OAuthProvider<ConnectorEnv>({
    apiRoute: '/connect/mcp',
    apiHandler: { async fetch(_request: Request, _env: ConnectorEnv, context: ProviderContext) {
      const verified = context as typeof context & { props: ConnectorProfile; auth: OAuthResourceAuth };
      if (!verified.auth.scope.includes('workspace')) return insufficientScope(verified.auth, ['workspace']);
      if (typeof verified.props?.id !== 'string' || !verified.props.id || typeof verified.props.name !== 'string') return new Response('Unauthorized.', { status: 401 });
      return mcp(verified.props);
    } },
    defaultHandler: { async fetch(authRequest: Request, env: ConnectorEnv) {
      if (url.pathname !== '/connect/authorize') return new Response('Not found.', { status: 404 });
      const oauth = env.OAUTH_PROVIDER!;
      try {
        if (authRequest.method === 'GET') {
          // Validate the registered redirect and PKCE before starting login.
          const parsed = await oauth.parseAuthRequest(authRequest);
          if (!profile) return new Response(null, { status: 302, headers: { Location: `${origin}/signin-with-chatgpt?${new URLSearchParams({ return_to: url.pathname + url.search })}`, 'Cache-Control': 'no-store' } });
          const details = await oauth.describeConsent(parsed);
          const consent = await oauth.beginConsent(parsed);
          await store.put(`consent-subject:${await digest(consent.handle)}`, await digest(profile.id), { expirationTtl: 600 });
          consent.headers.set('Content-Type', 'text/html; charset=utf-8');
          // A navigation POST with no-referrer sends Origin: null. Preserve the
          // same-origin form Origin while withholding referrers across origins.
          consent.headers.set('Referrer-Policy', 'same-origin');
          consent.headers.set('X-Content-Type-Options', 'nosniff');
          return new Response(consentPage(details, consent.handle, profile), { headers: consent.headers });
        }
        if (authRequest.method === 'POST') {
          if (!profile) return new Response('Sign in again to connect your account.', { status: 401 });
          if (authRequest.headers.get('Origin') !== origin) return new Response('Invalid origin.', { status: 403 });
          const form = await authRequest.formData();
          const handle = String(form.get('handle') ?? '');
          if (!handle || handle.length > 1024) return new Response('Invalid consent.', { status: 400 });
          const subjectKey = `consent-subject:${await digest(handle)}`;
          if (await store.get(subjectKey) !== await digest(profile.id)) return new Response('The signed-in account changed. Start the connection again.', { status: 400 });
          if (form.get('decision') !== 'approve') {
            const denied = await oauth.denyConsent(authRequest, handle);
            await store.delete(subjectKey);
            return new Response(null, { status: 302, headers: denied.headers });
          }
          const approved = await oauth.approveConsent(authRequest, handle);
          await store.delete(subjectKey);
          const { redirectTo } = await oauth.completeAuthorization({ request: approved.request, userId: await digest(profile.id), scope: approved.request.scope, metadata: { name: profile.name }, props: profile });
          approved.headers.set('Location', redirectTo);
          return new Response(null, { status: 302, headers: approved.headers });
        }
        return new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, POST' } });
      } catch (error) {
        if (error instanceof AuthorizationError && error.redirectTo) return new Response(null, { status: 302, headers: { Location: error.redirectTo, 'Cache-Control': 'no-store' } });
        if (error instanceof AuthorizationError || error instanceof CimdFetchError) return new Response('This connection request expired or could not be verified. Start again.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
        throw error;
      }
    } },
    authorizeEndpoint: `${origin}/connect/authorize`, tokenEndpoint: `${origin}/connect/token`, clientRegistrationEndpoint: `${origin}/connect/register`,
    scopesSupported: ['workspace', 'offline_access'], requiredScopes: ['workspace'],
    resourceMetadata: { resource: `${origin}/connect/mcp`, authorization_servers: [origin], resource_name: 'Forward Deployed' },
    // Sites does not guarantee the strict-public-fetch flag required for CIMD.
    // DCR and preregistered public PKCE clients need no remote metadata fetch.
    clientIdMetadataDocumentEnabled: false,
    // Published host packages retain their registered client ID across installs.
    clientRegistrationTTL: undefined,
    accessTokenTTL: 3600, refreshTokenTTL: 60 * 60 * 24 * 30,
    cookiePrefix: '__Host-fd-connect',
  });
  // This provider awaits its persistence. Drain any future background work too,
  // so this adapter does not depend on Sites exposing its execution context.
  const pending: Promise<unknown>[] = [];
  const context = { waitUntil(promise: Promise<unknown>) { pending.push(promise); }, passThroughOnException() {}, props: {} } as Parameters<typeof provider.fetch>[2];
  const response = await provider.fetch(request, { OAUTH_KV: store }, context);
  await Promise.all(pending);
  return response;
}

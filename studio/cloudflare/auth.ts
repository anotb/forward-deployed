/// <reference types="@cloudflare/workers-types" />
import { AuthorizationError, CimdFetchError, authorizationErrorRedirect, type AuthRequest, type ConsentDescription, type OAuthHelpers } from '@cloudflare/workers-oauth-provider';

export interface Profile { id: string; name: string }
export interface AuthEnv {
  OAUTH_KV: KVNamespace; OAUTH_PROVIDER: OAuthHelpers;
  GITHUB_CLIENT_ID?: string; GITHUB_CLIENT_SECRET?: string;
  APP_ORIGIN: string;
}
const SESSION_COOKIE = '__Host-fd-session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const escape = (value: string) => value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
export async function digest(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function cookie(request: Request, name: string): string | undefined {
  return request.headers.get('Cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}
function setCookie(value: string, age: number): string { return `${SESSION_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`; }
export async function session(request: Request, env: AuthEnv): Promise<Profile | null> {
  const token = cookie(request, SESSION_COOKIE);
  if (!token || !/^[a-f0-9-]{72}$/.test(token)) return null;
  return env.OAUTH_KV.get<Profile>(`session:${await digest(token)}`, 'json');
}
async function establishSession(profile: Profile, env: AuthEnv, headers: Headers): Promise<void> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  await env.OAUTH_KV.put(`session:${await digest(token)}`, JSON.stringify(profile), { expirationTtl: SESSION_SECONDS });
  headers.append('Set-Cookie', setCookie(token, SESSION_SECONDS));
}
export async function logout(request: Request, env: AuthEnv): Promise<Response> {
  if (request.headers.get('Origin') !== env.APP_ORIGIN) return new Response('Invalid origin.', { status: 403 });
  const token = cookie(request, SESSION_COOKIE);
  if (token) await env.OAUTH_KV.delete(`session:${await digest(token)}`);
  return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': setCookie('', 0), 'Cache-Control': 'no-store' } });
}
export function authConfigured(env: AuthEnv): boolean { return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET); }
function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Forward Deployed</title><style>body{margin:0;background:#f4f2ed;color:#24261f;font:17px/1.55 system-ui}main{max-width:520px;margin:12vh auto;padding:32px}small{letter-spacing:.12em}h1{font-size:34px;line-height:1.15;font-weight:550}button,a.button{background:#263e2d;color:white;border:0;border-radius:6px;padding:12px 22px;font:inherit;cursor:pointer;display:inline-block;text-decoration:none}button+button{background:transparent;color:#263e2d}code{overflow-wrap:anywhere}p{color:#55594e}</style><main><small>FORWARD DEPLOYED</small><h1>${escape(title)}</h1>${body}</main></html>`;
}
export function consentPage(details: ConsentDescription, handle: string): string {
  return page(`Connect ${details.clientName}`, `<p>Let this app read and work on your engagements, requirements and Field Lab cases.</p><p>${details.clientDomain ? `Published by <strong>${escape(details.clientDomain)}</strong>.` : 'The app name is supplied by its developer.'} Access returns to <strong>${escape(details.redirectHost)}</strong>.</p>${details.redirectIsLoopback ? '<p>This connects an app on your computer. Continue only if you started this connection.</p>' : ''}<p>Permissions: ${details.scope.map(escape).join(', ')}</p><form method="post" action="/authorize"><input type="hidden" name="handle" value="${escape(handle)}"><button name="decision" value="approve">Connect</button><button name="decision" value="deny">Cancel</button></form>`);
}
export function loginPage(available: boolean): Response {
  return new Response(page('A place to build the next way of working.', available ? '<p>Sign in to your private workspace.</p><a class="button" href="/login">Continue with GitHub</a>' : '<p>Sign-in is being configured. Your workspace will be available here once account access is ready.</p>'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "frame-ancestors 'none'", 'X-Frame-Options': 'DENY' } });
}
async function upstream(authRequest: AuthRequest, env: AuthEnv, headers?: Headers, website = false): Promise<Response> {
  if (!authConfigured(env)) return new Response('Sign-in is not configured.', { status: 503 });
  const verifier = crypto.randomUUID() + crypto.randomUUID();
  const challenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const transaction = await env.OAUTH_PROVIDER.beginUpstream(authRequest, { data: { verifier, website }, headers });
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, redirect_uri: `${env.APP_ORIGIN}/auth/github/callback`, state: transaction.state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
  transaction.headers.set('Location', url.toString());
  return new Response(null, { status: 302, headers: transaction.headers });
}
export async function authRoutes(request: Request, env: AuthEnv): Promise<Response | null> {
  const url = new URL(request.url); const oauth = env.OAUTH_PROVIDER;
  try {
    if (url.pathname === '/login' && request.method === 'GET') {
      if (!authConfigured(env)) return loginPage(false);
      let clientId = await env.OAUTH_KV.get('website:client');
      if (!clientId) {
        const client = await oauth.createClient({ clientName: 'Forward Deployed website', redirectUris: [`${env.APP_ORIGIN}/`], tokenEndpointAuthMethod: 'none' });
        clientId = client.clientId; await env.OAUTH_KV.put('website:client', clientId);
      }
      // First-party website login uses the provider's browser-bound upstream transaction.
      // It does not issue an MCP grant or accept a caller-supplied redirect.
      return upstream({ clientId, redirectUri: `${env.APP_ORIGIN}/`, responseType: 'code', scope: ['workspace'], state: crypto.randomUUID(), resource: `${env.APP_ORIGIN}/mcp`, issuer: env.APP_ORIGIN }, env, undefined, true);
    }
    if (url.pathname === '/logout' && request.method === 'POST') return logout(request, env);
    if (url.pathname === '/authorize' && request.method === 'GET') {
      const parsed = await oauth.parseAuthRequest(request);
      const details = await oauth.describeConsent(parsed);
      const consent = await oauth.beginConsent(parsed);
      consent.headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(consentPage(details, consent.handle), { headers: consent.headers });
    }
    if (url.pathname === '/authorize' && request.method === 'POST') {
      const form = await request.formData(); const handle = String(form.get('handle') ?? '');
      if (form.get('decision') !== 'approve') {
        const denied = await oauth.denyConsent(request, handle);
        return new Response(null, { status: 302, headers: denied.headers });
      }
      const approved = await oauth.approveConsent(request, handle);
      const profile = await session(request, env);
      if (!profile) return upstream(approved.request, env, approved.headers);
      const { redirectTo } = await oauth.completeAuthorization({ request: approved.request, userId: profile.id, scope: approved.request.scope, metadata: { name: profile.name }, props: profile });
      approved.headers.set('Location', redirectTo);
      return new Response(null, { status: 302, headers: approved.headers });
    }
    if (url.pathname === '/auth/github/callback' && request.method === 'GET') {
      const resumed = await oauth.finishUpstream<{ verifier: string; website: boolean }>(request);
      if (url.searchParams.has('error')) {
        resumed.headers.set('Location', resumed.data.website ? '/' : authorizationErrorRedirect(resumed.request, 'access_denied'));
        return new Response(null, { status: 302, headers: resumed.headers });
      }
      const code = url.searchParams.get('code');
      if (!code || !authConfigured(env)) return new Response('Sign-in could not be completed.', { status: 400 });
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, client_secret: env.GITHUB_CLIENT_SECRET!, code, redirect_uri: `${env.APP_ORIGIN}/auth/github/callback`, code_verifier: resumed.data.verifier }) });
      const token = await tokenResponse.json() as { access_token?: string };
      if (!tokenResponse.ok || !token.access_token) return new Response('GitHub could not complete sign-in. Start again.', { status: 502 });
      const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Forward-Deployed', 'X-GitHub-Api-Version': '2022-11-28' } });
      const user = await userResponse.json() as { id?: number; login?: string; name?: string };
      if (!userResponse.ok || !Number.isSafeInteger(user.id) || !user.login) return new Response('GitHub profile could not be verified.', { status: 502 });
      const profile = { id: `github-${user.id}`, name: user.name || user.login };
      // GitHub's token is used only for identity and is never persisted or passed to an MCP client.
      await establishSession(profile, env, resumed.headers);
      let destination = `${env.APP_ORIGIN}/`;
      if (!resumed.data.website) destination = (await oauth.completeAuthorization({ request: resumed.request, userId: profile.id, scope: resumed.request.scope, metadata: { name: profile.name }, props: profile })).redirectTo;
      resumed.headers.set('Location', destination);
      return new Response(null, { status: 302, headers: resumed.headers });
    }
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError && error.redirectTo) return Response.redirect(error.redirectTo, 302);
    if (error instanceof AuthorizationError || error instanceof CimdFetchError) return new Response('This sign-in request expired or could not be verified. Start the connection again.', { status: 400 });
    throw error;
  }
}

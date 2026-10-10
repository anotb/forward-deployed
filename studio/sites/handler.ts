import { createMcpHandler } from '@modelcontextprotocol/server';
import { ZodError } from 'zod';
import { createStudioMcp } from '../server/mcp.js';
import { executeStudioTool } from '../server/service.js';
import { buildExport } from '../server/export.js';
import { DomainError } from '../server/model.js';
import { executeSavedTool, type SitesDatabase } from './store.js';
import { recordTelemetry } from './telemetry.js';

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
}

function identity(request: Request): { id: string; name: string } | undefined {
  // Sites dispatch supplies this stable, site-scoped subject after authentication.
  // Service-access bypass credentials do not supply a visitor subject.
  const id = request.headers.get('oai-authenticated-user-id');
  if (!id) return;
  let name = request.headers.get('oai-authenticated-user-full-name') || 'Signed-in user';
  if (request.headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
    try { name = decodeURIComponent(name); } catch { name = 'Signed-in user'; }
  }
  return { id, name };
}

async function readJson(request: Pick<Request, 'headers' | 'text'>): Promise<Record<string, any>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new DomainError('invalid_input', 'Send JSON.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 1_048_576) throw new DomainError('invalid_input', 'This request is too large.');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new DomainError('invalid_input', 'Send a JSON object.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DomainError('invalid_input', 'Send a JSON object.');
  return value as Record<string, any>;
}

function zip(bundle: ReturnType<typeof buildExport>): Response {
  return new Response(Uint8Array.from(bundle.zip).buffer, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${bundle.filename}"`, 'Cache-Control': 'no-store' } });
}

export interface SitesEnv { DB?: SitesDatabase; FD_TELEMETRY?: string; OPENAI_APP_CHALLENGE?: string }

export async function handleSitesRequest(request: Request, env: SitesEnv, html: string): Promise<Response> {
  const profile = identity(request);
  const path = new URL(request.url).pathname;
  if (path.startsWith('/connect/') || path === '/.well-known/oauth-authorization-server' || path === '/.well-known/oauth-protected-resource/connect/mcp') {
    const { handleConnectorOAuth } = await import('./oauth.js');
    const connector = await handleConnectorOAuth(request, env.DB, profile, verifiedProfile => {
      const target = new URL(request.url);
      target.pathname = '/mcp';
      return handleInternalRequest(new Request(target, request), env, html, verifiedProfile, ['workspace']);
    });
    if (connector) return connector;
  }
  return handleInternalRequest(request, env, html, profile);
}

async function handleInternalRequest(request: Request, env: SitesEnv, html: string, profile?: { id: string; name: string }, authScopes: string[] = []): Promise<Response> {
  const url = new URL(request.url);
  const login = '/signin-with-chatgpt?return_to=%2F';
  const unauthorized = () => json({ error: 'unauthorized', login }, 401);
  const signIn = () => new Response(null, { status: 302, headers: { Location: new URL(login, url.origin).href, 'Cache-Control': 'no-store' } });
  const runtimeEnv = env;
  const execute = async (name: string, args: Record<string, any>): Promise<Record<string, any>> => {
    const started = performance.now();
    const storage = args.storage === 'saved' || name === 'save_engagement' ? 'saved' : 'stateless';
    const record = (result: 'ok' | 'error' | 'auth_required') => recordTelemetry(runtimeEnv, request, { tool: name, storage, result, latencyMs: performance.now() - started }, { telemetry: args.telemetry });
    try {
      let result: Record<string, any>;
      if (storage === 'saved') {
        if (!profile) throw new DomainError('authentication_required', 'Sign in with ChatGPT to save or open your workspaces.');
        if (!env.DB) throw new DomainError('storage_unavailable', 'Saved workspaces are temporarily unavailable. Stateless work remains available.');
        result = await executeSavedTool(env.DB, profile.id, name, args);
      } else result = executeStudioTool(null, profile?.id ?? 'anonymous', name, args);
      await record('ok');
      return result;
    } catch (error) {
      await record(error instanceof DomainError && error.code === 'authentication_required' ? 'auth_required' : 'error');
      throw error;
    }
  };
  if (url.pathname === '/.well-known/openai-apps-challenge') {
    const challenge = runtimeEnv.OPENAI_APP_CHALLENGE;
    return challenge ? new Response(challenge, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }) : json({ error: 'not_configured' }, 404);
  }
  if (url.pathname === '/mcp') {
    if (!profile) return new Response('Unauthorized', { status: 401, headers: {
      'WWW-Authenticate': `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource/mcp"`,
      'Cache-Control': 'no-store',
    } });
    return createMcpHandler(() => createStudioMcp({
      store: null, actor: profile?.id ?? 'anonymous', html, origin: url.origin,
      profile, authenticated: Boolean(profile), requireAuthentication: true, authScopes, executeTool: execute,
    })).fetch(request);
  }
  if (url.pathname === '/health') return json({ service: 'forward-deployed', hosting: 'sites', signIn: 'chatgpt', storage: 'stateless', savedStorage: env.DB ? 'd1' : 'unavailable' });
  if (url.pathname === '/api/profile') return profile ? json(profile) : unauthorized();
  if (url.pathname === '/login') return signIn();
  if (url.pathname === '/' || url.pathname === '/studio.html') {
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
  }
  if (url.pathname.startsWith('/api/')) {
    try {
      if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json({ error: 'invalid_origin' }, 403);
      if (request.method === 'GET' && url.pathname === '/api/engagements') {
        if (url.searchParams.get('storage') !== 'saved') return json({ engagements: [], storage: 'stateless' });
        return json(await execute('list_engagements', { storage: 'saved' }));
      }
      if (request.method === 'GET' && url.pathname.startsWith('/api/engagements/')) {
        return json(await execute('get_engagement', { engagementId: decodeURIComponent(url.pathname.slice('/api/engagements/'.length)), storage: 'saved' }));
      }
      if (request.method === 'GET' && url.pathname.startsWith('/api/export/')) {
        const data = await execute('get_engagement', { engagementId: decodeURIComponent(url.pathname.slice('/api/export/'.length)), storage: 'saved' });
        return zip(buildExport(data.workspace, { includeEvidence: url.searchParams.get('includeEvidence') !== 'false' }));
      }
      if (request.method === 'POST' && (url.pathname.startsWith('/api/tools/') || url.pathname === '/api/export')) {
        const args = await readJson(request);
        if (url.pathname === '/api/export') {
          const data = await execute('get_engagement', { workspace: args.workspace, engagementId: args.engagementId ?? args.workspace?.engagement?.id, storage: args.storage ?? 'stateless', telemetry: args.telemetry });
          return zip(buildExport(data.workspace, { includeEvidence: args.includeEvidence !== false }));
        }
        return json(await execute(decodeURIComponent(url.pathname.slice('/api/tools/'.length)), args));
      }
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      if (error instanceof DomainError) {
        if (error.code === 'authentication_required') return unauthorized();
        const status = error.code === 'not_found' ? 404 : error.code === 'revision_conflict' || error.code === 'idempotency_conflict' ? 409 : error.code === 'storage_unavailable' ? 503 : 400;
        return json({ error: error.code, message: error.message }, status);
      }
      if (error instanceof ZodError) return json({ error: 'invalid_input', message: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') }, 400);
      return json({ error: 'operation_failed', message: 'This request could not be completed. Try again.' }, 500);
    }
  }
  return json({ error: 'not_found' }, 404);
}

/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from 'cloudflare:workers';
import { OAuthProvider, insufficientScope, type OAuthResourceAuth } from '@cloudflare/workers-oauth-provider';
import { createMcpHandler, type ServerCapabilities } from '@modelcontextprotocol/server';
import { ZodError } from 'zod';
import { createStudioMcp } from '../server/mcp.js';
import { executeStudioTool } from '../server/service.js';
import { DomainError } from '../server/model.js';
import { buildExport } from '../server/export.js';
import { createWorkerEvents, attachEvents } from '../server/events-worker.js';
import type { EventService } from '../server/events-core.js';
import type { WorkspaceWrite, WorkspaceRepository } from '../server/store-contract.js';
import { DurableWorkspaceStore } from './store.js';
import { authConfigured, authRoutes, session, type AuthEnv, type Profile } from './auth.js';
import { recordTelemetry, type TelemetryEnv } from './telemetry.js';

export interface Env extends AuthEnv, TelemetryEnv {
  WORKSPACES: DurableObjectNamespace;
  ASSETS: Fetcher;
  OPENAI_APP_CHALLENGE?: string;
  FD_FORMS_STATE_SECRET?: string;
}
const ACTOR = 'x-forward-deployed-actor';
const NAME = 'x-forward-deployed-name';
function json(value: unknown, status = 200): Response { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
function executeApiTool(request: Request, env: Env, store: WorkspaceRepository | null, actor: string, name: string, args: Record<string, any>): Record<string, any> {
  const started = performance.now();
  const record = (result: string) => {
    if (args.telemetry !== false) recordTelemetry(env, request, { tool: name, storage: name === 'save_engagement' || args.storage === 'saved' ? 'saved' : 'stateless', result, latencyMs: performance.now() - started });
  };
  try { const result = executeStudioTool(store, actor, name, args); record('ok'); return result; }
  catch (error) { record(error instanceof DomainError && error.code === 'authentication_required' ? 'auth_required' : 'error'); throw error; }
}
function zipResponse(exported: ReturnType<typeof buildExport>): Response {
  return new Response(Uint8Array.from(exported.zip).buffer, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${exported.filename}"`, 'Cache-Control': 'no-store' } });
}
function inputError(error: unknown): Response {
  if (error instanceof ZodError) return json({ error: 'invalid_input', message: error.issues.map(issue => issue.message).join('; ') }, 400);
  if (error instanceof DomainError) return json({ error: error.code, message: error.message }, error.code === 'not_found' ? 404 : error.code === 'revision_conflict' ? 409 : 400);
  throw error;
}
async function readJson(request: Request): Promise<Record<string, any>> {
  if (!request.headers.get('Content-Type')?.includes('application/json')) throw new DomainError('invalid_input', 'Content-Type must be application/json.');
  const text = await request.text();
  if (text.length > 1_000_000) throw new DomainError('invalid_input', 'Request exceeds 1 MB.');
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new DomainError('invalid_input', 'Invalid JSON object.'); }
}
async function statelessMcp(request: Request, env: Env, profile?: Profile): Promise<Response> {
  const html = await (await env.ASSETS.fetch(new Request(`${env.APP_ORIGIN}/studio.html`))).text();
  return createMcpHandler(() => createStudioMcp({
    store: null, actor: profile?.id ?? 'anonymous', html, origin: env.APP_ORIGIN, profile, authenticated: Boolean(profile), formStateSecret: env.FD_FORMS_STATE_SECRET,
    onResult: event => recordTelemetry(env, request, event),
    // Discovery does not need storage. Authenticated events/* requests are routed
    // separately to this account's Durable Object and its subscription handlers.
    attach: profile ? mcp => mcp.server.registerCapabilities({ ...mcp.server.getCapabilities(), events: {} } as ServerCapabilities) : undefined,
  })).fetch(request);
}
async function needsSavedWorkspace(request: Request): Promise<boolean> {
  if (request.method !== 'POST') return false;
  try {
    const body = await readJson(request.clone());
    return typeof body.method === 'string' && (body.method.startsWith('events/') || (body.method === 'tools/call' && (body.params?.name === 'save_engagement' || body.params?.arguments?.storage === 'saved')));
  } catch { return false; }
}
async function dispatch(request: Request, env: Env, profile: Profile): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete('Authorization'); headers.delete('Cookie');
  headers.set(ACTOR, profile.id); headers.set(NAME, encodeURIComponent(profile.name));
  const stub = env.WORKSPACES.get(env.WORKSPACES.idFromName(profile.id));
  return stub.fetch(new Request(request, { headers }));
}

/** Private service binding only. The public Worker establishes the actor before forwarding. */
export class WorkspaceObject extends DurableObject<Env> {
  private readonly store: DurableWorkspaceStore;
  private readonly events: EventService;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env); this.store = new DurableWorkspaceStore(ctx.storage);
    this.events = createWorkerEvents(ctx.storage, this.store);
  }
  private async scheduleEvents(): Promise<void> {
    const next = this.events.nextDeliveryAt();
    if (next !== null) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, next));
    else await this.ctx.storage.deleteAlarm();
  }
  async alarm(): Promise<void> { await this.events.flush(); await this.scheduleEvents(); }
  async fetch(request: Request): Promise<Response> {
    const actor = request.headers.get(ACTOR);
    if (!actor) return json({ error: 'unauthorized' }, 401);
    const profile = { id: actor, name: decodeURIComponent(request.headers.get(NAME) ?? '') };
    const url = new URL(request.url);
    try {
      if (url.pathname === '/mcp') {
        const html = await (await this.env.ASSETS.fetch(new Request(`${this.env.APP_ORIGIN}/studio.html`))).text();
        return createMcpHandler(() => createStudioMcp({
          store: this.store, actor, html, origin: this.env.APP_ORIGIN, profile, authenticated: true, formStateSecret: this.env.FD_FORMS_STATE_SECRET,
          attach: (mcp, identity) => attachEvents(mcp, this.events, identity),
          onWrite: async (identity, name, write) => { this.events.publishWorkspaceWrite(identity, name, write); await this.scheduleEvents(); },
          onResult: event => recordTelemetry(this.env, request, event),
        })).fetch(request);
      }
      if (url.pathname === '/api/profile' && request.method === 'GET') return json(profile);
      if (url.pathname === '/api/engagements' && request.method === 'GET') return json({ engagements: this.store.list(actor) });
      if (url.pathname.startsWith('/api/export/') && request.method === 'GET') {
        const workspace = this.store.get(decodeURIComponent(url.pathname.slice('/api/export/'.length)), actor);
        const exported = buildExport(workspace, { includeEvidence: url.searchParams.get('includeEvidence') !== 'false' });
        return zipResponse(exported);
      }
      if (url.pathname.startsWith('/api/engagements/') && request.method === 'GET') return json(this.store.get(decodeURIComponent(url.pathname.slice('/api/engagements/'.length)), actor));
      if (url.pathname.startsWith('/api/tools/') && request.method === 'POST') {
        const args = await readJson(request);
        const result = executeApiTool(request, this.env, this.store, actor, url.pathname.slice('/api/tools/'.length), args);
        if (result.workspace && 'result' in result) {
          this.events.publishWorkspaceWrite(actor, url.pathname.slice('/api/tools/'.length), result as WorkspaceWrite);
          await this.scheduleEvents();
        }
        return json(result);
      }
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      return inputError(error);
    }
  }
}

const apiHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const context = ctx as ExecutionContext & { props: Profile; auth: OAuthResourceAuth };
    if (!context.auth.scope.includes('workspace')) return insufficientScope(context.auth, ['workspace']);
    if (!context.props?.id) return json({ error: 'unauthorized' }, 401);
    if (!await needsSavedWorkspace(request)) return statelessMcp(request, env, context.props);
    return dispatch(request, env, context.props);
  },
};
const defaultHandler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ service: 'forward-deployed', status: 'ok', signIn: authConfigured(env) ? 'configured' : 'unconfigured' });
    if (url.pathname === '/.well-known/openai-apps-challenge' && request.method === 'GET' && env.OPENAI_APP_CHALLENGE) {
      return new Response(env.OPENAI_APP_CHALLENGE, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    const auth = await authRoutes(request, env); if (auth) return auth;
    if (url.pathname === '/api/engagements' && request.method === 'GET' && url.searchParams.get('storage') !== 'saved') return json({ engagements: [] });
    if ((url.pathname.startsWith('/api/tools/') || url.pathname === '/api/export') && request.method === 'POST') {
      try {
        const args = await readJson(request.clone());
        const tool = url.pathname.slice('/api/tools/'.length);
        if (args.storage !== 'saved' && tool !== 'save_engagement') {
          if (url.pathname === '/api/export') {
            const result = executeStudioTool(null, 'anonymous', 'get_engagement', { workspace: args.workspace, engagementId: args.workspace?.engagement?.id, storage: 'stateless' });
            return zipResponse(buildExport(result.workspace, { includeEvidence: args.includeEvidence !== false }));
          }
          return json(executeApiTool(request, env, null, 'anonymous', tool, args));
        }
      } catch (error) { return inputError(error); }
    }
    if (url.pathname.startsWith('/api/')) {
      const profile = await session(request, env);
      if (!profile) return json({ error: 'unauthorized', login: '/login' }, 401);
      if (request.method !== 'GET' && request.headers.get('Origin') !== env.APP_ORIGIN) return json({ error: 'invalid_origin' }, 403);
      return dispatch(request, env, profile);
    }
    if (url.pathname === '/' || url.pathname === '/studio.html') {
      const asset = await env.ASSETS.fetch(new Request(`${env.APP_ORIGIN}/studio.html`));
      return new Response(asset.body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
    }
    return new Response('Not found.', { status: 404 });
  },
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Anonymous requests only use the supplied snapshot. An invalid bearer token
    // remains an OAuth error, never an anonymous downgrade.
    if (new URL(request.url).pathname === '/mcp' && !request.headers.has('Authorization')) return statelessMcp(request, env);
    const origin = new URL(env.APP_ORIGIN).origin;
    const provider = new OAuthProvider<Env>({
      apiRoute: '/mcp', apiHandler, defaultHandler,
      authorizeEndpoint: `${origin}/authorize`, tokenEndpoint: `${origin}/oauth/token`,
      clientRegistrationEndpoint: `${origin}/oauth/register`,
      scopesSupported: ['workspace', 'offline_access'], requiredScopes: ['workspace'],
      resourceMetadata: { resource: `${origin}/mcp`, authorization_servers: [origin], resource_name: 'Forward Deployed' },
      clientIdMetadataDocumentEnabled: true,
      accessTokenTTL: 3600, refreshTokenTTL: 60 * 60 * 24 * 30,
    });
    return provider.fetch(request, env, ctx);
  },
};

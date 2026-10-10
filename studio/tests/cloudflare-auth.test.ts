import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const origin = 'https://forward-deployed.unsol.dev';
const challenge = (value: string) => createHash('sha256').update(value).digest('base64url');
type Reply = Awaited<ReturnType<Miniflare['dispatchFetch']>>;
function cookies(response: Reply): string { return response.headers.getSetCookie().filter(value => !value.includes('Max-Age=0')).map(value => value.split(';')[0]).join('; '); }
test('Cloudflare OAuth connects an account end to end and isolates private browser and MCP work', async t => {
  const bundle = await build({ entryPoints: [fileURLToPath(new URL('../cloudflare/worker.ts', import.meta.url).href)], bundle: true, format: 'esm', platform: 'browser', target: 'es2023', external: ['cloudflare:workers', 'node:*'], write: false });
  let githubId = 42;
  const signingKey = Buffer.alloc(32, 7);
  const observedSignatures: { expected: string; actual: string | null }[] = [];
  let finishEvent!: (event: Record<string, any>) => void;
  const deliveredEvent = new Promise<Record<string, any>>(resolve => { finishEvent = resolve; });
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-10-09', compatibilityFlags: ['nodejs_compat', 'global_fetch_strictly_public'],
    bindings: { APP_ORIGIN: origin, GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret', OPENAI_APP_CHALLENGE: 'test-domain-proof' },
    kvNamespaces: ['OAUTH_KV'], durableObjects: { WORKSPACES: { className: 'WorkspaceObject', useSQLite: true } },
    serviceBindings: { ASSETS: async () => new Response('<html>Studio</html>', { headers: { 'Content-Type': 'text/html' } }) },
    outboundService: async request => {
      const url = new URL(request.url);
      if (url.href === 'https://github.com/login/oauth/access_token') return Response.json({ access_token: 'fixture-upstream-token' });
      if (url.href === 'https://api.github.com/user') return Response.json({ id: githubId, login: `user-${githubId}`, name: `User ${githubId}` });
      if (url.href === 'https://callbacks.example.com/events') {
        const body = await request.text(); const event = JSON.parse(body);
        const id = request.headers.get('webhook-id'); const timestamp = request.headers.get('webhook-timestamp');
        const expected = `v1,${createHmac('sha256', signingKey).update(`${id}.${timestamp}.${body}`).digest('base64')}`;
        observedSignatures.push({ actual: request.headers.get('webhook-signature'), expected });
        if (event.type === 'verification') return Response.json({ challenge: event.challenge });
        finishEvent(event); return Response.json({ received: true });
      }
      throw new Error(`Unexpected outbound request: ${url.origin}${url.pathname}`);
    },
  }));
  t.after(() => mf.dispose());
  const fetch = (path: string, init?: Parameters<Miniflare['dispatchFetch']>[1]) => mf.dispatchFetch(new URL(path, origin).toString(), { ...init, redirect: 'manual' });
  assert.equal(await (await fetch('/.well-known/openai-apps-challenge')).text(), 'test-domain-proof');
  assert.equal((await fetch('/api/engagements?storage=saved')).status, 401);
  assert.equal((await fetch('/mcp', { method: 'POST', headers: { Authorization: 'Bearer invalid' } })).status, 401);
  const metadata = await (await fetch('/.well-known/oauth-authorization-server')).json() as any;
  assert.equal(metadata.registration_endpoint, `${origin}/oauth/register`);
  assert.ok(metadata.code_challenge_methods_supported.includes('S256'));
  const registration = await fetch('/oauth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Fixture client', redirect_uris: ['https://chatgpt.com/connector/oauth/test'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }) });
  assert.equal(registration.status, 201);
  const client = await registration.json() as any;
  const verifier = 'a'.repeat(64);
  const authPath = `/authorize?${new URLSearchParams({ client_id: client.client_id, redirect_uri: 'https://chatgpt.com/connector/oauth/test', response_type: 'code', scope: 'workspace offline_access', state: 'client-state', code_challenge: challenge(verifier), code_challenge_method: 'S256', resource: `${origin}/mcp` })}`;
  const consent = await fetch(authPath);
  assert.equal(consent.status, 200);
  const html = await consent.text();
  assert.ok(html.includes('chatgpt.com'));
  const handle = html.match(/name="handle" value="([^"]+)"/)![1];
  const form = new URLSearchParams({ handle, decision: 'approve' });
  const forged = await fetch('/authorize', { method: 'POST', body: form.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(forged.status, 400);
  const approved = await fetch('/authorize', { method: 'POST', body: form.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies(consent), Origin: origin } });
  assert.equal(approved.status, 302);
  const upstreamUrl = new URL(approved.headers.get('Location')!);
  assert.equal(upstreamUrl.hostname, 'github.com'); assert.ok(upstreamUrl.searchParams.get('code_challenge'));
  const callbackPath = `/auth/github/callback?code=github-code&state=${upstreamUrl.searchParams.get('state')}`;
  assert.equal((await fetch(callbackPath)).status, 400);
  const callback = await fetch(callbackPath, { headers: { Cookie: cookies(approved) } });
  assert.equal(callback.status, 302, await callback.clone().text());
  const browserCookie = cookies(callback);
  assert.ok(browserCookie.startsWith('__Host-fd-session='));
  const returned = new URL(callback.headers.get('Location')!); assert.equal(returned.searchParams.get('state'), 'client-state');
  const tokenResponse = await fetch('/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.client_id, code: returned.searchParams.get('code')!, redirect_uri: 'https://chatgpt.com/connector/oauth/test', code_verifier: verifier, resource: `${origin}/mcp` }).toString() });
  assert.equal(tokenResponse.status, 200);
  const token = await tokenResponse.json() as any; assert.ok(token.access_token);
  const mcp = (method: string, params: Record<string, unknown>, id = 1) => fetch('/mcp', { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': method, ...(typeof params.name === 'string' ? { 'Mcp-Name': params.name } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params: { ...params, ...(method === 'tools/call' ? { arguments: { ...(params.arguments as object), storage: 'saved' } } : {}), _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } }) });
  const discoveryResponse = await mcp('server/discover', {});
  assert.equal(discoveryResponse.status, 200);
  const discovery = await discoveryResponse.json() as any;
  assert.deepEqual(discovery.result.capabilities.events, {});
  const toolResponse = await mcp('tools/call', { name: 'create_engagement', arguments: { requestId: 'fixture-create', name: 'Repair concierge', customer: 'Workshop', ambition: 'Book a complete repair in one conversation.' } });
  assert.equal(toolResponse.status, 200, await toolResponse.clone().text());
  const created = await toolResponse.text(); assert.ok(created.includes('Repair concierge'), created);
  const browserList = await fetch('/api/engagements?storage=saved', { headers: { Cookie: browserCookie } });
  const list = await browserList.json() as any;
  assert.equal(list.engagements.length, 1);
  const engagementId = list.engagements[0].id;
  const exported = await fetch(`/api/export/${engagementId}`, { headers: { Cookie: browserCookie } });
  assert.equal(exported.status, 200); assert.equal(exported.headers.get('Content-Type'), 'application/zip');
  assert.equal(Buffer.from(await exported.arrayBuffer()).subarray(0, 2).toString(), 'PK');
  const subscription = await mcp('events/subscribe', { name: 'opportunity.shaped', arguments: { engagementId }, delivery: { mode: 'webhook', url: 'https://callbacks.example.com/events', secret: `whsec_${signingKey.toString('base64')}` } });
  assert.equal(subscription.status, 200, await subscription.clone().text());
  assert.ok(!(await subscription.clone().text()).includes('"error"'), await subscription.clone().text());
  assert.ok(observedSignatures.length > 0);
  assert.equal(observedSignatures[0].actual, observedSignatures[0].expected);
  const shaped = await mcp('tools/call', { name: 'shape_opportunity', arguments: { engagementId, requestId: 'shape-fixture', expectedRevision: 1, title: 'One-call repair', beneficiary: 'Maintenance planners', currentWorkflow: 'Call three desks.', proposedService: 'Arrange the repair in one conversation.', whyItMatters: 'Restore equipment sooner.' } });
  assert.equal(shaped.status, 200, await shaped.clone().text());
  assert.ok(!(await shaped.clone().text()).includes('"isError":true'), await shaped.clone().text());
  const event = await Promise.race([deliveredEvent, new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('Durable Object alarm did not deliver the event.')), 5000); timer.unref(); })]);
  assert.equal(event.name, 'opportunity.shaped'); assert.equal(event.data.engagementId, engagementId); assert.equal(event.data.revision, 2);
  const csrf = await fetch('/api/tools/create_engagement', { method: 'POST', headers: { Cookie: browserCookie, 'Content-Type': 'application/json', Origin: 'https://attacker.example' }, body: '{"storage":"saved"}' });
  assert.equal(csrf.status, 403);
  githubId = 99;
  const login = await fetch('/login'); const loginUrl = new URL(login.headers.get('Location')!);
  const second = await fetch(`/auth/github/callback?code=second&state=${loginUrl.searchParams.get('state')}`, { headers: { Cookie: cookies(login) } });
  assert.equal(second.status, 302);
  assert.deepEqual((await (await fetch('/api/engagements?storage=saved', { headers: { Cookie: cookies(second) } })).json() as any).engagements, []);
  assert.equal((await fetch(`/api/engagements/${engagementId}`, { headers: { Cookie: cookies(second) } })).status, 404);
  assert.equal((await fetch(`/api/export/${engagementId}`, { headers: { Cookie: cookies(second) } })).status, 404);
  assert.equal((await fetch(`/api/engagements/${engagementId}`, { headers: { 'x-forward-deployed-actor': 'github-42' } })).status, 401);
  const logout = await fetch('/logout', { method: 'POST', headers: { Cookie: browserCookie, Origin: origin } });
  assert.equal(logout.status, 303);
  assert.equal((await fetch('/api/engagements?storage=saved', { headers: { Cookie: browserCookie } })).status, 401);
});

test('anonymous work runs without database bindings and exports its caller-owned snapshot', async t => {
  const bundle = await build({ entryPoints: [fileURLToPath(new URL('../cloudflare/worker.ts', import.meta.url).href)], bundle: true, format: 'esm', platform: 'browser', target: 'es2023', external: ['cloudflare:workers', 'node:*'], write: false });
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-10-09', compatibilityFlags: ['nodejs_compat', 'global_fetch_strictly_public'],
    bindings: { APP_ORIGIN: origin },
    serviceBindings: { ASSETS: async () => new Response('<html>Studio</html>') },
    // Deliberately no KV or Durable Object bindings: any persistence attempt fails.
  }));
  t.after(() => mf.dispose());
  const fetch = (path: string, init?: Parameters<Miniflare['dispatchFetch']>[1]) => mf.dispatchFetch(`${origin}${path}`, { ...init, redirect: 'manual' });
  assert.equal((await fetch('/')).status, 200);
  assert.deepEqual(await (await fetch('/api/engagements')).json(), { engagements: [] });
  const post = (path: string, body: unknown) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const created = await post('/api/tools/create_engagement', { requestId: 'anonymous', name: 'New repair service', customer: 'Workshop', ambition: 'Arrange a complete repair.' });
  assert.equal(created.status, 200, await created.clone().text());
  const result = await created.json() as any; assert.equal(result.storage, 'stateless');
  const id = result.workspace.engagement.id;
  const exported = await post('/api/export', { workspace: result.workspace });
  assert.equal(exported.status, 200, await exported.clone().text());
  assert.equal(Buffer.from(await exported.arrayBuffer()).subarray(0, 2).toString(), 'PK');
  const forgotten = await post('/api/tools/get_engagement', { engagementId: id });
  assert.equal(forgotten.status, 404);
  const supplied = await post('/api/tools/get_engagement', { engagementId: id, workspace: result.workspace });
  assert.equal(supplied.status, 200);
  const anonymousMcp = await fetch('/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/call', 'Mcp-Name': 'get_engagement' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_engagement', arguments: { workspace: result.workspace, engagementId: id }, _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } }) });
  assert.equal(anonymousMcp.status, 200); assert.ok((await anonymousMcp.text()).includes('New repair service'));
  const save = await fetch('/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/call', 'Mcp-Name': 'save_engagement' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'save_engagement', arguments: { requestId: 'save-anonymous', workspace: result.workspace }, _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } }) });
  assert.equal(save.status, 200);
  const saveReply = await save.json() as any;
  assert.equal(saveReply.result.isError, true);
  const challenge = saveReply.result._meta['mcp/www_authenticate'][0] as string;
  const metadataUrl = new URL(challenge.match(/resource_metadata="([^"]+)"/)![1]);
  assert.equal(metadataUrl.origin, origin);
  const metadataResponse = await fetch(metadataUrl.pathname);
  assert.equal(metadataResponse.status, 200);
  const metadata = await metadataResponse.json() as any;
  assert.equal(metadata.resource, `${origin}/mcp`);
  assert.deepEqual(metadata.authorization_servers, [origin]);
});

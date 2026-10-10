import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Miniflare } from 'miniflare';
import { handleSitesRequest, type SitesEnv } from '../sites/handler.js';

const origin = 'https://studio.example';
const html = '<!doctype html><html><body>Studio test</body></html>';
function request(path: string, args?: Record<string, unknown>, actor?: string): Request {
  return new Request(origin + path, {
    method: args ? 'POST' : 'GET',
    headers: { Origin: origin, Accept: 'application/json, text/event-stream', ...(args ? { 'Content-Type': 'application/json' } : {}), ...(actor ? { 'oai-authenticated-user-id': actor, 'oai-authenticated-user-full-name': 'Test%20Operator', 'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8' } : {}) },
    ...(args ? { body: JSON.stringify(args) } : {}),
  });
}

test('Sites handler serves injected HTML and native identity without requiring saved storage', async () => {
  const anonymousPage = await handleSitesRequest(request('/'), {}, html);
  assert.equal(anonymousPage.status, 200);
  assert.equal(await anonymousPage.text(), html);
  assert.equal(await (await handleSitesRequest(request('/', undefined, 'alice'), {}, html)).text(), html);
  assert.equal((await handleSitesRequest(request('/api/engagements'), {}, html)).status, 200);
  assert.equal((await handleSitesRequest(request('/api/engagements?storage=saved'), {}, html)).status, 401);
  assert.equal((await handleSitesRequest(request('/api/profile'), {}, html)).status, 401);
  assert.deepEqual(await (await handleSitesRequest(request('/api/profile', undefined, 'alice'), {}, html)).json(), { id: 'alice', name: 'Test Operator' });
  const redirect = await handleSitesRequest(request('/login'), {}, html);
  assert.equal(redirect.headers.get('Location'), `${origin}/signin-with-chatgpt?return_to=%2F`);
  assert.equal(await (await handleSitesRequest(request('/.well-known/openai-apps-challenge'), { OPENAI_APP_CHALLENGE: 'test-challenge' }, html)).text(), 'test-challenge');
  const csrf = new Request(origin + '/api/tools/create_engagement', { method: 'POST', headers: { Origin: 'https://unrelated.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal((await handleSitesRequest(csrf, {}, html)).status, 403);
  const denied = await handleSitesRequest(request('/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_engagements', arguments: { storage: 'saved', telemetry: false } } }), {}, html);
  assert.equal(denied.status, 401);
});

test('Sites handler joins stateless creation, authenticated save, MCP reads, export and single telemetry writes', async t => {
  const runtime = new Miniflare({ workers: [{ config: {
    name: 'sites-handler-test', compatibilityDate: '2026-10-09',
    manifest: { mainModule: 'test.js', modules: { 'test.js': { type: 'esm', contents: 'export default { fetch() { return new Response("test"); } };' } } },
    env: { DB: { type: 'd1', id: 'sites-handler-test-db' } },
  } }] });
  t.after(() => runtime.dispose());
  const DB = await runtime.getD1Database('DB');
  const schema = readFileSync(new URL('../sites/schema.sql', import.meta.url), 'utf8');
  await DB.batch(schema.split(';').map(part => part.trim()).filter(Boolean).map(part => DB.prepare(part)));
  const env: SitesEnv = { DB };
  const call = async (name: string, args: Record<string, unknown>, actor?: string) => {
    const response = await handleSitesRequest(request(`/api/tools/${name}`, { telemetry: false, ...args }, actor), env, html);
    const data = await response.json() as Record<string, any>;
    assert.equal(response.status, 200, JSON.stringify(data));
    return data;
  };
  const initial = await call('create_engagement', { name: 'Visit ready', customer: 'Workshop', ambition: 'Confirm a useful visit.', requestId: 'create' });
  await call('create_engagement', { name: 'Signed-in draft', customer: 'Workshop', ambition: 'Keep this local.', requestId: 'signed-in-create' }, 'alice');
  assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM fd_workspaces').first<{ n: number }>())?.n, 0, 'Signing in does not save stateless work.');
  const saved = await call('save_engagement', { workspace: initial.workspace, requestId: 'save' }, 'alice');
  const id = saved.workspace.engagement.id;
  assert.notEqual(id, initial.workspace.engagement.id);
  assert.equal((await handleSitesRequest(request(`/api/engagements/${id}`, undefined, 'bob'), env, html)).status, 404);
  const read = await call('get_engagement', { engagementId: id, storage: 'saved' }, 'alice');
  assert.equal(read.workspace.engagement.id, id);
  const mcp = await handleSitesRequest(request('/mcp', { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_engagement', arguments: { engagementId: id, storage: 'saved', telemetry: false } } }, 'alice'), env, html);
  const raw = await mcp.text();
  assert.equal(mcp.status, 200, raw);
  const message = JSON.parse(mcp.headers.get('content-type')?.includes('text/event-stream') ? raw.split(/\r?\n/).find(line => line.startsWith('data:'))!.slice(5) : raw);
  assert.equal(message.result.structuredContent.workspace.engagement.id, id);
  const beforeExport = await DB.prepare('SELECT SUM(count) AS n FROM fd_telemetry_daily').first<{ n: number | null }>();
  const exported = await handleSitesRequest(request('/api/export', { workspace: initial.workspace, storage: 'stateless', telemetry: false }, 'alice'), env, html);
  assert.equal(exported.headers.get('content-type'), 'application/zip');
  assert.deepEqual([...new Uint8Array(await exported.arrayBuffer()).slice(0, 4)], [80, 75, 3, 4]);
  assert.deepEqual(await DB.prepare('SELECT SUM(count) AS n FROM fd_telemetry_daily').first(), beforeExport, 'POST export preserves the explicit opt-out.');
  await call('list_engagements', { storage: 'saved', telemetry: true }, 'alice');
  const count = await DB.prepare("SELECT count FROM fd_telemetry_daily WHERE tool='list_engagements' AND storage='saved' AND result='ok'").first<{ count: number }>();
  assert.equal(count?.count, 1, 'The shared executor records each completed call once.');
});

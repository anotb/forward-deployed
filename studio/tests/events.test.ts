import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { attachEvents, EventService, publicCallbackAddress, type CallbackRequest, type CallbackTransport } from '../server/events.js';
import { WorkspaceStore } from '../server/store.js';
import type { Workspace } from '../server/model.js';

const secret = `whsec_${Buffer.alloc(32, 17).toString('base64')}`;
const replacement = `whsec_${Buffer.alloc(32, 29).toString('base64')}`;
const params = (engagementId = 'eng_one', signingSecret = secret) => ({
  name: 'opportunity.shaped' as const, arguments: { engagementId },
  delivery: { mode: 'webhook' as const, url: 'https://callback.example/mcp-events/one', secret: signingSecret },
});
function fixture(id = 'eng_one'): Workspace {
  return {
    engagement: { id, name: 'Repair concierge', ambition: 'Offer repairs in one interaction', customer: 'Operators', revision: 1, createdAt: '2026-10-10T00:00:00Z', updatedAt: '2026-10-10T00:00:00Z' },
    evidence: [], opportunities: [{ id: 'opp_1', title: 'Repair concierge', beneficiary: 'Operators', currentWorkflow: 'Three phone calls', proposedService: 'One repair request', whyItMatters: 'Less waiting', evidenceRefs: [], measures: [], assumptions: [], version: 1 }],
    requirements: [], work: [], scenarios: [], runs: [],
  };
}
function setup() {
  const store = new WorkspaceStore();
  store.create('alice', 'create1', {}, () => ({ workspace: fixture(), result: {} }));
  store.create('alice', 'create2', { second: true }, () => ({ workspace: fixture('eng_two'), result: {} }));
  const requests: CallbackRequest[] = [];
  const transport: CallbackTransport = async (_url, request) => {
    requests.push(request);
    const body = JSON.parse(request.body);
    return { status: 200, body: JSON.stringify({ challenge: body.challenge }) };
  };
  return { store, requests, transport };
}
function assertSignature(request: CallbackRequest, key = secret) {
  const expected = createHmac('sha256', Buffer.from(key.slice(6), 'base64')).update(`${request.headers['webhook-id']}.${request.headers['webhook-timestamp']}.${request.body}`).digest('base64');
  assert.ok(request.headers['webhook-signature'].split(' ').includes(`v1,${expected}`));
}
function write(workspace = fixture()) { return { workspace, result: { opportunity: workspace.opportunities[0] } }; }

test('MCP2 discovery and event methods work through the SDK HTTP endpoint', async () => {
  const setupData = setup();
  const events = new EventService(setupData);
  const handler = createMcpHandler(() => {
    const mcp = new McpServer({ name: 'field-lab', version: '1' });
    attachEvents(mcp, events, 'alice');
    return mcp;
  }, { legacy: 'reject' });
  const rpc = async (method: string, args: Record<string, unknown> = {}) => {
    const response = await handler.fetch(new Request('https://studio.example/mcp', { method: 'POST', headers: {
      'content-type': 'application/json', accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2026-07-28', 'mcp-method': method,
    }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: { ...args, _meta: {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientCapabilities': {}, 'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1' },
    } } }) }));
    return await response.json() as { result?: Record<string, any>; error?: unknown };
  };
  try {
    assert.deepEqual((await rpc('server/discover')).result?.capabilities.events, {});
    assert.equal((await rpc('events/list')).result?.events.length, 4);
    const subscribed = await rpc('events/subscribe', params());
    assert.ok(subscribed.result?.id, JSON.stringify(subscribed));
    events.publishWorkspaceWrite('alice', 'shape_opportunity', write());
    assert.deepEqual(await events.flush(), { delivered: 1, failed: 0 });
    const event = JSON.parse(setupData.requests[1].body);
    assert.equal(event.name, 'opportunity.shaped');
    assert.equal(event.data.recordIds[0], 'opp_1');
    assertSignature(setupData.requests[0]);
    assertSignature(setupData.requests[1]);
    assert.equal(setupData.requests[1].headers['webhook-id'], event.eventId);
    assert.equal(setupData.requests[1].headers['X-MCP-Subscription-Id'], subscribed.result?.id);
    const { secret: _secret, ...delivery } = params().delivery;
    const unsubscribed = await rpc('events/unsubscribe', { ...params(), delivery });
    assert.equal(unsubscribed.error, undefined);
    const next = fixture(); next.engagement.revision++;
    assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write(next)), 0);
  } finally { events.close(); setupData.store.close(); }
});

test('subscription identities, account and engagement isolation, and exact verification', async () => {
  const setupData = setup();
  const events = new EventService(setupData);
  try {
    const one = await events.subscribe('alice', params());
    assert.deepEqual(await events.subscribe('alice', params()), one);
    assert.equal(setupData.requests.length, 1, 'verified callback is cached');
    await assert.rejects(events.subscribe('bob', params()), /Engagement not found/);
    assert.equal(setupData.requests.length, 1, 'authorization occurs before callback');
    assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write(fixture('eng_two'))), 0);
    assert.equal(events.publishWorkspaceWrite('alice', 'define_requirement', write()), 0);
    const { secret: _secret, ...delivery } = params().delivery;
    events.unsubscribe('bob', { ...params(), delivery });
    assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write()), 1);
    assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write()), 0, 'same write receipt is idempotent');
    await events.flush();
    await events.flush();
    assert.equal(setupData.requests.length, 2);
  } finally { events.close(); setupData.store.close(); }
  for (const response of [{ status: 200, body: '{"challenge":"wrong"}' }, { status: 302, body: '{}' }, { status: 200, body: 'not json' }]) {
    const env = setup();
    const invalid = new EventService({ store: env.store, transport: async () => response });
    try {
      await assert.rejects(invalid.subscribe('alice', params()), (error: any) => error.code === -32015 && error.data.reason === 'challenge_failed');
      assert.equal(invalid.publishWorkspaceWrite('alice', 'shape_opportunity', write()), 0);
    } finally { invalid.close(); env.store.close(); }
  }
});

test('persistent retry outbox preserves IDs, rotates signatures and stops on revoked access', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'fde-events-'));
  const env = setup();
  let now = Date.parse('2026-10-10T01:00:00Z');
  let fail = true, allowed = true;
  const transport: CallbackTransport = async (url, request) => {
    const normal = await env.transport(url, request);
    return JSON.parse(request.body).type === 'verification' || !fail ? normal : { status: 503, body: '' };
  };
  const options = { databasePath: join(directory, 'events.sqlite'), store: { get: (id: string, actor?: string) => { if (!allowed) throw Error('revoked'); return env.store.get(id, actor); } }, transport, now: () => now };
  let events = new EventService(options);
  try {
    const subscription = await events.subscribe('alice', params());
    events.publishWorkspaceWrite('alice', 'shape_opportunity', write());
    assert.deepEqual(await events.flush(), { delivered: 0, failed: 1 });
    const first = env.requests.at(-1)!;
    events.close();
    events = new EventService(options);
    now += 2000;
    fail = false;
    assert.deepEqual(await events.flush(), { delivered: 1, failed: 0 });
    const retry = env.requests.at(-1)!;
    assert.equal(retry.body, first.body);
    assert.equal(retry.headers['webhook-id'], first.headers['webhook-id']);
    assert.notEqual(retry.headers['webhook-timestamp'], first.headers['webhook-timestamp']);
    assertSignature(retry);
    assert.equal((await events.subscribe('alice', params('eng_one', replacement))).id, subscription.id);
    const next = fixture(); next.engagement.revision++;
    events.publishWorkspaceWrite('alice', 'shape_opportunity', write(next));
    await events.flush();
    assertSignature(env.requests.at(-1)!, secret);
    assertSignature(env.requests.at(-1)!, replacement);
    next.engagement.revision++;
    events.publishWorkspaceWrite('alice', 'shape_opportunity', write(next));
    const count = env.requests.length;
    allowed = false;
    await events.flush();
    assert.equal(env.requests.length, count);
  } finally { events.close(); env.store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('expiration and terminal callback failures stop delivery; transient failures are bounded', async () => {
  for (const status of [410, 413, 500]) {
    const env = setup();
    let now = Date.parse('2026-10-10T00:00:00Z');
    const events = new EventService({ ...env, now: () => now, transport: async (url, request) => {
      const normal = await env.transport(url, request);
      return JSON.parse(request.body).type === 'verification' ? normal : { status, body: '' };
    } });
    try {
      await events.subscribe('alice', params());
      events.publishWorkspaceWrite('alice', 'shape_opportunity', write());
      for (let i = 0; i < 8; i++) { await events.flush(); now += 60000; }
      assert.equal(env.requests.length, status === 500 ? 6 : 2);
    } finally { events.close(); env.store.close(); }
  }
  const env = setup();
  let now = Date.parse('2026-10-10T00:00:00Z');
  const events = new EventService({ ...env, now: () => now });
  try {
    const subscribed = await events.subscribe('alice', { ...params(), ttlMs: 1000 });
    assert.equal(Date.parse(subscribed.refreshBefore), now + 1000);
    events.publishWorkspaceWrite('alice', 'shape_opportunity', write());
    now += 1001;
    await events.flush();
    assert.equal(env.requests.length, 1);
  } finally { events.close(); env.store.close(); }
});

test('callback validation blocks local networks and malformed signing keys before transport', async () => {
  for (const address of ['127.0.0.1', '10.2.3.4', '169.254.169.254', '100.64.1.1', '192.168.2.1', '198.18.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2001:db8::1', '2002:7f00:1::1', '2001:20::1']) assert.equal(publicCallbackAddress(address), false, address);
  assert.equal(publicCallbackAddress('8.8.8.8'), true);
  assert.equal(publicCallbackAddress('2606:4700:4700::1111'), true);
  const env = setup();
  const events = new EventService(env);
  try {
    for (const url of ['http://example.com/callback', 'https://localhost/cb', 'https://127.0.0.1/cb', 'https://[::1]/cb', 'https://name:pass@example.com/cb', 'https://example.com:8443/cb', 'https://example.com/cb#fragment']) await assert.rejects(events.subscribe('alice', { ...params(), delivery: { ...params().delivery, url } }));
    for (const key of ['plain-secret', 'whsec_not-base64!', `whsec_${Buffer.alloc(8).toString('base64')}`, `whsec_${Buffer.alloc(65).toString('base64')}`]) await assert.rejects(events.subscribe('alice', params('eng_one', key)));
    assert.equal(env.requests.length, 0);
  } finally { events.close(); env.store.close(); }
});

test('Field Lab completion reports the selected run and does not claim delivery work passed tests', async () => {
  const env = setup();
  const events = new EventService(env);
  const workspace = fixture();
  const scenario = { id: 'scenario_1', opportunityId: 'opp_1', title: 'Repair request', goal: 'Arrange the repair', initialState: { reserved: true }, observableKeys: ['reserved'], actions: [], checks: [], assumptions: [], version: 1 };
  workspace.runs.push({ id: 'run_1', scenarioId: scenario.id, scenarioVersion: 1, scenario, initialState: {}, state: { reserved: true }, steps: [], status: 'finished', checks: [
    { id: 'outcome', label: 'Part reserved', kind: 'outcome', passed: true, actual: true, expected: true },
    { id: 'invariant', label: 'At most one reservation', kind: 'invariant', passed: false, actual: 2, expected: 1 },
  ], createdAt: workspace.engagement.createdAt, finishedAt: workspace.engagement.updatedAt });
  workspace.runs.push({ ...workspace.runs[0], id: 'run_2', checks: [] });
  workspace.work.push({ id: 'work_1', opportunityId: 'opp_1', requirementIds: [], title: 'Wire inventory', owner: 'Mina', status: 'done', outcome: 'Adapter shipped', evidence: 'PR 123', version: 1 });
  try {
    await events.subscribe('alice', { ...params(), name: 'rehearsal.finished' });
    events.publishWorkspaceWrite('alice', 'finish_rehearsal', { workspace, result: { runId: 'run_1' } });
    await events.flush();
    const run = JSON.parse(env.requests.at(-1)!.body).data;
    assert.deepEqual(run.recordIds, ['run_1']);
    assert.equal(run.passedChecks, 1);
    assert.equal(run.totalChecks, 2);
    await events.subscribe('alice', { ...params(), name: 'delivery.updated' });
    events.publishWorkspaceWrite('alice', 'plan_delivery', { workspace, result: { work: workspace.work[0] } });
    await events.flush();
    const work = JSON.parse(env.requests.at(-1)!.body).data;
    assert.deepEqual(work.recordIds, ['work_1']);
    assert.equal(work.passedChecks, undefined);
    assert.equal(work.totalChecks, undefined);
  } finally { events.close(); env.store.close(); }
});

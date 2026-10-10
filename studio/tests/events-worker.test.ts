import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { DurableWorkspaceStore, type SqlStorageAdapter } from '../cloudflare/store.js';
import { createWorkerEvents, workerCallbackTransport, type WorkerEventStorage } from '../server/events-worker.js';
import type { CallbackRequest } from '../server/events-core.js';
import type { Workspace } from '../server/model.js';

test('Worker SQL adapter persists scoped subscriptions and exposes durable alarm retry deadlines', async t => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const storage: WorkerEventStorage & SqlStorageAdapter = {
    sql: { exec: <T extends Record<string, string | number | null | ArrayBuffer>>(query: string, ...bindings: (string | number | null)[]) => {
      const before = Number(db.prepare('SELECT total_changes() AS n').get()!.n);
      const rows = db.prepare(query).all(...bindings) as T[];
      return { toArray: () => rows, rowsWritten: Number(db.prepare('SELECT total_changes() AS n').get()!.n) - before };
    } },
    transactionSync<T>(fn: () => T): T {
      db.exec('BEGIN IMMEDIATE');
      try { const value = fn(); db.exec('COMMIT'); return value; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  const store = new DurableWorkspaceStore(storage);
  const workspace: Workspace = { engagement: { id: 'eng_worker', name: 'Repair concierge', ambition: 'Arrange repairs', customer: 'Operators', revision: 1, createdAt: '2026-10-10T00:00:00Z', updatedAt: '2026-10-10T00:00:00Z' }, evidence: [], opportunities: [], requirements: [], work: [], scenarios: [], runs: [] };
  store.create('alice', 'create', {}, () => ({ workspace, result: {} }));
  let now = Date.parse('2026-10-10T01:00:00Z');
  let fail = true;
  const requests: CallbackRequest[] = [];
  const options = { now: () => now, transport: async (_url: URL, request: CallbackRequest) => {
    requests.push(request);
    const body = JSON.parse(request.body);
    return body.type === 'verification' ? { status: 200, body: JSON.stringify({ challenge: body.challenge }) } : { status: fail ? 503 : 202, body: '' };
  } };
  let events = createWorkerEvents(storage, store, options);
  const subscription = { name: 'opportunity.shaped' as const, arguments: { engagementId: workspace.engagement.id }, delivery: { mode: 'webhook' as const, url: 'https://callback.example/mcp-events/worker', secret: `whsec_${Buffer.alloc(32, 13).toString('base64')}` } };
  await events.subscribe('alice', subscription);
  assert.equal(events.nextDeliveryAt(), null);
  const write = store.mutate('alice', workspace.engagement.id, 'service', 1, {}, value => {
    const opportunity = { id: 'opp_worker', title: 'Repair concierge', beneficiary: 'Operators', currentWorkflow: 'Phone calls', proposedService: 'Arrange a repair in one conversation', whyItMatters: 'Less waiting', evidenceRefs: [], measures: [], assumptions: [], version: 1 };
    value.opportunities.push(opportunity);
    return { workspace: value, result: { opportunity } };
  });
  assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write), 1);
  assert.equal(events.publishWorkspaceWrite('alice', 'shape_opportunity', write), 0);
  assert.equal(events.nextDeliveryAt(), now, 'DO can schedule an immediate alarm after the write');
  assert.deepEqual(await events.flush(), { delivered: 0, failed: 1 });
  assert.equal(events.nextDeliveryAt(), now + 1000, 'DO can schedule a retry without an in-memory timer');
  const eventId = requests.at(-1)!.headers['webhook-id'];
  events = createWorkerEvents(storage, store, options);
  assert.equal(events.nextDeliveryAt(), now + 1000, 'retry deadline survives object reconstruction');
  now += 1000;
  fail = false;
  assert.deepEqual(await events.flush(), { delivered: 1, failed: 0 });
  assert.equal(requests.at(-1)!.headers['webhook-id'], eventId);
  assert.equal(JSON.parse(requests.at(-1)!.body).data.recordIds[0], 'opp_worker');
  assert.equal(events.nextDeliveryAt(), null, 'no timer or alarm is needed after delivery');
  await assert.rejects(events.subscribe('bob', subscription), /Engagement not found/);
});

test('Worker callback transport forbids redirects, forwards deadline and caps response bytes', async t => {
  const signal = AbortSignal.timeout(10000);
  const calls: unknown[] = [];
  let oversized = false;
  let redirect = false;
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (redirect) return new Response(null, { status: 302, headers: { Location: 'https://other.example/callback' } });
    return new Response(oversized ? 'x'.repeat(8193) : '{"challenge":"echo"}', { status: 200 });
  });
  const message = { body: '{"type":"verification"}', headers: { 'webhook-id': 'test' }, signal };
  const response = await workerCallbackTransport(new URL('https://callback.example/receive'), message);
  assert.equal(response.body, '{"challenge":"echo"}');
  assert.deepEqual(calls[0], { url: 'https://callback.example/receive', init: { method: 'POST', body: message.body, headers: message.headers, signal, redirect: 'manual' } });
  oversized = true;
  await assert.rejects(workerCallbackTransport(new URL('https://callback.example/receive'), message), (error: any) => error.data.reason === 'response_too_large');
  redirect = true;
  await assert.rejects(workerCallbackTransport(new URL('https://callback.example/receive'), message), (error: any) => error.data.reason === 'redirect_blocked');
  await assert.rejects(workerCallbackTransport(new URL('https://127.0.0.1/receive'), message), (error: any) => error.data.reason === 'blocked_address');
  assert.equal(calls.length, 3, 'redirect is not followed and literal private IP is blocked before fetch');
});

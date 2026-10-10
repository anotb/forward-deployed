import assert from 'node:assert/strict';
import test from 'node:test';
import { Miniflare } from 'miniflare';
import { recordTelemetry, type TelemetryEvent } from '../sites/telemetry.js';
import type { SitesDatabase } from '../sites/store.js';

const schema = `CREATE TABLE fd_telemetry_daily (
  day TEXT NOT NULL, tool TEXT NOT NULL, storage TEXT NOT NULL, result TEXT NOT NULL,
  count INTEGER NOT NULL, latency_ms_total INTEGER NOT NULL,
  PRIMARY KEY (day,tool,storage,result)
)`;
const event: TelemetryEvent = { tool: 'create_engagement', storage: 'stateless', result: 'ok', latencyMs: 12.4 };
const request = () => new Request('https://example.com/private-project?token=secret', {
  headers: { Cookie: 'private-cookie', Authorization: 'Bearer secret', 'oai-authenticated-user-id': 'private-user' },
});
const today = () => new Date('2026-10-10T15:00:00Z');

async function setup(t: test.TestContext) {
  const runtime = new Miniflare({ workers: [{ config: {
    name: 'sites-telemetry-test', compatibilityDate: '2026-10-09',
    manifest: { mainModule: 'test.js', modules: { 'test.js': { type: 'esm', contents: 'export default { fetch() { return new Response("test"); } };' } } },
    env: { DB: { type: 'd1', id: 'sites-telemetry-test-db' } },
  } }] });
  t.after(() => runtime.dispose());
  const DB = await runtime.getD1Database('DB');
  await DB.prepare(schema).run();
  return DB;
}

test('Sites telemetry atomically aggregates concurrent operations into UTC daily buckets', async t => {
  const DB = await setup(t);
  await Promise.all(Array.from({ length: 12 }, () => recordTelemetry({ DB }, request(), event, { now: today })));
  await recordTelemetry({ DB }, request(), { ...event, latencyMs: 4.7 }, { now: () => new Date('2026-10-10T23:30:00-04:00') });
  await recordTelemetry({ DB }, request(), { ...event, storage: 'saved', result: 'auth_required', latencyMs: 1 }, { now: today });
  const rows = (await DB.prepare('SELECT * FROM fd_telemetry_daily ORDER BY day,storage').all()).results;
  assert.deepEqual(rows, [
    { day: '2026-10-10', tool: 'create_engagement', storage: 'saved', result: 'auth_required', count: 1, latency_ms_total: 1 },
    { day: '2026-10-10', tool: 'create_engagement', storage: 'stateless', result: 'ok', count: 12, latency_ms_total: 144 },
    { day: '2026-10-11', tool: 'create_engagement', storage: 'stateless', result: 'ok', count: 1, latency_ms_total: 5 },
  ]);
  assert.equal(JSON.stringify(rows).includes('private'), false);
  assert.equal(JSON.stringify(rows).includes('secret'), false);
});

test('Sites telemetry accepts only fixed dimensions and bounded numeric latency', async t => {
  const DB = await setup(t);
  for (const latencyMs of [Infinity, NaN, -2, 60_500]) await recordTelemetry({ DB }, request(), {
    tool: 'secret meeting excerpt', storage: 'customer name', result: 'private error detail', latencyMs,
  }, { now: today });
  const rows = (await DB.prepare('SELECT * FROM fd_telemetry_daily').all()).results;
  assert.deepEqual(rows, [{ day: '2026-10-10', tool: 'unknown', storage: 'stateless', result: 'error', count: 4, latency_ms_total: 60_000 }]);
  assert.equal(JSON.stringify(rows).includes('customer'), false);
  const columns = (await DB.prepare('PRAGMA table_info(fd_telemetry_daily)').all<{ name: string }>()).results.map(column => column.name);
  assert.deepEqual(columns, ['day', 'tool', 'storage', 'result', 'count', 'latency_ms_total']);
});

test('Sites telemetry honors environment, privacy headers and tool argument opt-outs without touching D1', async () => {
  let touched = false;
  const DB: SitesDatabase = { prepare() { touched = true; throw Error('unexpected database access'); }, async batch() { touched = true; return []; } };
  const env = { DB };
  const optOuts: Record<string, string>[] = [{ DNT: '1' }, { 'Sec-GPC': '1' }, { 'x-fd-telemetry': 'OFF' }];
  for (const headers of optOuts) {
    await recordTelemetry(env, new Request('https://example.com', { headers }), event);
  }
  await recordTelemetry({ ...env, FD_TELEMETRY: 'Off' }, request(), event);
  await recordTelemetry(env, request(), event, { telemetry: false });
  await recordTelemetry({}, request(), event);
  assert.equal(touched, false);
});

test('Sites telemetry failure stays outside the user operation', async () => {
  const unavailable: SitesDatabase = { prepare() { throw Error('private database error'); }, async batch() { return []; } };
  await assert.doesNotReject(recordTelemetry({ DB: unavailable }, request(), event));
  const statement = { bind() { return statement; }, async first() { return null; }, async all() { return { results: [] }; } };
  const failingWrite: SitesDatabase = { prepare() { return statement; }, async batch() { throw Error('private write failure'); } };
  await assert.doesNotReject(recordTelemetry({ DB: failingWrite }, request(), event));
});

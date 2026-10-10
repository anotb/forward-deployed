import assert from 'node:assert/strict';
import test from 'node:test';
import { recordTelemetry, type TelemetryEvent } from '../cloudflare/telemetry.js';

test('telemetry accepts fixed dimensions only and honors all opt-outs', () => {
  const points: unknown[] = [];
  const env = { TELEMETRY: { writeDataPoint: (point: unknown) => { points.push(point); } } };
  const event: TelemetryEvent = { tool: 'create_engagement', storage: 'stateless', result: 'ok', latencyMs: 12.4 };
  recordTelemetry(env, new Request('https://example.com/private-project?token=secret', { headers: { Cookie: 'private', Authorization: 'Bearer secret' } }), event);
  assert.deepEqual(points, [{ blobs: ['create_engagement', 'stateless', 'ok'], doubles: [1, 12] }]);
  const optOuts: Record<string, string>[] = [{ DNT: '1' }, { 'Sec-GPC': '1' }, { 'x-fd-telemetry': 'off' }];
  for (const headers of optOuts) recordTelemetry(env, new Request('https://example.com', { headers }), event);
  recordTelemetry({ ...env, FD_TELEMETRY: 'off' }, new Request('https://example.com'), event);
  assert.equal(points.length, 1);
  recordTelemetry(env, new Request('https://example.com'), { tool: 'secret meeting excerpt', storage: 'customer name', result: 'private error detail', latencyMs: Infinity });
  assert.deepEqual(points[1], { blobs: ['unknown', 'stateless', 'error'], doubles: [1, 0] });
  assert.doesNotThrow(() => recordTelemetry({ TELEMETRY: { writeDataPoint() { throw new Error('Unavailable'); } } }, new Request('https://example.com'), event));
});

export interface TelemetryEvent { tool: string; storage: string; result: string; latencyMs: number }
export interface TelemetryEnv {
  FD_TELEMETRY?: string;
  TELEMETRY?: { writeDataPoint(point: { blobs: string[]; doubles: number[] }): void };
}
const names = new Set([
  'create_engagement', 'save_engagement', 'add_evidence', 'shape_opportunity', 'define_requirement', 'plan_delivery',
  'list_engagements', 'get_engagement', 'open_studio', 'search', 'fetch', 'get_profile', 'export_engagement', 'prepare_git_export',
  'define_rehearsal', 'start_rehearsal', 'observe_rehearsal', 'act_in_rehearsal', 'fork_rehearsal', 'finish_rehearsal',
]);

/** Aggregate operation counters only. Never pass identities, request bodies, URLs or headers to the sink. */
export function recordTelemetry(env: TelemetryEnv, request: Pick<Request, 'headers'>, event: TelemetryEvent): void {
  if (!env.TELEMETRY || env.FD_TELEMETRY?.toLowerCase() === 'off'
    || request.headers.get('x-fd-telemetry')?.toLowerCase() === 'off'
    || request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return;
  try {
    env.TELEMETRY.writeDataPoint({
      blobs: [names.has(event.tool) ? event.tool : 'unknown', event.storage === 'saved' ? 'saved' : 'stateless', event.result === 'ok' ? 'ok' : event.result === 'auth_required' ? 'auth_required' : 'error'],
      doubles: [1, Number.isFinite(event.latencyMs) ? Math.min(60_000, Math.max(0, Math.round(event.latencyMs))) : 0],
    });
  } catch { /* Measurement must never block the work. */ }
}

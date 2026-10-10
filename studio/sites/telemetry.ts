import type { SitesDatabase } from './store.js';

export interface TelemetryEvent { tool: string; storage: string; result: string; latencyMs: number }
export interface TelemetryEnv { DB?: SitesDatabase; FD_TELEMETRY?: string }
export interface TelemetryOptions { telemetry?: boolean; now?: () => Date }

const names = new Set([
  'create_engagement', 'save_engagement', 'add_evidence', 'shape_opportunity', 'define_requirement', 'plan_delivery',
  'list_engagements', 'get_engagement', 'open_studio', 'search', 'fetch', 'get_profile', 'export_engagement', 'prepare_git_export',
  'define_rehearsal', 'start_rehearsal', 'observe_rehearsal', 'act_in_rehearsal', 'fork_rehearsal', 'finish_rehearsal',
]);

/** Daily aggregate counters only. Never persist identities, content, URLs, errors, or individual events. */
export async function recordTelemetry(
  env: TelemetryEnv,
  request: Pick<Request, 'headers'>,
  event: TelemetryEvent,
  options: TelemetryOptions = {},
): Promise<void> {
  if (!env.DB || options.telemetry === false || env.FD_TELEMETRY?.trim().toLowerCase() === 'off'
    || request.headers.get('x-fd-telemetry')?.trim().toLowerCase() === 'off'
    || request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return;
  try {
    const day = (options.now?.() ?? new Date()).toISOString().slice(0, 10);
    const tool = names.has(event.tool) ? event.tool : 'unknown';
    const storage = event.storage === 'saved' ? 'saved' : 'stateless';
    const result = event.result === 'ok' ? 'ok' : event.result === 'auth_required' ? 'auth_required' : 'error';
    const latency = Number.isFinite(event.latencyMs) ? Math.min(60_000, Math.max(0, Math.round(event.latencyMs))) : 0;
    await env.DB.batch([env.DB.prepare(`
      INSERT INTO fd_telemetry_daily (day,tool,storage,result,count,latency_ms_total)
      VALUES (?,?,?,?,1,?)
      ON CONFLICT(day,tool,storage,result) DO UPDATE SET
        count = count + 1,
        latency_ms_total = latency_ms_total + excluded.latency_ms_total
    `).bind(day, tool, storage, result, latency)]);
  } catch { /* Failed measurement must not fail a user's operation or expose its data in logs. */ }
}

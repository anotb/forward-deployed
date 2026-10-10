import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { McpServer, ProtocolError, type ServerCapabilities } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { WorkspaceRepository, WorkspaceWrite } from './store-contract.js';

const names = ['opportunity.shaped', 'requirements.defined', 'delivery.updated', 'rehearsal.finished'] as const;
type EventName = typeof names[number];
const filters = z.object({ engagementId: z.string().min(1).max(200) }).strict();
const destination = z.object({ mode: z.literal('webhook'), url: z.string().max(2048) }).strict();
const subscriptionSchema = z.object({
  name: z.enum(names), arguments: filters,
  delivery: destination.extend({ secret: z.string().max(100) }),
  ttlMs: z.number().int().positive().nullable().optional(), cursor: z.null().optional(),
});
const unsubscribeSchema = subscriptionSchema.omit({ ttlMs: true, cursor: true }).extend({ delivery: destination });
type SubscriptionInput = z.infer<typeof subscriptionSchema>;
interface Subscription {
  id: string; actor: string; engagementId: string; name: EventName; url: string;
  secret: string; oldSecret?: string; rotateUntil?: number; expiresAt: number;
}
export interface CallbackRequest { body: string; headers: Record<string, string>; signal: AbortSignal }
export interface CallbackResponse { status: number; body: string }
/** Inject only a trusted transport; production defaults pin public DNS addresses to TLS connections. */
export type CallbackTransport = (url: URL, request: CallbackRequest) => Promise<CallbackResponse>;
export interface EventServiceOptions {
  sql: EventSql;
  store: Pick<WorkspaceRepository, 'get'>;
  transport: CallbackTransport;
  now?: () => number;
}

export const callbackError = (reason: string) => new ProtocolError(-32015, 'Callback endpoint verification failed.', { reason });
const blockedV4: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];
const ipv4Number = (address: string) => address.split('.').reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);

/** Conservative public IP check shared by Node's DNS pinning and Workers' URL validation. */
export function publicCallbackAddress(address: string): boolean {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(address)) {
    if (address.split('.').some(part => Number(part) > 255)) return false;
    const value = ipv4Number(address);
    return !blockedV4.some(([network, prefix]) => value >>> (32 - prefix) === ipv4Number(network) >>> (32 - prefix));
  }
  let normalized: string;
  try { normalized = new URL(`https://[${address}]/`).hostname.slice(1, -1); } catch { return false; }
  const [first, second] = normalized.split(':').map(part => Number.parseInt(part || '0', 16));
  // Global unicast only; reject transition, special-purpose and documentation allocations.
  return first >= 0x2000 && first < 0x4000 && first !== 0x2002 && first !== 0x3fff
    && !(first === 0x2001 && (second < 0x200 || second === 0xdb8));
}

export function callbackUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw callbackError('invalid_url'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) throw callbackError('invalid_url');
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  const literalIp = host.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || (literalIp && !publicCallbackAddress(host))) throw callbackError('blocked_address');
  return url;
}

export interface EventSql {
  exec(query: string): void;
  prepare(query: string): {
    run(...bindings: (string | number | null)[]): { changes: number | bigint };
    get(...bindings: (string | number | null)[]): Record<string, unknown> | undefined;
    all(...bindings: (string | number | null)[]): Record<string, unknown>[];
  };
}

function secretKey(secret: string): Buffer {
  const encoded = secret.startsWith('whsec_') ? secret.slice(6) : '';
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new ProtocolError(-32602, 'A whsec_ signing secret is required.');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 24 || bytes.length > 64 || bytes.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) throw new ProtocolError(-32602, 'Signing keys must decode to 24–64 bytes.');
  return bytes;
}

function signature(secret: string, id: string, timestamp: string, body: string): string {
  return `v1,${createHmac('sha256', secretKey(secret)).update(`${id}.${timestamp}.${body}`).digest('base64')}`;
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const defaultTtl = 24 * 60 * 60 * 1000;

/** Persistent subscriptions and a bounded retry outbox. Callback secrets are private database credentials. */
export class EventService {
  private readonly db: EventSql;
  private readonly store: EventServiceOptions['store'];
  private readonly transport: CallbackTransport;
  private readonly now: () => number;
  private draining = false;
  private readonly verified = new Map<string, number>();

  constructor(options: EventServiceOptions) {
    this.db = options.sql;
    this.store = options.store;
    this.transport = options.transport;
    this.now = options.now ?? Date.now;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS event_subscriptions (id TEXT PRIMARY KEY, actor TEXT NOT NULL, engagement_id TEXT NOT NULL, document TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS event_outbox (subscription_id TEXT NOT NULL, event_id TEXT NOT NULL, body TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', PRIMARY KEY(subscription_id,event_id));
      CREATE INDEX IF NOT EXISTS event_outbox_pending ON event_outbox(status,next_at);
    `);
  }

  list() {
    const descriptions: Record<EventName, string> = {
      'opportunity.shaped': 'A proposed service and its intended customer outcome are ready to explore in this engagement.',
      'requirements.defined': 'Source-backed behavior and acceptance criteria are ready to build or rehearse in this engagement.',
      'delivery.updated': 'Implementation work has an updated owner, outcome or delivery status in this engagement.',
      'rehearsal.finished': 'A Field Lab run has finished, with separate outcome and invariant results to inspect.',
    };
    return { events: names.map(name => ({ name, description: descriptions[name], delivery: ['webhook'],
      inputSchema: z.toJSONSchema(filters),
      payloadSchema: { type: 'object', properties: {
        engagementId: { type: 'string' }, revision: { type: 'integer' }, recordIds: { type: 'array', items: { type: 'string' } },
        outcome: { type: 'string' }, passedChecks: { type: 'integer' }, totalChecks: { type: 'integer' },
      }, required: ['engagementId', 'revision', 'recordIds', 'outcome'], additionalProperties: false },
    })) };
  }

  async subscribe(actor: string, input: SubscriptionInput) {
    const args = subscriptionSchema.parse(input);
    this.authorize(actor, args.arguments.engagementId);
    secretKey(args.delivery.secret);
    const url = callbackUrl(args.delivery.url).href;
    const id = this.identity(actor, args.name, args.arguments.engagementId, url);
    // A changed key must be proven even if the URL was recently verified.
    const cacheKey = hash([actor, url, args.delivery.secret]);
    if ((this.verified.get(cacheKey) ?? 0) <= this.now()) {
      const challenge = randomBytes(32).toString('base64url');
      const temporary: Subscription = { id, actor, engagementId: args.arguments.engagementId, name: args.name, url, secret: args.delivery.secret, expiresAt: this.now() + defaultTtl };
      const response = await this.send(temporary, `verify_${randomBytes(16).toString('hex')}`, JSON.stringify({ type: 'verification', challenge }));
      let echo: unknown;
      try { echo = JSON.parse(response.body).challenge; } catch { throw callbackError('challenge_failed'); }
      const expected = Buffer.from(challenge);
      const received = typeof echo === 'string' ? Buffer.from(echo) : Buffer.alloc(0);
      if (response.status < 200 || response.status >= 300 || received.length !== expected.length || !timingSafeEqual(received, expected)) throw callbackError('challenge_failed');
      if (this.verified.size >= 1000) this.verified.clear();
      this.verified.set(cacheKey, this.now() + 5 * 60 * 1000);
    }
    // Authorization can change while verification is in flight.
    this.authorize(actor, args.arguments.engagementId);
    const previous = this.subscription(id);
    const expiresAt = this.now() + Math.min(args.ttlMs ?? defaultTtl, defaultTtl);
    const subscription: Subscription = { id, actor, engagementId: args.arguments.engagementId, name: args.name, url, secret: args.delivery.secret, expiresAt };
    if (previous && previous.secret !== subscription.secret) {
      subscription.oldSecret = previous.secret;
      subscription.rotateUntil = this.now() + 5 * 60 * 1000;
    } else if (previous?.rotateUntil && previous.rotateUntil > this.now()) {
      subscription.oldSecret = previous.oldSecret;
      subscription.rotateUntil = previous.rotateUntil;
    }
    this.db.prepare('INSERT INTO event_subscriptions VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document').run(id, actor, subscription.engagementId, JSON.stringify(subscription));
    return { id, refreshBefore: new Date(expiresAt).toISOString(), cursor: null, truncated: false };
  }

  unsubscribe(actor: string, input: z.infer<typeof unsubscribeSchema>) {
    const args = unsubscribeSchema.parse(input);
    const id = this.identity(actor, args.name, args.arguments.engagementId, callbackUrl(args.delivery.url).href);
    // Identity includes the principal: another account cannot cancel this subscription.
    this.remove(id);
    return {};
  }

  /** Call after a committed workspace write, including retry receipts; IDs deduplicate retries. */
  publishWorkspaceWrite(actor: string, toolName: string, write: WorkspaceWrite): number {
    const mapping: Record<string, EventName> = { shape_opportunity: 'opportunity.shaped', define_requirement: 'requirements.defined', plan_delivery: 'delivery.updated', finish_rehearsal: 'rehearsal.finished' };
    const name = mapping[toolName];
    if (!name) return 0;
    const workspace = write.workspace;
    const { id: engagementId, revision, updatedAt } = workspace.engagement;
    this.authorize(actor, engagementId);
    const result = write.result as Record<string, unknown> | null;
    const records = name === 'opportunity.shaped' ? workspace.opportunities : name === 'requirements.defined' ? workspace.requirements : name === 'delivery.updated' ? workspace.work : workspace.runs;
    const nested = (result?.opportunity ?? result?.requirement ?? result?.work) as { id?: string } | undefined;
    const record = records.find(item => item.id === nested?.id || item.id === result?.id || item.id === result?.runId);
    const run = name === 'rehearsal.finished' ? workspace.runs.find(item => item.id === record?.id) : undefined;
    const data = {
      engagementId, revision, recordIds: record ? [record.id] : [],
      outcome: name === 'opportunity.shaped' ? 'Service opportunity shaped.' : name === 'requirements.defined' ? 'Behavior and acceptance criteria defined.' : name === 'delivery.updated' ? 'Delivery work updated.' : 'Rehearsal finished; inspect the run for outcome and invariant results.',
      ...(run ? { passedChecks: run.checks.filter(check => check.passed).length, totalChecks: run.checks.length } : {}),
    };
    const eventId = `evt_${hash([actor, engagementId, revision, name])}`;
    const body = JSON.stringify({ eventId, name, timestamp: updatedAt, data, cursor: null });
    let queued = 0;
    for (const row of this.db.prepare('SELECT document FROM event_subscriptions WHERE actor=? AND engagement_id=?').all(actor, engagementId)) {
      const subscription = JSON.parse(row.document as string) as Subscription;
      if (subscription.name !== name || subscription.expiresAt <= this.now()) continue;
      queued += Number(this.db.prepare('INSERT OR IGNORE INTO event_outbox(subscription_id,event_id,body,next_at) VALUES (?,?,?,?)').run(subscription.id, eventId, body, this.now()).changes);
    }
    return queued;
  }

  /** At most 50 callbacks per drain; failures stay in the durable outbox for the next drain. */
  async flush(): Promise<{ delivered: number; failed: number }> {
    if (this.draining) return { delivered: 0, failed: 0 };
    this.draining = true;
    let delivered = 0, failed = 0;
    try {
      const rows = this.db.prepare("SELECT * FROM event_outbox WHERE status='pending' AND next_at<=? LIMIT 50").all(this.now());
      for (const row of rows) {
        const subscription = this.subscription(row.subscription_id as string);
        if (!subscription || subscription.expiresAt <= this.now() || !this.hasAccess(subscription.actor, subscription.engagementId)) {
          this.remove(row.subscription_id as string);
          continue;
        }
        let status = 0;
        try { status = (await this.send(subscription, row.event_id as string, row.body as string)).status; } catch { /* Persist only retry state, never a URL or secret-bearing error. */ }
        const attempts = Number(row.attempts) + 1;
        const accepted = status >= 200 && status < 300;
        const transient = status === 0 || status === 408 || status === 429 || status >= 500;
        const state = accepted ? 'delivered' : transient && attempts < 5 ? 'pending' : 'failed';
        this.db.prepare('UPDATE event_outbox SET status=?,attempts=?,next_at=? WHERE subscription_id=? AND event_id=?').run(state, attempts, this.now() + Math.min(60_000, 1000 * 2 ** (attempts - 1)), subscription.id, row.event_id as string);
        if (accepted) delivered++; else failed++;
        if (status === 410) this.remove(subscription.id);
      }
      return { delivered, failed };
    } finally { this.draining = false; }
  }

  /** Earliest queued retry, or null when a Durable Object can sleep without an alarm. */
  nextDeliveryAt(): number | null {
    const row = this.db.prepare("SELECT MIN(next_at) AS next_at FROM event_outbox WHERE status='pending'").get();
    return typeof row?.next_at === 'number' ? row.next_at : null;
  }

  private identity(actor: string, name: string, engagementId: string, url: string) { return `sub_${hash([actor, url, name, { engagementId }])}`; }
  private subscription(id: string): Subscription | undefined {
    const row = this.db.prepare('SELECT document FROM event_subscriptions WHERE id=?').get(id);
    return row ? JSON.parse(row.document as string) as Subscription : undefined;
  }
  private remove(id: string) {
    this.db.prepare('DELETE FROM event_subscriptions WHERE id=?').run(id);
    this.db.prepare('DELETE FROM event_outbox WHERE subscription_id=?').run(id);
  }
  private hasAccess(actor: string, engagementId: string) { try { this.store.get(engagementId, actor); return true; } catch { return false; } }
  private authorize(actor: string, engagementId: string) { if (!this.hasAccess(actor, engagementId)) throw new ProtocolError(-32602, 'Engagement not found.'); }
  private async send(subscription: Subscription, id: string, body: string) {
    if (Buffer.byteLength(body) > 262144) throw callbackError('payload_too_large');
    const timestamp = String(Math.floor(this.now() / 1000));
    let signed = signature(subscription.secret, id, timestamp, body);
    if (subscription.oldSecret && (subscription.rotateUntil ?? 0) > this.now()) signed += ` ${signature(subscription.oldSecret, id, timestamp, body)}`;
    const signal = AbortSignal.timeout(10_000);
    try {
      const delivery = this.transport(callbackUrl(subscription.url), { body, signal, headers: {
        'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': timestamp,
        'webhook-signature': signed, 'X-MCP-Subscription-Id': subscription.id,
      } });
      return await Promise.race([delivery, new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(callbackError('timeout')), { once: true }))]);
    } catch (error) { throw error instanceof ProtocolError ? error : callbackError(signal.aborted ? 'timeout' : 'network_error'); }
  }
}

/** Draft MCP Events methods use the SDK's supported extension-handler API. */
export function attachEvents(mcp: McpServer, events: EventService, actor: string): void {
  const capabilities = { ...mcp.server.getCapabilities(), events: {} };
  mcp.server.registerCapabilities(capabilities as ServerCapabilities);
  mcp.server.setRequestHandler('events/list', { params: z.object({ cursor: z.null().optional() }) }, () => events.list());
  mcp.server.setRequestHandler('events/subscribe', { params: subscriptionSchema }, args => events.subscribe(actor, args));
  mcp.server.setRequestHandler('events/unsubscribe', { params: unsubscribeSchema }, args => events.unsubscribe(actor, args));
}

import { lookup } from 'node:dns/promises';
import { chmodSync, mkdirSync } from 'node:fs';
import { request } from 'node:https';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { EventService as EventServiceCore, callbackError, callbackUrl, publicCallbackAddress, type CallbackTransport, type EventServiceOptions as CoreOptions } from './events-core.js';
export { attachEvents, publicCallbackAddress } from './events-core.js';
export type { CallbackRequest, CallbackResponse, CallbackTransport } from './events-core.js';

export interface EventServiceOptions extends Omit<CoreOptions, 'sql' | 'transport'> {
  databasePath?: string;
  transport?: CallbackTransport;
}

/** No redirects, proxy environment, alternate ports, or second unvalidated DNS lookup. */
export const publicHttpsTransport: CallbackTransport = async (url, message) => {
  callbackUrl(url.href);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await Promise.race([
    lookup(host, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => {
      if (message.signal.aborted) reject(callbackError('timeout'));
      else message.signal.addEventListener('abort', () => reject(callbackError('timeout')), { once: true });
    }),
  ]);
  if (!addresses.length || addresses.some(item => !publicCallbackAddress(item.address))) throw callbackError('blocked_address');
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const outgoing = request(url, {
      method: 'POST', headers: message.headers, signal: message.signal, agent: false,
      family: address.family,
      lookup: ((_hostname: string, _options: unknown, done: (error: Error | null, address: string, family: number) => void) => done(null, address.address, address.family)) as never,
    }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 8192) { outgoing.destroy(); reject(callbackError('response_too_large')); }
        else chunks.push(chunk);
      });
      response.on('error', () => reject(callbackError('network_error')));
      response.on('end', () => resolve({ status: response.statusCode ?? 500, body: Buffer.concat(chunks).toString('utf8') }));
    });
    outgoing.on('error', () => reject(callbackError(message.signal.aborted ? 'timeout' : 'network_error')));
    outgoing.end(message.body);
  });
};

/** Node persistence and timer adapter; event rules are shared with the hosted Worker. */
export class EventService extends EventServiceCore {
  private readonly nodeDb: DatabaseSync;
  constructor(options: EventServiceOptions) {
    const path = options.databasePath ?? ':memory:';
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const sql = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    sql.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    super({ ...options, sql, transport: options.transport ?? publicHttpsTransport });
    this.nodeDb = sql;
  }
  start(): () => void {
    const timer = setInterval(() => { void this.flush().catch(() => { /* A subsequent drain retries persisted work. */ }); }, 1000);
    timer.unref();
    return () => clearInterval(timer);
  }
  close(): void { this.nodeDb.close(); }
}

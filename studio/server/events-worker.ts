import { EventService, callbackError, callbackUrl, type CallbackTransport, type EventSql } from './events-core.js';
import type { WorkspaceRepository } from './store-contract.js';
export { attachEvents } from './events-core.js';

/** Structural subset of DurableObjectStorage, avoiding Worker globals in the Node build. */
export interface WorkerEventStorage {
  sql: { exec(query: string, ...bindings: (string | number | null)[]): {
    toArray(): Record<string, unknown>[];
    readonly rowsWritten: number;
  } };
}

export function workerEventSql(storage: WorkerEventStorage): EventSql {
  return {
    exec(query) {
      for (const statement of query.split(';').filter(value => value.trim())) storage.sql.exec(statement);
    },
    prepare(query) {
      return {
        run: (...bindings) => ({ changes: storage.sql.exec(query, ...bindings).rowsWritten }),
        get: (...bindings) => storage.sql.exec(query, ...bindings).toArray()[0],
        all: (...bindings) => storage.sql.exec(query, ...bindings).toArray(),
      };
    },
  };
}

/** Requires Workers' global_fetch_strictly_public flag: the platform validates DNS at connection time. */
export const workerCallbackTransport: CallbackTransport = async (url, message) => {
  callbackUrl(url.href);
  const response = await fetch(url.href, {
    method: 'POST', body: message.body, headers: message.headers, signal: message.signal, redirect: 'manual',
  });
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw callbackError('redirect_blocked');
  }
  const reader = response.body?.getReader();
  if (!reader) return { status: response.status, body: '' };
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        throw callbackError('response_too_large');
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { status: response.status, body: new TextDecoder().decode(bytes) };
};

/** Use nextDeliveryAt() to schedule the Durable Object alarm after writes and flushes. */
export function createWorkerEvents(
  storage: WorkerEventStorage,
  store: Pick<WorkspaceRepository, 'get'>,
  options: { transport?: CallbackTransport; now?: () => number } = {},
): EventService {
  return new EventService({ sql: workerEventSql(storage), store, transport: options.transport ?? workerCallbackTransport, now: options.now });
}

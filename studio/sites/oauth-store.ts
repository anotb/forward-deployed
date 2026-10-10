import type { SitesDatabase } from './store.js';

/** The OAuth provider's text/JSON KV contract, backed by Sites-managed D1.
 * Expiration is enforced on every read, including lists; expired rows are also
 * removed during writes. OAuth values are never exposed to workspace queries.
 */
export class SitesOAuthStore {
  private readonly db: SitesDatabase;
  constructor(database: SitesDatabase) { this.db = database.withSession?.('first-primary') ?? database; }
  async get<T = string>(key: string, options?: 'text' | 'json' | { type?: 'text' | 'json' }): Promise<T | null> {
    const row = await this.db.prepare('SELECT value FROM fd_oauth_kv WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)').bind(key, Math.floor(Date.now() / 1000)).first<{ value: string }>();
    if (!row) return null;
    const envelope = JSON.parse(row.value) as { value: string };
    return ((typeof options === 'string' ? options : options?.type) === 'json' ? JSON.parse(envelope.value) : envelope.value) as T;
  }
  async put(key: string, value: string, options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const expires = options?.expiration ?? (options?.expirationTtl === undefined ? null : now + options.expirationTtl);
    await this.db.batch([
      this.db.prepare('DELETE FROM fd_oauth_kv WHERE expires_at IS NOT NULL AND expires_at <= ?').bind(now),
      this.db.prepare('INSERT INTO fd_oauth_kv(key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at').bind(key, JSON.stringify({ value, metadata: options?.metadata }), expires),
    ]);
  }
  async delete(key: string): Promise<void> { await this.db.batch([this.db.prepare('DELETE FROM fd_oauth_kv WHERE key = ?').bind(key)]); }
  async list(options: { prefix?: string; cursor?: string; limit?: number } = {}) {
    const prefix = options.prefix ?? '';
    const limit = Math.max(1, Math.min(1000, options.limit ?? 1000));
    const rows = await this.db.prepare('SELECT key, value, expires_at FROM fd_oauth_kv WHERE substr(key, 1, ?) = ? AND key > ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY key LIMIT ?').bind(prefix.length, prefix, options.cursor ?? '', Math.floor(Date.now() / 1000), limit + 1).all<{ key: string; value: string; expires_at: number | null }>();
    const more = rows.results.length > limit;
    const page = rows.results.slice(0, limit);
    return { keys: page.map(row => ({ name: row.key, metadata: JSON.parse(row.value).metadata, ...(row.expires_at === null ? {} : { expiration: row.expires_at }) })), list_complete: !more, cursor: more ? page.at(-1)!.key : '', cacheStatus: null };
  }
}

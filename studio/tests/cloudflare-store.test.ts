import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { DurableWorkspaceStore, type SqlStorageAdapter } from '../cloudflare/store.js';
import { WorkspaceService } from '../server/workspace.js';

test('Durable SQLite writes share receipts, roll back failures, and enforce account isolation', t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  const storage: SqlStorageAdapter = {
    sql: { exec: <T extends Record<string, string | number | null | ArrayBuffer>>(query: string, ...bindings: (string | number | null)[]) => ({ toArray: () => db.prepare(query).all(...bindings) as T[] }) },
    transactionSync<T>(fn: () => T): T {
      db.exec('BEGIN IMMEDIATE');
      try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  // Runtime SQL exec runs immediately; adapt the test driver to those semantics.
  storage.sql.exec = <T extends Record<string, string | number | null | ArrayBuffer>>(query: string, ...bindings: (string | number | null)[]) => {
    const rows = db.prepare(query).all(...bindings) as T[]; return { toArray: () => rows };
  };
  const store = new DurableWorkspaceStore(storage); const service = new WorkspaceService(store);
  const args = { requestId: 'new', name: 'Repair service', customer: 'Workshop', ambition: 'Book a repair in one conversation.' };
  const first = service.execute('create_engagement', args, 'alice');
  const replay = service.execute('create_engagement', args, 'alice');
  assert.deepEqual(first, replay); assert.equal(store.list('alice').length, 1); assert.equal(store.list('bob').length, 0);
  assert.throws(() => store.get(first.workspace.engagement.id, 'bob'), /not found/);
  assert.throws(() => service.execute('create_engagement', { ...args, name: 'Other' }, 'alice'), /already used/);
  const id = first.workspace.engagement.id;
  assert.throws(() => store.mutate('alice', id, 'rollback', 1, {}, workspace => { workspace.engagement.name = 'Corrupted'; throw new Error('Failure before receipt'); }), /Failure before receipt/);
  assert.equal(store.get(id, 'alice').engagement.name, args.name);
  const updated = store.mutate('alice', id, 'rollback', 1, {}, workspace => { workspace.engagement.name = 'Repair concierge'; return { workspace, result: true }; });
  assert.equal(updated.workspace.engagement.revision, 2);
  assert.deepEqual(store.mutate('alice', id, 'rollback', 1, {}, () => { throw new Error('Should replay'); }), updated);
  assert.throws(() => store.mutate('alice', id, 'stale', 1, {}, workspace => ({ workspace, result: true })), /current revision is 2/);
});

import { DomainError, type Engagement, type Workspace } from '../server/model.js';
import type { WorkspaceRepository, WorkspaceWrite } from '../server/store-contract.js';

export interface SqlStorageAdapter {
  sql: { exec<T extends Record<string, string | number | null | ArrayBuffer>>(query: string, ...bindings: (string | number | null)[]): { toArray(): T[] } };
  transactionSync<T>(callback: () => T): T;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
function identifier(value: string, field: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new DomainError('invalid_input', `${field} must be a nonempty string of at most 200 characters.`);
}

/** A Durable Object owns one account; SQL additionally checks the actor on every read and write. */
export class DurableWorkspaceStore implements WorkspaceRepository {
  constructor(private readonly storage: SqlStorageAdapter) {
    storage.sql.exec('CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, actor TEXT NOT NULL, revision INTEGER NOT NULL, document TEXT NOT NULL)');
    storage.sql.exec('CREATE INDEX IF NOT EXISTS workspaces_actor ON workspaces(actor)');
    storage.sql.exec('CREATE TABLE IF NOT EXISTS write_receipts (actor TEXT NOT NULL, scope TEXT NOT NULL, request_id TEXT NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(actor, scope, request_id))');
  }
  get(id: string, actor = 'local'): Workspace {
    identifier(id, 'engagementId'); identifier(actor, 'actor');
    const row = this.storage.sql.exec<{ document: string }>('SELECT document FROM workspaces WHERE id = ? AND actor = ?', id, actor).toArray()[0];
    if (!row) throw new DomainError('not_found', 'Engagement not found.');
    return JSON.parse(row.document) as Workspace;
  }
  list(actor = 'local'): Engagement[] {
    identifier(actor, 'actor');
    return this.storage.sql.exec<{ document: string }>('SELECT document FROM workspaces WHERE actor = ? ORDER BY rowid DESC', actor).toArray().map(row => (JSON.parse(row.document) as Workspace).engagement);
  }
  create(actor: string, requestId: string, args: unknown, build: () => WorkspaceWrite): WorkspaceWrite {
    return this.transaction(actor, '', requestId, args, () => {
      const write = build(); identifier(write.workspace.engagement.id, 'engagementId');
      write.workspace.engagement.revision = 1;
      this.storage.sql.exec('INSERT INTO workspaces(id, actor, revision, document) VALUES (?, ?, ?, ?)', write.workspace.engagement.id, actor, 1, JSON.stringify(write.workspace));
      return write;
    });
  }
  mutate(actor: string, id: string, requestId: string, expectedRevision: number, args: unknown, change: (workspace: Workspace) => WorkspaceWrite): WorkspaceWrite {
    identifier(id, 'engagementId');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new DomainError('invalid_input', 'expectedRevision must be a positive integer.');
    return this.transaction(actor, id, requestId, args, () => {
      const workspace = this.get(id, actor);
      if (workspace.engagement.revision !== expectedRevision) throw new DomainError('revision_conflict', `Expected revision ${expectedRevision}; current revision is ${workspace.engagement.revision}. Read the engagement before retrying.`);
      const write = change(workspace);
      if (write.workspace.engagement.id !== id) throw new DomainError('invalid_input', 'A write cannot move data between engagements.');
      write.workspace.engagement.revision = expectedRevision + 1;
      write.workspace.engagement.updatedAt = new Date().toISOString();
      this.storage.sql.exec('UPDATE workspaces SET revision = ?, document = ? WHERE id = ? AND actor = ?', expectedRevision + 1, JSON.stringify(write.workspace), id, actor);
      return write;
    });
  }
  close(): void { /* Durable Object storage lifetime belongs to the runtime. */ }
  private transaction(actor: string, scope: string, requestId: string, args: unknown, operation: () => WorkspaceWrite): WorkspaceWrite {
    identifier(actor, 'actor'); identifier(requestId, 'requestId');
    const fingerprint = canonical(args);
    return this.storage.transactionSync(() => {
      const receipt = this.storage.sql.exec<{ fingerprint: string; response: string }>('SELECT fingerprint, response FROM write_receipts WHERE actor = ? AND scope = ? AND request_id = ?', actor, scope, requestId).toArray()[0];
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new DomainError('idempotency_conflict', 'requestId was already used with different arguments. Use a new requestId for a new operation.');
        return JSON.parse(receipt.response) as WorkspaceWrite;
      }
      const write = operation(); const response = JSON.stringify(write);
      this.storage.sql.exec('INSERT INTO write_receipts(actor, scope, request_id, fingerprint, response) VALUES (?, ?, ?, ?, ?)', actor, scope, requestId, fingerprint, response);
      return JSON.parse(response) as WorkspaceWrite;
    });
  }
}

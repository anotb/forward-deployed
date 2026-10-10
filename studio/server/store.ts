import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DomainError, type Engagement, type Workspace } from './model.js';

export interface WorkspaceWrite { workspace: Workspace; result: unknown }

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function identifier(value: string, field: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new DomainError('invalid_input', `${field} must be a nonempty string of at most 200 characters.`);
}

/** Actor-scoped snapshots and retry receipts share one SQLite transaction. */
export class WorkspaceStore {
  private readonly db: DatabaseSync;

  constructor(path = ':memory:') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY, actor TEXT NOT NULL, revision INTEGER NOT NULL, document TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workspaces_actor ON workspaces(actor);
      CREATE TABLE IF NOT EXISTS write_receipts (
        actor TEXT NOT NULL, scope TEXT NOT NULL, request_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL, response TEXT NOT NULL,
        PRIMARY KEY(actor, scope, request_id)
      );
    `);
  }

  get(id: string, actor = 'local'): Workspace {
    identifier(id, 'engagementId');
    identifier(actor, 'actor');
    const row = this.db.prepare('SELECT document FROM workspaces WHERE id = ? AND actor = ?').get(id, actor);
    if (!row) throw new DomainError('not_found', 'Engagement not found.');
    return JSON.parse(row.document as string) as Workspace;
  }

  list(actor = 'local'): Engagement[] {
    identifier(actor, 'actor');
    return this.db.prepare('SELECT document FROM workspaces WHERE actor = ? ORDER BY rowid DESC').all(actor)
      .map(row => (JSON.parse(row.document as string) as Workspace).engagement);
  }

  create(actor: string, requestId: string, args: unknown, build: () => WorkspaceWrite): WorkspaceWrite {
    return this.transaction(actor, '', requestId, args, () => {
      const write = build();
      identifier(write.workspace.engagement.id, 'engagementId');
      write.workspace.engagement.revision = 1;
      this.db.prepare('INSERT INTO workspaces(id, actor, revision, document) VALUES (?, ?, ?, ?)')
        .run(write.workspace.engagement.id, actor, 1, JSON.stringify(write.workspace));
      return write;
    });
  }

  mutate(actor: string, engagementId: string, requestId: string, expectedRevision: number, args: unknown, change: (workspace: Workspace) => WorkspaceWrite): WorkspaceWrite {
    identifier(engagementId, 'engagementId');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new DomainError('invalid_input', 'expectedRevision must be a positive integer.');
    return this.transaction(actor, engagementId, requestId, args, () => {
      const workspace = this.get(engagementId, actor);
      if (workspace.engagement.revision !== expectedRevision) throw new DomainError('revision_conflict', `Expected revision ${expectedRevision}; current revision is ${workspace.engagement.revision}. Read the engagement before retrying.`);
      const write = change(workspace);
      if (write.workspace.engagement.id !== engagementId) throw new DomainError('invalid_input', 'A write cannot move data between engagements.');
      write.workspace.engagement.revision = expectedRevision + 1;
      write.workspace.engagement.updatedAt = new Date().toISOString();
      this.db.prepare('UPDATE workspaces SET revision = ?, document = ? WHERE id = ? AND actor = ?')
        .run(expectedRevision + 1, JSON.stringify(write.workspace), engagementId, actor);
      return write;
    });
  }

  close(): void { this.db.close(); }

  private transaction(actor: string, scope: string, requestId: string, args: unknown, operation: () => WorkspaceWrite): WorkspaceWrite {
    identifier(actor, 'actor');
    identifier(requestId, 'requestId');
    const fingerprint = canonical(args);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = this.db.prepare('SELECT fingerprint, response FROM write_receipts WHERE actor = ? AND scope = ? AND request_id = ?').get(actor, scope, requestId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new DomainError('idempotency_conflict', 'requestId was already used with different arguments. Use a new requestId for a new operation.');
        this.db.exec('COMMIT');
        return JSON.parse(receipt.response as string) as WorkspaceWrite;
      }
      const write = operation();
      const response = JSON.stringify(write);
      this.db.prepare('INSERT INTO write_receipts(actor, scope, request_id, fingerprint, response) VALUES (?, ?, ?, ?, ?)').run(actor, scope, requestId, fingerprint, response);
      this.db.exec('COMMIT');
      return JSON.parse(response) as WorkspaceWrite;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

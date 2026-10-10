import { DomainError, type Engagement, type Workspace } from '../server/model.js';
import type { WorkspaceRepository, WorkspaceWrite } from '../server/store-contract.js';
import { executeStudioTool, readTools, toolSchemas } from '../server/service.js';

/** Structural D1 types keep the shared domain independent of a Worker runtime. */
export interface SitesStatement {
  bind(...values: unknown[]): SitesStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
export interface SitesDatabase {
  prepare(query: string): SitesStatement;
  batch(statements: SitesStatement[]): Promise<unknown[]>;
  withSession?(constraint: 'first-primary'): SitesDatabase;
}
interface Receipt { fingerprint: string; response: string }

function identifier(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new DomainError('invalid_input', `${field} must be a nonempty string of at most 200 characters.`);
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
function replay(receipt: Receipt, fingerprint: string): Record<string, any> {
  if (receipt.fingerprint !== fingerprint) throw new DomainError('idempotency_conflict', 'requestId was already used with different arguments. Use a new requestId for a new operation.');
  return JSON.parse(receipt.response);
}

/** A synchronous domain unit of work over data already loaded and authorized by the caller. */
class LoadedWorkspaceRepository implements WorkspaceRepository {
  pending?: WorkspaceWrite;
  private readonly workspaces: Map<string, Workspace>;
  constructor(private readonly actor: string, workspaces: Workspace[], private readonly summaries: Engagement[]) {
    this.workspaces = new Map(workspaces.map(workspace => [workspace.engagement.id, workspace]));
  }
  private scope(actor: string): void {
    if (actor !== this.actor) throw new DomainError('not_found', 'Engagement not found.');
  }
  get(id: string, actor = 'local'): Workspace {
    this.scope(actor);
    const workspace = this.workspaces.get(id);
    if (!workspace) throw new DomainError('not_found', 'Engagement not found.');
    return structuredClone(workspace);
  }
  list(actor = 'local'): Engagement[] { this.scope(actor); return structuredClone(this.summaries); }
  create(actor: string, _requestId: string, _args: unknown, build: () => WorkspaceWrite): WorkspaceWrite {
    this.scope(actor);
    const write = build();
    write.workspace.engagement.revision = 1;
    return this.stage(write);
  }
  mutate(actor: string, engagementId: string, _requestId: string, expectedRevision: number, _args: unknown, change: (workspace: Workspace) => WorkspaceWrite): WorkspaceWrite {
    const workspace = this.get(engagementId, actor);
    if (workspace.engagement.revision !== expectedRevision) throw new DomainError('revision_conflict', `Expected revision ${expectedRevision}; current revision is ${workspace.engagement.revision}. Read the engagement before retrying.`);
    const write = change(workspace);
    if (write.workspace.engagement.id !== engagementId) throw new DomainError('invalid_input', 'A write cannot move data between engagements.');
    write.workspace.engagement.revision = expectedRevision + 1;
    write.workspace.engagement.updatedAt = new Date().toISOString();
    return this.stage(write);
  }
  close(): void { this.workspaces.clear(); this.pending = undefined; }
  private stage(write: WorkspaceWrite): WorkspaceWrite {
    if (this.pending) throw new DomainError('invalid_input', 'Only one workspace write is permitted per tool call.');
    this.pending = structuredClone(write);
    return write;
  }
}

/** Execute saved work using Sites-managed D1 and the authenticated ChatGPT subject.
 * All database operations are awaited outside the synchronous domain. The caller
 * must obtain actor from verified authentication, never a tool argument.
 */
export async function executeSavedTool(database: SitesDatabase, actor: string, name: string, raw: unknown): Promise<Record<string, any>> {
  identifier(actor, 'actor');
  if (!Object.hasOwn(toolSchemas, name)) throw new DomainError('unknown_tool', 'This tool is not available.');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new DomainError('invalid_input', 'Tool arguments must be an object.');
  // The outer authenticated dispatcher selected saved mode. Caller transport fields
  // cannot downgrade that decision or replace an existing saved document.
  const parsed = toolSchemas[name].parse({ ...raw, storage: 'saved' }) as Record<string, any>;
  const { telemetry: _telemetry, storage: _storage, workspace: suppliedSnapshot, ...domainArgs } = parsed;
  const args = { ...domainArgs, storage: 'saved', ...(name === 'save_engagement' ? { workspace: suppliedSnapshot } : {}) };
  const db = database.withSession?.('first-primary') ?? database;
  const isWrite = !readTools.has(name);
  const isCreate = name === 'create_engagement' || name === 'save_engagement';
  const scope = isCreate ? '' : parsed.engagementId;
  const requestId = parsed.requestId;
  const fingerprint = canonical({ tool: name, args });
  const receipt = () => db.prepare('SELECT fingerprint, response FROM fd_write_receipts WHERE actor = ? AND scope = ? AND request_id = ?').bind(actor, scope, requestId).first<Receipt>();
  if (isWrite) {
    identifier(requestId, 'requestId');
    identifier(scope || 'create', 'engagementId');
    const previous = await receipt();
    if (previous) return replay(previous, fingerprint);
  }

  const workspaces: Workspace[] = [];
  let summaries: Engagement[] = [];
  if (name === 'search' && !parsed.engagementId) {
    const rows = await db.prepare('SELECT document FROM fd_workspaces WHERE actor = ? ORDER BY rowid DESC').bind(actor).all<{ document: string }>();
    workspaces.push(...rows.results.map(row => JSON.parse(row.document) as Workspace));
    summaries = workspaces.map(workspace => workspace.engagement);
  } else {
    if (!isCreate && parsed.engagementId) {
      const row = await db.prepare('SELECT document FROM fd_workspaces WHERE actor = ? AND id = ?').bind(actor, parsed.engagementId).first<{ document: string }>();
      if (row) workspaces.push(JSON.parse(row.document) as Workspace);
    }
    if (name === 'list_engagements' || name === 'open_studio') {
      const rows = await db.prepare('SELECT summary FROM fd_workspaces WHERE actor = ? ORDER BY rowid DESC').bind(actor).all<{ summary: string }>();
      summaries = rows.results.map(row => JSON.parse(row.summary) as Engagement);
    }
  }
  const repository = new LoadedWorkspaceRepository(actor, workspaces, summaries);
  let result: Record<string, any>;
  try { result = executeStudioTool(repository, actor, name, args); }
  catch (error) {
    // A concurrent retry may have committed after the first receipt lookup and
    // before the snapshot read, making the original expectedRevision stale.
    if (isWrite) { const previous = await receipt(); if (previous) return replay(previous, fingerprint); }
    throw error;
  }
  if (!isWrite) return result;
  if (!repository.pending) throw new DomainError('invalid_input', 'The tool did not produce a workspace write.');
  const workspace = repository.pending.workspace;
  const summary = JSON.stringify(workspace.engagement);
  const document = JSON.stringify(workspace);
  const response = JSON.stringify(result);
  const token = crypto.randomUUID();
  const ownsReceipt = 'EXISTS (SELECT 1 FROM fd_write_receipts WHERE actor = ? AND scope = ? AND request_id = ? AND write_token = ?)';

  if (isCreate) {
    await db.batch([
      db.prepare('INSERT INTO fd_write_receipts(actor, scope, request_id, fingerprint, response, write_token) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(actor, scope, request_id) DO NOTHING').bind(actor, scope, requestId, fingerprint, response, token),
      db.prepare(`INSERT INTO fd_workspaces(id, actor, revision, summary, document) SELECT ?, ?, 1, ?, ? WHERE ${ownsReceipt}`).bind(workspace.engagement.id, actor, summary, document, actor, scope, requestId, token),
    ]);
  } else {
    await db.batch([
      db.prepare('INSERT INTO fd_write_receipts(actor, scope, request_id, fingerprint, response, write_token) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM fd_workspaces WHERE actor = ? AND id = ? AND revision = ?) ON CONFLICT(actor, scope, request_id) DO NOTHING').bind(actor, scope, requestId, fingerprint, response, token, actor, scope, parsed.expectedRevision),
      db.prepare(`UPDATE fd_workspaces SET revision = ?, summary = ?, document = ? WHERE actor = ? AND id = ? AND revision = ? AND ${ownsReceipt}`).bind(workspace.engagement.revision, summary, document, actor, scope, parsed.expectedRevision, actor, scope, requestId, token),
    ]);
  }
  // D1 batch is a transaction: a loser cannot leave a receipt or overwrite the
  // winner. Reading the receipt returns the original response for exact retries.
  const committed = await receipt();
  if (committed) return replay(committed, fingerprint);
  const current = await db.prepare('SELECT revision FROM fd_workspaces WHERE actor = ? AND id = ?').bind(actor, scope).first<{ revision: number }>();
  if (!current) throw new DomainError('not_found', 'Engagement not found.');
  throw new DomainError('revision_conflict', `Expected revision ${parsed.expectedRevision}; current revision is ${current.revision}. Read the engagement before retrying.`);
}

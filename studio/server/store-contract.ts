import type { Engagement, Workspace } from './model.js';

export interface WorkspaceWrite { workspace: Workspace; result: unknown }

/** Synchronous, actor-scoped persistence used by the shared domain service.
 * Implementations commit snapshot changes and retry receipts atomically.
 */
export interface WorkspaceRepository {
  get(id: string, actor?: string): Workspace;
  list(actor?: string): Engagement[];
  create(actor: string, requestId: string, args: unknown, build: () => WorkspaceWrite): WorkspaceWrite;
  mutate(
    actor: string,
    engagementId: string,
    requestId: string,
    expectedRevision: number,
    args: unknown,
    change: (workspace: Workspace) => WorkspaceWrite,
  ): WorkspaceWrite;
  close(): void;
}

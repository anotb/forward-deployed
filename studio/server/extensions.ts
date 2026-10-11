import { ResourceTemplate, type McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { DomainError, type Workspace } from './model.js';
import { executeStudioTool } from './service.js';
import type { StudioMcpOptions } from './mcp.js';

const collections = { evidence: 'evidence', opportunity: 'opportunities', requirement: 'requirements', work: 'work', run: 'runs' } as const;
type Kind = keyof typeof collections;
const isKind = (value: string): value is Kind => Object.hasOwn(collections, value);
const title = (record: any, kind: Kind) => kind === 'run' ? `${record.scenario.title} · ${record.id.slice(0, 8)}` : record.title;
export const recordUri = (engagementId: string, kind: Kind, recordId: string) => `forward-deployed://engagements/${encodeURIComponent(engagementId)}/${kind}/${encodeURIComponent(recordId)}`;
export const recordPath = (engagementId: string, kind: Kind, recordId: string) => `/engagements/${encodeURIComponent(engagementId)}?kind=${kind}&id=${encodeURIComponent(recordId)}`;

/** Composer searches never include stateless conversations or another identity's records. */
export function registerRecordMentions(server: McpServer, options: StudioMcpOptions) {
  const execute = (name: string, args: Record<string, unknown>) => options.executeTool ? options.executeTool(name, args) : Promise.resolve(executeStudioTool(options.store, options.actor, name, args));
  server.registerTool('search_records', {
    title: 'Find engagement records', description: 'Find saved discovery, service, requirement, delivery and rehearsal records to mention in a conversation. Searches only the connected identity’s saved engagements.',
    inputSchema: z.object({ query: z.string().max(500) }), outputSchema: z.object({ items: z.array(z.record(z.string(), z.unknown())) }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    _meta: { ui: { visibility: ['app'] }, securitySchemes: [{ type: 'oauth2', scopes: options.authScopes ?? ['workspace'] }] },
  }, async ({ query }) => {
    if (options.authenticated === false || (!options.store && !options.executeTool)) return { content: [], structuredContent: { items: [] } };
    const items: Record<string, unknown>[] = [];
    const found = await execute('list_engagements', { storage: 'saved', telemetry: false });
    const needle = query.trim().toLocaleLowerCase();
    for (const engagement of (found.engagements ?? []).slice(0, 100)) {
      const { workspace } = await execute('get_engagement', { engagementId: engagement.id, storage: 'saved', telemetry: false }) as { workspace: Workspace };
      records: for (const kind of Object.keys(collections) as Kind[]) for (const record of workspace[collections[kind]]) {
        const name = title(record, kind);
        if (needle && !`${engagement.name} ${kind} ${name}`.toLocaleLowerCase().includes(needle)) continue;
        items.push({ type: 'resource_link', uri: recordUri(engagement.id, kind, record.id), name, title: name, description: `${engagement.name} · ${kind}`, mimeType: 'application/json' });
        if (items.length >= 30) break records;
      }
      if (items.length >= 30) break;
    }
    return { content: [], structuredContent: { items: items.slice(0, 30) } };
  });
  server.registerResource('engagement-record', new ResourceTemplate('forward-deployed://engagements/{engagementId}/{kind}/{recordId}', { list: undefined }), { mimeType: 'application/json', description: 'An identity-scoped saved Forward Deployed record.' }, async (uri, variables) => {
    const engagementId = String(variables.engagementId); const kind = String(variables.kind); const recordId = String(variables.recordId);
    if (!isKind(kind)) throw new DomainError('not_found', 'Record type not found.');
    const { workspace } = await execute('get_engagement', { engagementId, storage: 'saved', telemetry: false }) as { workspace: Workspace };
    const record = workspace[collections[kind]].find(record => record.id === recordId);
    if (!record) throw new DomainError('not_found', 'Record not found in this engagement.');
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ engagementId, engagementName: workspace.engagement.name, revision: workspace.engagement.revision, kind, record, appRelativeUrl: recordPath(engagementId, kind, recordId) }) }] };
  });
}

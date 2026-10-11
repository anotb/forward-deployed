import { McpServer } from '@modelcontextprotocol/server';
import { createHash } from 'node:crypto';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { DomainError } from './model.js';
import type { WorkspaceRepository } from './store-contract.js';
import { executeStudioTool, toolSchemas, toolDescriptions, readTools, compactWorkspace } from './service.js';
import { createFormStateCodec, registerNativeForms } from './forms.js';
import { registerRecordMentions } from './extensions.js';

export const STUDIO_URI = 'ui://forward-deployed/studio-v3.html';
export interface StudioMcpOptions {
  store: WorkspaceRepository | null; actor: string; html: string; origin: string;
  profile?: { id: string; name?: string };
  authenticated?: boolean;
  requireAuthentication?: boolean;
  executeTool?: (name: string, args: Record<string, unknown>) => Promise<Record<string, any>>;
  authScopes?: string[];
  formStateSecret?: string;
  candidate?: { engagementId: string; runId: string };
  onWrite?: (actor: string, name: string, write: any) => void | Promise<void>;
  attach?: (server: McpServer, actor: string) => void;
  onResult?: (event: { tool: string; storage: 'stateless' | 'saved'; result: 'ok' | 'error' | 'auth_required'; latencyMs: number }) => void;
}
const output = z.record(z.string(), z.unknown());

export function createStudioMcp(options: StudioMcpOptions): McpServer {
  const { store, actor, candidate } = options;
  const formCodec = createFormStateCodec(options);
  const server = new McpServer({ name: 'forward-deployed', version: '0.6.2' }, {
    ...(formCodec ? { requestState: { verify: formCodec.verify } } : {}),
    ...(!candidate ? { capabilities: { extensions: { 'openai/mentions': { searchTool: 'search_records' } } } } : {}),
    instructions: candidate
      ? 'Complete the rehearsal goal using the exposed service actions. Observe the service before acting and after an ambiguous result. Finish when the goal is reached or blocked.'
      : 'Forward Deployed provides engagement records and a declarative workflow simulator. Use the workspace tools to connect supplied source passages, service opportunities, requirements and delivery work. Stateless is the default: retain the returned workspace and pass it on continuation; the service does not save it. Save only when the user chooses it. Use the current revision for writes. Field Lab operates solely on scenario data and simulated state transitions in this workspace. It does not create new MCP tools, execute source code, call external services or perform production business actions. Rehearsal checks describe the supplied model and its recorded trace.',
  });
  if (!candidate) {
    // Keep the previous URI readable for installed clients with cached v0.5 descriptors.
    for (const uri of [STUDIO_URI, 'ui://forward-deployed/studio-v2.html', 'ui://forward-deployed/studio-v1.html']) registerAppResource(server, uri === STUDIO_URI ? 'forward-deployed-studio' : `forward-deployed-${uri.split('/').at(-1)}`, uri, {}, async () => ({ contents: [{
      uri, mimeType: RESOURCE_MIME_TYPE, text: options.html,
      _meta: { ui: { prefersBorder: false, domain: options.origin, csp: { connectDomains: [], resourceDomains: [] } } },
    }] }));
    server.registerTool('get_profile', {
      title: 'Connected profile', description: 'Read the identity associated with this connection.',
      inputSchema: z.object({}), outputSchema: output,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { 'openai/profile': true },
    }, async () => {
      if (!options.profile && !store) return { isError: true, content: [{ type: 'text', text: 'No connected account. Stateless work does not require one.' }], structuredContent: { error: 'not_connected' } };
      const profile = options.profile ?? { id: actor };
      return { content: [{ type: 'text', text: JSON.stringify(profile) }], structuredContent: profile };
    });
  }
  const names = candidate ? ['observe_rehearsal', 'act_in_rehearsal', 'finish_rehearsal'] : Object.keys(toolSchemas);
  for (const name of names) {
    const [title, description] = toolDescriptions[name];
    let inputSchema = toolSchemas[name];
    if (candidate) inputSchema = inputSchema.omit({ engagementId: true, runId: true, expectedRevision: true, requestId: true, storage: true, workspace: true });
    const metadata: Record<string, unknown> = { securitySchemes: name === 'save_engagement' || options.requireAuthentication ? [{ type: 'oauth2', scopes: options.authScopes ?? ['workspace'] }] : [{ type: 'noauth' }, { type: 'oauth2', scopes: options.authScopes ?? ['workspace'] }] };
    if (name === 'open_studio') {
      metadata.ui = { resourceUri: STUDIO_URI };
      metadata['openai/ui'] = { entrypoints: [{ type: 'thread' }, { type: 'global' }] };
    }
    registerAppTool(server, name, {
      title, description, inputSchema, outputSchema: output,
      annotations: { readOnlyHint: readTools.has(name), destructiveHint: false, openWorldHint: false, idempotentHint: readTools.has(name) },
      _meta: metadata,
    }, async args => {
      const started = performance.now();
      const record = (result: 'ok' | 'error' | 'auth_required') => {
        if ((args as any).telemetry === false) return;
        try { options.onResult?.({ tool: name, storage: candidate || name === 'save_engagement' || (args as any).storage === 'saved' ? 'saved' : 'stateless', result, latencyMs: performance.now() - started }); } catch { /* Usage counters never block a tool. */ }
      };
      try {
        let input: any = args;
        if (candidate) {
          if (!store) throw new DomainError('authentication_required', 'The rehearsal connection is not available.');
          const workspace = store.get(candidate.engagementId, actor);
          input = { ...args, ...candidate, storage: 'saved', expectedRevision: workspace.engagement.revision, requestId: crypto.randomUUID() };
        }
        const data = options.executeTool ? await options.executeTool(name, input) : executeStudioTool(store, actor, name, input);
        if (!readTools.has(name) && data.storage === 'saved') await options.onWrite?.(actor, name, data);
        const structuredContent: Record<string, unknown> = candidate ? {
          engagementId: candidate.engagementId, revision: data.workspace?.engagement.revision, result: data.result,
        } : data.workspace ? {
          engagementId: data.workspace.engagement.id, revision: data.workspace.engagement.revision,
          storage: data.storage,
          ...(data.storage === 'stateless' ? { workspace: data.workspace } : name === 'get_engagement' || name === 'open_studio' ? { workspace: compactWorkspace(data.workspace) } : {}),
          ...(data.result === undefined ? {} : { result: data.result }),
          ...(data.engagements ? { engagements: data.engagements } : {}),
        } : data.export ? { storage: data.storage, result: data.result } : data;
        record('ok');
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify(structuredContent) },
            ...(!candidate && data.export ? [{
              type: 'resource' as const,
              resource: {
                // Identifies bytes embedded in this response; it is not a hosted download URL.
                uri: `forward-deployed-export://sha256/${createHash('sha256').update(Buffer.from(data.export.blob, 'base64')).digest('hex')}/${encodeURIComponent(data.export.filename)}`,
                mimeType: 'application/zip', blob: data.export.blob as string,
              },
            }] : []),
          ], structuredContent,
          ...(!candidate && (data.workspace || data.export) ? { _meta: { ...(data.workspace ? { workspace: data.workspace, ...(data.changeImpacts ? { changeImpacts: data.changeImpacts } : {}) } : {}), ...(data.export ? { export: data.export } : {}) } } : {}),
        };
      } catch (error) {
        record(error instanceof DomainError && error.code === 'authentication_required' ? 'auth_required' : 'error');
        const message = error instanceof z.ZodError ? z.prettifyError(error) : error instanceof DomainError ? error.message : 'The operation could not be completed.';
        return { isError: true, content: [{ type: 'text' as const, text: message }], structuredContent: { error: { code: error instanceof DomainError ? error.code : 'invalid_request', message } },
          ...(error instanceof DomainError && error.code === 'authentication_required' ? { _meta: { 'mcp/www_authenticate': [`Bearer resource_metadata="${options.origin}/.well-known/oauth-protected-resource/mcp", error="insufficient_scope", error_description="Sign in to use saved workspaces"`] } } : {}),
        };
      }
    });
  }
  if (!candidate) {
    registerNativeForms(server, options, STUDIO_URI, formCodec);
    registerRecordMentions(server, options);
  }
  options.attach?.(server, actor);
  return server;
}

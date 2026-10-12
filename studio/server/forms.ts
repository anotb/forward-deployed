import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createRequestStateCodec, inputRequired, type McpServer, type RequestStateCodec, type ServerContext } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { DomainError, type Workspace, type Run, type State } from './model.js';
import { buildChangeImpact, changeImpacts } from './review.js';
import { executeStudioTool } from './service.js';
import type { StudioMcpOptions } from './mcp.js';

type FormKind = 'review' | 'experiment';
interface FormState {
  tool: string; fingerprint: string; revision: number; requestId: string;
  phase: 'choose' | 'conditions' | 'confirm'; atStep?: number;
  operation?: { name: string; args: Record<string, unknown> }; summary?: string;
}
const id = z.string().trim().min(1).max(200);
const base = z.object({ engagementId: id, storage: z.enum(['stateless', 'saved']).default('stateless'), workspace: z.record(z.string(), z.unknown()).optional(), expectedRevision: z.number().int().positive().optional(), requestId: id.optional(), telemetry: z.boolean().optional() });
const schemas = { review_with_form: base.extend({ proposalId: id }), experiment_with_form: base.extend({ runId: id }) };
const canonical = (value: any): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const fingerprint = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
const fail = (code: string, message: string): never => { throw new DomainError(code, message); };
const label = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.-]+/g, ' ');
const readable = (value: unknown): string => Array.isArray(value) ? value.map(readable).join('; ') : value && typeof value === 'object' ? Object.entries(value).map(([key, item]) => `${label(key)}: ${readable(item)}`).join('\n') : String(value ?? 'None');

export function createFormStateCodec(options: StudioMcpOptions): RequestStateCodec<FormState> | undefined {
  if (!options.formStateSecret || Buffer.byteLength(options.formStateSecret) < 32) return undefined;
  return createRequestStateCodec<FormState>({
    key: createHmac('sha256', options.formStateSecret).update('forward-deployed:forms:v1').digest(), ttlSeconds: 900,
    bind: context => `${options.actor}\0${options.origin}\0${context.mcpReq.method}`,
  });
}

/** Native forms use the 2026-07-28 request envelope, never legacy push elicitation. */
function supportsForms(context: ServerContext): boolean {
  const envelope = context.mcpReq.envelope as Record<string, any> | undefined;
  const capabilities = envelope?.['io.modelcontextprotocol/clientCapabilities'];
  return (envelope?.['io.modelcontextprotocol/protocolVersion'] ?? '') >= '2026-07-28'
    && capabilities?.elicitation?.form !== undefined
    && capabilities?.extensions?.['openai/elicitation']?.form !== undefined;
}

function result(workspace: Workspace, storage: string, detail: Record<string, unknown>) {
  const structuredContent = { engagementId: workspace.engagement.id, revision: workspace.engagement.revision, storage, ...(storage === 'stateless' ? { workspace } : {}), result: detail };
  return { content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }], structuredContent, _meta: { workspace, changeImpacts: changeImpacts(workspace) } };
}
function conditions(run: Run, atStep: number) {
  const state = atStep === 0 ? run.initialState : run.steps[atStep - 1].after;
  const entries = run.scenario.observableKeys.filter(key => typeof state[key] === 'string' || typeof state[key] === 'number' || typeof state[key] === 'boolean').map((key, index) => ({ key, property: `condition_${index}`, value: state[key] }));
  return { state, entries };
}

export function registerNativeForms(server: McpServer, options: StudioMcpOptions, uri: string, codec?: RequestStateCodec<FormState>) {
  const execute = (name: string, args: Record<string, unknown>) => options.executeTool ? options.executeTool(name, args) : Promise.resolve(executeStudioTool(options.store, options.actor, name, args));
  for (const [tool, schema] of Object.entries(schemas)) {
    const kind: FormKind = tool === 'review_with_form' ? 'review' : 'experiment';
    server.registerTool(tool, {
      title: kind === 'review' ? 'Review changes in a form' : 'Configure an experiment',
      description: kind === 'review'
        ? 'Use when the user wants to review a discovery, service or delivery change proposal. Shows each proposed change and its impact, collects accept/reject choices, then asks for explicit confirmation. Leaves pending changes untouched. Use the workspace to revise fields.'
        : 'Use when the user wants to test another set of assumptions. Choose a point in a recorded rehearsal, edit typed observable conditions, then confirm a new branch. Only simulated workspace state changes.',
      inputSchema: schema, outputSchema: z.record(z.string(), z.unknown()),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: { ui: { resourceUri: uri }, securitySchemes: options.requireAuthentication ? [{ type: 'oauth2', scopes: options.authScopes ?? ['workspace'] }] : [{ type: 'noauth' }, { type: 'oauth2', scopes: options.authScopes ?? ['workspace'] }] },
    }, async (args: Record<string, any>, context: ServerContext) => {
      try {
        const data = await execute('get_engagement', args);
        const workspace = data.workspace as Workspace;
        const original = fingerprint({ tool, args });
        const resumed = context.mcpReq.requestState<FormState>();
        if (resumed && (resumed.tool !== tool || resumed.fingerprint !== original)) fail('invalid_form_state', 'This form belongs to another request. Open a new form for the current workspace.');
        if ((resumed?.revision ?? args.expectedRevision ?? workspace.engagement.revision) !== workspace.engagement.revision) fail('revision_conflict', 'The engagement changed while this form was open. Read the current workspace and review again.');
        const fallback = () => result(workspace, args.storage, { form: { kind, supported: false, ...(kind === 'review' ? { proposalId: (args as any).proposalId } : { runId: (args as any).runId }) }, message: 'Continue with the same typed form in the workspace. No changes have been made.' });
        if (!codec || !supportsForms(context)) return fallback();
        const state: FormState = resumed ?? { tool, fingerprint: original, revision: workspace.engagement.revision, requestId: randomUUID(), phase: 'choose' };
        const ask = async (message: string, properties: Record<string, unknown>, required: string[], next = state) => inputRequired({
          requestState: await codec.mint(next, context),
          inputRequests: { [next.phase]: { method: 'elicitation/create', params: { mode: 'form', message,
            requestedSchema: { type: 'object', properties: {} },
            _meta: { 'openai/elicitation': { requestedSchema: { type: 'object', properties, required, additionalProperties: false } } },
          } } },
        });
        const responses = context.mcpReq.inputResponses;
        if (!resumed && (responses || context.mcpReq.droppedInputResponseKeys?.length)) fail('invalid_form_state', 'Form responses require their original signed request state.');
        if (responses && Object.keys(responses).some(key => key !== state.phase)) fail('invalid_form_response', 'Unexpected form response.');
        const response = responses?.[state.phase];
        let content: Record<string, unknown> | undefined;
        if (response !== undefined) {
          const checked = z.object({ action: z.enum(['accept', 'cancel', 'decline']), content: z.record(z.string(), z.unknown()).optional(), _meta: z.record(z.string(), z.unknown()).optional() }).strict().safeParse(response);
          if (!checked.success) throw new DomainError('invalid_form_response', 'The form response was invalid. Nothing was changed.');
          if (checked.data.action !== 'accept') return result(workspace, args.storage, { form: { kind, cancelled: true }, message: 'Cancelled. No changes were made.' });
          content = checked.data.content ?? fail('invalid_form_response', 'The accepted form has no values.');
        }
        if (state.phase === 'confirm') {
          if (!state.operation || !state.summary) throw new DomainError('invalid_form_state', 'Incomplete confirmation state.');
          if (content) {
            const choice = z.object({ confirm: z.boolean() }).strict().parse(content);
            if (!choice.confirm) return result(workspace, args.storage, { form: { kind, cancelled: true }, message: 'No changes were made.' });
            const changed = await execute(state.operation.name, { ...args, ...state.operation.args, requestId: state.requestId, expectedRevision: state.revision });
            if (changed.storage === 'saved') await options.onWrite?.(options.actor, state.operation.name, changed);
            return result(changed.workspace, args.storage, { ...changed.result, form: { kind, completed: true } });
          }
          return ask(state.summary, { confirm: { type: 'boolean', title: kind === 'review' ? 'Apply these review decisions' : 'Create this experiment branch', default: false } }, ['confirm']);
        }
        let operation: FormState['operation']; let summary = '';
        if (kind === 'review') {
          const proposal = workspace.changeProposals?.find(item => item.id === (args as any).proposalId) ?? fail('not_found', 'Change proposal not found.');
          const pending = proposal.changes.filter(change => change.status === 'pending');
          if (!pending.length) return result(workspace, args.storage, { form: { kind, completed: true }, message: 'Every change in this proposal has already been reviewed.' });
          const impact = buildChangeImpact(workspace, pending);
          const overview = `${proposal.title}\n${proposal.reason}\n\nLinked work potentially affected: ${impact.requirements.length} requirements, ${impact.work.length} delivery items, ${impact.scenarios.length} scenarios, ${impact.runs.length} runs. ${impact.staleChecks.length} checks and ${impact.staleEvidenceRefs.length} source references will need review.\n${impact.conflicts.map(item => item.message).join('\n')}\nAccept applies the proposed fields. Reject dismisses the change. Keep pending leaves it for later. To edit proposed fields, use the workspace review.`;
          const descriptions = pending.map(change => Object.entries(change.fields).map(([key, value]) => `${label(key)}: ${change.before ? `${readable((change.before as any)[key])} → ` : ''}${readable(value)}`).join('\n'));
          // Large source passages belong in the full workspace review, never a truncated approval form.
          if (descriptions.join('').length > 60_000) return fallback();
          const properties = Object.fromEntries(pending.map((change, index) => [`change_${index}`, { type: 'string', title: `${change.operation === 'create' ? 'Add' : 'Update'} ${change.kind}: ${(change.fields as any).title ?? change.before?.title ?? change.recordId}`, description: descriptions[index], default: 'keep', oneOf: [{ const: 'keep', title: 'Keep pending', description: 'Leave this proposal unchanged.' }, { const: 'accept', title: 'Accept', description: 'Apply these fields after confirmation.' }, { const: 'reject', title: 'Reject', description: 'Dismiss this proposed change after confirmation.' }] }]));
          if (!content) return ask(overview, properties, Object.keys(properties));
          const choices = z.object(Object.fromEntries(pending.map((_, index) => [`change_${index}`, z.enum(['keep', 'accept', 'reject'])]))).strict().parse(content) as Record<string, 'keep' | 'accept' | 'reject'>;
          const decisions = pending.flatMap((change, index) => choices[`change_${index}`] === 'keep' ? [] : [{ changeId: change.id, decision: choices[`change_${index}`] }]);
          if (!decisions.length) return result(workspace, args.storage, { form: { kind, cancelled: true }, message: 'All changes remain pending.' });
          operation = { name: 'review_changes', args: { proposalId: proposal.id, expectedProposalVersion: proposal.version, decisions } };
          summary = `Confirm decisions for “${proposal.title}” at engagement revision ${state.revision}:\n\n${pending.flatMap((change, index) => choices[`change_${index}`] === 'keep' ? [] : [`${choices[`change_${index}`] === 'accept' ? 'Accept' : 'Reject'} ${(change.fields as any).title ?? change.recordId}\n${descriptions[index]}`]).join('\n\n')}\n\nOther proposed changes remain pending.`;
        } else {
          const run = workspace.runs.find(item => item.id === (args as any).runId) ?? fail('not_found', 'Rehearsal run not found.');
          if (state.phase === 'choose') {
            if (!content) return ask(`Try another approach to “${run.scenario.title}”. Choose where the new branch begins. The original run is preserved.`, { atStep: { type: 'integer', title: 'Start after timeline entry', description: `0 is the initial state; ${run.steps.length} is the latest recorded state.`, minimum: 0, maximum: run.steps.length, default: run.steps.length } }, ['atStep']);
            state.atStep = z.object({ atStep: z.number().int().min(0).max(run.steps.length) }).strict().parse(content).atStep;
            state.phase = 'conditions'; content = undefined;
          }
          const atStep = state.atStep ?? fail('invalid_form_state', 'Choose a starting point first.');
          const { state: baseline, entries } = conditions(run, atStep);
          const properties = Object.fromEntries(entries.map(({ key, property, value }) => [property, { type: typeof value, title: label(key), description: `Observable condition at timeline entry ${atStep}.`, default: value, ...(typeof value === 'string' ? { maxLength: 16_000, 'x-openai-suggestions': [{ const: value, title: value || '(empty)' }] } : {}) }]));
          if (!content) return ask(`Change the conditions for “${run.scenario.title}”, starting after entry ${atStep}. Hidden and non-scalar state stays as recorded. These are simulated conditions.`, properties, Object.keys(properties));
          const validators = Object.fromEntries(entries.map(({ property, value }) => [property, typeof value === 'number' ? z.number().finite() : typeof value === 'boolean' ? z.boolean() : z.string().max(16_000)]));
          const values = z.object(validators).strict().parse(content) as Record<string, string | number | boolean>;
          const stateOverrides: State = Object.fromEntries(entries.filter(({ key, property }) => values[property] !== baseline[key]).map(({ key, property }) => [key, values[property]]));
          operation = { name: 'fork_rehearsal', args: { runId: run.id, atStep, stateOverrides } };
          summary = `Create a branch of “${run.scenario.title}” after timeline entry ${atStep}.\n\n${Object.keys(stateOverrides).length ? Object.entries(stateOverrides).map(([key, value]) => `${label(key)}: ${readable(baseline[key])} → ${readable(value)}`).join('\n') : 'Keep all conditions as recorded.'}\n\nThe original run stays unchanged. This creates simulated workspace data only.`;
        }
        const next: FormState = { ...state, phase: 'confirm', operation, summary };
        return ask(summary, { confirm: { type: 'boolean', title: kind === 'review' ? 'Apply these review decisions' : 'Create this experiment branch', default: false } }, ['confirm'], next);
      } catch (error) {
        const code = error instanceof DomainError ? error.code : 'invalid_form_response';
        const message = error instanceof DomainError ? error.message : error instanceof z.ZodError ? 'The form contains invalid values. Nothing was changed.' : 'The form could not be completed.';
        return { isError: true, content: [{ type: 'text' as const, text: message }], structuredContent: { error: { code, message } },
          ...(code === 'authentication_required' ? { _meta: { 'mcp/www_authenticate': [`Bearer resource_metadata="${options.origin}/.well-known/oauth-protected-resource/mcp", error="insufficient_scope", error_description="Sign in to use saved workspaces"`] } } : {}),
        };
      }
    });
  }
}

import { z } from 'zod';
import { WorkspaceService, inputSchemas } from './workspace.js';
import { executeLab, labInputSchemas } from './lab.js';
import { DomainError, type Workspace } from './model.js';
import type { WorkspaceRepository } from './store-contract.js';
import { StatelessWorkspaceStore, validatedSnapshot } from './stateless.js';
import { buildExport, prepareGitExport } from './export.js';

const id = z.string().trim().min(1).max(200);
const transaction = {
  engagementId: id,
  requestId: id.describe('A unique ID for this write. Reuse only when retrying exactly the same request.'),
  expectedRevision: z.number().int().positive().describe('Current engagement revision returned by the preceding read or write.'),
};
const baseSchemas: Record<string, z.ZodObject<any>> = {
  ...inputSchemas,
  list_engagements: z.object({}),
  get_engagement: z.object({ engagementId: id }),
  open_studio: z.object({ engagementId: id.optional() }),
  search: z.object({ query: z.string().trim().min(1).max(500), engagementId: id.optional() }),
  fetch: z.object({ engagementId: id, evidenceId: id, version: z.number().int().positive().optional() }),
  save_engagement: z.object({ requestId: id }),
  export_engagement: z.object({ engagementId: id, includeEvidence: z.boolean().default(true) }),
  prepare_git_export: z.object({ engagementId: id, includeEvidence: z.boolean().default(true) }),
  ...Object.fromEntries(Object.entries(labInputSchemas).map(([name, schema]) => [name,
    name === 'observe_rehearsal' ? schema.extend({ engagementId: id }) : schema.extend(transaction),
  ])),
};
export const toolSchemas = Object.fromEntries(Object.entries(baseSchemas).map(([name, schema]) => [name, schema.extend({
  storage: z.enum(['stateless', 'saved']).default('stateless').describe('Stateless keeps the workspace in this conversation or local file. Saved uses the signed-in hosted workspace.'),
  workspace: z.record(z.string(), z.unknown()).optional().describe('For stateless continuation, pass the complete workspace snapshot returned by the preceding call. Do not invent its contents.'),
  telemetry: z.boolean().optional().describe('Set false to exclude this call from aggregate usage counters.'),
})])) as Record<string, z.ZodObject<any>>;

export const toolDescriptions: Record<string, [string, string]> = {
  create_engagement: ['Start an engagement', 'Use when the user wants a persistent workspace for developing a useful service. Record the ambition and customer. A short standalone question does not need an engagement.'],
  add_evidence: ['Add meeting or discovery evidence', 'Use to retain selected meeting notes, source passages or operator observations in this engagement. Read authorized Meetings or other sources through the host first; this tool does not access meetings itself. Preserve source links, origin IDs and preliminary/final status.'],
  shape_opportunity: ['Develop a service opportunity', 'Use to save or refine a concrete service: who benefits, how work happens today, what becomes possible and how to judge it. Link exact source passages; keep proposed targets and assumptions explicit. The host supplies the analysis.'],
  define_requirement: ['Define useful service behavior', 'Use to capture behavior and acceptance examples for an opportunity, linked to discovery evidence. Distinguish proposed requirements from confirmed ones.'],
  plan_delivery: ['Plan or update delivery work', 'Use to save one piece of build work, its intended outcome, owner and linked requirements. Marking work done records implementation status; rehearsal evidence is computed separately.'],
  list_engagements: ['Find your engagements', 'Use to find an existing engagement before creating another. Returns only workspaces available to the connected identity.'],
  get_engagement: ['Read an engagement', 'Use to understand the proposed services, evidence, requirements, work and rehearsals before continuing. Returns the current revision for subsequent writes.'],
  open_studio: ['Open Forward Deployed', 'Use to show the interactive workspace or Field Lab. Data tools can be used without opening the interface.'],
  search: ['Search discovery evidence', 'Use to find relevant passages in the connected user’s saved engagement evidence. This searches saved material, not external meetings or the web.'],
  fetch: ['Read source evidence', 'Use to read a saved source, including the exact historical version cited by a requirement or opportunity.'],
  save_engagement: ['Save to Forward Deployed', 'Use only when the user chooses to save this workspace on Forward Deployed. Requires sign-in. Creates a hosted copy of the supplied workspace snapshot; stateless work does not need this tool.'],
  export_engagement: ['Download the engagement', 'Use to export the current workspace as a portable ZIP with readable documents, requirements, source references, rehearsals and a checksum manifest. Selected evidence is included unless disabled. Does not publish or save to another service.'],
  prepare_git_export: ['Prepare a Git export', 'Use when the user wants to save this engagement to their own Git repository. Returns a namespaced set of text files and commit details for the host’s connected Git tools. It does not create a repository or push. Confirm the destination; default new repositories to private. Preserve unrelated files.'],
  define_rehearsal: ['Define a workflow simulation', 'Store a declarative Field Lab scenario: initial JSON state, typed inputs, comparison conditions, state edits and outcome checks. Allowed state edits are set, increment and append. Named scenario actions label simulated transitions; they are data, not registered tools or external operations. No source code is accepted or executed. Record the model assumptions.'],
  start_rehearsal: ['Start a service rehearsal', 'Use to try a proposed service. Creates an independent run of the selected scenario version. Continue by observing and taking actions toward the stated goal.'],
  observe_rehearsal: ['Read simulation state', 'Read a Field Lab run’s observable JSON state and the declared data transitions available at that step. This is a read-only inspection of a simulation; it performs no scenario action, external operation or tool discovery. Private scenario fields and outcome checks are withheld from the candidate view.'],
  act_in_rehearsal: ['Advance a workflow simulation', 'Apply one declared state transition to an existing Field Lab run. Only set, increment and append operations can change the simulated JSON state, after typed input and comparison checks. actionId selects a transition stored in the scenario, not an external tool or API. No external business action or source code executes. Reuse intentId only for a retry of the same transition and inputs.'],
  fork_rehearsal: ['Try another approach', 'Use to branch from a selected point in a run. Keep the original; optionally change explicit state assumptions to explore a different case. atStep is the number of existing timeline entries retained.'],
  finish_rehearsal: ['Inspect the outcome', 'Use when a rehearsal has reached an outcome or cannot proceed. Checks the recorded state against its outcome criteria and invariants, with links to the requirement versions tested.'],
};
export const readTools = new Set(['list_engagements', 'get_engagement', 'open_studio', 'search', 'fetch', 'observe_rehearsal', 'export_engagement', 'prepare_git_export']);

export function executeStudioTool(repository: WorkspaceRepository | null, actor: string, name: string, raw: unknown): Record<string, any> {
  const schema = toolSchemas[name];
  if (!schema) throw new DomainError('unknown_tool', 'This tool is not available.');
  const args = schema.parse(raw ?? {}) as Record<string, any>;
  if (name === 'save_engagement') {
    if (!repository) throw new DomainError('authentication_required', 'Sign in to save this workspace. You can continue without saving.');
    const snapshot = validatedSnapshot(args.workspace);
    const write = repository.create(actor, args.requestId, { tool: name, snapshot }, () => {
      const workspace = structuredClone(snapshot);
      workspace.engagement.id = `eng_${crypto.randomUUID()}`;
      workspace.engagement.createdAt = workspace.engagement.updatedAt = new Date().toISOString();
      return { workspace, result: { saved: true } };
    });
    return { ...write, storage: 'saved' };
  }
  const store = args.storage === 'stateless' ? new StatelessWorkspaceStore(args.workspace === undefined ? undefined : validatedSnapshot(args.workspace)) : repository;
  if (!store) throw new DomainError('authentication_required', 'Sign in to open saved work, or use stateless mode.');
  const reply = (data: Record<string, any>) => ({ ...data, storage: args.storage });
  // The domain receives only its own fields. State transport is outside its mutation contract.
  const { storage: _storage, workspace: _snapshot, telemetry: _telemetry, ...domainArgs } = args;
  const service = new WorkspaceService(store);
  if (name in inputSchemas) return reply(service.execute(name, domainArgs, actor));
  if (name === 'list_engagements') return reply({ engagements: service.list(actor) });
  if (name === 'open_studio') return {
    storage: args.storage,
    engagements: service.list(actor),
    ...(args.engagementId ? { workspace: service.get(args.engagementId, actor) } : {}),
  };
  if (name === 'get_engagement') return reply({ workspace: service.get(args.engagementId, actor) });
  if (name === 'export_engagement' || name === 'prepare_git_export') {
    const workspace = service.get(args.engagementId, actor);
    if (name === 'prepare_git_export') return reply({ result: prepareGitExport(workspace, { includeEvidence: args.includeEvidence }) });
    const bundle = buildExport(workspace, { includeEvidence: args.includeEvidence });
    return reply({ export: { filename: bundle.filename, mimeType: 'application/zip', blob: Buffer.from(bundle.zip).toString('base64') }, result: { filename: bundle.filename, manifest: bundle.manifest } });
  }
  if (name === 'search') {
    const workspaces = args.engagementId ? [service.get(args.engagementId, actor)] : service.list(actor).map(item => service.get(item.id, actor));
    const query = args.query.toLocaleLowerCase();
    return reply({ results: workspaces.flatMap(workspace => workspace.evidence.filter(item => `${item.title}\n${item.content}`.toLocaleLowerCase().includes(query)).map(item => {
      const position = Math.max(0, item.content.toLocaleLowerCase().indexOf(query) - 80);
      return { id: item.id, engagementId: workspace.engagement.id, title: item.title, text: item.content.slice(position, position + 600), version: item.version, url: item.uri ?? null };
    })).slice(0, 50) });
  }
  if (name === 'fetch') {
    const workspace = service.get(args.engagementId, actor);
    const source = [...workspace.evidence, ...(workspace.evidenceHistory ?? [])].find(item => item.id === args.evidenceId && (args.version === undefined || item.version === args.version));
    if (!source) throw new DomainError('not_found', 'That evidence version is not in this engagement.');
    return reply({ result: source });
  }
  if (name === 'observe_rehearsal') {
    const workspace = service.get(args.engagementId, actor);
    return reply(executeLab(workspace, name, domainArgs));
  }
  return reply(store.mutate(actor, args.engagementId, args.requestId, args.expectedRevision, { tool: name, args: domainArgs },
    workspace => executeLab(workspace, name, domainArgs)));
}

export function compactWorkspace(workspace: Workspace) {
  return {
    engagement: workspace.engagement, evidence: workspace.evidence,
    opportunities: workspace.opportunities, requirements: workspace.requirements, work: workspace.work,
    scenarios: workspace.scenarios.map(({ id, title, goal, opportunityId, version, assumptions }) => ({ id, title, goal, opportunityId, version, assumptions })),
    runs: workspace.runs.map(({ id, scenarioId, scenarioVersion, status, parentRunId, checks }) => ({ id, scenarioId, scenarioVersion, status, parentRunId, checks })),
  };
}

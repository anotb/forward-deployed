import { z } from 'zod';
import { DomainError, type Scenario, type State, type Workspace } from './model.js';
import type { WorkspaceRepository, WorkspaceWrite } from './store-contract.js';

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const id = z.string().trim().min(1).max(200);
const text = z.string().min(1).max(20_000);
const short = z.string().min(1).max(300);
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const date = z.iso.datetime({ offset: true });
const key = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/).refine(value => !value.split('.').some(part => forbidden.has(part)), 'Reserved key');
const value = z.union([z.string().max(16_000), z.number().finite(), z.boolean(), z.null(), z.array(z.string().max(2_000)).max(500)]);
const state = z.record(key, value).refine(object => Object.keys(object).length <= 100, 'At most 100 state fields');
const refs = z.array(z.object({ evidenceId: id, version, quote: text }).strict()).max(100);
const strings = z.array(text).max(100);
const evidence = z.object({
  id, title: short, kind: z.enum(['meeting', 'document', 'observation']), content: z.string().min(1).max(1_000_000),
  uri: z.string().max(2_000).url().refine(uri => /^https?:\/\//i.test(uri), 'Source links must use HTTP or HTTPS').optional(),
  originId: id.optional(), occurredAt: date.optional(), status: z.enum(['preliminary', 'final']), participants: z.array(short).max(100), version,
}).strict();
const opportunity = z.object({
  id, title: short, beneficiary: text, currentWorkflow: text, proposedService: text, whyItMatters: text, evidenceRefs: refs,
  measures: z.array(z.object({ name: short, unit: short, baseline: z.number().finite().optional(), target: z.number().finite().optional(), basis: text }).strict()).max(50),
  assumptions: strings, version,
}).strict();
const requirement = z.object({ id, opportunityId: id, title: short, behavior: text, acceptanceCriteria: strings.min(1), evidenceRefs: refs, status: z.enum(['proposed', 'confirmed']), version }).strict();
const work = z.object({ id, opportunityId: id, requirementIds: z.array(id).max(100), title: short, owner: z.string().max(20_000), status: z.enum(['planned', 'active', 'blocked', 'done']), outcome: text, evidence: z.string().max(20_000), version }).strict();
const operand = z.union([z.object({ literal: value }).strict(), z.object({ input: key }).strict(), z.object({ state: key }).strict()]);
const condition = z.object({ field: key, operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'includes']), value: operand }).strict();
const effect = z.object({ field: key, operation: z.enum(['set', 'increment', 'append']), value: operand }).strict();
const parameter = z.object({ type: z.enum(['string', 'number', 'boolean']), description: text, required: z.boolean(), enum: z.array(value).min(1).max(100).optional() }).strict();
const checkLink = { requirementId: id.optional(), requirementVersion: version.optional() };
const check = z.object({ id: key, label: text, kind: z.enum(['outcome', 'invariant']), condition, ...checkLink }).strict();
const checkResult = z.object({ id: key, label: text, kind: z.enum(['outcome', 'invariant']), passed: z.boolean(), actual: value, expected: value, ...checkLink }).strict();
const scenario = z.object({
  id, opportunityId: id, title: text, goal: text, initialState: state, observableKeys: z.array(key).min(1).max(100),
  actions: z.array(z.object({ id: key, title: text, description: text, parameters: z.record(key, parameter).refine(object => Object.keys(object).length <= 30, 'At most 30 action parameters'), preconditions: z.array(condition).max(50), effects: z.array(effect).min(1).max(50), response: z.enum(['success', 'timeout_after_commit']), idempotent: z.boolean() }).strict()).min(1).max(30),
  checks: z.array(check).min(1).max(100), assumptions: strings, version,
}).strict();
const step = z.object({ index: version, actionId: z.union([key, z.literal('$fork')]), intentId: id, inputs: state, status: z.enum(['committed', 'rejected', 'timeout']), message: text, before: state, after: state, checks: z.array(checkResult).max(100) }).strict();
const run = z.object({
  id, scenarioId: id, scenarioVersion: version, scenario, initialState: state, state, steps: z.array(step).max(1_000), status: z.enum(['running', 'finished']),
  parentRunId: id.optional(), forkedAtStep: z.number().int().nonnegative().max(1_000).optional(), checks: z.array(checkResult).max(100), createdAt: date, finishedAt: date.optional(),
}).strict();

/** Full import schema. Snapshots are user-supplied working documents, not signed audit records. */
export const workspaceSnapshotSchema = z.object({
  engagement: z.object({ id, name: short, ambition: text, customer: short, revision: version, createdAt: date, updatedAt: date }).strict(),
  evidence: z.array(evidence).max(200), opportunities: z.array(opportunity).max(200), requirements: z.array(requirement).max(500),
  work: z.array(work).max(500), scenarios: z.array(scenario).max(100), runs: z.array(run).max(100),
  evidenceHistory: z.array(evidence).max(500).optional(), requirementHistory: z.array(requirement).max(1_000).optional(), opportunityHistory: z.array(opportunity).max(500).optional(),
}).strict().superRefine((workspace, context) => {
  const problem = (message: string) => context.addIssue({ code: 'custom', message });
  const unique = (values: string[], label: string) => { if (new Set(values).size !== values.length) problem(`${label} must be unique.`); };
  for (const name of ['evidence', 'opportunities', 'requirements', 'work', 'scenarios', 'runs'] as const) unique(workspace[name].map(item => item.id), `${name} IDs`);
  const histories = [[workspace.evidence, workspace.evidenceHistory ?? []], [workspace.opportunities, workspace.opportunityHistory ?? []], [workspace.requirements, workspace.requirementHistory ?? []]] as const;
  for (const [current, history] of histories) {
    unique([...current, ...history].map(item => `${item.id}:${item.version}`), 'Record versions');
    for (const old of history) if (!current.some(item => item.id === old.id && item.version > old.version)) problem(`History ${old.id} must precede its current record.`);
  }
  const sources = new Map([...workspace.evidence, ...(workspace.evidenceHistory ?? [])].map(item => [`${item.id}:${item.version}`, item]));
  for (const item of [...workspace.opportunities, ...(workspace.opportunityHistory ?? []), ...workspace.requirements, ...(workspace.requirementHistory ?? [])]) {
    for (const ref of item.evidenceRefs) {
      const source = sources.get(`${ref.evidenceId}:${ref.version}`);
      if (!source || !ref.quote.trim() || !source.content.includes(ref.quote)) problem(`Evidence reference ${ref.evidenceId} must quote its selected version.`);
    }
  }
  const opportunities = new Set(workspace.opportunities.map(item => item.id));
  const requirements = new Map(workspace.requirements.map(item => [item.id, item]));
  const requirementVersions = new Map([...workspace.requirements, ...(workspace.requirementHistory ?? [])].map(item => [`${item.id}:${item.version}`, item]));
  for (const item of [...workspace.requirements, ...(workspace.requirementHistory ?? []), ...workspace.work, ...workspace.scenarios]) if (!opportunities.has(item.opportunityId)) problem(`Opportunity ${item.opportunityId} is missing.`);
  for (const item of workspace.work) for (const requirementId of item.requirementIds) if (requirements.get(requirementId)?.opportunityId !== item.opportunityId) problem(`Work requirement ${requirementId} must belong to the selected opportunity.`);
  function scenarioLinks(definition: Scenario): void {
    if (!opportunities.has(definition.opportunityId)) problem(`Scenario opportunity ${definition.opportunityId} is missing.`);
    unique(definition.actions.map(item => item.id), 'Scenario action IDs');
    unique(definition.checks.map(item => item.id), 'Scenario check IDs');
    unique(definition.observableKeys, 'Observable keys');
    if (!definition.checks.some(item => item.kind === 'outcome')) problem('A scenario needs at least one service outcome.');
    const field = (name: string) => { if (!Object.hasOwn(definition.initialState, name)) problem(`Unknown state field ${name}.`); };
    const expression = (item: z.infer<typeof condition> | z.infer<typeof effect>, parameters: object) => {
      field(item.field);
      if ('state' in item.value) field(item.value.state);
      if ('input' in item.value && !Object.hasOwn(parameters, item.value.input)) problem(`Unknown input ${item.value.input}.`);
    };
    definition.observableKeys.forEach(field);
    for (const action of definition.actions) {
      for (const parameter of Object.values(action.parameters)) if (parameter.enum?.some(item => typeof item !== parameter.type)) problem('Parameter enum values must match their declared type.');
      for (const item of [...action.preconditions, ...action.effects]) expression(item, action.parameters);
      for (const item of action.effects) {
        if (item.operation === 'increment' && typeof definition.initialState[item.field] !== 'number') problem('Increment requires numeric state.');
        if (item.operation === 'append' && !Array.isArray(definition.initialState[item.field])) problem('Append requires array state.');
      }
    }
    for (const item of definition.checks) {
      expression(item.condition, {});
      if (!!item.requirementId !== !!item.requirementVersion) problem('Requirement links need both ID and version.');
      if (item.requirementId && requirementVersions.get(`${item.requirementId}:${item.requirementVersion}`)?.opportunityId !== definition.opportunityId) problem('Check requirement must identify a version in this opportunity.');
    }
  }
  workspace.scenarios.forEach(scenarioLinks);
  const sameStateShape = (actual: State, initial: State) => Object.keys(actual).length === Object.keys(initial).length && Object.entries(initial).every(([key, value]) => Object.hasOwn(actual, key) && kind(actual[key]) === kind(value));
  for (const item of workspace.runs) {
    scenarioLinks(item.scenario);
    if (item.scenarioId !== item.scenario.id || item.scenarioVersion !== item.scenario.version || !workspace.scenarios.some(definition => definition.id === item.scenarioId && definition.version >= item.scenarioVersion)) problem('Run must identify its captured scenario version.');
    if (!sameStateShape(item.initialState, item.scenario.initialState) || !sameStateShape(item.state, item.initialState)) problem('Run state must match its scenario state fields and types.');
    if ((item.status === 'finished') !== !!item.finishedAt) problem('Run completion needs its finished timestamp.');
    if (!!item.parentRunId !== (item.forkedAtStep !== undefined)) problem('A fork needs its parent run and step.');
    if (item.parentRunId) {
      const parent = workspace.runs.find(parent => parent.id === item.parentRunId);
      if (!parent || parent.id === item.id || parent.scenarioId !== item.scenarioId || item.forkedAtStep! > parent.steps.length) problem('Run parent and fork step must exist in the same scenario.');
    }
    const checkResults = (results: z.infer<typeof checkResult>[]) => {
      unique(results.map(result => result.id), 'Check result IDs');
      if (results.length !== item.scenario.checks.length) problem('Results must cover the scenario checks.');
      for (const result of results) {
        const definition = item.scenario.checks.find(check => check.id === result.id);
        if (!definition || definition.kind !== result.kind || definition.requirementId !== result.requirementId || definition.requirementVersion !== result.requirementVersion) problem('Check result links must match the captured scenario.');
      }
    };
    checkResults(item.checks);
    for (const [index, step] of item.steps.entries()) {
      if (step.index !== index + 1) problem('Run step indexes must be sequential.');
      if (step.actionId !== '$fork' && !item.scenario.actions.some(action => action.id === step.actionId)) problem('Step action must exist in the captured scenario.');
      if (!sameStateShape(step.before, item.initialState) || !sameStateShape(step.after, item.initialState)) problem('Step state must match the scenario fields and types.');
      const previous = index === 0 ? item.initialState : item.steps[index - 1].after;
      if (canonical(previous) !== canonical(step.before)) problem('Step state must continue from the previous observation.');
      checkResults(step.checks);
    }
    if (canonical(item.state) !== canonical(item.steps.at(-1)?.after ?? item.initialState)) problem('Current run state must match the final observation.');
  }
});

function kind(value: unknown): string { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value; }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${JSON.stringify(key)}:${canonical(value)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** Bound and inspect plain JSON before parsing; no getters, toJSON hooks or code are accepted. */
export function validatedSnapshot(raw: unknown): Workspace {
  let count = 0;
  const ancestors = new Set<object>();
  function inspect(value: unknown, depth: number): void {
    if (++count > 100_000 || depth > 40) throw new DomainError('invalid_snapshot', 'Snapshot nesting or item count exceeds supported limits.');
    if (value === null || ['string', 'boolean'].includes(typeof value)) return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (typeof value !== 'object') throw new DomainError('invalid_snapshot', 'Snapshots must contain only JSON values.');
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) throw new DomainError('invalid_snapshot', 'Snapshots must contain only plain objects and arrays.');
    if (ancestors.has(value)) throw new DomainError('invalid_snapshot', 'Snapshot cannot contain cycles.');
    ancestors.add(value);
    for (const name of Reflect.ownKeys(value)) {
      if (typeof name !== 'string' || forbidden.has(name)) throw new DomainError('invalid_snapshot', 'Snapshot contains a reserved object key.');
      if (Array.isArray(value) && name === 'length') continue;
      const property = Object.getOwnPropertyDescriptor(value, name)!;
      if (!('value' in property)) throw new DomainError('invalid_snapshot', 'Snapshot cannot contain property accessors.');
      inspect(property.value, depth + 1);
    }
    ancestors.delete(value);
  }
  inspect(raw, 0);
  if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 1_048_576) throw new DomainError('snapshot_too_large', 'Workspace snapshots support at most 1 MiB. Start a separate engagement or export a smaller working copy.');
  const parsed = workspaceSnapshotSchema.safeParse(raw);
  if (!parsed.success) throw new DomainError('invalid_snapshot', parsed.error.issues.slice(0, 8).map(issue => `${issue.path.join('.') || 'workspace'}: ${issue.message}`).join('; '));
  return parsed.data;
}

function identifier(value: string, label: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new DomainError('invalid_input', `${label} must be a nonempty string of at most 200 characters.`);
}

/** Request-local repository. The caller carries returned snapshots between requests. */
export class StatelessWorkspaceStore implements WorkspaceRepository {
  private workspace?: Workspace;
  private actor?: string;
  private receipts = new Map<string, { fingerprint: string; write: WorkspaceWrite }>();

  constructor(snapshot?: Workspace) { if (snapshot !== undefined) this.workspace = validatedSnapshot(snapshot); }

  get(engagementId: string, actor = 'local'): Workspace {
    this.scope(actor);
    identifier(engagementId, 'engagementId');
    if (this.workspace?.engagement.id !== engagementId) throw new DomainError('not_found', 'Engagement not found in the supplied snapshot.');
    return structuredClone(this.workspace);
  }

  list(actor = 'local') { this.scope(actor); return this.workspace ? [structuredClone(this.workspace.engagement)] : []; }

  create(actor: string, requestId: string, args: unknown, build: () => WorkspaceWrite): WorkspaceWrite {
    return this.write(actor, '', requestId, args, () => {
      if (this.workspace) throw new DomainError('engagement_exists', 'This request already has a workspace. Omit the snapshot to start a new engagement.');
      const write = build();
      write.workspace.engagement.revision = 1;
      return write;
    });
  }

  mutate(actor: string, engagementId: string, requestId: string, expectedRevision: number, args: unknown, change: (workspace: Workspace) => WorkspaceWrite): WorkspaceWrite {
    identifier(engagementId, 'engagementId');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new DomainError('invalid_input', 'expectedRevision must be a positive integer.');
    return this.write(actor, engagementId, requestId, args, () => {
      const workspace = this.get(engagementId, actor);
      if (workspace.engagement.revision !== expectedRevision) throw new DomainError('revision_conflict', `Expected revision ${expectedRevision}; supplied snapshot is at revision ${workspace.engagement.revision}.`);
      const write = change(workspace);
      if (write.workspace.engagement.id !== engagementId) throw new DomainError('invalid_input', 'A write cannot move data between engagements.');
      write.workspace.engagement.revision = expectedRevision + 1;
      write.workspace.engagement.updatedAt = new Date().toISOString();
      return write;
    });
  }

  close(): void { this.workspace = undefined; this.actor = undefined; this.receipts.clear(); }

  private scope(actor: string): void {
    identifier(actor, 'actor');
    if (this.actor !== undefined && this.actor !== actor) throw new DomainError('not_found', 'This request belongs to another actor.');
    this.actor = actor;
  }

  private write(actor: string, scope: string, requestId: string, args: unknown, operation: () => WorkspaceWrite): WorkspaceWrite {
    this.scope(actor);
    identifier(requestId, 'requestId');
    const key = JSON.stringify([scope, requestId]);
    const fingerprint = canonical(args);
    const receipt = this.receipts.get(key);
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) throw new DomainError('idempotency_conflict', 'requestId was already used with different arguments in this request.');
      return structuredClone(receipt.write);
    }
    const write = operation();
    const workspace = validatedSnapshot(write.workspace);
    const response = structuredClone({ workspace, result: write.result });
    this.workspace = workspace;
    this.receipts.set(key, { fingerprint, write: response });
    return structuredClone(response);
  }
}

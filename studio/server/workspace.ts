import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DomainError, type Evidence, type EvidenceRef, type Opportunity, type Requirement, type WorkItem, type Workspace } from './model.js';
import type { WorkspaceRepository, WorkspaceWrite } from './store-contract.js';

const text = z.string().trim().min(1).max(20_000);
const short = z.string().trim().min(1).max(300);
const optionalText = z.string().trim().max(20_000);
const id = z.string().trim().min(1).max(200);
const ref = z.object({ evidenceId: id, version: z.number().int().positive(), quote: z.string().min(1).max(20_000) }).strict();
const measure = z.object({ name: short, unit: short, baseline: z.number().finite().optional(), target: z.number().finite().optional(), basis: text }).strict();
const mutation = { engagementId: id, requestId: id, expectedRevision: z.number().int().positive(), id: id.optional() };
const strings = z.array(text).max(100);

export const inputSchemas = {
  create_engagement: z.object({ requestId: id, name: short, ambition: text, customer: short }).strict(),
  add_evidence: z.object({
    ...mutation, title: short.optional(), kind: z.enum(['meeting', 'document', 'observation']).optional(),
    content: z.string().min(1).max(1_000_000).refine(value => value.trim().length > 0, 'Evidence content cannot be blank.').optional(),
    uri: z.string().trim().url().max(2_000).refine(value => ['https:', 'http:'].includes(new URL(value).protocol), 'Source links must use HTTP or HTTPS.').optional(),
    originId: id.optional(), occurredAt: z.iso.datetime({ offset: true }).optional(),
    status: z.enum(['preliminary', 'final']).optional(), participants: z.array(short).max(100).optional(),
  }).strict(),
  shape_opportunity: z.object({
    ...mutation, title: short.optional(), beneficiary: text.optional(), currentWorkflow: text.optional(),
    proposedService: text.optional(), whyItMatters: text.optional(), evidenceRefs: z.array(ref).max(100).optional(),
    measures: z.array(measure).max(50).optional(), assumptions: strings.optional(),
  }).strict(),
  define_requirement: z.object({
    ...mutation, opportunityId: id.optional(), title: short.optional(), behavior: text.optional(),
    acceptanceCriteria: strings.min(1).optional(), evidenceRefs: z.array(ref).max(100).optional(),
    status: z.enum(['proposed', 'confirmed']).optional(),
  }).strict(),
  plan_delivery: z.object({
    ...mutation, opportunityId: id.optional(), requirementIds: z.array(id).max(100).optional(),
    title: short.optional(), owner: optionalText.optional(), status: z.enum(['planned', 'active', 'blocked', 'done']).optional(),
    outcome: text.optional(), evidence: optionalText.optional(),
  }).strict(),
};

function required<T>(value: T | undefined, field: string): T {
  if (value === undefined) throw new DomainError('invalid_input', `${field} is required when creating this record.`);
  return value;
}

function prior<T extends { id: string }>(records: T[], value?: string): T | undefined {
  if (!value) return undefined;
  const record = records.find(item => item.id === value);
  if (!record) throw new DomainError('not_found', `Record ${value} not found in this engagement.`);
  return record;
}

function replace<T extends { id: string }>(records: T[], record: T): void {
  const index = records.findIndex(item => item.id === record.id);
  if (index < 0) records.push(record);
  else records[index] = record;
}

/** A quote refers to an immutable source version, including earlier meeting drafts. */
export function validateEvidenceRefs(workspace: Workspace, refs: EvidenceRef[]): void {
  for (const source of refs) {
    const evidence = [...workspace.evidence, ...(workspace.evidenceHistory ?? [])].find(item => item.id === source.evidenceId && item.version === source.version);
    if (!evidence) throw new DomainError('invalid_reference', `Evidence ${source.evidenceId} version ${source.version} does not exist in this engagement.`);
    if (!source.quote.trim() || !evidence.content.includes(source.quote)) throw new DomainError('invalid_quote', `Quoted passage is not present in evidence ${source.evidenceId} version ${source.version}.`);
  }
}

export class WorkspaceService {
  constructor(public readonly store: WorkspaceRepository) {}
  get(engagementId: string, actor = 'local'): Workspace { return this.store.get(engagementId, actor); }
  list(actor = 'local') { return this.store.list(actor); }

  execute(name: string, args: unknown, actor = 'local'): WorkspaceWrite {
    if (!Object.hasOwn(inputSchemas, name)) throw new DomainError('unknown_tool', `Unknown workspace tool: ${name}`);
    const schema = inputSchemas[name as keyof typeof inputSchemas];
    const parsed = schema.safeParse(args);
    if (!parsed.success) throw new DomainError('invalid_input', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    const data = parsed.data;
    if (name === 'create_engagement') {
      const input = data as z.infer<typeof inputSchemas.create_engagement>;
      return this.store.create(actor, input.requestId, { tool: name, args: data }, () => {
        const now = new Date().toISOString();
        const engagement = { id: randomUUID(), name: input.name, customer: input.customer, ambition: input.ambition, revision: 1, createdAt: now, updatedAt: now };
        const workspace: Workspace = { engagement, evidence: [], opportunities: [], requirements: [], work: [], scenarios: [], runs: [] };
        return { workspace, result: { engagementId: engagement.id } };
      });
    }
    const envelope = data as { engagementId: string; expectedRevision: number; requestId: string };
    return this.store.mutate(actor, envelope.engagementId, envelope.requestId, envelope.expectedRevision, { tool: name, args: data }, workspace => {
      if (name === 'add_evidence') return this.addEvidence(workspace, data as z.infer<typeof inputSchemas.add_evidence>);
      if (name === 'shape_opportunity') return this.shapeOpportunity(workspace, data as z.infer<typeof inputSchemas.shape_opportunity>);
      if (name === 'define_requirement') return this.defineRequirement(workspace, data as z.infer<typeof inputSchemas.define_requirement>);
      return this.planDelivery(workspace, data as z.infer<typeof inputSchemas.plan_delivery>);
    });
  }

  private addEvidence(workspace: Workspace, input: z.infer<typeof inputSchemas.add_evidence>): WorkspaceWrite {
    const old = prior(workspace.evidence, input.id);
    const evidence: Evidence = {
      id: old?.id ?? randomUUID(), title: required(input.title ?? old?.title, 'title'),
      kind: required(input.kind ?? old?.kind, 'kind'), content: required(input.content ?? old?.content, 'content'),
      status: input.status ?? old?.status ?? 'preliminary', participants: input.participants ?? old?.participants ?? [],
      version: (old?.version ?? 0) + 1,
    };
    const uri = input.uri ?? old?.uri;
    const originId = input.originId ?? old?.originId;
    const occurredAt = input.occurredAt ?? old?.occurredAt;
    if (uri) evidence.uri = uri;
    if (originId) evidence.originId = originId;
    if (occurredAt) evidence.occurredAt = occurredAt;
    if (old) (workspace.evidenceHistory ??= []).push(old);
    replace(workspace.evidence, evidence);
    return { workspace, result: { evidence } };
  }

  private shapeOpportunity(workspace: Workspace, input: z.infer<typeof inputSchemas.shape_opportunity>): WorkspaceWrite {
    const old = prior(workspace.opportunities, input.id);
    const opportunity: Opportunity = {
      id: old?.id ?? randomUUID(), title: required(input.title ?? old?.title, 'title'),
      beneficiary: required(input.beneficiary ?? old?.beneficiary, 'beneficiary'),
      currentWorkflow: required(input.currentWorkflow ?? old?.currentWorkflow, 'currentWorkflow'),
      proposedService: required(input.proposedService ?? old?.proposedService, 'proposedService'),
      whyItMatters: required(input.whyItMatters ?? old?.whyItMatters, 'whyItMatters'),
      evidenceRefs: input.evidenceRefs ?? old?.evidenceRefs ?? [], measures: input.measures ?? old?.measures ?? [],
      assumptions: input.assumptions ?? old?.assumptions ?? [], version: (old?.version ?? 0) + 1,
    };
    validateEvidenceRefs(workspace, opportunity.evidenceRefs);
    if (old) (workspace.opportunityHistory ??= []).push(old);
    replace(workspace.opportunities, opportunity);
    return { workspace, result: { opportunity } };
  }

  private defineRequirement(workspace: Workspace, input: z.infer<typeof inputSchemas.define_requirement>): WorkspaceWrite {
    const old = prior(workspace.requirements, input.id);
    const requirement: Requirement = {
      id: old?.id ?? randomUUID(), opportunityId: required(input.opportunityId ?? old?.opportunityId, 'opportunityId'),
      title: required(input.title ?? old?.title, 'title'), behavior: required(input.behavior ?? old?.behavior, 'behavior'),
      acceptanceCriteria: required(input.acceptanceCriteria ?? old?.acceptanceCriteria, 'acceptanceCriteria'),
      evidenceRefs: input.evidenceRefs ?? old?.evidenceRefs ?? [], status: input.status ?? old?.status ?? 'proposed', version: (old?.version ?? 0) + 1,
    };
    prior(workspace.opportunities, requirement.opportunityId);
    if (old && old.opportunityId !== requirement.opportunityId) throw new DomainError('invalid_reference', 'A requirement stays with its opportunity. Create a separate requirement for another opportunity.');
    validateEvidenceRefs(workspace, requirement.evidenceRefs);
    if (old) (workspace.requirementHistory ??= []).push(old);
    replace(workspace.requirements, requirement);
    return { workspace, result: { requirement } };
  }

  private planDelivery(workspace: Workspace, input: z.infer<typeof inputSchemas.plan_delivery>): WorkspaceWrite {
    const old = prior(workspace.work, input.id);
    const work: WorkItem = {
      id: old?.id ?? randomUUID(), opportunityId: required(input.opportunityId ?? old?.opportunityId, 'opportunityId'),
      requirementIds: [...new Set(input.requirementIds ?? old?.requirementIds ?? [])], title: required(input.title ?? old?.title, 'title'),
      owner: input.owner ?? old?.owner ?? '', status: input.status ?? old?.status ?? 'planned',
      outcome: required(input.outcome ?? old?.outcome, 'outcome'), evidence: input.evidence ?? old?.evidence ?? '', version: (old?.version ?? 0) + 1,
    };
    prior(workspace.opportunities, work.opportunityId);
    for (const requirementId of work.requirementIds) {
      const requirement = prior(workspace.requirements, requirementId)!;
      if (requirement.opportunityId !== work.opportunityId) throw new DomainError('invalid_reference', 'Delivery requirements must belong to the selected opportunity.');
    }
    // Delivery status records work completion; only the lab computes rehearsal outcomes.
    replace(workspace.work, work);
    return { workspace, result: { work } };
  }
}

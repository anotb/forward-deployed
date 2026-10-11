import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DomainError, type ChangeFields, type ChangeImpact, type ChangeKind, type ChangeProposal, type ProposedChange, type Workspace } from './model.js';
import { inputSchemas, WorkspaceService } from './workspace.js';

const id = z.string().trim().min(1).max(200);
const version = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const short = z.string().trim().min(1).max(300);
const text = z.string().trim().min(1).max(20_000);
const envelope = { engagementId: id, requestId: id, expectedRevision: version };
const omitted = { engagementId: true, requestId: true, expectedRevision: true, id: true } as const;
export const changeFieldSchemas = {
  evidence: inputSchemas.add_evidence.omit(omitted),
  opportunity: inputSchemas.shape_opportunity.omit(omitted),
  requirement: inputSchemas.define_requirement.omit(omitted),
  work: inputSchemas.plan_delivery.omit(omitted),
};
const changeBase = { id, operation: z.enum(['create', 'update']), recordId: id, expectedVersion: version.optional() };
const changeSchema = z.discriminatedUnion('kind', [
  z.object({ ...changeBase, kind: z.literal('evidence'), fields: changeFieldSchemas.evidence }).strict(),
  z.object({ ...changeBase, kind: z.literal('opportunity'), fields: changeFieldSchemas.opportunity }).strict(),
  z.object({ ...changeBase, kind: z.literal('requirement'), fields: changeFieldSchemas.requirement }).strict(),
  z.object({ ...changeBase, kind: z.literal('work'), fields: changeFieldSchemas.work }).strict(),
]).superRefine((change, context) => {
  if ((change.operation === 'update') !== (change.expectedVersion !== undefined)) context.addIssue({ code: 'custom', message: 'Updates require expectedVersion; creates must omit it.' });
  if (!Object.keys(change.fields).length) context.addIssue({ code: 'custom', message: 'Provide at least one changed field.' });
});
const decision = z.object({ changeId: id, decision: z.enum(['accept', 'reject', 'revise']), fields: z.record(z.string(), z.unknown()).optional(), note: text.optional() }).strict().superRefine((value, context) => {
  if ((value.decision === 'revise') !== (value.fields !== undefined)) context.addIssue({ code: 'custom', message: 'Only revise decisions require fields; accept and reject cannot change fields.' });
});
export const reviewInputSchemas = {
  propose_changes: z.object({ ...envelope, title: short, reason: text, changes: z.array(changeSchema).min(1).max(30) }).strict(),
  review_changes: z.object({ ...envelope, proposalId: id, expectedProposalVersion: version, decisions: z.array(decision).min(1).max(30) }).strict(),
};
// Stored union members include their audit fields; intersection of strict input
// objects would reject those fields, so inspect the input projection separately.
const storedChangeSchema = z.object({
  ...changeBase, kind: z.enum(['evidence', 'opportunity', 'requirement', 'work']), fields: z.record(z.string(), z.unknown()),
  status: z.enum(['pending', 'accepted', 'rejected']), before: z.record(z.string(), z.unknown()).optional(),
  reviewedAt: z.iso.datetime({ offset: true }).optional(), note: text.optional(),
}).strict().superRefine((value, context) => {
  const { status, before, reviewedAt, note, ...input } = value;
  const checked = changeSchema.safeParse(input);
  if (!checked.success) for (const issue of checked.error.issues) context.addIssue({ code: 'custom', message: issue.message, path: issue.path });
  if ((value.operation === 'update') !== (before !== undefined)) context.addIssue({ code: 'custom', message: 'Updated records retain their original version for review.' });
  if ((status !== 'pending') !== (reviewedAt !== undefined)) context.addIssue({ code: 'custom', message: 'Decided changes need their review timestamp.' });
});
export const changeProposalSchema = z.object({
  id, title: short, reason: text, version, baseRevision: version, status: z.enum(['pending', 'resolved']),
  createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
  changes: z.array(storedChangeSchema).min(1).max(30),
  reviews: z.array(z.object({ at: z.iso.datetime({ offset: true }), changeId: id, decision: z.enum(['accept', 'reject', 'revise']), note: text.optional(), previousFields: z.record(z.string(), z.unknown()).optional() }).strict()).max(300),
}).strict().superRefine((proposal, context) => {
  const problem = (message: string) => context.addIssue({ code: 'custom', message });
  if (new Set(proposal.changes.map(change => change.id)).size !== proposal.changes.length) problem('Change IDs must be unique.');
  if (new Set(proposal.changes.map(change => `${change.kind}:${change.recordId}`)).size !== proposal.changes.length) problem('Target records must be unique.');
  if ((proposal.status === 'pending') !== proposal.changes.some(change => change.status === 'pending')) problem('Proposal status must match its remaining decisions.');
  for (const event of proposal.reviews) {
    const change = proposal.changes.find(change => change.id === event.changeId);
    if (!change) problem('Review event must identify a proposal change.');
    if ((event.decision === 'revise') !== (event.previousFields !== undefined)) problem('Revision events retain previous fields.');
    if (change && event.previousFields && !changeFieldSchemas[change.kind].safeParse(event.previousFields).success) problem('Previous fields must match the record kind.');
  }
});

const collections = { evidence: 'evidence', opportunity: 'opportunities', requirement: 'requirements', work: 'work' } as const;
const tools = { evidence: 'add_evidence', opportunity: 'shape_opportunity', requirement: 'define_requirement', work: 'plan_delivery' } as const;
const order: Record<ChangeKind, number> = { evidence: 0, opportunity: 1, requirement: 2, work: 3 };
const records = (workspace: Workspace, kind: ChangeKind) => workspace[collections[kind]];

function conflict(workspace: Workspace, change: ProposedChange): string | undefined {
  const current = records(workspace, change.kind).find(record => record.id === change.recordId);
  if (change.operation === 'create') return current ? `Record ${change.recordId} now exists. Create a new proposal with another ID.` : undefined;
  if (!current || current.version !== change.expectedVersion) return `Record ${change.recordId} changed from version ${change.expectedVersion} to ${current?.version ?? 'missing'}. Read the current record and create a new proposal.`;
  return undefined;
}

/** Dependency and version facts only. No generated impact score or causal claim. */
export function buildChangeImpact(workspace: Workspace, changes: ProposedChange[]): ChangeImpact {
  const pending = changes.filter(change => change.status === 'pending');
  const opportunities = new Set(pending.filter(change => change.kind === 'opportunity').map(change => change.recordId));
  const sources = new Map(pending.filter(change => change.kind === 'evidence').map(change => [change.recordId, (change.expectedVersion ?? 0) + 1]));
  const requirementVersions = new Map(pending.filter(change => change.kind === 'requirement').map(change => [change.recordId, (change.expectedVersion ?? 0) + 1]));
  const requirements = new Set(requirementVersions.keys());
  const impact: ChangeImpact = { requirements: [], work: [], scenarios: [], runs: [], staleChecks: [], staleEvidenceRefs: [], conflicts: [] };
  for (const change of pending) {
    const message = conflict(workspace, change);
    if (message) impact.conflicts.push({ changeId: change.id, message });
  }
  for (const [kind, items] of [['opportunity', workspace.opportunities], ['requirement', workspace.requirements]] as const) {
    for (const record of items) for (const ref of (pending.find(change => change.kind === kind && change.recordId === record.id)?.fields as { evidenceRefs?: typeof record.evidenceRefs } | undefined)?.evidenceRefs ?? record.evidenceRefs) {
      const proposedVersion = sources.get(ref.evidenceId);
      if (proposedVersion && ref.version < proposedVersion) {
        impact.staleEvidenceRefs.push({ kind, recordId: record.id, evidenceId: ref.evidenceId, citedVersion: ref.version, proposedVersion });
        if (kind === 'requirement') requirements.add(record.id); else opportunities.add(record.id);
      }
    }
  }
  for (const requirement of workspace.requirements) if (opportunities.has(requirement.opportunityId)) requirements.add(requirement.id);
  impact.requirements = [...requirements];
  impact.work = [...new Set([...pending.filter(change => change.kind === 'work').map(change => change.recordId), ...workspace.work.filter(work => opportunities.has(work.opportunityId) || work.requirementIds.some(id => requirements.has(id))).map(work => work.id)])];
  for (const scenario of workspace.scenarios) {
    if (opportunities.has(scenario.opportunityId) || scenario.checks.some(check => check.requirementId && requirements.has(check.requirementId))) impact.scenarios.push(scenario.id);
    for (const check of scenario.checks) {
      const proposedVersion = check.requirementId && requirementVersions.get(check.requirementId);
      if (proposedVersion && check.requirementVersion && check.requirementVersion < proposedVersion) impact.staleChecks.push({ scenarioId: scenario.id, requirementId: check.requirementId!, testedVersion: check.requirementVersion, proposedVersion });
    }
  }
  impact.runs = workspace.runs.filter(run => impact.scenarios.includes(run.scenarioId) || run.scenario.checks.some(check => check.requirementId && requirements.has(check.requirementId))).map(run => run.id);
  return impact;
}

export function changeImpacts(workspace: Workspace): Record<string, ChangeImpact> {
  return Object.fromEntries((workspace.changeProposals ?? []).filter(proposal => proposal.status === 'pending').map(proposal => [proposal.id, buildChangeImpact(workspace, proposal.changes)]));
}

function apply(service: WorkspaceService, workspace: Workspace, changes: ProposedChange[]): void {
  for (const change of [...changes].sort((a, b) => order[a.kind] - order[b.kind])) {
    const problem = conflict(workspace, change);
    if (problem) throw new DomainError('stale_proposal', problem);
    service.applyChange(workspace, tools[change.kind], { ...change.fields, ...(change.operation === 'update' ? { id: change.recordId } : {}) }, change.operation === 'create' ? change.recordId : undefined);
  }
}

function unique(values: string[], message: string): void {
  if (new Set(values).size !== values.length) throw new DomainError('invalid_input', message);
}

export function executeReview(service: WorkspaceService, name: keyof typeof reviewInputSchemas, raw: unknown, actor = 'local') {
  const parsed = reviewInputSchemas[name].safeParse(raw);
  if (!parsed.success) throw new DomainError('invalid_input', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  const input = parsed.data;
  return service.store.mutate(actor, input.engagementId, input.requestId, input.expectedRevision, { tool: name, args: input }, workspace => {
    const now = new Date().toISOString();
    if (name === 'propose_changes') {
      const args = input as z.infer<typeof reviewInputSchemas.propose_changes>;
      if ((workspace.changeProposals?.length ?? 0) >= 100) throw new DomainError('proposal_limit', 'An engagement supports at most 100 change proposals. Export this engagement and start another when needed.');
      unique(args.changes.map(change => change.id), 'Change IDs must be unique within a proposal.');
      unique(args.changes.map(change => `${change.kind}:${change.recordId}`), 'Propose each target record once.');
      const changes: ProposedChange[] = args.changes.map(change => {
        const before = records(workspace, change.kind).find(record => record.id === change.recordId);
        return { ...change, status: 'pending', ...(change.operation === 'update' && before ? { before: structuredClone(before) } : {}) };
      });
      // Validate the entire proposed result without changing the engagement.
      apply(service, structuredClone(workspace), changes);
      const proposal: ChangeProposal = { id: randomUUID(), title: args.title, reason: args.reason, version: 1, baseRevision: workspace.engagement.revision, status: 'pending', createdAt: now, updatedAt: now, changes, reviews: [] };
      (workspace.changeProposals ??= []).push(proposal);
      return { workspace, result: { proposal, impact: buildChangeImpact(workspace, changes) } };
    }
    const args = input as z.infer<typeof reviewInputSchemas.review_changes>;
    const proposal = workspace.changeProposals?.find(proposal => proposal.id === args.proposalId);
    if (!proposal) throw new DomainError('not_found', 'Change proposal not found in this engagement.');
    if (proposal.version !== args.expectedProposalVersion) throw new DomainError('proposal_conflict', `Expected proposal version ${args.expectedProposalVersion}; current version is ${proposal.version}. Read the current proposal before reviewing.`);
    unique(args.decisions.map(decision => decision.changeId), 'Each change can be reviewed once per request.');
    if (proposal.reviews.length + args.decisions.length > 300) throw new DomainError('proposal_limit', 'This proposal has reached its review history limit. Create a new proposal.');
    const accepted: ProposedChange[] = [];
    for (const decision of args.decisions) {
      const change = proposal.changes.find(change => change.id === decision.changeId);
      if (!change) throw new DomainError('not_found', `Change ${decision.changeId} is not part of this proposal.`);
      if (change.status !== 'pending') throw new DomainError('already_reviewed', `Change ${change.id} has already been ${change.status}.`);
      const event = { at: now, changeId: change.id, decision: decision.decision, ...(decision.note ? { note: decision.note } : {}) };
      if (decision.decision === 'revise') {
        const patch = changeFieldSchemas[change.kind].safeParse(decision.fields);
        if (!patch.success || !Object.keys(patch.data).length) throw new DomainError('invalid_input', 'Revisions must supply valid fields for this record type.');
        proposal.reviews.push({ ...event, previousFields: structuredClone(change.fields) });
        change.fields = { ...change.fields, ...patch.data } as ChangeFields;
      } else {
        proposal.reviews.push(event);
        if (decision.decision === 'accept') accepted.push(change);
        change.status = decision.decision === 'accept' ? 'accepted' : 'rejected';
        change.reviewedAt = now;
      }
      if (decision.note) change.note = decision.note;
    }
    const impact = buildChangeImpact(workspace, accepted.map(change => ({ ...change, status: 'pending' })));
    // One repository transaction applies the selected subset. A missing dependency
    // or stale version rejects every decision in this call, including rejections.
    apply(service, workspace, accepted);
    const revised = args.decisions.filter(decision => decision.decision === 'revise');
    if (revised.length) {
      // Check each revised target against current versions, and validate its fields
      // with still-pending dependencies. Unrelated stale changes do not block it.
      const pending = proposal.changes.filter(change => change.status === 'pending');
      for (const decision of revised) {
        const change = pending.find(change => change.id === decision.changeId)!;
        const problem = conflict(workspace, change);
        if (problem) throw new DomainError('stale_proposal', problem);
      }
      apply(service, structuredClone(workspace), pending.filter(change => !conflict(workspace, change)));
    }
    proposal.version += 1; proposal.updatedAt = now;
    proposal.status = proposal.changes.some(change => change.status === 'pending') ? 'pending' : 'resolved';
    return { workspace, result: { proposal, impact, pendingImpact: buildChangeImpact(workspace, proposal.changes) } };
  });
}

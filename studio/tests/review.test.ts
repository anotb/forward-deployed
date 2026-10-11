import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError, type Workspace } from '../server/model.js';
import { executeStudioTool } from '../server/service.js';
import { validatedSnapshot } from '../server/stateless.js';
import { WorkspaceStore } from '../server/store.js';
import { buildChangeImpact, executeReview } from '../server/review.js';
import { WorkspaceService } from '../server/workspace.js';
import { buildExport } from '../server/export.js';

const code = (expected: string) => (error: unknown) => error instanceof DomainError && error.code === expected;
function fixture() {
  let workspace = executeStudioTool(null, 'local', 'create_engagement', { requestId: 'start', name: 'Repair concierge', customer: 'Workshop', ambition: 'Book a complete repair during the first call.' }).workspace as Workspace;
  let sequence = 0;
  function call(name: string, args: Record<string, unknown>) {
    const result = executeStudioTool(null, 'local', name, { workspace, engagementId: workspace.engagement.id, requestId: `call-${++sequence}`, expectedRevision: workspace.engagement.revision, ...args });
    if (result.workspace) workspace = result.workspace;
    return result;
  }
  call('add_evidence', { title: 'Discovery', kind: 'meeting', content: 'Operators need a repair booking during the call.' });
  call('shape_opportunity', { title: 'Immediate booking', beneficiary: 'Operators', currentWorkflow: 'Call dispatch and wait.', proposedService: 'Book a repair during the call.', whyItMatters: 'Leave the call with a plan.', evidenceRefs: [{ evidenceId: workspace.evidence[0].id, version: 1, quote: 'Operators need a repair booking during the call.' }] });
  call('define_requirement', { opportunityId: workspace.opportunities[0].id, title: 'Confirm booking', behavior: 'Create one repair booking.', acceptanceCriteria: ['One booking is confirmed.'], evidenceRefs: [{ evidenceId: workspace.evidence[0].id, version: 1, quote: 'Operators need a repair booking during the call.' }] });
  call('plan_delivery', { opportunityId: workspace.opportunities[0].id, requirementIds: [workspace.requirements[0].id], title: 'Booking adapter', outcome: 'Book the appointment.' });
  call('define_rehearsal', { opportunityId: workspace.opportunities[0].id, title: 'Book a repair', goal: 'Confirm one appointment.', initialState: { booked: false }, observableKeys: ['booked'], assumptions: ['An engineer is available.'], actions: [{ id: 'book', title: 'Book engineer', description: 'Confirm appointment.', parameters: {}, preconditions: [], effects: [{ field: 'booked', operation: 'set', value: { literal: true } }], response: 'success', idempotent: true }], checks: [{ id: 'appointment', label: 'Repair confirmed', kind: 'outcome', condition: { field: 'booked', operator: 'eq', value: { literal: true } }, requirementId: workspace.requirements[0].id }] });
  call('start_rehearsal', { scenarioId: workspace.scenarios[0].id });
  const propose = (changes: unknown[]) => call('propose_changes', { title: 'After operator review', reason: 'Operators clarified their booking workflow.', changes });
  const review = (decisions: unknown[]) => {
    const proposal = workspace.changeProposals!.at(-1)!;
    return call('review_changes', { proposalId: proposal.id, expectedProposalVersion: proposal.version, decisions });
  };
  return { call, propose, review, current: () => workspace };
}

test('proposals do not apply records; impact identifies dependencies and accepted updates preserve runs and versions', () => {
  const f = fixture(), original = structuredClone(f.current());
  const response = f.propose([
    { id: 'scope', kind: 'requirement', operation: 'update', recordId: original.requirements[0].id, expectedVersion: 1, fields: { behavior: 'Confirm one booking after the operator approves the time.' } },
    { id: 'owner', kind: 'work', operation: 'update', recordId: original.work[0].id, expectedVersion: 1, fields: { owner: 'Delivery lead' } },
  ]);
  assert.deepEqual(f.current().requirements, original.requirements);
  assert.deepEqual(response.result.impact.work, [original.work[0].id]);
  assert.deepEqual(response.result.impact.runs, [original.runs[0].id]);
  assert.equal(response.result.impact.staleChecks[0].testedVersion, 1);
  assert.equal(response.result.impact.staleChecks[0].proposedVersion, 2);
  f.review([{ changeId: 'scope', decision: 'accept' }, { changeId: 'owner', decision: 'reject', note: 'Owner is not agreed yet.' }]);
  assert.equal(f.current().requirements[0].version, 2);
  assert.deepEqual(f.current().requirementHistory, original.requirements);
  assert.deepEqual(f.current().runs, original.runs);
  assert.deepEqual(f.current().scenarios, original.scenarios);
  assert.deepEqual(f.current().work, original.work);
  assert.equal(f.current().changeProposals![0].status, 'resolved');
  assert.deepEqual(validatedSnapshot(JSON.parse(JSON.stringify(f.current()))), f.current());
});

test('accepted dependent creations apply together in dependency order and retain stable IDs', () => {
  const f = fixture(), opportunityId = f.current().opportunities[0].id;
  f.propose([
    { id: 'delivery', kind: 'work', operation: 'create', recordId: 'work-new', fields: { opportunityId, requirementIds: ['req-new'], title: 'Approval step', outcome: 'Capture approval.' } },
    { id: 'requirement', kind: 'requirement', operation: 'create', recordId: 'req-new', fields: { opportunityId, title: 'Ask approval', behavior: 'Ask before booking.', acceptanceCriteria: ['Approval is recorded.'] } },
  ]);
  const original = structuredClone(f.current());
  assert.throws(() => f.review([{ changeId: 'delivery', decision: 'accept' }, { changeId: 'requirement', decision: 'reject' }]), code('not_found'));
  assert.deepEqual(f.current(), original, 'Missing dependency rejects the entire review transaction.');
  f.review([{ changeId: 'delivery', decision: 'accept' }, { changeId: 'requirement', decision: 'accept' }]);
  assert.equal(f.current().requirements.at(-1)!.id, 'req-new');
  assert.deepEqual(f.current().work.at(-1)!.requirementIds, ['req-new']);
});

test('revise retains earlier suggestions, stays pending, and applies only after a later acceptance', () => {
  const f = fixture(), recordId = f.current().work[0].id;
  f.propose([{ id: 'owner', kind: 'work', operation: 'update', recordId, expectedVersion: 1, fields: { owner: 'Alex', status: 'active' } }]);
  f.review([{ changeId: 'owner', decision: 'revise', fields: { owner: 'Sam' }, note: 'Sam owns the adapter.' }]);
  assert.equal(f.current().work[0].owner, '');
  assert.equal(f.current().changeProposals![0].changes[0].status, 'pending');
  assert.deepEqual(f.current().changeProposals![0].reviews[0].previousFields, { owner: 'Alex', status: 'active' });
  f.review([{ changeId: 'owner', decision: 'accept' }]);
  assert.equal(f.current().work[0].owner, 'Sam');
  assert.equal(f.current().work[0].status, 'active');
  assert.equal(f.current().workHistory![0].owner, '');
});

test('stale targets reject acceptance and revision but can still be rejected', () => {
  const f = fixture(), recordId = f.current().work[0].id;
  f.propose([{ id: 'owner', kind: 'work', operation: 'update', recordId, expectedVersion: 1, fields: { owner: 'Alex' } }]);
  const updated = f.call('plan_delivery', { id: recordId, owner: 'Sam' });
  assert.equal(updated.changeImpacts[f.current().changeProposals![0].id].conflicts.length, 1, 'Every workspace write refreshes proposal impact.');
  assert.throws(() => f.review([{ changeId: 'owner', decision: 'accept' }]), code('stale_proposal'));
  assert.throws(() => f.review([{ changeId: 'owner', decision: 'revise', fields: { owner: 'Jo' } }]), code('stale_proposal'));
  const read = f.call('get_engagement', {});
  assert.equal(read.changeImpacts[f.current().changeProposals![0].id].conflicts.length, 1);
  f.review([{ changeId: 'owner', decision: 'reject' }]);
  assert.equal(f.current().work[0].owner, 'Sam');
});

test('saved review retries are idempotent and old proposal versions do not overwrite a later review', t => {
  const store = new WorkspaceStore(); t.after(() => store.close());
  const imported = executeStudioTool(store, 'owner', 'save_engagement', { requestId: 'save', workspace: fixture().current() }).workspace as Workspace;
  const service = new WorkspaceService(store);
  const proposed = executeReview(service, 'propose_changes', { engagementId: imported.engagement.id, requestId: 'propose', expectedRevision: imported.engagement.revision, title: 'Assign owner', reason: 'Delivery planning.', changes: [{ id: 'owner', kind: 'work', operation: 'update', recordId: imported.work[0].id, expectedVersion: 1, fields: { owner: 'Alex' } }] }, 'owner');
  const args = { engagementId: imported.engagement.id, requestId: 'review', expectedRevision: proposed.workspace.engagement.revision, proposalId: proposed.workspace.changeProposals![0].id, expectedProposalVersion: 1, decisions: [{ changeId: 'owner', decision: 'accept' }] };
  const first = executeReview(service, 'review_changes', args, 'owner');
  assert.deepEqual(executeReview(service, 'review_changes', args, 'owner'), first);
  assert.equal(service.get(imported.engagement.id, 'owner').workHistory!.length, 1);
  assert.throws(() => executeReview(service, 'review_changes', { ...args, requestId: 'different', expectedRevision: first.workspace.engagement.revision }, 'owner'), code('proposal_conflict'));
});

test('proposal validation rejects unsupported operations, unknown fields, duplicate targets and invalid references', () => {
  const f = fixture(), recordId = f.current().work[0].id;
  const change = { id: 'owner', kind: 'work', operation: 'update', recordId, expectedVersion: 1, fields: { owner: 'Alex' } };
  assert.throws(() => f.propose([{ ...change, operation: 'execute' }]));
  assert.throws(() => f.propose([{ ...change, fields: { script: 'run arbitrary code' } }]));
  assert.throws(() => f.propose([{ ...change, expectedVersion: undefined }]));
  assert.throws(() => f.propose([change, { ...change, id: 'other' }]), code('invalid_input'));
  assert.throws(() => f.propose([{ ...change, fields: { requirementIds: ['missing'] } }]), code('not_found'));
  f.propose([change]);
  assert.throws(() => f.review([{ changeId: 'owner', decision: 'accept', fields: { owner: 'Someone else' } }]));
  const malformed = structuredClone(f.current());
  malformed.changeProposals![0].changes[0].before = { id: recordId, version: 1 } as never;
  assert.throws(() => validatedSnapshot(malformed), code('invalid_snapshot'));
});

test('evidence impact preserves exact cited versions, and portable exports retain review data without leaking excluded evidence', () => {
  const f = fixture(), original = structuredClone(f.current());
  f.propose([{ id: 'meeting', kind: 'evidence', operation: 'update', recordId: original.evidence[0].id, expectedVersion: 1, fields: { content: 'Private revised meeting passage.', status: 'final' } }]);
  const impact = buildChangeImpact(f.current(), f.current().changeProposals![0].changes);
  assert.equal(impact.staleEvidenceRefs.length, 2);
  assert.deepEqual(impact.runs, [original.runs[0].id]);
  f.review([{ changeId: 'meeting', decision: 'accept', note: 'Private revised meeting passage.' }]);
  assert.deepEqual(f.current().evidenceHistory, original.evidence);
  assert.equal(f.current().requirements[0].evidenceRefs[0].version, 1);
  const exported = buildExport(f.current());
  const snapshot = JSON.parse(Object.entries(exported.files).find(([path]) => path.endsWith('/workspace.json'))![1]);
  assert.deepEqual(validatedSnapshot(snapshot), f.current());
  assert.ok(Object.keys(exported.files).some(path => path.endsWith('/changes.md')));
  const excluded = buildExport(f.current(), { includeEvidence: false });
  assert.ok(!Object.values(excluded.files).join('\n').includes('Private revised meeting passage.'));
  assert.equal(JSON.parse(Object.entries(excluded.files).find(([path]) => path.endsWith('/workspace.json'))![1]).changeProposals, undefined);
});


test('saving an in-progress review keeps its original revision provenance and remains portable', t => {
  const f = fixture();
  f.propose([{ id: 'owner', kind: 'work', operation: 'update', recordId: f.current().work[0].id, expectedVersion: 1, fields: { owner: 'Alex' } }]);
  const store = new WorkspaceStore(); t.after(() => store.close());
  const saved = executeStudioTool(store, 'owner', 'save_engagement', { requestId: 'save-review', workspace: f.current() }).workspace as Workspace;
  assert.equal(saved.engagement.revision, 1);
  assert.deepEqual(saved.changeProposals, f.current().changeProposals);
  assert.deepEqual(validatedSnapshot(saved), saved);
  const result = executeStudioTool(store, 'owner', 'review_changes', { storage: 'saved', engagementId: saved.engagement.id, requestId: 'review-saved', expectedRevision: 1, proposalId: saved.changeProposals![0].id, expectedProposalVersion: 1, decisions: [{ changeId: 'owner', decision: 'accept' }] });
  assert.equal(result.workspace.work[0].owner, 'Alex');
});

test('impact does not call a citation stale when the proposal updates it to the new source version', () => {
  const f = fixture(), workspace = f.current();
  const result = f.propose([
    { id: 'meeting', kind: 'evidence', operation: 'update', recordId: workspace.evidence[0].id, expectedVersion: 1, fields: { content: 'Ask the operator before booking.' } },
    { id: 'requirement', kind: 'requirement', operation: 'update', recordId: workspace.requirements[0].id, expectedVersion: 1, fields: { evidenceRefs: [{ evidenceId: workspace.evidence[0].id, version: 2, quote: 'Ask the operator before booking.' }] } },
  ]);
  assert.equal(result.result.impact.staleEvidenceRefs.length, 1);
  assert.equal(result.result.impact.staleEvidenceRefs[0].kind, 'opportunity');
});

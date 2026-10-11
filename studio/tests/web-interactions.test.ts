import assert from 'node:assert/strict';
import test from 'node:test';
import type { Workspace } from '../server/model.js';
import { selectionContext } from '../web/selection.js';
import { decisionForm } from '../web/forms.js';
import { currentReviewChoices, reviewView } from '../web/review.js';

const fixture = (): Workspace => ({
  engagement: { id: 'eng', name: 'Repair', customer: 'Dispatch', ambition: 'Confirm repair', revision: 4, createdAt: '2026-10-11T00:00:00Z', updatedAt: '2026-10-11T00:00:00Z' },
  evidence: [{ id: 'source', title: '<script>unsafe</script>', kind: 'meeting', content: 'Unrelated confidential passage', status: 'final', participants: [], version: 1 }],
  opportunities: [{ id: 'opp', title: 'Booking', beneficiary: 'Dispatchers', currentWorkflow: 'Call desks', proposedService: 'Prepare a booking', whyItMatters: 'See availability', evidenceRefs: [], measures: [], assumptions: ['Approval required'], version: 1 }],
  requirements: [{ id: 'req', opportunityId: 'opp', title: 'Approval', behavior: 'Ask before reserving', status: 'confirmed', acceptanceCriteria: ['Declining does not reserve'], evidenceRefs: [], version: 1 }],
  work: [], scenarios: [], runs: [],
});

test('selection context includes only the selected record, not unrelated source content', () => {
  const context = selectionContext(fixture(), { kind: 'requirement', id: 'req' });
  assert.equal(context.engagementId, 'eng');
  assert.equal(context.revision, 4);
  assert.equal(context.record?.id, 'req');
  assert.ok(!JSON.stringify(context).includes('Unrelated confidential'));
  assert.equal(selectionContext(fixture(), { kind: 'work', id: 'missing' }).selection, null);
});

test('discovery choices escape source markup and service fields start from the workspace', () => {
  const workspace = fixture();
  const discovery = decisionForm('discovery', workspace, 'opp', '');
  assert.ok(discovery.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(!discovery.includes('<script>'));
  assert.ok(discovery.includes('value="source" checked'));
  const service = decisionForm('service', workspace, 'opp', '');
  assert.ok(service.includes('Prepare a booking'));
  assert.ok(service.includes('Approval required'));
  assert.ok(service.includes('Propose service changes'));
});

test('review never preselects decisions and removes apply controls after resolution', () => {
  const workspace = fixture();
  workspace.changeProposals = [{ id: 'proposal', title: 'Update approval', reason: 'Discovery', version: 1, baseRevision: 4, status: 'pending', createdAt: workspace.engagement.createdAt, updatedAt: workspace.engagement.updatedAt, reviews: [], changes: [{ id: 'change', kind: 'requirement', operation: 'update', recordId: 'req', expectedVersion: 1, before: workspace.requirements[0], fields: { behavior: 'Record approval reference' }, status: 'pending' }] }];
  const pending = reviewView(workspace, {}, {}, '', false);
  assert.ok(pending.includes('Ask before reserving'));
  assert.ok(pending.includes('Record approval reference'));
  assert.ok(pending.includes('disabled>Apply selected'));
  assert.ok(!pending.includes('aria-pressed="true"'));
  const revised = structuredClone(workspace);
  revised.changeProposals![0].version = 2;
  revised.changeProposals![0].changes[0].fields = { behavior: 'A different proposal' };
  assert.deepEqual(currentReviewChoices(workspace, revised, { 'proposal:change': 'accept' }), {});
  assert.deepEqual(currentReviewChoices(workspace, workspace, { 'proposal:change': 'accept' }), { 'proposal:change': 'accept' });
  workspace.changeProposals[0].status = 'resolved';
  workspace.changeProposals[0].changes[0].status = 'accepted';
  const resolved = reviewView(workspace, {}, {}, '', false);
  assert.ok(!resolved.includes('Apply selected'));
  assert.ok(resolved.includes('All changes in this proposal have been reviewed.'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { executeStudioTool } from '../server/service.js';
import { sampleWorkspace } from '../web/sample.js';

test('fictional sample validates without hosted storage and its pending proposal can be reviewed', () => {
  const workspace = sampleWorkspace('sample-test', '2026-10-11T00:00:00Z');
  const opened = executeStudioTool(null, 'anonymous', 'get_engagement', { storage: 'stateless', engagementId: workspace.engagement.id, workspace });
  assert.equal(opened.storage, 'stateless');
  assert.equal(opened.workspace.runs.length, 0);
  assert.equal(opened.workspace.work[0].status, 'planned');
  assert.equal(opened.workspace.work[0].evidence, '');
  assert.match(opened.workspace.engagement.name, /fictional/);
  assert.equal(opened.workspace.requirements.length, 2);
  assert.equal(opened.workspace.work.length, 2);
  assert.ok(opened.workspace.opportunities[0].measures.every((measure: { baseline?: number; target?: number }) => measure.baseline === undefined && measure.target === undefined));
  assert.match(opened.workspace.changeProposals[0].reason, /scope choice/);
  assert.deepEqual(opened.changeImpacts['sample-proposal'].work, ['sample-data-build', 'sample-pilot']);
  const reviewed = executeStudioTool(null, 'anonymous', 'review_changes', { storage: 'stateless', workspace: opened.workspace, engagementId: workspace.engagement.id, expectedRevision: 1, requestId: 'accept-sample', proposalId: 'sample-proposal', expectedProposalVersion: 1, decisions: [{ changeId: 'sample-change', decision: 'accept' }] });
  assert.equal(reviewed.workspace.changeProposals[0].status, 'resolved');
  assert.equal(reviewed.workspace.requirements[0].version, 2);
  assert.equal(reviewed.workspace.requirementHistory[0].version, 1);
  assert.equal(workspace.requirements[0].version, 1, 'Opening and reviewing does not mutate the source fixture.');
});

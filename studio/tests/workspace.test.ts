import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DomainError, type Workspace } from '../server/model.js';
import { WorkspaceStore } from '../server/store.js';
import { WorkspaceService } from '../server/workspace.js';

function setup(t: test.TestContext, actor = 'team-a') {
  const store = new WorkspaceStore();
  t.after(() => store.close());
  const service = new WorkspaceService(store);
  let workspace = service.execute('create_engagement', { requestId: 'create', name: 'Repair concierge', customer: 'Workshop', ambition: 'Arrange a repair from the fault description through a confirmed appointment.' }, actor).workspace;
  let sequence = 0;
  function write(name: string, args: Record<string, unknown>) {
    const response = service.execute(name, { engagementId: workspace.engagement.id, requestId: `write-${++sequence}`, expectedRevision: workspace.engagement.revision, ...args }, actor);
    workspace = response.workspace;
    return workspace;
  }
  return { service, store, write, current: () => workspace };
}

function errorCode(code: string) {
  return (error: unknown) => error instanceof DomainError && error.code === code;
}

function opportunity(write: ReturnType<typeof setup>['write']) {
  return write('shape_opportunity', {
    title: 'Repair concierge', beneficiary: 'Factory maintenance planner', currentWorkflow: 'Planner calls three suppliers and the field service desk.',
    proposedService: 'Book the compatible part and engineer in one conversation.', whyItMatters: 'Reduce the time equipment remains out of service.',
    measures: [{ name: 'Time to confirmed appointment', unit: 'minutes', target: 10, basis: 'Proposed target to test with operators; baseline not yet measured.' }],
  }).opportunities.at(-1)!;
}

test('discovery connects selected meeting passages, a service opportunity, requirements and delivery without inventing test success', t => {
  const { write } = setup(t);
  const evidence = write('add_evidence', { title: 'Operator discovery', kind: 'meeting', content: 'We call three desks to get one repair booked. Customer approval is required before reserving an alternative part.', participants: ['Maintenance planner'], originId: 'meeting-42' }).evidence[0];
  const idea = write('shape_opportunity', {
    title: 'One-call repair booking', beneficiary: 'Maintenance planners', currentWorkflow: 'Call three desks.', proposedService: 'Arrange the complete repair in one conversation.', whyItMatters: 'Restore equipment sooner.',
    evidenceRefs: [{ evidenceId: evidence.id, version: evidence.version, quote: 'We call three desks to get one repair booked.' }],
    assumptions: ['Supplier reservation interface will be available.'],
  }).opportunities[0];
  const requirement = write('define_requirement', {
    opportunityId: idea.id, title: 'Customer chooses substitutes', behavior: 'Ask the customer to approve a specific alternative before reservation.',
    acceptanceCriteria: ['Reservation uses exactly the approved part.'], status: 'confirmed',
    evidenceRefs: [{ evidenceId: evidence.id, version: 1, quote: 'Customer approval is required before reserving an alternative part.' }],
  }).requirements[0];
  const workspace = write('plan_delivery', { opportunityId: idea.id, requirementIds: [requirement.id], title: 'Implement approval step', outcome: 'A customer can approve a named alternative.', status: 'done', evidence: 'Change merged after code review.' });
  assert.equal(workspace.work[0].status, 'done');
  assert.equal(workspace.runs.length, 0);
  assert.equal(workspace.requirements[0].status, 'confirmed');
  assert.equal(workspace.engagement.revision, 5);
});

test('updated meeting versions preserve original quotations and requirement versions remain inspectable', t => {
  const { write, current } = setup(t);
  const evidence = write('add_evidence', { title: 'Discovery draft', kind: 'meeting', content: 'The planner books the repair.' }).evidence[0];
  const idea = opportunity(write);
  const requirement = write('define_requirement', { opportunityId: idea.id, title: 'Book repair', behavior: 'Let the planner confirm a slot.', acceptanceCriteria: ['Slot is confirmed.'], evidenceRefs: [{ evidenceId: evidence.id, version: 1, quote: 'The planner books the repair.' }] }).requirements[0];
  write('add_evidence', { id: evidence.id, content: 'The operator, rather than the planner, books the repair.', status: 'final' });
  const updated = write('define_requirement', { id: requirement.id, behavior: 'Let the operator confirm a slot.', evidenceRefs: [{ evidenceId: evidence.id, version: 2, quote: 'The operator, rather than the planner, books the repair.' }] });
  assert.equal(updated.evidence[0].version, 2);
  assert.equal(updated.evidenceHistory?.[0].content, 'The planner books the repair.');
  assert.deepEqual(updated.requirementHistory?.[0].evidenceRefs, [{ evidenceId: evidence.id, version: 1, quote: 'The planner books the repair.' }]);
  write('shape_opportunity', { id: idea.id, title: 'Concierge for operators', evidenceRefs: [{ evidenceId: evidence.id, version: 1, quote: 'The planner books the repair.' }] });
  assert.equal(current().opportunityHistory?.[0].title, 'Repair concierge');
});

test('quotes and source versions are verified against the selected engagement and rejected writes are atomic', t => {
  const { service, write, current } = setup(t);
  const idea = opportunity(write);
  const evidence = write('add_evidence', { title: 'Source', kind: 'document', content: 'Repair slots are confirmed by the planner.' }).evidence[0];
  const base = { opportunityId: idea.id, title: 'Confirm slot', behavior: 'Confirm slot.', acceptanceCriteria: ['Slot confirmed.'] };
  for (const [version, quote, code] of [[1, 'The customer approved.', 'invalid_quote'], [2, 'Repair slots', 'invalid_reference'], [1, ' ', 'invalid_quote']] as const) {
    assert.throws(() => write('define_requirement', { ...base, evidenceRefs: [{ evidenceId: evidence.id, version, quote }] }), errorCode(code));
  }
  const other = service.execute('create_engagement', { requestId: 'other-create', name: 'Other project', customer: 'Same team', ambition: 'Another service.' }, 'team-a').workspace;
  const otherSource = service.execute('add_evidence', { requestId: 'other-source', engagementId: other.engagement.id, expectedRevision: 1, title: 'Other source', kind: 'meeting', content: 'Other engagement evidence.' }, 'team-a').workspace.evidence[0];
  assert.throws(() => write('define_requirement', { ...base, evidenceRefs: [{ evidenceId: otherSource.id, version: 1, quote: 'Other engagement evidence.' }] }), errorCode('invalid_reference'));
  assert.equal(service.get(current().engagement.id, 'team-a').engagement.revision, current().engagement.revision);
  assert.equal(service.get(current().engagement.id, 'team-a').requirements.length, 0);
});

test('work requirements must belong to the selected opportunity and references cannot cross projects', t => {
  const { service, write, current } = setup(t);
  const first = opportunity(write);
  const second = opportunity(write);
  const requirement = write('define_requirement', { opportunityId: first.id, title: 'Book repair', behavior: 'Confirm repair.', acceptanceCriteria: ['Confirmed.'] }).requirements[0];
  assert.throws(() => write('plan_delivery', { opportunityId: second.id, requirementIds: [requirement.id], title: 'Build it', outcome: 'A working service.' }), errorCode('invalid_reference'));
  assert.throws(() => write('define_requirement', { id: requirement.id, opportunityId: second.id }), errorCode('invalid_reference'));
  assert.throws(() => write('plan_delivery', { opportunityId: 'another-workspace-opportunity', title: 'Build it', outcome: 'A working service.' }), errorCode('not_found'));
  assert.throws(() => write('add_evidence', { id: 'unrecognized-record', content: 'Cannot inject IDs.' }), errorCode('not_found'));
  assert.equal(service.get(current().engagement.id, 'team-a').work.length, 0);
});

test('create and mutation retries return the original receipt while new writes require the current revision', t => {
  const { service, current } = setup(t);
  const engagementId = current().engagement.id;
  const input = { engagementId, requestId: 'retry-me', expectedRevision: 1, title: 'Evidence', kind: 'document', content: 'One finding.' };
  const first = service.execute('add_evidence', input, 'team-a');
  const retry = service.execute('add_evidence', { ...input }, 'team-a');
  assert.deepEqual(retry, first);
  assert.equal(service.get(engagementId, 'team-a').evidence.length, 1);
  assert.throws(() => service.execute('add_evidence', { ...input, content: 'Different finding.' }, 'team-a'), errorCode('idempotency_conflict'));
  assert.throws(() => service.execute('add_evidence', { ...input, requestId: 'new-but-stale' }, 'team-a'), errorCode('revision_conflict'));
  const create = { requestId: 'create', name: 'Repair concierge', customer: 'Workshop', ambition: 'Arrange a repair from the fault description through a confirmed appointment.' };
  assert.equal(service.execute('create_engagement', create, 'team-a').workspace.engagement.id, engagementId);
  assert.equal(service.list('team-a').length, 1);
  assert.throws(() => service.execute('create_engagement', { ...create, name: 'Renamed' }, 'team-a'), errorCode('idempotency_conflict'));
});

test('actors cannot read, list, update or obtain retry receipts from another actor', t => {
  const { service, current } = setup(t);
  const engagementId = current().engagement.id;
  assert.deepEqual(service.list('team-b'), []);
  assert.throws(() => service.get(engagementId, 'team-b'), errorCode('not_found'));
  assert.throws(() => service.execute('add_evidence', { engagementId, requestId: 'same', expectedRevision: 1, title: 'Injected', kind: 'document', content: 'Injected' }, 'team-b'), errorCode('not_found'));
  const owned = service.execute('create_engagement', { requestId: 'create', name: 'My engagement', customer: 'Other team', ambition: 'Own workspace.' }, 'team-b');
  assert.notEqual(owned.workspace.engagement.id, engagementId);
  assert.equal(service.list('team-a').length, 1);
});

test('validation rejects invalid input and unsafe source links before mutation', t => {
  const { service, write, current } = setup(t);
  assert.throws(() => service.execute('constructor', {}), errorCode('unknown_tool'));
  assert.throws(() => write('add_evidence', { title: 'Blank', kind: 'meeting', content: '  ' }), errorCode('invalid_input'));
  assert.throws(() => write('add_evidence', { title: 'Unsafe link', kind: 'document', content: 'Content.', uri: 'javascript:alert(1)' }), errorCode('invalid_input'));
  assert.throws(() => write('add_evidence', { title: 'Missing content', kind: 'document' }), errorCode('invalid_input'));
  assert.throws(() => service.execute('create_engagement', { requestId: 'bad', name: '', customer: 'A', ambition: 'B' }), errorCode('invalid_input'));
  assert.equal(service.get(current().engagement.id, 'team-a').engagement.revision, 1);
});

test('durable SQLite state and idempotency survive reopening; failed lab callbacks roll back all state', () => {
  const directory = mkdtempSync(join(tmpdir(), 'forward-deployed-domain-'));
  let store: WorkspaceStore | undefined;
  try {
    const path = join(directory, 'work.sqlite');
    store = new WorkspaceStore(path);
    let service = new WorkspaceService(store);
    const create = { requestId: 'persist', name: 'Durable project', customer: 'Factory', ambition: 'A repair service.' };
    const initial = service.execute('create_engagement', create, 'owner');
    const engagementId = initial.workspace.engagement.id;
    store.close();
    store = new WorkspaceStore(path);
    service = new WorkspaceService(store);
    assert.deepEqual(service.get(engagementId, 'owner'), initial.workspace);
    assert.deepEqual(service.execute('create_engagement', create, 'owner'), initial);
    assert.throws(() => store!.mutate('owner', engagementId, 'lab-write', 1, { tool: 'lab' }, workspace => {
      workspace.engagement.ambition = 'Must not persist';
      throw new DomainError('lab_failure', 'The rehearsal failed validation.');
    }), errorCode('lab_failure'));
    assert.equal(service.get(engagementId, 'owner').engagement.ambition, create.ambition);
    const saved = store.mutate('owner', engagementId, 'lab-write', 1, { tool: 'lab' }, workspace => ({ workspace, result: { demonstration: 'successful' } }));
    assert.equal(saved.workspace.engagement.revision, 2);
    assert.deepEqual(saved.result, { demonstration: 'successful' });
  } finally {
    store?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

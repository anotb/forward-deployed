import assert from 'node:assert/strict';
import test from 'node:test';
import { executeLab } from '../server/lab.js';
import { DomainError, type Workspace } from '../server/model.js';
import { StatelessWorkspaceStore, validatedSnapshot, workspaceSnapshotSchema } from '../server/stateless.js';
import { WorkspaceService } from '../server/workspace.js';

function code(expected: string) { return (error: unknown) => error instanceof DomainError && error.code === expected; }
function start(): Workspace {
  return new WorkspaceService(new StatelessWorkspaceStore()).execute('create_engagement', { requestId: 'create', name: 'Repair concierge', customer: 'Workshop', ambition: 'Book a complete repair during the first call.' }).workspace;
}
function domain(snapshot: Workspace, name: string, input: Record<string, unknown>): Workspace {
  const store = new StatelessWorkspaceStore(snapshot);
  try {
    return new WorkspaceService(store).execute(name, { engagementId: snapshot.engagement.id, requestId: `request-${snapshot.engagement.revision}`, expectedRevision: snapshot.engagement.revision, ...input }).workspace;
  } finally { store.close(); }
}
function lab(snapshot: Workspace, name: string, input: Record<string, unknown>): Workspace {
  const store = new StatelessWorkspaceStore(snapshot);
  try {
    return store.mutate('local', snapshot.engagement.id, `lab-${snapshot.engagement.revision}`, snapshot.engagement.revision, { tool: name, input }, workspace => executeLab(workspace, name, input)).workspace;
  } finally { store.close(); }
}
function prepared(): Workspace {
  let snapshot = domain(start(), 'add_evidence', { title: 'Discovery', kind: 'meeting', content: 'I need a repair booking while I am still on the phone.' });
  snapshot = domain(snapshot, 'shape_opportunity', { title: 'Immediate booking', beneficiary: 'Equipment operators', currentWorkflow: 'Call dispatch and wait for a callback.', proposedService: 'Confirm the visit in the first call.', whyItMatters: 'The operator leaves the call with a repair plan.', evidenceRefs: [{ evidenceId: snapshot.evidence[0].id, version: 1, quote: 'I need a repair booking while I am still on the phone.' }] });
  snapshot = domain(snapshot, 'define_requirement', { title: 'Confirm booking', opportunityId: snapshot.opportunities[0].id, behavior: 'Create exactly one repair booking.', acceptanceCriteria: ['A booking is confirmed.'] });
  return lab(snapshot, 'define_rehearsal', {
    opportunityId: snapshot.opportunities[0].id, title: 'Book a repair', goal: 'Arrange a confirmed repair during the call.',
    initialState: { booked: false, bookings: 0 }, observableKeys: ['booked', 'bookings'], assumptions: ['A field engineer is available.'],
    actions: [{ id: 'book', title: 'Book engineer', description: 'Confirm the appointment.', parameters: {}, preconditions: [], effects: [{ field: 'booked', operation: 'set', value: { literal: true } }, { field: 'bookings', operation: 'increment', value: { literal: 1 } }], response: 'timeout_after_commit', idempotent: true }],
    checks: [{ id: 'appointment', label: 'Repair confirmed', kind: 'outcome', condition: { field: 'booked', operator: 'eq', value: { literal: true } }, requirementId: snapshot.requirements[0].id }, { id: 'single', label: 'Only one booking', kind: 'invariant', condition: { field: 'bookings', operator: 'lte', value: { literal: 1 } } }],
  });
}

test('the complete discovery and rehearsal loop continues through request-carried snapshots', () => {
  let snapshot = prepared();
  snapshot = lab(snapshot, 'start_rehearsal', { scenarioId: snapshot.scenarios[0].id });
  snapshot = lab(snapshot, 'act_in_rehearsal', { runId: snapshot.runs[0].id, actionId: 'book', intentId: 'booking-1', inputs: {} });
  assert.equal(snapshot.runs[0].steps[0].status, 'timeout');
  snapshot = lab(snapshot, 'act_in_rehearsal', { runId: snapshot.runs[0].id, actionId: 'book', intentId: 'booking-1', inputs: {} });
  assert.equal(snapshot.runs[0].state.bookings, 1, 'Intent replay protection survives transport in the snapshot.');
  assert.equal(snapshot.runs[0].steps.length, 1);
  snapshot = lab(snapshot, 'finish_rehearsal', { runId: snapshot.runs[0].id });
  assert.equal(snapshot.runs[0].status, 'finished');
  assert.ok(snapshot.runs[0].checks.every(check => check.passed));
  snapshot = lab(snapshot, 'fork_rehearsal', { runId: snapshot.runs[0].id, atStep: 0, stateOverrides: { bookings: 1 } });
  assert.equal(snapshot.runs.length, 2);
  snapshot = lab(snapshot, 'act_in_rehearsal', { runId: snapshot.runs[1].id, actionId: 'book', intentId: 'booking-branch', inputs: {} });
  snapshot = lab(snapshot, 'finish_rehearsal', { runId: snapshot.runs[1].id });
  assert.equal(snapshot.runs[1].checks.find(check => check.id === 'single')?.passed, false);
  assert.ok(workspaceSnapshotSchema.safeParse(snapshot).success);
  assert.deepEqual(validatedSnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot);
});

test('new requests retain nothing without a supplied snapshot and close clears request memory', () => {
  const snapshot = start();
  const blank = new StatelessWorkspaceStore();
  assert.deepEqual(blank.list(), []);
  assert.throws(() => blank.get(snapshot.engagement.id), code('not_found'));
  const restored = new StatelessWorkspaceStore(snapshot);
  assert.equal(restored.list()[0].id, snapshot.engagement.id);
  restored.close();
  assert.deepEqual(restored.list(), []);
  assert.equal(new StatelessWorkspaceStore().list().length, 0);
});

test('request-local writes retain revision, receipt, isolation and rollback semantics', () => {
  const snapshot = start();
  const store = new StatelessWorkspaceStore(snapshot);
  const service = new WorkspaceService(store);
  const input = { engagementId: snapshot.engagement.id, requestId: 'write', expectedRevision: 1, title: 'Discovery', kind: 'meeting', content: 'Book while I am on the phone.' };
  const first = service.execute('add_evidence', input);
  assert.deepEqual(service.execute('add_evidence', input), first);
  assert.throws(() => service.execute('add_evidence', { ...input, content: 'Different.' }), code('idempotency_conflict'));
  assert.throws(() => service.execute('add_evidence', { ...input, requestId: 'stale' }), code('revision_conflict'));
  assert.throws(() => store.get(snapshot.engagement.id, 'another-actor'), code('not_found'));
  assert.throws(() => store.mutate('local', snapshot.engagement.id, 'rollback', 2, {}, workspace => {
    workspace.engagement.ambition = 'Must be rolled back.';
    throw new Error('Rejected operation');
  }), /Rejected operation/);
  assert.equal(store.get(snapshot.engagement.id).engagement.ambition, snapshot.engagement.ambition);
  assert.throws(() => store.mutate('local', snapshot.engagement.id, 'invalid-output', 2, {}, workspace => {
    workspace.engagement.createdAt = 'bad date';
    return { workspace, result: {} };
  }), code('invalid_snapshot'));
  assert.equal(store.get(snapshot.engagement.id).engagement.revision, 2);
  first.workspace.evidence[0].content = 'Caller mutation';
  assert.notEqual(store.get(snapshot.engagement.id).evidence[0].content, 'Caller mutation');
});

test('evidence histories and archived requirement references survive snapshot validation', () => {
  let snapshot = prepared();
  snapshot = lab(snapshot, 'start_rehearsal', { scenarioId: snapshot.scenarios[0].id });
  snapshot = domain(snapshot, 'add_evidence', { id: snapshot.evidence[0].id, content: 'Updated discovery notes.', status: 'final' });
  snapshot = domain(snapshot, 'define_requirement', { id: snapshot.requirements[0].id, behavior: 'Confirm the appointment and tell the operator.' });
  assert.equal(snapshot.runs[0].scenario.checks[0].requirementVersion, 1);
  assert.equal(snapshot.requirements[0].version, 2);
  assert.equal(validatedSnapshot(snapshot).evidenceHistory?.[0].content, 'I need a repair booking while I am still on the phone.');
});

test('snapshot inputs are plain bounded JSON; unsafe keys, accessors and executable values are rejected', () => {
  const snapshot = start();
  for (const raw of [null, [], { ...snapshot, execute: 'return fetch(url)' }, { ...snapshot, injected: () => 1 }, { ...snapshot, engagement: new Date() }]) assert.throws(() => validatedSnapshot(raw), code('invalid_snapshot'));
  const prototypeKey = JSON.parse(JSON.stringify(snapshot).replace('"evidence":[]', '"evidence":[],"__proto__":{"polluted":true}'));
  assert.throws(() => validatedSnapshot(prototypeKey), code('invalid_snapshot'));
  let accessed = false;
  const getter = { ...snapshot };
  Object.defineProperty(getter, 'execute', { get() { accessed = true; return 'bad'; } });
  assert.throws(() => validatedSnapshot(getter), code('invalid_snapshot'));
  assert.equal(accessed, false);
  const cycle = { ...snapshot, loop: {} };
  cycle.loop = cycle;
  assert.throws(() => validatedSnapshot(cycle), code('invalid_snapshot'));
  assert.throws(() => validatedSnapshot({ ...snapshot, engagement: { ...snapshot.engagement, revision: Infinity } }), code('invalid_snapshot'));
});

test('UTF-8 snapshot size is capped at one MiB and excess output cannot partly commit', () => {
  const snapshot = start();
  const large = { ...snapshot, evidence: [{ id: 'evidence', title: 'Big document', kind: 'document', content: '界'.repeat(400_000), status: 'preliminary', participants: [], version: 1 }] };
  assert.throws(() => validatedSnapshot(large), code('snapshot_too_large'));
  const store = new StatelessWorkspaceStore(snapshot);
  assert.throws(() => new WorkspaceService(store).execute('add_evidence', { engagementId: snapshot.engagement.id, expectedRevision: 1, requestId: 'large', title: 'Big document', kind: 'document', content: '界'.repeat(400_000) }), code('snapshot_too_large'));
  assert.equal(store.get(snapshot.engagement.id).evidence.length, 0);
  assert.equal(store.get(snapshot.engagement.id).engagement.revision, 1);
});

test('malformed nested lab state, histories and references cannot bypass snapshot import', () => {
  let baseline = prepared();
  baseline = lab(baseline, 'start_rehearsal', { scenarioId: baseline.scenarios[0].id });
  baseline = lab(baseline, 'act_in_rehearsal', { runId: baseline.runs[0].id, actionId: 'book', intentId: 'booking', inputs: {} });
  const malformed: ((workspace: Workspace) => void)[] = [
    workspace => { workspace.evidence.push(structuredClone(workspace.evidence[0])); },
    workspace => { workspace.evidenceHistory = [structuredClone(workspace.evidence[0])]; },
    workspace => { workspace.opportunities[0].evidenceRefs[0].quote = 'This was never said.'; },
    workspace => { workspace.requirements[0].opportunityId = 'missing'; },
    workspace => { workspace.scenarios[0].actions[0].effects[0].field = '../outside'; },
    workspace => { workspace.scenarios[0].actions[0].effects[0].field = 'safe.constructor'; },
    workspace => { workspace.scenarios[0].checks[0].requirementVersion = 999; },
    workspace => { workspace.runs[0].scenarioVersion = 999; },
    workspace => { workspace.runs[0].state.bookings = 'wrong type'; },
    workspace => { workspace.runs[0].checks[0].requirementId = 'unrelated'; },
    workspace => { workspace.runs[0].steps[0].index = 3; },
    workspace => { workspace.runs[0].steps[0].actionId = 'unrecognized'; },
    workspace => { workspace.runs[0].steps[0].before.bookings = 500; },
    workspace => { workspace.runs[0].state.bookings = 50; },
    workspace => { workspace.runs[0].parentRunId = workspace.runs[0].id; workspace.runs[0].forkedAtStep = 0; },
    workspace => { workspace.runs[0].status = 'finished'; },
  ];
  for (const change of malformed) {
    const altered = structuredClone(baseline);
    change(altered);
    assert.throws(() => validatedSnapshot(altered), code('invalid_snapshot'));
  }
  assert.deepEqual(validatedSnapshot(baseline), baseline);
});

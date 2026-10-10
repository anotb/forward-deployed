import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateView, executeLab } from '../server/lab.js';
import { DomainError, type Scenario, type Workspace } from '../server/model.js';

function fixture(): Workspace {
  return {
    engagement: { id: 'engagement', name: 'Repair concierge', ambition: 'Arrange the right repair in one conversation', customer: 'Sample workshop', revision: 1, createdAt: '', updatedAt: '' },
    evidence: [], work: [], scenarios: [], runs: [],
    opportunities: [{ id: 'opportunity', title: 'Repair concierge', beneficiary: 'Maintenance coordinator', currentWorkflow: 'Phone three teams to arrange a repair', proposedService: 'Reserve the compatible part and book an engineer', whyItMatters: 'A complete repair plan before the call ends', evidenceRefs: [], measures: [], assumptions: [], version: 1 }],
    requirements: [{ id: 'requirement', opportunityId: 'opportunity', title: 'One confirmed repair', behavior: 'Reserve one compatible part and schedule the visit', acceptanceCriteria: ['One reservation', 'Engineer booked'], evidenceRefs: [], status: 'confirmed', version: 2 }],
  };
}

/** A tiny executable service-creation example; all state and business rules are synthetic. */
export function repairScenario(): Omit<Scenario, 'id' | 'version'> {
  return {
    opportunityId: 'opportunity', title: 'Arrange a repair', goal: 'Reserve one compatible part and book an engineer for Friday.',
    initialState: { compatiblePart: 'pump-A', reservations: 0, reservedPart: '', engineerBooked: false, secretCost: 29 },
    observableKeys: ['compatiblePart', 'reservations', 'reservedPart', 'engineerBooked'], assumptions: ['The service has one compatible part and an available engineer.'],
    actions: [
      { id: 'reserve', title: 'Reserve a part', description: 'Reserve a compatible part using the operation intent.', parameters: { part: { type: 'string', required: true, description: 'Part identifier' } }, preconditions: [{ field: 'compatiblePart', operator: 'eq', value: { input: 'part' } }], effects: [{ field: 'reservations', operation: 'increment', value: { literal: 1 } }, { field: 'reservedPart', operation: 'set', value: { input: 'part' } }], response: 'success', idempotent: true },
      { id: 'book', title: 'Book the engineer', description: 'Book Friday’s engineer once a part is reserved.', parameters: {}, preconditions: [{ field: 'reservations', operator: 'eq', value: { literal: 1 } }], effects: [{ field: 'engineerBooked', operation: 'set', value: { literal: true } }], response: 'success', idempotent: true },
      { id: 'release', title: 'Release a reservation', description: 'Release one reservation.', parameters: {}, preconditions: [{ field: 'reservations', operator: 'gt', value: { literal: 0 } }], effects: [{ field: 'reservations', operation: 'increment', value: { literal: -1 } }], response: 'success', idempotent: true },
    ],
    checks: [
      { id: 'visit', label: 'Engineer booked', kind: 'outcome', condition: { field: 'engineerBooked', operator: 'eq', value: { literal: true } }, requirementId: 'requirement' },
      { id: 'one-part', label: 'Exactly one reservation', kind: 'outcome', condition: { field: 'reservations', operator: 'eq', value: { literal: 1 } }, requirementId: 'requirement' },
      { id: 'no-duplicate', label: 'No duplicate reservations at any point', kind: 'invariant', condition: { field: 'reservations', operator: 'lte', value: { literal: 1 } }, requirementId: 'requirement' },
    ],
  };
}
function start(definition = repairScenario()) {
  let workspace = executeLab(fixture(), 'define_rehearsal', definition).workspace;
  workspace = executeLab(workspace, 'start_rehearsal', { scenarioId: workspace.scenarios[0].id }).workspace;
  return workspace;
}
function act(workspace: Workspace, actionId: string, intentId: string, inputs = {}, runId = workspace.runs[0].id): Workspace {
  return executeLab(workspace, 'act_in_rehearsal', { runId, actionId, intentId, inputs }).workspace;
}
function isError(code: string) { return (error: unknown) => error instanceof DomainError && error.code === code; }

test('build a useful service: reserve the right part, book a visit, verify linked requirements', () => {
  const untouched = fixture();
  const defined = executeLab(untouched, 'define_rehearsal', repairScenario()).workspace;
  assert.equal(untouched.scenarios.length, 0, 'definitions must not mutate caller state');
  assert.equal(defined.scenarios[0].checks[0].requirementVersion, 2);
  let workspace = start();
  workspace = act(workspace, 'reserve', 'repair-1', { part: 'pump-A' });
  workspace = act(workspace, 'book', 'visit-1');
  const finished = executeLab(workspace, 'finish_rehearsal', { runId: workspace.runs[0].id });
  assert.equal((finished.result as { outcome: string }).outcome, 'passed');
  assert.equal(finished.workspace.runs[0].state.engineerBooked, true);
  assert.equal(finished.workspace.runs[0].steps.length, 2);
  assert.throws(() => act(finished.workspace, 'release', 'release-1'), isError('run_finished'));
});

test('action discovery exposes parameters and meaningful preconditions, hides checks and private state', () => {
  const workspace = start();
  const view = candidateView(workspace, workspace.runs[0].id);
  assert.equal(view.actions[0].parameters.part.required, true);
  assert.equal(view.actions[1].available, false);
  assert.match(view.actions[1].blockedBy[0], /reservations/);
  assert.equal('secretCost' in view.state, false);
  assert.equal('checks' in view, false);
  assert.equal('effects' in view.actions[0], false);
  assert.equal('initialState' in view, false);
});

test('wrong part is recorded as rejected with no state change; required inputs are validated', () => {
  let workspace = start();
  assert.throws(() => act(workspace, 'reserve', 'repair-1'), isError('invalid_input'));
  workspace = act(workspace, 'reserve', 'repair-1', { part: 'pump-B' });
  assert.equal(workspace.runs[0].steps[0].status, 'rejected');
  assert.equal(workspace.runs[0].state.reservations, 0);
  assert.match(workspace.runs[0].steps[0].message, /input part/);
  assert.throws(() => act(workspace, 'reserve', 'repair-1', { part: 'pump-A' }), isError('intent_conflict'));
  assert.throws(() => act(workspace, 'reserve', 'repair-2', { part: 'pump-A', surprise: true }), isError('invalid_input'));
});

test('timeout commits once; replay with the same intent acknowledges without duplicating', () => {
  const definition = repairScenario(); definition.actions[0].response = 'timeout_after_commit';
  let workspace = start(definition);
  const timedOut = executeLab(workspace, 'act_in_rehearsal', { runId: workspace.runs[0].id, actionId: 'reserve', intentId: 'repair-1', inputs: { part: 'pump-A' } });
  workspace = timedOut.workspace;
  assert.equal('state' in (timedOut.result as object), false, 'lost response must not disclose committed state');
  assert.equal('actions' in (timedOut.result as object), false, 'action availability must not disclose committed state either');
  assert.equal(workspace.runs[0].steps[0].status, 'timeout');
  assert.equal(workspace.runs[0].state.reservations, 1);
  const repeated = executeLab(workspace, 'act_in_rehearsal', { runId: workspace.runs[0].id, actionId: 'reserve', intentId: 'repair-1', inputs: { part: 'pump-A' } });
  assert.equal(repeated.workspace.runs[0].steps.length, 1);
  assert.equal((repeated.result as { actionResult: { replayed: boolean } }).actionResult.replayed, true);
  assert.throws(() => act(workspace, 'book', 'repair-1'), isError('intent_conflict'));
});

test('non-idempotent action requires observation rather than silently repeating a used intent', () => {
  const definition = repairScenario(); definition.actions[0].idempotent = false;
  let workspace = start(definition);
  workspace = act(workspace, 'reserve', 'repair-1', { part: 'pump-A' });
  assert.throws(() => act(workspace, 'reserve', 'repair-1', { part: 'pump-A' }), isError('intent_already_attempted'));
});

test('repairing the final state never erases an invariant violation', () => {
  let workspace = start();
  workspace = act(workspace, 'reserve', 'repair-1', { part: 'pump-A' });
  workspace = act(workspace, 'reserve', 'repair-2', { part: 'pump-A' });
  workspace = act(workspace, 'release', 'release-1');
  workspace = act(workspace, 'book', 'visit-1');
  const finished = executeLab(workspace, 'finish_rehearsal', { runId: workspace.runs[0].id });
  assert.equal((finished.result as { outcome: string }).outcome, 'failed');
  assert.equal(finished.workspace.runs[0].checks.find(check => check.id === 'one-part')?.passed, true);
  const invariant = finished.workspace.runs[0].checks.find(check => check.id === 'no-duplicate');
  assert.equal(invariant?.passed, false); assert.equal(invariant?.actual, 2);
});

test('fork before a mistake tries a new route, preserves the original, snapshots scenario version', () => {
  let workspace = start();
  workspace = act(workspace, 'reserve', 'repair-1', { part: 'pump-A' });
  workspace = act(workspace, 'reserve', 'repair-2', { part: 'pump-A' });
  const original = structuredClone(workspace.runs[0]);
  workspace = executeLab(workspace, 'fork_rehearsal', { runId: original.id, atStep: 1 }).workspace;
  const branch = workspace.runs[1];
  workspace = act(workspace, 'book', 'visit-1', {}, branch.id);
  workspace = executeLab(workspace, 'finish_rehearsal', { runId: branch.id }).workspace;
  assert.deepEqual(workspace.runs[0], original);
  assert.equal(workspace.runs[1].checks.every(check => check.passed), true);
  assert.equal(branch.parentRunId, original.id); assert.equal(branch.forkedAtStep, 1);
  const definition = repairScenario(); definition.goal = 'A later service design';
  workspace = executeLab(workspace, 'define_rehearsal', { ...definition, id: original.scenarioId }).workspace;
  assert.equal(workspace.scenarios[0].version, 2);
  assert.equal(workspace.runs[1].scenarioVersion, 1);
  assert.equal(workspace.runs[1].scenario.goal, original.scenario.goal);
});

test('fork overrides are typed and visible in the trace; nested forks preserve branch violations', () => {
  let workspace = start(); const runId = workspace.runs[0].id;
  assert.throws(() => executeLab(workspace, 'fork_rehearsal', { runId, atStep: 2 }), isError('invalid_input'));
  assert.throws(() => executeLab(workspace, 'fork_rehearsal', { runId, atStep: 0, stateOverrides: { reservations: 'two' } }), isError('invalid_input'));
  workspace = executeLab(workspace, 'fork_rehearsal', { runId, atStep: 0, stateOverrides: { reservations: 2 } }).workspace;
  const branch = workspace.runs[1];
  assert.equal(branch.steps[0].actionId, '$fork');
  workspace = act(workspace, 'release', 'release-1', {}, branch.id);
  workspace = executeLab(workspace, 'fork_rehearsal', { runId: branch.id, atStep: 2 }).workspace;
  const nested = workspace.runs[2];
  workspace = act(workspace, 'book', 'visit-1', {}, nested.id);
  workspace = executeLab(workspace, 'finish_rehearsal', { runId: nested.id }).workspace;
  assert.equal(workspace.runs[2].checks.find(check => check.id === 'no-duplicate')?.passed, false);
});

test('scenarios reject missing references, unsupported code and stale requirement versions', () => {
  const invalid = repairScenario(); invalid.checks[0].requirementVersion = 1;
  assert.throws(() => executeLab(fixture(), 'define_rehearsal', invalid), isError('stale_requirement'));
  assert.throws(() => executeLab(fixture(), 'define_rehearsal', { ...repairScenario(), opportunityId: 'another-engagement' }), isError('not_found'));
  const code = repairScenario(); (code.actions[0].effects[0] as unknown as { operation: string }).operation = 'eval';
  assert.throws(() => executeLab(fixture(), 'define_rehearsal', code), isError('invalid_input'));
  const missing = repairScenario(); missing.observableKeys.push('missing');
  assert.throws(() => executeLab(fixture(), 'define_rehearsal', missing), isError('invalid_definition'));
});

test('effect failure is atomic, and hidden preconditions never reveal hidden values', () => {
  const definition = repairScenario();
  definition.actions[0].effects.push({ field: 'secretCost', operation: 'set', value: { literal: 'bad-type' } });
  const workspace = start(definition); const original = structuredClone(workspace);
  assert.throws(() => act(workspace, 'reserve', 'repair-1', { part: 'pump-A' }), isError('invalid_input'));
  assert.deepEqual(workspace, original);
  const hidden = repairScenario();
  hidden.actions[0].preconditions.push({ field: 'secretCost', operator: 'lt', value: { literal: 20 } });
  const hiddenWorkspace = start(hidden);
  const blocked = candidateView(hiddenWorkspace, hiddenWorkspace.runs[0].id).actions[0].blockedBy;
  assert.deepEqual(blocked, ['The simulated service rejected a business precondition.']);
});

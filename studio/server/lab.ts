import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DomainError, type CheckResult, type Condition, type Operand, type Run, type Scenario, type State, type Value, type Workspace } from './model.js';

const key = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/).refine(value => !['constructor', 'prototype', '__proto__'].includes(value), 'Reserved key');
const text = z.string().trim().min(1).max(8000);
const value = z.union([z.string().max(16000), z.number().finite(), z.boolean(), z.null(), z.array(z.string().max(2000)).max(500)]);
const state = z.record(key, value).refine(object => Object.keys(object).length <= 100, 'At most 100 state fields');
const operand = z.union([z.object({ literal: value }).strict(), z.object({ input: key }).strict(), z.object({ state: key }).strict()]);
const condition = z.object({ field: key, operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'includes']), value: operand }).strict();
const effect = z.object({ field: key, operation: z.enum(['set', 'increment', 'append']), value: operand }).strict();
const parameter = z.object({ type: z.enum(['string', 'number', 'boolean']), description: text, required: z.boolean(), enum: z.array(value).min(1).max(100).optional() }).strict();
const action = z.object({
  id: key, title: text, description: text, parameters: z.record(key, parameter),
  preconditions: z.array(condition).max(50), effects: z.array(effect).min(1).max(50),
  response: z.enum(['success', 'timeout_after_commit']), idempotent: z.boolean(),
}).strict();
const check = z.object({ id: key, label: text, kind: z.enum(['outcome', 'invariant']), condition, requirementId: text.optional(), requirementVersion: z.number().int().positive().optional() }).strict();

/** Domain schemas omit transaction fields, which the workspace service validates. */
export const labInputSchemas = {
  define_rehearsal: z.object({ id: text.optional(), opportunityId: text, title: text, goal: text, initialState: state, observableKeys: z.array(key).min(1).max(100), actions: z.array(action).min(1).max(30), checks: z.array(check).min(1).max(100), assumptions: z.array(text).max(100) }),
  start_rehearsal: z.object({ scenarioId: text }),
  observe_rehearsal: z.object({ runId: text }),
  act_in_rehearsal: z.object({ runId: text, actionId: text, intentId: z.string().trim().min(1).max(200), inputs: state.default({}) }),
  fork_rehearsal: z.object({ runId: text, atStep: z.number().int().nonnegative(), stateOverrides: state.optional() }),
  finish_rehearsal: z.object({ runId: text }),
};

function fail(code: string, message: string): never { throw new DomainError(code, message); }
function own(object: object, field: string): boolean { return Object.hasOwn(object, field); }
function kind(value: Value): string { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value; }
function same(a: Value | Record<string, Value>, b: Value | Record<string, Value>): boolean {
  if (a && b && !Array.isArray(a) && !Array.isArray(b) && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a).sort();
    return keys.length === Object.keys(b).length && keys.every(k => own(b, k) && same((a as State)[k], (b as State)[k]));
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
function resolve(operand: Operand, current: State, inputs: State): Value {
  if ('literal' in operand) return operand.literal;
  const object = 'state' in operand ? current : inputs;
  const field = 'state' in operand ? operand.state : operand.input;
  if (!own(object, field)) fail('invalid_input', `Missing value: ${field}`);
  return object[field];
}
function compare(actual: Value, operator: Condition['operator'], expected: Value): boolean {
  switch (operator) {
    case 'eq': return same(actual, expected);
    case 'ne': return !same(actual, expected);
    case 'includes': return typeof expected === 'string' && ((typeof actual === 'string' && actual.includes(expected)) || (Array.isArray(actual) && actual.includes(expected)));
    case 'gt': return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'gte': return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'lt': return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'lte': return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
  }
}
function satisfies(condition: Condition, current: State, inputs: State = {}): boolean {
  return compare(current[condition.field], condition.operator, resolve(condition.value, current, inputs));
}
function evaluate(scenario: Scenario, current: State): CheckResult[] {
  return scenario.checks.map(check => ({
    id: check.id, label: check.label, kind: check.kind, passed: satisfies(check.condition, current),
    actual: structuredClone(current[check.condition.field]), expected: structuredClone(resolve(check.condition.value, current, {})),
    ...(check.requirementId ? { requirementId: check.requirementId, requirementVersion: check.requirementVersion } : {}),
  }));
}
function report(run: Run): CheckResult[] {
  const initial = evaluate(run.scenario, run.initialState);
  return evaluate(run.scenario, run.state).map(current => {
    if (current.kind !== 'invariant') return current;
    // Keep the first failing observation, including the branch intervention itself.
    return [initial, ...run.steps.map(step => step.checks)].flat().find(check => check.id === current.id && !check.passed) ?? current;
  });
}
function runById(workspace: Workspace, runId: string): Run {
  return workspace.runs.find(run => run.id === runId) ?? fail('not_found', 'Rehearsal run not found in this engagement');
}
function requireRunning(run: Run): void { if (run.status !== 'running') fail('run_finished', 'This rehearsal is finished. Fork a step to try another approach.'); }
function visible(run: Run, current: State): State {
  return Object.fromEntries(run.scenario.observableKeys.map(key => [key, structuredClone(current[key])]));
}
function preconditionDescription(condition: Condition, run: Run): string {
  const visibleKeys = run.scenario.observableKeys;
  if (!visibleKeys.includes(condition.field) || ('state' in condition.value && !visibleKeys.includes(condition.value.state))) return 'The simulated service rejected a business precondition.';
  const expected = 'input' in condition.value ? `input ${condition.value.input}` : JSON.stringify(resolve(condition.value, run.state, {}));
  return `${condition.field} must satisfy ${condition.operator} ${expected}.`;
}

/** The candidate sees the service interface and observations, never scoring rules or hidden state. */
export function candidateView(workspace: Workspace, runId: string) {
  const run = runById(workspace, runId);
  return {
    runId: run.id, scenarioId: run.scenarioId, scenarioVersion: run.scenarioVersion,
    title: run.scenario.title, goal: run.scenario.goal, status: run.status, state: visible(run, run.state),
    actions: run.scenario.actions.map(action => {
      const blocked = action.preconditions.filter(condition => !('input' in condition.value) && !satisfies(condition, run.state));
      return { id: action.id, title: action.title, description: action.description, parameters: structuredClone(action.parameters), idempotent: action.idempotent, available: run.status === 'running' && blocked.length === 0, blockedBy: blocked.map(condition => preconditionDescription(condition, run)) };
    }),
    timeline: run.steps.map(step => ({ index: step.index, actionId: step.actionId, intentId: step.intentId, inputs: structuredClone(step.inputs), status: step.status, message: step.message, state: visible(run, step.after) })),
    ...(run.parentRunId ? { parentRunId: run.parentRunId, forkedAtStep: run.forkedAtStep } : {}),
  };
}

function validateScenario(workspace: Workspace, scenario: Scenario): void {
  if (!workspace.opportunities.some(opportunity => opportunity.id === scenario.opportunityId)) fail('not_found', 'Opportunity not found in this engagement');
  if (new Set(scenario.actions.map(action => action.id)).size !== scenario.actions.length) fail('invalid_definition', 'Action IDs must be unique');
  if (new Set(scenario.checks.map(check => check.id)).size !== scenario.checks.length) fail('invalid_definition', 'Check IDs must be unique');
  if (new Set(scenario.observableKeys).size !== scenario.observableKeys.length) fail('invalid_definition', 'Observable keys must be unique');
  if (!scenario.checks.some(check => check.kind === 'outcome')) fail('invalid_definition', 'Define at least one useful service outcome');
  const validateOperand = (operand: Operand, parameters: Record<string, unknown>) => {
    if ('state' in operand && !own(scenario.initialState, operand.state)) fail('invalid_definition', `Unknown state field: ${operand.state}`);
    if ('input' in operand && !own(parameters, operand.input)) fail('invalid_definition', `Unknown action input: ${operand.input}`);
  };
  const validateField = (field: string) => { if (!own(scenario.initialState, field)) fail('invalid_definition', `Unknown state field: ${field}`); };
  scenario.observableKeys.forEach(validateField);
  for (const action of scenario.actions) {
    if (Object.keys(action.parameters).length > 30) fail('invalid_definition', 'At most 30 inputs per action');
    for (const [name, parameter] of Object.entries(action.parameters)) {
      if (parameter.enum?.some(value => typeof value !== parameter.type)) fail('invalid_definition', `Enum values must match input type: ${name}`);
    }
    for (const expression of [...action.preconditions, ...action.effects]) {
      validateField(expression.field); validateOperand(expression.value, action.parameters);
    }
    for (const effect of action.effects) {
      if (effect.operation === 'increment' && typeof scenario.initialState[effect.field] !== 'number') fail('invalid_definition', `Increment needs numeric state: ${effect.field}`);
      if (effect.operation === 'append' && !Array.isArray(scenario.initialState[effect.field])) fail('invalid_definition', `Append needs list state: ${effect.field}`);
    }
  }
  for (const check of scenario.checks) {
    validateField(check.condition.field); validateOperand(check.condition.value, {});
    if (check.requirementVersion && !check.requirementId) fail('invalid_definition', 'A requirement version needs a requirement ID');
    if (check.requirementId) {
      const requirement = workspace.requirements.find(requirement => requirement.id === check.requirementId && requirement.opportunityId === scenario.opportunityId);
      if (!requirement) fail('not_found', 'Check requirement must belong to this opportunity');
      if (check.requirementVersion && requirement.version !== check.requirementVersion) fail('stale_requirement', `Requirement ${requirement.id} is at version ${requirement.version}`);
      check.requirementVersion = requirement.version;
    }
  }
}

export function executeLab(workspace: Workspace, name: string, args: unknown): { workspace: Workspace; result: unknown } {
  const schema = labInputSchemas[name as keyof typeof labInputSchemas];
  if (!schema) fail('unknown_tool', `Unknown Field Lab tool: ${name}`);
  const parsed = schema.safeParse(args);
  if (!parsed.success) fail('invalid_input', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  const input = parsed.data;
  // Pure transaction: a rejected operation cannot partly mutate the saved workspace.
  const next = structuredClone(workspace);
  if (name === 'define_rehearsal') {
    const definition = input as z.infer<typeof labInputSchemas.define_rehearsal>;
    const previous = definition.id ? next.scenarios.find(scenario => scenario.id === definition.id) : undefined;
    if (definition.id && !previous) fail('not_found', 'Scenario not found in this engagement');
    const scenario: Scenario = { ...definition, id: previous?.id ?? randomUUID(), version: (previous?.version ?? 0) + 1 };
    validateScenario(next, scenario);
    if (previous) next.scenarios[next.scenarios.indexOf(previous)] = scenario;
    else next.scenarios.push(scenario);
    return { workspace: next, result: { scenario } };
  }
  if (name === 'start_rehearsal') {
    const { scenarioId } = input as z.infer<typeof labInputSchemas.start_rehearsal>;
    const scenario = next.scenarios.find(scenario => scenario.id === scenarioId) ?? fail('not_found', 'Scenario not found in this engagement');
    const run: Run = { id: randomUUID(), scenarioId, scenarioVersion: scenario.version, scenario: structuredClone(scenario), initialState: structuredClone(scenario.initialState), state: structuredClone(scenario.initialState), steps: [], status: 'running', checks: evaluate(scenario, scenario.initialState), createdAt: new Date().toISOString() };
    next.runs.push(run);
    return { workspace: next, result: candidateView(next, run.id) };
  }
  const run = runById(next, (input as { runId: string }).runId);
  if (name === 'observe_rehearsal') return { workspace: next, result: candidateView(next, run.id) };
  if (name === 'finish_rehearsal') {
    run.checks = report(run); run.status = 'finished'; run.finishedAt ??= new Date().toISOString();
    return { workspace: next, result: { ...candidateView(next, run.id), outcome: run.checks.every(check => check.passed) ? 'passed' : 'failed', checks: structuredClone(run.checks) } };
  }
  if (name === 'fork_rehearsal') {
    const { atStep, stateOverrides = {} } = input as z.infer<typeof labInputSchemas.fork_rehearsal>;
    if (atStep > run.steps.length) fail('invalid_input', 'Fork step is beyond this run’s timeline');
    const branchState = structuredClone(atStep === 0 ? run.initialState : run.steps[atStep - 1].after);
    for (const [field, value] of Object.entries(stateOverrides)) {
      if (!own(branchState, field) || kind(value) !== kind(branchState[field])) fail('invalid_input', `Override must match an existing state field and type: ${field}`);
    }
    const branch: Run = { ...structuredClone(run), id: randomUUID(), state: branchState, steps: structuredClone(run.steps.slice(0, atStep)), status: 'running', parentRunId: run.id, forkedAtStep: atStep, createdAt: new Date().toISOString() };
    delete branch.finishedAt;
    if (Object.keys(stateOverrides).length) {
      const before = structuredClone(branch.state);
      Object.assign(branch.state, stateOverrides);
      branch.steps.push({ index: branch.steps.length + 1, actionId: '$fork', intentId: branch.id, inputs: {}, status: 'committed', message: 'Scenario conditions changed at this branch.', before, after: structuredClone(branch.state), checks: evaluate(branch.scenario, branch.state) });
    }
    branch.checks = report(branch); next.runs.push(branch);
    return { workspace: next, result: candidateView(next, branch.id) };
  }
  requireRunning(run);
  const { actionId, intentId, inputs } = input as z.infer<typeof labInputSchemas.act_in_rehearsal>;
  const action = run.scenario.actions.find(action => action.id === actionId) ?? fail('not_found', 'Action not found in this rehearsal');
  const attempts = run.steps.filter(step => step.intentId === intentId);
  if (attempts.some(step => step.actionId !== actionId || !same(step.inputs, inputs))) fail('intent_conflict', 'This intent ID already identifies a different action or input. Keep one intent per operation.');
  const committed = attempts.find(step => step.status !== 'rejected');
  if (committed) {
    if (!action.idempotent) fail('intent_already_attempted', 'This action does not support replay. Observe the service state before deciding on another operation.');
    return { workspace: next, result: { ...candidateView(next, run.id), actionResult: { status: 'committed', message: 'Previously committed operation acknowledged; no new effect.', replayed: true, stepIndex: committed.index } } };
  }
  for (const field of Object.keys(inputs)) if (!own(action.parameters, field)) fail('invalid_input', `Unknown action input: ${field}`);
  for (const [field, parameter] of Object.entries(action.parameters)) {
    if (!own(inputs, field)) { if (parameter.required) fail('invalid_input', `Required action input: ${field}`); continue; }
    if (typeof inputs[field] !== parameter.type || (parameter.enum && !parameter.enum.some(value => same(value, inputs[field])))) fail('invalid_input', `Invalid value for action input: ${field}`);
  }
  const failed = action.preconditions.filter(condition => !satisfies(condition, run.state, inputs));
  const before = structuredClone(run.state);
  if (!failed.length) {
    // Resolve each effect in sequence against a private draft. Nothing is committed if any effect fails.
    const draft = structuredClone(run.state);
    for (const effect of action.effects) {
      const value = resolve(effect.value, draft, inputs);
      if (effect.operation === 'set') {
        if (kind(draft[effect.field]) !== kind(value)) fail('invalid_input', `Effect value type does not match state field: ${effect.field}`);
        draft[effect.field] = structuredClone(value);
      } else if (effect.operation === 'increment') {
        if (typeof value !== 'number' || typeof draft[effect.field] !== 'number') fail('invalid_input', 'Increment requires numbers');
        const sum = (draft[effect.field] as number) + value;
        if (!Number.isFinite(sum)) fail('invalid_input', 'Numeric state exceeds supported range');
        draft[effect.field] = sum;
      } else {
        if (typeof value !== 'string' || value.length > 2000 || !Array.isArray(draft[effect.field])) fail('invalid_input', 'Append requires a string of at most 2,000 characters and a list');
        const list = draft[effect.field] as string[];
        if (list.length >= 500) fail('limit_exceeded', 'State lists support at most 500 entries');
        list.push(value);
      }
    }
    run.state = draft;
  }
  if (run.steps.length >= 1000) fail('limit_exceeded', 'Finish or fork this rehearsal; runs support 1,000 steps');
  const status = failed.length ? 'rejected' : action.response === 'timeout_after_commit' ? 'timeout' : 'committed';
  const message = failed.length ? failed.map(condition => preconditionDescription(condition, run)).join(' ') : status === 'timeout' ? 'The service response timed out. The operation outcome is unknown; observe before retrying.' : 'Operation completed.';
  const step = { index: run.steps.length + 1, actionId, intentId, inputs: structuredClone(inputs), status, message, before, after: structuredClone(run.state), checks: evaluate(run.scenario, run.state) } as const;
  run.steps.push(step); run.checks = report(run);
  const actionResult = { status, message, replayed: false, stepIndex: step.index };
  if (status === 'timeout') {
    // An ambiguous acknowledgement must not accidentally reveal the committed state.
    return { workspace: next, result: { runId: run.id, scenarioId: run.scenarioId, scenarioVersion: run.scenarioVersion, status: run.status, actionResult, next: 'Call observe_rehearsal to inspect the service, or replay this intent if the action supports idempotency.' } };
  }
  return { workspace: next, result: { ...candidateView(next, run.id), actionResult } };
}

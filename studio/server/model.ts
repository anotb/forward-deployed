/** Shared, serializable workspace contract. The agent supplies reasoning; tools preserve and exercise it. */
export type Value = string | number | boolean | null | string[];
export type State = Record<string, Value>;
export interface Engagement {
  id: string; name: string; ambition: string; customer: string;
  revision: number; createdAt: string; updatedAt: string;
}
export interface Evidence {
  id: string; title: string; kind: 'meeting' | 'document' | 'observation';
  content: string; uri?: string; originId?: string; occurredAt?: string;
  status: 'preliminary' | 'final'; participants: string[]; version: number;
}
export interface EvidenceRef { evidenceId: string; version: number; quote: string }
export interface Measure { name: string; unit: string; baseline?: number; target?: number; basis: string }
export interface Opportunity {
  id: string; title: string; beneficiary: string; currentWorkflow: string;
  proposedService: string; whyItMatters: string; evidenceRefs: EvidenceRef[];
  measures: Measure[]; assumptions: string[]; version: number;
}
export interface Requirement {
  id: string; opportunityId: string; title: string; behavior: string;
  acceptanceCriteria: string[]; evidenceRefs: EvidenceRef[];
  status: 'proposed' | 'confirmed'; version: number;
}
export interface WorkItem {
  id: string; opportunityId: string; requirementIds: string[]; title: string;
  owner: string; status: 'planned' | 'active' | 'blocked' | 'done';
  outcome: string; evidence: string; version: number;
}
export type Operand = { literal: Value } | { input: string } | { state: string };
export interface Condition { field: string; operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'includes'; value: Operand }
export interface Effect { field: string; operation: 'set' | 'increment' | 'append'; value: Operand }
export interface ActionParameter { type: 'string' | 'number' | 'boolean'; description: string; required: boolean; enum?: Value[] }
export interface RehearsalAction {
  id: string; title: string; description: string; parameters: Record<string, ActionParameter>;
  preconditions: Condition[]; effects: Effect[];
  response: 'success' | 'timeout_after_commit'; idempotent: boolean;
}
export interface RehearsalCheck {
  id: string; label: string; kind: 'outcome' | 'invariant'; condition: Condition;
  requirementId?: string; requirementVersion?: number;
}
export interface Scenario {
  id: string; opportunityId: string; title: string; goal: string;
  initialState: State; observableKeys: string[]; actions: RehearsalAction[];
  checks: RehearsalCheck[]; assumptions: string[]; version: number;
}
export interface CheckResult { id: string; label: string; kind: 'outcome' | 'invariant'; passed: boolean; actual: Value; expected: Value; requirementId?: string; requirementVersion?: number }
export interface Step {
  index: number; actionId: string; intentId: string; inputs: Record<string, Value>;
  status: 'committed' | 'rejected' | 'timeout'; message: string;
  before: State; after: State; checks: CheckResult[];
}
export interface Run {
  id: string; scenarioId: string; scenarioVersion: number; scenario: Scenario;
  initialState: State; state: State; steps: Step[]; status: 'running' | 'finished';
  parentRunId?: string; forkedAtStep?: number;
  checks: CheckResult[]; createdAt: string; finishedAt?: string;
}
export interface Workspace {
  engagement: Engagement; evidence: Evidence[]; opportunities: Opportunity[];
  requirements: Requirement[]; work: WorkItem[]; scenarios: Scenario[]; runs: Run[];
  evidenceHistory?: Evidence[]; requirementHistory?: Requirement[]; opportunityHistory?: Opportunity[];
  workHistory?: WorkItem[]; changeProposals?: ChangeProposal[];
}
export type ChangeKind = 'evidence' | 'opportunity' | 'requirement' | 'work';
export type ChangeFields = Partial<Omit<Evidence, 'id' | 'version'>> | Partial<Omit<Opportunity, 'id' | 'version'>> | Partial<Omit<Requirement, 'id' | 'version'>> | Partial<Omit<WorkItem, 'id' | 'version'>>;
export interface ProposedChange {
  id: string; kind: ChangeKind; operation: 'create' | 'update'; recordId: string; expectedVersion?: number;
  fields: ChangeFields; status: 'pending' | 'accepted' | 'rejected';
  before?: Evidence | Opportunity | Requirement | WorkItem;
  reviewedAt?: string; note?: string;
}
export interface ChangeReviewEvent {
  at: string; changeId: string; decision: 'accept' | 'reject' | 'revise'; note?: string;
  previousFields?: ChangeFields;
}
export interface ChangeImpact {
  requirements: string[]; work: string[]; scenarios: string[]; runs: string[];
  staleChecks: { scenarioId: string; requirementId: string; testedVersion: number; proposedVersion: number }[];
  staleEvidenceRefs: { kind: 'opportunity' | 'requirement'; recordId: string; evidenceId: string; citedVersion: number; proposedVersion: number }[];
  conflicts: { changeId: string; message: string }[];
}
export interface ChangeProposal {
  id: string; title: string; reason: string; version: number; baseRevision: number;
  status: 'pending' | 'resolved'; createdAt: string; updatedAt: string;
  changes: ProposedChange[]; reviews: ChangeReviewEvent[];
}
export class DomainError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = 'DomainError'; }
}

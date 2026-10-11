import type { Workspace } from '../server/model.js';

export type Selection = { kind: 'opportunity' | 'requirement' | 'evidence' | 'work' | 'run'; id: string; step?: number };
export function selectedRecord(workspace: Workspace, selection?: Selection) {
  if (!selection) return undefined;
  const collection = { opportunity: workspace.opportunities, requirement: workspace.requirements, evidence: workspace.evidence, work: workspace.work, run: workspace.runs }[selection.kind];
  return collection.find(record => record.id === selection.id);
}
export function selectionContext(workspace: Workspace, selection?: Selection) {
  const record = selectedRecord(workspace, selection);
  if (!selection || !record) return { engagementId: workspace.engagement.id, revision: workspace.engagement.revision, selection: null };
  if (selection.kind === 'run' && 'steps' in record) {
    const step = selection.step === undefined ? record.steps.length : Math.min(Math.max(selection.step, 0), record.steps.length);
    return { engagementId: workspace.engagement.id, revision: workspace.engagement.revision, selection: { ...selection, step }, record: { id: record.id, scenarioId: record.scenarioId, title: record.scenario.title, status: record.status, state: record.steps[step - 1]?.after ?? record.initialState, checks: step ? record.steps[step - 1]?.checks : [], finalChecks: record.checks } };
  }
  return { engagementId: workspace.engagement.id, revision: workspace.engagement.revision, selection, record };
}

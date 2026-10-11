import type { Workspace } from '../server/model.js';
export type DecisionForm = 'discovery' | 'service' | 'delivery';
const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const input = (label: string, name: string, value: string, required = true) => `<label>${label}<input name="${name}" value="${esc(value)}" ${required ? 'required' : ''} /></label>`;
const area = (label: string, name: string, value: string, required = true) => `<label class="full">${label}<textarea name="${name}" ${required ? 'required' : ''}>${esc(value)}</textarea></label>`;
export function decisionForm(kind: DecisionForm, workspace: Workspace, opportunityId: string, workId: string): string {
  const opportunity = workspace.opportunities.find(item => item.id === opportunityId);
  const work = workspace.work.find(item => item.id === workId) ?? workspace.work[0];
  let title: string, body: string, submit: string;
  if (kind === 'discovery') {
    title = 'Review discovery'; submit = 'Develop selected findings';
    body = `<p class="meta">Choose the source material and service directions to discuss. Your agent will propose changes for review.</p><fieldset><legend>Source material</legend>${workspace.evidence.map(item => `<label class="choice"><input type="checkbox" name="sources" value="${esc(item.id)}" checked /><span><strong>${esc(item.title)}</strong><small>${esc(item.kind)} · ${esc(item.status)}</small></span></label>`).join('') || '<p class="meta">Add source material before reviewing discovery.</p>'}</fieldset><fieldset><legend>Service directions</legend>${workspace.opportunities.map(item => `<label class="choice"><input type="checkbox" name="opportunities" value="${esc(item.id)}" ${item.id === opportunityId ? 'checked' : ''} /><span><strong>${esc(item.title)}</strong><small>${esc(item.proposedService)}</small></span></label>`).join('') || '<p class="meta">The agent will propose directions from the selected sources.</p>'}</fieldset>${area('Corrections, constraints or unanswered questions', 'notes', '', false)}`;
  } else if (kind === 'service') {
    title = 'Refine the service'; submit = 'Propose service changes';
    if (!opportunity) return '<p>No service has been proposed yet. Develop one from Sources first.</p>';
    body = `<p class="meta">Start from the current design. Changes go to Review before they update the engagement.</p><input type="hidden" name="recordId" value="${esc(opportunity.id)}" /><div class="form-grid">${input('Service', 'title', opportunity.title)}${input('Who uses it', 'beneficiary', opportunity.beneficiary)}${area('Proposed workflow and human decisions', 'proposedService', opportunity.proposedService)}${area('Working assumptions, one per line', 'assumptions', opportunity.assumptions.join('\n'), false)}${area('Reason for the change', 'reason', '', true)}</div>`;
  } else {
    title = 'Prepare delivery'; submit = 'Propose delivery changes';
    if (!work) return '<p>No delivery work is planned yet. Ask your agent to plan the implementation first.</p>';
    body = `<p class="meta">Review the deliverable and owner. Changes go to Review before they update the plan.</p><label>Work item<select data-change="form-work" name="recordId">${workspace.work.map(item => `<option value="${esc(item.id)}" ${work.id === item.id ? 'selected' : ''}>${esc(item.title)}</option>`).join('')}</select></label><div class="form-grid">${input('Owner', 'owner', work.owner, false)}<label>Status<select name="status">${['planned', 'active', 'blocked', 'done'].map(status => `<option ${work.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>${area('Deliverable', 'outcome', work.outcome)}${area('Completion evidence', 'evidence', work.evidence, false)}${area('Reason for the change', 'reason', '', true)}</div>`;
  }
  return `<form data-form="decision-${kind}" class="decision-form"><div class="section-head"><h2>${title}</h2><button type="button" class="button small" data-action="close-editor">Close</button></div>${body}<div class="actions"><button class="button primary" type="submit" ${kind === 'discovery' && !workspace.evidence.length ? 'disabled' : ''}>${submit}</button></div></form>`;
}

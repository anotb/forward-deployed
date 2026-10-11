import type { ChangeImpact, ChangeProposal, ProposedChange, Workspace } from '../server/model.js';

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const label = (value: string): string => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase());
export type ReviewChoice = 'accept' | 'reject';
export type ReviewChoices = Record<string, ReviewChoice>;
export const reviewKey = (proposalId: string, changeId: string): string => `${proposalId}:${changeId}`;
export function currentReviewChoices(previous: Workspace | undefined, next: Workspace, choices: ReviewChoices): ReviewChoices {
  const kept: ReviewChoices = {};
  for (const proposal of next.changeProposals ?? []) {
    if (previous?.changeProposals?.find(item => item.id === proposal.id)?.version !== proposal.version) continue;
    for (const change of proposal.changes) {
      const key = reviewKey(proposal.id, change.id);
      if (change.status === 'pending' && choices[key]) kept[key] = choices[key];
    }
  }
  return kept;
}
export function reviewValue(value: unknown): string {
  if (value === undefined || value === '') return 'Not set';
  if (Array.isArray(value)) return value.length ? value.map(reviewValue).join('\n') : 'None';
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${label(key)}: ${reviewValue(item)}`).join(' · ');
  return String(value);
}
export function editableFields(change: ProposedChange): [string, unknown][] {
  const merged = { ...change.before, ...change.fields };
  const names: Record<string, string[]> = { evidence: ['title', 'content', 'status', 'participants'], opportunity: ['title', 'beneficiary', 'currentWorkflow', 'proposedService', 'whyItMatters', 'assumptions'], requirement: ['title', 'behavior', 'acceptanceCriteria', 'status'], work: ['title', 'owner', 'outcome', 'status', 'evidence'] };
  return names[change.kind].filter(name => name in merged).map(name => [name, (merged as unknown as Record<string, unknown>)[name]]);
}
export function editChangeForm(proposal: ChangeProposal, change: ProposedChange): string {
  return `<form data-form="revise-change" data-proposal="${esc(proposal.id)}" data-change-id="${esc(change.id)}" class="change-editor"><h3>Edit proposed change</h3><p class="meta">Saving keeps this as a proposal. Apply it after reviewing the revised fields.</p><div class="form-grid">${editableFields(change).map(([key, value]) => key === 'status' ? `<label>${label(key)}<select name="edit:${key}">${(change.kind === 'evidence' ? ['preliminary', 'final'] : change.kind === 'requirement' ? ['proposed', 'confirmed'] : ['planned', 'active', 'blocked', 'done']).map(status => `<option ${value === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>` : `<label class="${['title', 'owner', 'beneficiary'].includes(key) ? '' : 'full'}">${label(key)}${['title', 'owner', 'beneficiary'].includes(key) ? `<input name="edit:${key}" value="${esc(value)}" required />` : `<textarea name="edit:${key}" ${['content', 'behavior', 'outcome', 'proposedService'].includes(key) ? 'required' : ''}>${esc(Array.isArray(value) ? value.join('\n') : value)}</textarea>`}${Array.isArray(value) ? '<small>One item per line.</small>' : ''}</label>`).join('')}</div><div class="actions"><button class="button primary" type="submit">Save proposal</button><button class="button" type="button" data-action="cancel-revise">Cancel</button></div></form>`;
}
function impactView(workspace: Workspace, impact?: ChangeImpact): string {
  if (!impact) return '<p class="meta">Refresh to calculate linked records and version conflicts.</p>';
  const groups: [string, string[], { id: string; title?: string }[]][] = [['Requirements', impact.requirements, workspace.requirements], ['Delivery work', impact.work, workspace.work], ['Rehearsals', impact.scenarios, workspace.scenarios], ['Recorded runs', impact.runs, workspace.runs]];
  return `<aside class="review-impact"><h3>Linked work</h3><p class="meta">Existing links identify what to revisit. They do not predict business outcomes.</p>${groups.filter(([, ids]) => ids.length).map(([name, ids, records]) => `<details><summary>${name} · ${ids.length}</summary><ul>${ids.map(id => `<li>${esc(records.find(record => record.id === id)?.title ?? id)}</li>`).join('')}</ul></details>`).join('') || '<p class="meta">No linked records are affected.</p>'}${impact.staleChecks.length ? `<p class="impact-warning">${impact.staleChecks.length} rehearsal ${impact.staleChecks.length === 1 ? 'check tests an older requirement' : 'checks test older requirements'}. Update the checks and run the rehearsal again.</p>` : ''}${impact.staleEvidenceRefs.length ? `<p class="impact-warning">${impact.staleEvidenceRefs.length} source ${impact.staleEvidenceRefs.length === 1 ? 'citation needs' : 'citations need'} review after this change.</p>` : ''}${impact.conflicts.map(item => `<p class="impact-warning">${esc(item.message)}</p>`).join('')}</aside>`;
}
export function reviewView(workspace: Workspace, impacts: Record<string, ChangeImpact>, choices: ReviewChoices, editing: string, busy: boolean, embedded = false): string {
  const proposals = [...workspace.changeProposals ?? []].sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved'));
  return `<div class="section-head"><div><h2>Review changes</h2><p>Compare proposed changes with the current engagement before applying them.</p></div><button class="button" data-action="prompt-changes">Propose changes</button></div>${proposals.length ? proposals.map(proposal => {
    const pending = proposal.changes.filter(change => change.status === 'pending');
    const selected = pending.filter(change => choices[reviewKey(proposal.id, change.id)]);
    const accepted = selected.filter(change => choices[reviewKey(proposal.id, change.id)] === 'accept').length;
    return `<section class="proposal"><div class="section-head"><div><h2>${esc(proposal.title)}</h2><p>${esc(proposal.reason)}</p><p class="meta">${pending.length ? `${pending.length} pending` : 'Reviewed'} · Proposed at revision ${proposal.baseRevision}</p></div></div><div class="review-layout"><div>${proposal.changes.map(change => {
      const key = reviewKey(proposal.id, change.id);
      const before = change.before as unknown as Record<string, unknown> | undefined;
      return `<article class="proposed-change"><div class="row-head"><div><h3>${esc((change.fields as Record<string, unknown>).title ?? before?.title ?? change.recordId)}</h3><p class="meta">${label(change.kind)} · ${change.operation === 'create' ? 'New record' : `Update v${change.expectedVersion}`}</p></div><span class="badge ${change.status === 'accepted' ? 'pass' : 'neutral'}">${esc(change.status)}</span></div><div class="change-diff">${Object.entries(change.fields).filter(([name, value]) => JSON.stringify(value) !== JSON.stringify(before?.[name])).map(([name, value]) => `<section class="diff-field"><h4>${label(name)}</h4><div class="diff-pair"><div><span class="diff-label">Current</span><p>${esc(change.operation === 'create' ? 'New record' : reviewValue(before?.[name]))}</p></div><div><span class="diff-label">Proposed</span><p>${esc(reviewValue(value))}</p></div></div></section>`).join('')}</div>${change.status === 'pending' ? `<div class="review-decisions" role="group" aria-label="Decision for ${esc((change.fields as Record<string, unknown>).title ?? change.recordId)}"><button class="button small" data-action="choose-review" data-proposal="${esc(proposal.id)}" data-change-id="${esc(change.id)}" data-decision="accept" aria-pressed="${choices[key] === 'accept'}">Accept</button><button class="button small" data-action="choose-review" data-proposal="${esc(proposal.id)}" data-change-id="${esc(change.id)}" data-decision="reject" aria-pressed="${choices[key] === 'reject'}">Reject</button><button class="button small" data-action="edit-change" data-proposal="${esc(proposal.id)}" data-change-id="${esc(change.id)}">Edit proposal</button></div>${editing === key ? editChangeForm(proposal, change) : ''}` : change.note ? `<p class="meta">${esc(change.note)}</p>` : ''}</article>`;
    }).join('')}${pending.length ? `<div class="review-apply"><div><strong>${selected.length ? `${accepted} to accept · ${selected.length - accepted} to reject` : 'Choose changes to accept or reject'}</strong><p class="meta">${selected.length ? 'Selected decisions are applied together. Unselected changes stay pending.' : 'Review each change above. Nothing is selected automatically.'}</p></div><button class="button primary" data-action="apply-review" data-proposal="${esc(proposal.id)}" ${busy || !selected.length ? 'disabled' : ''}>Apply selected</button></div>` : '<p class="meta">All changes in this proposal have been reviewed.</p>'}</div>${pending.length ? impactView(workspace, impacts[proposal.id]) : ''}</div></section>`;
  }).join('') : '<section class="empty"><h2>No proposed changes yet</h2><p>After discovery, ask your agent to propose updates to the service, requirements or delivery work. You can review each change here before it becomes part of the engagement.</p></section>'}`;
}

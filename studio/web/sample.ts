import type { Workspace } from '../server/model.js';

/** An editable fictional FDE engagement, not a completed implementation or credit assessment. */
export function sampleWorkspace(id: string = crypto.randomUUID(), now: string = new Date().toISOString()): Workspace {
  const discovery = 'Portfolio managers assemble borrower updates from financial statements, CRM notes and prior reviews. The weekly pack is often stale when a revised statement arrives. We want the AI to explain what changed, show its sources and help the analyst decide what deserves attention.';
  const integration = 'The document store can report new uploads, but borrower identifiers are inconsistent and corrected files may reuse a filename. CRM is available through a read API. Start with a shadow pilot alongside analysts; do not change credit ratings or contact borrowers automatically.';
  const workspace: Workspace = {
    engagement: {
      id, name: 'AI credit monitoring · fictional sample', customer: 'Commercial banking portfolio team',
      ambition: 'Shape, build and pilot an AI service that helps portfolio managers spot material changes across borrower information. Resolve data integration and analyst workflow choices before delivery. All discovery notes are fictional; implementation and pilot results are not yet available.',
      revision: 1, createdAt: now, updatedAt: now,
    },
    evidence: [
      { id: 'sample-discovery', title: 'Portfolio discovery · fictional notes', kind: 'meeting', content: discovery, participants: ['Fictional portfolio manager', 'Fictional credit analyst'], status: 'final', version: 1 },
      { id: 'sample-integration', title: 'Data team walkthrough · fictional notes', kind: 'meeting', content: integration, participants: ['Fictional data platform lead'], status: 'final', version: 1 },
    ],
    opportunities: [{
      id: 'sample-service', title: 'Source-linked borrower change intelligence', beneficiary: 'Commercial credit analysts and portfolio managers',
      currentWorkflow: 'Analysts assemble a weekly review pack from statements, relationship notes and prior assessments, then reconcile revisions manually.',
      proposedService: 'Connect borrower documents and CRM context, extract changes against the last reviewed information, and draft a source-linked explanation for analyst review. Begin with weekly preparation while validating document identity and freshness.',
      whyItMatters: 'Help analysts direct attention to material borrower changes and spend less time rebuilding context. The pilot must establish whether the service improves coverage and preparation time.',
      evidenceRefs: [{ evidenceId: 'sample-discovery', version: 1, quote: 'We want the AI to explain what changed, show its sources and help the analyst decide what deserves attention.' }],
      measures: [
        { name: 'Analyst preparation time', unit: 'minutes per review', basis: 'Measure the current workflow and shadow pilot on comparable borrower reviews; no baseline or target established.' },
        { name: 'Material changes missed', unit: 'reviewer-confirmed omissions', basis: 'Compare service output with analyst-reviewed examples, including revised documents and conflicting sources.' },
      ],
      assumptions: ['Borrower identity can be reconciled across documents and CRM.', 'Historical reviews may be used to build a representative evaluation set; access and coverage need confirmation.'], version: 1,
    }],
    requirements: [
      { id: 'sample-freshness', opportunityId: 'sample-service', title: 'Build a current borrower evidence set', behavior: 'Prepare a weekly evidence set using the latest available statement and CRM context for each borrower. Retain document versions and flag unresolved borrower matches for analyst review.', acceptanceCriteria: ['A corrected statement replaces the earlier version in the next weekly pack while preserving its history.', 'An ambiguous borrower match is withheld from the brief and shown for resolution.'], evidenceRefs: [{ evidenceId: 'sample-integration', version: 1, quote: 'The document store can report new uploads, but borrower identifiers are inconsistent and corrected files may reuse a filename.' }], status: 'proposed', version: 1 },
      { id: 'sample-analysis', opportunityId: 'sample-service', title: 'Explain changes without inventing conclusions', behavior: 'Draft an explanation of material changes with links to source passages and reporting periods. Separate extracted facts from model interpretation; the analyst decides what enters the portfolio review.', acceptanceCriteria: ['Every stated change identifies the source versions and periods being compared.', 'Missing or conflicting evidence is explicit; the draft does not fill gaps with invented values.', 'The shadow pilot does not change credit ratings or send borrower communications.'], evidenceRefs: [{ evidenceId: 'sample-integration', version: 1, quote: 'Start with a shadow pilot alongside analysts; do not change credit ratings or contact borrowers automatically.' }], status: 'proposed', version: 1 },
    ],
    work: [
      { id: 'sample-data-build', opportunityId: 'sample-service', requirementIds: ['sample-freshness'], title: 'Build document identity and ingestion', owner: 'Proposed: FDE and data platform team', status: 'planned', outcome: 'Validate access, map borrower identifiers, preserve document versions and produce a reproducible weekly evidence set. Test corrected uploads and ambiguous matches.', evidence: '', version: 1 },
      { id: 'sample-pilot', opportunityId: 'sample-service', requirementIds: ['sample-freshness', 'sample-analysis'], title: 'Build and run an analyst shadow pilot', owner: 'Proposed: FDE and credit operations lead', status: 'planned', outcome: 'Implement cited change summaries and analyst feedback. Build reviewed examples, compare preparation time and missed changes, and decide which failure cases block broader use.', evidence: '', version: 1 },
    ],
    scenarios: [], runs: [],
  };
  workspace.changeProposals = [{
    id: 'sample-proposal', title: 'Refresh affected borrowers when evidence changes',
    reason: 'Weekly preparation is simpler to operate, but can leave a corrected statement out of an active review. Upload-triggered refresh would reduce that gap and add version matching, replay protection and missed-event recovery to the build. Confirm this scope choice before implementation.',
    version: 1, baseRevision: 1, status: 'pending', createdAt: now, updatedAt: now, reviews: [],
    changes: [{
      id: 'sample-change', kind: 'requirement', operation: 'update', recordId: 'sample-freshness', expectedVersion: 1, before: structuredClone(workspace.requirements[0]),
      fields: {
        behavior: 'Refresh the affected borrower evidence set when a new or corrected document arrives. Preserve versions, invalidate summaries based on superseded evidence and flag unresolved borrower matches. Keep a scheduled reconciliation to recover missed upload events.',
        acceptanceCriteria: ['A corrected statement marks the earlier summary as superseded and prepares a new draft for analyst review.', 'Replaying an upload event does not create duplicate change summaries.', 'A missed upload is recovered by scheduled reconciliation.', 'An ambiguous borrower match is withheld from the brief and shown for resolution.'],
        evidenceRefs: [...workspace.requirements[0].evidenceRefs, { evidenceId: 'sample-discovery', version: 1, quote: 'The weekly pack is often stale when a revised statement arrives.' }],
      },
      status: 'pending',
    }],
  }];
  return workspace;
}

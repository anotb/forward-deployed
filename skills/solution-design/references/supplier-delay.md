# Worked design: resolving the impact of a supplier delay

Illustrative case: a manufacturer learns that a supplier shipment will be late. Planners read emails, inspect purchase orders and inventory, consult engineering about substitutes, and negotiate with customer teams. The opportunity is to investigate the impact and prepare feasible responses while the organization still has time to act.

The service begins with a delay signal and tries to establish what changed. It reconciles the supplier's description with the purchase-order line and shipment, identifies the affected demand, and distinguishes stock on hand from stock already allocated. It retrieves the applicable product revision before considering substitutes. This domain matters: a component that fits physically may lack approval for the customer's configuration, and a late shipment may contain parts for several commitments.

The reasoning then branches according to the case. It may investigate a conflicting estimated arrival, search approved alternatives, ask for a missing engineering constraint, or compare reallocation and rescheduling options. Existing planning calculations determine the effects on dates and quantities. The model interprets uneven correspondence, selects useful investigations, and explains the tradeoffs among feasible responses. Planners review a compact option comparison inside their work queue.

The case system owns the disruption case and its resolution. Source systems retain authority for commitments, product approval, and inventory. The service owns proposed analyses linked to those source versions. It can prepare a change, while the existing business operation makes the accepted commitment. This avoids treating the generated plan as an already-executed schedule.

During review, engineering changes a substitution rule and a shipment update arrives. The service marks the affected options for reevaluation, preserves conclusions unrelated to those changes, and recomputes the feasibility of the pending proposal. It tells the planner what changed. If the planner has already acted, the new information becomes a follow-up on the accepted case rather than silently rewriting history.

An initial deployment could cover one component family and prepare response options for planners. Its first serious experiment should include an ambiguous shipment match, a tempting unapproved substitute, a conflict in allocation, and a source change while a proposal is pending. These cases test the value mechanism and the enterprise seams together. A fluent summary of the delay email would leave the central proposition untested.

The tradeoff is broader than agent autonomy. Live allocation access may be expensive to introduce, while a dated snapshot supports overnight planning. That could be a worthwhile first service if planners understand its decision window and commitments are rechecked before action. If the business needs immediate replanning, the live integration becomes central to feasibility. Design the deployment around that choice and the responsible operating team.

## Make a choice from operating constraints

The following extension is fictional teaching material, not a completed customer project or executed capability test. It shows how the argument becomes a recommendation when the source constraints are known.

Assume a plant's planners prepare tomorrow's customer review each afternoon. The existing ERP can export allocations at noon. Planners can inspect live availability and commit changes in the ERP, but there is no supported agent-accessible reservation operation in this installation. Engineering maintains approved substitutions by component revision. Supplier emails often mention a family name while the purchase order uses a specific revision.

Compare two useful services:

| Choice | What the operator receives | What must work | Material limitation |
|---|---|---|---|
| Prepared impact dossier | Affected commitments and feasible-looking alternatives, tied to the noon snapshot and engineering revision | Resolve shipment lines and component revisions; calculate dates/quantities; explain uncertain matches | Availability must be checked in the ERP before a commitment. The dossier cannot promise stock. |
| Maintained response queue | Proposals refreshed when allocation or substitution state changes, with a supported reservation path | All dossier capabilities plus source updates, command semantics and an operating owner for stalled cases | Not buildable from the installed interfaces alone; introduces integration and operating work. |

Choose the prepared dossier for this first population because the decision occurs in an existing review and the planner already performs the live commitment. Preserve the useful intelligence: find affected demand, investigate ambiguous supplier references, and compare approved alternatives. Do not reduce the product to an email summary just because automated reservation is unavailable.

The maintained queue remains a credible target if daytime replanning becomes valuable enough to justify the missing integration. It is not automatically superior: frequent changing proposals may increase planner review without improving accepted commitments. The expansion decision needs observed stale-option frequency, time spent repairing dossiers, and the value of decisions missed between snapshots, rather than a preference for an agentic architecture.

## One behavior path that engineers and operators can challenge

A supplier says “the R-series shipment is delayed two days.” Purchase-order line L7 concerns R2 components; L8 concerns R3. Only L7 has a confirmed revised date. The dossier preserves uncertainty for L8 instead of applying the two-day delay to the whole family. It links L7 to affected customer commitments using the noon allocation snapshot. A tempting R3 substitute is excluded for an R2 customer configuration unless engineering's applicable approval supports it.

The planner sees which commitments were affected, why a proposed substitute is feasible, which fact is uncertain, and what requires a live check. The ERP remains authoritative for accepted allocation changes. The service can record that a dossier was prepared or reviewed without claiming the customer commitment changed.

If engineering withdraws the R2 substitution approval before review, the option depends on an obsolete revision. Refresh that option and explain the change; keep the confirmed delay and unrelated affected commitments. If the source provides no change notification, refreshing the relevant approval at review time may be enough for this workflow. That choice should be explicit in the experience and operating responsibility.

## The probe that could reverse the choice

Use a representative delayed shipment and ask a planner to complete the existing review with a generated dossier and the usual ERP access. Inspect whether source links let them validate the proposed options without recreating the analysis. Separately test an ambiguous family reference and an approval withdrawn between preparation and review.

If the planner repeatedly rebuilds options because allocation changes make the noon snapshot unusable, the proposed first service has lost its value. Obtain a fresher supported read path, narrow the eligible cases to a stable planning window, or reconsider the deployment. If the dossier remains useful but the document interpretation fails even with applicable evidence, repair or reject that capability before investing in the maintained queue. These are different reasons to change the design.

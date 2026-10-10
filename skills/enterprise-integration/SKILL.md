---
name: enterprise-integration
description: Design and investigate how an AI workflow operates across enterprise systems, business objects, identities, and teams. Use for integration choices, engineering contracts, domain meaning, asynchronous business actions, or diagnosis of a solution that reads correctly but cannot reliably complete work.
---

# Enterprise integration

Make the proposed capability work in the enterprise's operating reality. Begin with a consequential unit of work and follow it through the systems and people needed to complete it. A connector inventory is useful only when it explains what the solution can know, decide, commit, and verify.

Work at the requested depth. A solution discussion may need a decisive architecture and a few discriminating probes. An inherited deployment may need a diagnosis and repair brief for one broken boundary. Route requested implementation into the selected engineering or coding workflow with the integration contract and receiving-system checks. Preserve functioning interfaces and existing business decisions while resolving the seams that prevent the intended outcome.

## Establish what the business objects mean

Reconstruct the business transaction before designing the technical one. Identify which real-world entity or episode each record describes, what changes over its life, and which relationship permits one record to inform another. Ask an operator to walk a recent case across the relevant applications; inspect records and change histories rather than relying only on a process diagram.

Many consequential errors are correct joins with the wrong meaning. A borrower, guarantor, facility, and relationship group may all carry a customer identifier while representing different obligations. A site equipment label can survive replacement of the physical machine. A shipment line and an order line may differ after partial fulfillment. Do not let a convenient key erase those distinctions.

Resolve meaning at the level that changes the decision. Distinguish requested, approved, committed, performed, accepted, and settled when the workflow treats them differently. Available inventory is not reserved inventory; a credit approval is not authority to draw funds; an ERP work-order close is not customer restoration. A model-generated field should not silently acquire the authority of the similarly named field in the business system.

Time is part of the object. Separate when something happened, when a system learned it, and when it became applicable. An amendment can change today's obligation without changing what the organization was entitled to do yesterday. A late sensor event can explain a failure without reversing a later confirmed repair. Decide whether the task needs current state, an as-of reconstruction, or both; carry the relevant time and version semantics through the integration.

Use the smallest coherent domain model that supports the work. Reconcile a few decisive entities and relationships for the first population before proposing an enterprise ontology. Where several teams use incompatible definitions, make the operational consequence explicit and resolve the definition with the owner who can authorize it. A temporary mapping with known applicability can unblock a bounded deployment; a silently guessed mapping cannot.

## Locate authority separately from information

A system can be a useful source without being authorized to decide or change the fact it displays. Work out authority by business object and action, and sometimes by attribute. The CRM may hold the customer's report, product engineering may determine a compatible replacement, the ERP may commit stock, and the customer may decide whether the repair restores their operation.

Conflicting sources need an explanation. Inspect effective dates, observation methods, scope, and subsequent corrections before choosing which applies. The newest record is not automatically the most authoritative: a recent note can quote an old contract; a delayed posting can record an earlier commitment. Preserve unresolved disagreement in the proposed action when it could change the outcome.

Keep commands in the system or authorized operating process that owns their effects. Prefer completing the transaction through a supported business operation over writing directly to a table that bypasses validation, audit, notifications, or downstream events. Conversely, do not force a model to recreate a decision that the source system already computes reliably.

Map responsibility across the human boundary as carefully as the API boundary. A specialist may advise while a dispatcher commits, a relationship manager may request while credit approves, and a site coordinator may permit work while an engineer performs it. Fit those decisions into the native work surfaces where possible. A technically integrated agent that creates another inbox can move the bottleneck rather than remove it.

## Discover and exercise the current interfaces

Inspect the accessible customer, administrator, developer, and host surfaces relevant to the transaction. Discover the supported operations and their present constraints before committing to a mechanism. Use current primary documentation for the precise product and deployment found, then test what the customer's environment exposes. A product feature, an installed entitlement, and a successfully exercised operation are different findings.

Probe a representative business operation end to end. Read a record under the intended identity, follow its relationships, perform an authorized sandbox or reversible action when available, and inspect the resulting source-system state. Find out how the operation reports validation failures, concurrent edits, permission denials, timeouts, and partial completion. Use those findings to simplify or change the design, not just to populate an inventory.

Choose the mechanism for the behavior and operating owner. An event can wake a maintained investigation; an on-demand query may be enough for a user-initiated decision; a current application extension may supply the whole work surface. A batch extract may support overnight preparation while being unsuitable for reserving stock. A browser-mediated action may be useful where it is supported and the transaction can be verified, but unattended recovery cannot be assumed from a successful click. Do not invent a universal preference order among these surfaces.

Read paths and command paths often deserve different treatment. Cached descriptive context can make reasoning faster, while authority, balance, eligibility, or availability must be refreshed when a commitment is made. Derive acceptable staleness from what can change and the consequence of using an old value. Avoid making every fact real-time when only a few facts determine whether an action is valid.

Identity must survive the whole path. Establish whose authority is used for each downstream read and action, how background work remains tied to its business purpose, and what happens when access is revoked during a long-running task. A service account followed by display filtering does not reproduce source-system authorization. Shared caches, traces, retrieved documents, and generated summaries can also cross access boundaries; align their use with the same task scope.

## Coordinate business commitments across time

Treat a long-running workflow as durable business state with model reasoning inside it. The state may live in an existing application or workflow service; choose based on exercised behavior and ownership. A chat transcript or model context is not sufficient to reconstruct whether a part was reserved, an offer expired, or a customer accepted a change.

Maintain the distinction between a proposed plan, an approved action, an attempted command, and a verified external result. When several resources must align, make their dependencies visible. A repair can require the correct part, a qualified person, access, and a customer operating window. Securing one resource does not make the entire plan executable.

Bind authorization to the material decision being made: the target, action, terms, amount, and applicable conditions. Recheck those conditions when the command executes. A changed recipient, product, price, or purpose can invalidate an earlier approval; an editorial change to the explanation usually should not. Avoid both stale authority and needless approval churn.

Use the system of command to arbitrate scarce resources and concurrent work. Two planning agents can independently produce sensible plans for the same technician or stock item. They cannot both promise the resource. Let the source booking/reservation operation resolve contention, then update the affected plans from its result. Do not imitate an enterprise lock in model prose.

Design recovery around business effects. Persist a stable intent reference before issuing a consequential operation when the receiving system supports reconciliation by that reference. If the response is lost, inspect authoritative state before retrying. Retrying with a fresh reference can create a second transaction while making both requests appear individually valid. Where the interface cannot establish the outcome, route the uncertainty to a named operating path and prevent a blind duplicate.

Cross-system work rarely behaves like one database transaction. Explain what can be compensated, what has become irreversible, and which dependency changes require replanning. Releasing a reservation differs from canceling a shipped order. Refunding a payment is a new financial transaction. Preserve those effects in history and the current plan rather than pretending a failed workflow rolled everything back.

Use deadlines, leases, and events to drive follow-through. A held resource can expire; an observation can arrive after the decision window; a permit can be withdrawn. Duplicate and out-of-order events should not repeat an external action or resurrect a superseded plan. Separate the business clock from the order in which messages were received, and make manual takeover possible without losing confirmed commitments.

## Resolve dependencies through a buildable first path

Bring a coupled choice to the relevant owners, not a generic access request. For example: a nightly contract extract can support next-day preparation immediately, while same-session commitment requires an entitlement check through the live system; choose the experience and integration together. Or a parts hold may be available now while financial commitment remains manual; an embedded approval step can still complete the core service loop.

Reduce scope along a dimension that preserves the defining capability: a product family, business unit, geography, transaction type, or authority limit. Exercise the difficult semantic join and a meaningful receiving-system action in the first vertical slice. A polished interface over fabricated data will not resolve whether the source operations, identities, and organizational handoffs work together.

Make the engineering receiving team able to challenge the design using a concrete case. Walk through the normal transaction and the failure most likely to invalidate it. Show which system changes, how that change is verified, who owns a disputed outcome, and how the workflow continues after interruption. Use a sequence diagram, working adapter, sandbox replay, or concise explanation according to the task; no particular document structure is required.

## Worked tradeoff: preserve an option without declaring a diagnosis

An equipment outage has a likely pump fault, but a qualified diagnostic result will arrive after the only same-day courier cutoff. A compatible spare can be held briefly; a nearer part requires an unavailable harness. The integration must represent both the uncertain diagnosis and the definite logistics deadline.

A useful design proposes a bounded expedite decision under the service supervisor's authority, reserves the compatible spare through the ERP, confirms technician availability through dispatch, and updates the plan when diagnosis arrives. It does not encode “likely pump fault” as a final failure code or make inventory possession proof of compatibility. If diagnosis changes, the plan revises while already incurred courier cost remains visible.

The same principle applies to a commercial facility: a proposed exception, credit approval, executed amendment, and available draw capacity are related but distinct. The integration should let people advance preparatory work while preserving the precise commitment boundary. Designing those distinctions creates useful speed without pretending all uncertainty or authority must be resolved before any work can begin.

For a concrete receiving-system contract and recovery trace, read [the uncertain-write example](references/uncertain-write.md) when a timeout, retry or concurrent update can leave the business effect unclear. Its fictional interface also shows when a weaker receiver changes the operating design.

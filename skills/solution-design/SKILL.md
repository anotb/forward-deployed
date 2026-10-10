---
name: solution-design
description: Design a coherent AI-enabled workflow or service, from user experience through reasoning, context, tools, state and operation. Use for whole-solution architecture, a consequential design tradeoff, an inherited solution redesign or an engineering-ready specification.
---

# Solution design

Develop a solution that can perform the valuable work under the customer's operating conditions. Connect the business outcome, user experience, intelligence, enterprise systems, and responsibilities into one design. Explain the choices that determine whether it will work, and make them concrete through cases, diagrams, prototypes, or specifications suited to the recipient.

Start from what is already understood and decided. Investigate the missing information that could change the design while advancing work that does not depend on it. Use current capability exploration when the architecture relies on unfamiliar or changing product behavior. The design may use one capable product or several components; separating responsibilities conceptually does not require building a service for each one.

## Design the service around an accepted outcome

Describe the unit of valuable work and where it ends. An investigation can end in a resolved explanation and proposed response; quote assistance in feasible options ready for commercial approval; monitoring in an issue investigated and assigned to the right action. A generated answer is sufficient only when that answer completes the user's task.

Walk the operation from a concrete trigger to that outcome. Include the information that arrives, the questions that arise, the decisions and actions, and the receiving workflow. Understand which work is currently performed by experienced people, which is delayed, and which is omitted. Follow the effect on the whole operation: improving preparation can increase the approval queue, and broader monitoring can consume more specialist capacity than it releases.

Set the proposed service boundary in terms the business can understand. Name the population and decisions it covers, what it prepares or performs, and where responsibility changes. Distinguish the target service from its first deployment. A narrower product range or action scope can provide a credible entry path while preserving the capability that makes the target valuable.

Choose the level of detail around the unresolved judgment. A focused architecture question can be answered with a clear decision and one worked path. A full engineering handoff needs enough behavior to let implementers and operators reach the same understanding of ordinary and difficult cases.

## Establish business meaning and authority

Model the objects that the service reasons about before choosing storage or retrieval. Identify the relationships and distinctions needed for the decision: a customer account and a legal entity; a product family and an approved configuration; a contract and an amendment; an order and its individual commitments. A logical domain model can be implemented with ordinary application records and services. Choose additional infrastructure only for a demonstrated need.

Resolve identity across systems at the granularity that matters. A shared email address may identify several accounts; one customer number may aggregate several legal entities; an old product code may map to several current variants. Use established identifiers or authoritative mappings where possible. Preserve ambiguity where the evidence does not settle it, and design the useful next action for resolving it. A mistaken join can make otherwise correct analysis apply to the wrong case.

Represent time explicitly when it changes meaning. Distinguish when an event happened, when the system learned about it, and when a rule or agreement applies. A later-uploaded document may describe an earlier period; an amendment may supersede only part of an agreement; a revised forecast may leave the booked commitment unchanged. State which version and period support a conclusion and which changes require revisiting it.

Locate the authority for each material fact and transition. A CRM may own the commercial relationship while an ERP owns the accepted order and a document repository holds the executed agreement. A derived analysis can recommend a change without becoming the authoritative record. Decide how a proposal returns to the existing business process and when it becomes an accepted transaction.

Use disagreements to refine the domain. Two systems can disagree because they use different definitions or update at different times. Explain which representation is appropriate to this decision rather than selecting the newest value indiscriminately. Where a genuine conflict requires interpretation, give the service a way to expose and resolve it.

## Shape the operator's work and the AI's responsibility together

Choose an experience that fits how the user makes the decision. A queue of prepared cases can suit repeated operational work. A comparison view can expose alternatives and constraints. An annotated artifact can support document review. A conversation can help explore an uncertain problem. Combine interactions when useful, and inspect whether an existing enterprise surface can host them.

Give the operator enough context to evaluate a material conclusion without redoing the entire task. Show the decisive facts, relevant uncertainty, feasible alternatives, and consequences of the proposed action. Sources should be accessible where they help review. Dumping every retrieved passage creates review work; hiding the premise behind a fluent recommendation prevents informed review.

Choose human involvement by the judgment and authority it adds. Experts may define applicability, resolve a contested interpretation, accept a commercial tradeoff, or authorize a consequential action. Review can occur when the work is ambiguous, when policy requires it, or before a particular external commitment. Avoid designing a blanket approval step that asks someone to rubber-stamp a result they cannot practically inspect.

Design correction as part of the product. If an operator changes an entity match or rejects an assumption, show what conclusions are affected and what will be recomputed. Decide whether the correction belongs only to this case, to an authoritative source, or to reusable domain guidance. Preserve that distinction so a local exception does not become a universal rule and a recurring lesson does not vanish in a chat.

## Decompose the cognitive task by what must be learned

Identify the judgments that make the task difficult: interpreting a document in context, forming competing explanations, recognizing missing information, finding a precedent, choosing the next tool, or generating and testing alternatives. Explain the information each judgment needs and how its result advances the work. This is a more useful decomposition than assigning a role name to every step.

Keep reproducible calculations, explicit constraints, and authoritative transaction checks in components that can execute and verify them. Use model reasoning where interpretation, variation, or search is material. An agent can propose a feasible-looking option while a calculation or business service checks its arithmetic and constraints. Some domain judgments remain interpretive even when the policy is written down; represent their unresolved meaning rather than pretending every rule has become executable.

Choose control flow from the task's variability. A known sequence can use explicit steps with model-assisted interpretation inside them. A difficult case whose next question depends on the evidence can use an adaptive investigation. A service may combine these: intake establishes identity and scope, a reasoning loop investigates the case, and an existing workflow manages the accepted action.

Separate workers when the boundary improves the work. Independent analyses with distinct context can run in parallel; different permissions may justify separate execution; specialist methods may improve a particular subproblem. Define how results are reconciled and who owns the overall conclusion. If two workers depend on each other's interpretation, excessive decomposition can create handoff loss, repeated retrieval, and contradictory assumptions. Test whether the separation earns its coordination cost.

Describe how the system knows enough to finish or change course. It may have satisfied the case's acceptance conditions, eliminated meaningful alternatives, found a decisive missing fact, or exhausted a justified search budget. Derive effort from the value and urgency of the work. A low-value repetitive task and a high-stakes investigation should not inherit the same depth or stopping rule. Make incomplete progress useful by preserving what was learned and the question that remains.

## Assemble context for the decision

Give the reasoning a task-specific view of the domain: the current question, relevant entities and versions, applicable instructions or procedures, known facts, unresolved issues, and available operations. Keep source content distinguishable from the instructions governing the service. Include enough context to interpret evidence, such as a table's units, a clause's applicability, or a document's relationship to an amendment.

Choose information access by the work. A bounded dossier that must be reconciled as a whole may benefit from broad context. A large changing corpus may need selective retrieval. Structured facts may be better obtained through business queries than reconstructed from prose. Many services combine these approaches. Test coverage, interpretation, cost, and update behavior on the difficult cases instead of assuming a retrieval pattern solves every information problem.

Preserve structural meaning when preparing documents. A row without its header, a footnote separated from its table, or an exception clause detached from its governing section can change the answer. Decide which transformations are safe for the task and retain a path back to the original material. Where visual layout carries meaning, investigate whether the available interpretation capability preserves it.

Make derived context maintainable. Decide which facts or interpretations can be reused, what identifies their source version and scope, and which changes invalidate them. A revised agreement may affect specific obligations; a changed user permission may affect access to a stored interpretation; a new entity relationship may require recalculating an exposure. Recompute the affected work when possible rather than repeatedly rebuilding an entire dossier or silently retaining obsolete conclusions.

Use memory for a defined purpose. Task progress, a user's preference, reusable expertise, and an authoritative business fact have different owners and correction rules. Store them in the appropriate place. A convenient summary should not quietly become the source of truth for a financial value or an agreed obligation.

## Expose meaningful tools and preserve business transactions

Shape operations around what the service needs to accomplish. A domain query that returns an order with its commitments and version may make correct reasoning easier than a collection of unrelated raw fields. A proposal operation can preserve business validation and review where they already exist. Use supported interfaces first, adapting them only where the task needs semantics or behavior they do not provide.

Keep the interface specific enough to guide correct action without creating a bespoke wrapper for every prompt. Explain what an operation means, its valid scope, the inputs that determine its effect, and how the result should be interpreted. Useful error behavior tells the service whether to correct an input, obtain information, wait, reconcile, or ask an operator. Generic failure text encourages unproductive retries.

For external changes, locate the business transaction boundary. Check the relevant state or version close to commitment, because a sound proposal can become stale while it waits. Use idempotency or an equivalent business mechanism where supported. If the result of an attempted change is uncertain, reconcile the authoritative state before repeating it. A transport acknowledgement and a completed business operation may be different events.

Propagate the intended authority across the whole operation. Reading a permitted case does not automatically grant access to every linked record. An unattended service identity may differ from the requesting user's access. Resolve that arrangement in the enterprise design and test the path used by the service, including derived data and background work. Keep the scope of callable operations aligned with the work the service is allowed to perform.

## Give work a lifecycle beyond one model run

Design what happens when the case waits for a customer, a tool is unavailable, a person takes over, a new document arrives, or the process restarts. Place durable progress and pending work in a maintained product or service that can own them. The model can reason about the next step while the surrounding system preserves the case, controls execution, and makes its status visible.

Distinguish the business case from an attempt to process it. Several attempts may contribute to one outcome, and one attempt may complete only part of the case. Preserve the useful result without presenting the whole case as finished. Design resumption around what changed since the last attempt: refresh relevant facts, revalidate pending actions, and retain accepted conclusions that remain valid.

Choose behavior for concurrent changes. An operator and an agent may both revise a case; two events may trigger overlapping work; an upstream update may arrive after a proposal has been prepared. Use the source system's version or concurrency mechanisms where available. Decide whether to merge independent changes, recompute affected work, or ask for resolution. Re-running the whole task is sometimes reasonable, but should be a deliberate consequence of the state model.

Separate useful observability from transcript accumulation. Record enough to reconstruct the task's inputs and versions, significant tool actions, outcomes, timing, cost, and operator corrections. This should let a maintainer determine whether a bad outcome arose from missing evidence, interpretation, orchestration, integration, or the user experience. The operating design should not depend on access to hidden model reasoning.

## Fit the design to the enterprise and its economics

Map the proposed flow through the environments and teams that will operate it. Follow data, identity, requests, stored state, and external actions across the boundaries that matter. Inference, tool execution, storage, networking, and user interaction may live in different places. A private application deployment does not by itself settle where inference, attachments, or traces go.

Treat platform engineering, security, data owners, business operations, procurement, and delivery partners as participants in a concrete design. Bring them a proposed flow and operating arrangement that lets them assess a tradeoff. For example, a batch snapshot may satisfy preparation work without a new live integration; an embedded product extension may fit the existing release process; a bank-owned adapter may isolate a stable business operation from a changing source layout. Explain the limitations these choices create.

Resolve ownership at the failure boundary. When a case stalls, who can inspect the source, repair the integration, change the domain procedure, or authorize an operator fallback? Align the architecture with teams that can sustain those responsibilities. A maintained service can reduce work only if the organization can use and support it. Customization should have a durable owner and a reason that survives the prototype.

Derive service requirements from the operation. Work that must be ready before a morning review can be prepared asynchronously. An interactive negotiation needs useful responses within the conversation. Bursty deadlines can determine capacity more than average traffic. A partial result may be useful for one workflow and dangerous for another. Explain the user-visible behavior during slow or unavailable dependencies and the consequence for the business outcome.

Compare costs at the unit of accepted work. Include reasoning, retrieval, tools, infrastructure, and human review or repair where material. Consider the workload distribution: a small fraction of difficult cases may dominate cost and specialist demand. Reuse unchanged context, route effort by case need, and choose concurrency or model configurations when they preserve useful quality. A cheaper component that shifts work to scarce reviewers can worsen the service's economics.

Examine expansion while designing the first deployment. Ask what can be reused across another business unit or customer and what varies legitimately. Entity resolution, a case lifecycle, and common integration semantics may be reusable; local policy and negotiated terms may need explicit variation. Choose the abstraction once the common responsibility is understood. Avoid both permanent customer-specific patches and a universal platform that must be built before useful work can begin.

## A worked architectural argument

Read the [supplier-delay example](references/supplier-delay.md) when a worked case would help connect reasoning, business state, source changes and the operating tradeoff. It compares a prepared dossier with a maintained response queue and identifies evidence that would reverse the first-deployment choice. Its domain is illustrative; choose the responsibilities and complexity the current task needs.

## Make the design usable and prove the consequential choices

Match design depth to the decision. When the user is choosing what to fund or build first, develop enough of each option to compare its outcome, dependencies and capacity demands; use use-case-portfolio for the investment choice. A complete architecture is useful once it advances the selected work. Include investigation, integration, operational preparation and likely rework in the available capacity before adding a parallel workstream. Retain a broader opportunity when its additional value justifies that commitment, rather than making either maximum scope or minimum scope the default.

Present the architecture as an argument: this outcome requires these responsibilities; the selected arrangement supplies them; these tradeoffs are accepted; this first deployment establishes whether it works. Use diagrams to show flow, ownership, and boundaries, and use a concrete case to explain behavior that boxes and arrows cannot settle.

For engineers, specify the interfaces, state changes, source meanings, consequential exceptions, and acceptance examples that would otherwise force them to invent business policy. For operators and sponsors, explain the changed experience, the decisions retained with people, the value mechanism, and the implications for the organization. Reuse the same design facts while changing the level of explanation.

Probe the choice most likely to overturn the design before elaborating low-impact details. Useful proof might be a difficult document interpretation, a representative tool interaction, an interrupted case, an operator walkthrough, or a comparison of feasible options. When execution is requested and available, perform the work and revise the design from the result. When access is missing, provide a concrete design under stated assumptions and the discriminating test needed to settle them.

Finish with a recommendation that can be acted on. The recipient should understand what to create or configure, how it fits the enterprise, why the major choices were made, and what evidence will justify the next expansion. Architectural completeness comes from resolving the relevant behavior and tradeoffs, not from filling every possible component box.

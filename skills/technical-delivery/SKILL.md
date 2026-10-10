---
name: technical-delivery
description: Coordinate an enterprise AI deployment and equip the engineers or coding agents implementing it. Use for engineering briefs, customer and partner delivery, dependencies, changed requirements, credible forecasts, rollout, technical transfer, or recovery of a stuck engagement.
---

# Delivery coordination and engineering handoff

Carry the agreed solution toward useful operation by equipping the people who build it, resolving dependencies and keeping customer commitments consistent with delivery evidence. Establish what already works and what the next usable increment must accomplish. These instructions guide delivery and technical handoff. When implementation is requested, route that work into the available engineering or coding workflow with the relevant context; preserve the user's division of responsibilities.

Start at the current state. An inherited pilot, an integration stalled on access, and a functioning service awaiting expansion need different interventions. Inspect the running system, interfaces, current work, commitments, and receiving teams before replacing the delivery approach.

## Give engineering a brief it can act on and challenge

Translate the agreed outcome into a bounded assignment for the receiving engineer, customer team, partner or coding agent. Explain the first operating slice, the user behavior it must support, the authoritative systems involved, and the ordinary and difficult cases that distinguish acceptable completion. Carry forward the relevant design decisions and their reasons, existing implementation and environment, access constraints, and the unresolved investigation that could change the build. Link to useful technical detail rather than duplicating it into a second specification.

Separate required behavior from implementation discretion. A case must survive a source change during review; that does not automatically require a new workflow service. Identify which architecture choices are settled by customer constraints and which the implementer should investigate or improve. Give enough integration, context and evaluation detail to expose consequential ambiguity. Use the solution-design, enterprise-integration or context-design skill when that underlying argument needs development.

For a Codex or other coding-agent handoff, identify the authorized repository or task, the requested change, relevant existing work and conventions, and the evidence needed to judge completion. Keep unresolved business meaning out of implementation guesswork. An agent may discover a simpler technical route, but a changed customer outcome or delivery promise belongs back with the person responsible for that decision. Use the host's delegation or task tools within the user's authorization when implementation is part of the assignment; a finished brief can itself be the requested result.

When the receiving team is available, have it trace a normal case and a consequential exception, expose missing decisions, and challenge effort and sequencing assumptions. Reconcile its response with the customer promise before treating an estimate as a commitment. When it is unavailable, deliver the concrete brief with the specific questions that affect estimate or feasibility; do not invent acceptance or withhold useful design work pending a meeting.

For an example of resolving a blocked dependency into an engineer-ready assignment, see [a constrained quote-service handoff](references/quote-service-handoff.md). It includes the supplied interface behavior, a brief, and a change that alters the release choice; use it when those seams matter, not as a required brief format.

## Shape a first deployment that carries the ambition

Describe the target service through one demanding case: its trigger, the judgment it performs, the result an operator accepts, and the business state that changes. Then choose an initial operating boundary that delivers a useful portion of that service while exercising its defining capability and hardest consequential seam.

Thin the population or authority before hollowing out the capability. Preparing an actionable repair plan for one equipment family can exercise diagnosis, live asset history, parts feasibility, and engineer correction. A general document chatbot may exercise none of those, even if it serves every engineer. Assisted operation can be a strong first deployment when human review is part of the intended work and the system still performs the demanding reasoning.

Use the first path to discover operating facts: whether identifiers survive across systems, whether needed context arrives in time, whether the recommendation can enter the existing case, and whether a receiving person can use it. Name the consequential difference between a demonstration and the intended operating path. Close that difference deliberately as the work advances.

Keep the target and transition architecture connected. A temporary feed or manual handoff can be an intelligent bridge when it preserves the business meaning and leaves a manageable replacement path. Decide how data, case state, users, and responsibility migrate; otherwise the bridge becomes a second system that someone must operate indefinitely.

## Turn dependencies into solution choices

Work backward from a complete case and locate the dependencies that could defeat it. Ask what each dependency is needed for, who controls it, and what alternative preserves the required outcome. A dependency often contains a design choice hidden inside a request for access.

Explore the customer's available product, operator, administrative, and development surfaces when they could remove custom work or change the delivery route. An approved extension, maintained connector, case workflow, or native review mechanism may already solve part of the problem. Inspect and try the relevant behavior within available authorization. Delivery plans should reflect what is usable in this environment, not a remembered product menu.

Develop a concrete proposal for the consequential seams:

- If an authoritative source cannot support interactive access, decide whether a dated snapshot satisfies the decision, whether a source-owned read service is feasible, or whether the user experience must become asynchronous. Show how each choice affects the promise made to the operator.
- If an unattended task cannot inherit the user's access, separate background preparation from the user-authorized action, or establish a purpose-limited service identity that the customer can support. Do not solve an identity mismatch by quietly widening access.
- If the receiving system cannot accept the proposed write, consider a supported draft, a native work item, or a deliberate human transaction. Specify how the system recognizes completion and avoids duplicate work when that transaction is delayed.
- If a platform team cannot maintain a new execution stack, adapt to its existing release and operating path where feasible, or make a funded service ownership arrangement. A technical preference is negotiable; an unowned production service is an operating failure.

For example, a manufacturer wants same-day quote preparation, but approved price and availability data arrive nightly. One workable first service prepares engineering options against the dated snapshot and requires a current commercial check before release. Another adds a narrow synchronous availability check while leaving costly historical analysis asynchronous. Select between them by how often intraday changes matter and who can support the live check. Calling the nightly feed an access blocker misses both routes; presenting its values as live creates the wrong service.

For unresolved external decisions, bring the resolver a proposed arrangement with its implications. Security, procurement, architecture, and legal teams can often decide a concrete data flow, retention period, service boundary, or responsibility split more readily than a broad request to approve AI. Escalate a decision whose delay changes the outcome, with the available choices and latest useful decision time. Do not escalate an entire technical problem that the delivery team has not decomposed.

## Make co-delivery increase customer capability

Arrange the team around the work and the systems it will own. Domain specialists define and challenge acceptable reasoning. Customer engineers own the interfaces and release path they will maintain. Platform teams establish supported runtime and access arrangements. Implementing engineers build or adapt the capability; the deployment lead keeps the business meaning, priorities and customer commitments coherent across that work. A person can hold several roles. A partner can provide delivery capacity, but its participation does not make source-system or business authority disappear.

Settle who resolves cross-boundary failures. If a case is missing information, can the service request it, must an operator do so, or is it a source defect? If behavior changes after an upgrade, who can reproduce, contain, and repair it? Split ownership at stable interfaces with observable behavior. Avoid a support chain in which every team can declare its own component healthy while no one owns the incomplete case.

Arrange shared implementation and review sessions around hard work: an adapter, a domain procedure, a failure replay, or a release. Have the future owner make a change with the implementing engineer available, then reverse the roles. Use what the session reveals to resolve missing knowledge and inaccessible environments before a final handover meeting.

Commercial delivery arrangements should match this division. Separate exploratory work whose result is a decision from implementation whose result is operating behavior. For a fixed commitment, settle the meaningful scope and customer dependencies; for uncertain integration work, propose a bounded investigation with a consequential next choice. Clarify whether custom extensions, source access, evaluation data, and production support are inside the service being purchased. Avoid leaving the customer's most critical integration in an implied gap between supplier contracts.

## Sequence work around uncertainty and usable increments

Order work by what it enables and what it can invalidate. Prove a fragile enterprise seam before polishing dependent screens. Establish representative access and a complete case path early. Parallelize work when its contracts are sufficiently stable and people, environments, and review capacity exist to support it.

Use thin operating increments with clear recipient behavior. A domain procedure can first run on representative cases; the same procedure can then receive source-owned context; the resulting recommendation can enter a native review path; the operator can complete and recover the case. These increments reveal where the coupled system fails. Components finished in isolation are weak progress if their interfaces still disagree.

Forecast elapsed time from dependent work, scarce staff, environment windows, external decisions, and likely rework. Distinguish these from engineering effort. A critical-path problem cannot always be fixed by adding engineers; source-owner availability or a platform release window may dominate. When dates are threatened, propose changes that preserve the valuable mechanism: a narrower case family, an earlier assisted release, a supported bridge, or a changed operating promise. Show what each choice buys and what it costs.

Keep the next usable increment visible across engineering, customer experts, platform owners and partners. Judge progress through demonstrated behavior and work accepted by its recipient. Reconcile that evidence with customer inputs and review capacity before reaffirming a date. An adapter can be finished while representative records, user access or domain review still prevent a complete case. Explain the remaining path and the next demonstration in the team's existing planning and customer-update rhythm.

When Studio is the working record, use `plan_delivery` to connect the next useful increment to its requirements and reference relevant Field Lab runs in its evidence. Carry the case and observed result into the engineering handoff so the team can reproduce the intended behavior against the implementation. Track work where the team already works; preserve references to that work without maintaining a second task list. A completed work item, a passing rehearsal and an operating service remain separate evidence.

When a request or finding changes the work, determine whether it clarifies the agreement, corrects a defect or changes the commitment. Develop the affected scope, sequence, capacity and date choices with the implementers. Use enterprise-engagement for the customer negotiation where needed. Carry the agreed result into the brief, work plan, evaluation and rollout expectations that depend on it; retire superseded instructions so two teams do not keep building toward different promises. Keep unaffected work moving while the choice is pending.

Keep the brief and delivered behavior close enough that a receiving engineer can trace one case through them. Explain interface semantics, business and task state, ownership, uncertain-write recovery, and changes that invalidate earlier reasoning where they affect the design. Ask for executable examples or contract checks for difficult behavior when practical, or prepare them when that work is in scope. A diagram should resolve an ambiguity, not conceal it behind a box labelled orchestration.

## Introduce the service without creating an operating island

Choose rollout mechanics from the consequence and reversibility of failure. Shadow operation can test analysis against the existing process but cannot establish whether operators use it well. Assisted operation reveals review burden and task fit. Limited autonomous execution can be appropriate when the action boundary, recovery, and observed behavior support it. These are design options, not compulsory stages.

Determine how new work enters the service, how existing work is treated, and how a case returns to the established process. Avoid letting the old and new paths independently perform the same transaction. Where both run for comparison, keep execution authority explicit. Treat retries, interruptions, and late-arriving source changes as normal operating behavior.

Tie service targets to the workflow. Interactive guidance, overnight preparation, and deadline-driven portfolio work need different latency, throughput, and recovery commitments. Consider what happens when a source is unavailable or a queue grows: defer preparation, serve a dated result with its meaning intact, narrow eligible work, or use a supported fallback. Choose the behavior that protects the accepted business outcome.

Arrange evidence for the failures that could cause consequential confusion: an action whose response is lost, a changed document during review, an interrupted task resumed by another operator, or a partial source outage. Inspect the resulting business state and operator experience, using accessible test results or a permitted demonstration. Distinguish observed behavior from an unexecuted test plan. The needed checks depend on the system; a universal release checklist cannot establish readiness.

Make the production recommendation when the required behavior and operating arrangement support it. Describe the population and promise that can be delivered now, the remaining limitations that alter operation, and the next useful expansion. Do not leave a ready service permanently provisional because later ambitions remain unbuilt.

## Transfer the ability to operate and change it

Technical transfer succeeds when the receiving team can deploy a change, diagnose a failed case, update a domain procedure, and recover service using its normal access. Use a realistic exercise to reveal remaining dependence on the field team. Transfer the reasoning behind coupled choices as well as the implementation; otherwise a future optimization can break the assumptions that made the service work.

Arrange retirement of temporary access and workarounds with their owners according to the transition design. Settle the supported version, outstanding defects that affect operation, ownership of recurring evaluation, and responsibility for upstream changes. Shape documentation around the tasks the receiving team must perform rather than a standard bundle of artifacts.

For an at-risk delivery, reconstruct a recent failed case before changing staffing or promises. Determine whether progress is blocked by a product limitation, an enterprise seam, weak reasoning, unavailable decisions, or an operating mismatch. Choose the intervention at that layer, revise the forecast, and complete the next useful increment. The deliverable should leave the team with an operating result or a concrete route to one, plus a decision that resolves the remaining constraint.

---
name: solution-design
description: Design an enterprise AI workflow from user experience through reasoning, context, tools, state, and operation. Use for architecture, consequential design choices, redesign of an inherited solution, or an engineering handoff.
---

# Solution design

Design a service that completes valuable work under the customer's operating conditions. Use capability findings to decide how much responsibility it can take, then connect the experience, intelligence, enterprise systems, and operating owner.

## Define the finished work

Walk a concrete assignment from trigger to accepted outcome. Identify the judgments, artifacts, and external changes that make it useful. An incident investigator might establish a cause, execute an authorized mitigation, and verify recovery. A research agent might reconcile internal evidence, challenge the leading explanation, and deliver an implementation recommendation.

Choose the work surface with the user. A workforce AI product can support varied employee assignments; an incumbent application can host work tied to its records; an integrated service can own recurring or event-driven tasks. Test whether a new interface earns the effort it adds.

Distinguish the target service from its first deployment. Narrow by population, system, or action class while retaining the capability that creates value. Specify where people contribute expertise, resolve a contested judgment, or exercise authority. Give them a decision they can inspect and a way to correct the work without starting again.

## Design the intelligence and its environment together

Identify what the model needs to interpret, investigate, create, and verify. Make the relevant environment accessible: a running application, source records, logs, calculations, and actions that produce inspectable results. Start with the control flow the work needs: an explicit sequence for predictable processing, an adaptive loop when evidence determines the next step, or a combination.

Keep exact calculations and transaction validation in executable components. Let the model formulate hypotheses, choose informative queries, interpret uneven evidence, and revise its approach. Define a meaningful finishing condition and what useful progress looks like when a required fact remains unavailable.

Keep coupled judgments in shared context when each step needs the same evidence or detail from earlier results; load domain guidance and tools as needed. Use separate agents for independent parallel work, fresh verification, permission boundaries, or a demonstrated context limit, with an owner for integration. Compare complete assignments and frequently used task chains. Inspect individual regressions, handoff losses, latency, and cost before accepting a better aggregate score.

Choose context access deliberately. A bounded dossier may fit directly; a changing corpus may need search and selective inspection; current business state may come from a query. Supply detailed reference artifacts when they convey the business or product requirement better than prose. Shape tool results so the agent can determine what happened and choose its next step.

## Allocate runtime responsibilities

Decide who supplies execution, tool connections, persistent sessions, scheduling, recovery, and observability. These responsibilities can reside in one product. Compare a managed service with an owned runtime when that choice affects the workload; do not build facilities already supplied well by the chosen platform.

For continuing work, distinguish the session record, the model's current context, and the business record. Preserve artifacts, verified results, unresolved questions, and pending external operations so the task can resume. For recurring work, include which source intervals were read and which effects were completed. Use the selected platform's durable facilities and refresh facts that could invalidate the next action.

Map data and execution across the proposed environments. State where inference, source access, generated files, and retained records live. Use that concrete flow to resolve networking, deployment, ownership, and operating requirements.

## Connect reasoning to business effects

Resolve the entities, versions, and relationships that determine the action. Locate the authoritative read and command operations. An incident, affected service, deployment, and configuration change are related objects with different owners.

Give the agent action scope it can use. Existing authorization should let it finish eligible work; exceptional decisions go to the person who can resolve them. Enforce identity, allowed targets, limits, and business validation in the receiving system or tool service. Prompts describe the task; they do not enforce authorization.

Specify consequential write behavior: source-version checks, concurrent changes, uncertain results, and reconciliation before retries. Use the source system's transaction semantics. See enterprise-integration when these details drive the design.

## Prove the architecture through a working case

Trace the chosen arrangement through a normal assignment and the failure most likely to invalidate it. Inspect the experience, delivered work, and receiving-system result. Read [the incident investigation example](references/incident-investigation.md) for a design that combines adaptive investigation, an existing work surface, and bounded operational action.

Estimate cost and capacity per accepted task, including tools, retries, and expert repair. Match latency and effort to the business window. Retest orchestration choices as capabilities improve; simplify a handoff or control loop when it no longer improves the outcome. Identify the team that can diagnose failures and maintain the custom behavior.

Deliver a recommendation with enough interfaces, state changes, ownership, and acceptance examples for its recipient to act. Use diagrams or prototypes where they settle ambiguity. If using Studio, record consequential behavior with `define_requirement`; use Field Lab to exercise proposed behavior while identifying which interfaces remain simulated.

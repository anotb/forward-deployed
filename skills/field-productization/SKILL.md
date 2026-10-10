---
name: field-productization
description: Turn field-built AI capabilities and deployment learning into reusable products, platform improvements, or delivery practices. Use to choose durable abstractions, separate customer variation from common behavior, improve deployment economics, and move supported capability beyond a bespoke engagement.
---

# Field Productization

Convert something learned or built in the field into a capability that can be adopted, operated, and improved repeatedly. Find the durable behavior beneath a customer request, choose where it should live, and make the next deployment materially easier or better. A feedback ticket is useful when it advances that work; it is not the definition of productization.

Start with the functioning capability or the task that failed. Inspect its use, implementation, workarounds, surrounding enterprise systems, and operating burden. Understand what made it valuable to the customer and which conditions made it possible. Productizing a technically interesting component that nobody needs reproduces the wrong success.

## Recover the invariant from the local solution

Describe the job in business terms before adopting the local implementation as a product boundary. A request for a spreadsheet export may reveal a missing handoff to finance. A collection of custom prompts may reveal a repeatable investigation procedure. A brittle adapter may reveal a missing business operation in the platform, rather than a need for a more general browser script.

Compare concrete cases along the dimensions that could change behavior: domain objects, reasoning, available context, action authority, task lifecycle, operator interaction, and operating environment. Ask which differences are superficial, which are parameters, and which require different logic. Similar screens or wording do not establish reuse; different industries can sometimes share a deeper operational pattern.

Separate the stable service from its local interpretation. Preparing a case, waiting for information, invalidating affected conclusions, and resuming review may be reusable behavior. What counts as material deterioration, who can approve an exception, and which contract applies can remain domain or customer-specific. Preserve these distinctions in the design rather than hiding them in one growing prompt.

Use a second genuinely different case to challenge the proposed abstraction when available. It should force an adaptation that matters, rather than repeat the first customer's assumptions. A single strong case can justify a product investment when it exposes an unavoidable platform gap or a valuable market need; state the generalization as a hypothesis and choose the next deployment to test it. Waiting for an arbitrary number of customers is no substitute for judgment.

## Decide what should become a product, and where

Choose the durable response at the layer that owns the problem:

- Repair a promised behavior when the service violates its contract. A defect should not become a new feature merely because a customer discovered it.
- Introduce maintained configuration when behavior is stable and variation can be expressed without changing its meaning. Configuration needs validation and understandable consequences; moving arbitrary code into a text field does not make it safe or reusable.
- Create a reusable domain procedure when expert reasoning, investigation steps, or interpretation rules transfer across cases. Give it the context and tools needed to perform the job, plus examples that discriminate good judgment from plausible output.
- Improve a business interface when multiple deployments need the same meaningful operation, such as obtaining an effective-dated exposure view or submitting a proposed case change. This can remove repeated local reconciliation and narrow the authority available to an agent.
- Add platform behavior when the missing capability is genuinely cross-cutting, such as durable waiting, scoped access, result invalidation, or comparable execution traces. Make the shared contract precise enough that applications can rely on it.
- Package a repeatable service or delivery practice when value comes from a combination of expertise, configuration, integration, and operation. Not every useful field capability needs to become a standalone software product.

Compare these choices with the supported capabilities and extension points currently available. Inspect the relevant product and development surfaces and try promising behavior before creating another maintained layer. A product improvement elsewhere may eliminate yesterday's workaround. Conversely, a nominally available function may not preserve the business semantics that matter here.

Judge an abstraction by the complexity it removes and the obligations it creates. A universal document engine may be less useful than a well-defined procedure for interpreting amendments against an obligation. An all-purpose enterprise connector may conceal incompatible transaction semantics that explicit domain adapters handle better. Generalize the behavior users need; keep variation visible where it changes meaning or authority.

## Productize the context as well as the code

Identify what the capability assumes about its environment. Domain terms, identifiers, document structure, policy versions, entity relationships, effective dates, source authority, and available actions can be more consequential than the model instruction. Reusing code while rediscovering those assumptions in every account is weak repeatability.

Define how a deployment supplies the context the capability needs and how the service recognizes an unsupported situation. Prefer a small, meaningful contract over a universal enterprise schema. Distinguish required knowledge from useful enrichment and from customer-specific interpretation. Decide where corrections belong so that a local exception does not silently alter the shared procedure.

For example, a covenant-review capability may share the process for finding the operative agreement, applying an amendment, interpreting a definition, calculating from approved values, and escalating unresolved meaning. It should not encode one bank's definition of EBITDA as universal. The portable component is the review method and its input/output behavior; the negotiated definition and authority remain attached to the obligation. A second lending segment tests whether the shared method survives different agreements, rather than whether the original prompt can be copied.

When a local procedure looks reusable but its business meaning varies, [a worked covenant-review product decision](references/covenant-review-boundary.md) illustrates what to retain, what to keep local, and why shared code may not yet reduce deployment effort. Use the reasoning, not its particular component boundary, for another domain.

Keep customer-confidential information and rights separate from reusable learning. Retain the general technique, behavioral contract, and permitted examples. Use sanitized or independently constructed cases when transferring a pattern, and check that the transformation preserves the behavior under test. A copied document corpus is neither a reusable skill nor proof that the next customer will have adequate context.

## Build the supported boundary

State what a consumer can rely on: required inputs and permissions, completed behavior, meaningful failure or deferral, state ownership, and compatibility expectations. Decide which team owns the implementation and which variations it supports. A reusable component with an ambiguous owner simply centralizes future escalation.

Develop the product decision far enough to make reuse concrete. A supported boundary, reusable domain procedure, product proposal or engineering brief can be the requested result. When refactoring, extension development or deployable packaging is requested, carry the behavioral contract and support obligations into the selected engineering or coding workflow. Keep product judgment and customer commitments connected to what the implementers learn.

Keep the simplest architecture that supports the demonstrated variation, and make the next likely variation inexpensive to examine. Extension points should correspond to meaningful differences, such as a source adapter, a local authorization policy, or a domain-specific interpretation. Avoid speculative plugin systems that add an abstraction for every possible future customer.

Verify the common behavior across differing cases and test that local configuration cannot silently break it. Preserve the failures that taught the field team something: a revised source, a case resumed after a long wait, an authority mismatch, a misleadingly similar entity, or a plausible interpretation that changes the outcome. Use the relevant failures, not a universal checklist, to protect the product's promise.

Design the upgrade path before declaring the component reusable. Explain how versions of procedures, schemas, configuration, and persisted state coexist; what needs reevaluation when behavior changes; and how a consumer can return to a supported state. Standardization creates a migration obligation for existing customers. Include that work in the product decision.

## Make repetition an economic test

Measure where the next deployment still consumes scarce expertise: discovery, mapping context, adapting interfaces, tuning behavior, validating performance, obtaining approvals, training operators, or supporting production. Compare that effort with the value and commercial margin of the service. A shared codebase can coexist with expensive one-off deployment work.

Look for the learning curve the proposed investment should create. A maintained adapter should reduce repeated integration work. A domain procedure should reduce rediscovery and improve consistency. A better installation and validation path should let customer teams do work previously requiring field engineers. Identify which cost should fall and why; measure the next deployment against that hypothesis.

Also examine the cost of diversity. Each supported version, custom policy, isolation model, and source interface increases the space the team must test and support. A high-value local variation may justify that cost. A minor customer preference may be better served by an extension or a changed workflow. Establish a supported boundary that allows a credible commercial promise.

Prioritize product investments by the capability and delivery leverage they unlock, the consequence of the current gap, and the cost of supporting the result. Request counts alone favor loud accounts and familiar work. A low-frequency architecture gap can block an entire valuable segment; a frequent nuisance can have little economic consequence. Distinguish an urgent customer repair from a durable product investment, and pursue both when the situation warrants it.

## Move from field learning to an adopted capability

Give product and engineering a concrete decision: the user outcome currently obstructed, the behavior that would enable it, the relevant variation, the alternative, and the cost or opportunity at stake. Use a minimal reproduction for a defect and a demanding worked case for a new capability. Include the evidence needed to change the decision, rather than a transcript of every field conversation.

Work with the receiving team on the boundary and implementation so that the field solution is neither thrown over the wall nor copied unexamined. Their product constraints may change the abstraction; field experience should preserve the customer outcome while those choices are made. Keep any interim customer workaround operational under a clear support arrangement.

Close the loop in the field. Try the productized behavior on the original task and the next meaningful variation when that access is available. Coordinate migration of supported consumers and retirement of superseded code or manual work with the responsible teams. Teach the deployment team how to use the new capability and explain where it still requires local judgment.

The result should be a maintained behavior, reusable method, or repeatable service that someone beyond its original author can deliver. Recommend further product investment, continued local treatment, or retirement according to what repetition teaches. Productization is successful when valuable work travels with less reinvention and a support obligation the organization can sustain.

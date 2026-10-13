---
name: enterprise-integration
description: Connect AI work to enterprise systems through meaningful business objects, usable tools, identity, and reliable actions. Use for integration design, tool contracts, asynchronous operations, or diagnosis of a workflow that cannot complete its work.
---

# Enterprise integration

Make the agent's work count in the systems people use. Follow one assignment from its initiating request through context gathering, business operations, and verified completion. Build the integration around those effects.

## Establish the business meaning

Inspect a representative case, its records, and its history. Identify the objects and relationships the agent needs: an employee, project membership, application role, and access request describe different things even when they share an identifier.

Resolve identifiers at the granularity of the action. Name the system that owns each consequential fact and command. Preserve distinctions such as requested, queued, provisioned, and usable. A ticket marked complete does not establish that an employee can use the application.

Carry the time and version semantics that change the decision. Current eligibility can differ from eligibility when a request was submitted. An old policy can explain a historical action without authorizing a new one. Reconcile the decisive relationships before proposing a broad enterprise data model.

## Discover the supported path

Inspect the customer's available product, administration, and developer surfaces. Check current primary documentation for the deployment in use, then exercise its interfaces under the intended identity. Entitlement, documented support, and observed behavior answer different questions.

Choose among native extensions, APIs, events, connectors, extracts, and supported browser operation according to the work. An overnight extract may be enough for research; provisioning requires a command and a way to establish its result. Preserve an incumbent application's useful workflow instead of duplicating it by default.

Separate context reads from commitment checks. Cache stable descriptive material where useful; refresh the facts that determine whether the action remains valid. Use events to continue work when waiting is part of the service, with handling for repeated or out-of-order delivery.

## Give the agent effective tools

Expose operations that preserve business meaning. A query returning an employee's project membership, role eligibility, and source revision can be more useful than unrelated field lookups. A supported provisioning command can carry validations and downstream events that direct table writes would bypass.

Make the interface intelligible: what it does, which identifiers it accepts, required conditions, and what its response proves. Return useful status, source references, versions, and errors. Distinguish correction, denial, pending work, and uncertain outcome so the agent can respond appropriately. Test tool use on complete assignments; add a wrapper only when it solves an observed problem.

Large results should offer summaries or selectable records plus handles for deeper inspection. Preserve the detail the next decision needs. A successful tool call can still be an unusable interface if its output hides the relevant condition or overwhelms the context.

## Enforce scope at execution

Determine whose authority each read and action uses, including unattended work. Enforce permissions, allowed targets, and action limits outside the model. Keep credentials out of model-visible material and use the platform's supported credential mechanisms.

Align caches, derived summaries, and shared task state with the source access boundary. Source content can inform the work; it cannot expand authority. Existing authorization should permit eligible actions without repeated approval. Seek a new decision when the requested effect changes materially or exceeds that scope.

## Make completion recoverable

Keep proposed intent, attempted command, and confirmed external result distinguishable. Persist an operation reference when the receiving interface supports it. After a timeout, reconcile the authoritative state before repeating a potentially completed action. Reuse the same idempotency reference for the same request; changing it can create a second effect.

For asynchronous operations, retain the returned job or resource identifier and continue through its documented status mechanism. "Accepted" can mean queued. Verify the result at the level promised to the user.

Use native version and concurrency checks where available. Across systems, describe partial completion and the next valid action. Reversing a completed operation can itself be a new business action. Preserve confirmed effects during retry, cancellation, or manual takeover.

Read [the provisioning recovery example](references/uncertain-write.md) when an agent must complete a business operation despite a lost response.

## Deliver an exercised integration

Build or specify a vertical slice that uses the difficult semantic relationship and completes a meaningful receiving-system action. Inspect the resulting state and the failure that could duplicate, misapply, or strand the work. Keep documented promises separate from observed behavior.

Leave the receiving team with a usable contract, an example transaction, and ownership for unresolved outcomes. The format can be a working adapter, sequence diagram, replay, or concise engineering brief.

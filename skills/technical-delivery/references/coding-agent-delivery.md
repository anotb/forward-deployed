# Deliver a coding agent for an enterprise migration

This constructed example turns a broad automation request into a buildable first deployment. Use it when an agent must perform substantial work across a repository and survive interruptions.

## The opportunity and first slice

A platform team needs to migrate applications from version 1 to version 2 of its internal data client. Today, application engineers read the migration guide, locate usages, update code, repair tests, and prepare a pull request. The desired agent performs that work and leaves a change the application team can review through its normal process.

Start with one package that contains representative usages and a demanding semantic change. The old client's `timeout` is in seconds; the new client's `timeout_ms` is in milliseconds. A syntactic rename can compile and still turn a three-second timeout into three milliseconds. The first slice must preserve behavior and finish the change, including its tests and migration notes.

## The engineering assignment

> Run the migration in the supplied repository and branch. Inspect existing usages, the versioned client documentation, repository instructions, and relevant tests. Update the selected package to the new client, preserve its timeout behavior, and repair affected call sites and tests. Prepare the resulting change for application-team review.
>
> Use the team's approved coding environment, package registry, and test tenant. Write progress beside the working artifacts so a resumed run can identify changed files, completed checks, remaining work, and the source revision used. Keep the change reviewable throughout the run.
>
> Verify a three-second configuration reaches the new client as 3,000 milliseconds, that calls without an explicit override retain the intended default, and that application behavior passes the relevant tests. Exercise the authenticated client against the test tenant. Include the changed usage pattern and verification in the migration notes.
>
> Continue through test failures and ordinary implementation choices. Bring back a specific decision if preserving behavior requires a product change. Complete the review artifact within the granted repository permissions; merging follows the application's existing ownership.

This brief provides outcome, semantic constraints, environment, and completion evidence. It leaves the coding agent free to choose its search, refactoring, and test approach.

## Equip the run to finish

Use the available host's persistence and continuation before building another job system. The run needs access to the working tree, source versions, test commands, and durable task state. On resumption, inspect the repository and outstanding checks rather than assuming the last message describes current state.

Interrupt a run after edits and before its final tests. Resume it with a fresh session and check that it completes the remaining work without discarding edits or declaring success from an earlier partial check. If review creation can lose its response, reconcile the branch's existing review artifact before creating another.

## Resolve the dependency that changes the release

Suppose local tests pass, but the coding environment cannot obtain the test-tenant identity. Local fakes can establish unit conversion; they cannot establish the authentication path.

One concrete route is to run the authenticated check through the existing CI job with its supported identity. Another is to provision the coding environment's test identity. Choose based on who can support the route and whether the agent can inspect the result and complete repairs. The first deployment can include a CI wait without reducing the agent to a code-suggestion tool.

Forecast from this dependency and the application team's review capacity. Adding more migration prompts will not resolve missing test access.

## Transfer and expand

Have a customer engineer run the next package and add an example for a newly encountered usage pattern. Observe whether they can diagnose a failing migration from the trace and tests. Package the migration method, client context, continuation behavior, and regression cases so the team can extend them.

Expand to another application when it tests a meaningful variation: different framework, test setup, or dependency pattern. Use what that run teaches to improve the shared method and estimate the remaining migration work.

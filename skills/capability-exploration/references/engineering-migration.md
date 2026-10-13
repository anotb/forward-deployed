# Probe: delegate an engineering migration

Illustrative assignment and test design. The product capabilities and outcomes below must be established in the customer's environment.

A platform team wants to replace a deprecated authentication SDK across its services. Its first idea is a tool that finds imports and explains the migration guide. A more useful delegation is: inspect a service, migrate its integration, preserve application behavior, and deliver a tested change that its owner can review.

## Discover what would remove work

Inspect the team's existing coding environment before proposing a migration application. Find out whether it can work in an isolated checkout, inspect linked repositories, run the service's tests, retain progress, and create a pull request through the approved repository workflow. Check the current runtime and account surfaces where these behaviors matter.

The intelligence needs more than a replacement map. It must interpret the new SDK's session behavior, find application assumptions that the guide does not mention, adapt tests, and diagnose failures. Business context includes which authentication flows the service supports, the service owner's acceptance conditions, and the enterprise's extension conventions.

Try the broader assignment with a capable model and harness. The result may show that the best first deployment is a repeatable employee workflow with reusable guidance. A dedicated service becomes attractive if teams need recurring fleet discovery, scheduling, aggregate progress, or durable unattended execution.

## Use a case that exposes the work

Choose an isolated copy of a service with an ordinary login path and a refresh-token path. Supply the current source, migration guide, repository instructions, acceptance checks, and available test infrastructure. Keep the expected application behavior independent of the candidate's own tests.

In the illustrative fixture, replacing the SDK import makes the build pass. It also changes how a refresh failure is reported. The application must still return the established unauthenticated response and clear the expired session. This is the difference between a syntactic migration and a completed engineering assignment.

Let the candidate inspect, edit, run checks, and fix what it finds. Observe whether it discovers the behavioral dependency, adds a meaningful regression check, and leaves a reviewable change. Inspect the test result and application behavior directly.

Then interrupt the task after a partial edit. On resumption, the candidate should recover its artifacts, identify unverified work, and continue from the current checkout. The test should reveal whether the chosen product supplies enough persistence or whether the workflow needs an additional progress record.

## Read the result as a design decision

| Observation | Design implication |
|---|---|
| The agent completes the migration and verifies both flows | Delegate migrations of this class through the tested environment; investigate which variations need different context or tools. |
| It solves the work after receiving the existing service acceptance guide | Package that guide or make it discoverable; the original failure does not establish a model limit. |
| It makes the right edit but cannot run the required identity test environment | Resolve the test interface or retain that verification with the service owner; inspect how much review work remains. |
| It loses partial work after interruption | Examine session and workspace persistence before adopting unattended fleet execution. |
| A smaller configuration needs repeated expert repairs | Compare total accepted-change cost with the stronger configuration, including reviewer time. |

These observations are alternatives to inspect, not reported test results.

A wider task can reveal further upside: the agent might identify a shared faulty adapter, repair it once, and reduce the remaining service edits. Give it visibility into that possibility while preserving repository ownership and the authorized change scope. Measuring only import replacements would miss the more valuable outcome.

## Carry the result into deployment

For engineer-initiated work, recommend the existing coding product if it completes the assignment with acceptable review effort. Save the task guidance, source versions, acceptance checks, and useful failure cases.

For recurring fleet work, compare the product's automation interface, a managed agent runtime, and an owned execution service on scheduling, workspaces, recovery, and repository integration. Use the successful task as the workload for that comparison.

Anthropic's [long-running harness example](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) shows why recoverable progress and executable feedback matter across sessions. Its [agent evaluation guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) distinguishes the agent's account of completion from the environment's resulting state. Apply those ideas to the selected runtime rather than copying a fixed harness.

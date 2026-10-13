# Design: an incident investigation agent

Illustrative enterprise AI design. The operating policy, interfaces, and observations are fictional.

An on-call team spends much of an incident gathering deployment history, searching logs, comparing affected cohorts, and testing explanations. The service should take an incident assignment, investigate it, perform eligible mitigation, and return evidence of the resulting service behavior.

## Choose the experience and delegation

Keep the incident in the existing incident application. Give the responder a live view of the current explanation, decisive evidence, completed actions, and the next useful investigation. The agent can continue collecting evidence while the responder handles coordination.

For this deployment, the agent has standing authority to disable an allowlisted experimental feature for its canary cohort when the service's mitigation policy is satisfied. The tool service checks the incident, service, flag, cohort, and current configuration. Broader changes remain with the incident commander. This scope lets the agent complete a useful recovery loop.

## Give the investigation room to reason

The incident begins with elevated checkout failures shortly after a release. Available tools expose deployment metadata, service ownership, cohort metrics, selected log queries, configuration history, and the flag operation.

The agent should form and distinguish plausible explanations. A temporal association with a release is useful, but the affected cohort can be more informative. It can compare errors across flag exposure, application version, and region, then inspect the relevant change. Calculations and query execution run in their existing systems.

In the fixture, failures are concentrated among customers exposed to a new address-normalization flag. A regional latency spike predates the release and affects successful requests as well. Disabling the flag for the eligible cohort resolves the checkout failure pattern while leaving the separate latency issue visible.

A successful run investigates the competing explanations, executes the eligible mitigation, and checks the expected metric over the runbook's observation window. It reports restored behavior and any unresolved degradation separately. A convincing cause narrative without the follow-through leaves the assignment unfinished.

Independent code-change inspection and metric comparison can run in parallel when that reduces delay. One investigation owner reconciles the results against the same incident and time window. Adding a worker for every data source would add coordination without improving the task.

## Assign state and runtime ownership

The incident application owns incident status and responder participation. Observability systems own measurements. The configuration service owns the flag state. The agent's runtime retains progress, tool results, and pending operations.

Use a managed runtime if its current session, networking, tool, and recovery interfaces meet this workload. Keep the enterprise tools behind services that enforce their existing permissions. Own more of the runtime when a demonstrated requirement demands it, such as an execution environment or lifecycle behavior the managed service cannot supply.

The model's active context can contain the current hypotheses and decisive observations while source results remain recoverable elsewhere. Anthropic's [Managed Agents design](https://www.anthropic.com/engineering/managed-agents) provides one example of separating persistent session records, the reasoning harness, and execution environments. The general design question is which failures the chosen platform can recover from without losing the business operation.

## Exercise the consequential path

Replay the incident in a test environment where metrics, logs, and flag effects respond to actions. Verify whether the agent finds the cohort distinction and whether the service state improves after mitigation. Include a contrasting incident where the flag is unrelated; it should investigate another explanation instead of repeating the same operation.

Interrupt execution around the mitigation. If the response is lost after the configuration service applied the change, recovery must inspect the current flag state and recorded operation before acting again. If a responder changed the configuration first, the source version conflict should send the agent back to the changed situation.

Measure time to a supported explanation, time to verified mitigation, responder work, and erroneous actions. Expand to another service or action class when these results support it. Broader autonomy is earned by performance on the responsibility being added, while the core product remains an investigator that can finish eligible work.

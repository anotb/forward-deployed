---
name: technical-delivery
description: Deliver an enterprise AI capability from a working slice to operation and team ownership. Use for coding-agent handoffs, integration dependencies, AI-assisted development workflows, release scope, and technical transfer.
---

# Technical delivery

Deliver an AI capability the receiving team can operate and extend. Inspect what works, the intended outcome, and the uncertainty that could change the build. Implement or coordinate within the assignment; produce a brief when that is the requested result.

## Build a complete first slice

Choose a task that exercises the defining intelligence and reaches its recipient. An agent that migrates one package, runs its checks, and prepares the change for review demonstrates more of a coding deployment than suggestions across an entire repository. A research workflow should finish an investigation in the place where its team uses it.

Narrow the population, document family, repository, or action scope while preserving meaningful work. Exercise source access, tool semantics, continuation, and the receiving workflow early. Expand from observed behavior instead of waiting for every future feature.

Explore the supported products, connectors, runtimes, and extension points available in the customer's environment. A managed capability may already supply execution, persistence, sharing, or deployment. Use custom infrastructure for the behavior the task still needs.

## Make the assignment buildable

Give the implementing engineer or coding agent enough context to start and enough freedom to improve the design. Include what matters for this build:

- The task, finished outcome, first release population, and examples that distinguish good behavior.
- The repository or workspace, existing implementation, environment, access, and relevant conventions.
- Source and tool contracts whose meaning affects correctness, such as units, entity identity, freshness, write acknowledgment, or retry behavior.
- The state that must survive, output location, and how the recipient completes the work.
- Acceptance checks, unresolved decisions, and the constraints behind settled choices.

Carry the accepted intent and constraints through the team's existing issue, design, or repository records. Link implementation, checks, and release results there, updating the decision when the intended behavior changes. Separate required behavior from implementation assumptions: resumption need not require a new orchestration service. Have the implementer exercise a complete case before treating an estimate as a commitment.

See [a coding-agent delivery](references/coding-agent-delivery.md) for a handoff that resolves environment and continuation requirements.

## Equip the agent to keep working

For work spanning sessions, preserve the goal, artifacts, progress, source versions, and next action outside transient conversation. Give the agent a way to inspect the environment, check its work, and recognize completion. Verify resumption.

For recurring work, track progress per source and distinguish read, processed, and delivered items. Keep failed reads separate from "nothing changed" and preserve their last successful position. Advance delivery state after acknowledgment; reconcile an uncertain write before retrying. Keep user-maintained preferences separate from agent progress, with their own write permissions. When inputs change, identify affected work. Put these semantics in the tool or harness contract when applications depend on them.

## Resolve dependencies into delivery choices

Work backward from the completed task. For each blocking dependency, identify the behavior it enables and a concrete alternative. A dated snapshot may support an overnight analysis; an interactive decision may need a live query. Existing user access may support a shared workspace; unattended execution may need a service identity. Choose the route that preserves the task's useful outcome.

Find where accepted work waits: clarification, environment setup, review, CI, or release. Measure those queues alongside implementation time and the repair work after shipping. Use the observed constraint to choose where more automation or capacity helps. Parallelize independent work with clear ownership. When a constraint changes the promise, propose the scope, sequence, or date change and keep unaffected work moving.

## Release and transfer the capability

Choose the release scope from observed task performance and the consequences of failure. Some work can run autonomously within its granted action scope; other work belongs in an existing review process. Demonstrate the operating path, including recovery that matters to this service. Inspect the resulting state and user experience.

Put the service into the team's normal access, release, and support arrangements. Keep temporary bridges paired with a replacement or retirement plan. If Studio is the working record, use `plan_delivery` to connect the useful increment with its requirements and supporting runs; link the team's existing work items.

Check the deployed result against the intended user outcome. Turn a production failure or missed outcome into a reproducible case, a repair to the responsible layer, and a verified release. Retain the useful regression check or operating lesson where the next change will use it.

Transfer through practice: have the customer team run the next task, diagnose a failed run, and make a change. Supply documentation for those tasks and the reasoning behind coupled choices. Close with the delivered scope, remaining constraint, and next expansion.

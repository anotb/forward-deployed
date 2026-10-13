---
name: evaluate-and-improve
description: Evaluate and improve enterprise AI on completed tasks, useful capability, and operating economics. Use for experiments, model or harness comparisons, release decisions, regressions, and diagnosis from agent traces.
---

# Evaluate and improve

Use experiments to make the AI more capable and decide what to build, change, or release. Start with the enterprise task and the decision to settle, then run the available experiment.

## Define a finished task

Describe success in the working environment. A coding agent leaves a working change. An analyst produces a reproducible investigation that informs a decision. Check the resulting files, records, calculations, or user outcome, including the effort needed to use it. Separate required properties, such as using the correct entity, from graded usefulness.

Test the capability that makes the opportunity worthwhile: finding a cause, developing alternatives, completing a difficult migration, or covering work the team previously could not afford. Maintain demanding capability cases alongside regressions for behavior already relied on. A system that avoids difficult work can pass defensive checks and still miss the opportunity.

Set the comparator for the decision: the current team, existing automation, the incumbent agent, or a new candidate. Compare equivalent tasks, information, authority, and completion criteria. Better context or a redesigned workflow can be part of the intervention; attribute the gain accordingly.

## Build cases that reveal judgment

Start with representative work episodes and known failures. Give each case a starting environment, accessible evidence, requested outcome, and way to judge completion. Include ordinary work, consequential exceptions, and ambitious tasks that stretch the system. A curated challenge set tests capability; an operational sample estimates frequency.

Use contrasts where one fact should change the result. Change a metric's denominator, introduce a later contract amendment, or make a dependency incompatible. Include cases with several good solutions, and leave room for a candidate to discover a better approach than the reference answer.

Keep held-out answers and later information out of candidate context. Preserve the tool access and timing that matter in a replay. For stateful work, exercise interruption, changed sources, and recovery from an uncertain write. Field Lab can supply a simulated environment when its actions and state fit the question; inspect the recorded outcome.

Repeat trials where variability affects the decision. Count retries according to the proposed product behavior, including their cost and delay. Repeated attempts on one case do not create more independent business cases.

## Explain the result from traces

Retain enough permitted evidence to reconstruct a run: input and source versions, supplied context, configuration, tool calls and results, resulting state, and human intervention. Hidden chain-of-thought is unnecessary.

Use targeted contrasts to find the layer that needs work:

- **Context:** Supply the missing decisive evidence. If performance recovers, repair discovery, selection, or representation.
- **Model or instructions:** With adequate evidence and tools, test whether the agent can make the inference or pursue the right objective. Compare a stronger candidate when capability is the question.
- **Tools:** Inspect argument meaning, permissions, returned data, and committed state when the intended action produces the wrong result.
- **Harness:** Examine lost state, premature completion, context growth, retries, and coordination when individual steps work but the task fails.
- **Workflow:** Inspect handoffs, review effort, and timing when a technically correct result is unused or creates more work.

Test the proposed repair against a successful nearby case as well as the failure. Read [diagnosis from traces](references/diagnosis-from-traces.md) for a worked enterprise analytics investigation.

## Evaluate the evaluation

Use executable checks for calculations and system state. Use expert judgment or calibrated model graders for synthesis, alternatives, and usefulness. Give graders the relevant evidence, allow valid alternative solutions, and inspect disagreements that could change the decision. Evaluate the human review step too when the design depends on reviewers detecting errors: observe what they miss and how much checking they need.

## Improve useful output per unit of effort

Measure accepted outcomes across eligible work, keeping failed, abandoned, and unresolved attempts visible. Calculate cost per accepted outcome from model, tool, infrastructure, review, repair, and maintenance costs over the same population and period. Measure elapsed time separately from labor. New coverage or better decisions can justify higher spend.

Turn demonstrated failures into regression cases and rerun the affected work after a repair. Revisit tests when business meaning or available capability changes. Finish with the supported choice and its evidence: ship, expand the capability, improve a named layer, run the discriminating experiment, or stop the direction.

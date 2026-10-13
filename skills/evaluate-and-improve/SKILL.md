---
name: evaluate-and-improve
description: Evaluate and improve enterprise AI on completed tasks, useful capability, and operating economics. Use for experiments, model or harness comparisons, release decisions, regressions, and diagnosis from agent traces.
---

# Evaluate and improve

Use experiments to make AI more capable and settle a build, change, or release decision. Run the available experiment.

## Define a finished task

Describe success in the working environment. A coding agent leaves a working change. An analyst produces a reproducible investigation that informs a decision. Check the resulting files, records, calculations, or user outcome, including the effort needed to use it. Separate required properties, such as using the correct entity, from graded usefulness.

Test the capability that makes the opportunity worthwhile: finding a cause, developing alternatives, completing a difficult migration, or covering work the team previously could not afford. Keep demanding capability cases alongside regressions for behavior already relied on.

Choose the comparison that resolves the decision: current work, existing automation, incumbent agent, or new candidate. Keep tasks, information, authority, and completion criteria comparable. Attribute combined context or workflow gains to that intervention.

## Build cases that reveal judgment

Sample the work the enterprise wants done, including ordinary tasks, known failures, and expert-chosen hard cases. Difficulty should come from the job, not only today's model errors. Give each case a starting environment, accessible evidence, outcome, and completion check. Distinguish capability challenges from population estimates.

Use contrasts where one fact should change the result. Change a metric's denominator, introduce a later contract amendment, or make a dependency incompatible. Include cases with several good solutions, and leave room for a candidate to discover a better approach than the reference answer.

Keep held-out cases and answers inaccessible to the optimizer; give the candidate only its task inputs. Reset mutable test environments between trials so prior files, caches, or actions cannot leak results. Preserve relevant tool access and timing. For stateful work, exercise interruption, changed sources, and uncertain-write recovery; Field Lab can provide a matching simulated environment.

Check whether the smallest gain worth acting on exceeds measurement noise. If it does not, improve the cases or grader, or add trials where sampling uncertainty is the cause. Count product retries and their cost; repeated attempts on one case are not independent business cases.

## Explain the result from traces

Retain enough permitted evidence to reconstruct a run: input and source versions, supplied context, configuration, tool calls and results, resulting state, and human intervention. Hidden chain-of-thought is unnecessary.

Use targeted contrasts to find the layer that needs work:

- **Context:** Supply the missing decisive evidence. If performance recovers, repair discovery, selection, or representation.
- **Model or instructions:** With adequate evidence and tools, test whether the agent can make the inference or pursue the right objective. Compare a stronger candidate when capability is the question.
- **Tools:** Inspect argument meaning, permissions, returned data, and committed state when the intended action produces the wrong result.
- **Harness:** Examine lost state, premature completion, context growth, retries, and coordination when individual steps work but the task fails.
- **Workflow:** Inspect handoffs, review effort, and timing when a technically correct result is unused or creates more work.

Test the repair against a successful nearby case as well as the failure. See [a worked analytics investigation](references/diagnosis-from-traces.md).

## Evaluate the evaluation

Use executable checks for calculations and system state. Use independent expert or model judgment for open-ended quality. Calibrate against inspected outputs, permit valid alternatives, and check that the grader gives consistent verdicts on identical artifacts. When human review is part of the product, observe errors missed and reconstruction effort.

For skills, test explicit invocation, natural requests that should activate the skill, and adjacent requests that should not. Judge output quality separately. Use a no-skill baseline with the same task inputs and authority when testing the skill's contribution.

## Improve useful output per unit of effort

Measure accepted outcomes across eligible work, keeping failed, abandoned, and unresolved attempts visible. Calculate cost per accepted outcome from model, tool, infrastructure, review, repair, and maintenance costs over the same population and period. Measure elapsed time separately from labor. New coverage or better decisions can justify higher spend.

Use development cases to diagnose and held-out validation cases to choose edits. Change one attributable factor per tuning step. Repeated selection on validation results still tunes to that set; after sustained iteration, confirm the final choice on untouched test cases. Stop tuning when gains cannot be distinguished or would not change the decision.

Turn demonstrated failures into regressions and revisit tests when business meaning or capability changes. Finish with the supported choice: ship, expand, repair a named layer, run a discriminating experiment, or stop the direction.

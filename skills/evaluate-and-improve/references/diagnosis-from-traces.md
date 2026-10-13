# Diagnose an enterprise analytics agent

This constructed example shows how traces change the next engineering decision. Use it when several explanations fit poor output from an agent with enterprise data access.

## The task

A product team delegates an investigation into falling activation. The agent can query a warehouse, read metric definitions and release notes, inspect a test application, and create a shared investigation. A finished task includes reproducible analysis, plausible explanations tested against evidence, and a recommendation the team can act on.

For this example, activation means a distinct customer account completing setup within 14 days of signup. Employee accounts are excluded. Cohorts need the full 14-day observation window. These definitions are inputs to the evaluation.

The team initially proposes upgrading the model because the reports sound convincing but lead to weak decisions. The traces reveal different problems:

| Case | What the trace shows | Why the task failed |
|---|---|---|
| A | Retrieval supplied an old definition based on sessions. Queries and arithmetic follow that definition correctly. | The report explains a different metric from the one the team asked about. |
| B | The current definition is present. The agent compares a mature prior cohort with signups from the last three days and recommends reversing the onboarding release. | It has the needed information but fails to apply the observation window. |
| C | The query tool silently defaults to a staging clone from last month. Its response carries no environment or snapshot identifier. | The analysis uses the wrong data despite a reasonable query. |
| D | The analysis is sound and the artifact is saved, but only in the author's personal session. | The product team cannot inspect the queries or use the investigation. |

## Run the contrast that distinguishes the cause

For A, replay with the current definition and equivalent warehouse access. Recovery would support fixing definition selection and linking the metric to its source.

For B, give the agent a case with mature cohorts and a matched case containing recent signups. Test whether it detects the difference and chooses a comparable population. Compare the current and stronger model on both cases if inference capability remains the question. A blanket instruction to wait 14 days for every analysis would also block valid investigations using already mature cohorts.

For C, expose the environment and data timestamp in the tool result, then repeat against the intended dataset. Inspect the executed query and returned records. A more persuasive explanation cannot correct an undisclosed environment mismatch.

For D, run the publishing path and inspect the shared artifact as its recipient. Preserve the working analysis while fixing the destination and access. Requiring the analyst to copy every result manually would add a new operating cost.

Use these contrasts to select changes independently. If a combined redesign is the proposal, evaluate the combined outcome and retain enough trace evidence to explain what improved.

## Test the capability the team wants next

Add a harder case in which activation falls after an instrumentation change while underlying setup completion is stable. Let the agent inspect event definitions, compare independent records, and exercise the test application. A strong investigation finds the discrepancy and proposes a way to repair measurement. Give it a neighboring case where setup completion really declines, so the evaluation rewards investigation rather than a habitual instrumentation explanation.

Judge the finding, evidence, and executable next step. Permit a valid diagnosis reached through a different sequence of queries.

## Check the review step

Give reviewers the working artifact, including query results and definitions. Test a polished report with an invalid cohort comparison and a less polished report with a sound alternative explanation. Observe whether reviewers distinguish them and how much reconstruction they need.

If experts disagree, locate the disagreement: a source fact, an analytical error, an alternative explanation, or a different appetite for the proposed experiment. Correct the grader when it rewards a favored narrative over supported analysis.

Anthropic's [agent evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) distinguishes the run's transcript from its resulting environment and separates capability tests from regression tests. Those distinctions inform this diagnostic approach.

# A bounded optimization loop

This fictional example concerns an enterprise investigation agent. Use it when an agent can repeatedly change instructions, code, or configuration and measure the result.

## Choose the outcome and the experiment

Analysts want a completed account investigation sooner. The agent retrieves evidence, compares explanations, runs calculations, and saves a report with inspectable sources. The team proposes optimizing retrieval because it appears frequently in traces.

Measure the path from the analyst's request to a usable investigation. Preserve the quality conditions: the right account and observation period, current permissions, correct calculations, and support for the recommendation. Record analyst repair time alongside elapsed time and execution cost.

Allow the optimizer to change the query adapter and evidence-selection instructions in an isolated copy. Keep evaluation cases, expected results, grader implementation, and permission enforcement outside its editable surface. Give it a finite experiment budget and a way to save the best checked candidate. The run can finish without finding an improvement.

## Establish whether the measure is useful

A stable count of database operations makes a convenient local benchmark. First change one representative query and check whether the count predicts the outcome under realistic data volumes, access checks, and cache conditions.

| Candidate | What the experiment reveals | Decision |
|---|---|---|
| Fewer operations within one query | The microbenchmark improves, but the investigation still waits on the same remote sources. | Pursue only if the resource saving justifies the added maintenance; it has not shortened the analyst's wait. |
| Reuse a cached evidence packet | Runs finish sooner, but an updated account restriction is missed. | Reject this candidate; the speed gain breaks a required property. |
| Batch independent source reads | The whole investigation finishes sooner with the required evidence and permissions intact. | Compare it on held-out work, including large accounts and slow sources. |

Keep the objective and checks stable while comparing candidates. If a measurement defect is discovered, fix it and rerun the baseline before ranking changes.

## Select and verify the change

Use development cases to diagnose and separate validation work to choose candidates. Inspect failures by task type; an average improvement may hide damage to the cases the service exists to handle. After repeated selection, assess the final candidate on untouched cases. Return the best supported version, which may be the original.

Review the resulting change for behavior and maintenance cost. A complicated cache that saves little time may be less valuable than a simple query repair. Retain a regression check for a demonstrated gain, without making every local metric a permanent release gate.

After an authorized rollout, compare complete investigations and analyst repair work under the intended operating conditions. If only the local benchmark improved, revisit the proxy and the next experiment. Use the deployed result to decide whether to expand, revise, or revert the change.

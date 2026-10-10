# Worked diagnosis from illustrative traces

All episodes, timings and results below are fictional input traces for learning a diagnostic method. They are not observed plugin performance, a benchmark or evidence for deployment. Use this reference when a local speed improvement conflicts with operational results, or when several failure mechanisms fit the same symptom.

## The decision

A restoration service prepares response options for a supervisor. Dispatchers report faster plan preparation, but more unused expedited spares. The next decision is whether to change information access, planning behavior or the service's stock arrangement. “Improve accuracy” does not distinguish those interventions.

Three explanations remain plausible: the candidate overstates diagnostic certainty; it lacks the timing information needed to preserve an option; or its objective rewards maximum immediate readiness without considering avoidable commitments. A fourth possibility is that the network cannot provide an economical feasible option regardless of reasoning quality.

## Illustrative episode records

| Episode | Evidence available at decision time | Recorded candidate action | Receiving outcome |
|---|---|---|---|
| E1 | Pump fault possible; diagnostic result expected 14:20; courier cutoff 15:00; compatible spare remains reservable until 14:40. Production context omitted all three times. | Proposed immediate paid dispatch, accepted by supervisor | Diagnostic result ruled out pump fault at 14:18; courier cost incurred. |
| E2 | Same uncertainty and decision windows as E1; all times supplied to candidate | Proposed immediate paid dispatch “to minimize restoration risk” | Pump fault ruled out; courier cost incurred. |
| E3 | Diagnostic result expected 16:00; cutoff 15:00; compatible spare available; waiting loses the same-day option. All times supplied. | Proposed bounded dispatch with diagnostic uncertainty and cost visible | Supervisor accepted the tradeoff; spare was used after confirmation. |
| E4 | Confirmed fault; only compatible spare cannot reach site within promised window | Produced a confident on-time restoration plan using a nearby incompatible part | Receiving compatibility check rejected the plan; no viable on-time plan established. |

These records establish different problems. E1 is consistent with missing context, but does not prove context alone caused the decision. E2 supplies a counterexample to that simple explanation. E3 is a successful near-neighbor: eliminating all uncertain dispatches would damage useful behavior. E4 tests feasibility, not merely willingness to spend.

## Isolate what changes the decision

Reconstruct the original decision-time packet and observable tool state; do not give the candidate the later diagnostic result. Hold source access, candidate configuration and permitted actions constant except for the factor under investigation. For a real experiment, save the output and resulting state for each run rather than relying on the candidate's own account of success.

The following is an illustrative replay record, not executed evidence:

| Contrast | Illustrative result | What it would support if observed |
|---|---|---|
| E1 with the three missing times restored | Still requests immediate dispatch | Retrieval repair alone is insufficient for this episode. |
| E2 with planning instruction to compare waiting, holding and committing against the decision window and bounded downside | Holds the spare, waits for the diagnostic result, then releases the hold | Planning objective is a plausible mechanism; inspect whether the proposed hold is executable. |
| E3 with the same instruction change | Still surfaces a bounded paid-dispatch option before cutoff | The change need not reduce cost by rejecting the valuable class of work. |
| E4 with the same instruction change | Still proposes incompatible part | A separate compatibility/feasibility defect remains; do not claim the planning change repaired the service. |

One changed instruction can affect several behaviors. Check its proposed mechanism in the actual actions and evidence used, then repeat uncertain cases. If a candidate merely rewrites the justification while making the same commitment, the explanation is not evidence of repair.

When candidate order, operator or workload differences could confound a larger comparison, compare within comparable cases and randomize order where practical. [NIST's guidance on randomized blocks](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm) explains the underlying experimental principle. Repeated model calls on one episode do not create independent business episodes or settle population performance.

## Make the review distinguish useful disagreement from failure

An adjudicator should receive decision-time constraints and resulting external state. Ask whether the proposed option was feasible, whether its material uncertainty was visible, and whether its timing preserved a useful choice. Do not require one favored wording or penalize a cheaper feasible alternative absent from the original reference answer.

If two domain reviewers disagree about E3's dispatch cost, separate a factual dispute from a risk preference. A missing courier price or customer buffer needs evidence. Two informed supervisors accepting different bounded tradeoffs may both be within authority. Conversely, an incompatible part is not made acceptable by averaging reviewers' scores. Resolve that explicit constraint separately from preference-sensitive utility.

Retain the disagreement when it matters to the launch decision. An adjudication meeting can discover an undefined service promise; no amount of model grading repairs that missing business decision.

[Anthropic's agent evaluation account](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) provides further practitioner guidance on observable outcomes, balanced cases and grader calibration. It is a method reference, not evidence for the results of this fictional example or this plugin.

## What can be concluded, and what next?

These four selected episodes can reveal a mechanism worth testing and a surviving defect. They cannot establish how often the problem occurs or how much money a rollout will save. A production comparison needs an eligible episode denominator, task mix, accepted outcomes and review/repair work, with rejected and unresolved cases visible. Charging every prevented dispatch as savings would also overstate benefit if it increases missed restoration windows.

For the AI contribution, compare against the same information and integrations used by the current supervisor or explicit planning rules. For the service investment, compare the combined intervention with current operation. Those questions can yield different answers.

The actionable result would be a bounded planning repair to test, a compatibility defect to investigate, and a preserved successful near-neighbor. If feasible planning still misses the promise because stock placement is wrong, change the operating arrangement or promise. Further prompt refinement would be an unsupported response to a network constraint.

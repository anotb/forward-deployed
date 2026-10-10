---
name: evaluate-and-improve
description: Test whether an AI workflow produces useful business outcomes, diagnose where it fails, and improve the right part of the system. Use for feasibility proofs, candidate comparisons, release decisions, regressions, production incidents, and disappointing adoption or economics.
---

# Evaluate and improve

Use evaluation to settle a consequential decision and make the capability better. Begin with what the user is trying to choose, release, repair, or expand. A test suite should distinguish a useful system from a plausible demonstration; a diagnosis should identify the mechanism that needs changing rather than attach a quality score to the final answer.

Work on the available evidence and run authorized tests when possible. An evaluation plan is the right result when access or scope prevents execution, but do not stop at a plan when the host and user authorization support a meaningful experiment. Keep unrun cases distinct from observed behavior without repeating that qualification throughout the deliverable.

## Define success at the point where work becomes valuable

Follow the task through its accepted outcome. A correct recommendation can arrive too late; a correct draft can require more review than writing from scratch; a successful tool response can leave the business transaction incomplete. Determine whose work improves, what must be true in the receiving system or operating process, and which downstream burden counts against the benefit.

Evaluate the defining intelligence, not only its restraint. If the opportunity depends on discovering a better alternative, test whether it finds a feasible alternative that the initial request missed. If it depends on scaling expertise, test newly covered cases and the additional review queue. If it depends on an adaptive investigation, test whether the next question separates meaningful hypotheses. A system that avoids every mistake by declining all work can fail the product completely.

Keep mandatory invariants separate from graded usefulness. Wrong-entity actions, invalid commitments, or unauthorized disclosure cannot be averaged away by fluent writing. Conversely, passing those controls does not establish that the system makes good decisions. Judge the operational value of correct completion, useful partial progress, unnecessary escalation, missed opportunities, and intervention effort according to this workflow.

Choose a comparator that represents the decision. The relevant baseline may be current operators, an existing application, a deterministic method, the incumbent AI workflow, or a different candidate. Compare the same unit of work, completion definition, information, and authority. If a candidate receives better data or a redesigned process, recognize that the experiment evaluates the combined intervention rather than attributing every gain to the model.

When deciding whether AI earns its place, compare against the same useful integration and process improvements with existing human judgment or explicit rules. Look for better alternatives, wider coverage, better questions, reduced expert effort or another contribution the intelligence should make. When deciding whether to deploy the whole service, evaluate that combined service too. These experiments answer different investment questions.

## Build cases that can distinguish expertise from fluency

Use real workflow episodes and domain adjudication when available. Include enough ordinary work to understand usefulness and enough consequential exceptions to challenge the design. Rare failures may need deliberately constructed cases even when the prevalence estimate must come from operational data. Do not confuse those two purposes or treat a curated challenge set as a population sample.

Construct paired cases where one changed fact should change the action. A part becomes incompatible under a different installed revision. A contract amendment becomes effective after the measurement date. A permit expires before arrival. A shipment delay consumes the remaining customer buffer. These contrasts test whether the system applies the relevant relationship rather than repeats a memorized recommendation.

Add cases that reward discovery. Give the system an incomplete initial plan and enough accessible evidence to find a materially better option, then judge whether the option is feasible and useful. Permit different good answers. A reference answer should describe the material reasoning and outcome constraints; it should not punish a superior approach because it follows a different sequence.

Use Field Lab when its simulated actions and state can answer the evaluation question. Define a rehearsal around the useful outcome and linked requirement versions, then observe and act through the available tools until the case is ready to finish. Inspect the recorded state and checks. Fork a recorded step when a different condition or decision would distinguish the designs; keep the original run for comparison. Give the candidate only the observations available in the case, and report the result as simulation evidence.

For multi-step work, include external state and changing evidence. Interrupt execution after a command may have committed, deliver events out of order, change a plan while approval is pending, or introduce resource contention. The test should examine authoritative resulting state and recovery behavior. A final message saying “completed” is not proof of completion.

Keep outcome knowledge away from candidate inputs. Split repeated entities, near-duplicate documents, and related incidents appropriately so the system does not learn the held-out answer through another route. A historical replay must reflect what was available then; later corrected data can be used by an adjudicator without quietly becoming candidate context.

Size and repeat experiments according to the decision's uncertainty and failure consequences. A few carefully chosen cases can disprove a design assumption; they cannot establish a rare-error rate. Stochastic candidates may require repeated trials. Define whether retries are part of the proposed product, and count their cost and delay consistently instead of reporting the best result from unlimited attempts.

## Observe the system deeply enough to explain the result

Capture the input and relevant source versions, retrieved or supplied context, applicable authority, model and tool configuration, observable actions, external results, and human intervention needed to understand the run. Limit retained content to what is necessary and permitted. A useful trace supports reconstruction without requiring hidden chain-of-thought or wholesale logging of sensitive payloads.

Distinguish a missing observation from a successful stage. If the workflow lacks evidence that a write reached the source system, the result is unresolved even when the model expected it to succeed. If a user abandons the workflow, inspect whether the cause is access, delay, low-value output, a competing tool, or an inconvenient task surface before treating it as resistance to change.

Use deterministic checks for calculations, identity, state transitions, and command invariants where the rules are explicit. Use expert review or calibrated semantic grading for interpretation, plan quality, and usefulness. A model judge needs the relevant evidence and criteria, and should be checked against expert disagreements near consequential boundaries. Agreement with the candidate's own explanation is not independent validation.

Grade evidence support at the level of the decision. An answer can quote a true fact while deriving an unsupported remedy. It can also be correct for a reason the grader failed to anticipate. Inspect material disagreements before changing either the system or the rubric, and preserve legitimate alternative judgments where the task allows them.

## Diagnose the failing layer before changing the stack

Reconstruct a failed episode from its initial conditions through the receiving outcome. For an active incident, identify current exposure and the authorized restoration path first. Investigate logs, configuration, source state, and affected populations read-only before making operational changes. A plausible explanation is a hypothesis to test, not permission to rewrite production.

Use targeted contrasts to distinguish mechanisms:

- If the system succeeds with a carefully assembled applicable context but fails with production retrieval, investigate selection, identity, applicability, or representation before swapping models.
- If it fails with the decisive evidence present, test whether the task is underspecified, the instruction encourages the wrong objective, or the candidate lacks the necessary interpretation or planning ability.
- If the recommendation is sound but the external result is wrong, inspect tool arguments, authority, concurrency, commit semantics, and reconciliation. More prompting is unlikely to repair a duplicate-write mechanism.
- If isolated replay succeeds but live work fails, reproduce the live permissions, timing, event order, load, and operator interaction. The difference may sit outside the model call.
- If planning becomes faster while expense or rework increases, examine what the system optimizes and which commitments it makes under uncertainty. Speed is a diagnostic measure, not the outcome.

Change one explanatory factor at a time where practical. Compare with a successful equivalent episode, substitute the corrected source or interface behavior, and see whether the failure disappears. When factors interact, test the smallest combination that represents the proposed causal mechanism. Correlation with a release, source refresh, or model upgrade alone does not explain the event.

Repair the boundary that failed. A wrong-entity join needs identity resolution; an inapplicable procedure needs applicability handling; an ambiguous source rule may need an accountable interpretation; a stale approval needs action validation. Add manual review when it is the best operating choice, but do not use another reviewer as a permanent substitute for a fixable integration defect.

Explore current capabilities when the diagnosis suggests a material limitation. A newer source-product feature, model capability, document interface, or execution facility may eliminate a custom workaround. Exercise the relevant behavior through the available host and customer surfaces. Do not keep an obsolete harness restriction because it was once necessary, or replace an entire stack when a supported interface correction solves the problem.

## Judge operation and economics together

Measure accepted outcomes over the eligible population, with attempts, abstentions, failures, and missing outcomes visible. Include operator review, corrections, retries, support, and maintenance. A lower inference cost can be outweighed by more expert intervention; broader coverage can create a valuable capability while increasing total cost. Explain the mechanism instead of assuming that every useful system must reduce one local time metric.

For a pilot or rollout, choose a comparison that can support the intended claim. A staged introduction, comparable teams or periods, or random allocation of eligible work may be practical. Account for task mix, seasonality, concurrent process changes, learning effects, and contamination between groups. Report what the comparison can distinguish rather than attaching a causal claim to an uncontrolled before-and-after difference.

Tie quality thresholds and escalation rules to consequences. A decision support workflow may tolerate uncertainty if the reviewer can detect and resolve it cheaply. An unattended commitment may require a much stronger invariant and recovery path. Establish who accepts the operating tradeoff and what observation would reverse that acceptance. Avoid universal accuracy targets that hide different error costs.

Use production feedback to test the business hypothesis as well as the implementation. Low uptake may mean the task is infrequent, the output arrives after the decision window, or the new workflow removes a responsibility the operator is still measured on. A model-quality improvement will not repair misaligned incentives or an unstaffed exception queue. Bring the resulting choice to product, operations, and commercial owners with a concrete alternative.

## Turn an observed failure into a better capability

Carry a failure into a regression case that preserves its mechanism and meaningful surrounding conditions. Add a successful near-neighbor so the repair does not simply block the whole class of work. Verify the behavior after the change and look for displaced cost or new failure modes at the affected boundary.

Keep evaluations revisable as the business and technology change. Preserve business invariants while allowing better implementations and newly feasible actions. A test that requires a now-obsolete workaround can prevent improvement. Revisit the oracle when a policy, approved substitution, source authority, or commercial obligation changes; do not silently reinterpret an old test failure as a product success.

Distinguish the local repair from the reusable lesson. If several failures share a missing transaction primitive, applicability model, or source-product limitation, consider a supported shared capability or a reproducible product-feedback case. If the failure is peculiar to one customer's data, contain the customer-specific rule and its owner rather than turning it into a universal prompt.

The result should support action: choose the candidate, continue the experiment, release the bounded capability, repair a demonstrated mechanism, change the operating model, or stop an uneconomic direction. Present the evidence and remaining uncertainty in the form that makes that decision reviewable. Complete the authorized experiment or correction and verify its effect; a long findings list is not the improvement itself.

## Worked diagnosis: quicker plans, worse service cost

A restoration coordinator reduces dispatcher preparation time, but live episodes show more unused expedited spares. Three explanations are plausible: the model overstates fault certainty, the source context omits a useful discriminator, or the planning objective treats every possible restoration delay as worth any permitted spend.

Replay the affected episodes with the original timing and data. Check whether the model knew the diagnostic result would arrive before or after the courier cutoff. Give it the missing observation where appropriate and compare the commitment decision. Then test a proposal that explicitly weighs the bounded downside, remaining alternatives, and customer buffer while leaving the supervisor's authority intact.

If that change reduces unnecessary commitments without losing viable restoration paths, it addresses the demonstrated decision mechanism. If cost remains high because the stock network cannot serve the chosen sites, the next intervention may be parts placement or a differently priced service rather than another prompt. Evaluate the combined accepted outcome and cash effect before claiming that faster preparation improved the operation.

Read [the illustrative trace diagnosis](references/diagnosis-from-traces.md) when several mechanisms explain an operational regression. It shows contrasts, a successful near-neighbor, reviewer disagreement and limits on the resulting claim. Its invented records teach analysis; they are not executed evaluation results.

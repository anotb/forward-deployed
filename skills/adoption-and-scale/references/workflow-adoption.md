# Adoption of a deployed workflow

## Understand the work people take on

Follow a task from the moment someone could use AI to the moment its result becomes useful to them or another person. Inspect the surrounding work: preparing inputs, choosing an approach, checking a conclusion, correcting it, entering the result elsewhere, and remaining accountable afterward. Convenience inside the tool can be outweighed by a costly handoff outside it.

Understand people's rational reasons to use or avoid the new path. Who gains time? Who receives more work? Who loses control or status? Who is blamed when a plausible recommendation is wrong? What do the manager's targets reward? Experimentation needs time and a reason to share what works. If a manager treats exploration as idle time or captures every saving by adding work, employees have little reason to develop and diffuse better practice. If a new process improves quality but its operators are measured only on touches per hour, the deployment has created a conflict that a launch campaign will not fix.

Distinguish capability defects from friction, competence, authority, trust, and incentives. Observe a willing skilled user on a suitable case to test product fit. Observe a less experienced user to test whether the required judgment is teachable. Investigate former users and bypasses; a workaround often reveals the service the product failed to provide. Treat enthusiastic champions as valuable partners, not a representative sample.

For the basis of this diagnostic distinction, [Michie, van Stralen and West's original behavior-change paper](https://link.springer.com/article/10.1186/1748-5908-6-42) examines capability, opportunity and motivation before intervention choice. It supports considering environmental constraints as well as individual skill. Its public-health framework does not establish which explanation fits this deployment; the task observations must do that work.

Make the redistribution of work explicit. A frontline team may save time while a central specialist queue becomes saturated. An analyst may gain capacity while their manager continues assigning the old workload and adds continuous monitoring. Negotiate how the released capacity is used, how new work is admitted, and how affected teams are staffed. Describe staffing choices as choices; adoption should not depend on making promises the sponsor has not made.

## Design the role and workflow around the capability

Decide what should disappear, what becomes more frequent, and where human judgment becomes more concentrated. If a service can keep a case continuously prepared, reconsider the periodic assembly process instead of adding a second preparation ritual. If it can investigate routine exceptions, redesign the specialist's queue around consequential ambiguity and novel situations.

Place the experience where action happens. Explore the supported workflows, product extensions, notifications, case surfaces, and operator tools available in the environment. A generated answer in a separate chat may be appropriate for exploration; a maintained review case may be better for work that waits, changes hands, or needs a recorded decision. Let observed task behavior decide the interaction. More integration is useful when it removes a meaningful handoff, not merely because embedded looks more complete.

Resolve the last mile. The operator should understand what is ready, what remains uncertain, what changed, and what action completes their responsibility. Preserve their ability to inspect and correct consequential reasoning without asking them to redo the entire analysis. A review process that requires complete independent reproduction eliminates much of the capacity benefit; a blind accept button transfers responsibility without giving the reviewer a usable basis.

Consider a loan-monitoring service that continuously identifies changes in borrower condition. Sending every finding to the relationship manager can create alert fatigue and avoidance. A stronger operating design groups related changes into the existing borrower review case, distinguishes material changes from background updates, gives an analyst a prepared investigation, and brings the relationship manager a specific request for customer information when needed. This changes who does the work and when. Training people to read more alerts would leave the main problem intact.

Calibrate autonomy to the task and the demonstrated operating behavior. Review all cases when the consequence or uncertainty requires it; concentrate review on meaningful exceptions when the system and policy support that arrangement. Design feedback so corrections reach the maintained record or procedure that caused them. Repeatedly correcting the same issue in a chat is neither learning nor sustainable operation.

## Teach the changed responsibility

For an embedded workflow, teach the decisions each role now makes. An operator needs to assess the result, intervene appropriately, and finish the handoff. A reviewer needs to distinguish a consequential unsupported inference from an immaterial wording change. A manager needs to interpret queue and outcome measures and adjust workload. A service owner needs to decide when a policy, source, or behavior change requires revalidation.

## Diagnose use and make the intervention

Examine behavior by role, case difficulty, team, and time since introduction where those differences matter. A falling usage rate can mean loss of confidence, a completed backlog, fewer eligible tasks, or successful automation that no longer needs visible interaction. Combine event data with observation of work before assigning meaning.

Turn the finding into an intervention. If users abandon during input preparation, improve context access or eligibility detection. If they accept a recommendation but cannot complete the action, fix the authority or integration boundary. If a specialist repeatedly rescues cases, improve the failing behavior or change the promised scope. If performance is strong but management keeps both processes running, negotiate retirement of redundant work. More reminders are useful only when forgetting is the problem.

## Worked diagnosis: faster preparation, more total work

Use this example when adoption measures and operator experience disagree. The records and timings are constructed to illustrate the reasoning, not reported customer results.

A warranty team says its AI claim preparation saves time, yet senior reviewers avoid the new queue. Twelve supplied sample cases contain eight routine claims and four modified-equipment claims. The matched task timings, in minutes per case, are:

| Case family | Previous preparation + review | New preparation + review | What the case observation reveals |
| --- | --- | --- | --- |
| Routine, eight cases | 15 + 5 | 7 + 8 | Reviewers reopen the source because the draft omits the equipment identifier beside its evidence. |
| Modified equipment, four cases | 20 + 10 | 12 + 30 | The draft treats a standard warranty rule as applicable despite a later modification; reviewers reconstruct the claim before deciding. |

Preparation falls by 96 minutes across this sample. Review grows by 104 minutes. Total labor rises from 280 to 288 minutes. Faster preparation is true; total labor savings are not supported. These matched examples suggest where to investigate, not a population-wide estimate. They do not establish the effect of case mix, queue waiting or learning over time.

The intervention follows the different failure mechanisms. For routine cases, put the relevant identifier and supporting evidence where the reviewer acts; another training session cannot supply missing context. For modified equipment, change the service's handling of applicability: prepare the facts and identify the unresolved warranty question instead of presenting a settled entitlement. The reviewer still owns that judgment. Do not quietly count these cases as completed just because the draft was accepted into a queue.

A short working aid could read:

> For a routine claim, check that the equipment and event in the cited evidence match this claim, then assess the proposed disposition. For modified equipment, use the prepared history to identify what changed and whether the supplied warranty covers that change. If the record does not settle applicability, request the missing evidence through the existing claim. Record a correction against the disputed source or rule so it reaches the maintained procedure; do not simply rewrite the conclusion in your personal notes.

Try the changed practice on an unfamiliar case. Supply a draft recommending payment under the standard warranty and a service record showing that the relevant assembly was modified afterward. Ask the participant to finish the next useful claim action and explain what supports it. A competent response does not reflexively deny payment or accept the draft: it locates the applicability question and either resolves it from the supplied terms or requests the specific missing evidence. Follow with an ordinary covered failure to check that the exercise has not taught blanket escalation.

If reviewers can perform both cases but the queue still grows, examine work admission, staffing and the retained parallel process before prescribing more enablement. If they cannot, observe whether the missing piece is domain knowledge, inaccessible evidence or an unclear responsibility. The next intervention depends on that finding. Expansion should wait on the relevant constraint, not on an arbitrary training-completion percentage.

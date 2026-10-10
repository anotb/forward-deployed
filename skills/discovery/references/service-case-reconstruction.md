# Reconstructing a service case

This fictional service-operation example contains invented records and dialogue. Read it when operational reports and expert accounts point to different causes. Its purpose is to show how an investigation changes a design, not to prescribe a number of cases or an interview sequence.

The sponsor wants a troubleshooting assistant because “diagnosis takes all day.” The team can inspect these fragments:

| Source | Excerpt |
| --- | --- |
| Ticket R17 export | Tuesday: opened 11:40; resolved 16:10. Category: recurring pressure fault. |
| R17 technician message | 08:55: “Fault is back. Sent the serial number yesterday. Which service bulletin applies?” |
| R17 specialist note | 12:05: “Asked for actuator photo; customer retrofit not reflected in installed-base record.” 15:50: “Photo received. Revised assembly; use the later diagnostic branch.” |
| R17 work note | “About 25 minutes reviewing the evidence and advising the technician.” No task timer attached. |
| Ticket R21 export | Thursday: opened 10:00; resolved 11:00. Same fault category. Work note: 15 minutes, standard assembly confirmed. |
| Unlogged email R22 | “Still awaiting the actuator photo. Customer called the distributor instead; no ticket raised.” |

## What the records do and do not establish

R17's ticket duration is four hours and thirty minutes. It is neither total elapsed service time nor measured diagnostic labor: the technician was seeking help before ticket creation, and the work note is an estimate. The record supports a wait between the photo request and receipt, but not an assumption that the specialist was idle throughout that interval. R22 is absent from the ticket population altogether.

R21 is a contrast that suggests why R17 differs, not proof of a typical one-hour service level. These selected fragments cannot establish fault prevalence, average effort or the savings from an assistant. They do justify investigating whether configuration uncertainty repeatedly delays a usable response and whether incomplete work disappears from the service report.

An efficient next observation is to follow a new affected case from the first request, including attempts outside the ticket system, and watch what information the specialist obtains before choosing a branch. If the issue is its frequency, compare available request channels with the ticket population. If the immediate decision is how to design the first experience, reconstructing the configuration judgment is more useful than collecting another aggregate duration.

For planning that observation, the UK Government Digital Service's [contextual research guidance](https://www.gov.uk/service-manual/user-research/contextual-research-and-observation) distinguishes watching ordinary work from asking for a running explanation. Choose deliberately: interrupting to explain every action may change the sequence you are trying to understand. Note questions to return to with the operator where that preserves a useful observation. This is research practice, not evidence that the selected case represents the whole operation.

## Getting past “the expert just knows”

> Investigator: “Why did the serial number not settle the applicable bulletin?”
>
> Specialist: “It tells me what shipped. I needed to know what is fitted now.”
>
> Investigator: “What made you suspect this one had changed?”
>
> Specialist: “The reported connector doesn't match the original assembly. The retrofit changes the diagnostic branch.”
>
> Investigator: “If the serial number were unchanged but the photo showed the original assembly?”
>
> Specialist: “Then I would use the original branch. Without the photo or another reliable configuration record, I would ask for confirmation, not guess from the fault code.”

The reusable insight is not a new fault-code rule. The installed-base record describes the shipped configuration while the decision requires the current configuration. A symptom and a conflicting configuration cue change which observation is worth requesting. Asking the expert to narrate a successful resolution without this contrast might miss that judgment.

Check the reconstructed account against what was available at the time. The excerpts corroborate the photo request and configuration mismatch; they do not independently show when the specialist first noticed the connector. Look for the original technician message before treating that recollection as an observed trigger. A convincing retrospective explanation can contain knowledge acquired later.

In a workshop, this can become a short exercise: show the case without the specialist's note, let the operator and system owner explain which record they would trust, then reveal the retrofit and ask what changes. The useful capture is their disagreement about record meaning and its consequence for the proposed experience, not agreement on a colorful future-state diagram.

## Example discovery conclusion

> The proposed assistant should first help establish the configuration relevant to the fault and assemble the right investigation, rather than select a diagnostic branch from the fault category and serial number alone. R17 shows a case where the sold configuration was insufficient; R22 suggests that the current ticket report may omit some unresolved demand. Neither establishes how common this is.
>
> In the proposed experience, the initial request brings together the installed record, reported symptoms and available evidence of modifications. A conflict prompts a focused request for confirmation before the specialist receives the case. The specialist sees the candidate branch, why it applies, and the unresolved question. If later evidence changes the configuration, the prior branch is reconsidered.
>
> Investigate whether the intake channel can obtain that evidence and whether the installed-base service already maintains modifications elsewhere. Those findings determine whether the first change is better intake, use of an existing record, or a new investigation capability. Test the experience with a case whose fault code stays the same while its current assembly changes.

If observation instead shows that configurations are usually known and complete requests sit in a specialist queue, asking for more evidence could add friction. The next design might support prioritization or reduce repeat specialist work. If current configuration is recorded reliably but hidden from technicians, surfacing that maintained record may solve the problem. The reconstruction supplies competing explanations and a discriminating observation; it does not predetermine an AI build.

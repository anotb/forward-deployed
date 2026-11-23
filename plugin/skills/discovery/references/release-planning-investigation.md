# Discovering what a release-planning agent must reason about

This fictional investigation continues the enterprise AI adoption example in [the engagement reference](../../enterprise-engagement/references/adoption-proposition.md). The team is exploring an agent that develops and maintains a customer-specific release plan.

## A convincing answer exposes the wrong assignment

The first probe asks AI to summarize readiness for a new analytics feature. It receives these records:

| Record | Relevant content |
| --- | --- |
| Launch brief | Release to the selected enterprise customers next month. |
| Engineering ticket | Implementation complete; automated tests passed. |
| Security assessment | Approved for the managed-cloud deployment with the standard retention setting. |
| Customer list | Contains both managed-cloud and private-deployment customers. |
| Account commitment | One private-deployment customer requires a longer retention period. |

The model returns a polished green status with a note that customer communications remain. The product operations lead rejects it: "It has established that the feature is ready somewhere. I need to know where we can launch it."

A weak response would add a warning to check security documents. The useful discovery is that readiness is a relationship between a capability, a deployment configuration and a customer commitment. Each source can be correct while the combined conclusion is wrong.

Ask the lead to reconstruct their reasoning. They start with the intended customer cohort, identify the conditions that differ, then seek evidence that covers each condition. They do not read every document and average the statuses. The account commitment changes which security evidence is relevant; its significance becomes visible only after following that relationship.

## Change the delegation and observe the result

Give the model the stronger assignment: determine which customers can receive this release, investigate the material gaps, and produce the work required to make the remaining customers eligible. Provide access to the source records and let it choose follow-up searches.

In the revised probe, the agent groups customers by deployment and retention setting. It links the managed-cloud group to the supporting evidence. It searches the security repository for a private-deployment assessment, finds an older assessment for a different feature, and explains why that document does not settle the current question. It prepares a focused assessment request with the relevant architecture and contractual requirement attached.

The finished artifact now helps the team make a decision: proceed with the supported cohort, obtain the missing assessment for the other cohort, or move the combined launch. The agent has done investigation and decision preparation that previously sat with the product operations lead.

A second probe introduces a completed private-deployment assessment after the first plan exists. The agent should re-evaluate the affected customers and revise the pending work, preserving the other conclusions. This tests a different capability from answering correctly once: maintaining the plan as its evidence changes.

## What the investigation changes

The design needs relationships between customers, configurations, requirements and evidence. A longer prompt containing every document would still leave freshness and applicability unresolved. Use stable source references and task state so the agent can investigate the relevant branch and revisit it later.

The team also discovers a change in responsibilities. Customer success can ask the agent to investigate a customer-specific launch question directly, while specialists receive a narrower assessment request with its supporting context. Product operations becomes responsible for the common release picture and unusual conflicts, rather than repeatedly collecting everyone's status.

The next deployment uses a shared readiness brief and the existing work tracker. The agent maintains the brief; a scoped integration can let it create and update the tagged release tasks the team delegates. Launch commitments remain with the people already responsible for them. This division follows the work uncovered during discovery.

This result also changes the success measure. Count whether the plan covers the intended customer groups, whether its evidence supports those groups, whether changed evidence updates the affected conclusions, and whether the receiving team can act on the output. Answer quality and preparation speed still matter, but they are now assessed within a complete assignment.

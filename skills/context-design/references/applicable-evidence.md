# Worked context contrast: the right obligation

Fictional source fragments and expected contrasts, not executed model results or lending guidance. Use this example when an answer appears well sourced but may use the wrong entity, period or document version. The useful output is an applicable packet and an explanation of what the contrast reveals; its format can follow the task.

## The question and the available evidence

An analyst asks: “Prepare the source basis for Northfield Components Ltd, facility F-17, for the quarter ended 30 June. Identify anything I need to resolve before reviewing the certificate.” This is preparation for a person's review, not a request to decide creditworthiness or approve a transaction. The preparation takes place on 25 July; a separate historical evaluation asks what could have been prepared on 15 July.

| Source | Exact relevant fragment | Provenance |
|---|---|---|
| Entity register R3 | “E-41: Northfield Components Ltd; borrower on F-17. E-42: Northfield Holdings Ltd; guarantor on F-17 and borrower on F-29.” | Current authorized entity mapping |
| Executed agreement A1 | “Borrower: Northfield Components Ltd. Facility: F-17. Adjusted Earnings excludes restructuring charges unless expressly permitted by an executed amendment.” | Executed 12 January; repository received 12 January |
| Executed amendment A2 | “For the measurement period ending 30 June only, restructuring charges actually paid by the Borrower may be included in Adjusted Earnings, up to 0.4 million. All other provisions remain unchanged.” | Signed 8 July; expressly effective 30 June; repository received 20 July; links to A1/F-17 |
| Agreement B1 | “Borrower: Northfield Holdings Ltd. Facility: F-29. Restructuring charges up to 1.0 million may be included.” | Executed 10 January; similar title and company name |
| Financial table T1 | “Northfield Components Ltd; quarter ended 30 June; currency: millions. Restructuring expense: 0.6.” Footnote: “Includes accruals; cash paid during the period is not separately reported.” | Submitted 12 July |
| Certificate C1 | “Adjustment claimed: 0.4. Basis: amendment.” | Submitted by borrower 22 July; assertion, not independent payment evidence |
| Payment schedule P1 | Access denied to the current preparation identity | Existence recorded; contents unavailable |

The intended distinction is not whether 0.4 is below a cap. The amendment also requires payment by the identified borrower. Neither the expense table nor the certificate establishes that condition. The inaccessible schedule may resolve it, but its existence does not establish what it says.

## Build the packet around the claim

For preparation on 25 July, include the identity relationship from R3, the base definition from A1, the complete exception and scope from A2, and T1 with its unit, period and footnote. Retain C1 as a claim to examine. Mark P1 as denied, with an appropriate next request to an authorized person. B1 may explain a misleading search hit, but it supplies no definition for this facility.

A supported preparation statement is: “A2 permits a capped adjustment for this period if the charges were actually paid by E-41; the supplied material does not establish the paid amount.” A tempting unsupported statement is: “The 0.4 adjustment is valid because it is within the amendment cap.” Both can cite the same authentic amendment. Citation correctness does not settle the inference.

For the historical 15 July replay, exclude A2 and C1 from candidate inputs: they were not yet available in this workflow. The adjudicator may know them, but the candidate cannot be expected to use them. On that evidence the useful result is a question about whether an executed exception exists. This differs from a current review of the 30 June obligation using subsequently received evidence. Ask which task is intended when that distinction changes the answer; do not choose one time axis silently.

## Contrast before redesigning retrieval

Hold the task, candidate and instruction constant; vary only the supplied material. These are proposed experiments, with expected distinctions to check in actual runs.

| Packet | What it isolates | Behavior to inspect |
|---|---|---|
| Production search returns B1 and C1 | Wrong entity plus missing governing terms | Does the candidate notice that B1 cannot substantiate C1, or confidently endorse the adjustment? |
| Applicable packet above | Selection and representation repaired | Does it identify the payment condition and ask the narrow unresolved question? |
| Same packet, but remove T1's footnote | Loss of table context | Does it now mistake expense for payment? If so, the representation loss is consequential. |
| Same packet, but replace A2's effective period with “30 September only” | Sensitivity to applicability | Does it stop treating A2 as authority for June? |
| Same packet, but remove A2 | Dependence on decisive evidence | Does it seek an executed exception rather than preserve its previous answer? |

If the applicable packet succeeds while production search fails, inspect filtering, linked-document traversal and structure preservation before changing models. If both miss the payment condition, inspect interpretation and task instructions. One result does not locate the cause conclusively: repeat ambiguous contrasts and inspect the output that explains the difference.

## Choose the information path from the result

For a small dossier already linked by facility, retrieving the complete applicable agreement and amendments may be sufficient. A broader portfolio may justify maintained entity and version relationships. A vector index alone cannot supply a missing relationship; a graph is unnecessary if the source application already maintains it reliably.

When an authorized payment extract later arrives, refresh the unresolved payment claim and anything that depends on it. Preserve unrelated identity and period findings. If access is revoked, derived packets need the same audience review as their sources. These are consequences of the evidence dependencies, not a requirement to implement a particular cache or data model.

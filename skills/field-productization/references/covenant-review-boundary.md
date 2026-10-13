# Productize a financial-review method

This constructed example separates a reusable AI workflow from customer-specific financial meaning. Figures and effort estimates illustrate the product decision.

## Similar outputs conceal different work

Two lending teams want an agent to prepare covenant reviews. Both receive financial statements and agreements and produce a calculated ratio with supporting evidence.

In the first agreement, leverage is specified debt divided by trailing-twelve-month adjusted earnings. The supplied terms permit an otherwise eligible restructuring charge up to a cap. Debt is USD 40 million, base earnings USD 8 million, the charge USD 3 million, and the cap USD 1 million. The denominator is USD 9 million and leverage is approximately 4.44 times. Including the full charge would produce 3.64 times and reverse the comparison with a maximum of 4.00 times.

The second facility compares property net operating income with debt service. It requires a different entity scope, period, and definition. Calling both spreadsheet outputs “coverage” does not make their calculation procedures interchangeable.

The agent should perform the substantive work: find the operative documents, identify the relevant definition, assemble the inputs, calculate, and prepare a review with source links. Where the documents leave a material interpretation unresolved, identify that precise question and the evidence already assembled.

## Choose the reusable assets

Package the investigation method as a task skill. It teaches the agent to follow amendments, connect definitions to inputs, check units and periods, and preserve the support for its conclusion. Include examples where a changed definition changes the answer.

Provide a calculation tool that accepts an explicit definition and approved input values. Keep retrieval and case-writing adapters separate where the customers' systems differ. Build evaluation cases around the errors experts care about, including a capped adjustment, a different measurement period, and an amendment that changes the applicable definition.

The customer supplies its agreements, financial inputs, relationships, and authorized interpretations. A field team can reuse the method and independently constructed tests without transferring that customer's document corpus.

A new case engine is justified only if the existing workflow cannot hold the evidence, revisions, and review result the capability needs. Often the reusable contribution is a skill, context contract, calculation function, and small adapter.

## Preserve meaning through an upgrade

Suppose the skill improves its handling of executed amendments. Keep earlier completed reviews attached to the definitions and evidence used at the time. Reevaluate open work affected by the changed document relationship. A cosmetic source change should not force every calculation to be repeated.

Test the upgrade against both agreements. The shared method should produce the appropriate calculation for each; its configuration should not silently substitute consolidated earnings for property income.

## Check whether the next deployment gets easier

Assume the effort is:

| Work | First deployment | Second deployment using the shared adapter |
|---|---:|---:|
| Engineering | 8 days | 3 days |
| Domain interpretation | 10 days | 16 days |
| Validation | 6 days | 6 days |
| Total | 24 days | 25 days |

Adapter reuse saves engineering effort, but the unfamiliar agreements require more domain work. The assumed total rises by one day. The deployments contain different work, so the table does not establish a productivity effect.

The next product investment could improve interpretation examples, context mapping, or a narrower domain procedure. Choose the investment that removes the demonstrated reinvention. More general connector code would not address the effort shown here.

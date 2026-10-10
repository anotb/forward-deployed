# A covenant-review product decision

Use this example to challenge an attractive shared component against meaningful variation. The agreements, figures and effort estimates are constructed illustrations, not customer records or observed economics. In a live assignment, the operative terms and authorized interpretations must come from the supplied evidence and responsible owners.

## Two local solutions look alike

Both deployments gather financial data, calculate a ratio and prepare a reviewer case. In the first supplied agreement, the leverage test divides specified debt by trailing-twelve-month adjusted earnings. Its adjustment rules permit an identified restructuring charge up to a contractual cap. In the second, a property facility compares the property's defined net operating income with debt service over a different period. The spreadsheet in both teams happens to call its result “coverage.”

For the first obligation, suppose the approved values are debt of 40, base earnings of 8, an otherwise eligible charge of 3 and an adjustment cap of 1, all in the same currency units. The denominator is 9 and the ratio is approximately 4.44. Including the full charge would produce approximately 3.64. If the threshold were 4.00, that local interpretation would reverse the result. Similar column labels and familiar ratio arithmetic are therefore weak evidence of a common financial procedure.

The second obligation cannot reuse the first denominator, entity scope or period simply by changing a threshold. Even a correctly implemented generic “adjustments” field could conceal the difference. The arithmetic is reusable; the meaning is not settled by the arithmetic.

## The product choice

Productize preparation of a review case whose conclusions retain their supporting obligation, effective documents, approved inputs and calculation method. Keep the financial interpretation attached to the obligation and its domain procedure. A reviewer should be able to see what supports the result and what remains unresolved without reverse-engineering a prompt.

A small supported behavior could be expressed in prose:

> Given an identified obligation, its applicable document set, approved financial inputs and a supplied calculation definition, prepare the calculation and its evidence for the designated reviewer. If the document set or definition is unresolved, return the specific missing interpretation with the prepared evidence; do not issue a settled compliance conclusion. When a relevant amendment changes the definition, retain the earlier review history and mark the affected current conclusion for reevaluation under the new version.

For the first case, a useful output explains the allowed adjustment of 1, denominator of 9, calculated ratio and comparison with the supplied threshold, with source locators. For the second, the same case-preparation behavior can organize a different calculation and evidence. If it only has consolidated company earnings and no approved property-level income, the useful result is a specific unresolved input, not a substituted ratio.

This is a candidate boundary to investigate, not a universal schema. Inspect whether the customer's case platform already supports evidence, revision and review before building them again. The reusable contribution may be a maintained review procedure plus a small adapter rather than a new case engine.

## What remains local, and what an upgrade owes

Document authority, calculation definitions, permitted adjustments, borrower and property relationships, and the person authorized to resolve ambiguity remain explicit local dependencies. A free-text configuration box called “policy” does not make them understood or supportable. Configuration is useful when its meaning can be checked; an unbounded interpretation problem still needs domain work.

This distinction follows the software-product-line concern with planned, explicit variation that preserves shared properties; see [Bachmann and Clements, Variability in Software Product Lines](https://www.sei.cmu.edu/library/variability-in-software-product-lines/). That engineering method informs the boundary choice. It does not establish that this financial procedure generalizes or that the product will lower deployment costs.

Suppose the shared procedure is upgraded to recognize that an executed amendment can change a previously reviewed definition. Old completed cases should retain the definition and evidence under which they were decided. Open cases with the affected document relationship need reevaluation; unrelated formatting changes do not justify redoing every calculation. The owner must decide which active population is affected and how the receiving workflow presents the changed result. A version bump without that behavior transfers migration work to every deployment team.

## The repetition test

A planning example makes the investment hypothesis visible. Assume the first deployment used 8 engineer-days on a case adapter, 10 domain-expert days interpreting obligations, and 6 days validating examples. For a second deployment, the shared adapter is expected to reduce engineering to 3 days, while unfamiliar obligations require 16 expert days and validation still needs 6. Total effort rises from 24 to 25 days despite adapter reuse. These are assumptions to test, not measured savings; differing job content also limits direct productivity comparison.

The adapter investment may still be worthwhile because it removes repeated integration risk, but it has not established lower total deployment cost. The next useful product work may be better interpretation examples, supported context mapping or a narrower segment, rather than more generic connector machinery. Recommend the boundary that removes demonstrated reinvention and has an owner capable of maintaining it. Preserve the meaningful variation instead of making it disappear into a larger prompt.

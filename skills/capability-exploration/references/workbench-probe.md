# A source change that decides where the service belongs

Read this when a product appears to support the required workflow but the architecture depends on behavior across several operations. This is a fictional workbench and illustrative probe record. The operations and traces below are teaching data, not executed calls or claims about a named platform. Use the customer's available interfaces and authorization for a real investigation.

## The initial arrangement and the decisive question

A team proposes a new portal to interpret specifications and prepare equipment configurations. The initial design includes its own case database, document index and approval workflow. Supplied discovery says the existing engineering workbench already displays cases, approved product revisions and attached option proposals. That suggests an embedded service, but a visible attachment function does not establish that a proposal remains meaningful when its source changes.

The decisive question is whether the workbench can retain a proposed option's source applicability and support coherent continuation. Separate that from whether a model can interpret the specification. Strong document reasoning does not prove the lifecycle; a good lifecycle does not prove technical reasoning.

## A discriminating fixture

Use a case whose requested option is valid under revision R7 but invalid under R8 because an approved temperature limit changes. The fixture explicitly supplies both revisions, their effective dates, the case's applicable revision relation and the expected consequence for the pending option. That known consequence supplies the comparison independently of the model's answer.

For illustration, the candidate extension can read a case, store a draft option and reopen it after interruption. The record below identifies the tested configuration as the sandbox extension, service identity `preparer`, fixed case C17 and packet revision R7. In a real probe, preserve the actual interface version and request/response excerpts that explain the result. An entire logging system is unnecessary for a small decision.

| Point in the illustrative probe | Supplied trace | What it establishes |
| --- | --- | --- |
| Begin preparation | C17 resolves to R7; option P4 records `based_on=R7` | The initial proposal has a source relationship |
| Interrupt preparation | P4 remains a draft and can be reopened | This draft survives this interruption; unattended resumption is not yet established |
| Change applicable source | C17 now resolves to R8; P4 still records R7 | Historical basis is preserved, but freshness must be interpreted |
| Attempt acceptance | Workbench accepts P4 without detecting that R7 is superseded | A successful save does not preserve the intended approval meaning |

This trace would disprove the claim that the workbench alone manages the proposal's applicability. It would not prove the whole product unusable. A supported extension might re-resolve the applicable revision before acceptance and keep an outdated option in review. Whether it can enforce that behavior is the next consequential question. A separate portal does not automatically fix it; it still needs the authoritative revision and acceptance boundary.

Contrast an alternative trace: acceptance returns a source-change conflict, P4 retains its original basis, and reopening shows both R7 and applicable R8. That behavior would support keeping proposal state in the workbench and using the extension to explain or regenerate the affected option. A case database elsewhere may then add duplication without solving a missing responsibility.

## Follow the seam that remains

Revision comparison before save can still race with a source update between comparison and acceptance. If that matters to the workflow, inspect whether the authoritative acceptance operation binds to the revision being accepted, for example through a supported version condition. A local warning in the user interface cannot establish this behavior for a background caller.

Permission is a separate seam. A signed-in engineer seeing R8 does not prove the background service can retrieve it, or should retain access after a revocation. Probe the identity used by the proposed flow. If the source denies access but the worker still uses cached content, determine the cache's authorization semantics before treating the run as valid. Do not confuse an access failure with a model's inability to interpret the specification.

A `202/pending` acknowledgment from an option write, if the chosen interface uses that pattern, is also not proof that the business record changed. Follow its documented completion mechanism and read the authoritative option state. The architecture changes if the runtime must own a pending task, reconciliation or operator-visible recovery that the workbench does not provide.

These are relevant follow-ups when the observed behavior makes them consequential. They are not a requirement to run every possible failure in every exploration.

## Keep different claims separate

A local mock can demonstrate that the proposed application handles the supplied R7-to-R8 change, interruption and pending result. It cannot establish that a licensed product exposes those operations, that the customer's account is entitled to them, or that production configuration matches a sandbox. Current primary documentation and the available account surface settle different parts of that claim. State which was actually inspected or exercised.

When comparing two interpretation or context-assembly approaches, use the same case packets and hold the other consequential settings steady. Otherwise a better model, richer packet and altered retrieval path become one inseparable treatment. The [NIST discussion of randomized block designs](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm) explains comparison within blocks when nuisance variation matters. For this work, cases can supply useful blocks; repeated stochastic runs on one case do not create independent cases or establish population quality.

The useful output is a design consequence supported by the probe: which system owns case facts, proposal state and pending work; which behavior the extension must add; and the unverified seam that could change the recommendation. Preserve enough trace to inspect that reasoning. Do not turn a successful fixture into a claim that the live solution is production-ready.

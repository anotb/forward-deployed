# A constrained quote-service handoff

Use this example when an agreed outcome depends on stale sources, limited write authority, or a receiving team's estimate. Everything below is an illustrative scenario and proposed handoff, not an observed deployment or a prescribed architecture.

## The material supplied

A manufacturer wants service engineers to prepare a repair quote during a customer call. For one equipment family, a prototype can identify compatible replacement parts from serial number and service history. Commercial prices and availability arrive in a nightly file. The customer has an established live check that a sales operator performs before releasing any quote.

The case system accepts a draft with a caller-generated reference. Its documented behavior is unusually helpful: it enforces uniqueness of that reference and permits lookup by it, so a lost response need not cause another draft. Only the sales operator can release the quote. The available prototype instead stores its answers in a personal session. The source team cannot deliver a supported live feed before the requested launch date.

The tempting shortcut is to label nightly prices “indicative,” add a disclaimer, and call the pilot ready. That leaves unanswered which action the user may take, where unfinished work lives and how a changed repair choice reaches sales.

## A brief the receiving engineer can challenge

> Deliver quote preparation for the supported equipment family. The engineer should receive a repair option with its compatibility reasoning, candidate parts and a dated commercial estimate, then hand it to sales in the existing case. Sales performs the established live commercial check and releases the quote. The service does not promise live availability or commit stock.
>
> Preserve the serial number, source dates, chosen option and reasoning in the draft case so a different operator can resume it. Store the selected option's revision with the sales check. If the repair option or quantity changes after that check, the old check no longer supports release; route the changed option through sales again. A cosmetic description correction need not repeat an unchanged commercial decision.
>
> Use the case system's supported draft operation. Persist the caller reference before requesting the draft. If the response is lost, look up that reference; reuse the returned draft or retry under the same reference according to the interface contract. Do not create a second reference merely because the response was absent. Do not widen the service's access to release quotes.
>
> First show an engineer selecting a compatible option, sales finding that stock has changed, and the case reaching a revised option that sales can release. Also show a lost draft acknowledgment and a different operator resuming the case. Inspect the resulting case state, not only successful API responses. These are the consequential examples for this service; the implementer should identify a simpler route if the existing case workflow already carries them.

This brief settles the operating promise and required behavior while leaving implementation choices open. An engineer can still choose how to persist a reference or detect meaningful revision; they cannot silently treat a dated estimate as a current commitment. The draft API behavior is a fact supplied for this example, not something to assume about another customer's system.

## An implementation response changes the forecast

Suppose the receiving engineer discovers that the case system can store the chosen option but cannot stop sales from releasing a revised option under an old check. The missing capability is consequential; “draft integration complete” is misleading progress.

One route is a supported extension that binds the release action to the checked revision. Another is assisted use inside the existing sales workflow, where sales owns the final option and commercial check together. The second may fit the requested date, but only if its workload and operating responsibility are acceptable. The delivery lead brings that concrete choice to the customer; an engineer's preference cannot decide who takes on the extra work.

The revised commitment could be: “Launch assisted preparation for this equipment family using the existing sales release process. The live feed is outside this release. Confirm the sales capacity and demonstrate changed-option handling before promising the date.” This names the remaining decision without turning an unexecuted demonstration into evidence. If those conditions are already established, state the supported release plainly rather than keep it indefinitely provisional.

The handoff is useful because it changes what can be built and promised. A longer backlog, a new workflow service or a universal release checklist would not by itself resolve this seam.

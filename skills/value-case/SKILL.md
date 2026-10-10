---
name: value-case
description: Build and test the economic case for an enterprise AI capability, investment, or expansion. Use for new services, decision quality, expert capacity, operating economics, and value realization when the architecture and changed work determine the return.
---

# Value Case

Make a recommendation about an investment by explaining how the proposed capability creates value, what it costs to deliver an accepted outcome, and which uncertainty could change the decision. Build the calculation when the task calls for one. A list of possible benefits or a request for more inputs does not finish the work.

Begin with the choice the user faces: whether to investigate, fund a first deployment, redesign an expensive service, renew a commitment, or expand. Use the relevant planning horizon and the counterfactual the organization would actually choose. Continuing the current process, hiring specialists, reducing coverage, buying an existing service, and abandoning an opportunity can imply very different economics.

## Find the value the current operation cannot produce

Follow the capability to a customer or operating result. Separate the work that becomes cheaper from the work that becomes possible. Enterprises ration analysis, advice, exception investigation, service coverage, and personalization because expertise is scarce. Lowering the cost of competent judgment may justify changing the service, its frequency, or the customers it can economically serve.

Develop the mechanism before estimating its size:

- **New service or wider coverage:** identify a population with a job that remains undone, the outcome it would receive, and the constraint that prevents current provision. Distinguish demand from eligibility. An installed customer base is not proof that customers will buy a new service or supply the information it needs.
- **Revenue or contribution:** connect better work to a commercial event, such as a won order, retained contract, paid tier, or usable production capacity. Include conversion, time to revenue, cannibalization, fulfillment, and continuing service obligations. Use incremental contribution after relevant variable costs, rather than treating gross revenue as benefit.
- **Decision quality:** explain which changed decision changes an outcome. Better analysis may reduce inappropriate interventions, improve pricing, identify a repair that avoids replacement, or find a promising opportunity previously missed. Faster or more persuasive recommendations have little value if the authorized decision and its consequences do not change.
- **Expert capacity:** locate the scarce expertise and the work it will do with released time. Distinguish fewer touches, shorter touches, and better prepared touches. A specialist who can review more prepared cases can extend a service even when total organizational labor barely changes.
- **Service performance:** connect timeliness, reliability, or continuity to something the enterprise values. Resolving a case before a production stop or preparing a quote while the customer is still buying can matter more than average handling time.

Choose the mechanisms that fit the engagement and build their causal links. Where monetary conversion is weak, retain the operating measure and show the investment needed to improve it. Do not invent a price for every improvement merely to create one ROI figure.

For a service the organization has never offered, construct a feasible service proposition: who receives what, who pays or benefits, the conditions of delivery, and the resources needed to fulfill it. Test willingness to adopt or pay with behavior appropriate to the engagement, such as use of a working service, a scoped commercial proposal, or comparison with current alternatives. A compelling demonstration alone establishes neither demand nor margin.

## Model an accepted unit of valuable work

Choose a unit that survives the journey from demand to outcome: a diagnosis with an accepted action, an engineered quote released, a completed borrower review, or a monitoring episode resolved. Requests, model calls, generated pages, and tool invocations are useful cost drivers inside that unit. They rarely define its value.

Keep the meaning of acceptance and its observation window consistent across alternatives. A draft accepted by the model, a case completed by an operator and a case completed before its decision window are different outcomes. [The service-economics example](references/service-economics.md) follows one population through late completion, scarce review capacity and period cash flows, showing why attractive unit cost can still fail the investment case.

Model materially different case classes separately when their difficulty, economics, or review needs differ. Averages across simple lookups and complex investigations can conceal which segment creates the margin and which consumes expert attention. Preserve open and abandoned work in the population so that an apparently cheap unit is not just the successful tail of an expensive process.

Represent the paths a case can take. For mutually exclusive paths whose probabilities sum to one:

```text
expected delivery cost per entered case = Σ probability(path) × full cost(path)
expected accepted outcomes per entered case = Σ probability(path) × accepted outcomes(path)
delivery cost per accepted outcome = total delivery cost / accepted outcomes
```

Include unsuccessful attempts, retries, review, corrections, fallback, and downstream reconciliation in full path cost. A failed attempt followed by manual completion incurs both costs. Model repeated loops directly or use their measured total; do not apply a success rate and then count the same failures again as a separate discount. Costs can arrive before the benefit, and unresolved cases can continue consuming capacity after the observation period.

Link system cost to behavior. Long investigations can repeat retrieval, interpretation, tool use, and synthesis. A change-driven process may reuse unchanged work but incur invalidation and refresh costs. A cheaper component can raise total cost if it causes more expert review, longer investigations, or fewer accepted outcomes. Compare complete paths on the task that matters, using current commercial terms and observed consumption when available.

## Put queues and scarce people into the economics

Inspect where work waits and which resources serve it. Distinguish arrival volume, human handling time, machine processing time, elapsed cycle time, and productive staffing capacity. An improvement before the binding constraint can increase backlog without increasing completed work.

For each constrained review or recovery pool, estimate incoming work by case class and its service demand. Compare that demand with available productive time after existing obligations. Examine bursts and variability as well as averages: investigation and recovery often have a long tail, deadlines synchronize arrivals, and the same failure can affect many cases at once. Queues become increasingly fragile as utilization approaches full capacity. Do not promise a service level from an average-cost model; use observed arrival and handling distributions or a simple queue simulation when the decision depends on delay.

Consider this illustrative case. Of 1,000 weekly cases, 60% finish without human handling, 30% need six minutes of review, and 10% need an eighteen-minute fallback. The new process needs 60 human hours: 30 for review and 30 for fallback. Against a twelve-minute manual baseline, it appears to release 140 hours. But if the new work requires specialists with only 50 hours available, the proposed volume is infeasible even before allowing for peaks. The useful design choice may be to improve the fallback path, let qualified generalists handle a defined subset, change the admitted volume, or fund specialist capacity. Discounting the headline saving does not resolve the operating constraint.

Also test induced demand. Continuous monitoring can create more findings than the enterprise can investigate. Broader quote coverage can create engineering work and downstream orders. Derive sensible admission, prioritization, or service-tier choices from customer value and resource scarcity. Suppressing difficult cases to improve an automation rate is not an economic improvement unless the service intentionally excludes them.

## Connect architecture to the cost curve

Build costs at the level where they change a decision. Separate one-time investment, fixed recurring operation, usage-linked cost, human service demand, and step changes such as another support shift or deployment environment. Include integration, domain procedure development, evaluation, operator transition, incident handling, upgrades, and retirement of temporary components where material.

Compare the first deployment with the next one. Reusable entity resolution, case integration, domain procedures, and evaluation examples can lower subsequent delivery costs. New access boundaries, local policies, document types, contractual terms, and operating teams can raise them. Model expansion as a set of changes to the existing capability, rather than multiplying the first customer's business case or assuming all later deployments are configuration.

A shared service trades repeated build cost for a larger support obligation and a wider failure boundary. A dedicated deployment may cost more per customer while fitting isolation, customization, or operating requirements better. Use expected volume and variation to judge this choice. A nominally cheap universal platform can be expensive when every customer needs exceptions; a small custom solution can be expensive when every upgrade must be repeated by hand.

For internal investment, compare incremental cash flows with and without the choice. For a provider or partner offering, also examine delivery margin, recurring service margin, specialist utilization, customer onboarding effort, support exposure, and the price needed to sustain the promised service. A profitable pilot fee can conceal a loss-making ongoing obligation.

## Reconcile benefits without spending the same capacity twice

Released time can support more throughput, shorter queues, less overtime, reduced external spend, or a staffing change. Assign a credible use to the capacity. Fragmented minutes, a seasonal peak, and a full reassigned role have different realization mechanisms.

Do not add a labor-equivalent valuation to the revenue earned by using those same hours. Do not count avoided hiring and reduced staffing for the same work. Do not add the full benefit of an enabling service to every workflow that uses it. Where stakeholders need both a capacity view and a cash view, show them as different interpretations with a clear bridge.

Use period cash flows when ramp, implementation cost, benefits lag, or useful life affect the decision. State the discount or hurdle assumptions used for NPV, and distinguish positive contribution per outcome from recovery of the initial investment. For loss reduction, examine exposure, probability, severity, residual consequences, and correlated failures; a rough expected value does not make an unacceptable risk tolerable.

## Fund the next decision, then learn from operation

Vary the assumptions that could reverse the recommendation. Couple assumptions that move together: more complex cases may raise service value, review demand, and computation; wider coverage may reduce average conversion; faster response may increase demand. A table in which every favorable assumption changes independently can create an impossible upside case.

Find useful thresholds: the adoption needed to justify fixed cost, the accepted volume needed for payback, the review burden compatible with staffing, or the onboarding effort compatible with margin. Prefer these to a single precise return built on uncertain inputs.

Stage commitments around what the next expenditure can resolve. A short test may establish whether the reasoning changes a decision; a limited operating deployment may reveal the review queue and demand; a second segment may establish repeatability. Explain which investment can be reused if the hypothesis fails, and which creates continuing obligations. The cheapest test is not always the best test if it avoids the uncertainty that determines the investment.

Before a larger implementation commitment, reconcile the proposed first scope to the benefit pool it can actually affect. Volume must belong to the population served by the funded users, access and operating coverage. A team license does not establish enterprise-wide reach; expanding the benefit pool can also change licensing, support and review costs. Technical feasibility and an affordable build do not establish an attractive investment. If the scoped opportunity cannot plausibly carry its costs, change the scope or investment, or make a separately justified learning commitment. Do not borrow benefits from an eventual enterprise-wide deployment to justify a narrow release without explaining the path between them.

When reviewing realized value, reconcile the forecast to comparable observed work: case mix, demand, participation, accepted outcomes, service burden, total cost, and the actual use of capacity. Choose a comparison that fits the operation, such as staggered introduction or a contemporaneous comparison group; account for selection, spillover, and other changes. Use the result to identify whether the remedy is demand development, workflow redesign, better behavior, different architecture, narrower coverage, or more investment.

Deliver the argument in the form the decision needs. An editable model with a few explanatory exhibits may support funding; a service-level and margin comparison may settle an architecture choice; a concise operating review may justify expansion. The recipient should see the recommended commitment, the mechanism of value, the assumptions that matter, and what would cause the recommendation to change.

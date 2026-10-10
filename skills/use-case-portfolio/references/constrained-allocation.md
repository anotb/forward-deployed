# A constrained investment choice

Use this example when attractive opportunities compete for the same people or integration. All figures and business facts are illustrative supplied inputs. They show a decision method, not estimates to reuse elsewhere.

## The choice

An insurer has a quarterly deployment budget of $180,000, twelve available integration-engineer weeks and twenty specialist hours per week available after existing obligations. A renewal campaign begins next quarter. The source team can deliver one common customer/case interface, assuming both workflows can use its identity and access semantics.

The estimates below cover the proposed first scope. Build cost includes the engineering expenditure; engineer weeks are a capacity constraint, not another charge to add to cost. Annual benefit means incremental operating benefit after each workflow's own recurring costs, before the shared interface's $20,000 annual operation. These are ranges from the fictional planning material, not demonstrated returns.

| Candidate | Build cost excluding shared interface | Engineer weeks | Additional specialist hours/week | First-scope annual benefit and basis |
| --- | ---: | ---: | ---: | --- |
| Renewal preparation | $60,000 | 4 | 2 | $90,000–$140,000; avoidable external preparation and capacity use, with the campaign deadline fixed |
| Claims triage | $100,000 | 6 | 22 | $160,000–$300,000; projected effects, with exception handling still untested |
| Evidence reconciliation | $45,000 | 3 | 4 | $30,000–$50,000; avoidable cleanup work supported by the supplied invoices |
| Shared customer/case interface | $40,000 | 4 | 0 | Enables the three workflows; no independent benefit claimed |

A bounded claims experiment costs $15,000, one engineer week and three specialist hours per week for four weeks. It uses representative exported records and therefore does not require the production interface. It tests whether exceptions can be resolved with substantially less review demand. Its output is information for the claims investment, not the projected claims operating benefit.

## Which combinations survive the constraints?

Renewal alone with the interface costs $100,000, uses eight engineer weeks and adds two specialist hours per week. Evidence reconciliation alone costs $85,000 and seven weeks. Buying both separately would count the interface twice; their joint commitment is $145,000, eleven weeks and six specialist hours per week.

Claims triage with the interface costs $140,000 and ten weeks. It fits the delivery budget but needs twenty-two specialist hours against twenty available. Its larger projected benefit does not make the proposed operation feasible. Claims plus renewal also exceeds the engineer capacity: $200,000 and fourteen weeks, before resolving the twenty-four hours of ongoing specialist demand. A preference score must not turn those constraints into small deductions.

The proposed quarter is renewal plus evidence reconciliation plus the bounded claims experiment. It commits $160,000, twelve engineer weeks and at most nine additional specialist hours per week when the experiment and both operating workflows overlap. The interface is funded once. The claims deployment and its projected benefits remain excluded.

That choice leaves $20,000 uncommitted but no spare engineer weeks. Extra money does not create another feasible build. It is also a tight delivery plan: no engineer contingency remains. A slip is handled by deferring evidence reconciliation, preserving the deadline and the experiment rather than silently promising overtime.

## A possible schedule and the economic limit

The shared interface occupies weeks 1–4; renewal occupies weeks 5–8; reconciliation occupies weeks 9–11; the experiment's engineer work occupies week 12. Specialists can investigate the exported claims records during weeks 9–12. The illustrative schedule assumes the work can occur sequentially and the experiment's engineering is needed at the end; confirm those dependencies before treating it as a commitment. A required earlier engineering intervention would change the schedule.

The deployed bundle's annual benefit is $120,000–$190,000 before shared operation, or $100,000–$170,000 after it. This is a steady operating-year range, not first-year cash: campaign timing, ramp and the $160,000 initial commitment still matter. The portfolio choice is defensible relative to the supplied deadline and capacity, but this arithmetic does not independently establish acceptable payback. Use a value case if that determines funding.

## What changes the choice?

If the campaign moves and the claims experiment supports a useful exception path below the twenty-hour ceiling, reconsider claims against the other commitments with updated economics. If the shared identity semantics differ materially between renewal and reconciliation, recost the additional interface behavior; a shared label is not evidence of shared implementation.

If reconciliation's cleanup fees cannot be canceled or its supposed released capacity has no valuable use, its $45,000 commitment may lose to leaving capacity available. Do not keep it merely to fill the budget. If claims generates more exceptions as coverage expands, its review demand may invalidate the attractive small experiment; test the intended case mix before adopting the lower estimate.

This reasoning is consistent with the [Green Book's options-appraisal discussion](https://www.gov.uk/government/publications/the-green-book--2/the-green-book-2026): materially different options and substantive constraints precede detailed appraisal. Its UK public-sector rates, prescribed processes and social-benefit conventions do not govern this fictional private-enterprise choice.

# A paid investigation service

A market-intelligence firm is considering a recurring AI-assisted service for product teams that cannot buy its full consulting engagements. The service investigates customer-specific commercial questions, builds reproducible analyses, and updates the customer's planning workspace as evidence changes. This is a fictional planning model; every price, workload, and performance rate below is an assumption to test.

The proposed price is $1,200 per customer per month for up to eight eligible investigations. An accepted investigation answers the agreed question with supporting evidence and a usable analysis or decision brief. The target is acceptance within five working days. The model assumes eventual completion by day fourteen.

Compare launching the service with continuing the existing consulting business. The base case assumes no displaced consulting revenue. If existing customers switch to the cheaper offer, include the lost contribution in the comparison.

## Cost the whole investigation

The planning case uses these mutually exclusive paths:

| Path | Share of entered cases | Purchased expert minutes | Accepted by day 5? |
| --- | ---: | ---: | --- |
| Delegated investigation accepted without expert handling | 60% | 0 | Yes |
| Expert review and refinement | 25% | 12 | Yes |
| Manual completion after failed assistance | 10% | 45 | Yes |
| Additional research, completed by day 14 | 5% | 15 initially + 45 later | No |

Machine and tool consumption is $4 per entered case, including retries and failed attempts. Productive expert time costs $80 per hour and is purchased as used. The service has access to 120 productive expert hours per month after other commitments.

```text
expert time per entered case
  = (0.25×12 + 0.10×45 + 0.05×60) / 60
  = 0.175 hours

full investigation cost per entered case
  = $4 + 0.175×$80
  = $18
```

At forty customers using all eight investigations, 320 cases enter each month. Of those, 304 finish within five days and sixteen finish later. Full investigation cost is $5,760. That is $18 per eventual accepted investigation, or $18.95 per timely accepted investigation when all completion costs are charged against timely output. The latter is a service-level cost view; it is not the cost of only the timely cases.

If cases remain unresolved beyond the modeled horizon, retain their accrued and expected remaining cost and change the accepted-outcome denominator. Do not drop them from the population.

## Price the continuing service

Each customer also requires one purchased expert hour per month for planning and service support, plus $26 of customer-specific infrastructure. At full use of the allowance:

```text
variable cost per customer = 8×$18 + $80 + $26 = $250/month
contribution per customer  = $1,200 − $250 = $950/month
expert demand per customer = 8×0.175 + 1 = 2.4 hours/month
```

Forty customers require ninety-six expert hours, leaving twenty-four of the available 120. The arithmetic ceiling is fifty customers. Use observed demand and handling variability to set an operating limit that leaves enough capacity for the promised response time.

Fixed operation is $12,000 per month, including common data licensing, engineering maintenance, sales, onboarding, and service management. The fixed team handles onboarding; the purchased expert pool handles investigation and ongoing customer planning. At forty customers, monthly revenue is $48,000, contribution is $38,000, and operating surplus after fixed cost is $26,000. Recurring operating break-even is thirteen customers: `$12,000 / $950 = 12.63`.

These margins depend on customers buying and retaining the service at the stated price. A paid first cohort can test willingness to buy, recurring use, investigation quality, and the support burden together.

## Recover the investment with the actual ramp

Assume a $150,000 initial build, ten paid customers in month one, twenty in month two, thirty in month three, and forty in months four through twelve. Customers remain active through the year; the model has no churn or price changes. Fixed costs start in month one.

| Period | Customer-months | Contribution before fixed cost | Fixed operation | Operating cash |
| --- | ---: | ---: | ---: | ---: |
| Month 1 | 10 | $9,500 | $12,000 | −$2,500 |
| Month 2 | 20 | $19,000 | $12,000 | $7,000 |
| Month 3 | 30 | $28,500 | $12,000 | $16,500 |
| Months 4–12 | 360 | $342,000 | $108,000 | $234,000 |
| Year 1 | 420 | $399,000 | $144,000 | $255,000 |

After the build, undiscounted first-year incremental cash is **$105,000**. Cumulative operating cash recovers the build in month eight under this ramp. This calculation assumes invoices are collected and costs paid in the modeled month; payment timing belongs in the cash model if terms differ.

The volume needed to recover the build in twelve months at steady operation is `($12,000 + $150,000/12) / $950 ≈ 25.79`, or twenty-six customers. The ramp requires more later volume because the first months are smaller. For an NPV decision, add the useful life and discount assumptions.

## Test the assumptions that change the decision

Suppose more customers ask harder questions. The path shares become 50% delegated completion, 25% expert refinement, 15% manual completion, and 10% additional research. Keep path times and machine cost unchanged to isolate the case-mix effect.

Expert demand rises to 0.2625 hours per investigation and 3.1 hours per customer-month. Forty customers now require 124 expert hours against 120 available. Variable customer cost rises to $306 and contribution falls to $894. At thirty-six customers, demand is 111.6 hours and monthly operating surplus is $20,184. Rebuild the ramp around that operating choice rather than retaining forty customers and applying a generic margin discount.

Demand can defeat the investment even when delivery remains profitable. If the base-case service reaches only twenty customers after month one, the year contains 230 customer-months. Operating cash is `230×$950 − $144,000 = $74,500`; after the build, first-year cash is **−$75,500**. The mature service earns $7,000 per month but does not recover its build within the year.

The next commitment should test paid recurring demand and expert effort on the same delivered service. Fund a cohort large enough to expose both, with a build whose reusable work is explicit. Use its results to choose the price, included workload, delivery capacity, and investment scale.

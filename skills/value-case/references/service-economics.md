# Accepted work, scarce capacity and the cash decision

Use this worked example when a promising unit-cost result must survive outcome definitions, human capacity and investment recovery. All workload rates, prices and timing below are fictional planning assumptions. They are not measured model performance or market prices. The formulas are sufficient to recreate the model in a spreadsheet or notebook; the example does not prescribe a deliverable format.

## Define what is being bought

A service business outsources document-backed equipment assessments at $12 per entered case. The supplied baseline assumption is that every case is completed within fourteen days. Management is considering an assisted service for the same case population. An accepted assessment meets the receiving service's evidence and disposition standard; some case classes may meet it without human handling. Generating a draft is not acceptance. Five-day completion is a separate timeliness measure.

The proposed process has these mutually exclusive paths. Costs include the whole case through completion, even when some work falls outside the five-day observation window.

| Path | Share of entered cases | Human minutes per case | Accepted by day 5? | Accepted by day 14? |
| --- | ---: | ---: | --- | --- |
| Straight-through accepted assessment | 60% | 0 | Yes | Yes |
| Specialist review | 25% | 6 | Yes | Yes |
| Manual fallback after failed assistance | 10% | 18 | Yes | Yes |
| Unresolved at day 5, then manual completion | 5% | 12 initial + 24 later | No | Yes |

Assume $1 of total machine/tool consumption per entered case, already including unsuccessful attempts and retries. Specialists are purchased at $60/hour with a maximum of eighty productive hours per month available to this service. Their cost is incremental cash in this example. An existing salaried team's released time would require a different cash-realization argument.

For 1,000 entered cases, the paths contain 600 + 250 + 100 + 50 = 1,000 cases. Human work is `(250×6 + 100×18 + 50×36) / 60 = 85 hours`. There are 950 accepted outcomes by day 5 and 1,000 by day 14. Full delivery cost is `$1,000 + 85×$60 = $6,100`.

That is $6.10 per fourteen-day accepted assessment. Dividing the same full cost by the 950 timely outcomes gives about $6.42 per five-day accepted assessment; this view charges all late-work cost against timely service. It is not the same metric. Dividing by 1,000 drafts would conceal both the acceptance definition and the unresolved population. If the final fifty cases remain unresolved at day 14, revise the denominator, outstanding-work cost and service claim instead of assuming eventual success.

## The capacity constraint changes the admitted volume

The proposed 1,000-case monthly volume requires eighty-five specialist hours against eighty available. The average-load ceiling is `80 / 0.085 ≈ 941 cases/month`. It is not a service-level guarantee: arrivals and fallback duration vary, and work can cross reporting periods.

For the investment calculation, use 900 entered cases per month: 855 finish by day 5; 45 complete later; specialist demand is 76.5 hours. The remaining 3.5 hours is narrow headroom. This model establishes an average capacity fit only. If deadlines or bursts matter, observed distributions or an appropriate queue model may require lower admission or more available capacity. The cash case should be revised with that operating choice.

## Cheap completed work does not recover every build

Assume a $60,000 initial build, $2,500 monthly fixed operation, no price changes and a twelve-month planning horizon. The external service can be reduced case by case without a minimum commitment. Compare only cases transferred to the proposed service; any remaining outsourced population has equal cost in both alternatives and cancels out.

The variable saving is `$12 − $6.10 = $5.90` per entered case with a fourteen-day accepted outcome. At 900 cases, baseline spend is $10,800/month. The proposed service costs `$900×$6.10 + $2,500 = $7,990`, leaving $2,810 monthly incremental cash benefit before build recovery.

Suppose adoption ramps to 300 cases in month 1, 600 in month 2 and 900 in months 3–12, with the same case mix. Fixed operation starts in month 1:

| Period | Entered cases | Variable saving | Fixed operation | Incremental operating cash |
| --- | ---: | ---: | ---: | ---: |
| Month 1 | 300 | $1,770 | $2,500 | −$730 |
| Month 2 | 600 | $3,540 | $2,500 | $1,040 |
| Months 3–12, combined | 9,000 | $53,100 | $25,000 | $28,100 |
| Twelve months | 9,900 | $58,410 | $30,000 | $28,410 |

After the $60,000 build, twelve-month undiscounted incremental cash is **−$31,590**. This is a cash comparison, not NPV; a longer horizon would need an explicit useful life, continuing costs and the organization's discount assumptions. No credit is assigned to five-day completion because its commercial value has not been established, and the outsourced baseline's five-day rate is unknown.

Operating break-even is `$2,500 / $5.90 ≈ 424 cases/month`. Recovering the build within twelve months at steady volume would require `($2,500 + $60,000/12) / $5.90 ≈ 1,271 cases/month`, already above the average capacity ceiling, even before ramp. “Scale it to pay for the build” is not a feasible answer without redesigning the human path or changing capacity and costs.

## Couple the downside to the work

Suppose harder cases become more common: straight-through falls to 50%, review stays at 25%, fallback rises to 15% and late completion to 10%. Keep the same path times and $1 machine cost to isolate that case-mix change. Human demand becomes `(0.25×6 + 0.15×18 + 0.10×36)/60 = 0.13 hours/case`; the eighty-hour pool now supports about 615 cases/month on averages. Variable cost rises to `$1 + 0.13×$60 = $8.80`, while timely acceptance falls to 90%.

Even at the average capacity ceiling, variable savings are only about `615.38×($12−$8.80) = $1,969/month`, below $2,500 fixed operation. The downside changes admission, acceptance and economics together. It cannot be represented faithfully by reducing a headline savings percentage while keeping volume and service quality unchanged.

Under these assumptions, do not recommend the full build on twelve-month financial return. A smaller, separately priced learning commitment could investigate the late and fallback paths or establish a valuable timeliness effect. It still needs its own useful question and cost. The favorable $6.10 unit cost alone does not justify borrowing benefits from a larger future service.

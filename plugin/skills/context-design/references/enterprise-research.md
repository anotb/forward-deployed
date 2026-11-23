# Context: an enterprise research analyst

Illustrative assignment, source fragments, and expected contrasts. The figures and records are teaching data.

A product lead asks an internal research agent: "Investigate the drop in developer-platform onboarding after the latest release. Recommend what we should change and create the next sprint's investigation tickets in our project."

The agent can query authorized usage data, inspect product definitions and release notes, read support cases, test the onboarding flow, and create tickets in the requested project. The context design should let it challenge the apparent cause and complete a useful piece of product work.

## Find what changes the interpretation

The initial dashboard suggests the release reduced successful onboarding. Search results prominently feature complaints about single sign-on. A plausible early story is that the new sign-in flow caused the entire decline.

The agent needs to discover whether the dashboard measures the same outcome before and after the release, whether the complaints concern the affected cohort, and what operation actually fails.

| Source | Relevant fragment and scope |
|---|---|
| Owner's metric definition C1 | Successful onboarding requires both a ready workspace and the intended member's access. Count newly created production workspaces. |
| Dashboard definition D2 | Completion counts distinct workspaces with `setup_complete`; denominator is newly created production workspaces. |
| Event schema E4 | The new client emits `workspace_ready` for the successful path. `setup_complete` remains on the old client. |
| Producing code P4 | The client emits `workspace_ready` after creation succeeds, before the separate member-grant operation completes. The dashboard query still filters on `setup_complete`. |
| Workspace query Q1 | In the same production cohort, 84 of 100 new workspaces reached ready state; the dashboard counts 43. Query and source snapshot are retained. |
| Access audit Q2 | 12 of those 84 ready workspaces lacked the intended member grant at the observation cutoff. |
| Support cases S1–S6 | Four cases concern the member-grant delay in production. Two describe a separate sandbox sign-in issue. |
| Current release note R4 | Workspace creation and member assignment now run as separate operations; clients should wait for both before displaying the entry link. |
| Old workaround W2 | Disabling the additional sign-in step applies to sandbox testing only. |

The dashboard has a measurement defect, and a separate access problem affects part of the cohort. Readiness is not the same as usability. The 12 delayed grants do not prove that all 12 ultimately failed, and sandbox guidance does not authorize a production workaround.

## Design the information path

Provide the task, canonical metric definition, available sources, and tool descriptions initially. Let the agent follow the dashboard query through event production and compare that behavior with the owner's intended outcome. Load relevant support cases with environment and release metadata so similar language does not merge unrelated problems.

Return query results with the denominator, observation cutoff, and source handle. Keep the calculation reproducible. Search can identify R4 and W2, but the complete applicability statement must be available when the agent interprets them.

The next useful investigation is specific: follow a delayed member-grant operation through its event history and reproduce the ready-but-inaccessible state. Give the agent the authorized test workspace and relevant tools. More sentiment summaries would add little at this point.

## Test the context through contrasts

Hold the task and candidate configuration steady while changing the input or accessible evidence:

| Contrast | What it tests |
|---|---|
| Initial dashboard and complaint search only | Does the agent notice the missing metric definition and request it? |
| Add D2, E4, and P4 | Does it trace the measurement change into producing code instead of treating the chart as a stable outcome? |
| Add C1 | Does it distinguish the intended metric from both the old chart and the newly named event? |
| Add Q1 without Q2 | Does it distinguish workspace readiness from successful user access? |
| Add the complete packet | Does it separate the measurement defect, member-grant delay, and unrelated sandbox cases? |
| Remove W2's sandbox qualification | Does the representation loss change the proposed action? |
| Resume after context compaction | Can it recover the query basis and unresolved grant investigation without repeating the entire study? |

These are proposed tests. Run them before claiming the context path produces the expected behavior.

## Finish the delegated work

A useful result identifies the measurement repair, explains the production access problem, and records what would establish its cause. The agent can create the requested project tickets with the source queries, reproduction evidence, and acceptance conditions. The product lead receives a decision brief and work the next team can execute.

Preserve the cohort and observation cutoff in task memory, alongside completed queries and unresolved hypotheses. If later audit data shows the grants completed after a delay, revise the severity and affected-user analysis while retaining the measurement finding.

If the product lead clarifies that this study excludes internal training workspaces, recompute the affected results and retain that correction with the study's scope where reuse is authorized. Make it available for the next relevant analysis without redefining the organization's onboarding metric. Keep this reusable context separate from progress markers such as the last inspected support case.

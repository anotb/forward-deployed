# Working with Forward Deployed

Bring an enterprise AI assignment, the context you have and the result you need. The skills help the agent develop the opportunity, explore technical options, design the changed work and carry it into delivery and adoption.

## Choose the work

Invoke a skill by name or describe the assignment. Use get-started when the work spans several skills.

| Skill | Example assignment |
| --- | --- |
| [get-started](../skills/get-started/SKILL.md) | "Here are our interviews and current AI proposal. Develop the next version and recommend what to do." |
| [enterprise-engagement](../skills/enterprise-engagement/SKILL.md) | "Prepare a customer conversation about moving from AI licenses to a different way of running product releases." |
| [discovery](../skills/discovery/SKILL.md) | "Study these release decisions and interviews. Find the work an AI agent could take on and the context it would need." |
| [meeting-synthesis](../skills/meeting-synthesis/SKILL.md) | "Reconcile today's interview with the AI design. Update the affected decisions and engineering work." |
| [opportunity-design](../skills/opportunity-design/SKILL.md) | "Our researchers can study only a fraction of customer feedback. Develop a more valuable research service." |
| [use-case-portfolio](../skills/use-case-portfolio/SKILL.md) | "Choose this quarter's AI investments across workforce tools, shared capabilities and integrated agents." |
| [value-case](../skills/value-case/SKILL.md) | "Work through the economics of broader AI-assisted coverage, including the new work it enables." |
| [capability-exploration](../skills/capability-exploration/SKILL.md) | "Test whether our current coding environment can complete a representative migration. Use the result to choose the approach." |
| [solution-design](../skills/solution-design/SKILL.md) | "Design an incident investigator that follows evidence across logs, changes and runbooks, then carries useful findings into the incident." |
| [enterprise-integration](../skills/enterprise-integration/SKILL.md) | "Design an IT agent that provisions an approved development environment and recovers correctly after a lost response." |
| [context-design](../skills/context-design/SKILL.md) | "Give the research agent the business definitions, source access and memory needed to maintain its analysis as evidence changes." |
| [evaluate-and-improve](../skills/evaluate-and-improve/SKILL.md) | "Find why this analytics agent reaches the wrong conclusion. Test the change that fixes the cause." |
| [technical-delivery](../skills/technical-delivery/SKILL.md) | "Prepare the build brief and first release for a coding agent that completes migrations across our repositories." |
| [adoption-and-scale](../skills/adoption-and-scale/SKILL.md) | "We have broad AI access and a few excellent users. Turn their methods into a practice other teams can use and extend." |
| [executive-communication](../skills/executive-communication/SKILL.md) | "Make the proposed AI service and investment choice clear in a sponsor presentation." |
| [field-productization](../skills/field-productization/SKILL.md) | "Turn what worked in these deployments into reusable skills, integrations and product behavior." |

The worked references illustrate decisions, including which changed facts would change the recommendation. Read the ones that help with the current assignment. [Practice and sources](practice.md) explains the OpenAI and Anthropic material behind the methods.

## Make the task concrete

A useful request gives the agent a job to finish. For example: "Here are two incident histories and our system diagram. Design an agent that investigates the next incident, define the tools it needs and create a test from the first history." Partial context is enough to start; the agent can investigate what is missing.

For opportunity work, include the ambition: "What could this team deliver if it could investigate every customer, rather than sample a few?" For a continuing engagement, include the change: "The source system now exposes events. Update the design and delivery plan to use them."

For workforce adoption, ask for working material: "Turn this analyst's successful method into a shared skill and run it on a second case." This produces something the next person can use.

## Work with the host

The host supplies connected systems, research, analysis, coding and artifact creation. Ask for the form you need: a finished deck, an experiment, a technical design or a working session. The skills work with existing AI products and with custom applications. When implementation is part of the assignment, the design and build brief carry into the user's engineering or coding-agent workflow.

## Native interactions

In a supported OpenAI host, open Forward Deployed beside the conversation. Select a source, service, requirement or delivery item, then use **Discuss with agent** to work from that selection. The interface supplies the selected record and its relevant links as context. The agent can still read the wider engagement when the assignment needs it.

For a customer change, ask: “Propose the updated requirement and delivery work, and show me what it affects.” A proposal preserves the existing records until you accept it. Review shows before and after values, linked work and rehearsals, and checks that may need rerunning. Accept selected changes, reject them or revise their fields. Revised changes remain pending. These are effects derived from workspace links, not a prediction of financial value.

Native review forms collect accept or reject choices; native experiment forms choose the point to fork and the changed assumptions. Cancelling a form leaves the engagement unchanged. Hosts must support OpenAI extended elicitation and MCP multi-round requests for these forms. Other hosts use the workspace controls. Sidebar entrypoints, conversation panels and composer mentions depend on the host's extension support; mentions are currently desktop-only.

The structured tools remain available: `propose_changes` stages changes, `review_changes` applies explicit decisions, `review_with_form` requests a native review, and `experiment_with_form` requests an experiment fork. Ordinary edits do not require a proposal. Use review when comparing a consequential change helps the user decide.

## Continuing work

The optional Studio keeps opportunities, requirements, delivery work and Field Lab runs in an engagement snapshot. Ask the agent to open the Studio when a shared view would help, or continue with its structured tools in chat. Work on a supplied snapshot without an account; sign in to save workspaces between sessions. The skills remain usable with ordinary files and the host's existing tools.

Use [Export](export.md) to download the engagement or prepare its files for a Git repository. The host writes to Git using its existing access and the repository you choose. Studio sign-in does not grant repository permissions.

Provide the current design, relevant meeting material or delivery plan when available. The agent should build on that work and maintain the useful context in the team's established workspace. A change matters when it affects a decision, behavior or commitment; routine discussion does not need a new approval or reporting process.

Use domain examples to examine the solution being developed. If the assignment is to design an AI service for a claims team, the deployment work is discovering the workflow, choosing an approach, equipping engineering and planning adoption. Completing a sample claim may help investigate or test that design, but it does not complete the deployment assignment.

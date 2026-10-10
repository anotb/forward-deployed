# Forward Deployed: FDE skills for AI agents

**Skills for forward-deployed engineering (FDE).**

Forward Deployed helps an AI agent work through an enterprise AI engagement. It covers the customer conversations that shape what gets built, the product and technical decisions behind the solution, and the work of getting it into use.

The starting point might be a discovery meeting, interview notes, a workflow that needs attention or an idea for a new service. The skills help the agent investigate how the business works, develop the opportunity and give engineers a design they can build from. For an engagement already underway, they support delivery, adoption and value measurement.

OpenAI and Anthropic have teams dedicated to this work. So do DeployCo, Ode, Casper Studios and consulting firms of all sizes. Working with the customer means understanding the industry and the organization as well as the technology. Product choices, engineering and change management often need to be worked through together.

The technical skills cover enterprise integration, context engineering and agent evaluation. Coding tools such as Codex can implement the resulting design. A focused assignment might end with a discovery finding or an engineering brief; a broader engagement can continue through rollout and measured results.

The result could be better use of an existing AI product, reusable skills and agents, or an integrated application. The customer and the work determine the approach. Builders, operators, consultants and deployment leads can use the skills across industries and AI hosts.

## The skills

| Skill | Use it to | Example request |
|---|---|---|
| [get-started](skills/get-started/SKILL.md) | Orient an engagement and choose the next useful work | “Help me move this enterprise AI engagement forward.” |
| [enterprise-engagement](skills/enterprise-engagement/SKILL.md) | Develop a customer point of view and shape a useful engagement | “Prepare our first conversation with the operations sponsor.” |
| [discovery](skills/discovery/SKILL.md) | Understand operations, systems, and expert judgment | “Find what this process depends on and where it could change.” |
| [meeting-synthesis](skills/meeting-synthesis/SKILL.md) | Develop understanding and follow-through from conversations | “Reconcile these interviews and sharpen our solution ideas.” |
| [opportunity-design](skills/opportunity-design/SKILL.md) | Invent and develop valuable AI applications and services | “What could we offer if this expertise became available at every case?” |
| [use-case-portfolio](skills/use-case-portfolio/SKILL.md) | Develop, select, and sequence opportunities | “Which opportunities belong together, and what should we test first?” |
| [value-case](skills/value-case/SKILL.md) | Explain and test the economics of changed work | “Build the case for this service, including adoption and full costs.” |
| [capability-exploration](skills/capability-exploration/SKILL.md) | Discover what current products and host tools can do | “Explore the available capabilities and test the hardest assumption.” |
| [solution-design](skills/solution-design/SKILL.md) | Design the complete service and operator experience | “Turn this opportunity into a coherent, buildable solution.” |
| [enterprise-integration](skills/enterprise-integration/SKILL.md) | Design reliable work across systems, identities, and business objects | “Design how the agent updates a case without duplicating actions.” |
| [context-design](skills/context-design/SKILL.md) | Make enterprise knowledge and continuing state useful | “Fix the missing context behind these inconsistent decisions.” |
| [evaluate-and-improve](skills/evaluate-and-improve/SKILL.md) | Experiment, diagnose failures, and improve the right component | “Find why this pilot fails on exceptions and test the repair.” |
| [technical-delivery](skills/technical-delivery/SKILL.md) | Brief engineers and coordinate delivery into operation | “Prepare the engineering handoff and a practical path to our first useful release.” |
| [adoption-and-scale](skills/adoption-and-scale/SKILL.md) | Enable workforce AI use, spread effective practices and expand deployments | “We have AI licenses but little changed work. Find where people get stuck and help teams develop useful practices.” |
| [executive-communication](skills/executive-communication/SKILL.md) | Build a persuasive deck, memo, or solution walkthrough | “Make the investment choice clear in a sponsor presentation.” |
| [field-productization](skills/field-productization/SKILL.md) | Turn field learning into reusable product capability | “Separate the repeatable product from this customer's variation.” |

## Working with it

Give the assistant the business situation, available evidence, and the result you need. For continuing work, include the current design, commitments or plan where available. A short question can stay a short answer. A broader assignment can move through several skills, producing usable artifacts and coordinating with engineering when needed. Start with `get-started` when the work spans multiple jobs; invoke a focused skill directly when the task is clear.

The skills encourage exploration of the current environment before settling on a design: inspect available connectors and tools, consult current product documentation, and run a small permitted experiment where it resolves uncertainty. They also use the host's document, presentation, spreadsheet, browser, and coding capabilities when those help deliver the result. No particular companion plugin is required.

The guidance and selected worked references are bundled. Each skill can be used directly, without the hosted workspace. References show how source material changes a diagnosis, design, investment or delivery choice; the entrypoints explain when those examples help. They illustrate judgment rather than prescribe a process or output format. The [usage guide](docs/usage.md) explains where each skill helps and what you can ask it to do.

## Workspace and Field Lab

The optional [workspace](https://forward-deployed.unsol.dev) connects discovery sources, opportunities, requirements and delivery work. An agent can bring in selected meeting excerpts through the host's Meetings connector, develop a service from that evidence and keep each requirement linked to the passage behind it.

The ChatGPT package includes an interactive workspace that opens in the conversation through MCP Apps. You can inspect the service, update delivery work and run a rehearsal there, then ask the agent to develop the design further. The agent and the interface work on the same workspace. ChatGPT supplies the reasoning and its connected tools; Forward Deployed supplies the project state and executable rehearsal.

Field Lab lets the agent try that service. Define its starting state, available actions and outcome checks, then run it through the MCP tools. Fork a point in the timeline to try another approach or change an assumption. For a maintenance service, that might mean comparing a warehouse replacement with a compatible part already at the customer site, including the approval and booking steps each route needs. Runs preserve the scenario and requirement versions they exercised.

Work is stateless by default: the caller carries the workspace between requests. In the browser, it stays in the tab session. Sign in only to save it on the service. You can [export a portable ZIP or prepare files for your own Git repository](docs/export.md). The skills remain useful with your existing tools and records.

The MCP endpoint is `https://forward-deployed.unsol.dev/mcp`. It serves the same workspace inside compatible hosts, with optional OAuth for saved work. Hosts that support MCP Events can subscribe to saved-workspace updates, so a later conversation can follow a requirement, delivery update or completed run. [Studio source and local setup](https://github.com/anotb/forward-deployed/tree/main/studio) are included for self-hosting.

## Installation

The same skills are packaged for ChatGPT/Codex and Claude Cowork. Each upload contains its host's manifest and the shared skill content.

### Claude Cowork

In Cowork, open **Customize > Plugins > Add > Add marketplace** and enter `anotb/forward-deployed`. You can also upload the Cowork ZIP from [Releases](https://github.com/anotb/forward-deployed/releases). Start a new conversation and ask to use Forward Deployed.

### ChatGPT and Codex

Add the repository's plugin marketplace:

```text
codex plugin marketplace add anotb/forward-deployed
codex plugin add forward-deployed@anotb-forward-deployed
codex plugin list --marketplace anotb-forward-deployed --json
```

You can also install from the desktop app's Plugins Directory after adding the local marketplace. The `forward-deployed-<version>-chatgpt.zip` is the package for OpenAI's plugin import flow.

The ChatGPT directory submission is in progress. OpenAI treats GitHub-imported plugins with MCP configuration as desktop-only; browser and mobile availability requires directory approval. The hosted workspace is available directly, and the [installation guide](docs/installation.md) explains the supported routes.

### Claude Code

Add the same repository in Claude Code:

```text
claude plugin marketplace add anotb/forward-deployed
claude plugin install forward-deployed@anotb-forward-deployed
claude plugin list
```

Start a new session. `/forward-deployed:get-started` invokes the entry skill. The [installation guide](docs/installation.md) covers host details and checking the installed copy.

For another Agent Skills host, use its skill-directory installation mechanism. Copy complete skill folders, including their references. The full skills directory preserves the entry skill's navigation.

Original material is available under the [MIT License](LICENSE). See [Privacy](PRIVACY.md) and [Terms](TERMS.md).

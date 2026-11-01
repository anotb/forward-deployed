# Forward Deployed: The work around the code.

**Skills for forward-deployed engineering (FDE).**

[Install](#installation) · [Usage guide](docs/usage.md) · [Optional workspace](#optional-workspace-and-field-lab)

Forward Deployed helps an AI agent work through an enterprise AI engagement. It covers the customer conversations that shape what gets built, the product and technical decisions behind the solution, and the work of getting it into use.

The starting point might be a discovery meeting, interview notes, a workflow that needs attention or an idea for a new service. The skills help the agent investigate how the business works, develop the opportunity and give engineers a design they can build from. For an engagement already underway, they support delivery, adoption and value measurement.

OpenAI and Anthropic have teams dedicated to this work. So do DeployCo, Ode, Casper Studios and consulting firms of all sizes. Working with the customer means understanding the industry and the organization as well as the technology. Product choices, engineering and change management often need to be worked through together.

The technical skills cover enterprise integration, context engineering and agent evaluation. Coding agents can implement the resulting design. A focused assignment might end with a discovery finding or an engineering brief; a broader engagement can continue through rollout and measured results.

The result could be better use of an existing AI product, reusable skills and agents, or an integrated application. The customer and the work determine the approach. Builders, operators, consultants and deployment leads can use the skills across industries and AI hosts.

## The skills

| Skill | Use it to | Example request |
|---|---|---|
| [get-started](skills/get-started/SKILL.md) | Orient an engagement and choose the next useful work | “Help me move this enterprise AI engagement forward.” |
| [enterprise-engagement](skills/enterprise-engagement/SKILL.md) | Develop a customer point of view and shape an AI engagement | “Prepare our conversation about moving from AI access to redesigned work.” |
| [discovery](skills/discovery/SKILL.md) | Find where AI can change expertise, information and handoffs | “Study these release decisions and find the work an agent could take on.” |
| [meeting-synthesis](skills/meeting-synthesis/SKILL.md) | Develop understanding and follow-through from conversations | “Reconcile these interviews and sharpen our solution ideas.” |
| [opportunity-design](skills/opportunity-design/SKILL.md) | Invent and develop valuable AI applications and services | “What could we offer if this expertise became available at every case?” |
| [use-case-portfolio](skills/use-case-portfolio/SKILL.md) | Select and sequence AI investments | “Choose what to fund across workforce tools, shared capabilities and agents.” |
| [value-case](skills/value-case/SKILL.md) | Explain and test the economics of changed work | “Build the case for this service, including adoption and full costs.” |
| [capability-exploration](skills/capability-exploration/SKILL.md) | Discover what current products and host tools can do | “Explore the available capabilities and test the hardest assumption.” |
| [solution-design](skills/solution-design/SKILL.md) | Design the AI service, experience and architecture | “Design an incident investigator that follows evidence across our systems.” |
| [enterprise-integration](skills/enterprise-integration/SKILL.md) | Design reliable work across systems, identities, and business objects | “Design how the agent updates a case without duplicating actions.” |
| [context-design](skills/context-design/SKILL.md) | Make enterprise knowledge and continuing state useful | “Fix the missing context behind these inconsistent decisions.” |
| [evaluate-and-improve](skills/evaluate-and-improve/SKILL.md) | Test completed work, diagnose failures and improve performance | “Find why this analytics agent reaches the wrong conclusion and test the fix.” |
| [technical-delivery](skills/technical-delivery/SKILL.md) | Brief engineers and coordinate delivery into operation | “Prepare the engineering handoff and a practical path to our first useful release.” |
| [adoption-and-scale](skills/adoption-and-scale/SKILL.md) | Enable workforce AI use, spread effective practices and expand deployments | “We have AI licenses but little changed work. Find where people get stuck and help teams develop useful practices.” |
| [executive-communication](skills/executive-communication/SKILL.md) | Build a persuasive deck, memo, or solution walkthrough | “Make the investment choice clear in a sponsor presentation.” |
| [field-productization](skills/field-productization/SKILL.md) | Turn field learning into reusable product capability | “Separate the repeatable product from this customer's variation.” |

## Working with it

Give the assistant the business situation, available evidence, and the result you need. For continuing work, include the current design, commitments or plan where available. A short question can stay a short answer. A broader assignment can move through several skills, producing usable artifacts and coordinating with engineering when needed. Start with `get-started` when the work spans multiple jobs; invoke a focused skill directly when the task is clear.

The skills encourage exploration of the current environment before settling on a design: inspect available connectors and tools, consult current product documentation, and run a small permitted experiment where it resolves uncertainty. They also use the host's document, presentation, spreadsheet, browser, and coding capabilities when those help deliver the result. No particular companion plugin is required.

The guidance and worked references are bundled. Each skill can be used directly, without the hosted workspace. Examples cover engineering migrations, incident investigation, enterprise research, workforce practice and AI investment choices. The [usage guide](docs/usage.md) gives concrete assignments. The repository keeps a [maintenance reading list](https://github.com/anotb/forward-deployed/blob/main/docs/practice.md).

## Installation

The same skills work in each host. Every package contains that host's manifest and the shared skills and references.

### ChatGPT and Codex

Install [Forward Deployed from the Plugins Directory](https://chatgpt.com/plugins/plugin_asdk_app_6ac9d1460b1481919b7284262bce73fe). For source installation and local development, add the repository's plugin marketplace:

```text
codex plugin marketplace add anotb/forward-deployed
codex plugin add forward-deployed@anotb-forward-deployed
codex plugin list --marketplace anotb-forward-deployed --json
```

You can also install from the desktop app's Plugins Directory after adding the local marketplace. The `forward-deployed-<version>-chatgpt.zip` is the package for OpenAI's plugin import flow.

### Claude

In Claude apps and Cowork, open **Customize > Plugins > Add > Add marketplace** and enter `anotb/forward-deployed`, or upload the Cowork ZIP from [Releases](https://github.com/anotb/forward-deployed/releases). Start a new conversation and ask to use Forward Deployed.

In Claude Code:

```text
claude plugin marketplace add anotb/forward-deployed
claude plugin install forward-deployed@anotb-forward-deployed
claude plugin list
```

Start a new session. `/forward-deployed:get-started` invokes the entry skill.

### Other hosts

For another Agent Skills host, use its skill-directory installation mechanism. Copy complete skill folders, including their references. The full skills directory preserves the entry skill's navigation.

The [installation guide](docs/installation.md) covers host-specific setup and checking the installed copy.

## Optional workspace and Field Lab

The skills work on their own. The [workspace](https://forward-deployed.unsol.dev) is a separate hosted service that connects discovery sources, opportunities, requirements and delivery work. An agent can bring in selected meeting excerpts through the host's connectors, develop a service from that evidence and keep each requirement linked to the passage behind it.

In a host that supports MCP Apps, the workspace opens in the conversation. You can inspect the service, update delivery work and run a rehearsal there, then ask the agent to develop the design further. The host supplies the reasoning and its connected tools; Forward Deployed supplies the project state and executable rehearsal.

Select a source, requirement or piece of delivery work to discuss it with the agent. When the design changes, review the proposed edits and their linked effects before applying them. Some hosts can open the workspace beside the conversation and collect choices in native forms; the browser keeps equivalent controls. See [native interactions](docs/usage.md#native-interactions) for examples and host requirements.

Choose **Try a sample** on the welcome screen to explore a fictional FDE engagement: designing and piloting AI borrower-change intelligence for a commercial banking team. Follow discovery into service design, data integration, analyst evaluation and a pending choice between weekly preparation and upload-triggered refresh. The sample is editable, claims no implementation or pilot results, and starts without sign-in or saved storage.

Field Lab lets the agent try the proposed workflow. Define its starting state, available actions and outcome checks, then run it through the MCP tools. Fork a point in the timeline to try another approach or change an assumption. For an AI portfolio-monitoring service, that might mean testing how a corrected document affects a drafted assessment, including source matching, invalidating an outdated summary and returning it for analyst review. Runs preserve the scenario and requirement versions they exercised.

Work is stateless by default: the caller carries the workspace between requests. In the browser, it stays in the tab session. You can [export a portable ZIP or prepare files for your own Git repository](docs/export.md).

### What connects to it

The website works without sign-in. The service runs on ChatGPT Sites, so saving work and connecting over MCP (`https://forward-deployed.unsol.dev/connect/mcp`) use ChatGPT sign-in. The ChatGPT and Codex packages declare that connection. The Claude plugin does not: it loads only the skills and references, runs no code, connects to no server and sends nothing to the publisher.

This repository also holds the workspace's [server source](https://github.com/anotb/forward-deployed/tree/main/studio) in `studio/` for self-hosting, and build tools in `scripts/` and `tests/`. Installed plugins never load or run them, and their credential handling applies only to someone hosting the workspace.

Original material is available under the [MIT License](LICENSE). See [Privacy](PRIVACY.md) and [Terms](TERMS.md).

# Forward Deployed

**Skills for forward-deployed engineering (FDE): the work around the code.**

Forward Deployed helps an AI agent work through an enterprise AI engagement. It covers the customer conversations that shape what gets built, the product and technical decisions behind the solution, and the work of getting it into use.

The starting point might be a discovery meeting, interview notes, a workflow that needs attention or an idea for a new service. The skills help the agent investigate how the business works, develop the opportunity and give engineers a design they can build from. For an engagement already underway, they support delivery, adoption and value measurement.

Builders, operators, consultants and deployment leads can use the skills across industries. The result could be better use of an existing AI product, reusable skills and agents, or an integrated application.

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

Give the assistant the business situation, available evidence and the result you need. Start with `get-started` when the work spans several jobs; invoke a focused skill directly when the task is clear. A short question can stay a short answer, and a broader assignment can move through several skills to produce usable artifacts.

The skills encourage exploring the current environment before settling on a design: inspect available connectors and tools, consult current product documentation, and run a small permitted experiment where it resolves uncertainty. Each skill bundles worked references covering engineering migrations, incident investigation, enterprise research, workforce practice and AI investment choices. The [usage guide](https://github.com/anotb/forward-deployed/blob/main/docs/usage.md) gives concrete assignments.

## What this plugin contains

This plugin contains only the 16 skills and their references. It has no MCP servers, hooks, commands, agents or executable code, and it sends nothing to the publisher. Your AI host and any connectors you have enabled do the work under their own permissions.

The [source repository](https://github.com/anotb/forward-deployed) also holds an optional hosted workspace and packages for other hosts; none of it is part of this plugin. See [Privacy](https://github.com/anotb/forward-deployed/blob/main/PRIVACY.md) and [Terms](https://github.com/anotb/forward-deployed/blob/main/TERMS.md). Original material is available under the [MIT License](LICENSE).

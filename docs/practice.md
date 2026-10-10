# Methods and further reading

Forward deployment combines customer understanding, product and technical judgment, implementation, and useful operation. This library concentrates on the work around engineering and draws on public deployment and consulting practice. The methods are independently written; the sources below do not imply affiliation or endorsement.

## Applied methods

The skill instructions and worked references are independently authored. These sources help explain particular methods. Read them when the underlying question needs deeper treatment; they are not a required reading sequence or a process to impose on every engagement.

| Work | Method and primary source | Boundary when applying it |
| --- | --- | --- |
| Discovery | [GDS: contextual research and observation](https://www.gov.uk/service-manual/user-research/contextual-research-and-observation). Observe a case with the person's normal tools; choose when to interrupt, then check the interpretation with them. | A prompted walkthrough differs from unobserved work. One case can expose a mechanism without establishing its frequency. |
| Opportunity and portfolio choice | [HM Treasury: The Green Book, 2026](https://www.gov.uk/government/publications/the-green-book--2/the-green-book-2026), chapters 5–6. Develop materially different options, screen genuine constraints, compare with a credible alternative and examine uncertainty. | Use the reasoning, not public-sector discount rates, prescribed stages or an arbitrary weighted score. Private operating economics need the customer's inputs. |
| Capability probes and evaluation | [NIST/SEMATECH: randomized block designs](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm). Hold relevant nuisance factors stable, compare alternatives on common cases, and distinguish replication from independent cases. | An LLM experiment still needs task-specific outcomes and an appropriate sampling unit. A small diagnostic test does not establish population performance. |
| Agent evaluation | [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). Evaluate completed outcomes, isolate trial environments, calibrate graders and include cases where action would be wrong. | A vendor's engineering account informs practice; it is not proof of this plugin's effectiveness. Diagnostic coverage and expected operating incidence are different. |
| Adoption diagnosis | [Michie, van Stralen and West: The behaviour change wheel](https://link.springer.com/article/10.1186/1748-5908-6-42). Specify the behavior, then investigate capability, opportunity and motivation before choosing an intervention. | The original research concerns public-health intervention classification. Enterprise explanations require local evidence; low use may reflect product defects or displaced work. |
| Operating rollout | [Google: Canarying Releases](https://sre.google/workbook/canarying-releases/). Use a bounded, informative population, attributable operating measures and a workable return path. | Infrastructure health does not establish business correctness. Observation must include the cases and timing that challenge the proposed service. |
| Field productization | [CMU SEI: Variability in Software Product Lines](https://www.sei.cmu.edu/library/variability-in-software-product-lines/). Design shared responsibilities and permitted variation explicitly rather than accumulating inconsistent customer exceptions. | Reuse must earn its design and support cost. A small deployment does not need an entire product-line management program. |

Worked references show how a particular set of inputs changes a conclusion, including attractive alternatives that fail for a specific reason. Their fictional cases, numbers and example interface contracts are teaching material. They are neither default customer assumptions nor a validated platform implementation. Use current primary documentation and the customer's environment for changing product facts.

## Deployment practice and role context

These readings explain the professional setting and additional practice:

- [OpenAI, Introducing Frontier Alliances](https://openai.com/index/frontier-alliance-partners/) (23 February 2026): collaboration between FDE teams and consulting and delivery partners on leadership alignment, workflow redesign, integration and change management.
- [Anthropic, Technical Deployment Lead](https://job-boards.greenhouse.io/anthropic/jobs/5017903008): an example of scoping, stakeholder, value and delivery responsibilities alongside FDE implementation.
- [DeployCo, Technical Deployment Lead](https://deploy.co/careers/technical-deployment-lead-us-new-york): workflow mapping, requirements, technical planning, adoption and value realization.
- [Ode, Forward Deployed Product Manager](https://jobs.ashbyhq.com/odewithanthropic/d93607e0-3e38-4a6f-a05e-f293d3f3bdf4): product framing, customer relationships and execution in a deployment team.
- [Ode, Stop designing chatbots](https://www.ode.com/engineering/stop-designing-chatbots) (30 March 2026): fitting AI into operator interfaces and existing workflows.
- [Ode, How we build evals for document extraction](https://www.ode.com/engineering/evals-for-document-extraction) (3 September 2026): evaluation design, ground truth and the limits of comparison.
- [Thoughtworks, How to run a successful discovery](https://www.thoughtworks.com/en-au/insights/blog/agile-project-management/run-successful-discovery) (31 January 2023): prepared investigation, stakeholder playback and actionable recommendations.
- [Thoughtworks, Path to production for enterprise AI](https://www.thoughtworks.com/insights/articles/Path-to-production-for-enterprise-AI) (16 July 2026): the connected work of prioritization, funding, discovery, engineering and operation.
- [QuantumBlack, Where AI agents pay off](https://www.mckinsey.com/capabilities/quantumblack/our-insights/where-ai-agents-pay-off-a-practical-guide-to-the-economics-of-agentic-workflows) (24 August 2026): completed-work economics, including oversight, exceptions and operating costs.

Role descriptions illustrate responsibilities at particular organizations. Practitioner accounts describe approaches and experience. Use them as context for judgment, not as universal role definitions or evidence of this plugin's performance. Sources were checked in October 2026; roles and product capabilities can change. The sixteen-skill organization is a product design choice, not a taxonomy established by these sources.

# Sources for maintenance

Keep the useful reasoning in the skills and worked examples. This reading list stays in the repository and source package. Revisit it when maintaining the library; research current products, models, tools and economics when working on an assignment.

## Enterprise work

- OpenAI's [Enterprise Signals](https://openai.com/index/introducing-b2b-signals/) (May 2026, updated August) and [research on changing work](https://openai.com/index/unlocking-new-ways-of-working/) (September 2026) inform the focus on substantial delegated assignments and the responsibilities people can take on with AI. Usage patterns suggest opportunities; they do not establish a customer's return on investment.
- [How AI-native companies turn workflows into operating capability](https://openai.com/index/ai-native-company-workflows/) (OpenAI, September 2026) connects reusable context, tools, permissions, evaluation, ownership and employee practice. Its customer examples help examine the whole working arrangement.

## Context and execution

- [The new rules of context engineering](https://claude.dev/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models/) (Anthropic, July 2026) and [harness design for long-running applications](https://www.anthropic.com/engineering/harness-design-long-running-apps) (March 2026) support testing whether accumulated instructions and scaffolding still help after model improvements. Preserve the organization's chosen constraints and useful domain knowledge.
- [Harness engineering](https://openai.com/index/harness-engineering/) (OpenAI, February 2026) asks what the agent needs to inspect, operate and verify before adding more instructions. Observable application behavior and executable checks can resolve failures that prose cannot.
- [Inside our in-house data agent](https://openai.com/index/inside-our-in-house-data-agent/) (OpenAI, January 2026) and [self-service data analytics](https://claude.com/resources/articles/how-anthropic-enables-self-service-data-analytics-with-claude) (Anthropic, June 2026) show why schemas alone are insufficient. Producing code, curated business definitions, live inspection and correctable memory serve different purposes; inferred meaning still needs an accountable business owner.
- [Building effective agent automations](https://claude.dev/blog/building-effective-agent-automations/) (Anthropic, October 2026) covers progress across recurring runs, unavailable sources, confirmed delivery and recovery from uncertain outcomes. Separate user preferences from agent-written operating state.

## Evaluation and improvement

- [Automating eval design and hillclimbing](https://claude.dev/blog/automating-eval-design-and-hillclimbing/) (Anthropic, September 2026) develops task coverage, grader repeatability and bounded improvement experiments. Cases drawn only from one model's failures can give a distorted view. In this library, a set repeatedly used to choose changes is validation data; sustained optimization also needs an untouched final test.
- [Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills) (OpenAI, January 2026) and [improving skill-creator](https://claude.com/resources/articles/improving-skill-creator-test-measure-and-refine-agent-skills) (Anthropic, March 2026) distinguish skill selection from result quality. Compare skill and no-skill behavior, and distinguish model workarounds from an organization's deliberately chosen methods.
- [Automating repetitive work with Codex](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex) (OpenAI, August 2026) and [Warp's agent improvement process](https://claude.com/resources/articles/how-warp-builds-self-improving-agents-on-claude) (Anthropic, August 2026) show ways to carry useful discoveries and expert corrections into later work. Turn them into reviewable improvements to maintained context, procedures and tools.

The worked examples are independently authored fictional cases. Vendor results illustrate possibilities, not expected customer outcomes. Model-specific findings and implementation choices need fresh testing in the intended environment.

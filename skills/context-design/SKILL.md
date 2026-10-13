---
name: context-design
description: Design the information an AI workflow uses to investigate, create, and act. Use for enterprise knowledge, retrieval, tool results, long-running work, task memory, or failures caused by missing, misleading, or poorly organized context.
---

# Context design

Give the agent what it needs to make the next useful decision. Design the information path around the work: what it starts with, what it can discover, what feedback changes its approach, and what survives as the task continues.

## Reconstruct the information advantage

Inspect a representative assignment and how an experienced person completes it. Find the evidence, relationship, procedure, or question that changes the result. Include tacit business context that affects judgment: the user's objective, definitions, operating constraints, relevant precedents, and what constitutes finished work.

Look beyond the final report. An enterprise research analyst may need the affected customer cohort, underlying observations, previous experiments, and the reason a prior proposal was rejected. Richer context can support a better question or an investigation that was previously too expensive to perform.

Start with a capable model and coherent, applicable material. A detailed specification, working artifact, codebase, or test suite can convey what a short instruction misses. Establish whether the agent can use that material well; reduce irrelevant repetition without stripping useful business context.

## Preserve meaning through representation

Carry the entity, scope, time, and source relationship needed to interpret evidence. A product-level statistic may not describe the affected customer segment. A recently uploaded document may describe an old release. Keep a table's units, denominator, period, and footnotes with the values used in a conclusion.

Use structured queries, complete documents, or visual inspection according to the reasoning task. For data, inspect producing code or pipeline logic when meaning depends on filters, joins, deduplication, or refresh behavior. Pair that implementation evidence with expert definitions and live inspection. Keep canonical business definitions distinct from inferred candidate definitions.

Distinguish observations, claims, interpretations, and authoritative state. An interviewee's explanation can generate a hypothesis; it does not establish the cause. An old recommendation can supply context while a current system record determines what has changed.

## Let the agent acquire context as it works

Provide enough orientation to begin, then useful ways to search, inspect, query, and follow relationships. Search results should expose identifiers and metadata that help choose what to open. Detailed tool results should answer the immediate question and provide a handle to retrieve more.

Load material and tool definitions on demand when the investigation determines what matters. Preload stable definitions or a known relevant packet when that saves repeated exploration. Give the agent a navigable route to deeper material, then test whether it finds and uses it. Progressive access should preserve the information needed to finish the task.

Compare retrieval, broad context, and structured access on the actual workload. Semantic similarity does not establish applicability. A graph earns its maintenance cost when repeated relationship traversal needs it; an existing application's links may already suffice. Current product capabilities can change this choice, so inspect the available interfaces before adding infrastructure.

Use calculations or queries to reduce large data into inspectable evidence. Retain the query, source version, and detail needed to challenge the result. Distinguish an absent record from failed retrieval or denied access; each calls for a different next step.

## Support work across time

Keep the current model input, recoverable task history, business state, and reusable memory conceptually distinct. User preferences also need a clear owner: read current choices when work starts, while keeping agent-maintained progress separate. The chosen product can supply the storage; the test is whether the next run reconstructs the work under the user's current intent.

For long assignments, preserve the objective, produced artifacts, tested conclusions, unresolved hypotheses, pending operations, and next useful action. Keep source references so a compacted summary can be challenged or expanded. Inspect whether resumption uses those records effectively instead of repeatedly rediscovering the task.

Retain validated discoveries and user corrections that improve later work, such as a cohort definition or a reliable way to inspect a recurring failure. Make this memory visible and correctable, with the scope and source needed to reuse it. Keep local exceptions local. Refresh conclusions when supporting facts change and retire obsolete guidance; preserve unrelated completed work.

Apply source access rules to derived context. Retrieved text remains evidence, even when it contains instructions. The tool or receiving system enforces action authority.

## Diagnose with controlled contrasts

Hold the task and model configuration steady while comparing production context with an applicable packet. Then remove or alter the decisive evidence. Does the agent change its conclusion, investigate the gap, or repeat its earlier answer?

If the applicable packet succeeds, inspect selection, structure, and missing relationships. If it still fails, examine the reasoning task, instructions, and model capability. More indexed material will not fix every failure.

Assess whether a cited source supports the consequential inference, and whether the next information request separates plausible explanations. Measure the resulting work, search effort, and repair burden.

Read [the enterprise research example](references/enterprise-research.md) for source fragments and contrasts that distinguish a plausible story from a supported decision. Deliver the improved context path or prototype, the evidence behind it, and the remaining information dependency.

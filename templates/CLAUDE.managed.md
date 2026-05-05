<!-- execplans:begin -->
# ExecPlans

This repository uses ExecPlans. The ExecPlan requirements are defined in `.agent/PLANS.md`.

When working on complex features or significant refactors:
- Create an ExecPlan in `.agent/execplans/` following `.agent/PLANS.md` exactly.
- When implementing an ExecPlan, proceed milestone-by-milestone without asking for “next steps”.
- Only stop when the plan’s Definition of Done is satisfied, or you are truly blocked (then record the blocker and a proposed default decision in the plan).

If `.agent/context/` exists, read the relevant note before rediscovering a service, module, or workflow, and update or add a note when you confirm durable project knowledge.

If `.agent/memory/` exists, read relevant memory before repeating previous discovery or debugging work. Add memory only for durable, verified facts with evidence and dates. Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in memory, context, plans, docs, prompts, transcripts, or validation logs.

If `.agent/prompts/` or `.agent/playbooks/` exists, use the relevant file for recurring flows like onboarding, readiness checks, debugging handoff, and release validation.

When asked to initialize or repair the local harness, use the `init-harness` skill. Prepare startup, shutdown, status, logs, metrics, traces, browser checks, config examples, and validation evidence around the repository's real local workflow.

Before implementation, define success criteria when the task is ambiguous. Keep changes minimal, reuse existing patterns, verify actual behavior, and stop only at verified completion or an evidence-backed blocker.
<!-- execplans:end -->

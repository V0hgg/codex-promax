<!-- execplans:begin -->
# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.

If `.agent/context/` exists, read the relevant notes before rediscovering a service, module, or workflow, and update or add a note when you confirm durable project knowledge.

If `.agent/memory/` exists, read relevant memory before repeating previous discovery or debugging work. Add memory only for durable, verified facts with evidence and dates. Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in memory, context, plans, docs, prompts, transcripts, or validation logs.

If `.agent/knowledge/` exists, read `.agent/knowledge/INDEX.md` before repeated discovery. Compose applicable knowledge from broad to specific: user-global `~/.veloran/knowledge/`, repository `.agent/knowledge/`, then nested path `.agent/knowledge/` directories. Load only relevant rules, standards, facts, and docs for the current task; use `veloran knowledge print --path <repo-or-subdir> --touched <file>` when the active knowledge set is unclear.

Default new knowledge to local project scope. Write user-global knowledge only with explicit user approval or repeated cross-repository evidence. Update facts only with evidence and dates, archive stale entries instead of deleting them, and never store secrets in knowledge files.

If `.agent/prompts/` or `.agent/playbooks/` exists, use the relevant file for recurring flows like onboarding, readiness checks, debugging handoff, and release validation.

When asked to initialize or repair the local harness, use the `init-harness` skill. Prepare startup, shutdown, status, logs, metrics, traces, browser checks, config examples, and validation evidence around the repository's real local workflow.

Before implementation, define success criteria when the task is ambiguous. Keep changes minimal, reuse existing patterns, verify actual behavior, and stop only at verified completion or an evidence-backed blocker.
<!-- execplans:end -->

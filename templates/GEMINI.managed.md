<!-- execplans:begin -->
# Veloran Harness

This repository uses Veloran for coding-agent harness work.

Before changing code, read the applicable root instructions, `.agent/context/`, `.agent/memory/`, and `.agent/knowledge/INDEX.md` when present. Use memory and knowledge to avoid repeating confirmed discovery, and update them only with durable, evidence-backed information. Never store secrets in `.agent/memory`, `.agent/context`, `.agent/knowledge`, plans, docs, prompts, transcripts, or validation logs.

Compose Veloran knowledge from broad to specific: user-global `~/.veloran/knowledge/`, repository `.agent/knowledge/`, then nested path `.agent/knowledge/` directories. Load only relevant rules, standards, facts, and docs for the current task; use `veloran knowledge print --path <repo-or-subdir> --touched <file>` when the active knowledge set is unclear.

Default new knowledge to local project scope. Write user-global knowledge only with explicit user approval or repeated cross-repository evidence. Update facts only with evidence and dates, and archive stale entries instead of deleting them.

For substantial features or refactors, create or follow an ExecPlan in `.agent/execplans/` according to `.agent/PLANS.md`.

When the user asks to initialize or repair the local harness, use the `init-harness` skill from `.agent/skills/init-harness/SKILL.md`. The harness should prepare startup, shutdown, status, logs, metrics, traces, browser checks, config examples, and validation evidence around the repository's real local workflow.

Work with explicit success criteria, keep edits minimal, reuse existing project patterns, and verify actual behavior before claiming completion.
<!-- execplans:end -->

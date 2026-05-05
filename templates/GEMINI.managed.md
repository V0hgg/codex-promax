<!-- execplans:begin -->
# Veloran Harness

This repository uses Veloran for coding-agent harness work.

Before changing code, read the applicable root instructions, `.agent/context/`, and `.agent/memory/`. Use memory to avoid repeating confirmed discovery, and update memory only with durable, evidence-backed facts. Never store secrets in `.agent/memory`, `.agent/context`, plans, docs, prompts, transcripts, or validation logs.

For substantial features or refactors, create or follow an ExecPlan in `.agent/execplans/` according to `.agent/PLANS.md`.

When the user asks to initialize or repair the local harness, use the `init-harness` skill from `.agent/skills/init-harness/SKILL.md`. The harness should prepare startup, shutdown, status, logs, metrics, traces, browser checks, config examples, and validation evidence around the repository's real local workflow.

Work with explicit success criteria, keep edits minimal, reuse existing project patterns, and verify actual behavior before claiming completion.
<!-- execplans:end -->

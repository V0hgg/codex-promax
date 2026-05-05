# Harness Setup

Veloran installs a repository-local harness for coding agents. The harness is made of instructions, skills, ExecPlans, context, memory, startup helpers, observability, MCP configuration, and validation docs.

## Start Here

1. Run `veloran init --apps codex,claude,opencode,antigravity --scope project --yes`.
2. Run `veloran doctor --apps codex,claude,opencode,antigravity --preset harness`.
3. Mention the `init-harness` skill in your coding agent, or print it with `veloran prompt init-harness`.

## What The Agent Should Prepare

The `init-harness` skill asks the agent to discover the real local startup path, create or adapt start/stop/status scripts, wire logs, metrics, traces, and browser checks, and write validation evidence to `docs/generated/harness-validation.md`.

If secrets, databases, service accounts, or external endpoints are required, the agent should create example config files and tell the user exactly which values to fill in.

## Secrets Policy

Do not store secrets in `.agent/memory`, `.agent/context`, plans, docs, prompts, transcripts, or validation logs. Use ignored local env files or the repository's existing secret mechanism.

## Memory Policy

Use `.agent/memory/` for short, durable, evidence-backed facts discovered during work. Use `.agent/context/` for curated onboarding notes.

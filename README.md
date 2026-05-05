# Veloran

`veloran` installs a repository-local coding-agent harness for Codex, Claude Code, OpenCode, Google Antigravity, and generic `AGENTS.md`-compatible tools.

It scaffolds instructions, skills, ExecPlans, context, memory, local harness scripts, observability/MCP setup, and validation docs so a coding agent can prepare the real local development workflow instead of asking the user to create scripts and config by hand.

## Quick Start

Use the latest package without installing globally:

```bash
npx -y veloran@latest init
```

Install a project-local multi-app harness non-interactively:

```bash
npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes
```

Preview user-global skill installation without mutating your machine:

```bash
npx -y veloran@latest init --scope user --apps claude,codex --dry-run
```

Then hand the harness workflow to your coding agent:

```bash
npx -y veloran@latest prompt init-harness
```

Validate the generated repo:

```bash
npx -y veloran@latest doctor --apps all --preset harness
```

## What Gets Installed

Project scope is the default and writes reviewable files inside the target repository:

- `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` guidance for selected apps
- `.agents/skills/`, `.claude/skills/`, and `.agent/skills/` with `init-harness`, `execplan-create`, and `execplan-execute`
- `.agent/PLANS.md` and `.agent/execplans/`
- `.agent/context/` for curated onboarding notes
- `.agent/memory/` for durable, verified project facts
- `.agent/harness/` for startup, observability, MCP, and runtime helper scaffolding
- app-native config for Codex, Claude Code, OpenCode, and Antigravity setup notes
- docs for harness setup, app targets, skills, memory, and validation
- `.agent/veloran-manifest.json` recording the selected apps, scope, preset, and package version

User scope writes user-global skills only. Real user-scope writes require `--yes` or interactive confirmation. Use `--dry-run` first.

## Core Skills

Veloran ships three core skills:

- `init-harness`: inspect the repo and prepare startup, shutdown, status, logs, metrics, traces, browser checks, config examples, memory, and validation evidence.
- `execplan-create`: create self-contained ExecPlans under `.agent/execplans/`.
- `execplan-execute`: execute an ExecPlan milestone-by-milestone and keep its living log current.

## Vendor/App Targets

Use `--apps <list>` to select targets:

```bash
npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes
```

Supported app IDs:

- `agents`: generic `AGENTS.md`-compatible tools
- `codex`: Codex config, agents, MCP entries, and shared skills
- `claude`: Claude Code settings, MCP JSON, agents, and native skills
- `opencode`: OpenCode config, agents, commands, and shared skills
- `antigravity`: `GEMINI.md`, workspace `.agent/skills`, memory/context, and setup docs
- `augment`: compatibility target that receives shared root instructions
- `common`: alias for `agents`
- `all`: every supported target

`--assistants` remains as a backward-compatible alias for `--apps`. If both are provided, Veloran exits with a clear error.

## Presets

`harness` is the default preset:

```bash
npx -y veloran@latest init --preset harness
```

`codex-max` remains a backward-compatible alias for the same full harness template:

```bash
npx -y veloran@latest init --preset codex-max
```

Use the lighter scaffold when you only need ExecPlans and root instructions:

```bash
npx -y veloran@latest init --preset standard
```

## Common Commands

```bash
npx -y veloran@latest init --dry-run
npx -y veloran@latest init --verbose
npx -y veloran@latest init --force
npx -y veloran@latest init --list-apps
npx -y veloran@latest init --list-scopes
npx -y veloran@latest doctor --apps all --preset harness
npx -y veloran@latest prompt install
npx -y veloran@latest prompt plan "Add feature X"
npx -y veloran@latest prompt exec .agent/execplans/my-plan.md
npx -y veloran@latest prompt harness
npx -y veloran@latest prompt telemetry
```

`prompt telemetry` is kept as a compatibility alias and now points to the broader `init-harness` workflow.

## Memory And Secrets

Generated instructions tell agents to read `.agent/memory/` before repeating previous discovery and to update it only with durable, verified, dated facts.

Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in `.agent/memory`, `.agent/context`, plans, docs, prompts, transcripts, or validation logs. Veloran prepares example config files; humans fill in externally owned values.

## Optional Local Observability

The full harness preset includes:

- `docs/LOCAL_TELEMETRY_SETUP.md`
- `.agent/harness/observability/docker-compose.yml`
- `.agent/harness/mcp/observability-server/`
- `docs/generated/harness-validation.md`

Basic smoke check:

```bash
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

To connect real services, mention the `init-harness` skill in your coding agent. The agent should reuse the repository's real local start path and prepare missing secret/config examples instead of inventing a parallel workflow.

## Install With Your Coding Agent

Copy this prompt into your coding agent in the target repository:

```text
Install Veloran for this repository end-to-end.
https://github.com/V0hgg/veloran/blob/main/docs/AGENT_INSTALL.md
```

## Update

If you use `npx`, keep calling the latest version:

```bash
npx -y veloran@latest init --preset harness
```

If installed globally:

```bash
npm i -g veloran@latest
```

Refresh managed files after updating:

```bash
npx -y veloran@latest init --force
```

## Help

```bash
npx -y veloran@latest --help
npx -y veloran@latest init --help
npx -y veloran@latest prompt --help
npx -y veloran@latest doctor --help
```

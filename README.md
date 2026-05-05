# Veloran

`veloran` installs a repository-local coding-agent harness for Codex, Claude Code, OpenCode, Google Antigravity, and generic `AGENTS.md`-compatible tools.

It scaffolds instructions, skills, ExecPlans, context, memory, local harness scripts, observability/MCP setup, and validation docs so a coding agent can prepare the real local development workflow instead of asking the user to create scripts and config by hand.

## Quick Start

Use the latest package without installing globally and launch the magic installer:

```bash
npx -y veloran@latest
```

The magic installer asks whether to install locally, globally, or both, then asks for the target path and vendor/apps. You can also run it explicitly:

```bash
npx -y veloran@latest magic
```

Install a project-local multi-app harness non-interactively:

```bash
npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes
```

Preview user-global skill installation without mutating your machine:

```bash
npx -y veloran@latest init --scope user --apps claude,codex --dry-run
```

Install global skills/prompts under a specific path:

```bash
npx -y veloran@latest init --scope user --apps claude,codex --user-home ~/.config/veloran --yes
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
- `.agent/knowledge/` for indexed rules, standards, facts, and docs composed with user-global knowledge
- `.agent/harness/` for startup, observability, MCP, and runtime helper scaffolding
- app-native config for Codex, Claude Code, OpenCode, and Antigravity setup notes
- docs for harness setup, app targets, skills, memory, and validation
- `.agent/veloran-manifest.json` recording the selected apps, scope, preset, and package version

User scope writes user-global skills, user-global knowledge under `.veloran/knowledge/`, and appends Veloran managed prompt blocks to user prompt files under the chosen user path. It does not overwrite the user's existing prompt text. Real user-scope writes require `--yes` or interactive confirmation. Use `--dry-run` first.

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
npx -y veloran@latest magic
npx -y veloran@latest --path /path/to/repo
npx -y veloran@latest init --scope user --user-home ~/.config/veloran --yes
npx -y veloran@latest init --scope user --user-agents-file .veloran/prompts/AGENTS.md --dry-run
npx -y veloran@latest init --verbose
npx -y veloran@latest init --force
npx -y veloran@latest init --list-apps
npx -y veloran@latest init --list-scopes
npx -y veloran@latest knowledge print --path . --apps all
npx -y veloran@latest knowledge print --path . --touched src/index.ts
npx -y veloran@latest knowledge doctor --path . --apps all
npx -y veloran@latest doctor --apps all --preset harness
npx -y veloran@latest prompt install
npx -y veloran@latest prompt plan "Add feature X"
npx -y veloran@latest prompt exec .agent/execplans/my-plan.md
npx -y veloran@latest prompt harness
npx -y veloran@latest prompt telemetry
```

`prompt telemetry` is kept as a compatibility alias and now points to the broader `init-harness` workflow.

## Memory And Secrets

Generated instructions tell agents to read `.agent/knowledge/` and `.agent/memory/` before repeating previous discovery and to update them only with durable, verified, dated information.

Veloran knowledge is split by kind:

- `rule`: agent behavior such as safety or workflow rules.
- `standard`: repeatable technical policy with validation.
- `fact`: verified observation with date, source, and expiry.
- `doc`: larger reference or runbook to lazy-load when relevant.

Knowledge composes from broad to specific: user-global `~/.veloran/knowledge/`, repository `.agent/knowledge/`, then nested path `.agent/knowledge/` directories. Agents should default new knowledge to local project scope. User-global knowledge should be created only with explicit user approval or repeated cross-repository evidence.

Use `veloran knowledge print` to inspect the exact ordered bundle for a path, and `veloran knowledge doctor` to validate frontmatter, stale/invalid entries, duplicate ids, and secret-looking content.

Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in `.agent/knowledge`, `.agent/memory`, `.agent/context`, plans, docs, prompts, transcripts, or validation logs. Veloran prepares example config files; humans fill in externally owned values.

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
npx -y veloran@latest knowledge --help
npx -y veloran@latest doctor --help
```

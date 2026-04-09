# codex-promax

Scaffold and validate ExecPlan workflows for AI coding assistants.

## Development

```bash
npm install
npm run ci
# optional full functional check (docker required)
npm run test:e2e
```

## CLI

```bash
npx -y codex-promax@latest init
```

Or after global install:

```bash
npm i -g codex-promax
codex-promax init
```

`codex-promax init` now scaffolds the full `codex-max` package by default. That scaffold includes the docs topology, the local observability/worktree runtime, and a cross-tool agent harness for Codex, Claude Code, OpenCode, and generic `AGENTS.md`-compatible apps.

The generated harness is organized in layers:

- `.agent/context/` stores reusable repository context notes so agents can read before rediscovering.
- `.agent/prompts/` stores recurring playbooks for onboarding, readiness checks, debugging handoff, and release validation.
- `.codex/config.toml` plus `.codex/agents/*.toml` define Codex-native project config and custom agents.
- `.claude/settings.json`, `.mcp.json`, `.claude/agents/`, and `.claude/rules/` provide Claude-native settings, MCP wiring, agents, and modular rules.
- `opencode.json`, `.opencode/agents/`, and `.opencode/commands/` provide OpenCode-native config, subagents, and reusable slash commands.
- `.agent/harness/` keeps the shared worktree runtime and observability stack used across these tools.

The scaffold includes a human onboarding guide at `docs/LOCAL_TELEMETRY_SETUP.md`, a paste-ready coding-agent prompt at `.agent/prompts/integrate-local-telemetry.md`, an operator-ready runbook at `docs/OBSERVABILITY_RUNBOOK.md`, and a validation report template at `docs/generated/observability-validation.md`.

Assistant targeting notes:

- `--assistants opencode` scaffolds `AGENTS.md` plus shared `.agents/skills` entries for OpenCode.
- `--assistants agents` scaffolds `AGENTS.md` only for other AGENTS.md-compatible coding apps.
- `--assistants common` is an alias for `agents`.
- `--assistants all` now includes `opencode` in addition to the existing named assistants.

After scaffold, boot the worktree-local runtime used by UI legibility workflows:

```bash
.agent/harness/worktree/up.sh
.agent/harness/worktree/status.sh
# when finished
.agent/harness/worktree/down.sh
```

Validate codex-max scaffold health:

```bash
codex-promax doctor
```

`codex-promax doctor` validates the shared context cache, prompt/playbook files, native Codex/Claude/OpenCode config, and the runtime harness.

Reprint the real telemetry onboarding prompt at any time:

```bash
codex-promax prompt telemetry
```

If you need the older minimal scaffold, opt in explicitly:

```bash
codex-promax init --preset standard
```

Run local observability smoke checks (requires Docker daemon access):

```bash
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

`smoke.sh` now validates the real local ingestion contract by using a short-lived fixture that writes local log files, exposes a metrics endpoint, and emits OTLP traces. To wire your repository's actual services into the same contract, follow `docs/LOCAL_TELEMETRY_SETUP.md` or paste `.agent/prompts/integrate-local-telemetry.md` into your coding agent.

## Release workflow

- CI runs on pull requests and pushes to `main` via `.github/workflows/ci.yml`.
- To cut a release, run the `release` workflow manually and select `patch`, `minor`, or `major`.
- The `release` workflow now bumps version, updates changelog, pushes commit+tag, and publishes to npm in the same run.
- Publishing requires `NPM_TOKEN` repository secret.

Local release helpers:

```bash
npm run release:patch
# or npm run release:minor / npm run release:major
```

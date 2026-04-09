# codex-promax

`codex-promax` scaffolds an agent-ready repo structure for ExecPlans, shared prompts, native coding-assistant config, and optional local observability.

## Install

Use the latest version without installing globally:

```bash
npx -y codex-promax@latest init
```

Or install it globally:

```bash
npm i -g codex-promax
codex-promax init
```

## Quick Start

Run `codex-promax init` from the root of the repository you want to set up:

```bash
codex-promax init
```

By default this creates the `codex-max` scaffold, which includes:

- `.agent/` for plans, shared context, prompts, and local harness scripts
- `AGENTS.md` and `CLAUDE.md` managed guidance blocks
- native config for Codex, Claude Code, and OpenCode
- optional local observability and worktree runtime helpers

After the first run, the usual next steps are:

```bash
npx -y codex-promax@latest prompt telemetry
```

Copy that output, paste it into your coding agent in the same repo, and let the agent wire the local telemetry setup around your real dev or cluster start path. On supported systems, `init` also prints a ready-to-run clipboard command against the saved prompt file. When the agent finishes, you can confirm the scaffold with:

```bash
npx -y codex-promax@latest doctor
```

## Common Commands

Initialize or refresh the scaffold:

```bash
codex-promax init
```

Check scaffold health:

```bash
codex-promax doctor
```

Print a prompt for creating an ExecPlan:

```bash
codex-promax prompt plan "Add feature X"
```

Print a prompt for executing an ExecPlan:

```bash
codex-promax prompt exec .agent/execplans/my-plan.md
```

Print the telemetry onboarding prompt again later:

```bash
codex-promax prompt telemetry
```

## Presets And Assistant Targets

Use the full scaffold, which is the default:

```bash
codex-promax init --preset codex-max
```

Use the lighter scaffold:

```bash
codex-promax init --preset standard
```

Target specific assistants:

```bash
codex-promax init --assistants opencode
codex-promax init --assistants agents
codex-promax init --assistants all
```

Notes:

- `opencode` scaffolds `AGENTS.md` plus shared `.agents/skills` entries for OpenCode.
- `agents` scaffolds `AGENTS.md` only for other `AGENTS.md`-compatible coding apps.
- `common` is an alias for `agents`.
- `all` includes `codex`, `claude`, `augment`, `opencode`, and generic `AGENTS.md` support.

Useful flags:

```bash
codex-promax init --dry-run
codex-promax init --verbose
codex-promax init --force
```

- `--dry-run` shows what would change without writing files.
- `--verbose` shows the file-by-file scaffold actions during a real `init` run.
- `--force` refreshes managed templates and scaffold files.

## Optional Local Telemetry

If you want the scaffolded observability stack, the generated repo includes:

- `docs/LOCAL_TELEMETRY_SETUP.md`
- `.agent/prompts/integrate-local-telemetry.md`
- `docs/OBSERVABILITY_RUNBOOK.md`
- `docs/generated/observability-validation.md`

Basic smoke check flow:

```bash
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

The smoke check validates the local ingestion path for logs, metrics, and traces. To connect your real services, copy the saved telemetry prompt into your coding agent and let it wire the repo around the real local start path.
The quickest flow is:

```bash
npx -y codex-promax@latest prompt telemetry
```

Then copy the output, paste it into your coding agent in the repo, and wait for it to finish.

## Update

If you use `npx`, just keep calling the latest version:

```bash
npx -y codex-promax@latest init
```

If you installed globally, update with:

```bash
npm i -g codex-promax@latest
```

To refresh an existing repository scaffold after updating the package:

```bash
codex-promax init
```

If you want to overwrite managed scaffold files with the latest version:

```bash
codex-promax init --force
```

## Help

See CLI help at any time:

```bash
codex-promax --help
codex-promax init --help
codex-promax prompt --help
codex-promax doctor --help
```

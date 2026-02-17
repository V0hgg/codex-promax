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

`codex-promax init` now scaffolds the full codex-max package by default, including docs topology, docker observability stack, and MCP config.

The scaffold includes an operator-ready prompt and checklist at `docs/OBSERVABILITY_RUNBOOK.md` plus report template `docs/generated/observability-validation.md`.

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

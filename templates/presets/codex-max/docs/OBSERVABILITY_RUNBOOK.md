# Observability Runbook

Use this runbook to verify that docs, Docker services, and MCP observability tools are working in a fresh repository.

## Scope

This runbook validates:

- required docs scaffold exists and is editable
- shared agent context and readiness playbooks are present
- native Codex, Claude Code, and OpenCode project config files exist
- local observability stack (Vector + Victoria Logs/Metrics/Traces) starts
- the local ingestion contract works for log files, service-specific HTTP metrics endpoints, and OTLP traces
- MCP server tools (`query_logs`, `query_metrics`, `query_traces`) return usable results

## Quick Commands

Run from repository root:

```bash
codex-promax init
codex-promax doctor
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

To connect your real repository services instead of the built-in smoke fixture:

```bash
codex-promax prompt telemetry
```

Or open:

- `.agent/prompts/integrate-local-telemetry.md`
- `docs/LOCAL_TELEMETRY_SETUP.md`

## Docs Health Checks

Run these checks before and after updates:

```bash
test -f .agent/context/README.md
test -f .agent/prompts/validate-readiness.md
test -f .claude/settings.json
test -f opencode.json
test -f docs/OBSERVABILITY_RUNBOOK.md
test -f docs/LOCAL_TELEMETRY_SETUP.md
test -f docs/generated/observability-validation.md
rg -n "Replace this placeholder|Describe " docs || true
```

If `rg` prints placeholder lines, replace them with project-specific content.

## What `smoke.sh` Proves

`smoke.sh` now validates the real local telemetry contract by starting a short-lived chained fixture that:

- serves one request through three generic services
- writes one log file per service to `.agent/harness/observability/runtime/logs/`
- exposes one Prometheus-style metrics endpoint per service inside the observability network
- sends OTLP traces to VictoriaTraces over HTTP with preserved service identity

This gives you evidence that the harness can ingest the same shape of clustered local telemetry your coding agent will later wire into your real services.

## Codex Prompt (Natural Language, Copy/Paste)

Use this prompt with your coding assistant inside the target repository:

```text
I just installed codex-promax in this repository. Please verify that the docs scaffold, shared agent context cache, readiness prompts, local observability stack, and MCP observability tools are all working end to end.

Run codex-promax doctor, confirm the shared prompt files and docs exist (including docs/LOCAL_TELEMETRY_SETUP.md), check that the Codex/Claude/OpenCode config files still parse, start the observability Docker stack, run the smoke checks, and validate the three MCP observability tools with real queries that cover the whole chained fixture (gateway-api, workflow-api, data-api, and codex_promax_fixture_requests_total).

If anything fails, apply the smallest safe fix and re-test until all checks pass or a clear blocker is found. Write the full evidence (commands run, key outputs, MCP results, fixes, and final readiness status) to docs/generated/observability-validation.md, then stop the Docker stack and return a short PASS/FAIL summary with remaining risks.
```

## Definition Of Pass

- `codex-promax doctor` prints `OK`
- `smoke.sh` prints PASS for logs, metrics, traces
- all three MCP tools return successful responses with expected signal
- the metrics query returns `codex_promax_fixture_requests_total`
- `docs/generated/observability-validation.md` is updated with the current run details

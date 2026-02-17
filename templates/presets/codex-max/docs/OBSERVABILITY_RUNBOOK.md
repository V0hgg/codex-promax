# Observability Runbook

Use this runbook to verify that docs, Docker services, and MCP observability tools are working in a fresh repository.

## Scope

This runbook validates:

- required docs scaffold exists and is editable
- local observability stack (Vector + Victoria Logs/Metrics/Traces) starts
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

## Docs Health Checks

Run these checks before and after updates:

```bash
test -f docs/OBSERVABILITY_RUNBOOK.md
test -f docs/generated/observability-validation.md
rg -n "Replace this placeholder|Describe " docs || true
```

If `rg` prints placeholder lines, replace them with project-specific content.

## Codex Prompt (Copy/Paste)

Use this prompt with your coding assistant inside the target repository:

```text
Validate the codex-max harness end-to-end in this repository.

Requirements:
1) Run `codex-promax doctor`. If it fails, fix missing files/config and rerun until it prints `OK`.
2) Ensure these docs exist and are updated with repo-specific details when placeholders exist:
   - docs/OBSERVABILITY_RUNBOOK.md
   - docs/generated/observability-validation.md
   - docs/RELIABILITY.md
3) Start observability stack:
   - `docker compose -f .agent/harness/observability/docker-compose.yml up -d`
4) Run smoke checks:
   - `bash .agent/harness/observability/smoke.sh`
5) Verify MCP observability tools by calling:
   - query_logs with query "smoke-log-line"
   - query_metrics with query "process_cpu_cores_available"
   - query_traces with query "smoke-service"
6) Record command outputs, MCP query results, and PASS/FAIL status in:
   - docs/generated/observability-validation.md
7) Stop stack:
   - `docker compose -f .agent/harness/observability/docker-compose.yml down -v`
8) Return a concise summary with:
   - what passed
   - what failed
   - exact fixes applied
```

## Definition Of Pass

- `codex-promax doctor` prints `OK`
- `smoke.sh` prints PASS for logs, metrics, traces
- all three MCP tools return successful responses with expected signal
- `docs/generated/observability-validation.md` is updated with the current run details

# Reliability

## Reliability Goals

- Keep local harness setup reproducible from a clean clone using one command: `codex-promax init`.
- Keep observability checks executable by any engineer without hidden dependencies.

## Verification Routine

Run this routine before merging major infrastructure changes:

```bash
codex-promax doctor
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

Expected result:

- `doctor` returns `OK`
- smoke checks report PASS for logs, metrics, and traces

## MCP Query Gate

In addition to smoke checks, validate Codex MCP observability tools:

- `query_logs` must find `smoke-log-line`
- `query_metrics` must return a successful query for `process_cpu_cores_available`
- `query_traces` must find `smoke-service`

Record each run in `docs/generated/observability-validation.md`.

## Failure Handling

- If stack fails to boot, inspect `docker compose ps` and container logs first.
- If smoke checks fail, do not merge; capture failure details in validation report and fix root cause.
- If MCP queries fail but smoke checks pass, check `.codex/config.toml` and `.agent/harness/mcp/observability-server/server.mjs`.

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

- `query_logs` must return fixture log lines for the chained services
- `query_metrics` must return `codex_promax_fixture_requests_total`
- `summarize_service_metrics` must return service-labeled request and latency metrics
- `list_trace_services` and `list_trace_operations` must return the chained fixture services and operations
- `find_traces` or service-based `query_traces` must return one real fixture trace

Record each run in `docs/generated/observability-validation.md`.

## Failure Handling

- If stack fails to boot, inspect `docker compose ps` and container logs first.
- If smoke checks fail, do not merge; capture failure details in validation report and fix root cause.
- If MCP queries fail but smoke checks pass, check `.codex/config.toml` and `.agent/harness/mcp/observability-server/server.mjs`.

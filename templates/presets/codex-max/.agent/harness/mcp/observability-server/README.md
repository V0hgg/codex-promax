# Observability MCP Server

This server exposes raw query tools plus richer service-level helpers for local observability queries:

- `query_logs`
- `query_metrics`
- `summarize_service_metrics`
- `query_traces`
- `list_trace_services`
- `list_trace_operations`
- `find_traces`

The server uses stdio JSON-RPC and is launched by Codex via `.codex/config.toml`.

## Prerequisites

Start the observability stack before using these tools:

```bash
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
```

## Tool Expectations

- `query_logs` should return records for the chained fixture services such as `gateway-api`, `workflow-api`, and `data-api`.
- `query_metrics` should return records for `veloran_fixture_requests_total`.
- `summarize_service_metrics` should return service-labeled request, latency, status, and downstream metrics.
- `list_trace_services` and `list_trace_operations` should show the traced services and their `*.invoke` operations.
- `find_traces` or service-based `query_traces` should return real trace summaries for the chained fixture.

## Suggested Validation Prompt

See `docs/OBSERVABILITY_RUNBOOK.md` for a copy/paste validation prompt, and `docs/LOCAL_TELEMETRY_SETUP.md` plus `.agent/prompts/integrate-local-telemetry.md` for the real repository onboarding flow.

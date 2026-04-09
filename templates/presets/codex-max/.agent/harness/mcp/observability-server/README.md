# Observability MCP Server

This server exposes three MCP tools for local observability queries:

- `query_logs`
- `query_metrics`
- `query_traces`

The server uses stdio JSON-RPC and is launched by Codex via `.codex/config.toml`.

## Prerequisites

Start the observability stack before using these tools:

```bash
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
```

## Tool Expectations

- `query_logs` should return records for the chained fixture services such as `gateway-api`, `workflow-api`, and `data-api`.
- `query_metrics` should return records for `codex_promax_fixture_requests_total`.
- `query_traces` should return records for the same chained service names.

## Suggested Validation Prompt

See `docs/OBSERVABILITY_RUNBOOK.md` for a copy/paste validation prompt, and `docs/LOCAL_TELEMETRY_SETUP.md` plus `.agent/prompts/integrate-local-telemetry.md` for the real repository onboarding flow.

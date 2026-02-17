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

- `query_logs` should return records for test query `smoke-log-line`.
- `query_metrics` should return a success payload for `process_cpu_cores_available`.
- `query_traces` should return records for `smoke-service`.

## Suggested Validation Prompt

See `docs/OBSERVABILITY_RUNBOOK.md` for a copy/paste prompt that asks Codex to run doctor checks, validate docs, and verify all MCP tools.

# Observability Validation Report

Update this file after each full harness validation run.

## Run Metadata

- Date:
- Operator:
- Branch:
- Commit:
- Environment:

## Commands Executed

```bash
veloran doctor
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
veloran prompt telemetry
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

## Results

- Ready for Codex coding work: YES/NO
- Doctor status: PASS/FAIL
- Smoke logs: PASS/FAIL
- Smoke metrics: PASS/FAIL
- Smoke traces: PASS/FAIL
- Cluster/bootstrap start path reused for real app telemetry: YES/NO
- Service topology captured: PASS/FAIL
- Runtime log path configured per service: PASS/FAIL
- Real metrics endpoint scrape configured per service: PASS/FAIL
- Local trace export configured: PASS/FAIL
- MCP `query_logs`: PASS/FAIL
- MCP `query_metrics`: PASS/FAIL
- MCP `summarize_service_metrics`: PASS/FAIL
- MCP `query_traces`: PASS/FAIL
- MCP `list_trace_services`: PASS/FAIL
- MCP `list_trace_operations`: PASS/FAIL
- MCP `find_traces`: PASS/FAIL

## Evidence

- Key output excerpts:
- MCP response summary:
- Local wrapper or startup path:
- Service topology file:
- Metrics endpoints:
- Trace env vars or exporter settings:
- Follow-up actions:

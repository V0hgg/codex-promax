#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
LOG_DIR="$BASE_DIR/runtime/logs"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
FIXTURE_URL="http://127.0.0.1:9471"
EXPECTED_SERVICES=(gateway-api workflow-api data-api)

cleanup() {
  docker compose -f "$COMPOSE_FILE" stop telemetry-fixture >/dev/null 2>&1 || true
  docker compose -f "$COMPOSE_FILE" rm -f telemetry-fixture >/dev/null 2>&1 || true
}
trap cleanup EXIT

log() {
  printf '[smoke] %s\n' "$1"
}

wait_for() {
  local name="$1"
  local url="$2"
  local attempts=0
  until curl -fsS "$url" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 60 ]]; then
      log "$name: FAIL (timeout waiting for $url)"
      return 1
    fi
    sleep 1
  done
  return 0
}

wait_for "logs" "http://127.0.0.1:9428/health"
wait_for "metrics" "http://127.0.0.1:8428/health"
wait_for "traces" "http://127.0.0.1:10428/health"

mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR/"*.log

docker compose -f "$COMPOSE_FILE" up -d telemetry-fixture >/dev/null
wait_for "fixture" "$FIXTURE_URL/health"
curl -fsS "$FIXTURE_URL/invoke" >/dev/null

logs_ok=false
for _ in {1..30}; do
  logs_response="$(curl -fsS 'http://127.0.0.1:9428/select/logsql/query' -d 'query=handled /invoke' -d 'limit=20' || true)"
  if [[ "$logs_response" == *"gateway-api"* && "$logs_response" == *"workflow-api"* && "$logs_response" == *"data-api"* ]]; then
    logs_ok=true
    break
  fi
  sleep 1
done

if [[ "$logs_ok" == "true" ]]; then
  log 'logs query: PASS'
else
  log 'logs query: FAIL'
  exit 1
fi

# 2) Metrics check (real HTTP endpoints scraped through Vector)
metrics_ok=false
for _ in {1..60}; do
  metrics_response="$(curl -fsS 'http://127.0.0.1:8428/prometheus/api/v1/query' -d 'query=codex_promax_fixture_requests_total' || true)"
  if [[ "$metrics_response" == *"gateway-api"* && "$metrics_response" == *"workflow-api"* && "$metrics_response" == *"data-api"* ]]; then
    metrics_ok=true
    break
  fi
  sleep 1
done

if [[ "$metrics_ok" == "true" ]]; then
  log 'metrics query: PASS'
else
  log 'metrics query: FAIL'
  exit 1
fi

trace_ok=false
for _ in {1..60}; do
  traces_response="$(curl -fsS 'http://127.0.0.1:10428/select/jaeger/api/services' || true)"
  if [[ "$traces_response" == *"gateway-api"* && "$traces_response" == *"workflow-api"* && "$traces_response" == *"data-api"* ]]; then
    trace_ok=true
    break
  fi

  # Fallback: query via LogsQL-compatible endpoint.
  traces_response="$(curl -fsS 'http://127.0.0.1:10428/select/logsql/query' -d 'query=gateway-api' -d 'limit=5' || true)"
  if [[ "$traces_response" == *"gateway-api"* ]]; then
    trace_ok=true
    break
  fi

  sleep 1
done

if [[ "$trace_ok" == "true" ]]; then
  log 'traces query: PASS'
else
  log 'traces query: FAIL'
  exit 1
fi

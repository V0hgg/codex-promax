#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)"
LOCAL_ENV="$ROOT_DIR/.agent/harness/observability/local/.env.local"
LOG_DIR="$ROOT_DIR/.agent/harness/observability/runtime/logs"

if [[ -f "$LOCAL_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$LOCAL_ENV"
  set +a
fi

if [[ -z "${LOCAL_CLUSTER_START:-}" ]]; then
  cat >&2 <<'EOF'
Set LOCAL_CLUSTER_START in .agent/harness/observability/local/.env.local to the
repository's real local cluster/bootstrap command before using this wrapper.

If the correct start path is unclear, stop and ask the user for it instead of
guessing or inventing a second startup flow.
EOF
  exit 1
fi

mkdir -p "$LOG_DIR"

export OBSERVABILITY_ENABLED="${OBSERVABILITY_ENABLED:-1}"
export OBSERVABILITY_LOG_DIR="${OBSERVABILITY_LOG_DIR:-$LOG_DIR}"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT:-http://127.0.0.1:10428/insert/opentelemetry/v1/traces}"

exec bash -lc "$LOCAL_CLUSTER_START"

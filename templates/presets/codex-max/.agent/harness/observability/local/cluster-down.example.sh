#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)"
LOCAL_ENV="$ROOT_DIR/.agent/harness/observability/local/.env.local"

if [[ -f "$LOCAL_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$LOCAL_ENV"
  set +a
fi

if [[ -z "${LOCAL_CLUSTER_STOP:-}" ]]; then
  cat >&2 <<'EOF'
Set LOCAL_CLUSTER_STOP in .agent/harness/observability/local/.env.local to the
repository's real local shutdown command before using this wrapper.

If the repo has no clear stop path, ask the user how local cleanup is supposed
to work before killing shared processes.
EOF
  exit 1
fi

exec bash -lc "$LOCAL_CLUSTER_STOP"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

load_state

# Replace this command with your repository-specific local start path.
# If you onboard real telemetry later, prefer calling a wrapper under
# .agent/harness/observability/local/ that still reuses the existing local
# cluster or dev startup flow. If the correct local start path is not obvious,
# stop and ask the user for the real cluster/bootstrap command instead of
# inventing a new one.
exec python3 -m http.server "$APP_PORT" --bind 127.0.0.1

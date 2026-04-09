#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
E2E_DIR="$ROOT_DIR/test/e2e"
TEMPLATE_DIR="$E2E_DIR/dummy-app-template"
RUN_ROOT="${RUN_ROOT:-$E2E_DIR/.tmp/full-functional-$(date +%Y%m%d-%H%M%S)}"
KEEP_RUN_ROOT="${KEEP_RUN_ROOT:-false}"
INSTALL_MODE="${INSTALL_MODE:-local}" # local | npm

PACKAGE_NAME="${PACKAGE_NAME:-$(node -p "require('$ROOT_DIR/package.json').name")}"
PACKAGE_VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
TARGET_REPO="$RUN_ROOT/dummy-app"
STACK_UP=false
INIT_LOG="$RUN_ROOT/init.log"

log() {
  printf '[e2e] %s\n' "$1"
}

fail() {
  printf '[e2e] ERROR: %s\n' "$1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

cleanup() {
  if [[ "$STACK_UP" == "true" ]]; then
    docker compose -f "$TARGET_REPO/.agent/harness/observability/docker-compose.yml" down -v >/dev/null 2>&1 || true
  fi

  if [[ "$KEEP_RUN_ROOT" != "true" ]]; then
    rm -rf "$RUN_ROOT"
  else
    log "Keeping run directory: $RUN_ROOT"
  fi
}
trap cleanup EXIT

wait_http() {
  local name="$1"
  local url="$2"
  local attempts=0
  until curl -fsS "$url" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 60 ]]; then
      fail "$name did not become ready at $url"
    fi
    sleep 1
  done
}

verify_vector_started() {
  local logs
  logs="$(docker logs codex-observability-vector 2>&1 || true)"
  if ! printf '%s' "$logs" | grep -q 'Vector has started'; then
    fail "Vector did not report startup in container logs"
  fi
}

install_local_package() {
  local source_copy="$RUN_ROOT/package-source"
  local package_tgz

  log "Preparing isolated package source copy"
  mkdir -p "$source_copy"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude '.git' \
      --exclude 'node_modules' \
      --exclude 'test/e2e/.tmp' \
      "$ROOT_DIR/" "$source_copy/"
  else
    cp -R "$ROOT_DIR/." "$source_copy/"
    rm -rf "$source_copy/.git" "$source_copy/node_modules" "$source_copy/test/e2e/.tmp"
  fi

  npm -C "$source_copy" ci >/dev/null
  npm -C "$source_copy" pack --pack-destination "$RUN_ROOT" >/dev/null

  package_tgz="$(ls -1t "$RUN_ROOT"/"$PACKAGE_NAME"-*.tgz | head -n1)"
  [[ -f "$package_tgz" ]] || fail "Could not produce package tarball for $PACKAGE_NAME"

  log "Installing from local tarball: $(basename "$package_tgz")"
  npm -C "$TARGET_REPO" install --save-dev "$package_tgz" >/dev/null
}

install_npm_package() {
  log "Installing from npm registry: ${PACKAGE_NAME}@latest"
  npm -C "$TARGET_REPO" install --save-dev "${PACKAGE_NAME}@latest" >/dev/null
}

verify_docs_structure() {
  local required_files=(
    "AGENTS.md"
    "ARCHITECTURE.md"
    "CLAUDE.md"
    ".agent/context/README.md"
    ".agent/context/repo-overview.md"
    ".agent/context/commands.md"
    ".agent/context/testing.md"
    ".agent/context/architecture-notes.md"
    ".agent/prompts/onboard-repository.md"
    ".agent/prompts/validate-readiness.md"
    ".agent/prompts/debugging-handoff.md"
    ".agent/prompts/release-checks.md"
    ".agent/prompts/integrate-local-telemetry.md"
    ".claude/settings.json"
    ".claude/agents/browser-debugger.md"
    ".claude/agents/code-mapper.md"
    ".claude/agents/docs-researcher.md"
    ".claude/agents/reviewer.md"
    ".claude/rules/context-cache.md"
    ".claude/rules/verification.md"
    ".codex/config.toml"
    ".codex/agents/browser-debugger.toml"
    ".codex/agents/code-mapper.toml"
    ".codex/agents/docs-researcher.toml"
    ".codex/agents/reviewer.toml"
    ".mcp.json"
    ".opencode/agents/browser-debugger.md"
    ".opencode/agents/code-mapper.md"
    ".opencode/agents/docs-researcher.md"
    ".opencode/agents/reviewer.md"
    ".opencode/commands/implementation-plan.md"
    ".opencode/commands/review-changes.md"
    ".opencode/commands/validate-readiness.md"
    ".agents/skills/ui-legibility/SKILL.md"
    ".agent/harness/observability/fixture/emit-local-telemetry.py"
    ".agent/harness/observability/local/.gitignore"
    ".agent/harness/observability/local/README.md"
    ".agent/harness/observability/local/service-topology.example.yaml"
    ".agent/harness/observability/local/cluster-up.example.sh"
    ".agent/harness/observability/local/cluster-down.example.sh"
    ".agent/harness/observability/local/env.local.example"
    ".agent/harness/observability/runtime/.gitignore"
    ".agent/harness/observability/runtime/logs/.gitignore"
    "docs/design-docs/index.md"
    "docs/design-docs/core-beliefs.md"
    "docs/exec-plans/active/.gitkeep"
    "docs/exec-plans/completed/.gitkeep"
    "docs/exec-plans/tech-debt-tracker.md"
    "docs/generated/db-schema.md"
    "docs/generated/observability-validation.md"
    "docs/LOCAL_TELEMETRY_SETUP.md"
    "docs/OBSERVABILITY_RUNBOOK.md"
    "docs/product-specs/index.md"
    "docs/product-specs/new-user-onboarding.md"
    "docs/references/design-system-reference-llms.txt"
    "docs/references/nixpacks-llms.txt"
    "docs/references/uv-llms.txt"
    "docs/DESIGN.md"
    "docs/FRONTEND.md"
    "docs/PLANS.md"
    "docs/PRODUCT_SENSE.md"
    "docs/QUALITY_SCORE.md"
    "docs/RELIABILITY.md"
    "docs/SECURITY.md"
    "opencode.json"
  )

  for relative_path in "${required_files[@]}"; do
    [[ -f "$TARGET_REPO/$relative_path" ]] || fail "Missing expected scaffold file: $relative_path"
  done

  grep -q '.agent/context/' "$TARGET_REPO/AGENTS.md" || fail "AGENTS.md missing context cache guidance"
  grep -q '.agent/prompts/' "$TARGET_REPO/AGENTS.md" || fail "AGENTS.md missing prompt guidance"
  grep -q '.agent/context/' "$TARGET_REPO/CLAUDE.md" || fail "CLAUDE.md missing context cache guidance"
  grep -q '.agent/prompts/' "$TARGET_REPO/CLAUDE.md" || fail "CLAUDE.md missing prompt guidance"
  grep -q '\[mcp_servers.chrome_devtools\]' "$TARGET_REPO/.codex/config.toml" || fail "Missing chrome_devtools MCP block"
  grep -q '\[mcp_servers.observability\]' "$TARGET_REPO/.codex/config.toml" || fail "Missing observability MCP block"
  grep -q 'project_doc_fallback_filenames' "$TARGET_REPO/.codex/config.toml" || fail "Missing Codex project doc fallback config"
  grep -q '\[agents\]' "$TARGET_REPO/.codex/config.toml" || fail "Missing Codex agents block"
  grep -q 'Integrate Local Telemetry Prompt' "$TARGET_REPO/.agent/prompts/integrate-local-telemetry.md" || fail "Missing telemetry onboarding prompt"
  grep -q 'If the correct start path cannot be inferred safely' "$TARGET_REPO/.agent/prompts/integrate-local-telemetry.md" || fail "Telemetry prompt missing safe handoff guidance"
  grep -q 'service-topology.example.yaml' "$TARGET_REPO/.agent/prompts/integrate-local-telemetry.md" || fail "Telemetry prompt missing topology artifact guidance"
  grep -q 'codex-promax prompt telemetry' "$TARGET_REPO/docs/LOCAL_TELEMETRY_SETUP.md" || fail "Telemetry guide missing prompt command"
  grep -q 'cluster/bootstrap' "$TARGET_REPO/docs/LOCAL_TELEMETRY_SETUP.md" || fail "Telemetry guide missing cluster guidance"
  grep -q '.agent/prompts/validate-readiness.md' "$TARGET_REPO/docs/OBSERVABILITY_RUNBOOK.md" || fail "Runbook missing readiness playbook guidance"
  grep -qi 'I just installed codex-promax' "$TARGET_REPO/docs/OBSERVABILITY_RUNBOOK.md" || fail "Runbook missing natural-language validation prompt"
  grep -q 'query_logs' "$TARGET_REPO/docs/OBSERVABILITY_RUNBOOK.md" || fail "Runbook missing MCP query guidance"
  grep -q 'docs/generated/observability-validation.md' "$TARGET_REPO/docs/OBSERVABILITY_RUNBOOK.md" || fail "Runbook missing validation report target"
  grep -q 'Ready for Codex coding work: YES/NO' "$TARGET_REPO/docs/generated/observability-validation.md" || fail "Validation report missing readiness status field"

  python3 - "$TARGET_REPO/.codex/config.toml" <<'PY'
import pathlib
import sys
import tomllib

tomllib.loads(pathlib.Path(sys.argv[1]).read_text())
print("codex config: OK")
PY

  python3 - "$TARGET_REPO/.claude/settings.json" "$TARGET_REPO/.mcp.json" "$TARGET_REPO/opencode.json" <<'PY'
import json
import pathlib
import sys

for file_path in sys.argv[1:]:
    json.loads(pathlib.Path(file_path).read_text())

print("json configs: OK")
PY

  python3 - "$TARGET_REPO/opencode.json" <<'PY'
import json
import pathlib
import sys

config = json.loads(pathlib.Path(sys.argv[1]).read_text())
instructions = config.get("instructions")
if not isinstance(instructions, list):
    raise SystemExit("opencode instructions must be a list")

for expected in [".agent/context/*.md", ".agent/prompts/*.md"]:
    if expected not in instructions:
        raise SystemExit(f"missing opencode instruction: {expected}")

print("opencode instructions: OK")
PY
}

main() {
  need_cmd git
  need_cmd node
  need_cmd npm
  need_cmd npx
  need_cmd python3
  need_cmd curl
  need_cmd docker

  docker info >/dev/null 2>&1 || fail "Docker daemon is not available"

  [[ -d "$TEMPLATE_DIR" ]] || fail "Missing fixture template directory: $TEMPLATE_DIR"

  rm -rf "$RUN_ROOT"
  mkdir -p "$RUN_ROOT"
  cp -R "$TEMPLATE_DIR" "$TARGET_REPO"

  log "Run directory: $RUN_ROOT"
  log "Target repo: $TARGET_REPO"
  log "Testing package: $PACKAGE_NAME@$PACKAGE_VERSION (mode=$INSTALL_MODE)"

  git -C "$TARGET_REPO" init >/dev/null

  if [[ "$INSTALL_MODE" == "local" ]]; then
    install_local_package
  elif [[ "$INSTALL_MODE" == "npm" ]]; then
    install_npm_package
  else
    fail "Unsupported INSTALL_MODE=$INSTALL_MODE (expected local or npm)"
  fi

  log "Running init + doctor"
  npx --yes --prefix "$TARGET_REPO" "$PACKAGE_NAME" init --root "$TARGET_REPO" | tee "$INIT_LOG"
  grep -q 'Codex-Promax is ready\.' "$INIT_LOG" || fail "Init output missing ready summary"
  grep -q 'telemetry prompt:' "$INIT_LOG" || fail "Init output missing telemetry prompt command heading"
  grep -q '.agent/prompts/integrate-local-telemetry.md' "$INIT_LOG" || fail "Init output missing saved prompt file path"
  grep -q 'paste it into your coding agent in this repo' "$INIT_LOG" || fail "Init output missing agent handoff guidance"
  grep -q 'cluster/bootstrap start path' "$INIT_LOG" || fail "Init output missing cluster-first guidance"
  grep -q 'npx -y codex-promax@latest doctor' "$INIT_LOG" || fail "Init output missing npx doctor command"
  if grep -Eq '^(Create|Skip|Update):' "$INIT_LOG"; then
    fail "Init output should be quiet by default"
  fi
  npx --yes --prefix "$TARGET_REPO" "$PACKAGE_NAME" init --root "$TARGET_REPO" --verbose | grep -q '^Skip:' || fail "Init --verbose should show file-level actions"
  npx --yes --prefix "$TARGET_REPO" "$PACKAGE_NAME" doctor --root "$TARGET_REPO"

  log "Validating generated docs and MCP config"
  verify_docs_structure

  log "Validating worktree runtime scripts"
  bash "$TARGET_REPO/.agent/harness/worktree/up.sh" >/dev/null
  app_port="$(bash "$TARGET_REPO/.agent/harness/worktree/status.sh" | awk -F= '/^app_port=/{print $2}')"
  [[ -n "$app_port" ]] || fail "Unable to parse app_port from worktree status output"
  wait_http "dummy app" "http://127.0.0.1:$app_port"
  bash "$TARGET_REPO/.agent/harness/worktree/down.sh" >/dev/null

  log "Starting observability stack"
  docker compose -f "$TARGET_REPO/.agent/harness/observability/docker-compose.yml" up -d >/dev/null
  STACK_UP=true

  wait_http "victoria-logs" "http://127.0.0.1:9428/health"
  wait_http "victoria-metrics" "http://127.0.0.1:8428/health"
  wait_http "victoria-traces" "http://127.0.0.1:10428/health"
  wait_http "vector api" "http://127.0.0.1:8686/health"

  log "Checking Vector service startup and API health"
  verify_vector_started

  log "Running generated observability smoke script"
  bash "$TARGET_REPO/.agent/harness/observability/smoke.sh"

  log "Checking prompt telemetry CLI output"
  npx --yes --prefix "$TARGET_REPO" "$PACKAGE_NAME" prompt telemetry | grep -q 'Integrate Local Telemetry Prompt'

  log "Checking prompt install CLI output"
  install_prompt="$(npx --yes --prefix "$TARGET_REPO" "$PACKAGE_NAME" prompt install)"
  printf '%s' "$install_prompt" | grep -q 'Install Codex-Promax in this repository end-to-end.' || fail "Install prompt missing heading"
  printf '%s' "$install_prompt" | grep -q 'npx -y codex-promax@latest init --preset codex-max --assistants all' || fail "Install prompt missing init command"
  printf '%s' "$install_prompt" | grep -q 'npx -y codex-promax@latest doctor --preset codex-max --assistants all' || fail "Install prompt missing doctor command"
  printf '%s' "$install_prompt" | grep -q '.agent/prompts/integrate-local-telemetry.md' || fail "Install prompt missing telemetry path"

  log "Checking MCP observability tools"
  node "$E2E_DIR/mcp-observability-check.mjs" "$TARGET_REPO"

  docker compose -f "$TARGET_REPO/.agent/harness/observability/docker-compose.yml" down -v >/dev/null
  STACK_UP=false

  log "PASS: full functional verification complete"
}

main "$@"

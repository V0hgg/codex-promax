# Local Telemetry Setup

Use this guide after `codex-promax init` when you want the packaged observability MCP tools to read telemetry from your real local services.

## What This Setup Does

The scaffold already gives you:

- a local observability stack under `.agent/harness/observability/`
- MCP query tools for raw logs/metrics/traces plus richer service-level metrics and trace lookup
- a stronger smoke check that proves the local ingestion contract works

What it does not know yet is how your repository starts its real local service graph. That last mile is repository-specific, so Codex-Promax gives you a prompt to paste into your coding agent instead of mutating the repository automatically.

## What Stays Unchanged

This workflow is designed to stay local-only:

- do not replace deployment scripts
- do not change production defaults
- do not add required production dependencies just for local observability
- keep any new metrics or tracing code dormant unless local observability is explicitly enabled

## Files To Use

- `.agent/prompts/integrate-local-telemetry.md`
- `.agent/harness/observability/`
- `.agent/harness/observability/local/`
- `.agent/harness/observability/local/service-topology.example.yaml`
- `.agent/harness/observability/local/cluster-up.example.sh`
- `.agent/harness/observability/local/cluster-down.example.sh`
- `.agent/harness/observability/local/env.local.example`
- `.agent/harness/observability/runtime/logs/`
- `docs/generated/observability-validation.md`

Reprint the same prompt later with:

```bash
codex-promax prompt telemetry
```

## Recommended Flow

1. Start from the repository root.
2. Open `.agent/prompts/integrate-local-telemetry.md`.
3. Paste that prompt into your coding agent.
4. Let the agent inspect the existing local start path first.
5. Prefer wrapping the existing cluster/bootstrap script or dev launcher instead of inventing a second startup flow.
6. If the repo does not reveal the correct start path safely, let the agent ask you for that command and any required setup steps.
7. Review any new local-only wrapper, topology, or env example files before running them.
8. Fill in missing credentials only in ignored local files if the agent asks for them.
9. Confirm the final evidence was written to `docs/generated/observability-validation.md`.

## Expected Local Contract

The agent should aim for this shape:

- one user-visible request can be traced across the real local service chain, not just one service in isolation
- logs land in `.agent/harness/observability/runtime/logs/<service>.log`
- Vector scrapes one or more real local metrics endpoints you configure in `.agent/harness/observability/vector/vector.yaml`, or a local-only relay/sidecar that makes those metrics reachable from the observability network
- service-level metrics carry a stable `service="<name>"` label whenever possible so the packaged MCP server can summarize them
- local traces are exported to the VictoriaTraces endpoint at `http://127.0.0.1:10428/insert/opentelemetry/v1/traces` or an equivalent local-only OTEL path
- the service graph is captured in a committed topology file adapted from `.agent/harness/observability/local/service-topology.example.yaml`

If your repo already has a better local convention, adapt the harness to that convention instead of forcing unnecessary abstraction.

## Missing Credentials Or External Dependencies

If local startup depends on secrets, tokens, cloud credentials, or external services:

- keep real secrets in ignored files under `.agent/harness/observability/local/`
- commit only examples, templates, or setup notes
- let the agent ask you for the real cluster/bootstrap command if it cannot infer it safely
- stop with a clear blocker if the repository cannot be validated safely without user input

## Validation

Start with scaffold health:

```bash
codex-promax doctor
docker compose -f .agent/harness/observability/docker-compose.yml up -d
bash .agent/harness/observability/smoke.sh
docker compose -f .agent/harness/observability/docker-compose.yml down -v
```

Then run the repository-specific validation from your coding agent session and capture the evidence in `docs/generated/observability-validation.md`.

# Integrate Local Telemetry Prompt

Paste this prompt into your coding agent from the repository root after `codex-promax init`.

You are integrating this repository with the Codex-Promax local observability harness that already exists under `.agent/harness/observability/`.

## Goal

Connect the repository's real local service graph to the existing logs, metrics, and traces pipeline so the Codex-Promax MCP tools (`query_logs`, `query_metrics`, `query_traces`) return real application telemetry instead of only scaffold health signals. If one user-visible request depends on several services, treat that clustered path as the primary local runtime to onboard.

## Hard Rules

1. Inspect the repository before editing anything. Read `AGENTS.md`, `.agent/context/`, `docs/LOCAL_TELEMETRY_SETUP.md`, `.agent/prompts/validate-readiness.md`, and the files under `.agent/harness/observability/`.
2. Discover the real local service graph first. Reuse the existing local start path if one already exists, such as a cluster bootstrap script, `make` target, `docker compose` flow, monorepo dev launcher, or supervisor command. If the correct start path cannot be inferred safely, stop and ask the user for the exact command and setup steps before inventing a new one. Do not replace deployment scripts or production commands.
3. Keep deployment manifests, production defaults, and CI behavior unchanged. Any code changes for metrics or tracing must stay dormant unless local observability is explicitly enabled.
4. Prefer a local-only wrapper under `.agent/harness/observability/local/` and update `.agent/harness/worktree/app-start.sh` only if it helps route the existing local startup flow through that wrapper. Use `.agent/harness/observability/local/service-topology.example.yaml`, `cluster-up.example.sh`, `cluster-down.example.sh`, and `env.local.example` as the shape to adapt.
5. Route logs into `.agent/harness/observability/runtime/logs/<service>.log` when possible by redirecting stdout/stderr or configuring the existing local launcher to write there.
6. For metrics, reuse existing per-service `/metrics` endpoints when available. Update `.agent/harness/observability/vector/vector.yaml` so the scrape targets match the real reachable local service ports or a local-only relay. If Docker on this workstation cannot reach host ports directly, add a local-only relay or sidecar that republishes those metrics into the observability network instead of changing deployment behavior. If metrics do not exist yet, add the smallest safe local-only metrics path and gate it behind an explicit local observability flag.
7. For traces, prefer local-only OpenTelemetry configuration. The simplest target is `http://127.0.0.1:10428/insert/opentelemetry/v1/traces` via `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` or equivalent service-specific settings. Preserve service identity across spans and make one real request visible across multiple services, not only one leaf process.
8. Never invent secrets or credentials. If local startup depends on missing tokens, API keys, or cloud credentials, create or update example files and setup notes under `.agent/harness/observability/local/`, then stop with a clear blocker.
9. Keep shared scaffold files committed. Only runtime logs, caches, pid files, and local secret material belong in ignored paths.
10. Record verification evidence in `docs/generated/observability-validation.md`.

## Required Workflow

1. Identify the real local start path for this repository. If one request depends on several services, treat that whole chain as the unit to start and validate. If there is already a script that starts multiple services, wrap it instead of replacing it.
2. If the start path is unclear, ask the user for the correct startup command, bootstrap script, required credentials, and any non-obvious external services before changing runtime behavior.
3. Capture the local service graph in `.agent/harness/observability/local/service-topology.yaml` or an equivalent repo-specific file adapted from the example. Include service names, dependency edges, runtime log files, metrics endpoints, trace service names, and pass-through external dependencies.
4. Create a local-only telemetry wrapper if needed. The wrapper may export `OBSERVABILITY_ENABLED=1`, local OTEL env vars, log redirection, and repo-specific local env before calling the existing local startup path.
5. Make the observability stack ingest real signals:
   - logs from files under `.agent/harness/observability/runtime/logs/`
   - metrics from real local HTTP endpoints scraped by Vector, one endpoint per service or via a local-only relay
   - traces from local-only OpenTelemetry export settings with preserved service identity
6. If the repository already exposes logs or metrics in a different safe local path, adapt the harness to that path rather than forcing a worse abstraction.
7. Validate end to end:
   - `codex-promax doctor`
   - start the observability Docker stack
   - start the repository's local services through the reused or wrapped local start path
   - send one real request through the highest-level user-facing entrypoint you can validate safely
   - confirm each service touched by that request emits logs, metrics, and traces that reach the stack
   - use the MCP tools or equivalent direct backend checks
8. If validation fails, apply the smallest safe fix and re-run the same checks.
9. Update `docs/generated/observability-validation.md` with commands run, key evidence, and the final PASS/FAIL state.

## Deliverable

When you are done, report:

- which local cluster/bootstrap or dev start path you reused
- whether you had to ask the user for startup or credential details
- which service topology file you added or updated
- which wrapper or local-only files you added
- where logs are written for each service
- which metrics endpoints are scraped or relayed
- which trace env vars or instrumentation gates were added
- which end-to-end request you used for validation
- which commands you ran
- whether `query_logs`, `query_metrics`, and `query_traces` now return real application telemetry
- any remaining blockers or manual credential/setup steps

---
name: init-harness
description: "Inspect a repository and set up a complete local coding-agent harness: startup, logs, metrics, traces, browser checks, memory, config examples, and validation."
---

# Init Harness

Use this skill when the user asks you to prepare a repository so coding agents can run, observe, debug, and validate the real local system with minimal user handwork.

## Outcome

Leave the repository with a complete local harness. The user should not need to invent startup scripts, log routing, tracing config, service topology, or validation docs. If secrets, databases, service accounts, ports, or external endpoints are required, create prepared example files and tell the user exactly which values to fill in.

## Workflow

1. Read the root instructions first: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agent/context/`, `.agent/memory/`, and relevant docs. Use `.agent/memory/` to avoid repeating previously confirmed discovery.
2. Define success before editing. State the concrete harness outputs you will create and the checks that prove them.
3. Detect the repository shape: monolith, frontend app, backend API, full-stack app, worker, CLI, library, or microservice graph.
4. Find the real local start path by inspecting package scripts, Makefiles, compose files, dev scripts, process managers, README setup, tests, and existing cluster or worktree scripts.
5. Preserve existing project commands. Wrap or document them instead of replacing them.
6. If local startup is ambiguous or blocked by missing external values, create prepared files and ask only for the missing values. Do not ask the user to design the harness.
7. Create or update local harness scripts as needed:
   - `.agent/harness/start.sh`
   - `.agent/harness/stop.sh`
   - `.agent/harness/status.sh`
   - `.agent/harness/env.local.example`
   - `.agent/harness/service-topology.yaml`
   - app-specific wrappers under `.agent/harness/` when a repository needs them
8. Wire logs into `.agent/harness/runtime/logs/<service>.log` or a documented existing log path. Keep runtime logs out of git.
9. Wire metrics by reusing existing `/metrics` endpoints when available. Add local-only metrics behind an explicit local flag only when the framework has a safe standard pattern.
10. Wire traces through local OpenTelemetry endpoints or documented framework-specific adapters. Keep production tracing defaults unchanged.
11. Wire browser or UI checks for frontend and full-stack apps when a browser MCP, Playwright setup, or local browser harness is available.
12. Prepare MCP setup for local observability if the scaffold exists under `.agent/harness/mcp/observability-server/`.
13. Record durable, verified discoveries in `.agent/memory/`. Keep memory short, dated, evidence-based, and secret-free.
14. Write validation evidence to `docs/generated/harness-validation.md`.
15. Run the narrowest meaningful checks first, then broaden. Fix failures you introduced.
16. Finish with exact commands run, observed evidence, files the user must fill in, and any evidence-backed blockers.

## Repository Shapes

For a monolith, create one start/stop/status path and one service entry.

For microservices, create a topology with every service, dependency, port, health check, log path, metric endpoint, trace service name, and startup command you can verify.

For frontend apps, identify the dev server command, default URL, browser check path, and where client/runtime logs can be inspected.

For backend APIs, identify the API start command, health endpoint, logs, metrics, traces, database requirements, and local env file.

For workers and queues, identify worker commands, broker requirements, retry/dead-letter visibility, logs, and smoke jobs.

For CLIs and libraries, create validation commands, fixture data, and a minimal local run script instead of pretending there is a long-running service.

## Memory Rules

Use `.agent/memory/` only for durable project knowledge that prevents repeat rediscovery. Include the date, source file or command evidence, and a short conclusion. Never write secrets, tokens, passwords, private keys, customer data, or raw production logs into memory.

## Coding Rules

Keep changes minimal and repo-native. Prefer existing scripts, framework conventions, and tests. State uncertainty when behavior is ambiguous. Verify actual runtime behavior before claiming success. Do not add speculative abstractions or production behavior changes just to make the local harness easier.

# Plans

## Planning Conventions

- Every non-trivial change starts with an ExecPlan.
- Each milestone must include executable validation commands.
- Completion claims must include direct evidence from command output.

## Required Acceptance Evidence

For changes touching harness, observability, or MCP integrations, include:

- `codex-promax doctor` output
- smoke script status for logs, metrics, traces
- MCP tool call evidence for `query_logs`, `query_metrics`, `query_traces`
- updated `docs/generated/observability-validation.md`

## Planning Cadence

- Keep plans in `docs/exec-plans/active/` while in progress.
- Move completed plans to `docs/exec-plans/completed/` with final outcomes.
- Track unresolved risks in `docs/exec-plans/tech-debt-tracker.md`.

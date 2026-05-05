# Skills

Veloran ships three core skills to selected app skill surfaces.

## init-harness

Prepare the complete local coding-agent harness: startup, shutdown, status, logs, metrics, traces, browser checks, memory, config examples, and validation evidence.

The skill starts by reading Veloran knowledge from `.agent/knowledge/INDEX.md`, composing user-global, project, and nested path knowledge from broad to specific. New repo-specific facts and standards should default to project-local knowledge; global knowledge needs user approval or repeated cross-repository evidence.

## execplan-create

Create a self-contained ExecPlan under `.agent/execplans/` while following `.agent/PLANS.md`.

## execplan-execute

Execute an ExecPlan milestone-by-milestone, keep the plan log current, run validation, and stop only at completion or an evidence-backed blocker.

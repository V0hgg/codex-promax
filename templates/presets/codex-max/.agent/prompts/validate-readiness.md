# Validate Readiness Prompt

Use this prompt before claiming a feature, fix, or refactor is complete.

## Goal

Prove the change is ready with evidence, not intuition.

## Workflow

1. Identify the narrowest commands that validate the touched behavior.
2. Run targeted checks first, then broader checks if the change affects shared paths.
3. Confirm generated files, config syntax, or runtime scripts still parse or execute correctly.
4. Record any skipped verification explicitly, with the reason and residual risk.

## Deliverable

Report:

- what changed
- which commands were run
- the outcome of each command
- any remaining uncertainty

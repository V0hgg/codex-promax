# Debugging Handoff Prompt

Use this prompt when handing a bug investigation from one agent or session to another.

## Goal

Preserve the root-cause trail so the next agent can continue from evidence instead of restarting the investigation.

## Workflow

1. State the observed symptom and exact failure surface.
2. List the code paths, logs, commands, or diffs already checked.
3. Separate confirmed facts from open hypotheses.
4. Name the most likely next diagnostic step.
5. Update the relevant `.agent/context/` note if the discovery is durable.

## Deliverable

A short handoff that covers cause, evidence gathered so far, next step, and known risks.

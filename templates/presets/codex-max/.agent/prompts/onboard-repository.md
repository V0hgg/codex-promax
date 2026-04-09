# Repository Onboarding Prompt

Use this prompt when an agent is entering the repository for the first time and needs a fast, practical understanding before making changes.

## Goal

Build a working mental model of the repository without rereading the same material others have already confirmed.

## Workflow

1. Read `README.md`, the root instruction files, and the most relevant notes in `.agent/context/`.
2. Identify the user request, the likely execution path, and the smallest set of files that control it.
3. Confirm the current behavior from code before proposing edits.
4. Record any durable new findings back into `.agent/context/` after verification.

## Deliverable

Produce a short orientation note covering the relevant code paths, likely risks, and the fastest validation command.

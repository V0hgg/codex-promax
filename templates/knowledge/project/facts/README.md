---
id: veloran.project.facts.readme
kind: fact
scope: project
appliesTo:
  - "**"
priority: 10
status: active
lastVerified: 2026-05-05
expires: never
source: generated-by-veloran
---

# Project Facts

Store verified repository facts here. A fact should include the date, source path or command evidence, and the conclusion.

Good facts:

- The backend starts with `npm run dev:api`, verified by command output on a specific date.
- The package publishes through a GitHub release workflow, verified by workflow URL.
- The local harness writes logs to a specific runtime directory, verified by a smoke run.

Do not store guesses. Use `status: draft` for proposed facts that still need verification.

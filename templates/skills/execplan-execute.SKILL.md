---
name: execplan-execute
description: Execute an ExecPlan milestone-by-milestone until DoD is satisfied; keep plan logs updated
---
When invoked:
1) Open the specified ExecPlan file.
2) If `.agent/knowledge/INDEX.md`, `.agent/context/`, or `.agent/memory/` exists, read the relevant entries before rediscovering project facts. Use `veloran knowledge print --path <repo-or-subdir> --touched <file>` when scoped knowledge selection is unclear.
3) Execute milestone-by-milestone, without asking the user for “next steps”.
4) Keep Progress / Surprises & Discoveries / Decision Log / Outcomes & Retrospective up to date as you work.
5) Run validation commands; fix failures.
6) Stop only when DoD is satisfied or you are truly blocked (then record the blocker and a proposed default decision in the plan).

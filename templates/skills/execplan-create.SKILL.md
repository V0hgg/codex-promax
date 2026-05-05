---
name: execplan-create
description: Create or refine an ExecPlan following .agent/PLANS.md and save it to .agent/execplans/<slug>.md
---
When invoked:
1) Read .agent/PLANS.md fully.
2) If `.agent/knowledge/INDEX.md`, `.agent/context/`, or `.agent/memory/` exists, read the relevant entries before rediscovering project facts. Use `veloran knowledge print --path <repo-or-subdir> --touched <file>` when scoped knowledge selection is unclear.
3) Create or update an ExecPlan file under .agent/execplans/.
4) Ensure the plan is fully self-contained and includes the required living sections:
   - Progress
   - Surprises & Discoveries
   - Decision Log
   - Outcomes & Retrospective
5) Ensure milestones include explicit validation commands and an explicit Definition of Done.
6) Save the plan.

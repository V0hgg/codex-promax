<!-- execplans:begin -->
# ExecPlans

This repository uses ExecPlans. The ExecPlan requirements are defined in `.agent/PLANS.md`.

When working on complex features or significant refactors:
- Create an ExecPlan in `.agent/execplans/` following `.agent/PLANS.md` exactly.
- When implementing an ExecPlan, proceed milestone-by-milestone without asking for “next steps”.
- Only stop when the plan’s Definition of Done is satisfied, or you are truly blocked (then record the blocker and a proposed default decision in the plan).

If `.agent/context/` exists, read the relevant note before rediscovering a service, module, or workflow, and update or add a note when you confirm durable project knowledge.

If `.agent/prompts/` or `.agent/playbooks/` exists, use the relevant file for recurring flows like onboarding, readiness checks, debugging handoff, and release validation.
<!-- execplans:end -->

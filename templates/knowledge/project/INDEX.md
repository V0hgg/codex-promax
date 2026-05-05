---
id: veloran.project.index
kind: doc
scope: project
appliesTo:
  - "**"
priority: 10
status: active
lastVerified: 2026-05-05
expires: never
source: generated-by-veloran
---

# Project Knowledge Index

This directory is the repository-local Veloran knowledge layer. Read this index before repeating repository discovery, then load only the topic files that match the current task, paths, or touched files.

Load order is broad to specific:

1. User-global knowledge from `~/.veloran/knowledge/`
2. Repository knowledge from `.agent/knowledge/`
3. Nested path knowledge from child `.agent/knowledge/` directories

Knowledge kinds:

- `rule`: agent behavior that should be followed.
- `standard`: a repeatable technical policy with validation.
- `fact`: verified repository knowledge with date and evidence.
- `doc`: a longer reference or runbook to lazy-load when relevant.

Default to local project knowledge for repository paths, commands, services, ports, dependencies, and validation facts. Promote to user-global knowledge only when the item is reusable across repositories and has explicit user approval or repeated evidence from multiple repositories.

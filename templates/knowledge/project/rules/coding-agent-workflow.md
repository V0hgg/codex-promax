---
id: veloran.rules.coding-agent-workflow
kind: rule
scope: project
appliesTo:
  - "**"
priority: 50
status: active
lastVerified: 2026-05-05
expires: never
source: generated-by-veloran
---

# Coding Agent Workflow

Before editing, read the root instructions and the relevant Veloran knowledge index. Use existing context, memory, facts, standards, and docs to avoid repeated discovery.

When new durable knowledge is discovered, classify it before writing:

1. Reject it if it contains secrets or private data.
2. Store it as local project knowledge if it names repo paths, commands, packages, services, ports, env files, tests, or local harness behavior.
3. Store it as nested path knowledge if it only applies to one app, service, package, or subdirectory.
4. Propose user-global knowledge only when it is reusable across repositories and has user approval or repeated evidence.
5. Keep uncertain knowledge as `status: draft` until verified.

Keep edits minimal, reuse repository patterns, and verify behavior before claiming completion.

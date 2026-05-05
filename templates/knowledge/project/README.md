---
id: veloran.project.readme
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

# Project Knowledge

Use this folder for durable, evidence-backed repository knowledge that prevents repeated rediscovery.

Create project knowledge when the agent verifies stable repository behavior, such as startup commands, test commands, service topology, app-specific standards, local harness details, or docs that future agents should find quickly.

Update project knowledge when the evidence changes, when a command is reverified, when a standard gains a better validation command, or when `appliesTo` is too broad.

Archive project knowledge when validation fails, files no longer exist, the user contradicts it, or it becomes noisy. Prefer `status: archived` over deleting history.

Never store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in this directory.

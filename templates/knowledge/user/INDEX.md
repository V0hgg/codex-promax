---
id: veloran.user.index
kind: doc
scope: user
appliesTo:
  - "**"
priority: 10
status: active
lastVerified: 2026-05-05
expires: never
source: generated-by-veloran
---

# User Knowledge Index

This directory is the user-global Veloran knowledge layer. It applies before repository-local knowledge and should stay small, reusable, and safe.

Use global knowledge for durable preferences, cross-repository agent rules, reusable standards, and high-level docs that should apply in many projects.

Do not add repository-specific commands, ports, service names, package names, private paths, or one-off facts here. Keep those in the repository's `.agent/knowledge/` directory.

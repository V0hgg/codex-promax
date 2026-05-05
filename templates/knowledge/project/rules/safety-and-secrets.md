---
id: veloran.rules.safety-and-secrets
kind: rule
scope: project
appliesTo:
  - "**"
priority: 100
status: active
lastVerified: 2026-05-05
expires: never
source: generated-by-veloran
---

# Safety And Secrets

Do not store secrets, tokens, passwords, private keys, session cookies, customer data, raw production logs, or personal data in knowledge files, memory, context, plans, prompts, docs, transcripts, validation logs, or generated artifacts.

If a task needs secret values, prepare example config files and tell the user exactly which values to fill in. Store only placeholder names and setup instructions.

Security and privacy rules are protected. Narrower local rules may add stricter requirements, but they must not silently weaken this rule.

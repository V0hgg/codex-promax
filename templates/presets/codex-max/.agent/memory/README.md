# Agent Memory

Use this directory for durable, verified project knowledge that helps future coding agents avoid repeating the same discovery.

Good memory entries are short and specific:

- Date confirmed.
- Evidence source, such as a file path, command, test, log, or runtime observation.
- The conclusion future agents should reuse.
- Any known expiry condition.

Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data here.

Use `.agent/context/` for curated onboarding notes. Use `.agent/memory/` for facts discovered while working that are likely to matter again.

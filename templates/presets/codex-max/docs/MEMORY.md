# Agent Memory

`.agent/memory/` stores durable project facts that future coding agents can reuse.

Write memory only after verification. Keep entries small, dated, and tied to evidence. Prefer facts like:

- the confirmed local start command
- a known test command for a subsystem
- a resolved debugging cause
- a service topology detail that is not obvious from one file

Do not store secrets, private keys, passwords, customer data, raw production logs, or temporary guesses.

If a fact is likely to change, include the expiry condition or say when it should be rechecked.

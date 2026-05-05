# Agent Memory And Knowledge

`.agent/memory/` stores durable project facts that future coding agents can reuse.

Write memory only after verification. Keep entries small, dated, and tied to evidence. Prefer facts like:

- the confirmed local start command
- a known test command for a subsystem
- a resolved debugging cause
- a service topology detail that is not obvious from one file

Do not store secrets, private keys, passwords, customer data, raw production logs, or temporary guesses.

If a fact is likely to change, include the expiry condition or say when it should be rechecked.

`.agent/knowledge/` stores structured rules, standards, facts, and docs with YAML frontmatter. Agents should read `.agent/knowledge/INDEX.md`, then load only the topic files relevant to the task or touched paths.

Knowledge composes from user-global `~/.veloran/knowledge/` to repository `.agent/knowledge/` to nested path `.agent/knowledge/` directories. Default new knowledge to project-local scope. Write user-global knowledge only with explicit user approval or repeated cross-repository evidence.

Inspect active knowledge with:

```bash
veloran knowledge print --path . --touched src/example.ts
```

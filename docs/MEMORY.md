# Memory And Knowledge

Veloran-generated repositories use `.agent/memory/` for durable, verified project knowledge.

Memory entries should be short, dated, evidence-backed, and useful for preventing repeated discovery. Good entries include confirmed local start commands, validated test commands, resolved debugging causes, or service topology facts.

Veloran-generated repositories also use `.agent/knowledge/` for structured rules, standards, facts, and docs. Knowledge is indexed by YAML frontmatter and composes from user-global `~/.veloran/knowledge/` to project `.agent/knowledge/` to nested path `.agent/knowledge/` directories.

Use project-local knowledge for repo paths, commands, services, validation facts, and harness details. Use user-global knowledge only for reusable preferences or standards approved by the user or proven across repositories.

Inspect active knowledge with:

```bash
veloran knowledge print --path . --touched src/example.ts
```

Validate knowledge with:

```bash
veloran knowledge doctor --path .
```

Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or temporary guesses.

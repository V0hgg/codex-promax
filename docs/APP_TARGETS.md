# App Targets

Veloran supports these app IDs through `--apps`:

- `agents`: `AGENTS.md` and shared skills.
- `codex`: `AGENTS.md`, `.codex/config.toml`, Codex agents, MCP entries, and shared skills.
- `claude`: `CLAUDE.md`, `.claude/settings.json`, `.mcp.json`, Claude agents, and native skills.
- `opencode`: `AGENTS.md`, `opencode.json`, OpenCode agents/commands, and shared skills.
- `antigravity`: `GEMINI.md`, workspace `.agent/skills`, and Antigravity setup docs.
- `augment`: compatibility root instruction target.
- `common`: alias for `agents`.
- `all`: every supported target.

`--assistants` remains a compatibility alias for `--apps`.

Harness installs also create Veloran knowledge indexes. Project installs write `.agent/knowledge/`; user installs write `.veloran/knowledge/` under the chosen user home. App prompt files point agents at the index so rules, standards, facts, and docs can be loaded selectively instead of copied into every prompt.

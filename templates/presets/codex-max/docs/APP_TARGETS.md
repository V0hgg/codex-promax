# App Targets

Veloran can prepare files for multiple coding-agent apps.

## Generic AGENTS

- `AGENTS.md`
- `.agents/skills/<skill>/SKILL.md`

## Codex

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- shared skills in `.agents/skills/`

## Claude Code

- `CLAUDE.md`
- `.claude/settings.json`
- `.mcp.json`
- `.claude/agents/*.md`
- `.claude/skills/<skill>/SKILL.md`

## OpenCode

- `AGENTS.md`
- `opencode.json`
- `.opencode/agents/*.md`
- `.opencode/commands/*.md`
- shared skills in `.agents/skills/`

## Google Antigravity

- `GEMINI.md`
- workspace skills in `.agent/skills/<skill>/SKILL.md`
- Antigravity MCP setup notes in `docs/ANTIGRAVITY_SETUP.md`

User-scope installs can place skills under user-global directories, but project-scope installs are the safest default because they are reviewable and versioned with the repository.

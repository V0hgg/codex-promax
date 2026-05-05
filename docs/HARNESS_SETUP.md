# Harness Setup

Veloran installs a coding-agent harness for project-local development and validation.

Use:

```bash
npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes
npx -y veloran@latest doctor --apps codex,claude,opencode,antigravity --preset harness
npx -y veloran@latest prompt init-harness
```

The generated `init-harness` skill tells a coding agent how to discover the real local start path, prepare start/stop/status scripts, wire logs, metrics, traces, browser checks, memory, config examples, and validation evidence.

Use user scope only when you intentionally want global skills:

```bash
npx -y veloran@latest init --scope user --apps codex,claude,antigravity --dry-run
```

Real user-scope writes require `--yes` or interactive confirmation.

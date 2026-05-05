# Veloran

Veloran installs a coding-agent harness for Codex, Claude Code, OpenCode, Google Antigravity, and `AGENTS.md`-compatible tools.

It gives agents the files they need to prepare a real local workflow: instructions, skills, ExecPlans, context, memory, knowledge, harness scripts, observability scaffolding, and validation docs.

## Install

Run this from the repository you want to prepare:

```bash
npx -y veloran@latest
```

The installer shows menus for install scope and app targets. For most repositories, choose `Local project` and the coding apps you use.

## Use The Skills

After install, open your coding agent and mention the installed skill:

- `@init-harness` to inspect the repo and prepare startup, logs, metrics, traces, browser checks, config examples, memory, knowledge, and validation evidence.
- `@execplan-create` to create a self-contained implementation plan.
- `@execplan-execute` to execute a saved plan milestone by milestone.

If your app does not autocomplete skills, ask it to use the skill by name, such as `use the init-harness skill`.

## What Veloran Adds

- Root guidance files for the selected apps.
- Skills for harness initialization and ExecPlan workflows.
- `.agent/knowledge/` for indexed rules, standards, facts, and docs.
- `.agent/memory/` and `.agent/context/` to avoid repeated discovery.
- `.agent/harness/` scaffolding for local startup, observability, and validation.

## Knowledge And Safety

Veloran knowledge composes from user-global knowledge to repository knowledge to path-specific knowledge. Agents should default new facts and standards to the local repository, and only write global knowledge with user approval or repeated cross-repository evidence.

Do not store secrets, tokens, passwords, private keys, customer data, raw production logs, or personal data in knowledge, memory, context, plans, prompts, docs, transcripts, or validation logs.

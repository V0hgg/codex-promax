# Make Veloran A Multi-Vendor Harness Package

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `.agent/PLANS.md` from the repository root. A future agent must be able to start from only this file and the current working tree, without relying on prior chat history.

## Purpose / Big Picture

Veloran should become the package a developer installs when they want a real coding-agent harness, not only an ExecPlan scaffold. After this work, a user can run Veloran once, choose which coding apps to support, choose whether to install project-local files, user-global files, or both, and then hand an `init-harness` skill to their coding agent. That agent will inspect the repository, create or adapt local startup scripts, wire logs, metrics, traces, browser inspection, memory, and validation artifacts, and leave the user with prepared config files where only secrets, databases, service endpoints, or other human-owned values need to be filled in.

The user-visible proof is a fresh repository flow. A developer runs a command such as `npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes`, then sees tool-specific project files, shared skills, `.agent/memory`, and local harness templates. They then copy or mention the generated `init-harness` skill in Codex, Claude Code, OpenCode, or Google Antigravity, and the coding agent can complete a full local harness for a monolith, frontend app, backend service, or microservice graph without the user manually creating the harness files.

## Definition of Done

This plan is complete when all of the following are true and proven by commands or inspected generated files:

1. Veloran has a vendor/app registry that supports at least `codex`, `claude`, `opencode`, `antigravity`, and generic `agents`, while keeping existing `augment`, `common`, `all`, `--assistants`, and `codex-max` behavior backward compatible.
2. `veloran init` can run non-interactively with `--apps`, `--scope`, and `--yes`, and can run interactively in a terminal to choose project-local install, user-global install, or both, plus the target coding apps.
3. `veloran init --scope project --apps codex,claude,opencode,antigravity --yes` scaffolds project-local guidance and skills for all selected apps, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.codex/`, `.claude/`, `.opencode/`, Antigravity-compatible `.agent/skills/`, shared `.agents/skills/`, `.agent/harness/`, `.agent/context/`, `.agent/memory/`, and docs.
4. `veloran init --scope user --apps codex,claude,opencode,antigravity --dry-run` prints the user-global files it would write without mutating the developer machine. A real user-scope write requires either an explicit non-interactive flag or an interactive confirmation, and never overwrites unmanaged user files silently.
5. Veloran ships three core skills everywhere the selected apps can discover them: `init-harness`, `execplan-create`, and `execplan-execute`. Existing ExecPlan skills remain semantically compatible with the current package.
6. The new `init-harness` skill is a framework workflow, not a single-stack recipe. It tells a coding agent how to discover and prepare a harness for monoliths, microservices, backend services, frontend apps, full-stack apps, worker systems, and service graphs. It prepares scripts, config examples, topology files, docs, and validation reports, and only asks the user to fill in secrets or externally owned configuration values.
7. Generated agent instructions include harness usage guidance, memory discipline based on `.agent/memory`, context discipline based on `.agent/context`, and coding discipline inspired by the Karpathy-style rules: state uncertainty, keep changes minimal, define success before implementation, test the actual behavior, and stop only at verified completion or an evidence-backed blocker.
8. `veloran doctor` validates the selected app surfaces, the core skills, `.agent/memory`, the harness templates, tool-specific MCP configuration files, and the generated docs. It prints actionable `Fix:` lines for missing or malformed artifacts.
9. Package tests cover parsing, interactive-default behavior through testable prompt adapters, project-scope generation, user-scope dry-run generation, each vendor/app target, all three core skills, doctor failures, and backward compatibility aliases.
10. The full functional e2e test packs the package, installs it into a clean target repository, runs the new init flow for multiple apps, verifies the generated files, starts the existing local observability smoke stack, validates MCP query tools, verifies `init-harness` skill output, and confirms no stale `codex-promax` or pre-Veloran package references are emitted.

## Progress

- [x] (2026-05-05 10:20 +0700) Read `.agents/skills/execplan-create/SKILL.md` and `.agent/PLANS.md` fully before drafting this plan.
- [x] (2026-05-05 10:20 +0700) Inspected the current package entrypoints, init flow, config resolution, app target parsing, template tree, prompt command, doctor checks, unit tests, and full functional e2e script.
- [x] (2026-05-05 10:20 +0700) Researched the external references named or implied by the user: OpenAI harness engineering, BMAD installer behavior, SuperClaude installer behavior, Ref per-tool MCP setup pages, Antigravity skill and MCP setup, and Karpathy-inspired coding guidance.
- [x] (2026-05-05 10:20 +0700) Re-read existing Veloran ExecPlans for modern cross-tool harness scaffolding, local telemetry onboarding, and observability MCP upgrades so this plan composes prior work instead of restarting it.
- [x] (2026-05-05 10:20 +0700) Created this self-contained master ExecPlan for the multi-vendor harness package redesign.
- [x] (2026-05-05 10:27 +0700) Re-checked this plan after the global `execplan-create` skill was invoked. Confirmed `.agent/PLANS.md` was read fully, the plan is saved under `.agent/execplans/`, the required living sections exist, and every milestone has explicit validation commands plus a milestone Definition of Done.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 1: added app-aware registry/config support, `--apps`, Antigravity, `harness` preset aliasing, and backward-compatible `--assistants` parsing.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 2: added project/user/both install scopes, `--yes`, app/scope listing, conservative user-scope writes, `VELORAN_HOME` dry-run coverage, and `.agent/veloran-manifest.json`.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 3: added the `init-harness` skill, `.agent/memory` templates, root instruction memory/harness/coding-discipline guidance, and `prompt harness` / `prompt init-harness` commands.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 4: added explicit app adapter metadata and selected-app generation for Codex, Claude Code, OpenCode, Antigravity, and generic AGENTS-compatible tools while preserving `codex-max` as a compatibility preset name.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 5: strengthened doctor checks for selected app surfaces, core skills, manifest, memory, generated docs, MCP/config parseability, and app-specific recovery hints; refreshed README, install guide, and docs.
- [x] (2026-05-05 10:46 +0700) Implemented Milestone 6: validation passed with `npm run typecheck`, focused unit tests, `npm run ci`, `npm pack --dry-run`, stale-name search, and Docker-backed `npm run test:e2e`.

## Surprises & Discoveries

- Observation: Veloran already has more harness substrate than the old package name suggested. It generates `.agent/harness/worktree`, `.agent/harness/observability`, `.agent/context`, `.agent/prompts`, `.codex`, `.claude`, `.opencode`, and `opencode.json` in the `codex-max` preset.
  Evidence: `templates/presets/codex-max/` contains worktree scripts, an observability Docker stack, MCP server templates, native Codex agents, Claude settings and agents, OpenCode agents and commands, and shared context and prompt files. `test/e2e/full-functional.sh` verifies many of these files in a generated repository.

- Observation: The current target model is still named `Assistant` and recognizes `agents`, `codex`, `claude`, `augment`, and `opencode`, but not Antigravity. It controls root files and skill output, while the preset tree is copied regardless of selected target.
  Evidence: `src/core/assistants.ts` defines the target set and `runInit` in `src/commands/init.ts` applies `buildPresetTemplateEntries(config.root, config.preset)` unconditionally after target-specific managed files and skills.

- Observation: The existing telemetry onboarding prompt is a strong seed for `init-harness`, but it is narrower than the requested skill. It focuses on logs, metrics, traces, and local service graph wiring after `veloran init`.
  Evidence: `templates/presets/codex-max/.agent/prompts/integrate-local-telemetry.md` tells the agent to discover local startup, write service topology, route logs, scrape metrics, export traces, and record validation, but it is packaged as a prompt rather than a discoverable skill and does not cover memory, browser, frontend, backend, monolith, and cross-vendor installation as a unified workflow.

- Observation: OpenAI's harness engineering article frames repository-local, versioned artifacts as the agent's effective world. That maps directly to Veloran's desired direction: durable docs, schemas, executable plans, scripts, observability, and validation files should be generated into the repo rather than hidden in chat or external docs.
  Evidence: The article explains that knowledge outside the agent's running context effectively does not exist, and favors pushing context into repository-local files such as code, markdown, schemas, and executable plans. This plan embeds that principle as `.agent/context`, `.agent/memory`, `.agent/harness`, docs, skills, and validation reports.

- Observation: BMAD's installer is a useful model for Veloran because it separates the installer binary from installed modules, offers interactive selection, supports non-interactive flags, records installed state, and supports updates without forcing users to remember their original choices.
  Evidence: BMAD documents `npx bmad-method install`, an interactive flow that asks for location, modules, stable/next choices, AI tool/IDE integrations, and module config, plus `--yes`, `--modules`, `--tools`, `--pin`, and a manifest that records what was installed.

- Observation: SuperClaude is a useful model for installation ergonomics because it supports multiple package managers, interactive install, component selection, dry run, force, yes, list components, and verification commands.
  Evidence: SuperClaude documents pipx, pip, npm, and development install methods, and options such as `install`, `--components`, `--dry-run`, `--force --yes`, and `--list-components`.

- Observation: Ref's MCP installation docs show why Veloran needs per-app adapters instead of one universal MCP file. Claude Code can use `claude mcp add`, Codex reads `config.toml`, OpenCode can use `opencode.jsonc`, and Antigravity uses its Agent Chat MCP server manager and an `mcp_config.json` shape.
  Evidence: Ref documents separate install pages for Claude Code, Codex CLI, OpenCode, and Antigravity with different config files and verification commands.

- Observation: Antigravity needs both shared instructions and native skill placement. Public Antigravity guidance describes `GEMINI.md` for always-loaded rules, `SKILL.md` files for on-demand procedures, global skills under `~/.gemini/antigravity/skills/<skill-name>/SKILL.md`, and workspace skills under `./.agent/skills/<skill-name>/SKILL.md`.
  Evidence: The Antigravity skills guide describes rules, skills, workspace-scoped skills, and global skill paths. Ref's Antigravity MCP page links to official Google Antigravity MCP docs and shows the MCP manager flow.

- Observation: The Karpathy-inspired Claude Code instructions are not an install surface, but they are useful as behavioral material for Veloran's generated instructions. The useful pieces are simplicity, explicit assumptions, minimal changes, and goal-driven verification.
  Evidence: The referenced `andrej-karpathy-skills` CLAUDE.md emphasizes thinking before coding, minimum code that solves the problem, no speculative abstractions, transforming vague tasks into verifiable goals, and looping until verified.

- Observation: The existing full preset could remain physically named `codex-max` while `harness` became the canonical CLI preset.
  Evidence: `src/core/presets.ts` parses `codex-max` into `harness`, and `presetTemplateDirectory()` maps `harness` back to `templates/presets/codex-max/`. Unit and e2e tests verify both names.

- Observation: Selected-app filtering is practical without a large plugin system.
  Evidence: `src/commands/init.ts` filters native `.codex/`, `.claude/`, `.opencode/`, `.mcp.json`, and `.agents/skills/` preset entries based on parsed app targets. `test/init.test.ts` verifies `--apps antigravity` does not create Codex, Claude, or OpenCode native files.

- Observation: User-scope install can be safely supported with the existing file-plan primitives.
  Evidence: `src/core/config.ts` resolves user paths under `VELORAN_HOME` or `os.homedir()` and rejects paths escaping that root. `test/init.test.ts` verifies user-scope dry-run lists global destinations without writing `.codex`, `.claude`, or `.gemini`.

## Decision Log

- Decision: Introduce `apps` and `scope` terminology while preserving `assistants` as a backward-compatible alias.
  Rationale: The user describes "vendor/app" targets, and future support will include IDEs, CLIs, and generic rule surfaces. Existing users already know `--assistants`, so removing it would be needless breakage.
  Date/Author: 2026-05-05 / Codex

- Decision: Make `harness` the canonical preset name and keep `codex-max` as an alias during the migration.
  Rationale: The package is now called Veloran and the user wants a harness package, not a Codex-only package. Backward compatibility still matters because the current README, tests, and published package expose `codex-max`.
  Date/Author: 2026-05-05 / Codex

- Decision: Treat project-local installation as the default and require explicit confirmation or flags for user-global writes.
  Rationale: Project-local files are versioned and reviewable. User-global files affect all repositories and can overwrite personal workflows, so they need a higher safety bar.
  Date/Author: 2026-05-05 / Codex

- Decision: Implement interactive install without adding a prompt dependency at first.
  Rationale: Veloran currently has only `commander` and `yaml` as runtime dependencies. A simple Node `readline/promises` flow that accepts comma-separated app choices and scope choices is enough to satisfy the first installer UX while keeping the package small.
  Date/Author: 2026-05-05 / Codex

- Decision: Make `init-harness` a first-class skill and keep `prompt telemetry` as a backward-compatible alias.
  Rationale: The requested user flow is skill-first: the user mentions a skill to their coding agent. The current telemetry prompt should evolve into a broader harness skill without breaking users who already call `veloran prompt telemetry`.
  Date/Author: 2026-05-05 / Codex

- Decision: Use `.agent/memory/` for durable, repository-local memory and keep it distinct from `.agent/context/`.
  Rationale: Context files are curated onboarding notes. Memory files are discovered facts recorded during work to prevent repeated rediscovery. Mixing the two makes both less useful.
  Date/Author: 2026-05-05 / Codex

- Decision: Generated instructions must tell agents not to store secrets in `.agent/memory`, `.agent/context`, plans, docs, prompts, transcripts, or validation logs.
  Rationale: The harness is meant to create prepared config files and examples, while users fill secrets into local-only ignored files or environment variables. Durable instructions must prevent accidental credential capture.
  Date/Author: 2026-05-05 / Codex

- Decision: Antigravity support will start with `GEMINI.md`, workspace `.agent/skills/`, AGENTS-compatible shared rules, and generated MCP setup notes/config snippets, not with brittle automation of the Antigravity GUI.
  Rationale: Public Antigravity MCP setup still involves the Agent Chat MCP server manager. Veloran can prepare the config and instructions, but should not pretend to control an IDE UI reliably.
  Date/Author: 2026-05-05 / Codex

- Decision: Keep runtime dependencies unchanged.
  Rationale: `readline/promises` and the existing file-plan helpers were enough for interactive choices, user-scope previews, and deterministic non-interactive runs. Adding a prompt framework would increase package surface before the flow needs it.
  Date/Author: 2026-05-05 / Codex

- Decision: Filter native app files by selected app but keep shared harness docs and `.agent/harness` app-independent.
  Rationale: The harness, memory, context, docs, and validation files are useful across tools. Native app config should not be generated for unselected apps.
  Date/Author: 2026-05-05 / Codex

## Outcomes & Retrospective

Implemented. Veloran now has app-aware targets, scope-aware installation, a canonical `harness` preset, Antigravity `GEMINI.md` and workspace skill support, the `init-harness` core skill, `.agent/memory`, refreshed docs, selected-app doctor checks, user-scope dry-run safety, and e2e verification through the local observability/MCP stack.

Validation evidence:

- `npm run typecheck` passed.
- `npm test -- test/assistants.test.ts test/init.test.ts test/doctor.test.ts test/prompt.test.ts` passed with 42 tests.
- `npm run ci` passed.
- `npm pack --dry-run` passed and included the new templates/docs/skills.
- `rg -n "codex-promax|Codex-Promax|codexpromax|codex pro max|V0hgg/execplans|/v0hgg/execplans" README.md docs templates src test package.json package-lock.json` returned no matches.
- `npm run test:e2e` passed. The script packed the package, installed it into a clean dummy app, ran `init --preset harness --apps codex,claude,opencode,antigravity --scope project --yes`, ran doctor, verified generated files/configs/prompts/user-scope dry-run, started the worktree runtime, started the Docker observability stack, passed logs/metrics/traces smoke checks, and passed MCP checks for raw and rich observability tools.

The only remaining release-specific check is `INSTALL_MODE=npm npm run test:e2e` after a new version is published to npm.

## Context And Orientation

This repository is a TypeScript npm package. The package name is `veloran`, the CLI binary is `veloran`, and the version at plan creation is `0.2.11`. The package entrypoint is `src/cli.ts`. It uses `commander` for CLI parsing and reads `package.json` at runtime for the version. The current commands are `init`, `doctor`, and `prompt` subcommands for `install`, `plan`, `exec`, and `telemetry`.

The current init implementation is in `src/commands/init.ts`. It resolves options through `src/core/config.ts`, writes managed root files and skills, applies a preset template tree, and prints the telemetry prompt handoff when the selected preset is `codex-max`. File writing helpers live in `src/core/fsPlan.ts`. Template loading lives in `src/core/templates.ts`. Preset parsing lives in `src/core/presets.ts`. Assistant target parsing lives in `src/core/assistants.ts`. Doctor validation lives in `src/core/doctorChecks.ts`.

The current full scaffold is the `codex-max` preset under `templates/presets/codex-max/`. Despite the name, it already supports multiple coding tools. It includes `AGENTS.md` and `CLAUDE.md` managed blocks, `.codex/config.toml` and `.codex/agents/*.toml`, `.claude/settings.json`, `.mcp.json`, `.claude/agents/*.md`, `.claude/rules/*.md`, `.claude/skills/ui-legibility/SKILL.md`, `opencode.json`, `.opencode/agents/*.md`, `.opencode/commands/*.md`, `.agent/context/`, `.agent/prompts/`, `.agent/harness/worktree/`, `.agent/harness/observability/`, `.agent/harness/mcp/observability-server/`, docs, and the existing `execplan-create` and `execplan-execute` skill templates.

In this plan, "vendor/app" means a coding-agent surface that has its own file locations, settings, skill format, MCP configuration, or command model. Codex, Claude Code, OpenCode, and Google Antigravity are vendor/apps. "Project scope" means files written inside the target repository so they can be committed and shared. "User scope" means files written under a user's home directory, such as global skills for all projects. "Harness" means the repository-local operating environment for coding agents: instructions, skills, memory, startup scripts, observability, browser inspection, MCP tools, config examples, validation reports, and recovery docs.

The plan must preserve backward compatibility. Existing commands like `veloran init`, `veloran init --assistants opencode`, `veloran init --preset codex-max`, `veloran prompt telemetry`, `veloran prompt plan`, `veloran prompt exec`, and `veloran doctor` must still work.

## Research Inputs Embedded In This Plan

OpenAI's harness engineering article supplies the core design principle: put knowledge and control surfaces into repository-local, versioned artifacts that the agent can read while working. Veloran should encode setup knowledge as markdown, skills, schemas, scripts, executable plans, and validation docs rather than relying on chat memory.

BMAD supplies the installer pattern. Its installer asks for install location, modules, tool integrations, and config, while also supporting non-interactive flags and a manifest. Veloran should similarly support interactive choices and deterministic flags, then record chosen apps and scope in a manifest.

SuperClaude supplies the component-install pattern. Its docs distinguish quick install, package-manager choices, `install`, `--components`, `--dry-run`, `--force --yes`, `--list-components`, and verification. Veloran should expose similar safety and preview affordances, adapted to Node and repository scaffolding.

Ref's MCP docs show that one MCP configuration cannot fit every tool. Claude Code can use a `claude mcp add` command, Codex reads `~/.codex/config.toml`, OpenCode can use an `opencode.jsonc` shape, and Antigravity uses an Agent Chat MCP manager and `mcp_config.json` style config. Veloran needs app adapters with per-app config writers and verification instructions.

Antigravity guidance suggests three relevant surfaces: `GEMINI.md` for always-loaded rules, workspace `.agent/skills/<skill>/SKILL.md` for project skills, and user-global `~/.gemini/antigravity/skills/<skill>/SKILL.md` for global skills. Veloran should write workspace skills and rules in project scope, and use dry-run or explicit confirmation for user-global skill installs.

The Karpathy-inspired instruction file contributes coding discipline, not a file layout. Veloran should fold in principles such as minimal code, explicit uncertainty, no speculative abstractions, defined success criteria, and verification loops into generated agent guidance.

## Plan Of Work

### Milestone 1: Introduce A Vendor/App Registry Without Breaking Existing CLI Behavior

This milestone changes the internal naming and data model so Veloran can support more than the current `Assistant` list. The observable result is that old commands still work, while new commands can use `--apps` and can include `antigravity`.

Create `src/core/apps.ts` or refactor `src/core/assistants.ts` into an app-aware module. Define app IDs as at least `agents`, `codex`, `claude`, `opencode`, `antigravity`, and `augment`. Keep `common` as an alias for `agents`, keep `all`, and keep the current `--assistants` option as an alias for `--apps`. If both `--apps` and `--assistants` are provided, fail with a clear error rather than merging ambiguous input.

Each app registry entry must state which project files it needs, which skill directories it supports, whether it has a native MCP configuration surface, and whether it has a user-global skill location. Initial registry facts should be:

- `agents`: uses `AGENTS.md`; project skills optional through `.agents/skills`.
- `codex`: uses `AGENTS.md`, `.codex/config.toml`, `.codex/agents/`, and shared project skills under `.agents/skills`; user-global skills default to `~/.codex/skills`.
- `claude`: uses `CLAUDE.md`, `.claude/settings.json`, `.mcp.json`, `.claude/agents/`, and `.claude/skills`; user-global skills default to `~/.claude/skills`.
- `opencode`: uses `AGENTS.md`, `opencode.json`, `.opencode/agents/`, `.opencode/commands/`, and shared project skills under `.agents/skills`; user-global support should be described but initially restricted to generated instructions unless confirmed by docs during implementation.
- `antigravity`: uses `AGENTS.md`, `GEMINI.md`, workspace `.agent/skills`, and generated MCP setup docs or snippets; user-global skills default to `~/.gemini/antigravity/skills`.
- `augment`: keeps existing behavior as a Claude-compatible root instruction target until a dedicated adapter is implemented.

Update `src/cli.ts` so common options include `--apps <list>` and keep `--assistants <list>` as hidden or documented compatibility. Update help text and errors to say vendor/app targets. Update `src/core/config.ts` and all call sites to use the new parsed app targets. Keep existing exported names as compatibility wrappers if tests or public imports rely on them.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm test -- test/assistants.test.ts test/init.test.ts
    npm run typecheck
    node dist/cli.js init --help

Milestone Definition of Done: `veloran init --apps codex,claude,opencode,antigravity --dry-run` parses successfully after build; `veloran init --assistants opencode --dry-run` still works; invalid app names produce a clear error naming valid app IDs; existing assistant tests are either preserved or renamed with equivalent coverage.

### Milestone 2: Add Project/User/Both Install Scopes And Interactive Selection

This milestone turns `init` into a safer installer without losing the current scriptable flow. The observable result is that users can choose project-local, user-global, or both, either interactively or through flags.

Add an install scope model in `src/core/installScope.ts` or equivalent. Supported values are `project`, `user`, and `both`. Default to `project` for non-interactive runs. Add `--scope <project|user|both>`, `--yes`, `--list-apps`, and `--list-scopes`. Add `--global` as a convenience alias for `--scope user` only if it does not conflict with npm terminology in help text. Keep `--dry-run`, `--verbose`, and `--force`.

Implement a small prompt adapter using Node `readline/promises` so tests can inject answers without depending on a real TTY. Interactive mode should run only when stdin is a TTY, stdout is a TTY, `--yes` is not present, and the user did not provide enough flags to make the install deterministic. The prompts should ask:

1. Where to install Veloran harness files: project, user, or both.
2. Which vendor/apps to support: all, codex, claude, opencode, antigravity, agents, augment.
3. Whether to overwrite managed files when they already exist.
4. Whether to continue after showing the planned file list when user-scope writes are selected.

Add a manifest file for project installs at `.agent/veloran-manifest.json`. It should record Veloran package version, selected apps, install scope, preset, generated file families, and timestamp. For user-scope dry-run, print the equivalent planned manifest to stdout. Do not store secrets or machine-specific auth tokens in the manifest.

User-scope writes must use safe defaults. Resolve home with `os.homedir()`, support `VELORAN_HOME` for tests, and allow override flags such as `--codex-skills-dir`, `--claude-skills-dir`, and `--antigravity-skills-dir` only after the registry supports them. Never write outside an allowed directory when a user-scope path contains `..` traversal or resolves unexpectedly.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm test -- test/init.test.ts test/doctor.test.ts
    npm run typecheck
    tmp_repo="$(mktemp -d)"
    node dist/cli.js init --root "$tmp_repo" --apps codex,claude --scope project --yes --dry-run
    VELORAN_HOME="$(mktemp -d)" node dist/cli.js init --apps codex,claude,antigravity --scope user --yes --dry-run

Milestone Definition of Done: deterministic non-interactive installs do not prompt; interactive logic is unit-tested through injected answers; user-scope dry-run lists global destinations without writing; project-scope install writes `.agent/veloran-manifest.json`; existing `veloran init` behavior remains quiet and idempotent by default.

### Milestone 3: Add The Core `init-harness` Skill, Memory, And Coding Discipline Guidance

This milestone creates the skill the user explicitly requested. The observable result is that every selected app can discover an `init-harness` skill alongside `execplan-create` and `execplan-execute`, and generated instructions tell agents how to use memory and code carefully.

Create `templates/skills/init-harness.SKILL.md`. The skill must include YAML frontmatter:

    ---
    name: init-harness
    description: Inspect a repository and set up a complete local coding-agent harness: startup, logs, metrics, traces, browser checks, memory, config examples, and validation.
    ---

The skill body must define a framework workflow. It should tell the agent to:

1. Read root instructions, `.agent/context/`, `.agent/memory/`, and existing docs before editing.
2. Detect repository shape: monolith, frontend app, backend API, full-stack app, worker, CLI, library, or microservice graph.
3. Find the real local start path by inspecting package scripts, Makefiles, compose files, dev scripts, process managers, README setup, existing cluster scripts, and tests.
4. If local startup is ambiguous or depends on external secrets, create prepared files and ask the user for only the missing values, not for the user to design the harness.
5. Create or update `.agent/harness/start.sh`, `.agent/harness/stop.sh`, `.agent/harness/status.sh`, `.agent/harness/env.local.example`, `.agent/harness/service-topology.yaml`, and app-specific wrappers as needed while preserving existing project commands.
6. Wire logs into `.agent/harness/runtime/logs/<service>.log` or a documented existing log path.
7. Wire metrics by reusing existing `/metrics` endpoints or adding local-only metrics behind an explicit local flag.
8. Wire traces through local OpenTelemetry endpoints or documented framework-specific adapters.
9. Wire browser or UI checks for frontend and full-stack apps when a browser MCP or local browser harness is available.
10. Record durable discoveries in `.agent/memory/` and validation evidence in `docs/generated/harness-validation.md`.
11. Run validation, fix failures, and report exact commands, observed evidence, prepared secret/config files, and remaining blockers.

Create `templates/presets/harness/.agent/memory/README.md` or the equivalent under the existing preset tree while the alias migration is in progress. Memory guidance must define memory as verified project knowledge that prevents repeat rediscovery. It must say to keep memory short, cite evidence, include dates, avoid secrets, and update memory only for durable facts. Add a starter `.agent/memory/INDEX.md` if helpful.

Update `templates/AGENTS.managed.md`, `templates/CLAUDE.managed.md`, Antigravity `GEMINI.md`, OpenCode instructions, and Codex config guidance so agents read `.agent/memory/` when relevant, update it after confirmed durable discoveries, and avoid repeatedly scanning the same files or debugging the same issue from scratch. Include coding discipline guidance: state uncertainty, verify before coding when ambiguous, prefer existing patterns, keep changes minimal, define success criteria, write focused tests, and stop only at verified completion or evidence-backed blocker.

Update `src/commands/init.ts` so `init-harness`, `execplan-create`, and `execplan-execute` are copied into every selected app's skill directory:

- shared `.agents/skills/<skill>/SKILL.md` for Codex/OpenCode/generic shared skill surfaces
- `.claude/skills/<skill>/SKILL.md` for Claude Code project scope
- `.agent/skills/<skill>/SKILL.md` for Antigravity workspace scope
- user-global equivalents when `--scope user` or `--scope both` is selected and explicitly confirmed

Add `veloran prompt harness` and `veloran prompt init-harness` commands that print the same workflow in prompt form for apps that do not auto-discover skills. Keep `veloran prompt telemetry` as an alias that points to the relevant section or prints a compatibility note plus the harness prompt.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm test -- test/init.test.ts test/prompt.test.ts test/doctor.test.ts
    npm run build
    tmp_repo="$(mktemp -d)"
    node dist/cli.js init --root "$tmp_repo" --apps codex,claude,opencode,antigravity --scope project --yes
    test -f "$tmp_repo/.agents/skills/init-harness/SKILL.md"
    test -f "$tmp_repo/.claude/skills/init-harness/SKILL.md"
    test -f "$tmp_repo/.agent/skills/init-harness/SKILL.md"
    grep -R ".agent/memory" "$tmp_repo/AGENTS.md" "$tmp_repo/CLAUDE.md" "$tmp_repo/GEMINI.md"

Milestone Definition of Done: the three core skills are generated for all selected app skill surfaces; `.agent/memory` guidance exists; generated instructions include harness, memory, and coding discipline guidance; prompt commands expose the harness workflow; doctor fails if a required selected-app skill is missing.

### Milestone 4: Add Vendor/App Adapters For Codex, Claude Code, OpenCode, Antigravity, And Generic AGENTS Tools

This milestone makes the installer app-aware rather than relying on one copied preset tree. The observable result is that selected apps receive the right native files, unselected apps do not receive unnecessary native files unless the preset requires shared compatibility, and each app has clear MCP and skill setup.

Create an adapter interface in `src/core/appAdapters.ts`. Each adapter should expose:

    id
    label
    projectEntries(config)
    userEntries(config)
    requiredProjectPaths(config)
    doctorChecks(config)
    nextSteps(config)

Do not over-abstract file writing prematurely. The adapter can return concrete template entries and generated string entries. Reuse `fsPlan` actions so dry-run, verbose, force, and idempotence stay consistent.

Codex adapter must write or validate `AGENTS.md`, `.codex/config.toml`, `.codex/agents/*.toml`, shared skills, and MCP server entries. It must keep current observability and Chrome DevTools MCP configuration. It should include docs for `codex mcp list` verification where appropriate, but automated tests should validate generated TOML and file presence rather than depending on a locally installed Codex CLI.

Claude adapter must write or validate `CLAUDE.md`, `.claude/settings.json`, `.mcp.json`, `.claude/agents/*.md`, `.claude/rules/*.md`, and `.claude/skills/<skill>/SKILL.md`. It should include project settings and MCP enablement without stuffing every instruction into settings JSON.

OpenCode adapter must write or validate `AGENTS.md`, `opencode.json` or `opencode.jsonc` as chosen by existing package style, `.opencode/agents/*.md`, `.opencode/commands/*.md`, shared skills, and docs that explain how to verify a tool call. Keep the current `opencode.json` tests passing unless a migration to JSONC is deliberate and tested.

Antigravity adapter must write or validate `AGENTS.md`, `GEMINI.md`, `.agent/skills/<skill>/SKILL.md`, `.agent/context/`, `.agent/memory/`, and a doc such as `docs/ANTIGRAVITY_SETUP.md` or a section in `docs/HARNESS_SETUP.md`. It should generate an MCP config snippet for the local observability MCP and explain that Antigravity users may need to paste or refresh it through Agent Chat's MCP server manager. If implementation discovers a reliable project-local Antigravity MCP config path, record it in this plan's `Surprises & Discoveries` and use it.

Generic `agents` adapter must write `AGENTS.md`, `.agent/context/`, `.agent/memory/`, `.agent/prompts/`, and optionally `.agents/skills` when requested. It should avoid native tool files.

Add a `templates/presets/harness/` canonical preset or implement `harness` as an alias to the current `codex-max` tree first. If duplicating the template tree would create churn, keep one physical tree and map both preset names to it. Update docs to describe `harness` as the preferred name and `codex-max` as a backward-compatible alias.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm test -- test/init.test.ts test/doctor.test.ts test/assistants.test.ts
    npm run typecheck
    tmp_repo="$(mktemp -d)"
    node dist/cli.js init --root "$tmp_repo" --preset harness --apps antigravity --scope project --yes
    test -f "$tmp_repo/GEMINI.md"
    test -f "$tmp_repo/.agent/skills/init-harness/SKILL.md"
    test ! -e "$tmp_repo/.claude/settings.json" || echo "Claude files are present only if the shared preset intentionally keeps them; document the decision"

Milestone Definition of Done: app adapters are explicit in code; Antigravity is supported; selected app generation is tested; `harness` preset works; `codex-max` still works as an alias; generated config files parse; docs explain per-app setup and verification.

### Milestone 5: Strengthen Doctor, Docs, And Migration Guidance

This milestone makes the new package understandable and safely maintainable. The observable result is that users can read the README and docs to understand project vs user install, selected app targets, core skills, memory, and the harness workflow.

Update `README.md` to lead with Veloran as a harness package. Include quick starts for:

    npx -y veloran@latest init
    npx -y veloran@latest init --apps codex,claude,opencode,antigravity --scope project --yes
    npx -y veloran@latest init --scope user --apps claude,codex --dry-run
    npx -y veloran@latest prompt init-harness
    npx -y veloran@latest doctor --apps all

Update `docs/AGENT_INSTALL.md` so a coding agent can install Veloran in a target repo, choose project scope by default, avoid user-global writes unless requested, run doctor, and hand the user the generated `init-harness` skill/prompt.

Create or update docs under `docs/` and generated template docs:

- `docs/HARNESS_SETUP.md` explains the harness model, app targets, install scopes, secrets policy, memory policy, and local validation.
- `docs/APP_TARGETS.md` lists Codex, Claude Code, OpenCode, Antigravity, generic AGENTS, and what files each target gets.
- `docs/SKILLS.md` describes `init-harness`, `execplan-create`, and `execplan-execute`.
- `docs/MEMORY.md` explains `.agent/memory` conventions and security rules.

Update `src/core/doctorChecks.ts` to validate:

- selected app files and only the selected app files, except shared preset files that are intentionally app-independent
- all three core skills in relevant project and user scopes
- `.agent/memory/README.md`
- `.agent/veloran-manifest.json`
- `GEMINI.md` and Antigravity workspace skills when Antigravity is selected
- MCP config parseability or generated setup snippets
- no required doc still uses stale names like `codex-promax`

Add recovery guidance to `Fix:` lines. For example, missing Antigravity workspace skill should say `Fix: Create <path> (run veloran init --apps antigravity --scope project)` rather than only `run veloran init`.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm test -- test/doctor.test.ts test/init.test.ts test/prompt.test.ts
    npm run build
    tmp_repo="$(mktemp -d)"
    node dist/cli.js init --root "$tmp_repo" --apps codex,claude,opencode,antigravity --scope project --yes
    node dist/cli.js doctor --root "$tmp_repo" --apps codex,claude,opencode,antigravity --preset harness
    rg -n "codex-promax|Codex-Promax|V0hgg/execplans" README.md docs templates src test

Milestone Definition of Done: docs are current; doctor validates the new contract and gives app-specific fixes; stale old-name search is clean; a generated repo has an understandable harness setup guide, app-target guide, skills guide, memory guide, and validation report template.

### Milestone 6: Full Verification, Package Proof, And Release Readiness

This milestone proves that the package can be shipped. The observable result is a clean local validation run and a generated repository that demonstrates the multi-vendor harness setup.

Extend `test/e2e/full-functional.sh` so it can run the new project-scope multi-app install. The script should:

1. Pack the local package from an isolated source copy.
2. Install it into a clean dummy app.
3. Run `npx --yes --prefix "$TARGET_REPO" veloran init --root "$TARGET_REPO" --preset harness --apps codex,claude,opencode,antigravity --scope project --yes`.
4. Run `veloran doctor` for the same apps.
5. Verify `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.codex`, `.claude`, `.opencode`, `.agent/skills/init-harness`, `.agents/skills/init-harness`, `.claude/skills/init-harness`, `.agent/memory`, `.agent/harness`, and docs.
6. Run the existing worktree runtime script proof.
7. Run the existing observability stack smoke proof.
8. Run MCP observability checks.
9. Verify prompt commands: `prompt install`, `prompt plan`, `prompt exec`, `prompt telemetry`, `prompt harness`, and `prompt init-harness`.

Add a separate unit or e2e-safe test for user-scope dry-run using `VELORAN_HOME="$(mktemp -d)"`. It should assert that dry-run prints the intended global paths and writes nothing. If a real user-scope write is tested, it must use `VELORAN_HOME` so it never mutates the developer's actual home directory.

Validation commands for this milestone:

    cd /Users/hunter/v0hgg/veloran
    npm run ci
    npm pack --dry-run
    npm run test:e2e
    INSTALL_MODE=npm npm run test:e2e

The `INSTALL_MODE=npm` check is optional before publishing if the npm registry does not yet contain the new version. After publish, run it against the published package.

Milestone Definition of Done: all unit tests pass; `npm pack --dry-run` reports the expected package name and includes new skill/templates/docs; local e2e passes; user-scope dry-run is proven safe; published-package e2e is run after release or explicitly recorded as the only remaining post-release check.

## Concrete Steps

Work from `/Users/hunter/v0hgg/veloran`.

First inspect the current state before editing:

    git status --short
    rg -n "Assistant|assistants|codex-max|telemetry|execplan-create|execplan-execute|opencode|claude|codex" src test templates README.md docs
    find templates -maxdepth 5 -type f | sort

Implement Milestone 1 and Milestone 2 together only if the diffs stay small. Otherwise, land app registry first, verify, then add install scopes. Prefer small commits if the user asks to commit later.

When adding templates, keep manual edits under `templates/` and use the existing template copy mechanism unless an app adapter truly needs generated dynamic content. Use `apply_patch` for manual file edits. Do not create tarballs or generated runtime files in the repository root.

After each milestone, update this ExecPlan's `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` with the exact evidence. If implementation discovers that a public Antigravity or OpenCode path differs from the assumptions here, update the adapter decision before writing code that depends on the old assumption.

## Validation And Acceptance

The final acceptance proof is behavioral. A clean target repository must be able to run the new init command and receive a full harness package for the selected apps. A human should be able to inspect the generated repo and see:

- how to start or wrap local services
- where logs, metrics, traces, and browser checks are configured
- how to use the `init-harness` skill
- how to create and execute ExecPlans
- where durable memory goes
- which files need human-provided secrets or endpoints
- how to run doctor and readiness checks

Expected final command transcript should resemble:

    $ npx --yes --prefix "$TARGET_REPO" veloran init --root "$TARGET_REPO" --preset harness --apps codex,claude,opencode,antigravity --scope project --yes
    Veloran is ready.
    Core skills installed:
      init-harness
      execplan-create
      execplan-execute
    Next step:
      Mention the init-harness skill in your coding agent or run:
        npx -y veloran@latest prompt init-harness
    Optional check after setup:
      npx -y veloran@latest doctor --apps codex,claude,opencode,antigravity --preset harness

The exact wording may differ, but the output must make the next action clear and must not require the user to manually design the harness.

## Idempotence And Recovery

Project-scope install must be idempotent. Re-running `veloran init` without `--force` should preserve user edits outside managed blocks and should not duplicate managed blocks. Re-running with `--force` may refresh managed templates and scaffold files, but must still avoid overwriting local secret files and runtime state.

User-scope install must be conservative. Dry-run should be the first documented user-scope path. A real user-scope write must preserve existing files unless `--force` is explicitly supplied. If a global skill file already exists and differs, the installer should skip it with a clear message or write a `.veloran-new` candidate rather than clobbering it silently.

If a milestone breaks e2e because Docker is unavailable, record that as an environment blocker and still run unit tests and pack checks. Do not claim full completion until the Docker-backed e2e succeeds or the user explicitly accepts that residual risk.

If generated docs or templates mention old package names, run the stale-name search and patch the source template, not only the generated output:

    rg --hidden --no-ignore -n -i "codex[-_ ]?promax|codexpromax|codex pro max|V0hgg/execplans|/v0hgg/execplans" -g '!node_modules/**' -g '!test/e2e/.tmp/**' -g '!.git/**' .

## Artifacts And Notes

Important current files:

- `src/cli.ts`: CLI commands and options.
- `src/commands/init.ts`: init scaffolding behavior and post-init output.
- `src/commands/prompt.ts`: prompt command output.
- `src/core/assistants.ts`: current assistant target parsing, likely to become app target parsing.
- `src/core/config.ts`: resolved paths and options.
- `src/core/doctorChecks.ts`: doctor validation.
- `templates/skills/execplan-create.SKILL.md`: current ExecPlan creation skill.
- `templates/skills/execplan-execute.SKILL.md`: current ExecPlan execution skill.
- `templates/presets/codex-max/.agent/prompts/integrate-local-telemetry.md`: seed workflow for `init-harness`.
- `templates/presets/codex-max/.agent/harness/observability/`: local logs, metrics, traces stack.
- `test/init.test.ts`, `test/doctor.test.ts`, `test/prompt.test.ts`, `test/e2e/full-functional.sh`: main validation surface.

External research sources used while drafting:

- OpenAI harness engineering article: `https://openai.com/index/harness-engineering/`
- BMAD install docs: `https://docs.bmad-method.org/how-to/install-bmad/`
- SuperClaude install docs: `https://github.com/SuperClaude-Org/SuperClaude_Framework/blob/master/docs/getting-started/installation.md`
- Ref Claude Code, Codex, OpenCode, and Antigravity MCP install docs: `https://docs.ref.tools/context/install/claude-code`, `https://docs.ref.tools/context/install/codex`, `https://docs.ref.tools/context/install/opencode`, `https://docs.ref.tools/context/install/antigravity`
- Antigravity skills setup guide: `https://antigravity.codes/blog/antigravity-skills-setup-guide`
- Karpathy-inspired coding guidance: `https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md`

The plan embeds the relevant ideas from those sources so implementation does not depend on opening them again.

## Interfaces And Dependencies

New or changed TypeScript interfaces should be straightforward and local to this package. Suggested shapes:

    type AppId = "agents" | "codex" | "claude" | "opencode" | "antigravity" | "augment";
    type InstallScope = "project" | "user" | "both";

    interface AppTarget {
      id: AppId;
      label: string;
      needsAgentsFile: boolean;
      needsClaudeFile: boolean;
      needsGeminiFile: boolean;
      projectSkillDirs: string[];
      userSkillDirs: string[];
      nativeConfigPaths: string[];
    }

    interface InstallSelection {
      apps: AppId[];
      scope: InstallScope;
      preset: InitPreset;
      yes: boolean;
      force: boolean;
      dryRun: boolean;
    }

Avoid introducing a large plugin framework until the first adapters prove they need it. The first implementation can use a registry plus functions that return template entries and generated file entries.

Runtime dependencies should stay minimal. Use Node standard library for interactive prompts unless implementation proves a dependency is worth it. Continue using `yaml` for YAML/frontmatter parsing where already present.

## Revision Notes

- 2026-05-05 / Codex: Initial ExecPlan created from the user's request to make Veloran a multi-vendor harness package with interactive app/scope installation, an `init-harness` skill, preserved ExecPlan skills, repository memory, harness guidance, and coding discipline inspired by the supplied Karpathy-style instructions.
- 2026-05-05 / Codex: Re-validated the ExecPlan against the global `execplan-create` skill and `.agent/PLANS.md`. No implementation scope changed; the update records that the saved plan has the required living sections, per-milestone validation commands, and per-milestone Definitions of Done.
- 2026-05-05 / Codex: Executed all milestones. Added app/scope-aware init, selected app adapters, `init-harness`, memory scaffolding, Antigravity support, docs, doctor coverage, unit/e2e validation, and final evidence.

import fs from "node:fs";
import path from "node:path";

import YAML from "yaml";

import { MANAGED_BEGIN, MANAGED_END } from "./managedBlock";
import { InitPreset } from "./presets";

const REQUIRED_PLAN_HEADINGS = [
  "## Progress",
  "## Surprises & Discoveries",
  "## Decision Log",
  "## Outcomes & Retrospective",
];

const CODEX_MAX_REQUIRED_RELATIVE_PATHS = [
  "ARCHITECTURE.md",
  ".agent/context/README.md",
  ".agent/context/repo-overview.md",
  ".agent/context/commands.md",
  ".agent/context/testing.md",
  ".agent/context/architecture-notes.md",
  ".agent/prompts/onboard-repository.md",
  ".agent/prompts/validate-readiness.md",
  ".agent/prompts/debugging-handoff.md",
  ".agent/prompts/release-checks.md",
  ".agent/prompts/integrate-local-telemetry.md",
  ".claude/agents/browser-debugger.md",
  ".claude/agents/code-mapper.md",
  ".claude/agents/docs-researcher.md",
  ".claude/agents/reviewer.md",
  ".claude/rules/context-cache.md",
  ".claude/rules/verification.md",
  ".claude/settings.json",
  ".mcp.json",
  ".codex/config.toml",
  ".codex/agents/browser-debugger.toml",
  ".codex/agents/code-mapper.toml",
  ".codex/agents/docs-researcher.toml",
  ".codex/agents/reviewer.toml",
  ".opencode/agents/browser-debugger.md",
  ".opencode/agents/code-mapper.md",
  ".opencode/agents/docs-researcher.md",
  ".opencode/agents/reviewer.md",
  ".opencode/commands/implementation-plan.md",
  ".opencode/commands/review-changes.md",
  ".opencode/commands/validate-readiness.md",
  "docs/design-docs/index.md",
  "docs/exec-plans/tech-debt-tracker.md",
  "docs/generated/db-schema.md",
  "docs/generated/observability-validation.md",
  "docs/OBSERVABILITY_RUNBOOK.md",
  "docs/product-specs/index.md",
  "docs/references/design-system-reference-llms.txt",
  "docs/SECURITY.md",
  ".agent/harness/worktree/up.sh",
  ".agent/harness/worktree/down.sh",
  ".agent/harness/worktree/status.sh",
  ".agent/harness/observability/docker-compose.yml",
  ".agent/harness/observability/fixture/emit-local-telemetry.py",
  ".agent/harness/observability/local/.gitignore",
  ".agent/harness/observability/local/README.md",
  ".agent/harness/observability/local/service-topology.example.yaml",
  ".agent/harness/observability/local/cluster-up.example.sh",
  ".agent/harness/observability/local/cluster-down.example.sh",
  ".agent/harness/observability/local/env.local.example",
  ".agent/harness/observability/runtime/.gitignore",
  ".agent/harness/observability/runtime/logs/.gitignore",
  ".agent/harness/observability/smoke.sh",
  ".agent/harness/observability/vector/vector.yaml",
  ".agent/harness/mcp/observability-server/server.mjs",
  ".agents/skills/ui-legibility/SKILL.md",
  "docs/LOCAL_TELEMETRY_SETUP.md",
  "opencode.json",
];

function hasTomlField(content: string, fieldName: string): boolean {
  const pattern = new RegExp(`^${fieldName}\\s*=`, "m");
  return pattern.test(content);
}

function hasManagedMarkers(content: string): boolean {
  const begin = content.includes(MANAGED_BEGIN);
  const end = content.includes(MANAGED_END);
  return begin && end;
}

function parseFrontmatter(filePath: string): Record<string, unknown> | undefined {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return undefined;
  }

  try {
    const parsed = YAML.parse(match[1]);
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function parseJsonFile(filePath: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export interface DoctorCheckOptions {
  root: string;
  preset: InitPreset;
  plansFilePath: string;
  execplansDirPath: string;
  agentsFilePath: string;
  claudeFilePath: string;
  execplanCreateSkillPath: string;
  execplanExecuteSkillPath: string;
  checkAgentsFile: boolean;
  checkClaudeFile: boolean;
  checkAgentSkills: boolean;
}

export function runDoctorChecks(options: DoctorCheckOptions): string[] {
  const fixes: string[] = [];

  if (!fs.existsSync(options.plansFilePath)) {
    fixes.push(`Fix: Create ${options.plansFilePath} (run \`codex-promax init\`).`);
  }

  if (!fs.existsSync(options.execplansDirPath)) {
    fixes.push(`Fix: Create ${options.execplansDirPath} directory (run \`codex-promax init\`).`);
  }

  if (options.checkAgentsFile) {
    if (!fs.existsSync(options.agentsFilePath)) {
      fixes.push(`Fix: Create ${options.agentsFilePath} with execplans managed block (run \`codex-promax init\`).`);
    } else {
      const content = fs.readFileSync(options.agentsFilePath, "utf8");
      if (!hasManagedMarkers(content)) {
        fixes.push(
          `Fix: Add ${MANAGED_BEGIN} and ${MANAGED_END} markers to ${options.agentsFilePath} (or rerun \`codex-promax init\`).`,
        );
      }
    }
  }

  if (options.checkClaudeFile) {
    if (!fs.existsSync(options.claudeFilePath)) {
      fixes.push(`Fix: Create ${options.claudeFilePath} with execplans managed block (run \`codex-promax init\`).`);
    } else {
      const content = fs.readFileSync(options.claudeFilePath, "utf8");
      if (!hasManagedMarkers(content)) {
        fixes.push(
          `Fix: Add ${MANAGED_BEGIN} and ${MANAGED_END} markers to ${options.claudeFilePath} (or rerun \`codex-promax init\`).`,
        );
      }
    }
  }

  if (fs.existsSync(options.plansFilePath)) {
    const plansContent = fs.readFileSync(options.plansFilePath, "utf8");
    for (const heading of REQUIRED_PLAN_HEADINGS) {
      if (!plansContent.includes(heading)) {
        fixes.push(`Fix: Add required heading \"${heading}\" to ${options.plansFilePath}.`);
      }
    }
  }

  if (options.checkAgentSkills) {
    const skillFiles = [options.execplanCreateSkillPath, options.execplanExecuteSkillPath];

    for (const skillPath of skillFiles) {
      if (!fs.existsSync(skillPath)) {
        fixes.push(`Fix: Create ${skillPath} (run \`codex-promax init\`).`);
        continue;
      }

      const frontmatter = parseFrontmatter(skillPath);
      if (!frontmatter) {
        fixes.push(
          `Fix: Add YAML frontmatter with non-empty name and description to ${skillPath}.`,
        );
        continue;
      }

      const name = frontmatter.name;
      const description = frontmatter.description;
      if (typeof name !== "string" || name.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field \"name\" in ${skillPath}.`);
      }

      if (typeof description !== "string" || description.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field \"description\" in ${skillPath}.`);
      }
    }
  }

  if (options.preset === "codex-max") {
    for (const relativePath of CODEX_MAX_REQUIRED_RELATIVE_PATHS) {
      const absolutePath = path.resolve(options.root, relativePath);
      if (!fs.existsSync(absolutePath)) {
        fixes.push(`Fix: Create ${absolutePath} (run \`codex-promax init\`).`);
      }
    }

    const codexConfigPath = path.resolve(options.root, ".codex/config.toml");
    if (fs.existsSync(codexConfigPath)) {
      const codexConfig = fs.readFileSync(codexConfigPath, "utf8");
      if (!codexConfig.includes("project_doc_fallback_filenames")) {
        fixes.push(
          `Fix: Add project_doc_fallback_filenames to ${codexConfigPath} (or rerun \`codex-promax init\`).`,
        );
      }

      if (!codexConfig.includes("project_doc_max_bytes")) {
        fixes.push(
          `Fix: Add project_doc_max_bytes to ${codexConfigPath} (or rerun \`codex-promax init\`).`,
        );
      }

      if (!codexConfig.includes("[agents]")) {
        fixes.push(
          `Fix: Add [agents] block to ${codexConfigPath} (or rerun \`codex-promax init\`).`,
        );
      }

      if (!codexConfig.includes("[mcp_servers.chrome_devtools]")) {
        fixes.push(
          `Fix: Add [mcp_servers.chrome_devtools] block to ${codexConfigPath} (or rerun \`codex-promax init\`).`,
        );
      }

      if (!codexConfig.includes("[mcp_servers.observability]")) {
        fixes.push(
          `Fix: Add [mcp_servers.observability] block to ${codexConfigPath} (or rerun \`codex-promax init\`).`,
        );
      }
    }

    const codexAgentPaths = [
      ".codex/agents/browser-debugger.toml",
      ".codex/agents/code-mapper.toml",
      ".codex/agents/docs-researcher.toml",
      ".codex/agents/reviewer.toml",
    ];

    for (const relativePath of codexAgentPaths) {
      const absolutePath = path.resolve(options.root, relativePath);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const content = fs.readFileSync(absolutePath, "utf8");
      if (!hasTomlField(content, "name")) {
        fixes.push(`Fix: Add name to ${absolutePath} (or rerun \`codex-promax init\`).`);
      }

      if (!hasTomlField(content, "description")) {
        fixes.push(`Fix: Add description to ${absolutePath} (or rerun \`codex-promax init\`).`);
      }

      if (!hasTomlField(content, "developer_instructions")) {
        fixes.push(
          `Fix: Add developer_instructions to ${absolutePath} (or rerun \`codex-promax init\`).`,
        );
      }
    }

    const claudeSettingsPath = path.resolve(options.root, ".claude/settings.json");
    if (fs.existsSync(claudeSettingsPath)) {
      const claudeSettings = parseJsonFile(claudeSettingsPath);
      if (!claudeSettings) {
        fixes.push(
          `Fix: Make ${claudeSettingsPath} valid JSON with the expected Claude Code settings shape.`,
        );
      } else {
        if (typeof claudeSettings.plansDirectory !== "string") {
          fixes.push(
            `Fix: Set string field "plansDirectory" in ${claudeSettingsPath} (or rerun \`codex-promax init\`).`,
          );
        }

        if (
          !Array.isArray(claudeSettings.enabledMcpjsonServers)
          || claudeSettings.enabledMcpjsonServers.length === 0
        ) {
          fixes.push(
            `Fix: Set non-empty array field "enabledMcpjsonServers" in ${claudeSettingsPath} (or rerun \`codex-promax init\`).`,
          );
        }

        const permissions = claudeSettings.permissions;
        if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
          fixes.push(
            `Fix: Set object field "permissions" in ${claudeSettingsPath} (or rerun \`codex-promax init\`).`,
          );
        }
      }
    }

    const claudeProjectMcpPath = path.resolve(options.root, ".mcp.json");
    if (fs.existsSync(claudeProjectMcpPath)) {
      const mcpConfig = parseJsonFile(claudeProjectMcpPath);
      if (!mcpConfig) {
        fixes.push(
          `Fix: Make ${claudeProjectMcpPath} valid JSON with an "mcpServers" object.`,
        );
      } else {
        const mcpServers = mcpConfig.mcpServers;
        if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) {
          fixes.push(
            `Fix: Set object field "mcpServers" in ${claudeProjectMcpPath} (or rerun \`codex-promax init\`).`,
          );
        } else {
          const serverMap = mcpServers as Record<string, unknown>;
          for (const serverName of ["chrome-devtools", "observability"]) {
            if (!serverMap[serverName] || typeof serverMap[serverName] !== "object") {
              fixes.push(
                `Fix: Add "${serverName}" MCP server config to ${claudeProjectMcpPath} (or rerun \`codex-promax init\`).`,
              );
            }
          }
        }
      }
    }

    const claudeAgentPaths = [
      ".claude/agents/browser-debugger.md",
      ".claude/agents/code-mapper.md",
      ".claude/agents/docs-researcher.md",
      ".claude/agents/reviewer.md",
    ];

    for (const relativePath of claudeAgentPaths) {
      const absolutePath = path.resolve(options.root, relativePath);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const frontmatter = parseFrontmatter(absolutePath);
      if (!frontmatter) {
        fixes.push(
          `Fix: Add YAML frontmatter with non-empty name and description to ${absolutePath}.`,
        );
        continue;
      }

      const name = frontmatter.name;
      const description = frontmatter.description;
      if (typeof name !== "string" || name.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field "name" in ${absolutePath}.`);
      }

      if (typeof description !== "string" || description.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field "description" in ${absolutePath}.`);
      }
    }

    const openCodeConfigPath = path.resolve(options.root, "opencode.json");
    if (fs.existsSync(openCodeConfigPath)) {
      const openCodeConfig = parseJsonFile(openCodeConfigPath);
      if (!openCodeConfig) {
        fixes.push(
          `Fix: Make ${openCodeConfigPath} valid JSON with an "instructions" array.`,
        );
      } else if (!Array.isArray(openCodeConfig.instructions) || openCodeConfig.instructions.length === 0) {
        fixes.push(
          `Fix: Set non-empty array field "instructions" in ${openCodeConfigPath} (or rerun \`codex-promax init\`).`,
        );
      } else {
        const instructions = openCodeConfig.instructions.filter((value): value is string => typeof value === "string");
        for (const expectedInstruction of [".agent/context/*.md", ".agent/prompts/*.md"]) {
          if (!instructions.includes(expectedInstruction)) {
            fixes.push(
              `Fix: Add "${expectedInstruction}" to ${openCodeConfigPath} instructions (or rerun \`codex-promax init\`).`,
            );
          }
        }
      }
    }

    const openCodeAgentPaths = [
      ".opencode/agents/browser-debugger.md",
      ".opencode/agents/code-mapper.md",
      ".opencode/agents/docs-researcher.md",
      ".opencode/agents/reviewer.md",
    ];

    for (const relativePath of openCodeAgentPaths) {
      const absolutePath = path.resolve(options.root, relativePath);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const frontmatter = parseFrontmatter(absolutePath);
      if (!frontmatter) {
        fixes.push(
          `Fix: Add YAML frontmatter with non-empty description and mode to ${absolutePath}.`,
        );
        continue;
      }

      const description = frontmatter.description;
      const mode = frontmatter.mode;
      if (typeof description !== "string" || description.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field "description" in ${absolutePath}.`);
      }

      if (typeof mode !== "string" || mode.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field "mode" in ${absolutePath}.`);
      }
    }

    const openCodeCommandPaths = [
      ".opencode/commands/implementation-plan.md",
      ".opencode/commands/review-changes.md",
      ".opencode/commands/validate-readiness.md",
    ];

    for (const relativePath of openCodeCommandPaths) {
      const absolutePath = path.resolve(options.root, relativePath);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const frontmatter = parseFrontmatter(absolutePath);
      if (!frontmatter) {
        fixes.push(
          `Fix: Add YAML frontmatter with non-empty description to ${absolutePath}.`,
        );
        continue;
      }

      const description = frontmatter.description;
      if (typeof description !== "string" || description.trim().length === 0) {
        fixes.push(`Fix: Set non-empty frontmatter field "description" in ${absolutePath}.`);
      }
    }
  }

  return fixes;
}

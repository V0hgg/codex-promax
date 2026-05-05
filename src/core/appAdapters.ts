import { AppId } from "./apps";

export const CORE_SKILL_NAMES = ["init-harness", "execplan-create", "execplan-execute"] as const;

export type CoreSkillName = (typeof CORE_SKILL_NAMES)[number];

export interface AppAdapter {
  id: AppId;
  label: string;
  projectRequiredPaths: string[];
  projectNativePrefixes: string[];
  projectSkillDirs: string[];
  userSkillDir: string | null;
}

export const APP_ADAPTERS: Record<AppId, AppAdapter> = {
  agents: {
    id: "agents",
    label: "Generic AGENTS",
    projectRequiredPaths: ["AGENTS.md"],
    projectNativePrefixes: [],
    projectSkillDirs: [".agents/skills"],
    userSkillDir: ".agents/skills",
  },
  codex: {
    id: "codex",
    label: "Codex",
    projectRequiredPaths: [
      "AGENTS.md",
      ".codex/config.toml",
      ".codex/agents/browser-debugger.toml",
      ".codex/agents/code-mapper.toml",
      ".codex/agents/docs-researcher.toml",
      ".codex/agents/reviewer.toml",
    ],
    projectNativePrefixes: [".codex/"],
    projectSkillDirs: [".agents/skills"],
    userSkillDir: ".codex/skills",
  },
  claude: {
    id: "claude",
    label: "Claude Code",
    projectRequiredPaths: [
      "CLAUDE.md",
      ".claude/settings.json",
      ".mcp.json",
      ".claude/agents/browser-debugger.md",
      ".claude/agents/code-mapper.md",
      ".claude/agents/docs-researcher.md",
      ".claude/agents/reviewer.md",
    ],
    projectNativePrefixes: [".claude/", ".mcp.json"],
    projectSkillDirs: [".claude/skills"],
    userSkillDir: ".claude/skills",
  },
  augment: {
    id: "augment",
    label: "Augment",
    projectRequiredPaths: ["AGENTS.md", "CLAUDE.md"],
    projectNativePrefixes: [],
    projectSkillDirs: [],
    userSkillDir: null,
  },
  opencode: {
    id: "opencode",
    label: "OpenCode",
    projectRequiredPaths: [
      "AGENTS.md",
      "opencode.json",
      ".opencode/agents/browser-debugger.md",
      ".opencode/agents/code-mapper.md",
      ".opencode/agents/docs-researcher.md",
      ".opencode/agents/reviewer.md",
      ".opencode/commands/implementation-plan.md",
      ".opencode/commands/review-changes.md",
      ".opencode/commands/validate-readiness.md",
    ],
    projectNativePrefixes: [".opencode/", "opencode.json"],
    projectSkillDirs: [".agents/skills"],
    userSkillDir: ".agents/skills",
  },
  antigravity: {
    id: "antigravity",
    label: "Google Antigravity",
    projectRequiredPaths: ["AGENTS.md", "GEMINI.md", "docs/ANTIGRAVITY_SETUP.md"],
    projectNativePrefixes: ["GEMINI.md", "docs/ANTIGRAVITY_SETUP.md"],
    projectSkillDirs: [".agent/skills"],
    userSkillDir: ".gemini/antigravity/skills",
  },
};

export function selectedAppAdapters(apps: AppId[]): AppAdapter[] {
  return apps.map((app) => APP_ADAPTERS[app]);
}

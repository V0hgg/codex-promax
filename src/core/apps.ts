export type AppId = "agents" | "codex" | "claude" | "augment" | "opencode" | "antigravity";

export interface AppTargets {
  values: AppId[];
  needsAgentsFile: boolean;
  needsClaudeFile: boolean;
  needsGeminiFile: boolean;
  needsSharedSkills: boolean;
  needsClaudeSkills: boolean;
  needsAntigravitySkills: boolean;
  needsCodexFiles: boolean;
  needsClaudeNativeFiles: boolean;
  needsOpenCodeFiles: boolean;
  needsAntigravityFiles: boolean;
}

export interface AppRegistryEntry {
  id: AppId;
  label: string;
  projectFiles: string[];
  projectSkillDirs: string[];
  nativeConfigPaths: string[];
  userSkillDir: string | null;
}

export const APP_ORDER: AppId[] = [
  "agents",
  "codex",
  "claude",
  "augment",
  "opencode",
  "antigravity",
];

const APP_ALIASES = new Map<string, AppId>([["common", "agents"]]);
const ALL_APP_IDS: AppId[] = ["agents", "codex", "claude", "augment", "opencode", "antigravity"];

export const APP_REGISTRY: Record<AppId, AppRegistryEntry> = {
  agents: {
    id: "agents",
    label: "Generic AGENTS-compatible tools",
    projectFiles: ["AGENTS.md"],
    projectSkillDirs: [".agents/skills"],
    nativeConfigPaths: [],
    userSkillDir: ".agents/skills",
  },
  codex: {
    id: "codex",
    label: "Codex",
    projectFiles: ["AGENTS.md", ".codex/config.toml", ".codex/agents/"],
    projectSkillDirs: [".agents/skills"],
    nativeConfigPaths: [".codex/config.toml"],
    userSkillDir: ".codex/skills",
  },
  claude: {
    id: "claude",
    label: "Claude Code",
    projectFiles: ["CLAUDE.md", ".claude/settings.json", ".mcp.json", ".claude/agents/"],
    projectSkillDirs: [".claude/skills"],
    nativeConfigPaths: [".claude/settings.json", ".mcp.json"],
    userSkillDir: ".claude/skills",
  },
  augment: {
    id: "augment",
    label: "Augment",
    projectFiles: ["AGENTS.md", "CLAUDE.md"],
    projectSkillDirs: [],
    nativeConfigPaths: [],
    userSkillDir: null,
  },
  opencode: {
    id: "opencode",
    label: "OpenCode",
    projectFiles: ["AGENTS.md", "opencode.json", ".opencode/agents/", ".opencode/commands/"],
    projectSkillDirs: [".agents/skills"],
    nativeConfigPaths: ["opencode.json"],
    userSkillDir: ".agents/skills",
  },
  antigravity: {
    id: "antigravity",
    label: "Google Antigravity",
    projectFiles: ["AGENTS.md", "GEMINI.md", ".agent/skills/"],
    projectSkillDirs: [".agent/skills"],
    nativeConfigPaths: ["docs/ANTIGRAVITY_SETUP.md"],
    userSkillDir: ".gemini/antigravity/skills",
  },
};

export function validAppList(): string {
  return "agents, common, codex, claude, augment, opencode, antigravity, or all";
}

function sortApps(values: Iterable<AppId>): AppId[] {
  const seen = new Set(values);
  return APP_ORDER.filter((app) => seen.has(app));
}

export function parseApps(input: string | undefined): AppTargets {
  const raw = (input ?? "all")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (raw.length === 0) {
    return parseApps("all");
  }

  const validInputs = new Set<string>([...APP_ORDER, "common", "all"]);
  for (const value of raw) {
    if (!validInputs.has(value)) {
      throw new Error(`Invalid app target "${value}". Use ${validAppList()}.`);
    }
  }

  const expanded = new Set<AppId>();
  for (const value of raw) {
    if (value === "all") {
      for (const app of ALL_APP_IDS) {
        expanded.add(app);
      }
      continue;
    }

    expanded.add(APP_ALIASES.get(value) ?? (value as AppId));
  }

  const values = sortApps(expanded);

  return {
    values,
    needsAgentsFile: values.some((app) =>
      ["agents", "codex", "augment", "opencode", "antigravity"].includes(app),
    ),
    needsClaudeFile: values.some((app) => app === "claude" || app === "augment"),
    needsGeminiFile: values.includes("antigravity"),
    needsSharedSkills: values.some((app) => app === "agents" || app === "codex" || app === "opencode"),
    needsClaudeSkills: values.includes("claude"),
    needsAntigravitySkills: values.includes("antigravity"),
    needsCodexFiles: values.includes("codex"),
    needsClaudeNativeFiles: values.includes("claude"),
    needsOpenCodeFiles: values.includes("opencode"),
    needsAntigravityFiles: values.includes("antigravity"),
  };
}

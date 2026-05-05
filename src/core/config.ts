import path from "node:path";
import os from "node:os";

import { AssistantTargets, parseAssistants } from "./assistants";
import { AppTargets, parseApps } from "./apps";
import { InstallScope, parseInstallScope } from "./installScope";
import { InitPreset, parsePreset } from "./presets";
import { resolveRoot } from "./root";

export interface CommonOptions {
  root?: string;
  apps?: string;
  assistants?: string;
  scope?: string;
  yes?: boolean;
  listApps?: boolean;
  listScopes?: boolean;
  preset?: string;
  agentsFile?: string;
  claudeFile?: string;
  geminiFile?: string;
  planDir?: string;
  execplansDir?: string;
  skillsDir?: string;
  claudeSkillsDir?: string;
  antigravitySkillsDir?: string;
  userSkillsDir?: string;
  codexUserSkillsDir?: string;
  claudeUserSkillsDir?: string;
  antigravityUserSkillsDir?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface ResolvedConfig {
  root: string;
  apps: AppTargets;
  assistants: AssistantTargets;
  installScope: InstallScope;
  yes: boolean;
  preset: InitPreset;
  userHomePath: string;
  agentsFilePath: string;
  claudeFilePath: string;
  geminiFilePath: string;
  planDirPath: string;
  plansFilePath: string;
  execplansDirPath: string;
  skillsDirPath: string;
  claudeSkillsDirPath: string;
  antigravitySkillsDirPath: string;
  manifestPath: string;
  userManifestPath: string;
  userSkillsDirPath: string;
  codexUserSkillsDirPath: string;
  claudeUserSkillsDirPath: string;
  antigravityUserSkillsDirPath: string;
  execplanCreateSkillPath: string;
  execplanExecuteSkillPath: string;
  initHarnessSkillPath: string;
  claudeExecplanCreateSkillPath: string;
  claudeExecplanExecuteSkillPath: string;
  claudeInitHarnessSkillPath: string;
  antigravityExecplanCreateSkillPath: string;
  antigravityExecplanExecuteSkillPath: string;
  antigravityInitHarnessSkillPath: string;
  force: boolean;
  dryRun: boolean;
  verbose: boolean;
}

function resolvePath(root: string, value: string): string {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
}

function isInsideOrEqual(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveUserPath(userHomePath: string, value: string): string {
  const resolved = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(userHomePath, value);

  if (!isInsideOrEqual(userHomePath, resolved)) {
    throw new Error(
      `User-scope path "${value}" resolves outside ${userHomePath}. Choose a path inside the user install home.`,
    );
  }

  return resolved;
}

export function resolveConfig(options: CommonOptions, cwd: string = process.cwd()): ResolvedConfig {
  if (options.apps && options.assistants) {
    throw new Error("Use either --apps or --assistants, not both.");
  }

  const root = resolveRoot(options.root, cwd);
  const apps = options.apps ? parseApps(options.apps) : parseAssistants(options.assistants ?? "all");
  const assistants = apps;
  const installScope = parseInstallScope(options.scope);
  const preset = parsePreset(options.preset);
  const userHomePath = path.resolve(process.env.VELORAN_HOME ?? os.homedir());

  const agentsFilePath = resolvePath(root, options.agentsFile ?? "AGENTS.md");
  const claudeFilePath = resolvePath(root, options.claudeFile ?? "CLAUDE.md");
  const geminiFilePath = resolvePath(root, options.geminiFile ?? "GEMINI.md");
  const planDirPath = resolvePath(root, options.planDir ?? ".agent");
  const execplansDirPath = resolvePath(root, options.execplansDir ?? ".agent/execplans");
  const skillsDirPath = resolvePath(root, options.skillsDir ?? ".agents/skills");
  const claudeSkillsDirPath = resolvePath(root, options.claudeSkillsDir ?? ".claude/skills");
  const antigravitySkillsDirPath = resolvePath(
    root,
    options.antigravitySkillsDir ?? ".agent/skills",
  );
  const userSkillsDirPath = resolveUserPath(userHomePath, options.userSkillsDir ?? ".agents/skills");
  const codexUserSkillsDirPath = resolveUserPath(
    userHomePath,
    options.codexUserSkillsDir ?? ".codex/skills",
  );
  const claudeUserSkillsDirPath = resolveUserPath(
    userHomePath,
    options.claudeUserSkillsDir ?? ".claude/skills",
  );
  const antigravityUserSkillsDirPath = resolveUserPath(
    userHomePath,
    options.antigravityUserSkillsDir ?? ".gemini/antigravity/skills",
  );

  const execplanCreateSkillPath = path.join(skillsDirPath, "execplan-create", "SKILL.md");
  const execplanExecuteSkillPath = path.join(skillsDirPath, "execplan-execute", "SKILL.md");
  const initHarnessSkillPath = path.join(skillsDirPath, "init-harness", "SKILL.md");
  const claudeExecplanCreateSkillPath = path.join(
    claudeSkillsDirPath,
    "execplan-create",
    "SKILL.md",
  );
  const claudeExecplanExecuteSkillPath = path.join(
    claudeSkillsDirPath,
    "execplan-execute",
    "SKILL.md",
  );
  const claudeInitHarnessSkillPath = path.join(claudeSkillsDirPath, "init-harness", "SKILL.md");
  const antigravityExecplanCreateSkillPath = path.join(
    antigravitySkillsDirPath,
    "execplan-create",
    "SKILL.md",
  );
  const antigravityExecplanExecuteSkillPath = path.join(
    antigravitySkillsDirPath,
    "execplan-execute",
    "SKILL.md",
  );
  const antigravityInitHarnessSkillPath = path.join(
    antigravitySkillsDirPath,
    "init-harness",
    "SKILL.md",
  );

  return {
    root,
    apps,
    assistants,
    installScope,
    yes: Boolean(options.yes),
    preset,
    userHomePath,
    agentsFilePath,
    claudeFilePath,
    geminiFilePath,
    planDirPath,
    plansFilePath: path.join(planDirPath, "PLANS.md"),
    execplansDirPath,
    skillsDirPath,
    claudeSkillsDirPath,
    antigravitySkillsDirPath,
    manifestPath: path.join(planDirPath, "veloran-manifest.json"),
    userManifestPath: resolveUserPath(userHomePath, ".veloran/manifest.json"),
    userSkillsDirPath,
    codexUserSkillsDirPath,
    claudeUserSkillsDirPath,
    antigravityUserSkillsDirPath,
    execplanCreateSkillPath,
    execplanExecuteSkillPath,
    initHarnessSkillPath,
    claudeExecplanCreateSkillPath,
    claudeExecplanExecuteSkillPath,
    claudeInitHarnessSkillPath,
    antigravityExecplanCreateSkillPath,
    antigravityExecplanExecuteSkillPath,
    antigravityInitHarnessSkillPath,
    force: Boolean(options.force),
    dryRun: Boolean(options.dryRun),
    verbose: Boolean(options.verbose),
  };
}

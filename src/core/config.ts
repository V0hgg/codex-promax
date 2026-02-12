import path from "node:path";

import { AssistantTargets, parseAssistants } from "./assistants";
import { resolveRoot } from "./root";

export interface CommonOptions {
  root?: string;
  assistants?: string;
  agentsFile?: string;
  claudeFile?: string;
  planDir?: string;
  execplansDir?: string;
  skillsDir?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface ResolvedConfig {
  root: string;
  assistants: AssistantTargets;
  agentsFilePath: string;
  claudeFilePath: string;
  planDirPath: string;
  plansFilePath: string;
  execplansDirPath: string;
  skillsDirPath: string;
  execplanCreateSkillPath: string;
  execplanExecuteSkillPath: string;
  force: boolean;
  dryRun: boolean;
}

function resolvePath(root: string, value: string): string {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
}

export function resolveConfig(options: CommonOptions, cwd: string = process.cwd()): ResolvedConfig {
  const root = resolveRoot(options.root, cwd);
  const assistants = parseAssistants(options.assistants ?? "all");

  const agentsFilePath = resolvePath(root, options.agentsFile ?? "AGENTS.md");
  const claudeFilePath = resolvePath(root, options.claudeFile ?? "CLAUDE.md");
  const planDirPath = resolvePath(root, options.planDir ?? ".agent");
  const execplansDirPath = resolvePath(root, options.execplansDir ?? ".agent/execplans");
  const skillsDirPath = resolvePath(root, options.skillsDir ?? ".agents/skills");

  const execplanCreateSkillPath = path.join(skillsDirPath, "execplan-create", "SKILL.md");
  const execplanExecuteSkillPath = path.join(skillsDirPath, "execplan-execute", "SKILL.md");

  return {
    root,
    assistants,
    agentsFilePath,
    claudeFilePath,
    planDirPath,
    plansFilePath: path.join(planDirPath, "PLANS.md"),
    execplansDirPath,
    skillsDirPath,
    execplanCreateSkillPath,
    execplanExecuteSkillPath,
    force: Boolean(options.force),
    dryRun: Boolean(options.dryRun),
  };
}

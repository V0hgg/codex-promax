import fs from "node:fs";

import YAML from "yaml";

import { MANAGED_BEGIN, MANAGED_END } from "./managedBlock";

const REQUIRED_PLAN_HEADINGS = [
  "## Progress",
  "## Surprises & Discoveries",
  "## Decision Log",
  "## Outcomes & Retrospective",
];

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

export interface DoctorCheckOptions {
  plansFilePath: string;
  execplansDirPath: string;
  agentsFilePath: string;
  claudeFilePath: string;
  execplanCreateSkillPath: string;
  execplanExecuteSkillPath: string;
  checkAgentsFile: boolean;
  checkClaudeFile: boolean;
  checkCodexSkills: boolean;
}

export function runDoctorChecks(options: DoctorCheckOptions): string[] {
  const fixes: string[] = [];

  if (!fs.existsSync(options.plansFilePath)) {
    fixes.push(`Fix: Create ${options.plansFilePath} (run \`execplans init\`).`);
  }

  if (!fs.existsSync(options.execplansDirPath)) {
    fixes.push(`Fix: Create ${options.execplansDirPath} directory (run \`execplans init\`).`);
  }

  if (options.checkAgentsFile) {
    if (!fs.existsSync(options.agentsFilePath)) {
      fixes.push(`Fix: Create ${options.agentsFilePath} with execplans managed block (run \`execplans init\`).`);
    } else {
      const content = fs.readFileSync(options.agentsFilePath, "utf8");
      if (!hasManagedMarkers(content)) {
        fixes.push(
          `Fix: Add ${MANAGED_BEGIN} and ${MANAGED_END} markers to ${options.agentsFilePath} (or rerun \`execplans init\`).`,
        );
      }
    }
  }

  if (options.checkClaudeFile) {
    if (!fs.existsSync(options.claudeFilePath)) {
      fixes.push(`Fix: Create ${options.claudeFilePath} with execplans managed block (run \`execplans init\`).`);
    } else {
      const content = fs.readFileSync(options.claudeFilePath, "utf8");
      if (!hasManagedMarkers(content)) {
        fixes.push(
          `Fix: Add ${MANAGED_BEGIN} and ${MANAGED_END} markers to ${options.claudeFilePath} (or rerun \`execplans init\`).`,
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

  if (options.checkCodexSkills) {
    const skillFiles = [options.execplanCreateSkillPath, options.execplanExecuteSkillPath];

    for (const skillPath of skillFiles) {
      if (!fs.existsSync(skillPath)) {
        fixes.push(`Fix: Create ${skillPath} (run \`execplans init\`).`);
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

  return fixes;
}

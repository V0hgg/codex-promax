import path from "node:path";

import { CommonOptions, resolveConfig } from "../core/config";
import {
  ActionContext,
  ensureDirectory,
  writeIfMissingOrForce,
  writeManagedFile,
} from "../core/fsPlan";
import { readTemplate } from "../core/templates";

export interface InitIo {
  log: (line: string) => void;
}

const defaultIo: InitIo = {
  log: (line: string) => {
    console.log(line);
  },
};

export async function runInit(options: CommonOptions, io: InitIo = defaultIo): Promise<number> {
  const config = resolveConfig(options);

  const actionContext: ActionContext = {
    dryRun: config.dryRun,
    root: config.root,
    log: io.log,
  };

  ensureDirectory(config.planDirPath, actionContext);
  ensureDirectory(config.execplansDirPath, actionContext);

  if (config.assistants.needsCodexSkills) {
    ensureDirectory(config.skillsDirPath, actionContext);
    ensureDirectory(path.dirname(config.execplanCreateSkillPath), actionContext);
    ensureDirectory(path.dirname(config.execplanExecuteSkillPath), actionContext);
  }

  writeIfMissingOrForce(config.plansFilePath, readTemplate("PLANS.md"), actionContext, config.force);
  writeIfMissingOrForce(
    path.join(config.execplansDirPath, "README.md"),
    readTemplate("execplans_README.md"),
    actionContext,
    config.force,
  );

  if (config.assistants.needsAgentsFile) {
    writeManagedFile(
      config.agentsFilePath,
      readTemplate("AGENTS.managed.md"),
      actionContext,
      config.force,
    );
  }

  if (config.assistants.needsClaudeFile) {
    writeManagedFile(
      config.claudeFilePath,
      readTemplate("CLAUDE.managed.md"),
      actionContext,
      config.force,
    );
  }

  if (config.assistants.needsCodexSkills) {
    writeIfMissingOrForce(
      config.execplanCreateSkillPath,
      readTemplate("skills/execplan-create.SKILL.md"),
      actionContext,
      config.force,
    );
    writeIfMissingOrForce(
      config.execplanExecuteSkillPath,
      readTemplate("skills/execplan-execute.SKILL.md"),
      actionContext,
      config.force,
    );
  }

  return 0;
}

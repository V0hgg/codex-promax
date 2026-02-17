import path from "node:path";

import { CommonOptions, resolveConfig } from "../core/config";
import {
  ActionContext,
  applyTemplateEntries,
  ensureDirectory,
  TemplateCopyEntry,
  writeIfMissingOrForce,
  writeManagedFile,
} from "../core/fsPlan";
import { listTemplateFiles, readTemplate } from "../core/templates";

export interface InitIo {
  log: (line: string) => void;
}

const defaultIo: InitIo = {
  log: (line: string) => {
    console.log(line);
  },
};

function buildPresetTemplateEntries(root: string, preset: string): TemplateCopyEntry[] {
  const presetPrefix = `presets/${preset}/`;
  const templateFiles = listTemplateFiles(`presets/${preset}`);

  return templateFiles.map((templateRelativePath) => {
    if (!templateRelativePath.startsWith(presetPrefix)) {
      throw new Error(
        `Preset template path "${templateRelativePath}" is outside "${presetPrefix}".`,
      );
    }

    const destinationRelativePath = templateRelativePath.slice(presetPrefix.length);
    return {
      templateRelativePath,
      destinationAbsolutePath: path.resolve(root, destinationRelativePath),
      executable: destinationRelativePath.endsWith(".sh"),
    };
  });
}

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

  const presetEntries = buildPresetTemplateEntries(config.root, config.preset);
  applyTemplateEntries(presetEntries, actionContext, config.force);

  return 0;
}

import { spawnSync } from "node:child_process";
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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function powershellQuote(value: string): string {
  return value.replace(/'/g, "''");
}

function hasPosixCommand(command: string): boolean {
  return spawnSync("sh", ["-lc", `command -v ${command} >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function resolveClipboardCommand(promptPath: string): string | null {
  if (process.platform === "darwin" && hasPosixCommand("pbcopy")) {
    return `pbcopy < ${shellQuote(promptPath)}`;
  }

  if (process.platform === "linux") {
    if (hasPosixCommand("wl-copy")) {
      return `wl-copy < ${shellQuote(promptPath)}`;
    }

    if (hasPosixCommand("xclip")) {
      return `xclip -selection clipboard < ${shellQuote(promptPath)}`;
    }
  }

  if (process.platform === "win32") {
    const probe = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"],
      { stdio: "ignore" },
    );

    if (probe.status === 0) {
      return `powershell -NoProfile -Command "Get-Content -Raw '${powershellQuote(promptPath)}' | Set-Clipboard"`;
    }
  }

  return null;
}

function resolvePromptPrintCommand(promptPath: string): string {
  if (process.platform === "win32") {
    return `powershell -NoProfile -Command "Get-Content -Raw '${powershellQuote(promptPath)}'"`;
  }

  return `cat ${shellQuote(promptPath)}`;
}

function printCodexMaxNextSteps(io: InitIo, promptPath: string): void {
  const clipboardCommand = resolveClipboardCommand(promptPath);

  io.log("");
  io.log("Veloran is ready.");
  io.log("");

  if (clipboardCommand) {
    io.log("Copy the telemetry prompt:");
    io.log(`  ${clipboardCommand}`);
    io.log("");
    io.log("Then paste it into your coding agent in this repo and wait for it to finish.");
  } else {
    io.log("Print the telemetry prompt:");
    io.log(`  ${resolvePromptPrintCommand(promptPath)}`);
    io.log("");
    io.log("Then copy the output, paste it into your coding agent in this repo, and wait for it to finish.");
  }

  io.log("If the repo already has a real local cluster/bootstrap start path, the agent will reuse it.");
  io.log("If the start path is unclear, the agent will inspect first and then ask you for the right local command.");
  io.log("");
  io.log("Optional check after setup:");
  io.log("  npx -y veloran@latest doctor");
}

function buildPresetTemplateEntries(root: string, preset: string): TemplateCopyEntry[] {
  const presetPrefix = `presets/${preset}/`;
  const templateFiles = listTemplateFiles(`presets/${preset}`);

  return templateFiles.map((templateRelativePath) => {
    if (!templateRelativePath.startsWith(presetPrefix)) {
      throw new Error(
        `Preset template path "${templateRelativePath}" is outside "${presetPrefix}".`,
      );
    }

    const templateDestinationPath = templateRelativePath.slice(presetPrefix.length);
    const destinationRelativePath = templateDestinationPath.endsWith(".npmignore")
      ? `${templateDestinationPath.slice(0, -".npmignore".length)}.gitignore`
      : templateDestinationPath;
    return {
      templateRelativePath,
      destinationAbsolutePath: path.resolve(root, destinationRelativePath),
      executable: destinationRelativePath.endsWith(".sh"),
    };
  });
}

export async function runInit(options: CommonOptions, io: InitIo = defaultIo): Promise<number> {
  const config = resolveConfig(options);
  const shouldLogActions = config.dryRun || config.verbose;

  const actionContext: ActionContext = {
    dryRun: config.dryRun,
    root: config.root,
    log: shouldLogActions ? io.log : () => {},
  };

  ensureDirectory(config.planDirPath, actionContext);
  ensureDirectory(config.execplansDirPath, actionContext);

  if (config.assistants.needsSharedSkills) {
    ensureDirectory(config.skillsDirPath, actionContext);
    ensureDirectory(path.dirname(config.execplanCreateSkillPath), actionContext);
    ensureDirectory(path.dirname(config.execplanExecuteSkillPath), actionContext);
  }

  if (config.assistants.needsClaudeSkills) {
    ensureDirectory(config.claudeSkillsDirPath, actionContext);
    ensureDirectory(path.dirname(config.claudeExecplanCreateSkillPath), actionContext);
    ensureDirectory(path.dirname(config.claudeExecplanExecuteSkillPath), actionContext);
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

  if (config.assistants.needsSharedSkills) {
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

  if (config.assistants.needsClaudeSkills) {
    writeIfMissingOrForce(
      config.claudeExecplanCreateSkillPath,
      readTemplate("skills/execplan-create.SKILL.md"),
      actionContext,
      config.force,
    );
    writeIfMissingOrForce(
      config.claudeExecplanExecuteSkillPath,
      readTemplate("skills/execplan-execute.SKILL.md"),
      actionContext,
      config.force,
    );
  }

  const presetEntries = buildPresetTemplateEntries(config.root, config.preset);
  applyTemplateEntries(presetEntries, actionContext, config.force);

  if (!config.dryRun && config.preset === "codex-max") {
    printCodexMaxNextSteps(
      io,
      path.resolve(config.root, ".agent", "prompts", "integrate-local-telemetry.md"),
    );
  }

  return 0;
}

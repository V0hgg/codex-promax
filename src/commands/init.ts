import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import { APP_REGISTRY, validAppList } from "../core/apps";
import { CORE_SKILL_NAMES, CoreSkillName } from "../core/appAdapters";
import { CommonOptions, resolveConfig } from "../core/config";
import {
  ActionContext,
  applyTemplateEntries,
  ensureDirectory,
  TemplateCopyEntry,
  writeIfMissingOrForce,
  writeManagedFile,
} from "../core/fsPlan";
import { scopeIncludesProject, scopeIncludesUser } from "../core/installScope";
import { presetTemplateDirectory } from "../core/presets";
import { resolveRoot } from "../core/root";
import { listTemplateFiles, readTemplate } from "../core/templates";

export interface InitIo {
  log: (line: string) => void;
  prompt?: (question: string) => Promise<string>;
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

function getPackageVersion(): string {
  const packageJsonPath = path.resolve(__dirname, "..", "..", "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version as string;
}

async function promptLine(io: InitIo, question: string): Promise<string> {
  if (io.prompt) {
    return io.prompt(question);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

function canPrompt(io: InitIo): boolean {
  return Boolean(io.prompt) || Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function resolveInteractiveOptions(options: CommonOptions, io: InitIo): Promise<CommonOptions> {
  const hasAppSelection = Boolean(options.apps || options.assistants);
  const hasScopeSelection = Boolean(options.scope);
  const hasInstallPath = Boolean(options.root || options.installPath || options.path);
  const hasUserHome = Boolean(options.userHome || process.env.VELORAN_HOME);
  const shouldPrompt =
    canPrompt(io)
    && !options.yes
    && (Boolean(options.magic) || !hasAppSelection || !hasScopeSelection);

  if (!shouldPrompt) {
    return options;
  }

  const next: CommonOptions = { ...options };

  if (!hasScopeSelection) {
    const answer = (await promptLine(
      io,
      "Install Veloran where? local project, global user, or both [local]: ",
    )).trim();
    const normalized = answer.toLowerCase();
    next.scope = normalized === "global" ? "user" : normalized === "local" ? "project" : answer || "project";
  }

  const chosenScope = (next.scope ?? "project").trim().toLowerCase();
  const includesProject = chosenScope === "project" || chosenScope === "both" || chosenScope === "local";
  const includesUser = chosenScope === "user" || chosenScope === "both" || chosenScope === "global";

  if (includesProject && !hasInstallPath) {
    const defaultRoot = resolveRoot(undefined, process.cwd());
    const answer = (await promptLine(
      io,
      `Install local project harness at which path? [${defaultRoot}]: `,
    )).trim();
    if (answer.length > 0) {
      next.root = answer;
    }
  }

  if (includesUser && !hasUserHome) {
    const defaultHome = process.env.VELORAN_HOME ?? process.env.HOME ?? "~";
    const answer = (await promptLine(
      io,
      `Install global skills/prompts under which user path? [${defaultHome}]: `,
    )).trim();
    if (answer.length > 0) {
      next.userHome = answer;
    }
  }

  if (!hasAppSelection) {
    const answer = (await promptLine(
      io,
      `Which vendor/apps should Veloran support? ${validAppList()} [all]: `,
    )).trim();
    next.apps = answer || "all";
  }

  if (next.force === undefined) {
    const answer = (await promptLine(io, "Overwrite existing managed files when needed? y/N: ")).trim();
    next.force = /^y(es)?$/i.test(answer);
  }

  const scope = (next.scope ?? "project").trim().toLowerCase();
  if ((scope === "user" || scope === "both" || scope === "global") && !next.dryRun) {
    const answer = (await promptLine(
      io,
      "User-scope install can affect all repositories for this user. Continue? y/N: ",
    )).trim();
    if (!/^y(es)?$/i.test(answer)) {
      throw new Error("User-scope install cancelled.");
    }
    next.yes = true;
  }

  return next;
}

function printAppList(io: InitIo): void {
  io.log("Vendor/app targets:");
  for (const app of Object.values(APP_REGISTRY)) {
    io.log(`  ${app.id}: ${app.label}`);
  }
  io.log("  common: alias for agents");
  io.log("  all: all supported targets");
}

function printScopeList(io: InitIo): void {
  io.log("Install scopes:");
  io.log("  project: write repository-local harness files");
  io.log("  user: write user-global skills only");
  io.log("  both: write project files and user-global skills");
}

function printHarnessNextSteps(io: InitIo, initHarnessSkillPath: string | null, appList: string): void {
  const promptCommand = "npx -y veloran@latest prompt init-harness";
  const clipboardCommand = initHarnessSkillPath ? resolveClipboardCommand(initHarnessSkillPath) : null;

  io.log("");
  io.log("Veloran is ready.");
  io.log("");
  io.log("Core skills installed:");
  for (const skillName of CORE_SKILL_NAMES) {
    io.log(`  ${skillName}`);
  }
  io.log("");
  io.log("Next step:");
  io.log("  Mention the init-harness skill in your coding agent, or run:");
  io.log(`    ${promptCommand}`);
  io.log("");

  if (clipboardCommand) {
    io.log("If your app discovers skills from files, the project-local skill can also be copied with:");
    io.log(`  ${clipboardCommand}`);
  } else if (initHarnessSkillPath) {
    io.log("If your app discovers skills from files, the project-local skill is at:");
    io.log(`  ${initHarnessSkillPath}`);
  } else {
    io.log("If your app does not discover skills automatically, print the harness prompt:");
    io.log(`  ${promptCommand}`);
  }

  io.log("");
  io.log("The init-harness workflow will reuse real project start paths when they are discoverable.");
  io.log("If secrets, database URLs, or service endpoints are missing, it will prepare the config files and ask only for those values.");
  io.log("");
  io.log("Optional check after setup:");
  io.log(`  npx -y veloran@latest doctor --apps ${appList} --preset harness`);
}

function primaryInitHarnessSkillPath(config: ReturnType<typeof resolveConfig>): string | null {
  if (config.apps.needsAntigravitySkills) {
    return config.antigravityInitHarnessSkillPath;
  }

  if (config.apps.needsClaudeSkills) {
    return config.claudeInitHarnessSkillPath;
  }

  if (config.apps.needsSharedSkills) {
    return config.initHarnessSkillPath;
  }

  return null;
}

function shouldIncludePresetDestination(destinationRelativePath: string, config: ReturnType<typeof resolveConfig>): boolean {
  if (destinationRelativePath.startsWith(".codex/")) {
    return config.apps.needsCodexFiles;
  }

  if (destinationRelativePath.startsWith(".claude/") || destinationRelativePath === ".mcp.json") {
    return config.apps.needsClaudeNativeFiles;
  }

  if (destinationRelativePath.startsWith(".opencode/") || destinationRelativePath === "opencode.json") {
    return config.apps.needsOpenCodeFiles;
  }

  if (destinationRelativePath.startsWith(".agents/skills/")) {
    return config.apps.needsSharedSkills;
  }

  return true;
}

function buildPresetTemplateEntries(config: ReturnType<typeof resolveConfig>): TemplateCopyEntry[] {
  const presetDirectory = presetTemplateDirectory(config.preset);
  const presetPrefix = `presets/${presetDirectory}/`;
  const templateFiles = listTemplateFiles(`presets/${presetDirectory}`);

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
      destinationAbsolutePath: path.resolve(config.root, destinationRelativePath),
      executable: destinationRelativePath.endsWith(".sh"),
    };
  }).filter((entry) =>
    shouldIncludePresetDestination(path.relative(config.root, entry.destinationAbsolutePath), config),
  );
}

function skillTemplateName(skillName: CoreSkillName): "skills/init-harness.SKILL.md" | "skills/execplan-create.SKILL.md" | "skills/execplan-execute.SKILL.md" {
  return `skills/${skillName}.SKILL.md` as
    | "skills/init-harness.SKILL.md"
    | "skills/execplan-create.SKILL.md"
    | "skills/execplan-execute.SKILL.md";
}

function writeCoreSkillsToDirectory(
  skillDirectoryPath: string,
  actionContext: ActionContext,
  force: boolean,
): void {
  ensureDirectory(skillDirectoryPath, actionContext);
  for (const skillName of CORE_SKILL_NAMES) {
    const skillPath = path.join(skillDirectoryPath, skillName, "SKILL.md");
    ensureDirectory(path.dirname(skillPath), actionContext);
    writeIfMissingOrForce(skillPath, readTemplate(skillTemplateName(skillName)), actionContext, force);
  }
}

function buildKnowledgeTemplateEntries(
  config: ReturnType<typeof resolveConfig>,
  scope: "project" | "user",
): TemplateCopyEntry[] {
  const templateRoot = `knowledge/${scope}`;
  const templatePrefix = `${templateRoot}/`;
  const destinationRoot =
    scope === "project" ? config.projectKnowledgeDirPath : config.userKnowledgeDirPath;

  return listTemplateFiles(templateRoot).map((templateRelativePath) => {
    if (!templateRelativePath.startsWith(templatePrefix)) {
      throw new Error(
        `Knowledge template path "${templateRelativePath}" is outside "${templatePrefix}".`,
      );
    }

    return {
      templateRelativePath,
      destinationAbsolutePath: path.join(
        destinationRoot,
        templateRelativePath.slice(templatePrefix.length),
      ),
    };
  });
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths));
}

function projectSkillDirectories(config: ReturnType<typeof resolveConfig>): string[] {
  const directories: string[] = [];

  if (config.apps.needsSharedSkills) {
    directories.push(config.skillsDirPath);
  }

  if (config.apps.needsClaudeSkills) {
    directories.push(config.claudeSkillsDirPath);
  }

  if (config.apps.needsAntigravitySkills) {
    directories.push(config.antigravitySkillsDirPath);
  }

  return uniquePaths(directories);
}

function userSkillDirectories(config: ReturnType<typeof resolveConfig>): string[] {
  const directories: string[] = [];

  for (const app of config.apps.values) {
    if (app === "agents" || app === "opencode") {
      directories.push(config.userSkillsDirPath);
    }

    if (app === "codex") {
      directories.push(config.codexUserSkillsDirPath);
    }

    if (app === "claude") {
      directories.push(config.claudeUserSkillsDirPath);
    }

    if (app === "antigravity") {
      directories.push(config.antigravityUserSkillsDirPath);
    }
  }

  return uniquePaths(directories);
}

function buildManifest(config: ReturnType<typeof resolveConfig>, scope: "project" | "user"): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      package: "veloran",
      version: getPackageVersion(),
      preset: config.preset,
      templatePreset: presetTemplateDirectory(config.preset),
      apps: config.apps.values,
      installScope: scope,
      generatedFileFamilies: [
        "instructions",
        "skills",
        "execplans",
        "context",
        "memory",
        "knowledge",
        "harness",
        "docs",
        "mcp-config",
      ],
      secretsPolicy:
        "Do not store secrets in .agent/memory, .agent/context, plans, docs, prompts, transcripts, or validation logs.",
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`;
}

function writeProjectInstall(config: ReturnType<typeof resolveConfig>, actionContext: ActionContext): void {
  ensureDirectory(config.planDirPath, actionContext);
  ensureDirectory(config.execplansDirPath, actionContext);

  writeIfMissingOrForce(config.plansFilePath, readTemplate("PLANS.md"), actionContext, config.force);
  writeIfMissingOrForce(
    path.join(config.execplansDirPath, "README.md"),
    readTemplate("execplans_README.md"),
    actionContext,
    config.force,
  );

  if (config.apps.needsAgentsFile) {
    writeManagedFile(
      config.agentsFilePath,
      readTemplate("AGENTS.managed.md"),
      actionContext,
      config.force,
    );
  }

  if (config.apps.needsClaudeFile) {
    writeManagedFile(
      config.claudeFilePath,
      readTemplate("CLAUDE.managed.md"),
      actionContext,
      config.force,
    );
  }

  if (config.apps.needsGeminiFile) {
    writeManagedFile(
      config.geminiFilePath,
      readTemplate("GEMINI.managed.md"),
      actionContext,
      config.force,
    );
  }

  const presetEntries = buildPresetTemplateEntries(config);
  applyTemplateEntries(presetEntries, actionContext, config.force);

  for (const skillDirectory of projectSkillDirectories(config)) {
    writeCoreSkillsToDirectory(skillDirectory, actionContext, config.force);
  }

  if (config.knowledgeEnabled && config.preset === "harness") {
    applyTemplateEntries(buildKnowledgeTemplateEntries(config, "project"), actionContext, config.force);
  }

  writeIfMissingOrForce(
    config.manifestPath,
    buildManifest(config, "project"),
    actionContext,
    config.force,
  );
}

function writeUserInstall(config: ReturnType<typeof resolveConfig>, actionContext: ActionContext, io: InitIo): void {
  io.log(`User install home: ${config.userHomePath}`);

  for (const skillDirectory of userSkillDirectories(config)) {
    writeCoreSkillsToDirectory(skillDirectory, actionContext, config.force);
  }

  if (config.apps.needsAgentsFile) {
    writeManagedFile(
      config.userAgentsFilePath,
      readTemplate("AGENTS.managed.md"),
      actionContext,
      false,
    );
  }

  if (config.apps.needsClaudeFile) {
    writeManagedFile(
      config.userClaudeFilePath,
      readTemplate("CLAUDE.managed.md"),
      actionContext,
      false,
    );
  }

  if (config.apps.needsGeminiFile) {
    writeManagedFile(
      config.userGeminiFilePath,
      readTemplate("GEMINI.managed.md"),
      actionContext,
      false,
    );
  }

  if (config.knowledgeEnabled && config.preset === "harness") {
    applyTemplateEntries(buildKnowledgeTemplateEntries(config, "user"), actionContext, config.force);
  }

  const manifest = buildManifest(config, "user");
  if (config.dryRun) {
    io.log("Planned user-scope manifest:");
    io.log(manifest.trimEnd());
  }

  writeIfMissingOrForce(config.userManifestPath, manifest, actionContext, config.force);
}

export async function runInit(options: CommonOptions, io: InitIo = defaultIo): Promise<number> {
  const interactiveOptions = await resolveInteractiveOptions(options, io);

  if (interactiveOptions.listApps) {
    printAppList(io);
    return 0;
  }

  if (interactiveOptions.listScopes) {
    printScopeList(io);
    return 0;
  }

  const config = resolveConfig(interactiveOptions);

  if (scopeIncludesUser(config.installScope) && !config.dryRun && !config.yes) {
    throw new Error(
      "User-scope install requires --yes or interactive confirmation. Run with --dry-run first to preview global writes.",
    );
  }

  const shouldLogActions = config.dryRun || config.verbose;

  const projectActionContext: ActionContext = {
    dryRun: config.dryRun,
    root: config.root,
    log: shouldLogActions ? io.log : () => {},
  };

  if (scopeIncludesProject(config.installScope)) {
    writeProjectInstall(config, projectActionContext);
  }

  if (scopeIncludesUser(config.installScope)) {
    const userActionContext: ActionContext = {
      dryRun: config.dryRun,
      root: config.userHomePath,
      log: io.log,
    };
    writeUserInstall(config, userActionContext, io);
  }

  if (!config.dryRun) {
    if (scopeIncludesProject(config.installScope)) {
      printHarnessNextSteps(io, primaryInitHarnessSkillPath(config), config.apps.values.join(","));
    } else {
      io.log("");
      io.log("Veloran user skills are ready.");
    }
  }

  return 0;
}

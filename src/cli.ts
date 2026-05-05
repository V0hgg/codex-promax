#!/usr/bin/env node

import { Command, Option } from "commander";
import fs from "node:fs";
import path from "node:path";

import { runDoctor } from "./commands/doctor";
import { runInit } from "./commands/init";
import {
  runPromptExec,
  runPromptHarness,
  runPromptInstall,
  runPromptPlan,
  runPromptTelemetry,
} from "./commands/prompt";
import { DEFAULT_PRESET } from "./core/presets";

interface CommonCliOptions {
  root?: string;
  apps?: string;
  assistants?: string;
  scope?: string;
  magic?: boolean;
  path?: string;
  installPath?: string;
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
  userHome?: string;
  userSkillsDir?: string;
  codexUserSkillsDir?: string;
  claudeUserSkillsDir?: string;
  antigravityUserSkillsDir?: string;
  userAgentsFile?: string;
  userClaudeFile?: string;
  userGeminiFile?: string;
  force?: boolean;
  dryRun?: boolean;
}

function addCommonOptions(command: Command): Command {
  return command
    .addOption(new Option("--root <path>", "set repository root"))
    .addOption(
      new Option(
        "--apps <list>",
        "vendor/app targets: agents,common,codex,claude,augment,opencode,antigravity,all",
      ),
    )
    .addOption(
      new Option(
        "--assistants <list>",
        "compatibility alias for --apps",
      ),
    )
    .addOption(new Option("--scope <scope>", "install scope: project,user,both"))
    .addOption(new Option("--path <path>", "magic installer target path").argParser((value) => value))
    .addOption(new Option("--install-path <path>", "alias for --path").argParser((value) => value))
    .addOption(new Option("--yes", "confirm non-interactive install choices").default(false))
    .addOption(new Option("--list-apps", "list supported vendor/app targets").default(false))
    .addOption(new Option("--list-scopes", "list supported install scopes").default(false))
    .addOption(
      new Option("--preset <name>", "preset: harness,codex-max,standard").default(DEFAULT_PRESET),
    )
    .addOption(new Option("--agents-file <name>", "AGENTS.md filename").default("AGENTS.md"))
    .addOption(new Option("--claude-file <name>", "CLAUDE.md filename").default("CLAUDE.md"))
    .addOption(new Option("--gemini-file <name>", "GEMINI.md filename").default("GEMINI.md"))
    .addOption(new Option("--plan-dir <path>", "path to .agent directory").default(".agent"))
    .addOption(
      new Option("--execplans-dir <path>", "path to execplans directory").default(".agent/execplans"),
    )
    .addOption(
      new Option("--skills-dir <path>", "path to shared skills directory").default(".agents/skills"),
    )
    .addOption(
      new Option("--claude-skills-dir <path>", "path to Claude Code skills directory").default(".claude/skills"),
    )
    .addOption(
      new Option("--antigravity-skills-dir <path>", "path to Antigravity workspace skills directory").default(".agent/skills"),
    )
    .addOption(new Option("--user-home <path>", "user/global install home"))
    .addOption(
      new Option("--user-skills-dir <path>", "user-scope shared skills directory").default(".agents/skills"),
    )
    .addOption(
      new Option("--codex-user-skills-dir <path>", "user-scope Codex skills directory").default(".codex/skills"),
    )
    .addOption(
      new Option("--claude-user-skills-dir <path>", "user-scope Claude Code skills directory").default(".claude/skills"),
    )
    .addOption(
      new Option("--antigravity-user-skills-dir <path>", "user-scope Antigravity skills directory").default(".gemini/antigravity/skills"),
    )
    .addOption(
      new Option("--user-agents-file <path>", "user-scope AGENTS prompt file to append").default(".veloran/prompts/AGENTS.md"),
    )
    .addOption(
      new Option("--user-claude-file <path>", "user-scope Claude prompt file to append").default(".veloran/prompts/CLAUDE.md"),
    )
    .addOption(
      new Option("--user-gemini-file <path>", "user-scope Gemini/Antigravity prompt file to append").default(".veloran/prompts/GEMINI.md"),
    )
    .addOption(new Option("--force", "overwrite managed templates and blocks").default(false))
    .addOption(new Option("--dry-run", "show planned changes without writing files").default(false));
}

export function createProgram(packageVersion: string): Command {
  const program = new Command();
  program
    .name("veloran")
    .description("Scaffold and validate multi-vendor coding-agent harness workflows")
    .version(packageVersion)
    .showHelpAfterError();

  const magic = addCommonOptions(
    program
      .command("magic", { isDefault: true })
      .addOption(new Option("--verbose", "show file-by-file scaffold actions").default(false))
      .description("launch the interactive Veloran harness installer"),
  );
  magic.action(async (options: CommonCliOptions) => {
    const code = await runInit({ ...options, magic: true });
    process.exitCode = code;
  });

  const init = addCommonOptions(
    program
      .command("init")
      .addOption(new Option("--verbose", "show file-by-file scaffold actions").default(false))
      .description("scaffold or patch a repo/user coding-agent harness"),
  );
  init.action(async (options: CommonCliOptions) => {
    const code = await runInit(options);
    process.exitCode = code;
  });

  const prompt = program.command("prompt").description("print assistant prompts");

  const promptInstall = addCommonOptions(
    prompt
      .command("install")
      .description("print prompt for a coding agent to install and initialize veloran"),
  );
  promptInstall.action(async (options: CommonCliOptions) => {
    const code = await runPromptInstall(options);
    process.exitCode = code;
  });

  const promptPlan = addCommonOptions(
    prompt
      .command("plan")
      .argument("<title>", "plan title")
      .option("--out <path>", "write a stub plan file")
      .description("print prompt for creating an ExecPlan"),
  );
  promptPlan.action(async (title: string, options: CommonCliOptions & { out?: string }) => {
    const code = await runPromptPlan(title, options);
    process.exitCode = code;
  });

  const promptExec = addCommonOptions(
    prompt
      .command("exec")
      .argument("<planfile>", "path to plan file")
      .description("print prompt for executing an ExecPlan"),
  );
  promptExec.action(async (planfile: string, options: CommonCliOptions) => {
    const code = await runPromptExec(planfile, options);
    process.exitCode = code;
  });

  const promptTelemetry = addCommonOptions(
    prompt
      .command("telemetry")
      .description("compatibility alias for the broader init-harness prompt"),
  );
  promptTelemetry.action(async (options: CommonCliOptions) => {
    const code = await runPromptTelemetry(options);
    process.exitCode = code;
  });

  const promptHarness = addCommonOptions(
    prompt
      .command("harness")
      .description("print prompt for initializing the full local coding-agent harness"),
  );
  promptHarness.action(async (options: CommonCliOptions) => {
    const code = await runPromptHarness(options);
    process.exitCode = code;
  });

  const promptInitHarness = addCommonOptions(
    prompt
      .command("init-harness")
      .description("print prompt for initializing the full local coding-agent harness"),
  );
  promptInitHarness.action(async (options: CommonCliOptions) => {
    const code = await runPromptHarness(options);
    process.exitCode = code;
  });

  const doctor = addCommonOptions(
    program
      .command("doctor")
      .description("validate harness structure, skills, app config, and managed files"),
  );
  doctor.action(async (options: CommonCliOptions) => {
    const code = await runDoctor(options);
    process.exitCode = code;
  });

  return program;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const packageJsonPath = path.resolve(__dirname, "..", "package.json");
  const packageVersion = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version as string;
  await createProgram(packageVersion).parseAsync(argv);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

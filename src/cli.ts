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
    .addOption(new Option("--scope <scope>", "install scope: project,user,both").default("project"))
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
    .addOption(new Option("--force", "overwrite managed templates and blocks").default(false))
    .addOption(new Option("--dry-run", "show planned changes without writing files").default(false));
}

async function main(): Promise<void> {
  const packageJsonPath = path.resolve(__dirname, "..", "package.json");
  const packageVersion = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version as string;

  const program = new Command();
  program
    .name("veloran")
    .description("Scaffold and validate multi-vendor coding-agent harness workflows")
    .version(packageVersion)
    .showHelpAfterError();

  addCommonOptions(
    program
      .command("init")
      .addOption(new Option("--verbose", "show file-by-file scaffold actions").default(false))
      .description("scaffold or patch a repo/user coding-agent harness")
      .action(async (options: CommonCliOptions) => {
        const code = await runInit(options);
        process.exitCode = code;
      }),
  );

  const prompt = program.command("prompt").description("print assistant prompts");

  addCommonOptions(
    prompt
      .command("install")
      .description("print prompt for a coding agent to install and initialize veloran")
      .action(async (options: CommonCliOptions) => {
        const code = await runPromptInstall(options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    prompt
      .command("plan")
      .argument("<title>", "plan title")
      .option("--out <path>", "write a stub plan file")
      .description("print prompt for creating an ExecPlan")
      .action(async (title: string, options: CommonCliOptions & { out?: string }) => {
        const code = await runPromptPlan(title, options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    prompt
      .command("exec")
      .argument("<planfile>", "path to plan file")
      .description("print prompt for executing an ExecPlan")
      .action(async (planfile: string, options: CommonCliOptions) => {
        const code = await runPromptExec(planfile, options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    prompt
      .command("telemetry")
      .description("compatibility alias for the broader init-harness prompt")
      .action(async (options: CommonCliOptions) => {
        const code = await runPromptTelemetry(options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    prompt
      .command("harness")
      .description("print prompt for initializing the full local coding-agent harness")
      .action(async (options: CommonCliOptions) => {
        const code = await runPromptHarness(options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    prompt
      .command("init-harness")
      .description("print prompt for initializing the full local coding-agent harness")
      .action(async (options: CommonCliOptions) => {
        const code = await runPromptHarness(options);
        process.exitCode = code;
      }),
  );

  addCommonOptions(
    program
      .command("doctor")
      .description("validate harness structure, skills, app config, and managed files")
      .action(async (options: CommonCliOptions) => {
        const code = await runDoctor(options);
        process.exitCode = code;
      }),
  );

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

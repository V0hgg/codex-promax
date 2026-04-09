import fs from "node:fs";
import path from "node:path";

import { CommonOptions, resolveConfig } from "../core/config";
import { printAction } from "../core/fsPlan";
import { slugify } from "../core/slugify";
import { readTemplateRelative } from "../core/templates";

export interface PromptPlanOptions extends CommonOptions {
  out?: string;
}

export interface PromptIo {
  log: (line: string) => void;
}

const defaultIo: PromptIo = {
  log: (line: string) => {
    console.log(line);
  },
};

function toRepoRelative(root: string, absolutePath: string): string {
  const relative = path.relative(root, absolutePath);
  return relative || ".";
}

function planPromptString(title: string, planPath: string): string {
  return [
    `Create an ExecPlan for: \"${title}\"`,
    "- Follow .agent/PLANS.md to the letter (read the entire file first).",
    `- Save it to ${planPath}.`,
    "- Make it fully self-contained for a novice with no repo memory.",
    "- Include milestones with explicit validation commands and a clear Definition of Done.",
    "- Include and initialize the required living sections: Progress, Surprises & Discoveries, Decision Log, Outcomes & Retrospective.",
    "- Do not ask me for next steps; produce the complete plan.",
  ].join("\n");
}

function execPromptString(planFile: string): string {
  return [
    `Execute the ExecPlan: ${planFile}`,
    "- Proceed milestone-by-milestone without asking for “next steps”.",
    "- Keep Progress / Surprises & Discoveries / Decision Log / Outcomes & Retrospective updated at every stopping point.",
    "- Resolve ambiguities autonomously and commit frequently.",
    "- Stop only when Definition of Done is satisfied, or you are truly blocked (then record the blocker + proposed default decision in the plan).",
  ].join("\n");
}

function installPromptString(
  root: string,
  preset: string,
  assistants: string,
): string {
  return [
    "Install Codex-Promax in this repository end-to-end.",
    `- Treat ${root} as the repository root.`,
    `- Run \`npx -y codex-promax@latest init --preset ${preset} --assistants ${assistants}\` from that repo root.`,
    "- Do not dump file-by-file scaffold logs unless the command fails or I ask for them.",
    `- Run \`npx -y codex-promax@latest doctor --preset ${preset} --assistants ${assistants}\` after init.`,
    "- If `.agent/prompts/integrate-local-telemetry.md` exists, copy it to my clipboard if possible. Prefer `pbcopy` on macOS, `wl-copy` or `xclip` on Linux, and `Set-Clipboard` on Windows.",
    "- If clipboard access is unavailable, print `.agent/prompts/integrate-local-telemetry.md` for me instead.",
    "- Finish with a short summary: whether Codex-Promax was installed successfully, whether doctor passed, and whether the telemetry prompt is now on my clipboard.",
  ].join("\n");
}

function telemetryPromptString(): string {
  return readTemplateRelative("presets/codex-max/.agent/prompts/integrate-local-telemetry.md");
}

function buildPlanStub(title: string): string {
  return [
    `# ${title}`,
    "",
    "This ExecPlan is a living document. Keep Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective updated as work proceeds.",
    "",
    "## Purpose / Big Picture",
    "",
    "Describe what user-visible behavior this change enables and how to observe it.",
    "",
    "## Definition of Done",
    "",
    "Describe the objective end state and validation proof required for completion.",
    "",
    "## Progress",
    "",
    "- [ ] Initialize this section with timestamped steps as work begins.",
    "",
    "## Surprises & Discoveries",
    "",
    "- Observation: None yet.",
    "  Evidence: N/A",
    "",
    "## Decision Log",
    "",
    "- Decision: Initial skeleton created.",
    "  Rationale: Establish required living sections before implementation.",
    "  Date/Author: YYYY-MM-DD / <author>",
    "",
    "## Outcomes & Retrospective",
    "",
    "Summarize outcomes, remaining gaps, and lessons learned.",
  ].join("\n");
}

export async function runPromptPlan(
  title: string,
  options: PromptPlanOptions,
  io: PromptIo = defaultIo,
): Promise<number> {
  const config = resolveConfig(options);
  const slug = slugify(title);
  const defaultPlanPath = path.join(config.execplansDirPath, `${slug}.md`);
  const relativeDefaultPlanPath = toRepoRelative(config.root, defaultPlanPath);

  io.log(planPromptString(title, relativeDefaultPlanPath));

  if (!options.out) {
    return 0;
  }

  const outPath = path.isAbsolute(options.out)
    ? path.resolve(options.out)
    : path.resolve(config.root, options.out);
  const exists = fs.existsSync(outPath);

  if (!exists) {
    if (!config.dryRun) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buildPlanStub(title), "utf8");
    }

    printAction(
      {
        dryRun: config.dryRun,
        root: config.root,
        log: io.log,
      },
      {
        type: "Create",
        path: outPath,
      },
    );

    return 0;
  }

  if (!config.force) {
    printAction(
      {
        dryRun: config.dryRun,
        root: config.root,
        log: io.log,
      },
      {
        type: "Skip",
        path: outPath,
        reason: "already exists",
      },
    );
    return 0;
  }

  if (!config.dryRun) {
    fs.writeFileSync(outPath, buildPlanStub(title), "utf8");
  }

  printAction(
    {
      dryRun: config.dryRun,
      root: config.root,
      log: io.log,
    },
    {
      type: "Update",
      path: outPath,
    },
  );

  return 0;
}

export async function runPromptExec(
  planFile: string,
  options: CommonOptions,
  io: PromptIo = defaultIo,
): Promise<number> {
  resolveConfig(options);
  io.log(execPromptString(planFile));
  return 0;
}

export async function runPromptInstall(
  options: CommonOptions,
  io: PromptIo = defaultIo,
): Promise<number> {
  const config = resolveConfig(options);
  io.log(installPromptString(config.root, config.preset, options.assistants ?? "all"));
  return 0;
}

export async function runPromptTelemetry(
  options: CommonOptions,
  io: PromptIo = defaultIo,
): Promise<number> {
  resolveConfig(options);
  io.log(telemetryPromptString());
  return 0;
}

export const promptText = {
  planPromptString,
  execPromptString,
  installPromptString,
  telemetryPromptString,
};

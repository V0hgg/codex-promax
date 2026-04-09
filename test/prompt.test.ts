import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  runPromptExec,
  runPromptInstall,
  runPromptPlan,
  runPromptTelemetry,
} from "../src/commands/prompt";
import { resolveRoot } from "../src/core/root";
import { slugify } from "../src/core/slugify";
import { readTemplateRelative } from "../src/core/templates";
import { captureIo, createTempWorkspace, initGitMarker, readFile } from "./helpers";

describe("prompt", () => {
  it("prints stable prompt output for plan", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);
    const io = captureIo();

    await runPromptPlan("  Ship New Plan: V1!  ", { root }, io.io);

    expect(io.lines.join("\n")).toMatchInlineSnapshot(`
      "Create an ExecPlan for: \"  Ship New Plan: V1!  \"
      - Follow .agent/PLANS.md to the letter (read the entire file first).
      - Save it to .agent/execplans/ship-new-plan-v1.md.
      - Make it fully self-contained for a novice with no repo memory.
      - Include milestones with explicit validation commands and a clear Definition of Done.
      - Include and initialize the required living sections: Progress, Surprises & Discoveries, Decision Log, Outcomes & Retrospective.
      - Do not ask me for next steps; produce the complete plan."
    `);
  });

  it("prints stable prompt output for exec", async () => {
    const io = captureIo();

    await runPromptExec(".agent/execplans/example.md", { assistants: "all" }, io.io);

    expect(io.lines.join("\n")).toMatchInlineSnapshot(`
      "Execute the ExecPlan: .agent/execplans/example.md
      - Proceed milestone-by-milestone without asking for “next steps”.
      - Keep Progress / Surprises & Discoveries / Decision Log / Outcomes & Retrospective updated at every stopping point.
      - Resolve ambiguities autonomously and commit frequently.
      - Stop only when Definition of Done is satisfied, or you are truly blocked (then record the blocker + proposed default decision in the plan)."
    `);
  });

  it("prints a repo-aware install prompt for coding agents", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);
    const io = captureIo();

    await runPromptInstall({ root }, io.io);

    expect(io.lines.join("\n")).toMatchInlineSnapshot(`
      "Install Codex-Promax in this repository end-to-end.
      - Treat ${root} as the repository root.
      - Run \`npx -y codex-promax@latest init --preset codex-max --assistants all\` from that repo root.
      - Do not dump file-by-file scaffold logs unless the command fails or I ask for them.
      - Run \`npx -y codex-promax@latest doctor --preset codex-max --assistants all\` after init.
      - If \`.agent/prompts/integrate-local-telemetry.md\` exists, copy it to my clipboard if possible. Prefer \`pbcopy\` on macOS, \`wl-copy\` or \`xclip\` on Linux, and \`Set-Clipboard\` on Windows.
      - If clipboard access is unavailable, print \`.agent/prompts/integrate-local-telemetry.md\` for me instead.
      - Finish with a short summary: whether Codex-Promax was installed successfully, whether doctor passed, and whether the telemetry prompt is now on my clipboard."
    `);
  });

  it("keeps custom scaffold paths and assistant flags in the install prompt", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);
    const io = captureIo();

    await runPromptInstall(
      {
        root,
        preset: "standard",
        assistants: "opencode",
        agentsFile: "CUSTOM_AGENTS.md",
        claudeFile: "CUSTOM_CLAUDE.md",
        planDir: "custom-agent",
        execplansDir: "custom-agent/plans",
        skillsDir: "custom-skills",
      },
      io.io,
    );

    const output = io.lines.join("\n");
    expect(output).toContain(
      "npx -y codex-promax@latest init --preset standard --assistants opencode --agents-file CUSTOM_AGENTS.md --claude-file CUSTOM_CLAUDE.md --plan-dir custom-agent --execplans-dir custom-agent/plans --skills-dir custom-skills",
    );
    expect(output).toContain(
      "npx -y codex-promax@latest doctor --preset standard --assistants opencode --agents-file CUSTOM_AGENTS.md --claude-file CUSTOM_CLAUDE.md --plan-dir custom-agent --execplans-dir custom-agent/plans --skills-dir custom-skills",
    );
    expect(output).toContain("`custom-agent/prompts/integrate-local-telemetry.md`");
  });

  it("prints the same telemetry prompt that is scaffolded into codex-max repos", async () => {
    const io = captureIo();

    await runPromptTelemetry({ assistants: "all" }, io.io);

    expect(io.lines.join("\n")).toBe(
      readTemplateRelative("presets/codex-max/.agent/prompts/integrate-local-telemetry.md"),
    );
    expect(io.lines.join("\n")).toContain("Keep deployment manifests, production defaults");
    expect(io.lines.join("\n")).toContain("If the correct start path cannot be inferred safely");
    expect(io.lines.join("\n")).toContain("service-topology.example.yaml");
    expect(io.lines.join("\n")).toContain("docs/generated/observability-validation.md");
  });

  it("writes a stub file with required sections when --out is provided", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);
    const outputPath = path.join(root, ".agent", "execplans", "new-plan.md");

    await runPromptPlan("My Plan", { root, out: ".agent/execplans/new-plan.md" });

    expect(fs.existsSync(outputPath)).toBe(true);
    const content = readFile(root, ".agent/execplans/new-plan.md");
    expect(content).toContain("## Definition of Done");
    expect(content).toContain("## Progress");
    expect(content).toContain("## Surprises & Discoveries");
    expect(content).toContain("## Decision Log");
    expect(content).toContain("## Outcomes & Retrospective");
  });

  it("slugify is deterministic for edge cases", () => {
    expect(slugify("   ")).toBe("plan");
    expect(slugify("  Hello, WORLD!  ")).toBe("hello-world");
    expect(slugify("A   B   C")).toBe("a-b-c");
    expect(slugify("x---y")).toBe("x-y");
  });
});

describe("root resolution", () => {
  it("chooses the nearest ancestor with .git", () => {
    const workspace = createTempWorkspace();

    const top = path.join(workspace, "top");
    const nested = path.join(top, "nested");
    const cwd = path.join(nested, "src", "features");

    fs.mkdirSync(path.join(top, ".git"), { recursive: true });
    fs.mkdirSync(path.join(nested, ".git"), { recursive: true });
    fs.mkdirSync(cwd, { recursive: true });

    expect(resolveRoot(undefined, cwd)).toBe(nested);
  });

  it("prefers --root over discovered git root", () => {
    const workspace = createTempWorkspace();
    const repo = path.join(workspace, "repo");
    const forced = path.join(workspace, "forced");
    const cwd = path.join(repo, "src");

    fs.mkdirSync(path.join(repo, ".git"), { recursive: true });
    fs.mkdirSync(cwd, { recursive: true });
    fs.mkdirSync(forced, { recursive: true });

    expect(resolveRoot(forced, cwd)).toBe(forced);
  });
});

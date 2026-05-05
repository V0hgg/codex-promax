import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createProgram } from "../src/cli";
import { createTempWorkspace, initGitMarker, readFile, writeFile } from "./helpers";

describe("cli", () => {
  let previousCwd: string;
  let previousExitCode: string | number | undefined;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    previousCwd = process.cwd();
    previousExitCode = process.exitCode;
    process.exitCode = undefined;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(previousCwd);
    process.exitCode = previousExitCode;
    logSpy.mockRestore();
  });

  it("passes common options to init subcommand actions", async () => {
    const projectRoot = createTempWorkspace("veloran-cli-project-");
    const userHome = createTempWorkspace("veloran-cli-user-");
    initGitMarker(projectRoot);
    writeFile(userHome, ".veloran/prompts/AGENTS.md", "# Existing user prompt\n\nKeep this.\n");

    process.chdir(projectRoot);
    await createProgram("0.0.0").parseAsync([
      "node",
      "veloran",
      "init",
      "--scope",
      "user",
      "--apps",
      "agents",
      "--user-home",
      userHome,
      "--yes",
      "--force",
    ]);

    const prompt = readFile(userHome, ".veloran/prompts/AGENTS.md");
    expect(prompt).toContain("# Existing user prompt");
    expect(prompt).toContain("Keep this.");
    expect(prompt.match(/<!-- execplans:begin -->/g)?.length).toBe(1);
    expect(fs.existsSync(path.join(projectRoot, ".agent", "veloran-manifest.json"))).toBe(false);
  });

  it("runs the no-subcommand magic installer with an explicit local path", async () => {
    const cwd = createTempWorkspace("veloran-cli-cwd-");
    const installRoot = createTempWorkspace("veloran-cli-install-");
    initGitMarker(cwd);
    initGitMarker(installRoot);

    process.chdir(cwd);
    await createProgram("0.0.0").parseAsync([
      "node",
      "veloran",
      "--path",
      installRoot,
      "--scope",
      "project",
      "--apps",
      "antigravity",
      "--yes",
    ]);

    expect(fs.existsSync(path.join(installRoot, "GEMINI.md"))).toBe(true);
    expect(fs.existsSync(path.join(installRoot, ".agent", "skills", "init-harness", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(cwd, ".agent", "veloran-manifest.json"))).toBe(false);
    expect(fs.existsSync(path.join(installRoot, ".codex"))).toBe(false);
  });
});

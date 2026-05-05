import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runDoctor } from "../src/commands/doctor";
import { runInit } from "../src/commands/init";
import { captureIo, createTempWorkspace, initGitMarker, readFile, writeFile } from "./helpers";

describe("doctor", () => {
  it("prints OK after successful init", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root });

    const io = captureIo();
    const code = await runDoctor({ root }, io.io);

    expect(code).toBe(0);
    expect(io.lines).toEqual(["OK"]);
  });

  it("checks codex-max artifacts by default", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root });

    fs.unlinkSync(path.join(root, ".agent/harness/observability/smoke.sh"));

    const io = captureIo();
    const code = await runDoctor({ root }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.includes(".agent/harness/observability/smoke.sh"))).toBe(
      true,
    );
  });

  it("prints actionable Fix messages when structure is broken", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root });

    const plans = readFile(root, ".agent/PLANS.md").replace("## Decision Log", "## Decisions");
    writeFile(root, ".agent/PLANS.md", plans);

    const skillBody = readFile(root, ".agents/skills/execplan-create/SKILL.md");
    const withoutFrontmatter = skillBody.replace(/^---[\s\S]*?---\n?/, "");
    writeFile(root, ".agents/skills/execplan-create/SKILL.md", withoutFrontmatter);

    const io = captureIo();
    const code = await runDoctor({ root }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.startsWith("Fix:"))).toBe(true);
    expect(io.lines.some((line) => line.includes("## Decision Log"))).toBe(true);
    expect(
      io.lines.some((line) =>
        line.includes(".agents/skills/execplan-create/SKILL.md") && line.includes("frontmatter"),
      ),
    ).toBe(true);
  });

  it("prints OK for codex-max preset when scaffold is complete", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, preset: "codex-max" });

    const io = captureIo();
    const code = await runDoctor({ root, preset: "codex-max" }, io.io);

    expect(code).toBe(0);
    expect(io.lines).toEqual(["OK"]);
  });

  it("checks Claude Code skill files for claude targets", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, assistants: "claude" });

    fs.unlinkSync(path.join(root, ".claude", "skills", "execplan-create", "SKILL.md"));

    const io = captureIo();
    const code = await runDoctor({ root, assistants: "claude" }, io.io);

    expect(code).toBe(1);
    expect(
      io.lines.some((line) =>
        line.includes(".claude/skills/execplan-create/SKILL.md"),
      ),
    ).toBe(true);
  });

  it("checks shared skill files for opencode targets", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, assistants: "opencode" });

    fs.unlinkSync(path.join(root, ".agents", "skills", "execplan-create", "SKILL.md"));

    const io = captureIo();
    const code = await runDoctor({ root, assistants: "opencode" }, io.io);

    expect(code).toBe(1);
    expect(
      io.lines.some((line) =>
        line.includes(".agents/skills/execplan-create/SKILL.md"),
      ),
    ).toBe(true);
  });

  it("validates Claude Code native files for codex-max preset", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, preset: "codex-max" });

    writeFile(root, ".claude/settings.json", "{ invalid");
    writeFile(root, ".mcp.json", JSON.stringify({ nope: true }, null, 2));
    writeFile(root, ".claude/agents/reviewer.md", "# reviewer\n");

    const io = captureIo();
    const code = await runDoctor({ root, preset: "codex-max" }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.includes(".claude/settings.json"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".mcp.json"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".claude/agents/reviewer.md"))).toBe(true);
  });

  it("validates OpenCode native files for codex-max preset", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, preset: "codex-max" });

    writeFile(root, "opencode.json", JSON.stringify({ instructions: ["README.md"] }, null, 2));
    writeFile(root, ".opencode/agents/reviewer.md", "# reviewer\n");
    writeFile(root, ".opencode/commands/validate-readiness.md", "# command\n");

    const io = captureIo();
    const code = await runDoctor({ root, preset: "codex-max" }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.includes("opencode.json"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".agent/context/*.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".agent/prompts/*.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".opencode/agents/reviewer.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".opencode/commands/validate-readiness.md"))).toBe(
      true,
    );
  });

  it("validates knowledge frontmatter for harness installs", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root });

    const knowledgePath = path.join(root, ".agent", "knowledge", "rules", "coding-agent-workflow.md");
    const broken = readFile(root, ".agent/knowledge/rules/coding-agent-workflow.md")
      .replace("kind: rule", "kind: nope")
      .replace("lastVerified: 2026-05-05", "lastVerified: yesterday");
    fs.writeFileSync(knowledgePath, broken, "utf8");

    const io = captureIo();
    const code = await runDoctor({ root }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.includes(knowledgePath) && line.includes('"kind"'))).toBe(true);
    expect(io.lines.some((line) => line.includes(knowledgePath) && line.includes("lastVerified"))).toBe(
      true,
    );
  });

  it("prints codex-max specific Fix messages when preset artifacts are missing", async () => {
    const root = createTempWorkspace();
    initGitMarker(root);

    await runInit({ root, preset: "codex-max" });

    fs.unlinkSync(path.join(root, ".agent", "context", "README.md"));
    fs.unlinkSync(path.join(root, ".agent", "prompts", "validate-readiness.md"));
    fs.unlinkSync(path.join(root, ".agent", "prompts", "integrate-local-telemetry.md"));
    fs.unlinkSync(path.join(root, ".agent/harness/observability/smoke.sh"));
    fs.unlinkSync(path.join(root, ".agent/harness/observability/local/service-topology.example.yaml"));
    fs.unlinkSync(path.join(root, ".agent/harness/observability/runtime/.gitignore"));
    fs.unlinkSync(path.join(root, ".agent/knowledge/INDEX.md"));
    fs.unlinkSync(path.join(root, "docs/LOCAL_TELEMETRY_SETUP.md"));
    fs.unlinkSync(path.join(root, ".codex", "agents", "reviewer.toml"));
    writeFile(root, ".codex/config.toml", "[mcp_servers.chrome_devtools]\ncommand = \"npx\"\n");

    const io = captureIo();
    const code = await runDoctor({ root, preset: "codex-max" }, io.io);

    expect(code).toBe(1);
    expect(io.lines.some((line) => line.includes(".agent/context/README.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".agent/prompts/validate-readiness.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".agent/prompts/integrate-local-telemetry.md"))).toBe(
      true,
    );
    expect(io.lines.some((line) => line.includes(".agent/harness/observability/smoke.sh"))).toBe(
      true,
    );
    expect(
      io.lines.some((line) =>
        line.includes(".agent/harness/observability/local/service-topology.example.yaml"),
      ),
    ).toBe(true);
    expect(io.lines.some((line) => line.includes(".agent/harness/observability/runtime/.gitignore"))).toBe(
      true,
    );
    expect(io.lines.some((line) => line.includes(".agent/knowledge/INDEX.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes("docs/LOCAL_TELEMETRY_SETUP.md"))).toBe(true);
    expect(io.lines.some((line) => line.includes(".codex/agents/reviewer.toml"))).toBe(true);
    expect(io.lines.some((line) => line.includes("project_doc_fallback_filenames"))).toBe(true);
    expect(io.lines.some((line) => line.includes("[mcp_servers.observability]"))).toBe(true);
  });
});

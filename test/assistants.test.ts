import { describe, expect, it } from "vitest";

import { parseAssistants } from "../src/core/assistants";

describe("assistant target parsing", () => {
  it("supports opencode as an AGENTS.md + skills target", () => {
    expect(parseAssistants("opencode")).toEqual({
      values: ["opencode"],
      needsAgentsFile: true,
      needsAntigravityFiles: false,
      needsAntigravitySkills: false,
      needsClaudeFile: false,
      needsClaudeNativeFiles: false,
      needsSharedSkills: true,
      needsClaudeSkills: false,
      needsCodexFiles: false,
      needsGeminiFile: false,
      needsOpenCodeFiles: true,
    });
  });

  it("supports a generic agents target for AGENTS-compatible apps", () => {
    expect(parseAssistants("agents")).toEqual({
      values: ["agents"],
      needsAgentsFile: true,
      needsAntigravityFiles: false,
      needsAntigravitySkills: false,
      needsClaudeFile: false,
      needsClaudeNativeFiles: false,
      needsSharedSkills: true,
      needsClaudeSkills: false,
      needsCodexFiles: false,
      needsGeminiFile: false,
      needsOpenCodeFiles: false,
    });
  });

  it("accepts common as an alias for the generic agents target", () => {
    expect(parseAssistants("common")).toEqual({
      values: ["agents"],
      needsAgentsFile: true,
      needsAntigravityFiles: false,
      needsAntigravitySkills: false,
      needsClaudeFile: false,
      needsClaudeNativeFiles: false,
      needsSharedSkills: true,
      needsClaudeSkills: false,
      needsCodexFiles: false,
      needsGeminiFile: false,
      needsOpenCodeFiles: false,
    });
  });

  it("expands all to include all supported app targets", () => {
    expect(parseAssistants("all")).toEqual({
      values: ["agents", "codex", "claude", "augment", "opencode", "antigravity"],
      needsAgentsFile: true,
      needsAntigravityFiles: true,
      needsAntigravitySkills: true,
      needsClaudeFile: true,
      needsClaudeNativeFiles: true,
      needsSharedSkills: true,
      needsClaudeSkills: true,
      needsCodexFiles: true,
      needsGeminiFile: true,
      needsOpenCodeFiles: true,
    });
  });

  it("rejects unknown assistants with an updated help message", () => {
    expect(() => parseAssistants("mystery")).toThrow(
      'Invalid assistant target "mystery". Use agents, common, codex, claude, augment, opencode, antigravity, or all.',
    );
  });
});

import { describe, expect, it } from "vitest";

import { parseAssistants } from "../src/core/assistants";

describe("assistant target parsing", () => {
  it("supports opencode as an AGENTS.md + skills target", () => {
    expect(parseAssistants("opencode")).toEqual({
      values: ["opencode"],
      needsAgentsFile: true,
      needsClaudeFile: false,
      needsAgentSkills: true,
    });
  });

  it("supports a generic agents target for AGENTS-compatible apps", () => {
    expect(parseAssistants("agents")).toEqual({
      values: ["agents"],
      needsAgentsFile: true,
      needsClaudeFile: false,
      needsAgentSkills: false,
    });
  });

  it("accepts common as an alias for the generic agents target", () => {
    expect(parseAssistants("common")).toEqual({
      values: ["agents"],
      needsAgentsFile: true,
      needsClaudeFile: false,
      needsAgentSkills: false,
    });
  });

  it("expands all to include opencode alongside existing assistant targets", () => {
    expect(parseAssistants("all")).toEqual({
      values: ["augment", "claude", "codex", "opencode"],
      needsAgentsFile: true,
      needsClaudeFile: true,
      needsAgentSkills: true,
    });
  });

  it("rejects unknown assistants with an updated help message", () => {
    expect(() => parseAssistants("mystery")).toThrow(
      'Invalid assistant target "mystery". Use agents, common, codex, claude, augment, opencode, or all.',
    );
  });
});

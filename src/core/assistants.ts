export type Assistant = "agents" | "codex" | "claude" | "augment" | "opencode";

export interface AssistantTargets {
  values: Assistant[];
  needsAgentsFile: boolean;
  needsClaudeFile: boolean;
  needsSharedSkills: boolean;
  needsClaudeSkills: boolean;
}

const ASSISTANT_ALIASES = new Map<string, Assistant>([["common", "agents"]]);
const VALID_ASSISTANTS = new Set<string>([
  "agents",
  "codex",
  "claude",
  "augment",
  "opencode",
  "common",
  "all",
]);
const AGENTS_FILE_ASSISTANTS = new Set<Assistant>([
  "agents",
  "codex",
  "augment",
  "opencode",
]);
const SHARED_SKILL_ASSISTANTS = new Set<Assistant>(["codex", "opencode"]);
const CLAUDE_SKILL_ASSISTANTS = new Set<Assistant>(["claude"]);

export function parseAssistants(input: string | undefined): AssistantTargets {
  const raw = (input ?? "all")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (raw.length === 0) {
    return parseAssistants("all");
  }

  for (const value of raw) {
    if (!VALID_ASSISTANTS.has(value)) {
      throw new Error(
        `Invalid assistant target "${value}". Use agents, common, codex, claude, augment, opencode, or all.`,
      );
    }
  }

  const expanded = new Set<Assistant>();
  for (const value of raw) {
    if (value === "all") {
      expanded.add("codex");
      expanded.add("claude");
      expanded.add("augment");
      expanded.add("opencode");
      continue;
    }

    expanded.add(ASSISTANT_ALIASES.get(value) ?? (value as Assistant));
  }

  const values = Array.from(expanded).sort();

  return {
    values,
    needsAgentsFile: values.some((assistant) => AGENTS_FILE_ASSISTANTS.has(assistant)),
    needsClaudeFile: expanded.has("claude") || expanded.has("augment"),
    needsSharedSkills: values.some((assistant) => SHARED_SKILL_ASSISTANTS.has(assistant)),
    needsClaudeSkills: values.some((assistant) => CLAUDE_SKILL_ASSISTANTS.has(assistant)),
  };
}

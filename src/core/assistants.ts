export type Assistant = "codex" | "claude" | "augment";

export interface AssistantTargets {
  values: Assistant[];
  needsAgentsFile: boolean;
  needsClaudeFile: boolean;
  needsCodexSkills: boolean;
}

const VALID_ASSISTANTS = new Set<string>(["codex", "claude", "augment", "all"]);

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
        `Invalid assistant target \"${value}\". Use codex, claude, augment, or all.`,
      );
    }
  }

  const expanded = new Set<Assistant>();
  for (const value of raw) {
    if (value === "all") {
      expanded.add("codex");
      expanded.add("claude");
      expanded.add("augment");
      continue;
    }

    expanded.add(value as Assistant);
  }

  const values = Array.from(expanded).sort();

  return {
    values,
    needsAgentsFile: expanded.has("codex") || expanded.has("augment"),
    needsClaudeFile: expanded.has("claude") || expanded.has("augment"),
    needsCodexSkills: expanded.has("codex"),
  };
}

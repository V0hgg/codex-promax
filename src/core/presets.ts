const INIT_PRESETS = ["standard", "harness", "codex-max"] as const;

export type InitPreset = "standard" | "harness";
export const DEFAULT_PRESET: InitPreset = "harness";

export function parsePreset(input: string | undefined): InitPreset {
  const normalized = (input ?? DEFAULT_PRESET).trim().toLowerCase();

  if (normalized.length === 0) {
    return DEFAULT_PRESET;
  }

  if (normalized === "standard" || normalized === "harness") {
    return normalized;
  }

  if (normalized === "codex-max") {
    return "harness";
  }

  throw new Error(
    `Invalid preset "${input}". Use ${INIT_PRESETS.join(", ")}.`,
  );
}

export function presetTemplateDirectory(preset: InitPreset): string {
  return preset === "harness" ? "codex-max" : preset;
}

const INIT_PRESETS = ["standard", "codex-max"] as const;

export type InitPreset = (typeof INIT_PRESETS)[number];

export function parsePreset(input: string | undefined): InitPreset {
  const normalized = (input ?? "standard").trim().toLowerCase();

  if (normalized.length === 0) {
    return "standard";
  }

  if (normalized === "standard" || normalized === "codex-max") {
    return normalized;
  }

  throw new Error(
    `Invalid preset "${input}". Use ${INIT_PRESETS.join(", ")}.`,
  );
}

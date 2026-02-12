import fs from "node:fs";
import path from "node:path";

export type TemplateName =
  | "AGENTS.managed.md"
  | "CLAUDE.managed.md"
  | "PLANS.md"
  | "execplans_README.md"
  | "skills/execplan-create.SKILL.md"
  | "skills/execplan-execute.SKILL.md";

function templatesRoot(): string {
  return path.resolve(__dirname, "..", "..", "templates");
}

export function readTemplate(name: TemplateName): string {
  const templatePath = path.join(templatesRoot(), name);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template missing: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, "utf8");
}

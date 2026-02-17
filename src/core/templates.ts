import fs from "node:fs";
import path from "node:path";

export type TemplateName =
  | "AGENTS.managed.md"
  | "CLAUDE.managed.md"
  | "PLANS.md"
  | "execplans_README.md"
  | "skills/execplan-create.SKILL.md"
  | "skills/execplan-execute.SKILL.md";

export function templatesRoot(): string {
  return path.resolve(__dirname, "..", "..", "templates");
}

function asPosixRelativePath(value: string): string {
  return value.split(path.sep).join("/");
}

export function readTemplateRelative(relativePath: string): string {
  const templatePath = path.join(templatesRoot(), relativePath);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template missing: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, "utf8");
}

export function readTemplate(name: TemplateName): string {
  return readTemplateRelative(name);
}

export function listTemplateFiles(relativeDirectory: string): string[] {
  const absoluteDirectory = path.join(templatesRoot(), relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  const stack = [absoluteDirectory];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      files.push(asPosixRelativePath(path.relative(templatesRoot(), absolutePath)));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  renderKnowledgeBundle,
  resolveKnowledgeSources,
  validateKnowledgeFile,
} from "../src/core/knowledge";
import { createTempWorkspace, initGitMarker, writeFile } from "./helpers";

function knowledgeFile(id: string, options: {
  kind?: string;
  scope?: string;
  appliesTo?: string[];
  priority?: number;
  status?: string;
  body?: string;
} = {}): string {
  return [
    "---",
    `id: ${id}`,
    `kind: ${options.kind ?? "rule"}`,
    `scope: ${options.scope ?? "project"}`,
    "appliesTo:",
    ...(options.appliesTo ?? ["**"]).map((pattern) => `  - "${pattern}"`),
    `priority: ${options.priority ?? 50}`,
    `status: ${options.status ?? "active"}`,
    "lastVerified: 2026-05-05",
    "expires: never",
    "source: test",
    "---",
    "",
    options.body ?? `# ${id}\n\nSummary for ${id}.`,
    "",
  ].join("\n");
}

describe("knowledge", () => {
  it("resolves user, project, and nested path knowledge in broad-to-specific order", () => {
    const root = createTempWorkspace("veloran-knowledge-root-");
    const userHome = createTempWorkspace("veloran-knowledge-user-");
    initGitMarker(root);

    writeFile(
      userHome,
      ".veloran/knowledge/rules/global.md",
      knowledgeFile("global-rule", { scope: "user", priority: 10 }),
    );
    writeFile(
      root,
      ".agent/knowledge/rules/project.md",
      knowledgeFile("project-rule", { priority: 20 }),
    );
    writeFile(
      root,
      ".agent/knowledge/rules/api-only.md",
      knowledgeFile("api-only", { appliesTo: ["services/api/**"], priority: 30 }),
    );
    writeFile(
      root,
      "services/api/.agent/knowledge/rules/api-nested.md",
      knowledgeFile("api-nested", { scope: "path", appliesTo: ["src/**"], priority: 40 }),
    );

    const sources = resolveKnowledgeSources({
      cwd: path.join(root, "services/api"),
      root,
      userHomePath: userHome,
      userKnowledgeDirPath: path.join(userHome, ".veloran/knowledge"),
      projectKnowledgeDirPath: path.join(root, ".agent/knowledge"),
      touchedPaths: ["services/api/src/server.ts"],
    });

    expect(sources.map((source) => source.frontmatter.id)).toEqual([
      "global-rule",
      "project-rule",
      "api-only",
      "api-nested",
    ]);
    expect(sources.map((source) => source.layer)).toEqual(["user", "project", "project", "path"]);
  });

  it("filters path-specific knowledge when touched paths do not match", () => {
    const root = createTempWorkspace("veloran-knowledge-filter-");
    const userHome = createTempWorkspace("veloran-knowledge-user-");
    initGitMarker(root);

    writeFile(
      root,
      ".agent/knowledge/rules/api-only.md",
      knowledgeFile("api-only", { appliesTo: ["services/api/**"] }),
    );
    writeFile(
      root,
      ".agent/knowledge/rules/all.md",
      knowledgeFile("all-project", { appliesTo: ["**"] }),
    );

    const sources = resolveKnowledgeSources({
      cwd: root,
      root,
      userHomePath: userHome,
      userKnowledgeDirPath: path.join(userHome, ".veloran/knowledge"),
      projectKnowledgeDirPath: path.join(root, ".agent/knowledge"),
      touchedPaths: ["apps/web/App.tsx"],
    });

    expect(sources.map((source) => source.frontmatter.id)).toEqual(["all-project"]);
  });

  it("skips archived and draft knowledge unless drafts are requested", () => {
    const root = createTempWorkspace("veloran-knowledge-status-");
    const userHome = createTempWorkspace("veloran-knowledge-user-");
    initGitMarker(root);

    writeFile(root, ".agent/knowledge/rules/active.md", knowledgeFile("active-rule"));
    writeFile(
      root,
      ".agent/knowledge/rules/draft.md",
      knowledgeFile("draft-rule", { status: "draft" }),
    );
    writeFile(
      root,
      ".agent/knowledge/rules/archived.md",
      knowledgeFile("archived-rule", { status: "archived" }),
    );

    const baseOptions = {
      cwd: root,
      root,
      userHomePath: userHome,
      userKnowledgeDirPath: path.join(userHome, ".veloran/knowledge"),
      projectKnowledgeDirPath: path.join(root, ".agent/knowledge"),
    };

    expect(resolveKnowledgeSources(baseOptions).map((source) => source.frontmatter.id)).toEqual([
      "active-rule",
    ]);
    expect(
      resolveKnowledgeSources({ ...baseOptions, includeDraft: true }).map((source) => source.frontmatter.id),
    ).toEqual(["active-rule", "draft-rule"]);
  });

  it("marks later duplicate ids as effective overrides", () => {
    const root = createTempWorkspace("veloran-knowledge-override-");
    const userHome = createTempWorkspace("veloran-knowledge-user-");
    initGitMarker(root);

    writeFile(
      userHome,
      ".veloran/knowledge/rules/shared.md",
      knowledgeFile("shared-id", { scope: "user", priority: 10 }),
    );
    writeFile(
      root,
      ".agent/knowledge/rules/shared.md",
      knowledgeFile("shared-id", { priority: 20 }),
    );

    const sources = resolveKnowledgeSources({
      cwd: root,
      root,
      userHomePath: userHome,
      userKnowledgeDirPath: path.join(userHome, ".veloran/knowledge"),
      projectKnowledgeDirPath: path.join(root, ".agent/knowledge"),
    });

    expect(sources).toHaveLength(2);
    expect(sources[1].overrideOf).toBe("~/.veloran/knowledge/rules/shared.md");
  });

  it("validates required frontmatter and secret-looking content", () => {
    const root = createTempWorkspace("veloran-knowledge-invalid-");
    initGitMarker(root);
    const filePath = path.join(root, ".agent/knowledge/rules/bad.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      [
        "---",
        "id: bad-rule",
        "kind: nope",
        "scope: project",
        "appliesTo:",
        "  - /absolute/**",
        "priority: high",
        "status: active",
        "lastVerified: yesterday",
        "expires: never",
        "source: test",
        "---",
        "api_key = abcdefghijklmnopqrstuvwxyz",
        "",
      ].join("\n"),
      "utf8",
    );

    const fixes = validateKnowledgeFile(filePath);
    expect(fixes.some((fix) => fix.includes('"kind"'))).toBe(true);
    expect(fixes.some((fix) => fix.includes("priority"))).toBe(true);
    expect(fixes.some((fix) => fix.includes("lastVerified"))).toBe(true);
    expect(fixes.some((fix) => fix.includes("invalid appliesTo glob"))).toBe(true);
    expect(fixes.some((fix) => fix.includes("secret-looking"))).toBe(true);
  });

  it("renders an inspectable markdown bundle", () => {
    const root = createTempWorkspace("veloran-knowledge-render-");
    const userHome = createTempWorkspace("veloran-knowledge-user-");
    initGitMarker(root);
    writeFile(
      root,
      ".agent/knowledge/standards/validation.md",
      knowledgeFile("validation-standard", {
        kind: "standard",
        body: "# Validation\n\nRun `npm test` for changed behavior.",
      }),
    );

    const sources = resolveKnowledgeSources({
      cwd: root,
      root,
      userHomePath: userHome,
      userKnowledgeDirPath: path.join(userHome, ".veloran/knowledge"),
      projectKnowledgeDirPath: path.join(root, ".agent/knowledge"),
    });
    const rendered = renderKnowledgeBundle(sources);

    expect(rendered).toContain("# Veloran Knowledge Bundle");
    expect(rendered).toContain("validation-standard");
    expect(rendered).toContain("Run `npm test`");
  });
});

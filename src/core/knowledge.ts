import fs from "node:fs";
import path from "node:path";

import YAML from "yaml";

export type KnowledgeKind = "rule" | "standard" | "fact" | "doc";
export type KnowledgeScope = "user" | "project" | "path";
export type KnowledgeStatus = "active" | "draft" | "archived";
export type KnowledgeLayer = "user" | "project" | "path";

export interface KnowledgeFrontmatter {
  id: string;
  kind: KnowledgeKind;
  scope: KnowledgeScope;
  appliesTo: string[];
  priority: number;
  status: KnowledgeStatus;
  lastVerified: string;
  expires: string;
  source: string;
}

export interface KnowledgeSource {
  absolutePath: string;
  displayPath: string;
  layer: KnowledgeLayer;
  layerOrder: number;
  frontmatter: KnowledgeFrontmatter;
  summary: string;
  content: string;
  overrideOf?: string;
}

export interface KnowledgeResolveOptions {
  cwd: string;
  root: string;
  userHomePath: string;
  userKnowledgeDirPath: string;
  projectKnowledgeDirPath: string;
  touchedPaths?: string[];
  includeDraft?: boolean;
  includeUserKnowledge?: boolean;
  includeProjectKnowledge?: boolean;
}

interface ParsedMarkdown {
  frontmatter?: Record<string, unknown>;
  body: string;
  yamlError?: string;
}

interface KnowledgeLayerRoot {
  layer: KnowledgeLayer;
  order: number;
  knowledgeDirPath: string;
  scopeBasePath: string;
  displayBasePath: string;
  displayPrefix: string;
}

const KNOWLEDGE_KINDS: KnowledgeKind[] = ["rule", "standard", "fact", "doc"];
const KNOWLEDGE_SCOPES: KnowledgeScope[] = ["user", "project", "path"];
const KNOWLEDGE_STATUSES: KnowledgeStatus[] = ["active", "draft", "archived"];

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\b(api[_-]?key|token|password|secret)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
];

function normalizeRelativePath(value: string): string {
  return value
    .split(path.sep)
    .join("/")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function isInsideOrEqual(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolvePathForMatching(root: string, value: string): string {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
}

function escapeRegexChar(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern: string): RegExp {
  const normalized = normalizeRelativePath(pattern);
  let output = "^";

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === "*" && next === "*") {
      output += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      output += "[^/]*";
      continue;
    }

    output += escapeRegexChar(char);
  }

  output += "$";
  return new RegExp(output);
}

function isAlwaysOnPattern(pattern: string): boolean {
  const normalized = normalizeRelativePath(pattern);
  return normalized === "**" || normalized === "**/*";
}

function globMatches(pattern: string, value: string): boolean {
  const normalizedValue = normalizeRelativePath(value);
  const normalizedPattern = normalizeRelativePath(pattern);

  if (isAlwaysOnPattern(normalizedPattern)) {
    return true;
  }

  return globToRegExp(normalizedPattern).test(normalizedValue);
}

function parseMarkdown(content: string): ParsedMarkdown {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return { body: content };
  }

  try {
    const parsed = YAML.parse(match[1]) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { body: content.slice(match[0].length), yamlError: "frontmatter must be a YAML object" };
    }

    return {
      frontmatter: parsed as Record<string, unknown>,
      body: content.slice(match[0].length),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { body: content.slice(match[0].length), yamlError: message };
  }
}

function coerceFrontmatter(frontmatter: Record<string, unknown>): KnowledgeFrontmatter {
  return {
    id: frontmatter.id as string,
    kind: frontmatter.kind as KnowledgeKind,
    scope: frontmatter.scope as KnowledgeScope,
    appliesTo: frontmatter.appliesTo as string[],
    priority: frontmatter.priority as number,
    status: frontmatter.status as KnowledgeStatus,
    lastVerified: frontmatter.lastVerified as string,
    expires: frontmatter.expires as string,
    source: frontmatter.source as string,
  };
}

function firstBodySummary(body: string): string {
  const line = body
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.length > 0 && !value.startsWith("#"));

  if (!line) {
    return "No summary available.";
  }

  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
}

function listMarkdownFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const output: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") {
          continue;
        }

        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".md")) {
        output.push(absolutePath);
      }
    }
  }

  return output.sort((left, right) => left.localeCompare(right));
}

function displayPathForLayer(layer: KnowledgeLayerRoot, absolutePath: string): string {
  const relative = normalizeRelativePath(path.relative(layer.displayBasePath, absolutePath));
  return `${layer.displayPrefix}/${relative}`;
}

function discoverLayerRoots(options: KnowledgeResolveOptions): KnowledgeLayerRoot[] {
  const root = path.resolve(options.root);
  const cwd = path.resolve(options.cwd);
  const userHomePath = path.resolve(options.userHomePath);
  const includeUser = options.includeUserKnowledge !== false;
  const includeProject = options.includeProjectKnowledge !== false;
  const layers: KnowledgeLayerRoot[] = [];
  let order = 0;

  if (includeUser) {
    layers.push({
      layer: "user",
      order,
      knowledgeDirPath: path.resolve(options.userKnowledgeDirPath),
      scopeBasePath: root,
      displayBasePath: userHomePath,
      displayPrefix: "~",
    });
    order += 1;
  }

  if (includeProject) {
    layers.push({
      layer: "project",
      order,
      knowledgeDirPath: path.resolve(options.projectKnowledgeDirPath),
      scopeBasePath: root,
      displayBasePath: root,
      displayPrefix: ".",
    });
    order += 1;

    if (isInsideOrEqual(root, cwd)) {
      const relative = path.relative(root, cwd);
      const segments = relative.split(path.sep).filter(Boolean);
      let current = root;

      for (const segment of segments) {
        current = path.join(current, segment);
        const nestedKnowledgeDir = path.join(current, ".agent", "knowledge");
        if (!fs.existsSync(nestedKnowledgeDir)) {
          continue;
        }

        layers.push({
          layer: "path",
          order,
          knowledgeDirPath: nestedKnowledgeDir,
          scopeBasePath: current,
          displayBasePath: root,
          displayPrefix: ".",
        });
        order += 1;
      }
    }
  }

  return layers;
}

function parseKnowledgeSource(filePath: string, layer: KnowledgeLayerRoot): KnowledgeSource | undefined {
  const validationFixes = validateKnowledgeFile(filePath);
  if (validationFixes.length > 0) {
    return undefined;
  }

  const parsed = parseMarkdown(fs.readFileSync(filePath, "utf8"));
  if (!parsed.frontmatter) {
    return undefined;
  }

  const frontmatter = coerceFrontmatter(parsed.frontmatter);
  return {
    absolutePath: filePath,
    displayPath: displayPathForLayer(layer, filePath),
    layer: layer.layer,
    layerOrder: layer.order,
    frontmatter,
    summary: firstBodySummary(parsed.body),
    content: parsed.body.trim(),
  };
}

function sourceMatchesTouchedPaths(
  source: KnowledgeSource,
  layer: KnowledgeLayerRoot,
  options: KnowledgeResolveOptions,
): boolean {
  const appliesTo = source.frontmatter.appliesTo;

  if (options.touchedPaths && options.touchedPaths.length > 0) {
    return options.touchedPaths.some((touchedPath) => {
      const touchedAbsolutePath = resolvePathForMatching(options.root, touchedPath);
      if (!isInsideOrEqual(layer.scopeBasePath, touchedAbsolutePath)) {
        return false;
      }

      const relativeToLayer = path.relative(layer.scopeBasePath, touchedAbsolutePath);
      const normalized = normalizeRelativePath(relativeToLayer || ".");
      return appliesTo.some((pattern) => globMatches(pattern, normalized));
    });
  }

  return appliesTo.length === 0 || appliesTo.some(isAlwaysOnPattern);
}

export function resolveKnowledgeSources(options: KnowledgeResolveOptions): KnowledgeSource[] {
  const layers = discoverLayerRoots(options);
  const sources: KnowledgeSource[] = [];

  for (const layer of layers) {
    for (const filePath of listMarkdownFiles(layer.knowledgeDirPath)) {
      const source = parseKnowledgeSource(filePath, layer);
      if (!source) {
        continue;
      }

      if (source.frontmatter.status === "archived") {
        continue;
      }

      if (source.frontmatter.status === "draft" && !options.includeDraft) {
        continue;
      }

      if (!sourceMatchesTouchedPaths(source, layer, options)) {
        continue;
      }

      sources.push(source);
    }
  }

  sources.sort((left, right) =>
    left.layerOrder - right.layerOrder
    || left.frontmatter.priority - right.frontmatter.priority
    || left.displayPath.localeCompare(right.displayPath),
  );

  const seenById = new Map<string, KnowledgeSource>();
  for (const source of sources) {
    const earlier = seenById.get(source.frontmatter.id);
    if (earlier) {
      source.overrideOf = earlier.displayPath;
    }

    seenById.set(source.frontmatter.id, source);
  }

  return sources;
}

function validateGlob(pattern: string): string | undefined {
  if (pattern.trim().length === 0) {
    return "must not be empty";
  }

  if (pattern.includes("\0")) {
    return "must not contain null bytes";
  }

  if (path.isAbsolute(pattern)) {
    return "must be relative to the knowledge layer";
  }

  try {
    globToRegExp(pattern);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isExpiredIsoDate(value: string, today = new Date()): boolean {
  if (!isIsoDate(value)) {
    return false;
  }

  const expires = new Date(`${value}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return expires < todayUtc;
}

function hasSecretLikeContent(content: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(content));
}

export function validateKnowledgeFile(filePath: string): string[] {
  const fixes: string[] = [];

  if (!fs.existsSync(filePath)) {
    return [`Fix: Create ${filePath} or remove it from the knowledge index.`];
  }

  const content = fs.readFileSync(filePath, "utf8");
  const parsed = parseMarkdown(content);
  if (parsed.yamlError) {
    fixes.push(`Fix: Make YAML frontmatter in ${filePath} valid (${parsed.yamlError}).`);
    return fixes;
  }

  if (!parsed.frontmatter) {
    fixes.push(`Fix: Add YAML frontmatter to ${filePath}.`);
    return fixes;
  }

  const frontmatter = parsed.frontmatter;
  const id = frontmatter.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    fixes.push(`Fix: Set non-empty frontmatter field "id" in ${filePath}.`);
  }

  const kind = frontmatter.kind;
  if (typeof kind !== "string" || !KNOWLEDGE_KINDS.includes(kind as KnowledgeKind)) {
    fixes.push(`Fix: Set frontmatter field "kind" in ${filePath} to one of ${KNOWLEDGE_KINDS.join(", ")}.`);
  }

  const scope = frontmatter.scope;
  if (typeof scope !== "string" || !KNOWLEDGE_SCOPES.includes(scope as KnowledgeScope)) {
    fixes.push(`Fix: Set frontmatter field "scope" in ${filePath} to one of ${KNOWLEDGE_SCOPES.join(", ")}.`);
  }

  const appliesTo = frontmatter.appliesTo;
  if (!Array.isArray(appliesTo) || appliesTo.length === 0 || !appliesTo.every((value) => typeof value === "string")) {
    fixes.push(`Fix: Set frontmatter field "appliesTo" in ${filePath} to a non-empty string array.`);
  } else {
    for (const pattern of appliesTo) {
      const error = validateGlob(pattern);
      if (error) {
        fixes.push(`Fix: Change invalid appliesTo glob "${pattern}" in ${filePath}: ${error}.`);
      }
    }
  }

  if (typeof frontmatter.priority !== "number" || !Number.isInteger(frontmatter.priority)) {
    fixes.push(`Fix: Set integer frontmatter field "priority" in ${filePath}.`);
  }

  const status = frontmatter.status;
  if (typeof status !== "string" || !KNOWLEDGE_STATUSES.includes(status as KnowledgeStatus)) {
    fixes.push(`Fix: Set frontmatter field "status" in ${filePath} to one of ${KNOWLEDGE_STATUSES.join(", ")}.`);
  }

  const lastVerified = frontmatter.lastVerified;
  if (typeof lastVerified !== "string" || !isIsoDate(lastVerified)) {
    fixes.push(`Fix: Set frontmatter field "lastVerified" in ${filePath} to an ISO date like 2026-05-05.`);
  }

  const expires = frontmatter.expires;
  if (typeof expires !== "string" || expires.trim().length === 0) {
    fixes.push(`Fix: Set non-empty frontmatter field "expires" in ${filePath}.`);
  } else if (isExpiredIsoDate(expires)) {
    fixes.push(`Fix: Update or archive expired knowledge file ${filePath}.`);
  }

  const source = frontmatter.source;
  if (typeof source !== "string" || source.trim().length === 0) {
    fixes.push(`Fix: Set non-empty frontmatter field "source" in ${filePath}.`);
  }

  if (hasSecretLikeContent(parsed.body)) {
    fixes.push(`Fix: Remove secret-looking values from ${filePath}; keep only placeholders and setup instructions.`);
  }

  return fixes;
}

export function validateKnowledgeTree(knowledgeDirPath: string): string[] {
  const fixes: string[] = [];

  if (!fs.existsSync(knowledgeDirPath)) {
    return [`Fix: Create ${knowledgeDirPath} (run \`veloran init --preset harness\`).`];
  }

  const markdownFiles = listMarkdownFiles(knowledgeDirPath);
  if (markdownFiles.length === 0) {
    fixes.push(`Fix: Add Markdown knowledge files with YAML frontmatter under ${knowledgeDirPath}.`);
  }

  const seenIds = new Map<string, string>();
  for (const filePath of markdownFiles) {
    fixes.push(...validateKnowledgeFile(filePath));

    const parsed = parseMarkdown(fs.readFileSync(filePath, "utf8"));
    const id = parsed.frontmatter?.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      continue;
    }

    const previous = seenIds.get(id);
    if (previous) {
      fixes.push(`Fix: Use unique knowledge id "${id}" in ${filePath}; it also appears in ${previous}.`);
      continue;
    }

    seenIds.set(id, filePath);
  }

  return fixes;
}

export function renderKnowledgeBundle(sources: KnowledgeSource[]): string {
  const lines: string[] = [
    "# Veloran Knowledge Bundle",
    "",
    "Layer order: user-global, project, then nested path knowledge. Later sources with the same id are effective overrides.",
    "",
  ];

  if (sources.length === 0) {
    lines.push("No active knowledge sources matched the requested path and touched files.");
    return `${lines.join("\n")}\n`;
  }

  lines.push("## Sources", "");
  sources.forEach((source, index) => {
    const override = source.overrideOf ? `; overrides ${source.overrideOf}` : "";
    lines.push(
      `${index + 1}. [${source.layer}] ${source.displayPath} (${source.frontmatter.kind}, id: ${source.frontmatter.id}, priority: ${source.frontmatter.priority}${override})`,
    );
    lines.push(`   Summary: ${source.summary}`);
  });

  lines.push("", "## Selected Knowledge", "");
  for (const source of sources) {
    lines.push(`### ${source.frontmatter.id}`);
    lines.push(`Source: ${source.displayPath}`);
    lines.push("");
    lines.push(source.content || source.summary);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

import path from "node:path";

import { CommonOptions, resolveConfig } from "../core/config";
import {
  renderKnowledgeBundle,
  resolveKnowledgeSources,
  validateKnowledgeTree,
} from "../core/knowledge";
import { findNearestGitRoot } from "../core/root";

export interface KnowledgeOptions extends CommonOptions {
  touched?: string[];
  includeDraft?: boolean;
}

export interface KnowledgeIo {
  log: (line: string) => void;
}

const defaultIo: KnowledgeIo = {
  log: (line: string) => {
    console.log(line);
  },
};

interface KnowledgeCommandConfig {
  root: string;
  cwd: string;
  userHomePath: string;
  userKnowledgeDirPath: string;
  projectKnowledgeDirPath: string;
  includeUserForPrint: boolean;
  includeProjectForPrint: boolean;
  includeUserForDoctor: boolean;
  includeProjectForDoctor: boolean;
}

function normalizeScope(scope: string | undefined): "user" | "project" | "both" | undefined {
  if (!scope) {
    return undefined;
  }

  const normalized = scope.trim().toLowerCase();
  if (normalized === "user" || normalized === "global") {
    return "user";
  }

  if (normalized === "project" || normalized === "local") {
    return "project";
  }

  if (normalized === "both") {
    return "both";
  }

  throw new Error(`Invalid knowledge scope "${scope}". Use project, user, or both.`);
}

function resolveKnowledgeCommandConfig(options: KnowledgeOptions): KnowledgeCommandConfig {
  const targetPath = path.resolve(options.path ?? options.installPath ?? options.root ?? process.cwd());
  const root = options.root ? path.resolve(options.root) : findNearestGitRoot(targetPath) ?? targetPath;
  const config = resolveConfig(
    {
      ...options,
      root,
      path: undefined,
      installPath: undefined,
    },
    targetPath,
  );

  const scope = normalizeScope(options.scope);
  const includeUserForPrint = scope !== "project";
  const includeProjectForPrint = scope !== "user";
  const includeUserForDoctor = scope === "user" || scope === "both";
  const includeProjectForDoctor = scope !== "user";

  return {
    root,
    cwd: targetPath,
    userHomePath: config.userHomePath,
    userKnowledgeDirPath: config.userKnowledgeDirPath,
    projectKnowledgeDirPath: config.projectKnowledgeDirPath,
    includeUserForPrint,
    includeProjectForPrint,
    includeUserForDoctor,
    includeProjectForDoctor,
  };
}

export async function runKnowledgePrint(
  options: KnowledgeOptions,
  io: KnowledgeIo = defaultIo,
): Promise<number> {
  const config = resolveKnowledgeCommandConfig(options);
  const sources = resolveKnowledgeSources({
    cwd: config.cwd,
    root: config.root,
    userHomePath: config.userHomePath,
    userKnowledgeDirPath: config.userKnowledgeDirPath,
    projectKnowledgeDirPath: config.projectKnowledgeDirPath,
    touchedPaths: options.touched,
    includeDraft: Boolean(options.includeDraft),
    includeUserKnowledge: config.includeUserForPrint,
    includeProjectKnowledge: config.includeProjectForPrint,
  });

  io.log(renderKnowledgeBundle(sources).trimEnd());
  return 0;
}

export async function runKnowledgeDoctor(
  options: KnowledgeOptions,
  io: KnowledgeIo = defaultIo,
): Promise<number> {
  const config = resolveKnowledgeCommandConfig(options);
  const fixes: string[] = [];

  if (config.includeProjectForDoctor) {
    fixes.push(...validateKnowledgeTree(config.projectKnowledgeDirPath));
  }

  if (config.includeUserForDoctor) {
    fixes.push(...validateKnowledgeTree(config.userKnowledgeDirPath));
  }

  if (fixes.length === 0) {
    io.log("OK");
    return 0;
  }

  for (const fix of fixes) {
    io.log(fix);
  }

  return 1;
}

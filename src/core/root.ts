import fs from "node:fs";
import path from "node:path";

function hasGitEntry(directory: string): boolean {
  const gitPath = path.join(directory, ".git");
  return fs.existsSync(gitPath);
}

export function findNearestGitRoot(startDirectory: string): string | undefined {
  let current = path.resolve(startDirectory);

  while (true) {
    if (hasGitEntry(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

export function resolveRoot(explicitRoot: string | undefined, cwd: string = process.cwd()): string {
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }

  const nearest = findNearestGitRoot(cwd);
  return nearest ?? path.resolve(cwd);
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CapturedIo {
  lines: string[];
  io: {
    log: (line: string) => void;
  };
}

export function createTempWorkspace(prefix = "execplans-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function initGitMarker(root: string): void {
  fs.mkdirSync(path.join(root, ".git"), { recursive: true });
}

export function captureIo(): CapturedIo {
  const lines: string[] = [];

  return {
    lines,
    io: {
      log: (line: string) => {
        lines.push(line);
      },
    },
  };
}

function walkFiles(root: string, current: string, output: Map<string, string>): void {
  const entries = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      walkFiles(root, absolutePath, output);
      continue;
    }

    output.set(relativePath, fs.readFileSync(absolutePath, "utf8"));
  }
}

export function snapshotFileTree(root: string): Record<string, string> {
  const output = new Map<string, string>();
  walkFiles(root, root, output);
  return Object.fromEntries(Array.from(output.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

export function readFile(root: string, relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

export function writeFile(root: string, relativePath: string, content: string): void {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

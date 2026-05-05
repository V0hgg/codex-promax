export type InstallScope = "project" | "user" | "both";

const INSTALL_SCOPES = new Set<InstallScope>(["project", "user", "both"]);

export function validInstallScopeList(): string {
  return "project, user, or both";
}

export function parseInstallScope(input: string | undefined): InstallScope {
  const normalized = (input ?? "project").trim().toLowerCase();

  if (normalized.length === 0) {
    return "project";
  }

  if (normalized === "global") {
    return "user";
  }

  if (!INSTALL_SCOPES.has(normalized as InstallScope)) {
    throw new Error(`Invalid install scope "${input}". Use ${validInstallScopeList()}.`);
  }

  return normalized as InstallScope;
}

export function scopeIncludesProject(scope: InstallScope): boolean {
  return scope === "project" || scope === "both";
}

export function scopeIncludesUser(scope: InstallScope): boolean {
  return scope === "user" || scope === "both";
}

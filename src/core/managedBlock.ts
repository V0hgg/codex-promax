export const MANAGED_BEGIN = "<!-- execplans:begin -->";
export const MANAGED_END = "<!-- execplans:end -->";

export function hasManagedBlock(content: string): boolean {
  const beginIndex = content.indexOf(MANAGED_BEGIN);
  if (beginIndex === -1) {
    return false;
  }

  const endIndex = content.indexOf(MANAGED_END, beginIndex + MANAGED_BEGIN.length);
  return endIndex !== -1;
}

export function upsertManagedBlock(existingContent: string, managedBlock: string): string {
  const blockPattern = /<!-- execplans:begin -->[\s\S]*?<!-- execplans:end -->\r?\n?/;

  if (blockPattern.test(existingContent)) {
    return existingContent.replace(blockPattern, managedBlock);
  }

  if (existingContent.trim().length === 0) {
    return managedBlock;
  }

  const withTerminalNewline = existingContent.endsWith("\n") ? existingContent : `${existingContent}\n`;
  return `${withTerminalNewline}\n${managedBlock}`;
}

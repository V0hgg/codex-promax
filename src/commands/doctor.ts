import { CommonOptions, resolveConfig } from "../core/config";
import { runDoctorChecks } from "../core/doctorChecks";

export interface DoctorIo {
  log: (line: string) => void;
}

const defaultIo: DoctorIo = {
  log: (line: string) => {
    console.log(line);
  },
};

export async function runDoctor(options: CommonOptions, io: DoctorIo = defaultIo): Promise<number> {
  const config = resolveConfig(options);

  const fixes = runDoctorChecks({
    root: config.root,
    apps: config.apps,
    preset: config.preset,
    plansFilePath: config.plansFilePath,
    execplansDirPath: config.execplansDirPath,
    agentsFilePath: config.agentsFilePath,
    claudeFilePath: config.claudeFilePath,
    geminiFilePath: config.geminiFilePath,
    execplanCreateSkillPath: config.execplanCreateSkillPath,
    execplanExecuteSkillPath: config.execplanExecuteSkillPath,
    initHarnessSkillPath: config.initHarnessSkillPath,
    claudeExecplanCreateSkillPath: config.claudeExecplanCreateSkillPath,
    claudeExecplanExecuteSkillPath: config.claudeExecplanExecuteSkillPath,
    claudeInitHarnessSkillPath: config.claudeInitHarnessSkillPath,
    antigravityExecplanCreateSkillPath: config.antigravityExecplanCreateSkillPath,
    antigravityExecplanExecuteSkillPath: config.antigravityExecplanExecuteSkillPath,
    antigravityInitHarnessSkillPath: config.antigravityInitHarnessSkillPath,
    checkAgentsFile: config.apps.needsAgentsFile,
    checkClaudeFile: config.apps.needsClaudeFile,
    checkGeminiFile: config.apps.needsGeminiFile,
    checkSharedSkills: config.apps.needsSharedSkills,
    checkClaudeSkills: config.apps.needsClaudeSkills,
    checkAntigravitySkills: config.apps.needsAntigravitySkills,
  });

  if (fixes.length === 0) {
    io.log("OK");
    return 0;
  }

  for (const line of fixes) {
    io.log(line);
  }

  return 1;
}

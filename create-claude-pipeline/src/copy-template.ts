import path from "path";
import fs from "fs-extra";
import { getTemplateDir } from "./paths.js";

interface CopyResult {
  copied: string[];
  skipped: string[];
}

async function copyDirSkipExisting(src: string, dest: string): Promise<CopyResult> {
  const copied: string[] = [];
  const skipped: string[] = [];

  await fs.ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (await fs.pathExists(destPath)) {
      skipped.push(entry.name);
      continue;
    }

    await fs.copy(srcPath, destPath);
    copied.push(entry.name);
  }

  return { copied, skipped };
}

export interface CopyTemplateResult {
  agents: CopyResult;
  skills: CopyResult;
  references: CopyResult;
  dashboard: boolean;
  runner: boolean;
}

export async function copyTemplateFiles(targetDir: string): Promise<CopyTemplateResult> {
  const templateDir = getTemplateDir();

  const agents = await copyDirSkipExisting(
    path.join(templateDir, ".claude", "agents"),
    path.join(targetDir, ".claude", "agents")
  );

  const skills = await copyDirSkipExisting(
    path.join(templateDir, ".claude", "skills"),
    path.join(targetDir, ".claude", "skills")
  );

  const references = await copyDirSkipExisting(
    path.join(templateDir, "references"),
    path.join(targetDir, "references")
  );

  const dashboardSrc = path.join(templateDir, ".claude-pipeline", "dashboard");
  const dashboardDest = path.join(targetDir, ".claude-pipeline", "dashboard");
  await fs.copy(dashboardSrc, dashboardDest, { overwrite: true });

  const runnerSrc = path.join(templateDir, ".claude-pipeline", "runner");
  const runnerDest = path.join(targetDir, ".claude-pipeline", "runner");
  await fs.copy(runnerSrc, runnerDest, { overwrite: true });

  await fs.ensureDir(path.join(targetDir, "pipelines"));

  return { agents, skills, references, dashboard: true, runner: true };
}

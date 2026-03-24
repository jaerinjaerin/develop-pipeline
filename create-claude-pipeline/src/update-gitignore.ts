import path from "path";
import fs from "fs-extra";

const ENTRIES = [
  ".claude-pipeline/dashboard/node_modules/",
  ".claude-pipeline/dashboard/.next/",
  "pipelines/",
];

export async function updateGitignore(targetDir: string): Promise<{ added: string[]; skipped: string[] }> {
  const gitignorePath = path.join(targetDir, ".gitignore");
  const added: string[] = [];
  const skipped: string[] = [];

  let content = "";
  if (await fs.pathExists(gitignorePath)) {
    content = await fs.readFile(gitignorePath, "utf-8");
  }

  const lines = content.split("\n").map((l) => l.trim());

  for (const entry of ENTRIES) {
    if (lines.includes(entry)) {
      skipped.push(entry);
    } else {
      added.push(entry);
    }
  }

  if (added.length > 0) {
    const section = "\n# Claude Pipeline\n" + added.join("\n") + "\n";
    await fs.appendFile(gitignorePath, section, "utf-8");
  }

  return { added, skipped };
}

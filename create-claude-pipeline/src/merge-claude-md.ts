import path from "path";
import fs from "fs-extra";
import { getTemplateDir } from "./paths.js";

const MARKER_START = "<!-- claude-pipeline-start -->";
const MARKER_END = "<!-- claude-pipeline-end -->";

export type MergeResult = "created" | "merged" | "skipped";

export async function mergeCLAUDEmd(targetDir: string): Promise<MergeResult> {
  const targetPath = path.join(targetDir, "CLAUDE.md");
  const templatePath = path.join(getTemplateDir(), "CLAUDE.md");
  const templateContent = await fs.readFile(templatePath, "utf-8");

  if (!(await fs.pathExists(targetPath))) {
    const wrapped = `${MARKER_START}\n${templateContent}\n${MARKER_END}\n`;
    await fs.writeFile(targetPath, wrapped, "utf-8");
    return "created";
  }

  const existing = await fs.readFile(targetPath, "utf-8");

  if (existing.includes(MARKER_START)) {
    return "skipped";
  }

  const section = `\n\n---\n\n${MARKER_START}\n${templateContent}\n${MARKER_END}\n`;
  await fs.appendFile(targetPath, section, "utf-8");
  return "merged";
}

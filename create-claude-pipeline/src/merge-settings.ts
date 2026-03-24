import path from "path";
import fs from "fs-extra";
import { getTemplateDir } from "./paths.js";

function mergeArrays(existing: unknown[], incoming: unknown[]): unknown[] {
  const existingStrs = new Set(existing.map(String));
  return [
    ...existing,
    ...incoming.filter((item) => !existingStrs.has(String(item))),
  ];
}

function deepMerge(existing: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const result = { ...existing };

  for (const key of Object.keys(incoming)) {
    if (!(key in result)) {
      result[key] = incoming[key];
    } else if (Array.isArray(result[key]) && Array.isArray(incoming[key])) {
      result[key] = mergeArrays(result[key] as unknown[], incoming[key] as unknown[]);
    } else if (
      typeof result[key] === "object" && result[key] !== null &&
      typeof incoming[key] === "object" && incoming[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        incoming[key] as Record<string, unknown>
      );
    }
  }

  return result;
}

export type MergeResult = "created" | "merged";

export async function mergeSettings(targetDir: string): Promise<MergeResult> {
  const targetPath = path.join(targetDir, ".claude", "settings.json");
  const templatePath = path.join(getTemplateDir(), ".claude", "settings.json");

  const templateContent = await fs.readJSON(templatePath);

  if (!(await fs.pathExists(targetPath))) {
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeJSON(targetPath, templateContent, { spaces: 2 });
    return "created";
  }

  const existingContent = await fs.readJSON(targetPath);
  const merged = deepMerge(existingContent, templateContent);
  await fs.writeJSON(targetPath, merged, { spaces: 2 });
  return "merged";
}

import { execSync } from "child_process";

export async function npmInstall(cwd: string): Promise<void> {
  try {
    execSync("npm install", {
      cwd,
      stdio: "pipe",
      timeout: 120_000,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `npm install 실패: ${message}\n` +
      `수동으로 실행해주세요: cd ${cwd} && npm install`
    );
  }
}

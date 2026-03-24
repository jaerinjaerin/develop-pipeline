import path from "path";
import { spawn } from "child_process";
import detectPort from "detect-port";
import open from "open";
import * as log from "./logger.js";

export async function startDashboard(targetDir: string): Promise<void> {
  const dashboardDir = path.join(targetDir, ".claude-pipeline", "dashboard");
  const port = await detectPort(3000);

  const child = spawn("npm", ["run", "dev"], {
    cwd: dashboardDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      PIPELINES_DIR: path.join(targetDir, "pipelines"),
    },
    shell: true,
  });

  child.on("error", (err) => {
    log.error(`대시보드 실행 실패: ${err.message}`);
    process.exit(1);
  });

  const cleanup = (signal: NodeJS.Signals) => {
    child.kill(signal);
    process.exit(0);
  };
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));

  const url = `http://localhost:${port}`;
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  await open(url);
  log.done(url);

  await new Promise<void>((resolve) => {
    child.on("close", () => resolve());
  });
}

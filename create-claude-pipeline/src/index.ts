import path from "path";
import fs from "fs-extra";
import ora from "ora";
import * as log from "./logger.js";
import { copyTemplateFiles } from "./copy-template.js";
import { mergeCLAUDEmd } from "./merge-claude-md.js";
import { mergeSettings } from "./merge-settings.js";
import { updateGitignore } from "./update-gitignore.js";
import { npmInstall } from "./install.js";
import { startDashboard } from "./start-dashboard.js";

const TOTAL_STEPS = 6;

function showHelp(): void {
  console.log(`
  Usage: npx create-claude-pipeline

  Claude Code 파이프라인 시스템을 현재 디렉토리에 설치하고 대시보드를 실행합니다.

  최초 실행: 전체 시스템 설치 + 대시보드 실행
  재실행:   대시보드만 실행

  Options:
    --help      이 도움말 표시
    --version   버전 표시
`);
}

async function showVersion(): Promise<void> {
  const pkg = await fs.readJSON(path.join(__dirname, "..", "package.json"));
  console.log(pkg.version);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    showHelp();
    return;
  }
  if (args.includes("--version")) {
    await showVersion();
    return;
  }

  const major = parseInt(process.version.slice(1), 10);
  if (major < 18) {
    log.error(`Node.js 18 이상이 필요합니다 (현재: ${process.version})`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const dashboardPkg = path.join(cwd, ".claude-pipeline", "dashboard", "package.json");

  if (await fs.pathExists(dashboardPkg)) {
    console.log();
    log.success("이미 설치됨 — 대시보드만 실행합니다");
    await startDashboard(cwd);
    return;
  }

  log.banner();

  log.step(1, TOTAL_STEPS, "파일 복사 중...");
  const copyResult = await copyTemplateFiles(cwd);
  log.success(`.claude/agents/ (${copyResult.agents.copied.length}개 복사, ${copyResult.agents.skipped.length}개 건너뜀)`);
  log.success(`.claude/skills/ (${copyResult.skills.copied.length}개 복사, ${copyResult.skills.skipped.length}개 건너뜀)`);
  log.success(`references/ (${copyResult.references.copied.length}개 복사, ${copyResult.references.skipped.length}개 건너뜀)`);

  log.step(2, TOTAL_STEPS, "CLAUDE.md 병합 중...");
  const mdResult = await mergeCLAUDEmd(cwd);
  if (mdResult === "created") {
    log.success("CLAUDE.md 생성");
  } else if (mdResult === "merged") {
    log.success("기존 CLAUDE.md에 파이프라인 섹션 추가");
  } else {
    log.success("CLAUDE.md 이미 파이프라인 섹션 포함 — 건너뜀");
  }

  log.step(3, TOTAL_STEPS, ".claude/settings.json 병합 중...");
  const settingsResult = await mergeSettings(cwd);
  if (settingsResult === "created") {
    log.success("settings.json 생성");
  } else {
    log.success("기존 settings.json에 파이프라인 설정 병합");
  }

  log.step(4, TOTAL_STEPS, ".gitignore 업데이트 중...");
  const gitignoreResult = await updateGitignore(cwd);
  if (gitignoreResult.added.length > 0) {
    log.success(`.gitignore에 ${gitignoreResult.added.length}개 항목 추가`);
  } else {
    log.success(".gitignore 이미 최신 — 건너뜀");
  }

  log.step(5, TOTAL_STEPS, "대시보드 설치 중...");
  const spinner = ora("  npm install 실행 중...").start();
  try {
    await npmInstall(path.join(cwd, ".claude-pipeline", "dashboard"));
    spinner.succeed("  npm install 완료");
  } catch (err) {
    spinner.fail("  npm install 실패");
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  log.step(6, TOTAL_STEPS, "대시보드 실행 중...");
  await startDashboard(cwd);
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

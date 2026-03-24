# create-claude-pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npm CLI package (`create-claude-pipeline`) that installs the full Claude Code pipeline system into any project and auto-launches the monitoring dashboard.

**Architecture:** Single npm package containing CLI source (`src/`) and template files (`template/`). CLI is built with tsup into `bin/cli.js`. On `npx create-claude-pipeline`, it copies template files to the current directory, merges CLAUDE.md and settings.json, runs `npm install` in the dashboard, and spawns the dashboard dev server.

**Tech Stack:** Node.js 18+, TypeScript, tsup (bundler), fs-extra, chalk, ora, open, detect-port

**Spec:** `docs/superpowers/specs/2026-03-24-create-claude-pipeline-design.md`

---

## File Structure

```
create-claude-pipeline/           # 프로젝트 루트에 새 디렉토리
├── package.json                  # npm 패키지 정의 (bin, files, dependencies)
├── tsconfig.json                 # TypeScript 설정
├── src/
│   ├── index.ts                  # 메인 오케스트레이터 (main 함수, CLI 플래그 파싱)
│   ├── paths.ts                  # getTemplateDir() 공통 유틸
│   ├── copy-template.ts          # 템플릿 파일 복사 (agents, skills, references, dashboard)
│   ├── merge-claude-md.ts        # CLAUDE.md 병합 (마커 기반 중복 감지)
│   ├── merge-settings.ts         # settings.json 딥 병합 (배열 중복 제거)
│   ├── update-gitignore.ts       # .gitignore에 항목 추가
│   ├── install.ts                # npm install 실행 (스피너 포함)
│   ├── start-dashboard.ts        # 대시보드 spawn + 브라우저 열기 + 시그널 핸들링
│   └── logger.ts                 # chalk 기반 로그 유틸 (step, success, error, info)
└── template/                     # 사용자 프로젝트에 복사될 파일들
    ├── CLAUDE.md                 # 현재 프로젝트의 CLAUDE.md 복사
    ├── .claude/
    │   ├── agents/               # 현재 .claude/agents/ 8개 파일 복사
    │   ├── skills/               # 현재 .claude/skills/ 21개 폴더 복사
    │   └── settings.json         # 현재 .claude/settings.json 복사
    ├── .claude-pipeline/
    │   └── dashboard/            # 현재 dashboard/ 전체 복사 (node_modules 제외)
    └── references/               # 현재 references/ 3개 파일 복사
```

---

### Task 1: 프로젝트 초기화 및 package.json 설정

**Files:**
- Create: `create-claude-pipeline/package.json`
- Create: `create-claude-pipeline/tsconfig.json`

- [ ] **Step 1: create-claude-pipeline 디렉토리 생성**

```bash
mkdir -p create-claude-pipeline/src create-claude-pipeline/bin
```

- [ ] **Step 2: package.json 작성**

```json
{
  "name": "create-claude-pipeline",
  "version": "0.1.0",
  "description": "Claude Code 파이프라인 시스템을 프로젝트에 설치하고 대시보드를 실행합니다",
  "bin": {
    "create-claude-pipeline": "./bin/cli.js"
  },
  "files": [
    "bin/",
    "template/"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs --out-dir bin --clean",
    "dev": "tsup src/index.ts --format cjs --out-dir bin --watch"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "detect-port": "^2.0.0",
    "fs-extra": "^11.3.0",
    "open": "^10.1.0",
    "ora": "^8.2.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20.0.0",
    "tsup": "^8.4.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "bin",
    "rootDir": "src",
    "declaration": false
  },
  "include": ["src"]
}
```

- [ ] **Step 4: npm install**

```bash
cd create-claude-pipeline && npm install
```

- [ ] **Step 5: 커밋**

```bash
git add create-claude-pipeline/package.json create-claude-pipeline/tsconfig.json create-claude-pipeline/package-lock.json
git commit -m "feat: init create-claude-pipeline package scaffold"
```

---

### Task 2: template/ 디렉토리 구성

현재 프로젝트의 파일들을 `create-claude-pipeline/template/`에 복사한다. 이 파일들이 npm 패키지에 포함되어 사용자 프로젝트로 복사된다.

**Files:**
- Create: `create-claude-pipeline/template/` (전체 구조)

- [ ] **Step 1: CLAUDE.md, references, agents, skills, settings.json 복사**

```bash
# CLAUDE.md
cp CLAUDE.md create-claude-pipeline/template/CLAUDE.md

# references/
cp -r references/ create-claude-pipeline/template/references/

# .claude/agents/
mkdir -p create-claude-pipeline/template/.claude/agents
cp .claude/agents/*.md create-claude-pipeline/template/.claude/agents/

# .claude/skills/
mkdir -p create-claude-pipeline/template/.claude/skills
cp -r .claude/skills/* create-claude-pipeline/template/.claude/skills/

# .claude/settings.json
cp .claude/settings.json create-claude-pipeline/template/.claude/settings.json
```

- [ ] **Step 2: dashboard를 .claude-pipeline/dashboard/로 복사 (node_modules 제외)**

```bash
mkdir -p create-claude-pipeline/template/.claude-pipeline
# node_modules, .next, .env 제외하여 복사 (rsync 대신 tar 사용 — 크로스 플랫폼 호환)
tar -cf - --exclude='node_modules' --exclude='.next' --exclude='.env' -C . dashboard | tar -xf - -C create-claude-pipeline/template/.claude-pipeline/
```

- [ ] **Step 3: dashboard의 pipelines.ts 수정 — PIPELINES_DIR 폴백 변경**

`create-claude-pipeline/template/.claude-pipeline/dashboard/src/lib/pipelines.ts` 5행:

현재:
```typescript
const PIPELINES_DIR = process.env.PIPELINES_DIR || path.join(process.cwd(), "..", "pipelines");
```

변경:
```typescript
const PIPELINES_DIR = process.env.PIPELINES_DIR;
if (!PIPELINES_DIR) {
  throw new Error("PIPELINES_DIR 환경변수가 설정되지 않았습니다. npx create-claude-pipeline으로 실행해주세요.");
}
```

> CLI가 항상 절대경로를 `PIPELINES_DIR` 환경변수로 주입하므로 폴백을 제거한다. 환경변수 없이 직접 실행하면 명확한 에러 메시지를 표시한다.

- [ ] **Step 4: 파일 구조 확인**

```bash
find create-claude-pipeline/template -maxdepth 3 -not -path '*/node_modules/*' | head -30
```

예상 결과: `.claude/`, `.claude-pipeline/dashboard/`, `references/`, `CLAUDE.md` 포함

- [ ] **Step 5: 커밋**

```bash
git add create-claude-pipeline/template/
git commit -m "feat: add template files for pipeline system"
```

---

### Task 3: paths.ts — 공통 경로 유틸

**Files:**
- Create: `create-claude-pipeline/src/paths.ts`

- [ ] **Step 1: paths.ts 작성**

```typescript
import path from "path";

// CLI 번들(bin/cli.js) 기준으로 template/ 위치를 찾는다
// 빌드 후 구조: bin/cli.js, template/
export function getTemplateDir(): string {
  return path.join(__dirname, "..", "template");
}
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/paths.ts
git commit -m "feat: add shared paths utility"
```

---

### Task 4: logger.ts — 로그 유틸

**Files:**
- Create: `create-claude-pipeline/src/logger.ts`

- [ ] **Step 1: logger.ts 작성**

```typescript
import chalk from "chalk";

export function step(current: number, total: number, message: string): void {
  console.log(chalk.cyan(`  [${current}/${total}] `) + message);
}

export function success(message: string): void {
  console.log(chalk.green("        ✓ ") + message);
}

export function error(message: string): void {
  console.log(chalk.red("        ✗ ") + message);
}

export function info(message: string): void {
  console.log(chalk.gray("        ") + message);
}

export function banner(): void {
  console.log();
  console.log(chalk.bold("  🚀 Claude Pipeline 설치 중..."));
  console.log();
}

export function done(url: string): void {
  console.log();
  console.log(chalk.green.bold(`  ✅ 완료! 대시보드: ${url}`));
  console.log(chalk.gray("     종료: Ctrl+C"));
  console.log();
}
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/logger.ts
git commit -m "feat: add logger utility with chalk formatting"
```

---

### Task 4: copy-template.ts — 템플릿 파일 복사

**Files:**
- Create: `create-claude-pipeline/src/copy-template.ts`

- [ ] **Step 1: copy-template.ts 작성**

```typescript
import path from "path";
import fs from "fs-extra";
import { getTemplateDir } from "./paths.js";

interface CopyResult {
  copied: string[];
  skipped: string[];
}

// 디렉토리 내 파일을 대상 디렉토리로 복사 (이미 존재하는 파일은 건너뜀)
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
}

export async function copyTemplateFiles(targetDir: string): Promise<CopyTemplateResult> {
  const templateDir = getTemplateDir();

  // .claude/agents/
  const agents = await copyDirSkipExisting(
    path.join(templateDir, ".claude", "agents"),
    path.join(targetDir, ".claude", "agents")
  );

  // .claude/skills/
  const skills = await copyDirSkipExisting(
    path.join(templateDir, ".claude", "skills"),
    path.join(targetDir, ".claude", "skills")
  );

  // references/
  const references = await copyDirSkipExisting(
    path.join(templateDir, "references"),
    path.join(targetDir, "references")
  );

  // .claude-pipeline/dashboard/ (항상 덮어쓰기 — 대시보드는 사용자가 수정하지 않는다는 전제)
  const dashboardSrc = path.join(templateDir, ".claude-pipeline", "dashboard");
  const dashboardDest = path.join(targetDir, ".claude-pipeline", "dashboard");
  await fs.copy(dashboardSrc, dashboardDest, { overwrite: true });

  // pipelines/ 디렉토리 생성 (대시보드가 읽는 상태 파일 저장소)
  await fs.ensureDir(path.join(targetDir, "pipelines"));

  return { agents, skills, references, dashboard: true };
}
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/copy-template.ts
git commit -m "feat: add template file copy with skip-existing logic"
```

---

### Task 5: merge-claude-md.ts — CLAUDE.md 병합

**Files:**
- Create: `create-claude-pipeline/src/merge-claude-md.ts`

- [ ] **Step 1: merge-claude-md.ts 작성**

```typescript
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

  // CLAUDE.md가 없으면 그대로 복사
  if (!(await fs.pathExists(targetPath))) {
    const wrapped = `${MARKER_START}\n${templateContent}\n${MARKER_END}\n`;
    await fs.writeFile(targetPath, wrapped, "utf-8");
    return "created";
  }

  // 이미 존재하면 마커 확인
  const existing = await fs.readFile(targetPath, "utf-8");

  if (existing.includes(MARKER_START)) {
    return "skipped";
  }

  // 기존 파일 끝에 파이프라인 섹션 추가
  const section = `\n\n---\n\n${MARKER_START}\n${templateContent}\n${MARKER_END}\n`;
  await fs.appendFile(targetPath, section, "utf-8");
  return "merged";
}
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/merge-claude-md.ts
git commit -m "feat: add CLAUDE.md merge with marker-based dedup"
```

---

### Task 6: merge-settings.ts — settings.json 병합

**Files:**
- Create: `create-claude-pipeline/src/merge-settings.ts`

- [ ] **Step 1: merge-settings.ts 작성**

```typescript
import path from "path";
import fs from "fs-extra";
import { getTemplateDir } from "./paths.js";

// 배열을 중복 제거하여 병합 (원시값 기준)
function mergeArrays(existing: unknown[], incoming: unknown[]): unknown[] {
  const set = new Set([...existing.map(String), ...incoming.map(String)]);
  const existingStrs = new Set(existing.map(String));
  // 기존 항목 유지 + 새 항목 추가
  return [
    ...existing,
    ...incoming.filter((item) => !existingStrs.has(String(item))),
  ];
}

// 딥 병합: 기존 키 보존, 새 키만 추가, 배열은 합침
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
    // 기존 키가 이미 있고 객체/배열이 아닌 경우: 기존 값 유지
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
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/merge-settings.ts
git commit -m "feat: add settings.json deep merge with array dedup"
```

---

### Task 7: update-gitignore.ts — .gitignore 업데이트

**Files:**
- Create: `create-claude-pipeline/src/update-gitignore.ts`

- [ ] **Step 1: update-gitignore.ts 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/update-gitignore.ts
git commit -m "feat: add .gitignore auto-update for pipeline entries"
```

---

### Task 8: install.ts — npm install 실행

**Files:**
- Create: `create-claude-pipeline/src/install.ts`

- [ ] **Step 1: install.ts 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/install.ts
git commit -m "feat: add npm install wrapper with error guidance"
```

---

### Task 9: start-dashboard.ts — 대시보드 실행

**Files:**
- Create: `create-claude-pipeline/src/start-dashboard.ts`

- [ ] **Step 1: start-dashboard.ts 작성**

```typescript
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

  // 자식 프로세스 에러 처리
  child.on("error", (err) => {
    log.error(`대시보드 실행 실패: ${err.message}`);
    process.exit(1);
  });

  // Ctrl+C 시 자식 프로세스 정리 후 종료
  const cleanup = (signal: NodeJS.Signals) => {
    child.kill(signal);
    process.exit(0);
  };
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));

  // 서버 시작 대기 후 브라우저 열기 (폴링 방식, 최대 15초)
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

  // 자식 프로세스가 종료될 때까지 대기
  await new Promise<void>((resolve) => {
    child.on("close", () => resolve());
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/start-dashboard.ts
git commit -m "feat: add dashboard launcher with port detection and signal handling"
```

---

### Task 10: index.ts — 메인 오케스트레이터

**Files:**
- Create: `create-claude-pipeline/src/index.ts`

- [ ] **Step 1: index.ts 작성**

```typescript
#!/usr/bin/env node

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

// --help 플래그
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

// --version 플래그
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

  // Node.js 버전 체크
  const major = parseInt(process.version.slice(1), 10);
  if (major < 18) {
    log.error(`Node.js 18 이상이 필요합니다 (현재: ${process.version})`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const dashboardPkg = path.join(cwd, ".claude-pipeline", "dashboard", "package.json");

  // 재실행 감지
  if (await fs.pathExists(dashboardPkg)) {
    console.log();
    log.success("이미 설치됨 — 대시보드만 실행합니다");
    await startDashboard(cwd);
    return;
  }

  // 최초 설치
  log.banner();

  // Step 1: 템플릿 파일 복사
  log.step(1, TOTAL_STEPS, "파일 복사 중...");
  const copyResult = await copyTemplateFiles(cwd);
  log.success(`.claude/agents/ (${copyResult.agents.copied.length}개 복사, ${copyResult.agents.skipped.length}개 건너뜀)`);
  log.success(`.claude/skills/ (${copyResult.skills.copied.length}개 복사, ${copyResult.skills.skipped.length}개 건너뜀)`);
  log.success(`references/ (${copyResult.references.copied.length}개 복사, ${copyResult.references.skipped.length}개 건너뜀)`);

  // Step 2: CLAUDE.md 병합
  log.step(2, TOTAL_STEPS, "CLAUDE.md 병합 중...");
  const mdResult = await mergeCLAUDEmd(cwd);
  if (mdResult === "created") {
    log.success("CLAUDE.md 생성");
  } else if (mdResult === "merged") {
    log.success("기존 CLAUDE.md에 파이프라인 섹션 추가");
  } else {
    log.success("CLAUDE.md 이미 파이프라인 섹션 포함 — 건너뜀");
  }

  // Step 3: settings.json 병합
  log.step(3, TOTAL_STEPS, ".claude/settings.json 병합 중...");
  const settingsResult = await mergeSettings(cwd);
  if (settingsResult === "created") {
    log.success("settings.json 생성");
  } else {
    log.success("기존 settings.json에 파이프라인 설정 병합");
  }

  // Step 4: .gitignore 업데이트
  log.step(4, TOTAL_STEPS, ".gitignore 업데이트 중...");
  const gitignoreResult = await updateGitignore(cwd);
  if (gitignoreResult.added.length > 0) {
    log.success(`.gitignore에 ${gitignoreResult.added.length}개 항목 추가`);
  } else {
    log.success(".gitignore 이미 최신 — 건너뜀");
  }

  // Step 5: 대시보드 npm install
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

  // Step 6: 대시보드 실행
  log.step(6, TOTAL_STEPS, "대시보드 실행 중...");
  await startDashboard(cwd);
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/src/index.ts
git commit -m "feat: add main CLI orchestrator with install/re-run detection"
```

---

### Task 11: 빌드 및 로컬 테스트

**Files:**
- Modify: `create-claude-pipeline/package.json` (tsup 설정 확인)

- [ ] **Step 1: tsup으로 빌드**

```bash
cd create-claude-pipeline && npm run build
```

예상 결과: `bin/cli.js` 파일 생성

- [ ] **Step 2: bin/cli.js에 shebang 확인**

`tsup` 설정에 banner를 추가하여 shebang이 포함되도록 한다. `package.json`의 build 스크립트 수정:

```json
"build": "tsup src/index.ts --format cjs --out-dir bin --clean --banner.js '#!/usr/bin/env node'"
```

- [ ] **Step 3: 빌드 재실행 후 확인**

```bash
cd create-claude-pipeline && npm run build && head -1 bin/cli.js
```

예상 결과: `#!/usr/bin/env node`

- [ ] **Step 4: 임시 디렉토리에서 로컬 테스트**

```bash
mkdir -p /tmp/test-pipeline-install
cd /tmp/test-pipeline-install
node /home/jrlee/document/jaerinjaerin/claude-guide/create-claude-pipeline/bin/cli.js
```

예상 결과:
- `.claude/agents/`, `.claude/skills/`, `references/` 복사됨
- `CLAUDE.md` 생성됨
- `.claude-pipeline/dashboard/` 생성됨
- npm install 실행됨
- 대시보드가 브라우저에서 열림

- [ ] **Step 5: 재실행 테스트**

같은 디렉토리에서 다시 실행:

```bash
cd /tmp/test-pipeline-install
node /home/jrlee/document/jaerinjaerin/claude-guide/create-claude-pipeline/bin/cli.js
```

예상 결과: "이미 설치됨 — 대시보드만 실행합니다" 메시지 후 대시보드 실행

- [ ] **Step 6: 기존 CLAUDE.md 병합 테스트**

```bash
mkdir -p /tmp/test-pipeline-merge
cd /tmp/test-pipeline-merge
echo "# My Project\nSome existing content" > CLAUDE.md
node /home/jrlee/document/jaerinjaerin/claude-guide/create-claude-pipeline/bin/cli.js
```

예상 결과: 기존 CLAUDE.md 내용 보존 + 파이프라인 섹션 추가됨

- [ ] **Step 7: 테스트 디렉토리 정리**

```bash
rm -rf /tmp/test-pipeline-install /tmp/test-pipeline-merge
```

- [ ] **Step 8: 커밋**

```bash
git add create-claude-pipeline/
git commit -m "feat: build CLI and verify install/merge/re-run flows"
```

---

### Task 12: npm 배포 준비

**Files:**
- Modify: `create-claude-pipeline/package.json` (최종 확인)
- Create: `create-claude-pipeline/.npmignore`

- [ ] **Step 1: .npmignore 작성**

```
src/
tsconfig.json
node_modules/
template/.claude-pipeline/dashboard/node_modules/
template/.claude-pipeline/dashboard/.next/
```

- [ ] **Step 2: npm pack으로 패키지 내용 확인**

```bash
cd create-claude-pipeline && npm pack --dry-run
```

예상 결과: `bin/cli.js`, `template/` 포함, `src/`, `node_modules/` 제외 확인

- [ ] **Step 3: 커밋**

```bash
git add create-claude-pipeline/.npmignore
git commit -m "feat: add .npmignore for clean npm publish"
```

---

## 실행 순서 요약

```
Task 1  → 프로젝트 초기화 (package.json, tsconfig.json)
Task 2  → template/ 구성 (기존 파일 복사 + pipelines.ts 수정)
Task 3  → paths.ts (공통 경로 유틸)
Task 4  → logger.ts
Task 5  → copy-template.ts
Task 6  → merge-claude-md.ts
Task 7  → merge-settings.ts
Task 8  → update-gitignore.ts
Task 9  → install.ts
Task 10 → start-dashboard.ts
Task 11 → index.ts (메인 오케스트레이터)
Task 12 → 빌드 + 로컬 테스트
Task 13 → npm 배포 준비
```

Task 1~2는 순차, Task 3은 독립, Task 4~10은 3에 의존(병렬 가능), Task 11은 4~10에 의존, Task 12~13은 11 이후 순차.

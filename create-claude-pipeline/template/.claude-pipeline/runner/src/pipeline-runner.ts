import { spawn, execSync, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { StateManager } from "./state-manager.js";
import { ContextWatcher } from "./context-watcher.js";
import { waitForCheckpoint } from "./checkpoint-waiter.js";

const PIPELINE_ID = process.env.PIPELINE_ID;
const PIPELINES_DIR = process.env.PIPELINES_DIR;
const REQUIREMENTS = process.env.PIPELINE_REQUIREMENTS || process.argv[2] || "";

if (!PIPELINE_ID || !PIPELINES_DIR) {
  console.error("PIPELINE_ID and PIPELINES_DIR environment variables are required");
  process.exit(1);
}

if (!REQUIREMENTS) {
  console.error("No requirements provided");
  process.exit(1);
}

const projectRoot = path.resolve(PIPELINES_DIR, "..");
const contextDir = path.join(PIPELINES_DIR, PIPELINE_ID, "context");

// ── Pre-check ───────────────────────────────────────────────────────
function checkClaudeCLI(): boolean {
  try {
    execSync("claude --version", { timeout: 10000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// ── Run a single Claude -p call and return stdout ───────────────────
function runClaude(prompt: string): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", prompt], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PIPELINE_ID: PIPELINE_ID! },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      // Print lines as they come
      for (const line of text.split("\n")) {
        if (line.trim()) console.log(`[Claude] ${line}`);
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (stderr.trim()) console.error(`[Claude:err] ${stderr.trim()}`);
      resolve({ stdout, code: code ?? 1 });
    });

    child.on("error", () => {
      resolve({ stdout, code: 1 });
    });
  });
}

// ── Read context file if it exists ──────────────────────────────────
function readContextFile(filename: string): string | null {
  const filePath = path.join(contextDir, filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

// ── List existing context files ─────────────────────────────────────
function listContextFiles(): string[] {
  try {
    return fs.readdirSync(contextDir).sort();
  } catch {
    return [];
  }
}

// ── Build phase-specific prompts ────────────────────────────────────

const COMMON_INSTRUCTIONS = [
  `PIPELINE_ID: ${PIPELINE_ID}`,
  "",
  "모든 산출물은 반드시 아래 경로에 저장:",
  `  pipelines/${PIPELINE_ID}/context/`,
  "",
  "예시:",
  `  pipelines/${PIPELINE_ID}/context/00_requirements.md`,
  `  pipelines/${PIPELINE_ID}/context/01_plan.md`,
  "",
  "절대 프로젝트 루트의 context/ 폴더에 파일을 만들지 마세요.",
  'CLAUDE.md의 파이프라인 가이드를 따르세요.',
].join("\n");

function buildPhase0Prompt(): string {
  return [
    "## PHASE 0: 인풋 수신",
    "",
    "아래 요구사항을 분석해서 PM(Alex)으로서 작업 범위를 파악해주세요.",
    "",
    "요구사항:",
    REQUIREMENTS,
    "",
    "수행할 작업:",
    "1. 신규 기능인지 기존 기능 수정인지 판단",
    "2. 영향 범위 파악 (FE / BE / Infra / 전체)",
    "3. 필요한 Agent 역할 목록 결정",
    "4. 예상 작업 순서 설계",
    "",
    `결과를 pipelines/${PIPELINE_ID}/context/00_requirements.md 에 저장해주세요.`,
    "",
    COMMON_INSTRUCTIONS,
  ].join("\n");
}

function buildPhase1Prompt(): string {
  const requirements = readContextFile("00_requirements.md") || REQUIREMENTS;
  return [
    "## PHASE 1: 기획",
    "",
    "기획자(Mina)로서 아래 요구사항을 바탕으로 기획안을 작성해주세요.",
    "",
    "=== 요구사항 ===",
    requirements,
    "=== 끝 ===",
    "",
    "기획안에 포함할 내용:",
    "1. 개요 (목적, 핵심 가치, 작업 범위)",
    "2. 유저 스토리",
    "3. 기능 명세 (표 형식)",
    "4. 화면 목록 (표 형식)",
    "5. API 초안 (Method / Path / 설명 / 인증 여부)",
    "6. 엣지케이스 & 예외 처리",
    "7. 비기능 요구사항",
    "",
    `결과를 pipelines/${PIPELINE_ID}/context/01_plan.md 에 저장해주세요.`,
    "",
    COMMON_INSTRUCTIONS,
  ].join("\n");
}

function buildPhase2Prompt(): string {
  const requirements = readContextFile("00_requirements.md") || REQUIREMENTS;
  const plan = readContextFile("01_plan.md") || "";
  return [
    "## PHASE 2: 설계",
    "",
    "디자이너(Lena)와 BE 설계자(Sam)로서 설계를 수행해주세요.",
    "",
    "=== 요구사항 ===",
    requirements,
    "=== 기획안 ===",
    plan,
    "=== 끝 ===",
    "",
    "디자이너 산출물 (02_design_spec.md):",
    "- 디자인 토큰, 공통 컴포넌트, 화면별 레이아웃, 인터랙션, 접근성",
    "",
    "BE 설계 산출물 (03_api_spec.md + 03_erd.md):",
    "- ERD, API 명세 상세, 인증/권한 설계",
    "",
    `모든 파일을 pipelines/${PIPELINE_ID}/context/ 에 저장해주세요.`,
    "",
    COMMON_INSTRUCTIONS,
  ].join("\n");
}

function buildPhase3Prompt(): string {
  const contextFiles = listContextFiles();
  let contextSummary = "";
  for (const file of contextFiles) {
    const content = readContextFile(file);
    if (content) {
      contextSummary += `\n=== ${file} ===\n${content}\n`;
    }
  }
  return [
    "## PHASE 3: 구현",
    "",
    "FE(Jay), BE(Sam), Infra(Dex)로서 구현을 수행해주세요.",
    "",
    "지금까지의 산출물:",
    contextSummary,
    "=== 끝 ===",
    "",
    "기획안과 설계 명세를 바탕으로 코드를 구현해주세요.",
    "각 Agent는 자신의 담당 파일만 수정합니다.",
    "",
    COMMON_INSTRUCTIONS,
  ].join("\n");
}

function buildPhase4Prompt(): string {
  const contextFiles = listContextFiles();
  let contextSummary = "";
  for (const file of contextFiles) {
    const content = readContextFile(file);
    if (content) {
      contextSummary += `\n=== ${file} ===\n${content}\n`;
    }
  }
  return [
    "## PHASE 4: QA + 통합",
    "",
    "QA(Eva), 보안 리뷰어(Rex), 코드 리뷰어(Nora)로서 검증을 수행해주세요.",
    "",
    "지금까지의 산출물:",
    contextSummary,
    "=== 끝 ===",
    "",
    "산출물:",
    `- pipelines/${PIPELINE_ID}/context/qa_report.md`,
    `- pipelines/${PIPELINE_ID}/context/security_report.md`,
    "",
    COMMON_INSTRUCTIONS,
  ].join("\n");
}

// ── Phase definitions ───────────────────────────────────────────────

interface PhaseConfig {
  phase: number;
  name: string;
  buildPrompt: () => string;
  expectedFiles: string[];
  checkpoint: string;
}

const PHASES: PhaseConfig[] = [
  {
    phase: 0,
    name: "인풋 수신",
    buildPrompt: buildPhase0Prompt,
    expectedFiles: ["00_requirements.md"],
    checkpoint: "요구사항 분석 결과를 확인해주세요.",
  },
  {
    phase: 1,
    name: "기획",
    buildPrompt: buildPhase1Prompt,
    expectedFiles: ["01_plan.md"],
    checkpoint: "기획안을 검토해주세요.",
  },
  {
    phase: 2,
    name: "설계",
    buildPrompt: buildPhase2Prompt,
    expectedFiles: ["02_design_spec.md", "03_api_spec.md"],
    checkpoint: "디자인 명세 + API 명세를 검토해주세요.",
  },
  {
    phase: 3,
    name: "구현",
    buildPrompt: buildPhase3Prompt,
    expectedFiles: [],
    checkpoint: "구현 결과를 확인해주세요.",
  },
  {
    phase: 4,
    name: "QA + 통합",
    buildPrompt: buildPhase4Prompt,
    expectedFiles: ["qa_report.md", "security_report.md"],
    checkpoint: "QA 보고서 + 보안 보고서를 확인해주세요.",
  },
];

// ── Main ────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const stateManager = new StateManager(PIPELINES_DIR!, PIPELINE_ID!);

  const initialState = stateManager.read();
  if (!initialState) {
    console.error(`state.json not found for pipeline ${PIPELINE_ID}`);
    process.exit(1);
  }

  if (!checkClaudeCLI()) {
    stateManager.setStatus("failed");
    stateManager.addActivity(
      "system",
      "error",
      "Claude CLI를 찾을 수 없거나 로그인되어 있지 않습니다.",
    );
    process.exit(1);
  }

  // Ensure context directory exists
  fs.mkdirSync(contextDir, { recursive: true });

  // Start context watcher (fallback: copies root context/ to pipeline context/)
  const contextWatcher = new ContextWatcher(stateManager, PIPELINES_DIR!, PIPELINE_ID!);
  contextWatcher.start();

  stateManager.setStatus("running");
  stateManager.addActivity("system", "info", "파이프라인 시작");

  let lastFeedback = "";

  // ── Run phases sequentially ─────────────────────────────────────
  for (const phaseConfig of PHASES) {
    const { phase, name, buildPrompt, expectedFiles, checkpoint } = phaseConfig;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const isRetry = attempt > 0;

      console.log(`\n[Runner] ── Phase ${phase}: ${name}${isRetry ? ` (재시도 #${attempt})` : ""} ──`);
      stateManager.setPhase(phase);
      stateManager.setStatus("running");

      if (!isRetry) {
        stateManager.addActivity("system", "info", `Phase ${phase} 시작: ${name}`);
      }

      // Build prompt (on retry, append feedback)
      let prompt = buildPrompt();
      if (isRetry && lastFeedback) {
        prompt += `\n\n## 사용자 피드백 (수정 요청)\n${lastFeedback}\n\n위 피드백을 반영하여 이 Phase를 다시 수행해주세요.`;
      }

      const result = await runClaude(prompt);

      if (result.code !== 0) {
        stateManager.setStatus("failed");
        stateManager.addActivity("system", "error", `Phase ${phase} 실패 (exit code: ${result.code})`);
        contextWatcher.stop();
        return;
      }

      // Log Claude's output as activity (truncated)
      const summary = result.stdout.trim().slice(0, 200);
      if (summary) {
        stateManager.addActivity("system", "progress", summary + (result.stdout.length > 200 ? "..." : ""));
      }

      // Register output files
      for (const file of expectedFiles) {
        if (fs.existsSync(path.join(contextDir, file))) {
          stateManager.addOutput(`context/${file}`, phase);
          stateManager.addActivity("system", "success", `산출물 생성: ${file}`);
        }
      }
      for (const file of listContextFiles()) {
        const existing = stateManager.read();
        if (existing && !existing.outputs.some((o) => o.filename === `context/${file}`)) {
          stateManager.addOutput(`context/${file}`, phase);
        }
      }

      // ── Checkpoint: wait for user approval ──────────────────────
      stateManager.addActivity("system", "info", `Checkpoint Phase ${phase}: ${checkpoint}`);
      stateManager.setStatus("paused");
      console.log(`[Runner] Checkpoint Phase ${phase}: waiting for approval...`);

      try {
        const response = await waitForCheckpoint(PIPELINES_DIR!, PIPELINE_ID!);

        if (response.action === "approve") {
          const msg = response.message
            ? `Checkpoint Phase ${phase} approved (피드백: ${response.message})`
            : `Checkpoint Phase ${phase} approved`;
          stateManager.addActivity("system", "success", msg);
          console.log(`[Runner] Phase ${phase} approved`);
          lastFeedback = "";
          break; // Exit retry loop, proceed to next phase
        } else {
          // Reject → retry this phase with feedback
          lastFeedback = response.message || "수정 요청";
          stateManager.addActivity(
            "system",
            "info",
            `Phase ${phase} 수정 요청: ${lastFeedback}`,
          );
          console.log(`[Runner] Phase ${phase} revision requested: ${lastFeedback}`);

          if (attempt === MAX_RETRIES) {
            stateManager.setStatus("failed");
            stateManager.addActivity("system", "error", `Phase ${phase}: 최대 재시도 횟수(${MAX_RETRIES}) 초과`);
            contextWatcher.stop();
            return;
          }
          // Continue retry loop
        }
      } catch (err) {
        console.error("[Runner] Checkpoint error:", err);
        stateManager.setStatus("failed");
        contextWatcher.stop();
        return;
      }
    }
  }

  // ── Finalize ──────────────────────────────────────────────────
  const finalState = stateManager.read();
  if (finalState && finalState.status === "running") {
    stateManager.setStatus("completed");
    stateManager.addActivity("system", "success", "파이프라인 완료");
  }

  contextWatcher.stop();
  console.log("[Runner] Pipeline finished");
}

main().catch((err) => {
  console.error("[Runner] Fatal error:", err);
  process.exit(1);
});

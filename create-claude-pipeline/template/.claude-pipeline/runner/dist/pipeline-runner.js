import { spawn, execSync } from "child_process";
import path from "path";
import { StateManager } from "./state-manager.js";
import { SignalWatcher } from "./signal-watcher.js";
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
const abortController = new AbortController();
// ── Pre-check: Claude CLI availability ──────────────────────────────
function checkClaudeCLI() {
    try {
        execSync("claude --version", { timeout: 10000, stdio: "pipe" });
        return true;
    }
    catch {
        return false;
    }
}
// ── Build the prompt for Claude ─────────────────────────────────────
function buildPrompt(requirements, pipelineId) {
    return [
        "다음 요구사항을 파이프라인으로 처리해주세요.",
        "",
        `PIPELINE_ID: ${pipelineId}`,
        "",
        "요구사항:",
        requirements,
        "",
        "중요: 이 세션은 파이프라인 대시보드에서 실행됩니다.",
        'CLAUDE.md의 "Pipeline Dashboard Integration" 섹션을 반드시 따르세요.',
        "",
        "특히 context 파일 경로에 주의하세요:",
        `- 모든 산출물(context 파일)은 pipelines/${pipelineId}/context/ 에 생성`,
        `- 시그널 파일은 pipelines/${pipelineId}/signals/ 에 생성`,
        `- 예: pipelines/${pipelineId}/context/00_requirements.md`,
        `- 예: pipelines/${pipelineId}/context/01_plan.md`,
        "",
        "절대 프로젝트 루트의 context/ 폴더에 파일을 만들지 마세요.",
    ].join("\n");
}
// ── Main ────────────────────────────────────────────────────────────
async function main() {
    const stateManager = new StateManager(PIPELINES_DIR, PIPELINE_ID);
    // Verify state.json exists (created by dashboard)
    const initialState = stateManager.read();
    if (!initialState) {
        console.error(`state.json not found for pipeline ${PIPELINE_ID}`);
        process.exit(1);
    }
    // Pre-check Claude CLI
    if (!checkClaudeCLI()) {
        stateManager.setStatus("failed");
        stateManager.addActivity("system", "error", "Claude CLI를 찾을 수 없거나 로그인되어 있지 않습니다. `claude --version`을 확인해주세요.");
        process.exit(1);
    }
    // Start watchers
    const signalWatcher = new SignalWatcher(stateManager, PIPELINES_DIR, PIPELINE_ID);
    const contextWatcher = new ContextWatcher(stateManager, PIPELINES_DIR, PIPELINE_ID);
    // Wire up: notify contextWatcher when signals are processed
    signalWatcher.on("phase", () => contextWatcher.notifySignalProcessed());
    signalWatcher.on("checkpoint", () => contextWatcher.notifySignalProcessed());
    signalWatcher.start(500);
    contextWatcher.start();
    stateManager.setStatus("running");
    stateManager.addActivity("system", "info", "파이프라인 시작");
    // ── Spawn Claude CLI ──────────────────────────────────────────────
    const prompt = buildPrompt(REQUIREMENTS, PIPELINE_ID);
    const claude = spawn("claude", ["-p", prompt, "--verbose"], {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PIPELINE_ID: PIPELINE_ID },
    });
    // ── Handle checkpoint events ──────────────────────────────────────
    signalWatcher.on("checkpoint", async (phase, description) => {
        console.log(`[Runner] Checkpoint Phase ${phase}: ${description}`);
        stateManager.setStatus("paused");
        try {
            const response = await waitForCheckpoint(PIPELINES_DIR, PIPELINE_ID, abortController.signal);
            if (response.action === "approve") {
                stateManager.addActivity("system", "success", `Checkpoint Phase ${phase} approved`);
            }
            else {
                const feedback = response.message || "사용자가 수정을 요청했습니다.";
                stateManager.addActivity("system", "info", `Checkpoint Phase ${phase} rejected: ${feedback}`);
            }
            // Note: Claude runs in -p (print) mode with stdin ignored.
            // Checkpoint responses are recorded in state.json activities.
            // Claude reads checkpoint_response.json via signal protocol.
            stateManager.setStatus("running");
        }
        catch (err) {
            if (err.message !== "Aborted") {
                console.error("[Runner] Checkpoint wait error:", err);
            }
        }
    });
    // ── Stream stdout/stderr → parse for activity logging ─────────────
    // Even if Claude doesn't write signal files, we extract progress
    // from stdout to keep the dashboard alive with activity updates.
    const AGENT_KEYWORDS = {
        "PM": "alex", "Alex": "alex",
        "기획": "mina", "Mina": "mina",
        "디자이너": "lena", "Lena": "lena", "디자인": "lena",
        "FE": "jay", "Jay": "jay", "프론트": "jay",
        "BE": "sam", "Sam": "sam", "백엔드": "sam",
        "인프라": "dex", "Dex": "dex", "Infra": "dex", "Docker": "dex",
        "QA": "eva", "Eva": "eva", "테스트": "eva",
        "보안": "rex", "Rex": "rex", "Security": "rex",
        "리뷰": "nora", "Nora": "nora", "코드 리뷰": "nora",
    };
    const PHASE_PATTERNS = [
        { pattern: /PHASE\s*0|인풋\s*수신|요구사항\s*분석/i, phase: 0 },
        { pattern: /PHASE\s*1|기획|plan/i, phase: 1 },
        { pattern: /PHASE\s*2|설계|design|API\s*명세/i, phase: 2 },
        { pattern: /PHASE\s*3|구현|implement/i, phase: 3 },
        { pattern: /PHASE\s*4|QA|통합|보안\s*리뷰/i, phase: 4 },
    ];
    let lastActivityTime = 0;
    const ACTIVITY_THROTTLE_MS = 3000; // Don't spam: max 1 activity per 3s from stdout
    function detectAgentFromLine(line) {
        for (const [keyword, agentId] of Object.entries(AGENT_KEYWORDS)) {
            if (line.includes(keyword))
                return agentId;
        }
        return "system";
    }
    function processStdoutLine(line) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 5)
            return;
        // Skip noisy lines (tool execution details, JSON, whitespace-heavy)
        if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith("```"))
            return;
        if (/^[-=_]{3,}$/.test(trimmed))
            return;
        const now = Date.now();
        // Phase detection (always process, no throttle)
        for (const { pattern, phase } of PHASE_PATTERNS) {
            if (pattern.test(trimmed)) {
                const currentState = stateManager.read();
                if (currentState && currentState.currentPhase < phase) {
                    stateManager.setPhase(phase);
                    stateManager.addActivity("system", "info", `Phase ${phase} 시작`);
                    contextWatcher.notifySignalProcessed();
                }
                break;
            }
        }
        // Checkpoint detection from stdout
        if (/체크포인트|checkpoint/i.test(trimmed) && /승인|확인|검토|approve|review/i.test(trimmed)) {
            // Don't duplicate if signal-watcher already caught it
            return;
        }
        // Throttled activity logging
        if (now - lastActivityTime < ACTIVITY_THROTTLE_MS)
            return;
        lastActivityTime = now;
        // Log meaningful lines as activities
        const agentId = detectAgentFromLine(trimmed);
        // Truncate long lines
        const message = trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
        stateManager.addActivity(agentId, "progress", message);
    }
    let stdoutBuffer = "";
    claude.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";
        for (const line of lines) {
            if (line.trim()) {
                console.log(`[Claude] ${line}`);
                processStdoutLine(line);
            }
        }
    });
    claude.stderr.on("data", (data) => {
        const text = data.toString().trim();
        if (text) {
            console.error(`[Claude:err] ${text}`);
        }
    });
    // ── Handle process exit ───────────────────────────────────────────
    claude.on("close", (code) => {
        console.log(`[Runner] Claude process exited with code ${code}`);
        abortController.abort();
        if (code === 0) {
            stateManager.setStatus("completed");
            stateManager.addActivity("system", "success", "파이프라인 완료");
        }
        else {
            stateManager.setStatus("failed");
            stateManager.addActivity("system", "error", `Claude 프로세스가 비정상 종료되었습니다 (exit code: ${code})`);
        }
        signalWatcher.stop();
        contextWatcher.stop();
    });
    claude.on("error", (err) => {
        console.error("[Runner] Failed to spawn Claude:", err);
        stateManager.setStatus("failed");
        stateManager.addActivity("system", "error", `Claude 실행 실패: ${err.message}`);
        signalWatcher.stop();
        contextWatcher.stop();
    });
    // ── Graceful shutdown ─────────────────────────────────────────────
    const cleanup = () => {
        abortController.abort();
        signalWatcher.stop();
        contextWatcher.stop();
        if (!claude.killed) {
            claude.kill("SIGTERM");
        }
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
}
main().catch((err) => {
    console.error("[Runner] Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=pipeline-runner.js.map
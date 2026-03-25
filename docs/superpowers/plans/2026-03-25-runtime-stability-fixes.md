# Runtime Stability Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 16 runtime stability issues identified in `docs/superpowers/specs/2026-03-25-runtime-stability-analysis.md` across Runner, State Manager, Signal IPC, and Dashboard components.

**Architecture:** All changes are in `create-claude-pipeline/template/.claude-pipeline/` — the template files that get copied to target projects. Runner changes are in `runner/src/`, Dashboard changes are in `dashboard/src/`. No new dependencies are added.

**Tech Stack:** TypeScript, Node.js (fs, child_process), Next.js API routes, SSE

**Note:** This project has no test infrastructure. Changes are verified by TypeScript compilation (`npm run build` in runner directory).

---

## File Map

| File | Changes | Issues Addressed |
|------|---------|-----------------|
| `runner/src/pipeline-runner.ts` | Add CLI timeout, AbortSignal wiring, heartbeat, PID file, graceful shutdown | 1-1, 1-2, 1-3, 1-4, 3-5 |
| `runner/src/types.ts` | Add `phase` field to CheckpointResponse | 3-2 |
| `runner/src/checkpoint-waiter.ts` | Phase-aware checkpoint validation, rename-based read | 3-2 |
| `runner/src/signal-watcher.ts` | Rename-based ownership pattern, truncate instead of unlink | 3-1, 3-3 |
| `runner/src/context-watcher.ts` | File size stability check, seenFiles restoration from state | 3-4, 3-6 |
| `runner/src/state-manager.ts` | Activities cap, rename failure cleanup, single-writer doc | 2-1, 2-2, 2-3 |
| `dashboard/src/lib/pipelines.ts` | Atomic checkpoint write, `__dirname`-based path fallback | 3-2, 4-4 |
| `dashboard/src/app/api/pipelines/route.ts` | PID recording, spawn failure handling, runner crash detection | 1-2, 1-3, 4-3 |
| `dashboard/src/app/api/pipelines/stream/route.ts` | Summary-only for global stream (exclude activities) | 4-2 |
| `dashboard/src/app/api/pipelines/[id]/events/route.ts` | Delta-only SSE (skip full state when only activities changed), heartbeat crash detection | 1-3, 4-1, 4-2 |

---

### Task 1: Runner — CLI 타임아웃 추가 (Critical 1-1)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts:36-69`

**Spec ref:** 분석 문서 1-1. `runClaude()`에 타임아웃이 없어 파이프라인이 영원히 블로킹될 수 있음.

- [ ] **Step 1: `runClaude()`에 타임아웃과 AbortSignal 매개변수 추가**

Phase별 타임아웃 상수를 정의하고, `runClaude()`에 `timeoutMs` 매개변수를 추가한다. 타임아웃 초과 시 SIGTERM → 5초 대기 → SIGKILL 시퀀스로 정리한다.

```typescript
// Phase별 타임아웃 (ms) — Phase 3 구현이 가장 김
const PHASE_TIMEOUTS: Record<number, number> = {
  0: 5 * 60_000,   // 5분
  1: 10 * 60_000,  // 10분
  2: 15 * 60_000,  // 15분
  3: 30 * 60_000,  // 30분
  4: 20 * 60_000,  // 20분
};

function runClaude(
  prompt: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", prompt], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PIPELINE_ID: PIPELINE_ID! },
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    // Timeout handling
    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 5000);
    }, timeoutMs);

    // AbortSignal handling
    if (signal) {
      signal.addEventListener("abort", () => {
        killed = true;
        clearTimeout(timer);
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 5000);
      }, { once: true });
    }

    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n")) {
        if (line.trim()) console.log(`[Claude] ${line}`);
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (stderr.trim()) console.error(`[Claude:err] ${stderr.trim()}`);
      if (killed) {
        resolve({ stdout, code: -1 }); // -1 = killed by timeout/abort
      } else {
        resolve({ stdout, code: code ?? 1 });
      }
    });

    child.on("error", () => {
      clearTimeout(timer);
      resolve({ stdout, code: 1 });
    });
  });
}
```

- [ ] **Step 2: `runClaude()` 호출부에 타임아웃 전달**

main() 함수의 phase 루프에서 `runClaude()` 호출 시 phase에 맞는 타임아웃을 전달한다.

```typescript
// 기존: const result = await runClaude(prompt);
const timeoutMs = PHASE_TIMEOUTS[phase] ?? 15 * 60_000;
const result = await runClaude(prompt, timeoutMs);

// 타임아웃으로 kill된 경우 처리
if (result.code === -1) {
  stateManager.setStatus("failed");
  stateManager.addActivity("system", "error",
    `Phase ${phase} 타임아웃 (${timeoutMs / 60_000}분 초과)`);
  contextWatcher.stop();
  return;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공, dist/ 파일 갱신

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts
git commit -m "fix: add CLI process timeout per phase (Critical 1-1)"
```

---

### Task 2: Signal Watcher — rename 기반 소유권 패턴 (Critical 3-1)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/signal-watcher.ts:52-113`

**Spec ref:** 분석 문서 3-1. `existsSync → readFileSync → unlinkSync` TOCTOU 경쟁.

- [ ] **Step 1: rename 기반 소유권 획득 헬퍼 함수 추가**

파일을 `.processing` 접미사로 rename하여 소유권을 먼저 확보한 후 읽고 삭제하는 패턴을 도입한다.

```typescript
/**
 * Atomically claim a signal file by renaming it, then read and delete.
 * Returns null if file doesn't exist or another process claimed it.
 */
private claimAndRead(filePath: string): string | null {
  const claimedPath = filePath + ".processing";
  try {
    fs.renameSync(filePath, claimedPath);
  } catch {
    // File doesn't exist or another process already claimed it
    return null;
  }
  try {
    const content = fs.readFileSync(claimedPath, "utf-8");
    fs.unlinkSync(claimedPath);
    return content;
  } catch {
    // Cleanup on read failure
    try { fs.unlinkSync(claimedPath); } catch { /* ignore */ }
    return null;
  }
}
```

- [ ] **Step 2: `processPhase()`, `processCheckpoint()`, `processAgents()`에 적용**

기존 `existsSync → readFileSync → unlinkSync` 패턴을 `claimAndRead()`로 교체한다.

```typescript
private processPhase(): void {
  const file = path.join(this.signalsDir, ".phase");
  const content = this.claimAndRead(file);
  if (content === null) return;

  const phase = parseInt(content.trim(), 10);
  if (!isNaN(phase) && phase >= 0 && phase <= 4) {
    this.stateManager.setPhase(phase);
    this.stateManager.addActivity("system", "info", `Phase ${phase} 시작`);
    this.emit("phase", phase);
  }
}

private processCheckpoint(): void {
  const file = path.join(this.signalsDir, ".checkpoint");
  const content = this.claimAndRead(file);
  if (content === null) return;

  const pipeIdx = content.trim().indexOf("|");
  if (pipeIdx === -1) return;

  const phase = parseInt(content.trim().slice(0, pipeIdx), 10);
  const description = content.trim().slice(pipeIdx + 1);

  if (!isNaN(phase)) {
    this.stateManager.addActivity(
      "system", "info",
      `Checkpoint Phase ${phase}: ${description}`,
    );
    this.emit("checkpoint", phase, description);
  }
}

private processAgents(): void {
  let entries: string[];
  try {
    entries = fs.readdirSync(this.signalsDir);
  } catch {
    return;
  }

  for (const name of entries) {
    if (!name.startsWith(".agent_")) continue;
    const agentId = name.slice(".agent_".length);
    const file = path.join(this.signalsDir, name);

    const content = this.claimAndRead(file);
    if (content === null) continue;

    const status = content.trim();
    if (status === "working" || status === "done" || status === "idle") {
      this.stateManager.setAgentStatus(agentId, status);
    }
  }
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/signal-watcher.ts
git commit -m "fix: use rename-based ownership for signal files (Critical 3-1)"
```

---

### Task 3: Runner — 좀비 프로세스 방지 (High 1-2) + spawn 실패 처리 (Medium 4-3)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts:278-285` (PID 파일 기록)
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/route.ts:57-91` (PID 기록 + spawn 실패 처리)

**Spec ref:** 분석 문서 1-2, 4-3.

- [ ] **Step 1: Runner에 PID 파일 기록 및 정리 로직 추가**

`pipeline-runner.ts`의 `main()` 시작 부분에서 PID 파일을 기록하고, 종료 시 정리한다.

```typescript
// main() 시작 부분, stateManager 생성 직후에 추가
const pidFile = path.join(PIPELINES_DIR!, PIPELINE_ID!, "runner.pid");
fs.writeFileSync(pidFile, String(process.pid));

// 종료 시 PID 파일 정리
function cleanupPid(): void {
  try { fs.unlinkSync(pidFile); } catch { /* ignore */ }
}
process.on("exit", cleanupPid);
```

- [ ] **Step 2: Dashboard spawn에서 PID 기록 및 실패 처리**

`route.ts`의 POST 핸들러에서 spawn 실패 시 state.json을 `failed`로 설정하고 에러를 반환한다.

```typescript
// Spawn pipeline-runner
const projectRoot = path.resolve(process.cwd(), "..", "..");
const runnerScript = path.resolve(
  projectRoot, ".claude-pipeline", "runner", "dist", "pipeline-runner.js",
);

let child;
try {
  child = spawn("node", [runnerScript], {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PIPELINE_ID: id,
      PIPELINES_DIR: getPipelinesDir(),
      PIPELINE_REQUIREMENTS: requirements.trim(),
    },
  });
  child.unref();
} catch (e) {
  // Runner spawn 실패 → state를 failed로 설정하고 에러 반환
  const failedState = { ...initialState, status: "failed" };
  fs.writeFileSync(
    path.join(pipelineDir, "state.json"),
    JSON.stringify(failedState, null, 2)
  );
  console.error("Failed to spawn pipeline runner:", e);
  return NextResponse.json(
    { id, status: "failed", error: "Runner 실행 실패" },
    { status: 500 },
  );
}

// PID 기록
if (child.pid) {
  fs.writeFileSync(path.join(pipelineDir, "runner.pid"), String(child.pid));
}

return NextResponse.json({ id, status: "running" }, { status: 201 });
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts \
  create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/route.ts
git commit -m "fix: record PID file and handle spawn failure (High 1-2, Medium 4-3)"
```

---

### Task 4: Runner — heartbeat + Dashboard crash detection (High 1-3)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts` (heartbeat 기록)
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/[id]/events/route.ts` (heartbeat 체크)

**Spec ref:** 분석 문서 1-3. Runner 비정상 종료 시 Dashboard가 감지 불가.

- [ ] **Step 1: Runner에 heartbeat 타이머 추가**

`main()` 함수에서 10초마다 heartbeat 파일의 mtime을 갱신하고, 종료 시 정리한다.

**주의**: Task 3에서 `process.on("exit", cleanupPid)`를 등록했다. 여기서는 이를 **교체**하여 `cleanup()` 하나로 통합한다. Task 3의 `process.on("exit", cleanupPid)` 라인을 제거하고 아래 코드로 대체한다.

```typescript
// main() 시작 부분에 추가 (Task 3의 process.on("exit", cleanupPid) 라인을 제거하고 이것으로 교체)
const heartbeatFile = path.join(PIPELINES_DIR!, PIPELINE_ID!, "heartbeat");
fs.writeFileSync(heartbeatFile, String(Date.now()));

const heartbeatTimer = setInterval(() => {
  try {
    fs.writeFileSync(heartbeatFile, String(Date.now()));
  } catch { /* ignore */ }
}, 10_000);

// PID + heartbeat 통합 정리 (Task 3의 cleanupPid를 포함)
function cleanup(): void {
  clearInterval(heartbeatTimer);
  try { fs.unlinkSync(pidFile); } catch { /* ignore */ }
  try { fs.unlinkSync(heartbeatFile); } catch { /* ignore */ }
}
process.on("exit", cleanup);
```

- [ ] **Step 2: Dashboard events SSE에서 heartbeat 체크**

`events/route.ts`의 폴링 interval에서, pipeline이 `running`/`paused` 상태이고 heartbeat이 30초 이상 갱신되지 않았으면 crash로 판정한다.

```typescript
// interval 내부, state를 읽은 후에 추가
if (state.status === "running" || state.status === "paused") {
  const heartbeatPath = path.join(pipelineDir, "heartbeat");
  try {
    const hbStat = fs.statSync(heartbeatPath);
    const staleMs = Date.now() - hbStat.mtimeMs;
    if (staleMs > 30_000) {
      // Runner가 크래시한 것으로 판정
      // state.json을 직접 수정하지 않고, 클라이언트에 알림
      writer.write("pipeline:runner_stale", {
        id,
        lastHeartbeat: hbStat.mtimeMs,
        staleMs,
      });
    }
  } catch {
    // heartbeat 파일 없음 — 구버전 runner이거나 아직 시작 안 됨
  }
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts \
  create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/\[id\]/events/route.ts
git commit -m "fix: add heartbeat for runner crash detection (High 1-3)"
```

---

### Task 5: State Manager — activities 최대 개수 제한 (High 2-2) + rename 실패 정리 (Medium 2-3) + 단일 writer 문서화 (Medium 2-1)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/state-manager.ts`

**Spec ref:** 분석 문서 2-1, 2-2, 2-3.

- [ ] **Step 1: activities 캡 적용 및 rename 실패 정리**

`update()` 메서드에 rename 실패 시 tmp 파일 정리를 추가하고, `addActivity()`에 최대 개수(200) 제한을 적용한다.

```typescript
const MAX_ACTIVITIES = 200;

export class StateManager {
  // ... 기존 필드

  /**
   * Atomic update: read → modify → write via temp file + rename.
   *
   * INVARIANT: Only ONE process should write to state.json.
   * Currently Runner and ContextWatcher share a single Node.js process,
   * and all I/O is synchronous, so the event loop serializes updates.
   * If the architecture changes to multi-process, add file locking.
   */
  update(updater: (state: PipelineState) => PipelineState): void {
    const state = this.read();
    if (!state) throw new Error(`Cannot read state: ${this.stateFile}`);

    const updated = updater(state);
    const tmpFile = path.join(this.pipelineDir, `.state.tmp.${Date.now()}`);

    fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2));
    try {
      fs.renameSync(tmpFile, this.stateFile);
    } catch (err) {
      // Clean up tmp file on rename failure
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      throw err;
    }
  }

  addActivity(agentId: string, type: Activity["type"], message: string): void {
    this.update((s) => {
      const newActivity = {
        id: crypto.randomUUID(),
        agentId,
        message,
        timestamp: new Date().toISOString(),
        type,
      };
      const activities = [...s.activities, newActivity];
      // Cap activities to prevent unbounded growth
      const trimmed = activities.length > MAX_ACTIVITIES
        ? activities.slice(activities.length - MAX_ACTIVITIES)
        : activities;
      return { ...s, activities: trimmed };
    });
  }
  // ... 나머지 메서드 동일
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 3: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/state-manager.ts
git commit -m "fix: cap activities at 200, cleanup tmp on rename fail (High 2-2, Medium 2-1, 2-3)"
```

---

### Task 6: Checkpoint — phase-aware 응답 + 원자적 쓰기 (High 3-2)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/types.ts:34-38`
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/checkpoint-waiter.ts`
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/lib/pipelines.ts:78-90`
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/[id]/checkpoint/route.ts`

**Spec ref:** 분석 문서 3-2. orphan 응답이 다음 Phase 체크포인트를 자동 승인할 수 있음.

- [ ] **Step 1: CheckpointResponse 타입에 phase 필드 추가**

Runner와 Dashboard 양쪽의 types에 `phase` 필드를 추가한다.

```typescript
// runner/src/types.ts
export interface CheckpointResponse {
  action: "approve" | "reject";
  message: string;
  timestamp: string;
  phase: number; // 추가: 이 응답이 대상으로 하는 phase 번호
}
```

- [ ] **Step 2: checkpoint-waiter에서 phase 검증 및 rename 기반 읽기**

`waitForCheckpoint()`에 `expectedPhase` 매개변수를 추가하고, 응답의 phase가 일치하지 않으면 무시한다. 또한 rename으로 소유권을 확보한 후 읽는다.

```typescript
export function waitForCheckpoint(
  pipelinesDir: string,
  pipelineId: string,
  expectedPhase: number,
  signal?: AbortSignal,
): Promise<CheckpointResponse> {
  const filePath = path.join(pipelinesDir, pipelineId, "checkpoint_response.json");
  const POLL_INTERVAL_MS = 2000;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const timer = setInterval(() => {
      try {
        if (!fs.existsSync(filePath)) return;

        // Rename to claim ownership before reading
        const claimedPath = filePath + ".processing";
        try {
          fs.renameSync(filePath, claimedPath);
        } catch {
          return; // Another process claimed it or mid-write
        }

        const raw = fs.readFileSync(claimedPath, "utf-8");
        const response = JSON.parse(raw) as CheckpointResponse;

        fs.unlinkSync(claimedPath);

        // Validate phase matches — discard orphan responses
        if (response.phase !== undefined && response.phase !== expectedPhase) {
          console.log(`[Runner] Discarding orphan checkpoint response for phase ${response.phase} (expected ${expectedPhase})`);
          return; // Ignore, wait for correct response
        }

        clearInterval(timer);
        resolve(response);
      } catch {
        // JSON parse error — clean up claimed file
        const claimedPath = filePath + ".processing";
        try { fs.unlinkSync(claimedPath); } catch { /* ignore */ }
      }
    }, POLL_INTERVAL_MS);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(new Error("Aborted"));
      }, { once: true });
    }
  });
}
```

- [ ] **Step 3: Dashboard의 writeCheckpointResponse에 원자적 쓰기 + phase 포함**

```typescript
// dashboard/src/lib/pipelines.ts
export function writeCheckpointResponse(
  pipelineId: string,
  action: string,
  message?: string,
  phase?: number,
): boolean {
  const dir = getPipelineDir(pipelineId);
  const filePath = path.join(dir, "checkpoint_response.json");
  const tmpPath = filePath + `.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify({
      action,
      message: message || "",
      phase: phase ?? -1,
      timestamp: new Date().toISOString(),
    }));
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    return false;
  }
}
```

- [ ] **Step 4: Dashboard checkpoint API에 phase 전달**

```typescript
// dashboard/src/app/api/pipelines/[id]/checkpoint/route.ts
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const state = readPipelineState(params.id);
  if (!state) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, message } = body;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Pass current phase to prevent orphan responses
  const success = writeCheckpointResponse(params.id, action, message, state.currentPhase);
  if (!success) {
    return NextResponse.json({ error: "Failed to write checkpoint response" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: pipeline-runner.ts의 waitForCheckpoint 호출에 phase 전달**

```typescript
// 기존: const response = await waitForCheckpoint(PIPELINES_DIR!, PIPELINE_ID!);
const response = await waitForCheckpoint(PIPELINES_DIR!, PIPELINE_ID!, phase);
```

- [ ] **Step 6: Dashboard의 pipeline types에도 phase 추가**

Dashboard의 `src/types/pipeline.ts`의 CheckpointResponse 관련 타입도 업데이트한다 (해당 타입이 있는 경우).

- [ ] **Step 7: 빌드 확인 (Runner + Dashboard)**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 8: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/types.ts \
  create-claude-pipeline/template/.claude-pipeline/runner/src/checkpoint-waiter.ts \
  create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts \
  create-claude-pipeline/template/.claude-pipeline/dashboard/src/lib/pipelines.ts \
  create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/\[id\]/checkpoint/route.ts
git commit -m "fix: phase-aware checkpoint with atomic write (High 3-2)"
```

---

### Task 7: SSE — 효율 개선 + 연결 누수 방지 (High 4-1, 4-2)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/[id]/events/route.ts`
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/stream/route.ts`

**Spec ref:** 분석 문서 4-1, 4-2.

- [ ] **Step 1: events/route.ts — 변경 시 activities 제외한 경량 state 전송**

`pipeline:updated` 이벤트에서 activities 배열을 제외하고 메타데이터만 전송한다. 새 activities는 이미 `pipeline:activity` 이벤트로 개별 전송하고 있으므로 중복 제거.

```typescript
// events/route.ts의 interval 내부 — state를 읽은 후
// 기존: writer.write("pipeline:updated", { id, state });

// activities를 제외한 경량 state 전송
const { activities, ...stateMeta } = state;
writer.write("pipeline:updated", { id, state: { ...stateMeta, activitiesCount: activities.length } });

// 새 activities만 개별 전송 (기존 로직 유지)
const newActivities = activities.slice(prevActivitiesCount);
for (const activity of newActivities) {
  writer.write("pipeline:activity", { id, activity });
}
prevActivitiesCount = activities.length;
```

- [ ] **Step 2: stream/route.ts — 글로벌 스트림에서 summary만 전송**

```typescript
// stream/route.ts의 interval 내부 — state를 읽은 후
// 기존: writer.write("pipeline:updated", { id: entry.name, state });

// 글로벌 스트림에서는 activities를 제외한 summary만 전송
const { activities, ...summary } = state;
writer.write("pipeline:updated", {
  id: entry.name,
  state: { ...summary, activitiesCount: activities.length },
});
```

- [ ] **Step 3: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/\[id\]/events/route.ts \
  create-claude-pipeline/template/.claude-pipeline/dashboard/src/app/api/pipelines/stream/route.ts
git commit -m "fix: SSE sends lightweight state without activities array (High 4-1, 4-2)"
```

---

### Task 8: Signal Watcher — activity/output 파일 truncate (Medium 3-3)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/signal-watcher.ts:116-167`

**Spec ref:** 분석 문서 3-3. unlink 대신 truncate로 inode를 유지하여 동시 append 소실 방지.

- [ ] **Step 1: `processActivities()`와 `processOutputs()`에서 unlink를 truncate로 교체**

```typescript
private processActivities(): void {
  const file = path.join(this.signalsDir, ".activity");
  // claimAndRead는 단일 파일용 — activity는 append 파일이므로 직접 처리
  let content: string;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return;
  }
  const lines = content.split("\n").filter(Boolean);

  for (let i = this.activityOffset; i < lines.length; i++) {
    const parts = lines[i].split("|");
    if (parts.length >= 3) {
      const agentId = parts[0].trim();
      const type = parts[1].trim() as Activity["type"];
      const message = parts.slice(2).join("|").trim();
      const validTypes = ["info", "success", "error", "progress"];
      if (validTypes.includes(type)) {
        this.stateManager.addActivity(agentId, type, message);
      }
    }
  }
  this.activityOffset = lines.length;

  // Truncate instead of unlink to preserve inode
  if (lines.length > 100) {
    try {
      fs.truncateSync(file, 0);
    } catch { /* ignore */ }
    this.activityOffset = 0;
  }
}

private processOutputs(): void {
  const file = path.join(this.signalsDir, ".output");
  let content: string;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return;
  }
  const lines = content.split("\n").filter(Boolean);

  for (let i = this.outputOffset; i < lines.length; i++) {
    const pipeIdx = lines[i].indexOf("|");
    if (pipeIdx === -1) continue;

    const filename = lines[i].slice(0, pipeIdx).trim();
    const phase = parseInt(lines[i].slice(pipeIdx + 1).trim(), 10);
    if (filename && !isNaN(phase)) {
      this.stateManager.addOutput(filename, phase);
    }
  }
  this.outputOffset = lines.length;

  if (lines.length > 100) {
    try {
      fs.truncateSync(file, 0);
    } catch { /* ignore */ }
    this.outputOffset = 0;
  }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 3: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/signal-watcher.ts
git commit -m "fix: use truncate instead of unlink for append signal files (Medium 3-3)"
```

---

### Task 9: ContextWatcher — 파일 크기 안정성 체크 + seenFiles 복원 (Medium 3-4, 3-6)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/context-watcher.ts`

**Spec ref:** 분석 문서 3-4, 3-6.

- [ ] **Step 1: seenFiles를 state.json의 기존 outputs에서 복원**

생성자에서 StateManager의 현재 outputs를 읽어 seenFiles를 초기화한다.

```typescript
constructor(
  private stateManager: StateManager,
  pipelinesDir: string,
  pipelineId: string,
) {
  this.pipelineContextDir = path.join(pipelinesDir, pipelineId, "context");
  this.rootContextDir = path.join(pipelinesDir, "..", "context");

  // Restore seenFiles from existing state outputs to prevent duplicate processing on restart
  const state = stateManager.read();
  if (state) {
    for (const output of state.outputs) {
      // output.filename is like "context/00_requirements.md"
      const basename = path.basename(output.filename);
      this.seenFiles.add(basename);
    }
  }
}
```

- [ ] **Step 2: 파일 크기 안정성 체크 — 두 번 연속 같은 크기일 때만 복사**

`handleFile()`에서 처음 발견한 파일은 크기만 기록하고, 다음 폴링에서 크기가 같으면 복사한다.

```typescript
private pendingCopies = new Map<string, number>(); // filename → last seen size

private handleFile(filename: string, sourceDir: string, isRootFallback: boolean): void {
  if (this.seenFiles.has(filename)) return;

  const filePath = path.join(sourceDir, filename);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return;
  }

  // For root fallback copies, wait for file size to stabilize
  if (isRootFallback) {
    const prevSize = this.pendingCopies.get(filename);
    if (prevSize === undefined || prevSize !== stat.size) {
      this.pendingCopies.set(filename, stat.size);
      return; // Wait for next poll to confirm stable
    }
    this.pendingCopies.delete(filename);
  }

  this.seenFiles.add(filename);

  // If found at project root, copy to pipeline context dir
  if (isRootFallback) {
    const destPath = path.join(this.pipelineContextDir, filename);
    if (!fs.existsSync(destPath)) {
      try {
        fs.copyFileSync(filePath, destPath);
      } catch {
        // Copy failed — remove from seenFiles to retry
        this.seenFiles.delete(filename);
        return;
      }
    }
  }

  // Skip state update if SignalWatcher was active recently
  if (Date.now() - this.lastSignalTime < 5000) return;

  const phase = CONTEXT_FILE_PHASES[filename];
  if (phase !== undefined) {
    this.stateManager.addOutput(`context/${filename}`, phase);
    this.stateManager.addActivity(
      "system",
      "info",
      `산출물 감지: context/${filename} (Phase ${phase})${isRootFallback ? " [루트에서 복사됨]" : ""}`,
    );
  }
}
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/context-watcher.ts
git commit -m "fix: stabilize file copy and restore seenFiles on restart (Medium 3-4, 3-6)"
```

---

### Task 10: Runner — AbortSignal 연결 + graceful shutdown (Medium 3-5, 1-4)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts`

**Spec ref:** 분석 문서 3-5, 1-4.

- [ ] **Step 1: 전역 AbortController 생성 및 signal 전달**

`main()`에서 AbortController를 생성하고, `waitForCheckpoint()`와 `runClaude()`에 signal을 전달한다. SIGTERM/SIGINT 수신 시 abort한다.

```typescript
// main() 시작 부분
const abortController = new AbortController();
const { signal } = abortController;

// SIGTERM/SIGINT 핸들러
const gracefulShutdown = (sig: string) => {
  console.log(`[Runner] ${sig} received, shutting down...`);
  abortController.abort();
  // Give 10s for cleanup before force exit
  setTimeout(() => process.exit(1), 10_000);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

- [ ] **Step 2: waitForCheckpoint와 runClaude 호출에 signal 전달**

```typescript
// waitForCheckpoint 호출 변경
const response = await waitForCheckpoint(PIPELINES_DIR!, PIPELINE_ID!, phase, signal);

// runClaude 호출 변경
const result = await runClaude(prompt, timeoutMs, signal);
```

- [ ] **Step 3: 빌드 확인**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 컴파일 성공

- [ ] **Step 4: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/src/pipeline-runner.ts
git commit -m "fix: wire AbortSignal for graceful shutdown (Medium 3-5, 1-4)"
```

---

### Task 11: Dashboard — cwd 의존성 제거 (Medium 4-4)

**Files:**
- Modify: `create-claude-pipeline/template/.claude-pipeline/dashboard/src/lib/pipelines.ts:5-7`

**Spec ref:** 분석 문서 4-4.

- [ ] **Step 1: `__dirname` 기반 fallback 경로로 변경**

```typescript
// 기존:
// const PIPELINES_DIR = process.env.PIPELINES_DIR
//   || path.resolve(process.cwd(), "..", "..", "pipelines");

// 변경: __dirname 기반 (dashboard/src/lib/ → dashboard/ → .claude-pipeline/ → project-root/)
const PIPELINES_DIR = process.env.PIPELINES_DIR
  || path.resolve(__dirname, "..", "..", "..", "..", "pipelines");
```

Next.js에서 `__dirname`은 번들링 환경에 따라 신뢰할 수 없으므로, `process.cwd()` fallback은 유지하되 경고 로그를 출력하여 사용자가 환경변수를 명시적으로 설정하도록 유도한다.

```typescript
const PIPELINES_DIR = process.env.PIPELINES_DIR
  || (() => {
    const fallback = path.resolve(process.cwd(), "..", "..", "pipelines");
    console.warn(
      `[pipelines] PIPELINES_DIR not set, using cwd-based fallback: ${fallback}. ` +
      `Set PIPELINES_DIR env var for reliable path resolution.`
    );
    return fallback;
  })();
```

- [ ] **Step 2: 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/dashboard/src/lib/pipelines.ts
git commit -m "fix: warn when PIPELINES_DIR not set, reduce cwd dependency (Medium 4-4)"
```

---

### Task 12: Runner dist 재빌드 + 최종 확인

**Files:**
- Rebuild: `create-claude-pipeline/template/.claude-pipeline/runner/dist/`

- [ ] **Step 1: Runner 전체 빌드**

Run: `cd create-claude-pipeline/template/.claude-pipeline/runner && npm run build`
Expected: 모든 .js + .d.ts 파일이 dist/에 생성

- [ ] **Step 2: dist 파일 커밋**

```bash
git add create-claude-pipeline/template/.claude-pipeline/runner/dist/
git commit -m "chore: rebuild runner dist with all stability fixes"
```

- [ ] **Step 3: 최종 git status 확인**

Run: `git status`
Expected: clean working tree

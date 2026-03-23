# Pipeline Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파이프라인 진행 상태를 모니터링하고 PM Agent와 상호작용할 수 있는 웹 대시보드 구현

**Architecture:** Next.js 14 커스텀 서버에서 `pipelines/` 디렉토리의 `state.json`을 `fs.watch`로 감시하고, WebSocket으로 브라우저에 실시간 푸시한다. REST API로 파이프라인 CRUD 및 산출물 조회를 제공한다.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, WebSocket (`ws`), `react-markdown`, `react-syntax-highlighter`

**Spec:** `docs/superpowers/specs/2026-03-23-pipeline-dashboard-design.md`

---

## File Structure

```
dashboard/
├── server.ts                          # 커스텀 서버 (Next.js + WebSocket)
├── src/
│   ├── types/
│   │   └── pipeline.ts                # 공유 타입 정의
│   ├── lib/
│   │   ├── agents.ts                  # 에이전트 메타데이터 (이모지, 색상, 순서)
│   │   ├── pipelines.ts              # 서버: 파이프라인 파일 읽기/쓰기
│   │   ├── watcher.ts                # 서버: fs.watch 래퍼 + debounce
│   │   ├── checkpoint.ts             # 서버: 체크포인트 감지/응답 로직
│   │   └── ws-server.ts             # 서버: WebSocket 서버 + 구독 관리
│   ├── hooks/
│   │   ├── use-websocket.ts          # 클라이언트: WebSocket 연결 + 재접속
│   │   ├── use-pipelines.ts          # 클라이언트: 파이프라인 목록 상태
│   │   └── use-pipeline-detail.ts    # 클라이언트: 파이프라인 상세 상태
│   ├── components/
│   │   ├── phase-dots.tsx            # Phase 미니 도트 인디케이터
│   │   ├── agent-card.tsx            # 에이전트 상태 카드
│   │   ├── agent-logs.tsx            # 에이전트별 로그 탭 + 로그 목록
│   │   ├── output-list.tsx           # 산출물 파일 목록 (Phase별 그룹)
│   │   ├── artifact-viewer.tsx       # 산출물 뷰어 (슬라이드 오버)
│   │   ├── checkpoint-banner.tsx     # 체크포인트 승인/피드백 배너
│   │   ├── resizable-panels.tsx      # 3-Panel 리사이저블 레이아웃
│   │   ├── pipeline-card.tsx         # 파이프라인 목록 카드
│   │   └── new-pipeline-modal.tsx    # 새 파이프라인 생성 모달
│   ├── app/
│   │   ├── globals.css               # 수정: 다크 테마 CSS 변수
│   │   ├── layout.tsx                # 수정: 메타데이터, 폰트
│   │   ├── page.tsx                  # 수정: 파이프라인 목록 페이지
│   │   ├── pipeline/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # 파이프라인 상세 페이지
│   │   └── api/
│   │       └── pipelines/
│   │           ├── route.ts          # GET 목록 + POST 생성
│   │           └── [id]/
│   │               ├── route.ts      # GET 상세
│   │               ├── checkpoint/
│   │               │   └── route.ts  # POST 체크포인트 응답
│   │               └── outputs/
│   │                   └── [...filepath]/
│   │                       └── route.ts  # GET 산출물 파일
├── package.json                      # 수정: 의존성 + scripts
└── tailwind.config.ts                # 수정: 테마 색상
```

---

### Task 1: 프로젝트 설정 + 타입 정의

**Files:**
- Modify: `dashboard/package.json`
- Modify: `dashboard/tailwind.config.ts`
- Modify: `dashboard/src/app/globals.css`
- Modify: `dashboard/src/app/layout.tsx`
- Create: `dashboard/src/types/pipeline.ts`
- Create: `dashboard/src/lib/agents.ts`
- Create: `dashboard/.env.example`

- [ ] **Step 1: 의존성 설치**

```bash
cd dashboard
npm install ws uuid react-markdown remark-gfm react-syntax-highlighter @tailwindcss/typography
npm install -D @types/ws @types/uuid @types/react-syntax-highlighter tsx
```

- [ ] **Step 2: 타입 정의 파일 생성**

Create `src/types/pipeline.ts`:
```typescript
export interface PipelineState {
  id: string;
  name: string;
  requirements: string;
  status: "running" | "completed" | "failed" | "paused";
  currentPhase: number;
  agents: Record<string, AgentState>;
  outputs: OutputEntry[];
  activities: Activity[];
  createdAt: string;
}

export interface AgentState {
  id: string;
  status: "idle" | "working" | "done";
  currentTask?: string;
}

export interface OutputEntry {
  filename: string;
  status: "complete";
  phase: number;
  updatedAt: string;
}

export interface Activity {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "error" | "progress";
}

export interface CheckpointInfo {
  phase: number;
  description: string;
  status: "pending" | "approved" | "rejected";
}

export interface PipelineSummary {
  id: string;
  requirements: string;
  status: PipelineState["status"];
  currentPhase: number;
  createdAt: string;
  agents: Record<string, AgentState>;
}

// WebSocket messages
export type ServerMessage =
  | { type: "pipeline:updated"; id: string; state: PipelineState }
  | { type: "pipeline:activity"; id: string; activity: Activity }
  | { type: "pipeline:checkpoint"; id: string; checkpoint: CheckpointInfo }
  | { type: "pipeline:removed"; id: string }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "subscribe:all" }
  | { type: "subscribe"; pipelineId: string }
  | { type: "unsubscribe"; pipelineId: string }
  | { type: "checkpoint:respond"; pipelineId: string; action: "approve" | "reject"; message?: string };
```

- [ ] **Step 3: 에이전트 메타데이터 생성**

Create `src/lib/agents.ts`:
```typescript
export interface AgentMeta {
  id: string;
  emoji: string;
  name: string;
  role: string;
  workingColor: string;
}

export const AGENTS: AgentMeta[] = [
  { id: "alex", emoji: "🦁", name: "Alex", role: "PM", workingColor: "#8b5cf6" },
  { id: "mina", emoji: "🦉", name: "Mina", role: "기획", workingColor: "#8b5cf6" },
  { id: "lena", emoji: "🦋", name: "Lena", role: "디자인", workingColor: "#34d399" },
  { id: "jay", emoji: "🦊", name: "Jay", role: "FE", workingColor: "#34d399" },
  { id: "sam", emoji: "🐻", name: "Sam", role: "BE", workingColor: "#34d399" },
  { id: "dex", emoji: "🐺", name: "Dex", role: "Infra", workingColor: "#34d399" },
  { id: "eva", emoji: "🐱", name: "Eva", role: "QA", workingColor: "#34d399" },
  { id: "rex", emoji: "🐍", name: "Rex", role: "보안", workingColor: "#8b5cf6" },
  { id: "nora", emoji: "🦅", name: "Nora", role: "리뷰", workingColor: "#34d399" },
];

export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

export const PHASE_NAMES = ["인풋", "기획", "설계", "구현", "QA"] as const;

export const ACTIVITY_TAG: Record<string, { label: string; color: string }> = {
  success: { label: "완료", color: "#34d399" },
  progress: { label: "진행", color: "#a5b4fc" },
  info: { label: "info", color: "#a5b4fc" },
  error: { label: "에러", color: "#ef4444" },
};
```

- [ ] **Step 4: Tailwind 테마 설정**

Modify `tailwind.config.ts` — extend colors with the dashboard theme:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: "#1f2937",
        border: "#374151",
        accent: {
          purple: "#6366f1",
          "purple-light": "#8b5cf6",
          green: "#34d399",
        },
        text: {
          primary: "#f3f4f6",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
```

- [ ] **Step 5: globals.css 다크 테마 적용**

Modify `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #111827;
  --foreground: #f3f4f6;
}

body {
  color: var(--foreground);
  background: var(--background);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #1f2937;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
```

- [ ] **Step 6: layout.tsx 수정**

Modify `src/app/layout.tsx` — 메타데이터 업데이트:
```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pipeline Dashboard",
  description: "Agent Pipeline 진행 상태 모니터링 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: .env.example 생성**

Create `dashboard/.env.example`:
```
PIPELINES_DIR=../pipelines
```

- [ ] **Step 8: 커밋**

```bash
git add src/types/ src/lib/agents.ts tailwind.config.ts src/app/globals.css src/app/layout.tsx .env.example package.json package-lock.json
git commit -m "feat: project setup with types, agents metadata, and dark theme"
```

---

### Task 2: 서버 — 파이프라인 파일 읽기 + 체크포인트 로직

**Files:**
- Create: `dashboard/src/lib/pipelines.ts`
- Create: `dashboard/src/lib/checkpoint.ts`

- [ ] **Step 1: 파이프라인 파일 읽기 모듈 생성**

Create `src/lib/pipelines.ts`:
```typescript
import fs from "fs";
import path from "path";
import type { PipelineState, PipelineSummary } from "@/types/pipeline";

const PIPELINES_DIR = process.env.PIPELINES_DIR || path.join(process.cwd(), "..", "pipelines");

export function getPipelinesDir(): string {
  return path.resolve(PIPELINES_DIR);
}

export function getPipelineDir(id: string): string {
  return path.join(getPipelinesDir(), id);
}

export function readPipelineState(id: string): PipelineState | null {
  const filePath = path.join(getPipelineDir(id), "state.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as PipelineState;
  } catch {
    return null;
  }
}

export function listPipelines(): PipelineSummary[] {
  const dir = getPipelinesDir();
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const summaries: PipelineSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const state = readPipelineState(entry.name);
    if (!state) continue;
    summaries.push({
      id: state.id,
      requirements: state.requirements,
      status: state.status,
      currentPhase: state.currentPhase,
      createdAt: state.createdAt,
      agents: state.agents,
    });
  }

  return summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function readOutputFile(pipelineId: string, filepath: string): { content: string; contentType: string } | { error: "forbidden" } | { error: "not_found" } {
  const pipelineDir = getPipelineDir(pipelineId);
  const resolved = path.resolve(pipelineDir, filepath);

  // Path traversal check
  if (!resolved.startsWith(path.resolve(pipelineDir))) {
    return { error: "forbidden" };
  }

  // Check if file is in outputs
  const state = readPipelineState(pipelineId);
  if (!state) return { error: "not_found" };

  const isRegistered = state.outputs.some((o) => o.filename === filepath);
  if (!isRegistered) return { error: "forbidden" };

  try {
    const content = fs.readFileSync(resolved, "utf-8");
    const ext = path.extname(filepath).toLowerCase();
    const contentType =
      ext === ".md" ? "text/markdown; charset=utf-8" :
      ext === ".html" ? "text/html; charset=utf-8" :
      "text/plain; charset=utf-8";
    return { content, contentType };
  } catch {
    return { error: "not_found" };
  }
}

export function writeCheckpointResponse(pipelineId: string, action: string, message?: string): boolean {
  const filePath = path.join(getPipelineDir(pipelineId), "checkpoint_response.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify({
      action,
      message: message || "",
      timestamp: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: 체크포인트 감지 모듈 생성**

Create `src/lib/checkpoint.ts`:
```typescript
import type { Activity, CheckpointInfo } from "@/types/pipeline";

export function detectCheckpoint(activities: Activity[]): CheckpointInfo | null {
  // Find the last system checkpoint message
  let lastCheckpointIdx = -1;
  let checkpointPhase = 0;
  let checkpointDesc = "";

  for (let i = activities.length - 1; i >= 0; i--) {
    const a = activities[i];
    if (a.agentId === "system" && a.message.includes("Checkpoint")) {
      if (a.message.includes("approved") || a.message.includes("rejected")) {
        // This checkpoint has already been resolved
        return null;
      }
      lastCheckpointIdx = i;
      checkpointDesc = a.message;
      // Extract phase from message like "Phase 1 complete. Checkpoint 2: ..."
      const phaseMatch = a.message.match(/Phase (\d+)/);
      if (phaseMatch) checkpointPhase = parseInt(phaseMatch[1]);
      break;
    }
  }

  if (lastCheckpointIdx === -1) return null;

  // Check if there's a later approval/rejection
  for (let i = lastCheckpointIdx + 1; i < activities.length; i++) {
    const a = activities[i];
    if (a.agentId === "system") {
      if (a.message.includes("Checkpoint approved")) return null;
      if (a.message.includes("Checkpoint rejected")) return null;
    }
  }

  return {
    phase: checkpointPhase,
    description: checkpointDesc,
    status: "pending",
  };
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/pipelines.ts src/lib/checkpoint.ts
git commit -m "feat: pipeline file reader and checkpoint detection logic"
```

---

### Task 3: 서버 — fs.watch + WebSocket 서버

**Files:**
- Create: `dashboard/src/lib/watcher.ts`
- Create: `dashboard/src/lib/ws-server.ts`
- Create: `dashboard/server.ts`
- Modify: `dashboard/package.json` (scripts)

- [ ] **Step 1: fs.watch 래퍼 생성**

Create `src/lib/watcher.ts`:
```typescript
import fs from "fs";
import path from "path";
import { getPipelinesDir, readPipelineState } from "./pipelines";
import type { PipelineState } from "@/types/pipeline";

type WatchCallback = (id: string, state: PipelineState | null) => void;

export class PipelineWatcher {
  private watchers = new Map<string, fs.FSWatcher>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private dirWatcher: fs.FSWatcher | null = null;
  private callback: WatchCallback;

  constructor(callback: WatchCallback) {
    this.callback = callback;
  }

  start() {
    const dir = getPipelinesDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Watch for new/removed pipeline directories
    this.dirWatcher = fs.watch(dir, (_, filename) => {
      if (!filename) return;
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        this.watchPipeline(filename);
      } else {
        this.unwatchPipeline(filename);
      }
    });

    // Watch existing pipelines
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        this.watchPipeline(entry.name);
      }
    }
  }

  private watchPipeline(id: string) {
    if (this.watchers.has(id)) return;

    const stateFile = path.join(getPipelinesDir(), id, "state.json");
    if (!fs.existsSync(stateFile)) return;

    try {
      const watcher = fs.watch(stateFile, () => {
        // Debounce 100ms
        const existing = this.debounceTimers.get(id);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(id, setTimeout(() => {
          this.debounceTimers.delete(id);
          const state = readPipelineState(id);
          this.callback(id, state);
        }, 100));
      });

      watcher.on("error", () => {
        this.unwatchPipeline(id);
        this.callback(id, null); // null signals removal
      });

      this.watchers.set(id, watcher);
    } catch {
      // Ignore watch errors
    }
  }

  private unwatchPipeline(id: string) {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.close();
      this.watchers.delete(id);
    }
    const timer = this.debounceTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(id);
    }
  }

  stop() {
    this.dirWatcher?.close();
    for (const [id] of this.watchers) {
      this.unwatchPipeline(id);
    }
  }
}
```

- [ ] **Step 2: WebSocket 서버 생성**

Create `src/lib/ws-server.ts`:
```typescript
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { PipelineState, ServerMessage, ClientMessage } from "@/types/pipeline";
import { PipelineWatcher } from "./watcher";
import { readPipelineState, writeCheckpointResponse, getPipelineDir } from "./pipelines";
import { detectCheckpoint } from "./checkpoint";
import fs from "fs";

interface ClientState {
  ws: WebSocket;
  mode: "none" | "all" | "single";
  pipelineId?: string;
}

export function createWSServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Map<WebSocket, ClientState>();

  // Track previous activities count per pipeline for diff
  const prevActivitiesCount = new Map<string, number>();

  const watcher = new PipelineWatcher((id, state) => {
    if (state === null) {
      // Pipeline removed
      broadcast({ type: "pipeline:removed", id }, (c) => c.mode !== "none");
      prevActivitiesCount.delete(id);
      return;
    }

    // Send updated state to subscribe:all clients
    broadcastToAll({ type: "pipeline:updated", id, state });

    // Send detailed events to per-pipeline subscribers
    const prevCount = prevActivitiesCount.get(id) || 0;
    const newActivities = state.activities.slice(prevCount);
    prevActivitiesCount.set(id, state.activities.length);

    for (const activity of newActivities) {
      broadcastToSingle(id, { type: "pipeline:activity", id, activity });
    }

    // Check for pending checkpoint
    const checkpoint = detectCheckpoint(state.activities);
    if (checkpoint) {
      broadcastToSingle(id, { type: "pipeline:checkpoint", id, checkpoint });
    }

    // Also send full state to single subscribers
    broadcastToSingle(id, { type: "pipeline:updated", id, state });
  });

  watcher.start();

  function broadcast(msg: ServerMessage, filter: (c: ClientState) => boolean) {
    const data = JSON.stringify(msg);
    for (const [, client] of clients) {
      if (client.ws.readyState === WebSocket.OPEN && filter(client)) {
        client.ws.send(data);
      }
    }
  }

  function broadcastToAll(msg: ServerMessage) {
    broadcast(msg, (c) => c.mode === "all");
  }

  function broadcastToSingle(pipelineId: string, msg: ServerMessage) {
    broadcast(msg, (c) => c.mode === "single" && c.pipelineId === pipelineId);
  }

  wss.on("connection", (ws) => {
    const clientState: ClientState = { ws, mode: "none" };
    clients.set(ws, clientState);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as ClientMessage;
        handleMessage(clientState, msg);
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  function handleMessage(client: ClientState, msg: ClientMessage) {
    switch (msg.type) {
      case "subscribe:all":
        client.mode = "all";
        client.pipelineId = undefined;
        break;

      case "subscribe": {
        const dir = getPipelineDir(msg.pipelineId);
        if (!fs.existsSync(dir)) {
          client.ws.send(JSON.stringify({ type: "error", message: "Pipeline not found" }));
          return;
        }
        client.mode = "single";
        client.pipelineId = msg.pipelineId;

        // Send initial state
        const state = readPipelineState(msg.pipelineId);
        if (state) {
          prevActivitiesCount.set(msg.pipelineId, state.activities.length);
          client.ws.send(JSON.stringify({ type: "pipeline:updated", id: msg.pipelineId, state }));
          const checkpoint = detectCheckpoint(state.activities);
          if (checkpoint) {
            client.ws.send(JSON.stringify({ type: "pipeline:checkpoint", id: msg.pipelineId, checkpoint }));
          }
        }
        break;
      }

      case "unsubscribe":
        client.mode = "none";
        client.pipelineId = undefined;
        break;

      case "checkpoint:respond": {
        writeCheckpointResponse(msg.pipelineId, msg.action, msg.message);
        break;
      }
    }
  }

  return { wss, watcher };
}
```

- [ ] **Step 3: 커스텀 서버 생성**

Create `dashboard/server.ts`:
```typescript
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createWSServer } from "./src/lib/ws-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  createWSServer(server);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

- [ ] **Step 4: package.json scripts 수정**

Modify `package.json` scripts:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "next build",
    "start": "NODE_ENV=production tsx server.ts",
    "lint": "next lint"
  }
}
```

- [ ] **Step 5: 서버 동작 확인**

```bash
npm run dev
```
Expected: `> Ready on http://localhost:3000` 출력. 기본 Next.js 페이지가 정상 로딩됨.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/watcher.ts src/lib/ws-server.ts server.ts package.json
git commit -m "feat: custom server with fs.watch and WebSocket support"
```

---

### Task 4: REST API 라우트

**Files:**
- Create: `dashboard/src/app/api/pipelines/route.ts`
- Create: `dashboard/src/app/api/pipelines/[id]/route.ts`
- Create: `dashboard/src/app/api/pipelines/[id]/checkpoint/route.ts`
- Create: `dashboard/src/app/api/pipelines/[id]/outputs/[...filepath]/route.ts`

- [ ] **Step 1: 파이프라인 목록 + 생성 API**

Create `src/app/api/pipelines/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { listPipelines, getPipelinesDir } from "@/lib/pipelines";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function GET() {
  try {
    const pipelines = listPipelines();
    return NextResponse.json({ pipelines });
  } catch {
    return NextResponse.json({ error: "Failed to read pipelines directory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requirements } = body;

    if (!requirements || !requirements.trim()) {
      return NextResponse.json({ error: "Requirements is required" }, { status: 400 });
    }

    const id = uuidv4();
    const pipelineDir = path.join(getPipelinesDir(), id);
    fs.mkdirSync(pipelineDir, { recursive: true });

    const initialState = {
      id,
      name: `Pipeline ${id.slice(0, 8)}`,
      requirements: requirements.trim(),
      status: "running",
      currentPhase: 0,
      agents: {},
      outputs: [],
      activities: [],
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(pipelineDir, "state.json"),
      JSON.stringify(initialState, null, 2)
    );

    // Spawn CLI process (fire-and-forget)
    try {
      const child = spawn("claude", [requirements.trim()], {
        cwd: path.resolve(process.cwd(), ".."),
        detached: true,
        stdio: "ignore",
        env: { ...process.env, PIPELINE_ID: id },
      });
      child.unref();
    } catch (e) {
      // CLI spawn failure is non-fatal — state.json already created
      console.error("Failed to spawn CLI:", e);
    }

    return NextResponse.json({ id, status: "running" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to start pipeline process" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 파이프라인 상세 API**

Create `src/app/api/pipelines/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { readPipelineState } from "@/lib/pipelines";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const state = readPipelineState(params.id);
  if (!state) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }
  return NextResponse.json(state);
}
```

- [ ] **Step 3: 체크포인트 응답 API**

Create `src/app/api/pipelines/[id]/checkpoint/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { readPipelineState, writeCheckpointResponse } from "@/lib/pipelines";

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

  const success = writeCheckpointResponse(params.id, action, message);
  if (!success) {
    return NextResponse.json({ error: "Failed to write checkpoint response" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: 산출물 조회 API**

Create `src/app/api/pipelines/[id]/outputs/[...filepath]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { readOutputFile } from "@/lib/pipelines";

export async function GET(_: Request, { params }: { params: { id: string; filepath: string[] } }) {
  const filepath = params.filepath.join("/");
  const result = readOutputFile(params.id, filepath);

  if ("error" in result) {
    if (result.error === "forbidden") {
      return NextResponse.json({ error: "File not registered in outputs" }, { status: 403 });
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(result.content, {
    headers: { "Content-Type": result.contentType },
  });
}
```

- [ ] **Step 5: API 테스트**

```bash
# 서버 실행 중인 상태에서
curl http://localhost:3000/api/pipelines | jq .
```
Expected: 기존 파이프라인이 있으면 목록 반환, 없으면 `{ "pipelines": [] }`

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/
git commit -m "feat: REST API routes for pipelines, checkpoints, and outputs"
```

---

### Task 5: 클라이언트 — WebSocket 훅 + 데이터 훅

**Files:**
- Create: `dashboard/src/hooks/use-websocket.ts`
- Create: `dashboard/src/hooks/use-pipelines.ts`
- Create: `dashboard/src/hooks/use-pipeline-detail.ts`

- [ ] **Step 1: WebSocket 훅 생성**

Create `src/hooks/use-websocket.ts`:
```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ServerMessage, ClientMessage } from "@/types/pipeline";

export function useWebSocket(onMessage: (msg: ServerMessage) => void, onReconnect?: () => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      const wasDisconnected = !connected;
      setConnected(true);
      reconnectDelay.current = 1000;
      // Signal reconnect so data hooks can re-fetch
      if (wasDisconnected && onReconnect) onReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        onMessage(msg);
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnection
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000);
      setTimeout(connect, delay);
    };

    wsRef.current = ws;
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
```

- [ ] **Step 2: 파이프라인 목록 훅 생성**

Create `src/hooks/use-pipelines.ts`:
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { PipelineSummary, ServerMessage } from "@/types/pipeline";
import { useWebSocket } from "./use-websocket";

export function usePipelines() {
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch("/api/pipelines");
      const data = await res.json();
      setPipelines(data.pipelines);
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "pipeline:updated") {
      setPipelines((prev) => {
        const idx = prev.findIndex((p) => p.id === msg.id);
        const summary: PipelineSummary = {
          id: msg.state.id,
          requirements: msg.state.requirements,
          status: msg.state.status,
          currentPhase: msg.state.currentPhase,
          createdAt: msg.state.createdAt,
          agents: msg.state.agents,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = summary;
          return next;
        }
        return [summary, ...prev];
      });
    } else if (msg.type === "pipeline:removed") {
      setPipelines((prev) => prev.filter((p) => p.id !== msg.id));
    }
  }, []);

  const { send, connected } = useWebSocket(handleMessage, fetchPipelines);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (connected) {
      send({ type: "subscribe:all" });
    }
  }, [connected, send]);

  return { pipelines, loading };
}
```

- [ ] **Step 3: 파이프라인 상세 훅 생성**

Create `src/hooks/use-pipeline-detail.ts`:
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { PipelineState, CheckpointInfo, ServerMessage } from "@/types/pipeline";
import { useWebSocket } from "./use-websocket";

export function usePipelineDetail(id: string) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipelines/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setPipeline(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "pipeline:updated" && msg.id === id) {
      setPipeline(msg.state);
    } else if (msg.type === "pipeline:activity" && msg.id === id) {
      setPipeline((prev) => {
        if (!prev) return prev;
        return { ...prev, activities: [...prev.activities, msg.activity] };
      });
    } else if (msg.type === "pipeline:checkpoint" && msg.id === id) {
      setCheckpoint(msg.checkpoint);
    } else if (msg.type === "pipeline:removed" && msg.id === id) {
      setNotFound(true);
    }
  }, [id]);

  const { send, connected } = useWebSocket(handleMessage, fetchPipeline);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  useEffect(() => {
    if (connected) {
      send({ type: "subscribe", pipelineId: id });
      return () => {
        send({ type: "unsubscribe", pipelineId: id });
      };
    }
  }, [connected, id, send]);

  const respondToCheckpoint = useCallback((action: "approve" | "reject", message?: string) => {
    send({ type: "checkpoint:respond", pipelineId: id, action, message });
    setCheckpoint(null);
  }, [id, send]);

  return { pipeline, checkpoint, loading, notFound, respondToCheckpoint };
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/
git commit -m "feat: WebSocket hook and data hooks for pipelines"
```

---

### Task 6: UI 컴포넌트 — 공통 + 목록 페이지

**Files:**
- Create: `dashboard/src/components/phase-dots.tsx`
- Create: `dashboard/src/components/pipeline-card.tsx`
- Create: `dashboard/src/components/new-pipeline-modal.tsx`
- Modify: `dashboard/src/app/page.tsx`

- [ ] **Step 1: Phase 미니 도트 컴포넌트**

Create `src/components/phase-dots.tsx`:
```typescript
"use client";

import { PHASE_NAMES } from "@/lib/agents";

interface PhaseDotsProp {
  currentPhase: number;
  showLabel?: boolean;
}

export function PhaseDots({ currentPhase, showLabel = false }: PhaseDotsProp) {
  return (
    <div className="flex items-center gap-[6px]">
      {PHASE_NAMES.map((name, i) => {
        const isComplete = i < currentPhase;
        const isCurrent = i === currentPhase;
        return (
          <div
            key={i}
            className={`rounded-full ${
              isCurrent
                ? "w-[10px] h-[10px] bg-accent-purple-light shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                : isComplete
                ? "w-2 h-2 bg-accent-purple"
                : "w-2 h-2 bg-border"
            }`}
            title={`P${i} ${name}`}
          />
        );
      })}
      {showLabel && (
        <span className="text-text-secondary text-[11px] ml-1">
          P{currentPhase} {PHASE_NAMES[currentPhase]}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 파이프라인 카드 컴포넌트**

Create `src/components/pipeline-card.tsx`:
```typescript
"use client";

import Link from "next/link";
import { PhaseDots } from "./phase-dots";
import { AGENT_MAP } from "@/lib/agents";
import type { PipelineSummary } from "@/types/pipeline";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PipelineCard({ pipeline }: { pipeline: PipelineSummary }) {
  const workingAgents = Object.values(pipeline.agents)
    .filter((a) => a.status === "working")
    .map((a) => AGENT_MAP[a.id]?.emoji)
    .filter(Boolean);

  const statusColor =
    pipeline.status === "running" ? "text-accent-green" :
    pipeline.status === "completed" ? "text-text-muted" :
    pipeline.status === "failed" ? "text-red-500" :
    "text-yellow-500";

  return (
    <Link href={`/pipeline/${pipeline.id}`}>
      <div className="bg-panel p-4 rounded-lg border border-border hover:border-accent-purple/50 transition-colors cursor-pointer flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] ${statusColor}`}>
              ● {pipeline.status.toUpperCase()}
            </span>
            <span className="text-text-primary text-[13px] font-medium">
              {pipeline.requirements}
            </span>
          </div>
          <div className="text-text-muted text-[11px]">
            Phase {pipeline.currentPhase}
            {workingAgents.length > 0 && ` · ${workingAgents.join("")} working`}
            {" · "}
            {timeAgo(pipeline.createdAt)}
          </div>
        </div>
        <PhaseDots currentPhase={pipeline.currentPhase} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: 새 파이프라인 모달**

Create `src/components/new-pipeline-modal.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NewPipelineModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewPipelineModal({ open, onClose }: NewPipelineModalProps) {
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirements.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: requirements.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/pipeline/${data.id}`);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panel border border-border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-text-primary text-lg font-semibold mb-4">New Pipeline</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="요구사항을 입력하세요..."
            className="w-full bg-[#111827] border border-border rounded-lg p-3 text-text-primary text-sm resize-none h-32 focus:outline-none focus:border-accent-purple"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary bg-border rounded-lg hover:bg-text-muted/30">
              취소
            </button>
            <button type="submit" disabled={!requirements.trim() || loading} className="px-4 py-2 text-sm text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-lg disabled:opacity-50">
              {loading ? "생성 중..." : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 목록 페이지 구현**

Modify `src/app/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { usePipelines } from "@/hooks/use-pipelines";
import { PipelineCard } from "@/components/pipeline-card";
import { NewPipelineModal } from "@/components/new-pipeline-modal";

export default function Home() {
  const { pipelines, loading } = usePipelines();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold bg-gradient-to-r from-accent-purple to-accent-purple-light bg-clip-text text-transparent">
          Pipeline Dashboard
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-accent-purple to-accent-purple-light text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          + New Pipeline
        </button>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-text-secondary text-center py-20">Loading...</div>
        ) : pipelines.length === 0 ? (
          <div className="text-text-secondary text-center py-20">
            아직 파이프라인이 없습니다.
            <br />
            <button onClick={() => setModalOpen(true)} className="text-accent-purple-light mt-2 hover:underline">
              + New Pipeline으로 시작하세요.
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {pipelines.map((p) => (
              <PipelineCard key={p.id} pipeline={p} />
            ))}
          </div>
        )}
      </main>

      <NewPipelineModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```
브라우저에서 `http://localhost:3000` — 파이프라인 목록 페이지 표시, 기존 파이프라인 카드 렌더링 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/components/phase-dots.tsx src/components/pipeline-card.tsx src/components/new-pipeline-modal.tsx src/app/page.tsx
git commit -m "feat: pipeline list page with cards, phase dots, and new pipeline modal"
```

---

### Task 7: UI 컴포넌트 — 상세 페이지 (3-Panel)

**Files:**
- Create: `dashboard/src/components/resizable-panels.tsx`
- Create: `dashboard/src/components/agent-card.tsx`
- Create: `dashboard/src/components/agent-logs.tsx`
- Create: `dashboard/src/components/output-list.tsx`
- Create: `dashboard/src/components/checkpoint-banner.tsx`
- Create: `dashboard/src/app/pipeline/[id]/page.tsx`

- [ ] **Step 1: 리사이저블 패널 컴포넌트**

Create `src/components/resizable-panels.tsx`:
```typescript
"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface ResizablePanelsProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

const STORAGE_KEY = "panel-sizes";
const DEFAULT_SIZES = [25, 50, 25];
const MIN_SIZES = [160, 200, 180];

export function ResizablePanels({ left, center, right }: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const dragState = useRef<{ index: number; startX: number; startSizes: number[] } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSizes(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  }, [sizes]);

  const onMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { index, startX: e.clientX, startSizes: [...sizes] };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current || !containerRef.current) return;
      const { index, startX, startSizes } = dragState.current;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaPct = ((e.clientX - startX) / containerWidth) * 100;

      const newSizes = [...startSizes];
      newSizes[index] = Math.max((MIN_SIZES[index] / containerWidth) * 100, startSizes[index] + deltaPct);
      newSizes[index + 1] = Math.max((MIN_SIZES[index + 1] / containerWidth) * 100, startSizes[index + 1] - deltaPct);

      setSizes(newSizes);
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sizes]);

  const onDoubleClick = useCallback(() => {
    setSizes(DEFAULT_SIZES);
  }, []);

  return (
    <div ref={containerRef} className="flex h-full">
      <div style={{ width: `${sizes[0]}%` }} className="overflow-y-auto">
        {left}
      </div>
      <div
        className="w-[6px] bg-panel cursor-col-resize flex items-center justify-center flex-shrink-0 hover:bg-border transition-colors"
        onMouseDown={(e) => onMouseDown(0, e)}
        onDoubleClick={onDoubleClick}
      >
        <span className="text-text-muted text-[9px] writing-mode-vertical select-none">⋮⋮</span>
      </div>
      <div style={{ width: `${sizes[1]}%` }} className="overflow-hidden flex flex-col">
        {center}
      </div>
      <div
        className="w-[6px] bg-panel cursor-col-resize flex items-center justify-center flex-shrink-0 hover:bg-border transition-colors"
        onMouseDown={(e) => onMouseDown(1, e)}
        onDoubleClick={onDoubleClick}
      >
        <span className="text-text-muted text-[9px] writing-mode-vertical select-none">⋮⋮</span>
      </div>
      <div style={{ width: `${sizes[2]}%` }} className="overflow-y-auto">
        {right}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 에이전트 카드 컴포넌트**

Create `src/components/agent-card.tsx`:
```typescript
"use client";

import { AGENTS } from "@/lib/agents";
import type { AgentState } from "@/types/pipeline";

interface AgentCardListProps {
  agents: Record<string, AgentState>;
}

export function AgentCardList({ agents }: AgentCardListProps) {
  return (
    <div className="p-3">
      <div className="text-text-secondary text-[11px] font-semibold mb-2">AGENTS</div>
      <div className="flex flex-col gap-[6px]">
        {AGENTS.map((meta) => {
          const state = agents[meta.id];
          const status = state?.status || "idle";
          const borderColor =
            status === "working" ? meta.workingColor : "#6b7280";
          const statusColor =
            status === "working" ? meta.workingColor :
            status === "done" ? "#6b7280" : "#6b7280";

          return (
            <div
              key={meta.id}
              className="bg-panel p-2 rounded-md flex justify-between items-center text-[11px]"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <span className="text-text-primary">
                {meta.emoji} {meta.name} ({meta.role})
              </span>
              <span style={{ color: statusColor }}>{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 에이전트 로그 컴포넌트**

Create `src/components/agent-logs.tsx`:
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { AGENTS, AGENT_MAP, ACTIVITY_TAG } from "@/lib/agents";
import type { Activity } from "@/types/pipeline";

interface AgentLogsProps {
  activities: Activity[];
}

export function AgentLogs({ activities }: AgentLogsProps) {
  const activeAgentIds = [...new Set(activities.map((a) => a.agentId))];
  const tabOrder = AGENTS.filter((a) => activeAgentIds.includes(a.id));
  // Always show system as first tab option if it has activities
  const allTabs = activeAgentIds.includes("system")
    ? [{ id: "system", emoji: "⚙️", name: "System" }, ...tabOrder]
    : tabOrder;

  const [selectedTab, setSelectedTab] = useState(allTabs[0]?.id || "");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = activities.filter((a) => a.agentId === selectedTab);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredLogs.length]);

  return (
    <>
      <div className="flex gap-0 border-b border-border px-3 bg-[#111827] overflow-x-auto">
        {allTabs.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedTab(agent.id)}
            className={`text-[11px] px-3 py-2 whitespace-nowrap ${
              selectedTab === agent.id
                ? "text-accent-purple-light font-semibold border-b-2 border-accent-purple-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {agent.emoji} {agent.name}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-[#0d1117] p-3 overflow-y-auto font-[family-name:var(--font-geist-mono)] text-[11px]">
        {filteredLogs.length === 0 ? (
          <div className="text-text-muted text-center py-10">아직 활동 로그가 없습니다.</div>
        ) : (
          filteredLogs.map((log) => {
            const tag = ACTIVITY_TAG[log.type] || ACTIVITY_TAG.info;
            const time = new Date(log.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={log.id} className="mb-[5px]">
                <span className="text-text-muted">{time}</span>{" "}
                <span style={{ color: tag.color }}>[{tag.label}]</span>{" "}
                <span className="text-text-primary">{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </>
  );
}
```

- [ ] **Step 4: 산출물 목록 컴포넌트**

Create `src/components/output-list.tsx`:
```typescript
"use client";

import type { OutputEntry } from "@/types/pipeline";
import { PHASE_NAMES } from "@/lib/agents";

interface OutputListProps {
  outputs: OutputEntry[];
  onSelect: (filename: string) => void;
  selected?: string;
}

export function OutputList({ outputs, onSelect, selected }: OutputListProps) {
  const grouped = outputs.reduce((acc, o) => {
    (acc[o.phase] ||= []).push(o);
    return acc;
  }, {} as Record<number, OutputEntry[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="text-text-secondary text-[11px] font-semibold">OUTPUTS</div>
      </div>
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {outputs.length === 0 ? (
          <div className="text-text-muted text-[11px] text-center py-10">아직 산출물이 없습니다.</div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([phase, files]) => (
              <div key={phase}>
                <div className="text-text-secondary text-[9px] font-semibold mt-2 mb-1">
                  PHASE {phase} {PHASE_NAMES[Number(phase)] || ""}
                </div>
                {files.map((f) => {
                  const icon = f.filename.endsWith(".html") ? "🌐" : "📄";
                  const name = f.filename.split("/").pop();
                  return (
                    <div
                      key={f.filename}
                      onClick={() => onSelect(f.filename)}
                      className={`px-2 py-1 rounded text-[11px] cursor-pointer ${
                        selected === f.filename
                          ? "bg-border text-accent-purple-light"
                          : "text-text-primary hover:bg-panel"
                      }`}
                    >
                      {icon} {name}
                    </div>
                  );
                })}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 체크포인트 배너 컴포넌트**

Create `src/components/checkpoint-banner.tsx`:
```typescript
"use client";

import { useState } from "react";
import type { CheckpointInfo } from "@/types/pipeline";

interface CheckpointBannerProps {
  checkpoint: CheckpointInfo;
  onRespond: (action: "approve" | "reject", message?: string) => void;
}

export function CheckpointBanner({ checkpoint, onRespond }: CheckpointBannerProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (showFeedback) {
    return (
      <div className="mx-4 mb-3 bg-gradient-to-r from-accent-purple/10 to-accent-purple-light/10 border border-accent-purple rounded-lg p-4">
        <div className="text-accent-purple-light text-[12px] font-semibold mb-2">피드백 작성</div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full bg-[#111827] border border-border rounded-lg p-2 text-text-primary text-sm resize-none h-20 focus:outline-none focus:border-accent-purple"
          placeholder="피드백을 입력하세요..."
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={() => setShowFeedback(false)} className="px-3 py-1 text-[11px] text-text-secondary bg-border rounded-md">
            취소
          </button>
          <button
            onClick={() => onRespond("reject", feedback)}
            className="px-3 py-1 text-[11px] text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-md"
          >
            전송
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 bg-gradient-to-r from-accent-purple/10 to-accent-purple-light/10 border border-accent-purple rounded-lg px-4 py-3 flex justify-between items-center">
      <div>
        <div className="text-accent-purple-light text-[12px] font-semibold">
          ⏳ CHECKPOINT {checkpoint.phase}
        </div>
        <div className="text-text-primary text-[12px] mt-1">{checkpoint.description}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowFeedback(true)} className="px-3 py-1 text-[11px] text-text-primary bg-border rounded-md hover:bg-text-muted/30">
          피드백
        </button>
        <button onClick={() => onRespond("approve")} className="px-3 py-1 text-[11px] text-white bg-gradient-to-r from-accent-purple to-accent-purple-light rounded-md">
          승인
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 산출물 뷰어 컴포넌트**

Create `src/components/artifact-viewer.tsx` — 이 컴포넌트는 상세 페이지에서 import되므로 먼저 생성해야 한다. Task 8의 전체 코드를 여기서 구현한다.

- [ ] **Step 7: 상세 페이지 조립**

Create `src/app/pipeline/[id]/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePipelineDetail } from "@/hooks/use-pipeline-detail";
import { PhaseDots } from "@/components/phase-dots";
import { AgentCardList } from "@/components/agent-card";
import { AgentLogs } from "@/components/agent-logs";
import { OutputList } from "@/components/output-list";
import { CheckpointBanner } from "@/components/checkpoint-banner";
import { ResizablePanels } from "@/components/resizable-panels";
import { ArtifactViewer } from "@/components/artifact-viewer";

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { pipeline, checkpoint, loading, notFound, respondToCheckpoint } = usePipelineDetail(id);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  if (loading) {
    return <div className="text-text-secondary text-center py-20">Loading...</div>;
  }

  if (notFound || !pipeline) {
    router.push("/");
    return null;
  }

  const statusColor =
    pipeline.status === "running" ? "text-accent-green" :
    pipeline.status === "completed" ? "text-text-muted" :
    pipeline.status === "failed" ? "text-red-500" :
    "text-yellow-500";

  return (
    <div className="h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex justify-between items-start">
          <button onClick={() => router.push("/")} className="text-text-secondary text-[11px] hover:text-text-primary">
            ← Back
          </button>
          <span className={`text-[11px] ${statusColor}`}>● {pipeline.status.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <h1 className="text-base font-semibold text-text-primary">{pipeline.requirements}</h1>
          <PhaseDots currentPhase={pipeline.currentPhase} showLabel />
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          left={<AgentCardList agents={pipeline.agents} />}
          center={<AgentLogs activities={pipeline.activities} />}
          right={
            <OutputList
              outputs={pipeline.outputs}
              onSelect={setSelectedOutput}
              selected={selectedOutput || undefined}
            />
          }
        />
      </div>

      {/* Checkpoint Banner */}
      {checkpoint && checkpoint.status === "pending" && (
        <CheckpointBanner checkpoint={checkpoint} onRespond={respondToCheckpoint} />
      )}

      {/* Artifact Viewer */}
      {selectedOutput && (
        <ArtifactViewer
          pipelineId={id}
          outputs={pipeline.outputs}
          selected={selectedOutput}
          onSelect={setSelectedOutput}
          onClose={() => setSelectedOutput(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 8: 커밋**

```bash
git add src/components/ src/app/pipeline/
git commit -m "feat: pipeline detail page with resizable 3-panel layout and artifact viewer"
```

---

### Task 8: 산출물 뷰어 (상세 구현)

> **Note:** `artifact-viewer.tsx` 파일은 Task 7 Step 6에서 생성됨. 이 Task는 해당 파일의 전체 코드를 구현한다.

**Files:**
- Create: `dashboard/src/components/artifact-viewer.tsx` (Task 7 Step 6에서 생성)

- [ ] **Step 1: 산출물 뷰어 컴포넌트 구현**

Write full implementation to `src/components/artifact-viewer.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { OutputEntry } from "@/types/pipeline";
import { PHASE_NAMES } from "@/lib/agents";

interface ArtifactViewerProps {
  pipelineId: string;
  outputs: OutputEntry[];
  selected: string;
  onSelect: (filename: string | null) => void;
  onClose: () => void;
}

export function ArtifactViewer({ pipelineId, outputs, selected, onSelect, onClose }: ArtifactViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/pipelines/${pipelineId}/outputs/${selected}`)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent("Failed to load file"))
      .finally(() => setLoading(false));
  }, [pipelineId, selected]);

  const ext = selected.split(".").pop()?.toLowerCase() || "";
  const isMarkdown = ext === "md";
  const isHtml = ext === "html";

  const grouped = outputs.reduce((acc, o) => {
    (acc[o.phase] ||= []).push(o);
    return acc;
  }, {} as Record<number, OutputEntry[]>);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#111827] border-l border-border flex" onClick={(e) => e.stopPropagation()}>
        {/* File list */}
        <div className="w-[200px] bg-panel border-r border-border overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-text-secondary text-[10px] font-semibold">FILES</div>
          </div>
          <div className="p-2 text-[11px]">
            {Object.entries(grouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([phase, files]) => (
                <div key={phase}>
                  <div className="text-text-secondary text-[9px] font-semibold mt-2 mb-1">
                    PHASE {phase}
                  </div>
                  {files.map((f) => {
                    const icon = f.filename.endsWith(".html") ? "🌐" : "📄";
                    const name = f.filename.split("/").pop();
                    return (
                      <div
                        key={f.filename}
                        onClick={() => onSelect(f.filename)}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          selected === f.filename
                            ? "bg-border text-accent-purple-light"
                            : "text-text-secondary hover:bg-panel"
                        }`}
                      >
                        {icon} {name}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-border">
            <div className="text-text-primary text-sm font-semibold">{selected.split("/").pop()}</div>
            <div className="flex items-center gap-2">
              {isMarkdown && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode("rendered")}
                    className={`px-2 py-1 text-[10px] rounded ${viewMode === "rendered" ? "bg-panel text-accent-purple-light" : "text-text-muted"}`}
                  >
                    Rendered
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`px-2 py-1 text-[10px] rounded ${viewMode === "raw" ? "bg-panel text-accent-purple-light" : "text-text-muted"}`}
                  >
                    Raw
                  </button>
                </div>
              )}
              <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-text-muted text-center py-10">Loading...</div>
            ) : isHtml ? (
              <iframe
                srcDoc={content}
                className="w-full h-full border-0 bg-white rounded"
                sandbox="allow-scripts"
              />
            ) : isMarkdown && viewMode === "rendered" ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const inline = !match;
                      return inline ? (
                        <code className="bg-panel px-1 py-0.5 rounded text-accent-purple-light" {...props}>
                          {children}
                        </code>
                      ) : (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      );
                    },
                  }}
                />
              </div>
            ) : (
              <SyntaxHighlighter
                style={oneDark}
                language={isMarkdown ? "markdown" : ext}
                showLineNumbers
              >
                {content}
              </SyntaxHighlighter>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 동작 확인**

```bash
npm run dev
```
브라우저에서 파이프라인 상세 → Outputs 패널에서 파일 클릭 → 슬라이드 오버 뷰어 열림 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/artifact-viewer.tsx
git commit -m "feat: artifact viewer with markdown rendering, HTML iframe, and syntax highlighting"
```

---

### Task 9: CSS 보정 + 최종 통합 테스트

**Files:**
- Modify: `dashboard/src/app/globals.css`

- [ ] **Step 1: writing-mode CSS 추가 + prose 테마 보정**

Append to `src/app/globals.css`:
```css
.writing-mode-vertical {
  writing-mode: vertical-lr;
}

/* Prose overrides for dark theme */
.prose-invert {
  --tw-prose-headings: #a5b4fc;
  --tw-prose-links: #8b5cf6;
  --tw-prose-bold: #f3f4f6;
  --tw-prose-code: #a5b4fc;
}

.prose table {
  border-collapse: collapse;
}
.prose th, .prose td {
  border: 1px solid #374151;
  padding: 6px 12px;
}
.prose th {
  background: #1f2937;
}
```

- [ ] **Step 2: 전체 플로우 통합 테스트**

```bash
npm run dev
```

테스트 시나리오:
1. `http://localhost:3000` — 파이프라인 목록 표시
2. 기존 파이프라인 카드 클릭 → 상세 페이지
3. 에이전트 패널에서 9개 에이전트 동물 이모지 + 상태 확인
4. 로그 탭 전환 → 에이전트별 로그 필터링
5. Outputs 패널에서 `.md` 파일 클릭 → 렌더링 확인
6. Outputs 패널에서 `.html` 파일 클릭 → iframe 확인
7. 패널 경계 드래그 → 리사이즈 동작
8. 패널 경계 더블클릭 → 기본 비율 리셋
9. 새로고침 후 패널 크기 유지 (localStorage)
10. Back 클릭 → 목록으로 복귀

- [ ] **Step 3: 커밋**

```bash
git add src/app/globals.css
git commit -m "feat: CSS fixes and dark theme prose overrides"
```

> **Note:** `@tailwindcss/typography`는 Task 1에서 이미 설치 및 설정됨.

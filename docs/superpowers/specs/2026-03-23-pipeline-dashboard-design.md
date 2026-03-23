# Pipeline Dashboard Design Spec

## Overview

파이프라인 진행 상태를 모니터링하고 PM Agent와 상호작용할 수 있는 웹 대시보드. 개인 개발 도구로, 인증 없이 동작한다.

## Architecture

```
Browser (Next.js App)
  ↕ WebSocket + REST API
Next.js Custom Server (Node.js)
  ↕ fs.watch
pipelines/*/state.json + context/*
```

- **스택**: Next.js 14 (App Router, TypeScript) + 커스텀 서버
- **실시간**: WebSocket (`ws` 라이브러리)
- **데이터소스**: `pipelines/` 디렉토리 직접 읽기 (`fs.watch`)
- **DB**: 없음
- **인증**: 없음 (개인 도구)
- **CLI Bridge**: `child_process.spawn`으로 Claude Code CLI 실행
- **pipelines 경로**: 환경변수 `PIPELINES_DIR`로 설정 (기본값: 프로젝트 루트의 `../pipelines` — 즉 `dashboard/`와 같은 레벨의 `pipelines/` 디렉토리)

### Data Source

기존 `state.json` 구조를 그대로 사용한다:

```typescript
interface PipelineState {
  id: string;              // UUID — URL 라우팅에 사용
  name: string;            // 자동 생성 이름 (e.g. "Pipeline 1184cea5") — 사용하지 않음
  requirements: string;    // 사용자 입력 요구사항 — 화면 타이틀로 표시
  status: "running" | "completed" | "failed" | "paused";
  currentPhase: number;    // 0~4
  agents: Record<string, AgentState>;
  outputs: OutputEntry[];
  activities: Activity[];
  createdAt: string;       // ISO 8601
}

interface AgentState {
  id: string;
  status: "idle" | "working" | "done";
  currentTask?: string;
}

interface OutputEntry {
  filename: string;        // e.g. "context/00_requirements.md"
  status: "complete";
  phase: number;
  updatedAt: string;
}

interface Activity {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "error" | "progress";
}
```

### Checkpoint

체크포인트는 `state.json`에 별도 필드로 존재하지 않는다. 대신 `activities` 배열에서 `"Checkpoint"` 키워드를 포함한 `system` 에이전트의 메시지로 감지한다:

```typescript
interface CheckpointInfo {
  phase: number;           // 해당 Phase 번호
  description: string;     // activities에서 추출한 설명
  status: "pending" | "approved" | "rejected";
}
```

서버는 `activities`를 파싱하여 마지막 체크포인트의 상태를 판단한다:
- `"Checkpoint approved"` 메시지가 있으면 → approved
- `"Checkpoint rejected"` 메시지가 있으면 → rejected
- 해당 Phase의 체크포인트 메시지 이후 승인/거절 메시지가 없으면 → pending

## Screens

### 1. Pipeline List (`/`)

- 헤더: "Pipeline Dashboard" 로고 + "+ New Pipeline" 버튼
- 파이프라인 카드 리스트:
  - 상태 인디케이터 (● RUNNING / COMPLETED)
  - 타이틀 (`requirements` 필드)
  - Phase 미니 도트 (현재 Phase 강조)
  - 활성 에이전트 동물 이모지 표시
  - 상대 시간 표시 (3h ago, 2d ago)
- "+ New Pipeline" 클릭 시 요구사항 입력 모달
- **빈 상태**: 파이프라인이 없을 때 "아직 파이프라인이 없습니다. + New Pipeline으로 시작하세요." 메시지 표시

### 2. Pipeline Detail (`/pipeline/:id`)

#### Header

- Back 링크 + 상태 인디케이터
- 타이틀 (`requirements`) + Phase 미니 도트 (현재 Phase 텍스트 라벨)

#### 3-Panel Resizable Layout

**Panel 1 — Agents (좌측)**
- 9개 에이전트 카드 (고정 순서: PM → 기획자 → 디자이너 → FE → BE → Infra → QA → 보안 → 코드리뷰)
- 동물 이모지 + 이름 + 역할
- 좌측 보더 색상으로 상태 표시:
  - `done` → 회색 (`#6b7280`)
  - `idle` → 회색 (`#6b7280`)
  - `working` → 에이전트별 색상:

| Agent ID | 이름 | working 색상 |
|----------|------|-------------|
| alex | Alex (PM) | 보라 `#8b5cf6` |
| mina | Mina (기획) | 보라 `#8b5cf6` |
| lena | Lena (디자인) | 초록 `#34d399` |
| jay | Jay (FE) | 초록 `#34d399` |
| sam | Sam (BE) | 초록 `#34d399` |
| dex | Dex (Infra) | 초록 `#34d399` |
| eva | Eva (QA) | 초록 `#34d399` |
| rex | Rex (보안) | 보라 `#8b5cf6` |
| nora | Nora (리뷰) | 초록 `#34d399` |

**Panel 2 — Agent Logs (중앙)**
- 에이전트별 탭 (동물 이모지 + 이름)
- 선택된 에이전트의 활동 로그 시간순 표시 (`activities` 배열에서 `agentId`로 필터링)
- 타임스탬프 + 상태 태그 + 메시지. 태그 매핑: `success` → [완료], `progress` → [진행], `info` → [info], `error` → [에러]
- **빈 상태**: 해당 에이전트의 로그가 없을 때 "아직 활동 로그가 없습니다." 표시

**Panel 3 — Outputs (우측)**
- Phase별 그룹핑된 산출물 파일 목록
- 클릭 시 산출물 뷰어 열림
- **빈 상태**: 산출물이 없을 때 "아직 산출물이 없습니다." 표시

**리사이즈 동작:**
- 패널 사이 드래그 핸들 (⋮⋮)
- 각 패널 최소 너비 보장 (Agents: 160px, Logs: 200px, Outputs: 180px)
- 기본 비율: 25% / 50% / 25%
- 크기 localStorage 저장
- 더블클릭 시 기본 비율 리셋

#### Checkpoint Banner

- `activities`에서 pending 체크포인트 감지 시 하단에 배너 표시
- 체크포인트 Phase 번호 + 설명
- 승인 / 피드백 버튼
- 승인 클릭 → WebSocket `checkpoint:respond` 전송
- 피드백 클릭 → 텍스트 입력 모달 → WebSocket `checkpoint:respond` 전송

### 3. Artifact Viewer (슬라이드 오버 패널)

- 좌측: 파일 목록
- 우측: 미리보기 영역
  - `.md` 파일: Markdown 렌더링 (Rendered / Raw 토글)
  - `.html` 파일: iframe 렌더링
  - 코드 파일: Syntax highlighting
- 산출물 상세 화면의 Outputs 패널에서 파일 클릭 시 열림

## Agent Characters

에이전트 목록과 표시 순서는 아래 테이블 순서를 따른다 (고정):

| # | Agent | Emoji | 이름 | 역할 |
|---|-------|-------|------|------|
| 1 | PM | 🦁 | Alex | 오케스트레이터 |
| 2 | 기획자 | 🦉 | Mina | 기획자 |
| 3 | 디자이너 | 🦋 | Lena | 디자이너 |
| 4 | FE 개발자 | 🦊 | Jay | 프론트엔드 |
| 5 | BE 개발자 | 🐻 | Sam | 백엔드 |
| 6 | 인프라 | 🐺 | Dex | 인프라 |
| 7 | QA 엔지니어 | 🐱 | Eva | QA |
| 8 | 보안 리뷰어 | 🐍 | Rex | 보안 |
| 9 | 코드 리뷰어 | 🦅 | Nora | 코드 리뷰 |

## API Design

### REST Endpoints

#### `GET /api/pipelines`

파이프라인 목록 조회. `pipelines/` 디렉토리를 스캔하여 각 하위 디렉토리의 `state.json`을 읽는다.

**Response:** `200 OK`
```json
{
  "pipelines": [
    { "id": "...", "requirements": "...", "status": "running", "currentPhase": 3, "createdAt": "..." }
  ]
}
```

**Error:** `500` — 디렉토리 읽기 실패 시 `{ "error": "Failed to read pipelines directory" }`

#### `GET /api/pipelines/:id`

파이프라인 상세 조회. `pipelines/:id/state.json` 파일을 읽어 반환한다.

**Response:** `200 OK` — `state.json` 전체 내용
**Error:**
- `404` — 해당 ID의 디렉토리 또는 state.json이 없을 때
- `500` — state.json 파싱 실패 (malformed JSON)

#### `POST /api/pipelines`

새 파이프라인 생성. CLI Bridge로 Claude Code CLI를 실행한다.

**Request:**
```json
{ "requirements": "로그인 페이지 구현" }
```

**동작:**
1. 서버가 UUID를 생성하고 `pipelines/:id/` 디렉토리를 미리 만든다.
2. 초기 `state.json`을 `{ id, requirements, status: "running", currentPhase: 0, agents: {}, outputs: [], activities: [] }` 으로 작성한다.
3. CLI 프로세스를 `child_process.spawn`으로 비동기 실행한다 (프로세스 종료를 기다리지 않음). CLI와의 통신은 `state.json`과 동일 디렉토리의 `checkpoint_response.json` 파일을 통해 이루어진다 (아래 체크포인트 응답 전달 참조).
4. 즉시 응답을 반환한다.

**Response:** `201 Created`
```json
{ "id": "...", "status": "running" }
```

**Error:**
- `400` — `requirements`가 비어있을 때
- `500` — 디렉토리 생성 또는 CLI 프로세스 시작 실패 시 `{ "error": "Failed to start pipeline process" }`

#### `POST /api/pipelines/:id/checkpoint`

체크포인트 응답. REST로도 가능하고 WebSocket으로도 가능하다. REST는 WebSocket 연결이 없을 때의 fallback.

**Request:**
```json
{ "action": "approve" | "reject", "message": "optional feedback" }
```

**Response:** `200 OK` — `{ "success": true }`
**Error:** `404` — 해당 파이프라인 없음

#### Checkpoint 응답 전달 메커니즘

REST 또는 WebSocket으로 받은 체크포인트 응답은 파일 기반으로 CLI 프로세스에 전달된다:

1. 서버가 `pipelines/:id/checkpoint_response.json`을 작성한다:
   ```json
   { "action": "approve", "message": "optional feedback", "timestamp": "..." }
   ```
2. CLI 프로세스는 체크포인트 대기 시 이 파일을 polling하여 응답을 읽는다.
3. CLI가 응답을 처리한 뒤 파일을 삭제한다.

이 방식은 CLI 프로세스 수정이 필요하지만, IPC 없이 파일 시스템만으로 통신하여 단순성을 유지한다.

#### `GET /api/pipelines/:id/outputs/*filepath`

산출물 파일 내용 조회. `*filepath`는 `context/` 이하의 경로 (e.g. `context/01_plan.md`).

**보안:**
- 파일 경로를 정규화(`path.resolve`)하여 파이프라인 디렉토리 외부 접근을 차단한다 (path traversal 방지).
- `state.json`의 `outputs` 배열에 등록된 파일만 서빙한다. 등록되지 않은 파일 요청 시 `403`.

**Response:**
- `.md` → `Content-Type: text/markdown; charset=utf-8`
- `.html` → `Content-Type: text/html; charset=utf-8`
- 기타 → `Content-Type: text/plain; charset=utf-8`

**Error:**
- `403` — outputs에 등록되지 않은 파일
- `404` — 파일이 존재하지 않음

### WebSocket (`/ws`)

**구독 방식:**
- 연결 직후에는 어떤 파이프라인에도 구독되지 않는다.
- 목록 페이지(`/`)에서는 `{ "type": "subscribe:all" }`을 전송하여 모든 파이프라인의 상태 변경을 수신한다.
- 상세 페이지에서는 `{ "type": "subscribe", "pipelineId": "..." }`로 특정 파이프라인을 구독한다 (activities 포함 상세 이벤트).
- 존재하지 않는 파이프라인 구독 시 `{ "type": "error", "message": "Pipeline not found" }` 응답.
- `unsubscribe` 수신 시 해당 파이프라인의 상세 이벤트 전송을 중단한다. 해당 파이프라인에 구독 중인 클라이언트가 0이 되면 `fs.watch` 워처는 유지하되 이벤트 브로드캐스트를 건너뛴다 (워처 자체는 다른 클라이언트의 재구독을 위해 유지).
- 클라이언트가 `subscribe:all` 상태에서 `subscribe`를 보내면, `subscribe:all`은 자동 해제되고 해당 파이프라인만 상세 구독으로 전환된다. 반대로 `subscribe:all`을 보내면 기존 개별 구독이 해제된다. 한 시점에 하나의 구독 모드만 활성화된다.

**Server → Client:**
```json
{ "type": "pipeline:updated", "id": "...", "state": { ... } }
{ "type": "pipeline:activity", "id": "...", "activity": { ... } }
{ "type": "pipeline:checkpoint", "id": "...", "checkpoint": { "phase": 1, "description": "...", "status": "pending" } }
{ "type": "pipeline:removed", "id": "..." }
{ "type": "error", "message": "..." }
```

**구독 유형별 수신 이벤트:**

| 이벤트 | `subscribe:all` (목록) | `subscribe` (상세) |
|--------|:---------------------:|:-----------------:|
| `pipeline:updated` | O | O |
| `pipeline:activity` | X | O |
| `pipeline:checkpoint` | X | O |
| `pipeline:removed` | O | O |

**Client → Server:**
```json
{ "type": "subscribe:all" }
{ "type": "subscribe", "pipelineId": "..." }
{ "type": "unsubscribe", "pipelineId": "..." }
{ "type": "checkpoint:respond", "pipelineId": "...", "action": "approve" | "reject", "message": "..." }
```

**클라이언트 재접속:**
- WebSocket 연결 끊김 시 지수 백오프(1s → 2s → 4s → 최대 30s)로 자동 재접속.
- 재접속 성공 시 REST API로 최신 상태를 한 번 fetch하여 놓친 업데이트를 보충한 뒤 다시 subscribe.

## Error Handling

### fs.watch 오류

- `state.json`이 mid-write 상태로 malformed JSON일 수 있다. 파싱 실패 시 무시하고 다음 변경 이벤트를 기다린다.
- `fs.watch`가 실패하거나 파일이 삭제되면 해당 파이프라인을 목록에서 제거하고, 구독 중인 클라이언트에게 `{ "type": "pipeline:removed", "id": "..." }` 이벤트를 전송한다.
- debounce (100ms) 적용하여 빈번한 파일 변경 시 과도한 이벤트 발생을 방지한다.

### 존재하지 않는 파이프라인

- `GET /api/pipelines/:id` → `404`
- 상세 페이지에서 404 응답 시 목록 페이지로 리다이렉트

## UI Design

### Theme

- 다크 배경 + 보라/그린 컬러 악센트 (GitHub Dark / Vercel 스타일)
- 배경: `#111827`, 패널: `#1f2937`, 보더: `#374151`
- 악센트: 보라 그라데이션 `#6366f1 → #8b5cf6`, 그린 `#34d399`
- 텍스트: `#f3f4f6` (primary), `#9ca3af` (secondary), `#6b7280` (muted)

### Phase Indicator

미니 도트 방식 (타이틀 옆 배치):
- 완료: 보라 원 (`#6366f1`)
- 진행 중: 살짝 큰 보라 원 + glow 효과 (`box-shadow`)
- 대기: 회색 원 (`#374151`)
- 현재 Phase 이름 텍스트 라벨

### Key Interactions

- 파이프라인 카드 클릭 → 상세 페이지 이동
- 에이전트 탭 클릭 → 해당 에이전트 로그 표시
- 산출물 파일 클릭 → 슬라이드 오버 뷰어
- 체크포인트 승인/피드백 → WebSocket으로 PM에 전달
- 패널 경계 드래그 → 크기 조절
- "+ New Pipeline" → 요구사항 입력 → CLI Bridge로 실행

## Feature Summary

1. 파이프라인 목록 조회 + 상태 표시
2. 파이프라인 상세 — Phase 도트, 에이전트 상태, 로그, 산출물
3. 대시보드에서 새 파이프라인 시작 (CLI Bridge)
4. 체크포인트 승인/거절/피드백 전달
5. WebSocket 실시간 상태 업데이트
6. 산출물 뷰어 — Markdown 렌더링 + HTML iframe + 코드 하이라이팅
7. 리사이저블 3-Panel 레이아웃 (크기 localStorage 저장)
8. 에이전트별 로그 분리 탭
9. 다크 + 보라/그린 악센트 테마

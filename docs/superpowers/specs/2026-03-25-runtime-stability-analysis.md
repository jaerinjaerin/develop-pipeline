# Runtime Stability Analysis: create-claude-pipeline

설치 후 운영 단계에서 Dashboard/Runner가 실제 프로젝트 내에서 동작할 때 발생할 수 있는 기술적 안정성 문제를 컴포넌트별로 분석한 문서.

## 분석 범위

- **대상**: Runner, State Manager, Signal/File IPC, Dashboard
- **관점**: 프로세스 크래시, 파일 경쟁 조건, 리소스 누수, 데이터 무결성
- **제외**: 설치 과정 호환성, 다양한 프로젝트 구조와의 공존 문제

---

## 요약

| 심각도 | 건수 | 핵심 키워드 |
|--------|------|------------|
| Critical | 2 | 시그널 TOCTOU, CLI 무한 블로킹 |
| High | 5 | 좀비 프로세스, 건강 모니터링 없음, activities 무한 성장, checkpoint orphan 응답, SSE 누수/비효율 |
| Medium | 9 | state.json 미래 경쟁 위험, 재시도 덮어쓰기, 깨진 JSON, offset 불일치, 불완전 파일 복사, 경로 의존, spawn 에러 무시, AbortSignal 미연결, seenFiles 비영속 |

---

## 1. Runner (pipeline-runner.ts)

### 1-1. Claude CLI 프로세스에 타임아웃 없음 — Critical

**파일**: `runner/src/pipeline-runner.ts:37-69`

`runClaude()`가 `spawn("claude", ["-p", prompt])`를 실행하지만 타임아웃이 없다. Claude CLI가 응답하지 않거나 무한히 길어지면 파이프라인이 영원히 블로킹된다.

**영향**: 파이프라인 영구 hang, 사용자가 수동 kill 외에 복구 방법 없음

**개선 방향**: child process에 최대 실행 시간을 설정하고, 초과 시 SIGTERM → SIGKILL 시퀀스로 정리. Phase별로 적절한 타임아웃 차등 적용 (Phase 3 구현은 더 길게).

### 1-2. 좀비 Runner 프로세스 — High

**파일**: `dashboard/src/app/api/pipelines/route.ts:71-82`

Dashboard API에서 Runner를 `detached: true, stdio: "ignore"`로 spawn하고 `child.unref()`한다. Dashboard가 크래시하면:
- Runner는 계속 실행되지만 제어 불가
- PID를 기록하지 않으므로 어떤 프로세스가 어떤 파이프라인인지 추적 불가
- 사용자가 수동으로 `kill`해야 함

**개선 방향**: PID를 `pipelines/{id}/runner.pid`에 기록. Dashboard 재시작 시 기존 runner 프로세스 존재 여부 확인. 파이프라인 삭제/취소 시 PID 기반 정리.

### 1-3. Runner 건강 상태 모니터링 없음 — High

**파일**: `dashboard/src/app/api/pipelines/route.ts:71-85`

Runner가 비정상 종료(OOM, segfault 등)해도 Dashboard는 알 방법이 없다. `state.json`의 status가 `"running"`으로 남아있고, 사용자에게 파이프라인이 영원히 "진행 중"으로 보인다.

**개선 방향**: Runner가 heartbeat 파일(`pipelines/{id}/heartbeat`)을 주기적으로 갱신. Dashboard가 heartbeat 파일의 mtime을 체크하여 일정 시간(예: 30초) 이상 갱신 없으면 "crashed" 상태로 전환.

### 1-4. 재시도 시 이전 산출물 덮어쓰기 — Medium

**파일**: `runner/src/pipeline-runner.ts:327-329`

체크포인트 reject 후 재시도할 때, 같은 Phase의 prompt를 다시 Claude에 보내지만, Claude가 기존 파일을 읽고 이전 내용 위에 수정하는지, 새로 쓰는지 보장하지 않는다. `expectedFiles`가 이미 존재하는 상태에서 재실행되므로 예측 불가능한 결과가 나올 수 있다.

**개선 방향**: 재시도 전에 기존 산출물을 백업(`{filename}.bak.{attempt}`)하거나, 프롬프트에 "기존 파일을 덮어써서 새로 작성하라"는 명시적 지시 추가.

---

## 2. State Manager (state-manager.ts)

### 2-1. state.json 동시 쓰기 — 현재 Medium (잠재적 Critical)

**파일**: `runner/src/state-manager.ts:25-33`

StateManager의 `update()` 메서드는 read → modify → write 패턴이다.

**현재 상태**: Runner와 ContextWatcher는 동일한 Node.js 프로세스에서 실행되며, `update()`는 `readFileSync`/`writeFileSync`로 완전 동기적이다. Node.js 이벤트 루프는 단일 스레드이므로, 현재 아키텍처에서는 두 호출이 인터리브되지 않는다 — **현재는 안전하다.**

**미래 위험**: 그러나 이 설계는 다음 변경 시 즉시 깨진다:
- Runner를 별도 프로세스로 분리할 때
- 비동기 파일 I/O(`readFile`/`writeFile`)로 전환할 때
- 외부 프로세스(예: Dashboard)가 state.json에 직접 쓸 때

```
Process A: read(v1) → modify → write(v2)
Process B:     read(v1) → modify → write(v3)  ← v2의 변경사항 소실
```

**영향 (미래)**: 활동 로그 소실, 출력 파일 등록 누락, 상태 롤백

**개선 방향**: 아키텍처 변경 시를 대비하여 업데이트 큐 또는 파일 잠금을 미리 도입하거나, 최소한 "단일 프로세스만 state.json에 쓴다"는 불변 조건을 문서화

### 2-2. activities 배열 무한 성장 — High

**파일**: `runner/src/state-manager.ts:54-68`

`addActivity()`가 호출될 때마다 activities 배열에 누적된다. 긴 파이프라인에서:
- state.json 파일 크기가 수 MB까지 커질 수 있음
- SSE 폴링이 매번 전체 state를 JSON.parse/stringify → CPU 비용 선형 증가
- 브라우저로 전송되는 데이터량도 비례 증가

**개선 방향**: activities에 최대 개수 제한(예: 최근 200개만 유지, 나머지는 별도 로그 파일로 이동). 또는 activities를 state.json에서 분리하여 `activities.jsonl`(append-only)로 관리.

### 2-3. 디스크 공간 부족 시 state 소실 — Medium

**파일**: `runner/src/state-manager.ts:30-33`

`writeFileSync(tmpFile, ...)` 후 `renameSync(tmpFile, stateFile)` 패턴에서, 디스크 공간 부족 시 tmp 파일 쓰기가 실패하면 예외가 발생하지만 원본은 유지된다(안전). 하지만 tmp 쓰기는 성공했으나 rename이 실패하면(크로스 디바이스 등) tmp 파일만 남고 원본은 변경되지 않아 불일치가 생길 수 있다.

**개선 방향**: try-catch로 rename 실패 시 tmp 파일 정리. 같은 파티션 내 tmp 파일 경로를 보장.

---

## 3. Signal/File IPC

### 3-1. 시그널 파일 TOCTOU 경쟁 — Critical

**파일**: `runner/src/signal-watcher.ts:52-63, 91-113`

SignalWatcher의 모든 처리가 `existsSync → readFileSync → unlinkSync` 패턴이다. 이 세 단계 사이에:

```
SignalWatcher:  existsSync(.phase)=true → readFileSync → unlinkSync
Claude CLI:                  동시에 .phase 파일 새로 쓰기 시도
```

- Claude가 쓰는 도중에 읽으면 불완전한 내용 (잘린 숫자, 깨진 UTF-8)
- 읽은 직후 Claude가 새 시그널을 썼는데 unlink하면 새 시그널 소실

**영향**: Phase 전환 누락, 체크포인트 시그널 소실

**개선 방향**:
- 시그널 파일을 "쓰기 → rename" 패턴으로 원자적 생성 (Claude 프롬프트에 지시)
- 또는 읽기 전에 rename으로 소유권을 먼저 가져온 후 읽기 (`rename(.phase, .phase.processing) → read → unlink`)

### 3-2. checkpoint_response.json 부분 읽기 및 orphan 응답 — High

**파일**: `runner/src/checkpoint-waiter.ts:27-34`, `dashboard/src/lib/pipelines.ts:78-89`

두 가지 문제가 있다:

**문제 1 — 부분 읽기**: Dashboard의 `writeCheckpointResponse()`가 `writeFileSync`로 직접 쓴다 (tmp+rename 패턴 아님). Runner가 쓰기 도중 파일을 읽으면 `JSON.parse` 실패. catch로 무시하고 다음 2초 폴링에서 재시도하므로 대부분 복구되지만, 쓰기와 읽기 타이밍이 반복적으로 겹치면 응답 지연이 누적된다.

**문제 2 — orphan 응답**: Runner가 checkpoint_response.json을 읽고 삭제한 뒤 다음 Phase로 진행한다. 이 시점에 사용자가 Dashboard에서 실수로 다시 "승인"을 클릭하면, 새 checkpoint_response.json이 생성된다. 이 파일은 **다음 Phase의 `waitForCheckpoint()` 호출에서 즉시 소비**되어, 사용자가 실제로 검토하지 않은 체크포인트가 자동 승인되는 결과를 낳는다.

**개선 방향**:
- Dashboard도 tmp + rename 패턴으로 원자적 쓰기
- Runner는 rename으로 소유권 확보 후 읽기
- checkpoint_response.json에 대상 phase 번호를 포함하여, Runner가 현재 phase와 일치하지 않는 응답은 무시

### 3-3. .activity 파일 offset 불일치 — Medium

**파일**: `runner/src/signal-watcher.ts:116-141`

`.activity` 파일을 append 방식으로 사용하고, `activityOffset`으로 처리 위치를 추적한다. 100줄 초과 시 파일을 삭제하고 offset을 0으로 리셋한다.

삭제와 Claude의 append가 동시에 일어나면:
1. SignalWatcher: `unlinkSync(.activity)`
2. Claude CLI: `appendFileSync(.activity, "새 줄")` → 새 파일 생성
3. SignalWatcher: 다음 폴링에서 offset=0으로 읽음 → **정상**

하지만 순서가 뒤바뀌면:
1. Claude CLI: `appendFileSync` 시작 (파일 핸들 획득)
2. SignalWatcher: `unlinkSync` → inode 삭제 (Claude는 이전 핸들로 계속 쓰기)
3. Claude의 쓰기 완료 → 삭제된 inode에 써짐 → **데이터 소실**

**개선 방향**: 삭제 대신 truncate 사용. 또는 파일명에 시퀀스 번호를 붙여 로테이션.

### 3-4. ContextWatcher 불완전 파일 복사 — Medium

**파일**: `runner/src/context-watcher.ts:104-113`

`copyFileSync`로 루트 context 파일을 파이프라인 디렉토리로 복사한다. Claude가 아직 파일을 쓰고 있는 중에 복사가 발생하면 잘린 파일이 파이프라인 디렉토리에 들어간다. `seenFiles`에 이미 등록되므로 다시 복사하지 않는다 — 불완전한 파일이 영구적으로 남는다.

**개선 방향**: 파일 크기가 안정화될 때까지 대기 (두 번 연속 같은 크기면 복사). 또는 복사 후 원본과 크기 비교하여 불일치 시 `seenFiles`에서 제거.

### 3-5. waitForCheckpoint에 AbortSignal 미연결 — Medium

**파일**: `runner/src/pipeline-runner.ts:367`, `runner/src/checkpoint-waiter.ts:10-12`

`waitForCheckpoint()`는 선택적 `signal?: AbortSignal` 매개변수를 받아 취소를 지원한다. 그러나 `pipeline-runner.ts`에서 호출할 때 signal을 전달하지 않는다:

```typescript
const response = await waitForCheckpoint(PIPELINES_DIR!, PIPELINE_ID!);
// signal 미전달
```

Runner 프로세스가 외부에서 kill되거나 비정상 종료될 때, `waitForCheckpoint` 내부의 `setInterval`이 정리되지 않고 계속 실행된다. Node.js는 활성 timer가 있으면 프로세스를 종료하지 않으므로, SIGTERM을 받아도 즉시 종료되지 않을 수 있다.

**개선 방향**: `AbortController`를 생성하여 signal을 전달하고, `process.on("SIGTERM")`에서 `controller.abort()`를 호출.

### 3-6. ContextWatcher seenFiles가 재시작 시 초기화 — Medium

**파일**: `runner/src/context-watcher.ts:33`

`seenFiles`는 인메모리 `Set`이다. Runner 프로세스가 크래시 후 재시작되면 (미래에 supervisor 도입 시), 이전에 이미 처리한 context 파일을 모두 다시 감지하여:
- `addOutput()` 중복 호출 (state.json의 outputs 배열에 같은 파일이 다시 추가 시도 — `addOutput`에서 중복 체크하므로 데이터 중복은 없음)
- `addActivity()` 중복 호출 → **활동 로그에 "산출물 감지: ..." 메시지가 중복 생성**됨

**개선 방향**: `seenFiles` 목록을 파일(`pipelines/{id}/seen_files.json`)로 영속화하거나, state.json의 기존 outputs 목록에서 초기 seenFiles를 복원.

---

## 4. Dashboard (Next.js SSE + API)

### 4-1. SSE 연결/interval 누수 — High

**파일**: `dashboard/src/app/api/pipelines/stream/route.ts:23-65`, `events/route.ts:41-77`

`setInterval`로 폴링하면서 SSE 스트림을 유지한다. 클라이언트가 비정상 종료(브라우저 탭 강제 닫기, 네트워크 끊김)될 때:
- `signal.aborted`가 트리거되기까지 지연 발생 가능
- 그 사이 interval은 계속 실행되며 fs 접근을 반복
- 여러 탭을 열고 닫기를 반복하면 interval이 누적

**개선 방향**: interval 내부에서 writer.write 실패(연결 끊김)를 감지하여 즉시 interval 정리. 또는 SSE heartbeat를 보내고 실패 시 정리.

### 4-2. SSE가 매번 전체 state 전송 — High

**파일**: `dashboard/src/app/api/pipelines/[id]/events/route.ts:56`, `dashboard/src/app/api/pipelines/stream/route.ts:47`

**두 개의 SSE 엔드포인트 모두** 같은 문제를 가진다:

- **개별 파이프라인 스트림** (`events/route.ts`): 500ms마다 state.json이 변경되면 전체 PipelineState를 전송
- **글로벌 파이프라인 목록 스트림** (`stream/route.ts`): 1초마다 모든 파이프라인의 state.json을 스캔하고, 변경된 파이프라인마다 전체 state를 전송

activities 배열이 커지면:
- 매 폴링마다 수십~수백 KB 전송
- 글로벌 스트림에서는 활성 파이프라인 수 × state 크기만큼 burst 전송
- 장기 실행 시 브라우저 메모리와 네트워크 불필요 소모

**개선 방향**: delta 방식으로 변경분만 전송. 또는 activities를 별도 이벤트로 분리하여 새 activity만 스트리밍 (이미 `pipeline:activity` 이벤트가 있으나 `pipeline:updated`에도 전체가 포함됨). 글로벌 스트림에서는 summary만 전송하고 activities를 제외.

### 4-3. Runner spawn 실패를 클라이언트에 알리지 않음 — Medium

**파일**: `dashboard/src/app/api/pipelines/route.ts:83-87`

Runner spawn 실패를 `console.error`만 하고 클라이언트에는 `201 Created`를 반환한다:

```typescript
} catch (e) {
  console.error("Failed to spawn pipeline runner:", e);
}
return NextResponse.json({ id, status: "running" }, { status: 201 });
```

**영향**: 사용자는 파이프라인이 성공적으로 생성됐다고 보지만, Runner가 시작되지 않아 영원히 진행되지 않음

**개선 방향**: spawn을 try-catch 밖으로 이동하거나, 실패 시 state.json을 `"failed"`로 설정하고 에러 응답 반환.

### 4-4. process.cwd() 경로 의존 — Medium

**파일**: `dashboard/src/lib/pipelines.ts:7`, `dashboard/src/app/api/pipelines/route.ts:62`

`process.cwd()`가 `.claude-pipeline/dashboard/`라고 가정하고 상대 경로를 계산한다:

```typescript
path.resolve(process.cwd(), "..", "..", "pipelines");  // pipelines.ts
path.resolve(process.cwd(), "..", "..");                // route.ts
```

`PIPELINES_DIR` 환경변수가 설정되면 괜찮지만, 미설정 시 대시보드를 어디서 실행하느냐에 따라 완전히 다른 디렉토리를 참조한다.

**개선 방향**: `PIPELINES_DIR`을 필수 환경변수로 만들거나, `__dirname` 기반으로 경로를 결정하여 cwd 의존성 제거.

---

## 컴포넌트 간 상호작용 문제

위 개별 문제들이 결합되면 더 심각한 시나리오가 발생한다:

### 시나리오 A: 파이프라인 영구 hang

1. Claude CLI가 Phase 3에서 무한 대기 (1-1)
2. Runner에 타임아웃 없으므로 영원히 블로킹
3. Dashboard는 Runner 건강 체크를 하지 않으므로 (1-3) 이상 감지 불가
4. 사용자가 브라우저에서 파이프라인을 "취소"할 수 있는 방법도 없음
5. PID 기록이 없어 (1-2) 수동 kill도 어려움

### 시나리오 B: 상태 데이터 부패 (미래 위험)

현재 Runner와 ContextWatcher는 동일 프로세스에서 동기 I/O를 사용하므로 이벤트 루프가 직렬화한다. 하지만 아키텍처가 다음과 같이 변경되면:

1. Runner가 별도 프로세스로 분리됨
2. Runner 프로세스가 `setPhase(2)` 호출 (read v1 → modify → write v2)
3. 동시에 ContextWatcher 프로세스가 `addOutput()` 호출 (read v1 → modify → write v3)
4. v2의 phase 변경이 소실됨
5. Dashboard SSE가 이 불일치 상태를 전체 전송 (4-2)
6. 사용자에게 잘못된 Phase 정보가 보임

(2-1)에서 설명한 대로 현재는 안전하나, 프로세스 분리 시 즉시 발현된다.

### 시나리오 C: 체크포인트 orphan 응답으로 자동 승인

1. Phase 1 체크포인트에서 사용자가 "승인" 클릭 → Runner가 읽고 삭제 → Phase 2 실행 시작
2. 사용자가 UI 반응 지연으로 "승인"을 한 번 더 클릭 → 새 `checkpoint_response.json` 생성
3. Phase 2 완료 후 Runner가 `waitForCheckpoint()` 호출
4. orphan 파일이 즉시 감지됨 → Phase 2 체크포인트가 사용자 검토 없이 자동 승인 (3-2)
5. 검토되지 않은 설계 명세가 그대로 Phase 3 구현에 투입됨

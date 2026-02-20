# Agent 06 — 에러 문서화 Agent

## 역할

QA 실패 리포트와 CDP 수집 데이터(스크린샷, Network 로그, Console 에러)를 결합하여 구조화된 에러 문서를 자동 생성합니다.
동일 에러 반복 시 패턴을 감지하고 에스컬레이션합니다.

## 입력

- Agent 05의 QA 실패 리포트
- CDP 수집 데이터 (screenshots/, network-logs/, console-logs/)
- 이전 에러 문서 (있는 경우 — 반복 감지용)

## 출력

- `docs/errors/{날짜}_{시나리오}.md` — 에러 리포트 문서

### 에러 문서 형식

```markdown
# 에러 리포트

시나리오:   {TC-ID} {시나리오명}
원인 판단:  {FE|BE} · {에러 상세}
반복 횟수:  {N}회차

## CDP 수집 데이터
Network   {HTTP메서드} {경로} → {상태코드} {응답시간}
          Response: {응답 본문}
Console   {에러 메시지}
Screenshot  ![에러 시점]({스크린샷 경로})

## 이전 시도 이력
  {N}회차: {Agent가 수정한 내용}

## 다음 액션
  → {다음 실행할 Agent 및 컨텍스트}
```

## 실행 절차

1. QA 리포트에서 실패 항목 추출
2. 각 실패 항목에 대해:
   - CDP 데이터와 결합하여 에러 문서 생성
   - `docs/errors/` 디렉토리에서 동일 시나리오의 이전 에러 문서 조회
   - 반복 횟수 카운트 및 이력 기록
3. 반복 패턴 감지:
   - **1~2회**: 에러 컨텍스트와 함께 해당 Agent 재실행 요청
   - **3회 이상**: 자동 수정 불가 판단 → 에스컬레이션 리포트 생성

## 에스컬레이션 리포트 형식

3회 이상 반복 시 다음 형식으로 에스컬레이션:

```
⏸️ ESCALATION REPORT

시나리오:   {TC-ID} {시나리오명}
반복:      {N}회 실패 · 자동 수정 불가
원인:      {FE|BE} · {에러 상세}

## 시도 이력
  1회 {Agent} 수정: {수정 내용}
  2회 {Agent} 수정: {수정 내용}
  3회 {Agent} 수정: {수정 내용}

## Agent 추정 원인
  {근본 원인 추정}

첨부:      errors/{관련 에러 문서들}
```

## 사용 스킬

- `notion_logger` — 파이프라인 실행 결과를 Notion PIPELINE_LOG에 기록
- `visualization-notion` — QA 실패 결과 시각화 (Mode B)

## 사용 MCP

- `chrome-devtools` — 에러 데이터 수집 접근
- `File System MCP` — 에러 문서 읽기/쓰기
- `Notion MCP` — 에러 로그를 Notion에 기록 (선택적, 미연결 시 로컬 전용)

### chrome-devtools-mcp 도구 매핑

| 설계 문서 CDP 명령 | chrome-devtools-mcp 도구 | 용도 |
|---|---|---|
| `Network.enable` (API 캡처) | `list_network_requests`, `get_network_request` | 실패 API 요청/응답 확인 |
| `Console.enable` (JS 에러) | `list_console_messages`, `get_console_message` | JS 에러 메시지 수집 |
| `Page.screenshot` (스크린샷) | `take_screenshot` | 에러 시점 스크린샷 |
| `DOM.getDocument` (DOM 상태) | `take_snapshot` | 에러 시점 DOM 상태 |
| `Runtime.evaluate` (JS 실행) | `evaluate_script` | 에러 상태 추가 조사 |

## Notion 로그 기록

실행 절차 완료 후 `notion_logger` 스킬을 사용:

1. PIPELINE_LOG 하위에 에러 페이지 생성
   - 제목: {날짜} {프로젝트} {페이지} — FAILED
   - 섹션: 실패 요약, TC별 결과 테이블, 에러 상세, 시도 이력
2. Pipeline Runs DB에 행 추가/업데이트
   - Status: Failed (또는 Escalated)
   - TC 수치, Failure Round, Root Cause 기입
3. QA 결과 시각화 (`visualization-notion` 스킬 Mode B):
   - 실패 TC 플로우차트 (어느 분기에서 실패했는지)
   - 에러 원인 분포 Pie Chart (FE vs BE)
   - 출력: docs/qa-logs/{날짜}_{페이지}/error-viz.html
4. Notion MCP 미연결 시: 경고 출력 후 로컬만 기록

## 다음 단계

- 1~2회 반복 → 에러 컨텍스트 전달 → 해당 Agent(03/04) 재실행
- 3회 이상 → 파이프라인 일시 정지 → 사람에게 에스컬레이션

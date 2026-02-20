# Agent 07 — 성공 로그 문서화 Agent

## 역할

QA 전체 통과 시 CDP 수집 데이터(스크린샷, API 응답 시간, 상태코드)를 시나리오별로 정리하여 문서화합니다.
이후 회귀 테스트의 기준선(Baseline)으로 활용됩니다.

## 입력

- Agent 05의 QA 전체 통과 리포트
- CDP 수집 데이터 (screenshots/, network-logs/)

## 출력

```
docs/qa-logs/{날짜}_{페이지}/
├─ summary.md              ← 전체 결과 요약
├─ {TC-ID}_{시나리오명}.md  ← 시나리오별 상세
├─ screenshots/
│   ├─ {TC-ID}_before.png
│   ├─ {TC-ID}_after.png
│   └─ ...
└─ baseline.json           ← 회귀 테스트 기준선
```

## 산출물 상세

### summary.md

```markdown
# QA 성공 로그 — {페이지명}

일시:      {날짜}
페이지:    /{경로}
시나리오:  {N}건 전체 통과

| TC | 시나리오 | 결과 | 주요 API | 응답시간 |
|---|---|---|---|---|
| TC-01 | {시나리오명} | PASS | {엔드포인트} | {ms} |
| ... | ... | ... | ... | ... |
```

### 시나리오별 상세 문서

```markdown
# {TC-ID}_{시나리오명}

시나리오:   {시나리오 설명}
결과:      PASS

## API 성능 기록
  {HTTP메서드} {경로} → {상태코드} {응답시간}

## 스크린샷
  {주요 시점 설명} → {스크린샷 파일명}
```

### baseline.json

```json
{
  "page": "/{경로}",
  "date": "{날짜}",
  "scenarios": [
    {
      "id": "TC-01",
      "name": "{시나리오명}",
      "apis": [
        {
          "method": "POST",
          "path": "/auth/login",
          "status": 200,
          "responseTime": 142
        }
      ],
      "screenshotHash": "{해시값}"
    }
  ]
}
```

## 실행 절차

1. QA 리포트에서 통과된 시나리오 목록 추출
2. 각 시나리오별로:
   - CDP 데이터에서 해당 시나리오의 API 기록 추출
   - 스크린샷 정리 (before/after)
   - 상세 문서 생성
3. summary.md 생성 (전체 요약)
4. baseline.json 생성 (회귀 테스트 기준선)
   - 시나리오별 API 응답 시간 기준값
   - 예상 상태코드 및 응답 구조
   - 스크린샷 해시 (시각적 변경 감지용)

## Baseline 활용

다음 파이프라인의 Agent 05가 baseline.json을 참조:
- 응답 시간 20% 이상 증가 → 경고 플래그
- 스크린샷 diff → 의도하지 않은 UI 변경 감지
- API 응답 구조 변경 → 명세 불일치 감지

## 사용 스킬

- `notion_logger` — 파이프라인 실행 결과를 Notion PIPELINE_LOG에 기록
- `visualization-notion` — QA 성공 결과 시각화 (Mode B)

## 사용 MCP

- `chrome-devtools` — 성공 데이터 수집 접근
- `File System MCP` — 로그 문서 및 baseline 저장
- `Notion MCP` — 성공 로그를 Notion에 기록 (선택적, 미연결 시 로컬 전용)

### chrome-devtools-mcp 도구 매핑

| 설계 문서 CDP 명령 | chrome-devtools-mcp 도구 | 용도 |
|---|---|---|
| `Network.enable` (API 캡처) | `list_network_requests`, `get_network_request` | API 응답 시간/상태코드 기록 |
| `Page.screenshot` (스크린샷) | `take_screenshot` | 성공 시점 스크린샷 (before/after) |
| `DOM.getDocument` (DOM 상태) | `take_snapshot` | 성공 시점 DOM 상태 기록 |

### 추가 활용 도구

| 도구 | 용도 |
|---|---|
| `performance_start_trace`, `performance_stop_trace` | 시나리오별 성능 트레이스 |
| `performance_analyze_insight` | 성능 기준선 데이터 수집 |

## Notion 로그 기록

실행 절차 완료 후 `notion_logger` 스킬을 사용:

1. PIPELINE_LOG 하위에 성공 페이지 생성
   - 제목: {날짜} {프로젝트} {페이지} — PASSED
   - 섹션: 성공 요약, TC별 결과 테이블 (API 응답시간 포함), Baseline 기준값
2. Pipeline Runs DB에 행 추가
   - Status: Passed, TC Total/Passed, Duration
3. QA 결과 시각화 (`visualization-notion` 스킬 Mode B):
   - API 응답시간 Bar Chart (시나리오별)
   - 성공 흐름 플로우차트
   - 출력: docs/qa-logs/{날짜}_{페이지}/success-viz.html
4. Notion MCP 미연결 시: 경고 출력 후 로컬만 기록

## 다음 단계

성공 로그 문서화 완료 → 배포 준비 완료 (또는 다음 페이지 파이프라인 시작)

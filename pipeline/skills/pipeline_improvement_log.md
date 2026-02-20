# 파이프라인 개선 로그 스킬

## 목적

파이프라인 실행 중 발견된 개선 필요 사항을 구조화된 로그로 기록합니다.
테스트, 검증, 고도화 작업 시 CDP MCP 데이터를 활용하여 문제를 구체적으로 문서화합니다.

## 사용 Agent

- 모든 Agent에서 사용 가능
- 특히 Agent 05 (QA), Agent 06 (에러 문서화), Agent 07 (성공 로그)에서 주로 활용

## 로그 저장 경로

```
docs/pipeline-logs/{YYYY-MM-DD}_{카테고리}_{제목}.md
```

## 로그 형식

```markdown
# 파이프라인 개선 로그

## 기본 정보

| 항목 | 내용 |
|---|---|
| 날짜 | {YYYY-MM-DD} |
| Agent / Phase | {Agent 번호 및 Phase} |
| 카테고리 | {performance / ux / error-handling / architecture / dx} |
| 우선순위 | {high / medium / low} |

## 문제 설명

{발견된 문제를 구체적으로 기술}

## CDP 수집 데이터

> CDP MCP 도구를 활용하여 수집한 데이터를 첨부합니다.

### Network 데이터
<!-- list_network_requests, get_network_request 결과 -->
{관련 API 요청/응답 데이터}

### Console 데이터
<!-- list_console_messages, get_console_message 결과 -->
{JS 에러, 경고 로그}

### Screenshot
<!-- take_screenshot 결과 -->
{스크린샷 경로 또는 설명}

### DOM Snapshot
<!-- take_snapshot 결과 -->
{관련 DOM 상태 (필요 시)}

## 개선 제안

{구체적인 개선 방안을 기술}

## 영향 범위

- 관련 Agent: {영향받는 Agent 목록}
- 관련 파일: {영향받는 파일 경로}
- 관련 이슈: {GitHub 이슈 번호 (있는 경우)}
```

## 카테고리 분류 기준

| 카테고리 | 설명 | 예시 |
|---|---|---|
| `performance` | 응답 시간, 렌더링 성능 | API 응답 3초 초과, 번들 크기 과다 |
| `ux` | 사용자 경험 문제 | 로딩 상태 누락, 에러 메시지 불명확 |
| `error-handling` | 에러 처리 미흡 | 네트워크 실패 시 무한 로딩, 에러 바운더리 누락 |
| `architecture` | 구조적 개선 필요 | API 명세 불일치, 컴포넌트 분리 필요 |
| `dx` | 개발 경험 개선 | 빌드 속도, 테스트 환경, 디버깅 도구 |

## 우선순위 판단 기준

| 우선순위 | 기준 |
|---|---|
| `high` | 기능 동작에 직접 영향, 사용자가 즉시 인지하는 문제 |
| `medium` | 기능은 동작하지만 품질 저하, 특정 조건에서 문제 발생 |
| `low` | 코드 품질, 유지보수성, 향후 확장성 관련 |

## 활용 CDP MCP 도구

| 용도 | chrome-devtools-mcp 도구 |
|---|---|
| API 요청/응답 캡처 | `list_network_requests`, `get_network_request` |
| JS 에러/경고 수집 | `list_console_messages`, `get_console_message` |
| 시각적 증거 캡처 | `take_screenshot` |
| DOM 상태 기록 | `take_snapshot` |
| 성능 트레이스 | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight` |
| JS 실행/검증 | `evaluate_script` |

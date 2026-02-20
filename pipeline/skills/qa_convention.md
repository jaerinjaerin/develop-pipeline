# Skill: QA 컨벤션 (qa_convention)

## 적용 대상

Agent 05 (QA), Agent 06 (에러 문서화), Agent 07 (성공 로그)

## 테스트 케이스 ID 규칙

- 형식: `TC-{번호}` (01부터 순차)
- 페이지별 독립 번호 체계: 로그인 TC-01~08, 회원가입 TC-01~06 등

## 테스트 시나리오 도출 기준

### Happy Path (정상 경로)

플로우차트의 **성공 경로**에서 도출:
- 주요 기능의 정상 동작 확인
- 각 분기의 성공 결과 확인

### Edge / Error Path (분기 경로)

플로우차트의 **실패/예외 분기**에서 도출:
- 유효성 검사 실패
- API 에러 응답 (401, 403, 404, 500)
- 정책 위반 (횟수 초과, 권한 부족)
- 빈 입력, 경계값

### 도출 순서

1. 플로우차트의 모든 경로를 순회
2. 각 경로의 끝 노드를 테스트 케이스로 변환
3. 기능명세서의 정책 항목에서 추가 시나리오 도출
4. API명세의 에러 코드별 시나리오 추가

## QA 리포트 형식

```
page:       /{페이지경로}
total:      {N} scenarios
passed:     {N}    failed: {N}
failures:
  {TC-ID} → {FE|BE} · {에러 상세}
artifacts:   screenshots/ network-logs/ console-logs/
```

## FE/BE 원인 판단 기준

### FE 원인

- API 응답이 정상(200)인데 UI에 데이터가 미반영
- Console에 JavaScript TypeError/ReferenceError 발생
- DOM에 기대하는 요소가 존재하지 않음
- CSS/레이아웃 문제로 요소가 보이지 않음

### BE 원인

- API 응답이 500 서버 에러
- 응답 JSON 구조가 API명세와 불일치
- 응답 시간 > 3초 (타임아웃)
- 401/403 인증/인가 오류
- DB 관련 에러 (Connection, Query)

## 반복 실패 정책

| 횟수 | 액션 |
|---|---|
| 1회 | 에러 컨텍스트 + CDP 데이터 → 해당 Agent 재실행 |
| 2회 | 이전 시도 이력 포함 → 해당 Agent 재실행 (다른 접근 요청) |
| 3회+ | 자동 수정 불가 판단 → 에스컬레이션 리포트 → 파이프라인 일시 정지 |

## CDP 수집 항목

| 항목 | CDP 명령 | 수집 Agent |
|---|---|---|
| API 요청/응답 | `Network.enable` | 05, 06, 07 |
| JS 에러 로그 | `Console.enable` | 05, 06 |
| 스크린샷 | `Page.screenshot` | 05, 06, 07 |
| DOM 상태 | `DOM.getDocument` | 05 |
| JS 실행 | `Runtime.evaluate` | 05 |

## Baseline 활용 (회귀 테스트)

이전 성공 로그의 `baseline.json`과 비교:
- **응답 시간**: 기준값 대비 20% 이상 증가 → 성능 경고
- **스크린샷**: 해시 비교 → 의도하지 않은 UI 변경 감지
- **API 응답**: 구조/상태코드 변경 → 명세 불일치 감지

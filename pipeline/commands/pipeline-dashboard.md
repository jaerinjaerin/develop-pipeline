# Pipeline Dashboard 생성

`visualization-notion` 스킬 **Mode C**를 사용하여 파이프라인 실행 이력 종합 대시보드를 생성합니다.

## 실행 절차

### 1. Notion MCP 연결 확인
- 미연결 시: "Notion MCP가 연결되지 않았습니다. Pipeline Runs DB 데이터를 조회할 수 없습니다." 안내 후 중단

### 2. Pipeline Runs DB 조회
- `mcp__notion__API-query-data-source` 사용
- Pipeline Runs DB ID: CLAUDE.md의 `Pipeline Runs DB ID` 참조
- DB ID 미설정 시: "Pipeline Runs DB ID가 설정되지 않았습니다. CLAUDE.md에 DB ID를 기입해주세요." 안내 후 중단

### 3. 대시보드 구성 요소

#### 통계 요약 카드
- 총 실행 수
- 전체 성공률 (%)
- 평균 소요 시간 (분)
- 에스컬레이션 발생 수

#### 상태별 칸반 보드
- 컬럼: Running / Passed / Failed / Escalated
- 각 카드: 프로젝트명, 페이지명, 날짜, TC 결과

#### 성공/실패 추이 Line Chart
- X축: 날짜
- Y축: 성공률 (%)
- 프로젝트별 라인 구분

#### 프로젝트별 Bar Chart
- X축: 프로젝트
- Y축: TC Passed / TC Failed 스택

#### Gantt 차트
- 최근 실행 타임라인 (Run Date + Duration 기반)

### 4. 출력
- 저장 경로: `docs/pipeline-dashboard/dashboard-{날짜}.html`
- 형식: HTML (React + Recharts 인라인)
- 브라우저에서 바로 열어볼 수 있는 단일 HTML 파일

### 5. 완료 안내
- 대시보드 파일 경로 출력
- 총 조회된 Run 수, 기간 요약

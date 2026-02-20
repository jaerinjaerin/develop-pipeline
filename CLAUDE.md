# Development Pipeline Orchestrator

> 이 파일은 모든 하위 프로젝트에 자동 상속됩니다. (Claude Code는 cwd → 루트까지 CLAUDE.md를 모두 로드)

---

## Pipeline Overview

디자인 산출물(퍼블리싱 HTML, 기획서 등)을 입력받아 **문서화 → 이슈 생성 → FE/BE 개발 → QA → 로그 문서화 → 배포**까지 자동 수행하는 에이전트 파이프라인.

### Phase 흐름

```
Phase 1 · 문서화        → Agent 01 (문서 작성)
    ⏸️ 사람 검토/승인
Phase 2 · 이슈 생성     → Agent 02 (이슈 생성)
Phase 3 · 병렬 개발     → Agent 03 (FE) + Agent 04 (BE)
Phase 4 · 검증          → Agent 05 (QA · E2E)
Phase 5 · 로그 문서화   → Agent 06 (에러) / Agent 07 (성공)
Phase 6 · 배포          → Agent 08 (Staging 자동 + Production 승인)
    ⏸️ Production 배포 승인
```

---

## Orchestrator 역할

이 CLAUDE.md가 Orchestrator 역할을 수행합니다. 모든 Agent 실행의 흐름을 제어합니다.

### 기본 실행 규칙

1. **Phase 순서 준수**: Phase 1 → (사람 검토) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → (Production 승인)
2. **병렬 처리**: Phase 3에서 FE/BE Agent는 이슈 의존성 기반으로 병렬 실행
3. **Wave 스케줄링**: `blocked by` 없는 이슈부터 할당, 선행 이슈 완료 시 다음 Wave 자동 시작

### 재진입 / 에스컬레이션 로직

| 트리거 | 액션 |
|---|---|
| QA 전체 통과 | Agent 07 → Agent 08 Staging 자동 배포 |
| Staging 배포 성공 | ⏸️ Production 승인 대기 → 승인 시 Production 배포 |
| 배포 실패 | Agent 08 롤백 실행 → 롤백 성공 시 에러 문서화 |
| 롤백 3회 실패 | 파이프라인 일시 정지 → 사람에게 에스컬레이션 |
| QA 실패 (FE) | Agent 06 → Agent 03 재실행 (에러 컨텍스트 전달) |
| QA 실패 (BE) | Agent 06 → Agent 04 재실행 (에러 컨텍스트 전달) |
| QA 실패 (FE+BE) | Agent 06 → Agent 03 & 04 동시 재실행 |
| API 명세 변경 | Agent 03 & 04 동시 재실행 → Agent 05 재검증 |
| 문서 내용 변경 | Agent 02부터 재실행 (이슈 재생성 → 개발 → QA) |
| **3회 이상 반복 실패** | **파이프라인 일시 정지 → 사람에게 에스컬레이션** |

### 재진입 범위 판단

- **최소 범위** (단일 Agent): QA 실패 원인이 FE 또는 BE 한쪽 → 해당 Agent만 재실행
- **중간 범위** (Phase 3~): API 명세 변경 → FE + BE 모두 재실행
- **최대 범위** (Phase 2~): 기능명세서/화면명세서 수정 → 이슈 재생성부터

---

## 프로젝트 생성 가이드

### 새 프로젝트 시작 시

1. 사용자 요구사항을 분석하여 적합한 기술 스택 추천
2. 사용자 승인 후 `init-project.sh` 실행

```bash
./pipeline/init-project.sh <project-name> <fe-stack> <be-stack>
# 예시:
./pipeline/init-project.sh shopping-mall nextjs fastapi
./pipeline/init-project.sh blog-site react django
```

### 지원 스택

어떤 스택이든 지정 가능합니다. 사전 정의 가이드라인이 없는 스택은 템플릿에서 자동 생성됩니다.

**사전 정의 스택** (구체적 가이드라인 제공):

| 구분 | 스택 | 가이드라인 경로 |
|---|---|---|
| Frontend | `nextjs` | `pipeline/stacks/nextjs/frontend-guidelines.md` |
| Frontend | `react` | `pipeline/stacks/react/frontend-guidelines.md` |
| Backend | `fastapi` | `pipeline/stacks/fastapi/backend-guidelines.md` |
| Backend | `django` | `pipeline/stacks/django/backend-guidelines.md` |

**커스텀 스택** (예: `vue`, `svelte`, `nestjs`, `spring` 등):
- `init-project.sh`가 `pipeline/templates/`의 템플릿에서 가이드라인을 자동 생성
- 생성된 가이드라인은 `<!-- TODO -->` 주석이 포함되어 있으며, Phase 1에서 Agent 01이 보강

### 스택 추천 기준

| 조건 | FE 추천 | BE 추천 |
|---|---|---|
| SEO 필요, SSR 필요 | `nextjs` | - |
| SPA, 빠른 프로토타입 | `react` | - |
| 비동기 API, 고성능 | - | `fastapi` |
| 관리자 페이지, ORM 풍부 | - | `django` |

> 위 외에도 프로젝트 요구에 맞는 어떤 스택이든 자유롭게 지정할 수 있습니다.

---

## 공통 규칙

### 문서 규칙
- 모든 Agent가 생성하는 문서는 `docs/` 하위에 저장
- 에러 문서: `docs/errors/{날짜}_{시나리오}.md`
- QA 로그: `docs/qa-logs/{날짜}_{페이지}/`
- 배포 로그: `docs/deploy-logs/{날짜}_{환경}.md`
- Mermaid 다이어그램은 문서 내 인라인으로 작성

### QA 규칙
- E2E 테스트는 Playwright 사용
- 테스트 시나리오는 기능명세서의 플로우차트에서 도출
- 실패 시 CDP 데이터(Network, Console, Screenshot)를 반드시 수집
- 동일 시나리오 3회 연속 실패 시 자동 에스컬레이션

### Git / PR 규칙
- 이슈 1개 = PR 1개 원칙
- PR 제목에 이슈 번호 포함: `[FE] #12 LoginForm 컴포넌트 구현`
- Acceptance Criteria 기반으로 PR 체크리스트 생성

### Agent 간 통신
- Agent 출력물은 `docs/` 폴더를 통해 공유
- QA 리포트는 구조화된 형식으로 Orchestrator에게 전달
- 에러 문서에는 반드시 이전 시도 이력 포함
- Agent 08 배포 로그는 `docs/deploy-logs/`에 저장

### Notion 통합 규칙
- PIPELINE_LOG 페이지 ID: `30db717d-4315-8099-b939-e6a70d60d428`
- Pipeline Runs DB ID: `{최초 실행 시 Notion에서 수동 생성 후 기입}`
- Notion MCP 미연결 시: 경고 출력 후 로컬 docs/ 기록으로 진행 (파이프라인 중단 금지)
- 모든 Notion 쓰기 → `notion_logger` 스킬 경유
- 모든 Notion 읽기+시각화 → `visualization-notion` 스킬 경유

### 코드 검증 규칙
- PR 생성 전 `/verify-implementation` 실행 권장
- 등록된 verify 스킬이 없는 경우 `/manage-skills`로 스킬 생성
- QA(E2E)와 verify(정적 규칙 검증)는 상호 보완적

## Skills

커스텀 검증 및 유지보수 스킬은 `pipeline/skills/`에 정의되어 있습니다.

| Skill | Purpose |
|-------|---------|
| `verify-implementation` | 프로젝트의 모든 verify 스킬을 순차 실행하여 통합 검증 보고서를 생성합니다 |
| `manage-skills` | 세션 변경사항을 분석하고, 검증 스킬을 생성/업데이트하며, CLAUDE.md를 관리합니다 |
| `notion_logger` | Agent 06/07/08이 QA 결과 및 배포 결과를 Notion PIPELINE_LOG에 기록 |
| `visualization-notion` | Notion 기획서 시각화(Agent 01) + QA 결과 시각화(Agent 06/07) + 대시보드 |

---

## 파이프라인 설계 문서

상세 설계: `pipeline/develop-agent-pipeline.md`

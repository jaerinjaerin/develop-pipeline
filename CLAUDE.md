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

### Phase Gate 규칙 (필수)

각 Phase 진입 전 반드시 전제 조건을 확인해야 합니다. 전제 조건 미충족 시 해당 Phase 진입을 차단합니다.

| Phase | 전제 조건 | 확인 방법 |
|---|---|---|
| Phase 1 | 입력 자료 존재 | 사용자 제공 파일 확인 |
| Phase 2 | `docs/` 문서 3종 (화면명세서, 기능명세서, API명세초안) + 사용자 승인 | `ls docs/*.md` + 승인 확인 |
| Phase 3 | GitHub 이슈 1개 이상 생성 | `gh issue list --state open` |
| Phase 4 | FE/BE 코드 커밋 + PR 존재 | `git log --oneline -10` + `gh pr list` |
| Phase 5 | QA 리포트 존재 | `ls docs/qa-logs/` |
| Phase 6 | 성공 로그 존재 | `ls docs/qa-logs/*/summary.md` |

**Phase Gate 실행 프로토콜:**

1. **아티팩트 확인**: 이전 Phase의 산출물이 파일시스템에 존재하는지 확인
2. **도구 확인**: 해당 Phase에서 필요한 도구(`gh`, `docker` 등)가 사용 가능한지 확인
3. **전제 조건 미충족 시**: 부족한 항목을 명시하고 해당 Phase 진입 차단
4. **에스컬레이션**: 자동 해결 불가능한 전제 조건 → 사람에게 에스컬레이션
5. **게이트 통과 기록**: Phase 진입 시 `docs/pipeline-logs/`에 게이트 통과 기록

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

### 환경 요구사항

`init-project.sh` 실행 전 아래 도구가 설치되어 있어야 합니다.

| 구분 | 도구 | 용도 | 미설치 시 |
|---|---|---|---|
| **필수** | `python3` | macOS realpath 대체 (relpath 함수) | 즉시 중단 |
| **필수** | `jq` | skill-rules.json 스택 룰 주입 | 즉시 중단 |
| **필수** | `node` | Hook 의존성 설치, FE 빌드 | 즉시 중단 |
| **필수** | `npm` | Hook 의존성 설치, FE 패키지 관리 | 즉시 중단 |
| 권장 | `gh` | GitHub 이슈/PR 생성 (Phase 2, 3) | 경고 후 계속 |
| 권장 | `docker` | 배포 (Phase 6) | 경고 후 계속 |

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
- 커밋은 반드시 `/commit` 커맨드를 사용하여 컨벤션 준수
- 커밋 형식: `<type>(<scope>): <한국어 설명>` (Conventional Commits)
- type: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`, `ci`
- scope: `orchestrator`, `agent-01`~`agent-08`, `pipeline`, `skills`, `deploy`, `fe`, `be`, `qa` 등
- 이슈 1개 = PR 1개 원칙
- PR 제목에 이슈 번호 포함: `[FE] #12 LoginForm 컴포넌트 구현`
- Acceptance Criteria 기반으로 PR 체크리스트 생성
- **Agent 03, 04는 코드 작성 후 반드시 `/commit` 실행** (커밋 없이 다음 이슈로 넘어가는 것은 금지)
- **이슈별 전용 브랜치 생성 필수**: `feat/fe-{이슈번호}-{설명}` 또는 `feat/be-{이슈번호}-{설명}`
- **브랜치 → 커밋 → PR → 이슈 close** 순서 필수 준수

### GitHub CLI 규칙
- GitHub 작업은 반드시 `gh` CLI를 사용 (GitHub MCP 사용 금지)
- Agent 실행 전 `gh auth status`로 인증 상태 확인
- 이슈 생성: `gh issue create --title "<title>" --body "<body>" --label "<label>"`
- PR 생성: `gh pr create --title "<title>" --body "<body>"`
- 이슈 닫기: `gh issue close <number>`
- 이슈 목록은 `docs/issues.md`에도 기록 (오프라인 참조용)

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

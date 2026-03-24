# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 따르는 파이프라인 가이드다.

## 필수 사전 설정

이 워크플로우는 **superpowers 플러그인**이 설치되어 있어야 정상 동작한다.

```bash
claude plugin add superpowers
```

superpowers가 제공하는 skill(brainstorming, writing-plans, executing-plans,
dispatching-parallel-agents 등)을 각 Phase에서 활용한다.
플러그인 미설치 시 Agent 병렬 실행, 플랜 작성 등 핵심 기능이 제한된다.

---

## 개요

사용자의 기능 요청을 5단계 파이프라인으로 처리한다.
**각 Phase의 체크포인트에서 반드시 사용자 승인을 받은 후 다음 단계로 진행한다.**

---

## Agent 구성

| Agent | 모델 | 역할 | 사용 Skill |
|-------|------|------|-----------|
| PM (Alex) | Opus | 전체 오케스트레이터, 컨텍스트 조립 | `analyze-requirements` `assemble-context` |
| 기획자 (Mina) | Opus | 기능 명세, 화면 목록, API 초안 작성 | `explore-codebase` `write-plan-doc` |
| 디자이너 (Lena) | Sonnet | UI/UX 명세, 디자인 토큰, 컴포넌트 설계 | `explore-design-system` `write-design-spec` |
| FE 개발자 (Jay) | Sonnet | 컴포넌트 구현, 상태 관리, API 연동 | `explore-fe-codebase` `implement-components` `api-integration` |
| BE 개발자 (Sam) | Sonnet | API 구현, DB 마이그레이션, 인증 | `explore-be-codebase` `implement-api` `db-migration` |
| 인프라 (Dex) | Sonnet | Docker, CI/CD, 환경변수 관리 | `explore-infra` `write-dockerfile` `write-cicd` |
| QA 엔지니어 (Eva) | Sonnet | 기능 테스트, 엣지케이스, E2E 검증 | `explore-implementation` `write-test-cases` `write-qa-report` |
| 보안 리뷰어 (Rex) | Opus | OWASP 기준 취약점 검토, 보안 감사 | `scan-vulnerabilities` `review-auth` `write-security-report` |
| 코드 리뷰어 (Nora) | Sonnet | 코드 품질, 컨벤션, 기획 대비 구현 검토 | `explore-implementation` |

> **모델 선택 기준:**
> - `Opus` → 깊은 추론과 판단이 필요한 역할 (PM, 기획자, 보안 리뷰어)
> - `Sonnet` → 구조화된 구현과 문서 작성 역할 (나머지 모두)

---

## 참고 문서

| 문서 | 설명 |
|------|------|
| [references/context-structure.md](references/context-structure.md) | `context/`, `reports/` 디렉토리 구조 및 파일 번호 규칙 |
| [references/task-context-template.md](references/task-context-template.md) | `04_task_*.md` 작성 템플릿 (Section 1~3 공통, 4~5 Agent별 차이) |
| [references/pm-context-assembly.md](references/pm-context-assembly.md) | PM이 Phase 산출물을 조합하여 Task Context를 생성하는 절차 |
| [references/agents/pm.md](references/agents/pm.md) | PM Agent 상세 설계 |
| [references/agents/planner.md](references/agents/planner.md) | 기획자 Agent 상세 설계 |
| [references/agents/designer.md](references/agents/designer.md) | 디자이너 Agent 상세 설계 |
| [references/agents/fe-developer.md](references/agents/fe-developer.md) | FE 개발자 Agent 상세 설계 |
| [references/agents/be-developer.md](references/agents/be-developer.md) | BE 개발자 Agent 상세 설계 |
| [references/agents/infra-developer.md](references/agents/infra-developer.md) | 인프라 Agent 상세 설계 |
| [references/agents/qa-engineer.md](references/agents/qa-engineer.md) | QA 엔지니어 Agent 상세 설계 |
| [references/agents/security-reviewer.md](references/agents/security-reviewer.md) | 보안 리뷰어 Agent 상세 설계 |

---

## PHASE 0: 인풋 수신

사용자가 요구사항을 입력하면 **PM Agent(Alex)** 가 분석한다.
→ **`analyze-requirements` skill을 사용하여** 코드베이스를 탐색하고 영향 범위를 파악한다.

**수행 작업:**
1. 신규 기능인지 기존 기능 수정인지 판단
2. 영향 범위 파악 (FE / BE / Infra / 전체)
3. 필요한 Agent 역할 목록 결정
4. 예상 작업 순서 설계 (순차 / 병렬 / 팀)

**출력물:** `context/00_requirements.md`
```
포함 내용:
- 요청 내용 요약
- 작업 유형 (신규 기능 / 기능 수정 / 버그 수정)
- 영향 범위 (FE / BE / DB / Infra)
- 투입 Agent 목록
- 예상 실행 순서
```

> ✅ **체크포인트 1**: 사용자에게 작업 범위를 제시하고 확인받는다.
> 승인 전까지 다음 Phase로 넘어가지 않는다.

---

## PHASE 1: 기획 (순차, 단일 Agent)

**기획자 Agent(Mina)** 가 요구사항 + 기존 서비스 컨텍스트를 바탕으로 기획안을 작성한다.
→ **`explore-codebase` skill** 으로 기존 서비스 현황을 파악한 후
→ **`write-plan-doc` skill** 의 포맷 기준으로 기획안을 작성한다.

**공통 인풋:**
- `context/00_requirements.md`
- 기존 서비스 코드베이스 (있는 경우)

**출력물 — `context/01_plan.md` + `context/01_plan.html`:**
```
포함 내용:
1. 개요 (목적, 핵심 가치, 작업 범위)
2. 유저 스토리
3. 기능 명세 (표 형식)
4. 화면 목록 (표 형식)
5. API 초안 (Method / Path / 설명 / 인증 여부)
6. 엣지케이스 & 예외 처리
7. 비기능 요구사항 (성능, 보안, 접근성)
```

> ✅ **체크포인트 2**: 기획안을 사용자에게 제시하고 검토/승인받는다.
> 이 기획안이 이후 모든 Agent의 공통 기준이 된다.
> 승인 전까지 다음 Phase로 넘어가지 않는다.

---

## PHASE 2: 설계 (병렬 Sub-agents)

승인된 기획안을 공통 인풋으로 두 Agent가 **병렬로** 설계를 수행한다.

**공통 인풋 (양쪽 동일):**
- `context/00_requirements.md`
- `context/01_plan.md`

| Agent | 사용 Skill | 출력물 |
|-------|-----------|--------|
| 디자이너 (Lena) | `explore-design-system` → `write-design-spec` | `context/02_design_spec.md` |
| BE 설계자 (Sam) | `explore-be-codebase` → `implement-api` | `context/03_api_spec.md` + `context/03_erd.md` |

**디자이너 산출물 — `context/02_design_spec.md`:**
```
포함 내용:
1. 디자인 토큰 (색상 hex / 타이포 / 간격 / 반경 / 그림자)
2. 공통 컴포넌트 (Props 타입 + 상태별 스타일)
3. 화면별 레이아웃 (ASCII 박스 + 반응형 3단계)
4. 인터랙션 & 애니메이션
5. 접근성 가이드
```

**BE 설계자 산출물 — `context/03_api_spec.md` + `context/03_erd.md`:**
```
포함 내용:
- ERD (테이블 & 관계)
- API 명세 상세 (request / response 타입)
- 인증/권한 설계
- 의존성 & 서비스 경계
```

**실행 방법:** Agent 도구를 사용하여 두 Agent를 동시에 실행한다.

> ✅ **체크포인트 3**: 디자인 명세 + API 명세를 사용자에게 제시하고 검토받는다.
> 여기서 방향을 수정하면 구현 비용을 절감할 수 있다.
> 승인 전까지 다음 Phase로 넘어가지 않는다.

---

## PHASE 3: 구현 (Agent Teams)

**PM Agent(Alex)** 가 Phase 0~2 산출물을 조합하여 Agent별 Task Context를 생성한다.
→ **`assemble-context` skill을 사용하여** `04_task_*.md` 파일을 조립한다.
→ 조립 상세: [references/pm-context-assembly.md](references/pm-context-assembly.md) 참조

**Task 파일 구조 (모든 파일 동일한 5개 섹션):**
```
## 1. 프로젝트 현황      ← 모든 Agent 동일
## 2. 이번 요구사항      ← 모든 Agent 동일
## 3. 기획안 요약        ← 모든 Agent 동일
## 4. 네 역할과 작업 지시 ← Agent별로 다름
## 5. 참고 파일          ← Agent별로 다름
```

| Agent | Task 파일 | 사용 Skill | 담당 |
|-------|-----------|-----------|------|
| FE (Jay) | `context/04_task_FE.md` | `explore-fe-codebase` `implement-components` `api-integration` | UI 구현, 상태 관리, API 연동 |
| BE (Sam) | `context/04_task_BE.md` | `explore-be-codebase` `implement-api` `db-migration` | API 구현, DB 마이그레이션, 인증 |
| Infra (Dex) | `context/04_task_INFRA.md` | `explore-infra` `write-dockerfile` `write-cicd` | Docker, CI/CD, 환경변수 |

**Agent Teams 소통 규칙:**
```
FE ↔ BE:    API 응답 형식 변경, 필드 추가/제거 시 직접 메시지
FE ↔ Infra: 환경변수 이름, 포트 번호 확정 시 직접 메시지
BE ↔ Infra: DB 연결 설정, 포트 노출 범위 협의 시 직접 메시지

메시지 형식:
[발신→수신 공지]
변경 내용: ...
수신 Agent에서 수정 필요한 것: ...
```

**실행 원칙:**
- 독립적인 작업은 병렬로 동시 실행
- 의존성이 있는 작업은 순차 실행
  (예: BE API 완성 → FE 연동 순서)
- 파일 충돌 방지: 각 Agent는 자신의 담당 파일만 수정

> ✅ **체크포인트 4** (선택적): 대형 기능은 50% 시점에
> 사용자에게 진행 상황을 공유하고 중간 리뷰를 받는다.

---

## PHASE 4: QA + 통합 (Agent Teams)

**PM Agent(Alex)** 가 **`assemble-context` skill을 사용하여**
QA/보안/코드리뷰 Agent 각각의 task 파일을 생성하고 전달한다.

**공통 인풋 (세 Agent 동일):**
- `context/01_plan.md` (검증 기준)
- `context/02_design_spec.md`
- `context/03_api_spec.md`
- 구현된 FE/BE/Infra 코드 전체

| Agent | Task 파일 | 사용 Skill | 담당 |
|-------|-----------|-----------|------|
| QA (Eva) | `context/04_task_QA.md` | `explore-implementation` `write-test-cases` `write-qa-report` | 기능 테스트, 엣지케이스, E2E 검증 |
| 보안 리뷰어 (Rex) | `context/04_task_SEC.md` | `scan-vulnerabilities` `review-auth` `write-security-report` | OWASP 기준 취약점 검토 |
| 코드 리뷰어 (Nora) | `context/04_task_REVIEW.md` | `explore-implementation` | 코드 품질, 컨벤션, 기획 대비 검토 |

**산출물:**
```
context/qa_report.md        ← QA 최종 보고서
context/security_report.md  ← 보안 리뷰 보고서
```

**버그/취약점 발견 시 처리 흐름:**
```
발견 → 해당 Agent(FE/BE/Infra)에게 직접 보고
     → 수정 완료 통보 받음
     → 동일 시나리오로 재검증
     → 통과 시 완료 처리
```

**심각도별 배포 차단 기준:**
```
Critical → 반드시 수정 후 배포 (QA + 보안 모두)
High     → 반드시 수정 후 배포 (QA + 보안 모두)
Medium   → PM/사용자가 배포 여부 판단
Low      → 배포 후 처리 가능
```

> ✅ **체크포인트 5**: QA 보고서 + 보안 보고서를 사용자에게 제시한다.
> Critical/High 미해결 항목이 없을 때만 배포를 권고한다.
> 사용자 최종 승인 후 Infra Agent(Dex)가 배포를 실행한다.

---

## 컨텍스트 파일 누적 구조

각 Phase 산출물은 `context/` 폴더에 번호순으로 쌓인다:

```
context/
├── 00_requirements.md      ← PHASE 0: PM 분석 결과
├── 01_plan.md              ← PHASE 1: 기획안 (Agent용)
├── 01_plan.html            ← PHASE 1: 기획안 (사람용 보고서)
├── 02_design_spec.md       ← PHASE 2: 디자인 명세
├── 03_api_spec.md          ← PHASE 2: API 명세
├── 03_erd.md               ← PHASE 2: ERD
├── 04_task_FE.md           ← PHASE 3: FE Agent 작업 지시
├── 04_task_BE.md           ← PHASE 3: BE Agent 작업 지시
├── 04_task_INFRA.md        ← PHASE 3: Infra Agent 작업 지시
├── 04_task_QA.md           ← PHASE 4: QA Agent 작업 지시
├── 04_task_SEC.md          ← PHASE 4: 보안 리뷰어 작업 지시
├── 04_task_REVIEW.md       ← PHASE 4: 코드 리뷰어 작업 지시
├── qa_report.md            ← PHASE 4: QA 최종 보고서
└── security_report.md      ← PHASE 4: 보안 리뷰 보고서
```

---

## 핵심 원칙

1. **체크포인트 필수**
   모든 Phase 전환 시 사용자 승인이 있다. 절대 건너뛰지 않는다.

2. **공통 인풋 공유**
   병렬 Agent들은 동일한 문서를 인풋으로 받아 일관성을 유지한다.

3. **컨텍스트 자족성**
   각 Agent는 자신의 `04_task_*.md` 하나만 읽으면
   작업에 필요한 모든 정보가 있어야 한다.

4. **직접 소통 (Agent Teams)**
   구현/QA Phase에서 Agent 간 이슈는 중앙 조율 없이 직접 전달한다.
   변경 내용은 반드시 해당 명세 파일에도 반영한다.

5. **병렬 우선**
   독립적인 작업은 항상 병렬 Agent로 동시 실행한다.
   의존성이 있을 때만 순차 실행한다.

6. **산출물 누적**
   각 Phase 산출물은 `context/` 폴더에 번호순으로 쌓여 히스토리를 형성한다.
   파일을 덮어쓰지 않는다.

7. **배포는 사람이 결정한다**
   Infra Agent는 사용자의 최종 승인(CP5) 이후에만 배포를 실행한다.
   Critical/High 미해결 항목이 있으면 배포를 실행하지 않는다.

8. **모호하면 질문한다**
   어떤 Agent도 요구사항이 불명확할 때 임의로 가정하지 않는다.
   반드시 PM을 통해 사용자에게 질문하고 확인 후 진행한다.

---

## Pipeline Dashboard Integration

환경변수 `PIPELINE_ID`가 설정되어 있으면 **대시보드에서 실행 중**이다.
아래 규칙을 반드시 따른다.

### context 파일 경로 (중요!)

대시보드 실행 시, **모든 context 파일은 파이프라인 전용 디렉토리에 생성한다:**
```
pipelines/$PIPELINE_ID/context/
```

즉, 일반 실행에서 `context/00_requirements.md`에 저장하던 파일을
대시보드 실행 시에는 `pipelines/$PIPELINE_ID/context/00_requirements.md`에 저장한다.

**모든 Phase의 산출물이 이 경로를 따라야 한다:**
- `pipelines/$PIPELINE_ID/context/00_requirements.md` (Phase 0)
- `pipelines/$PIPELINE_ID/context/01_plan.md` (Phase 1)
- `pipelines/$PIPELINE_ID/context/02_design_spec.md` (Phase 2)
- `pipelines/$PIPELINE_ID/context/03_api_spec.md` (Phase 2)
- 등등...

### 시그널 프로토콜

시그널 파일은 단순 텍스트 파일이며, 대시보드의 Runner가 감지하여 실시간 상태를 업데이트한다.

### 시그널 디렉토리

모든 시그널 파일은 아래 경로에 생성한다:
```
pipelines/$PIPELINE_ID/signals/
```

### Phase 전환

새 Phase를 시작할 때:
```bash
echo "PHASE번호" > pipelines/$PIPELINE_ID/signals/.phase
```
예: `echo "1" > pipelines/$PIPELINE_ID/signals/.phase`

### Agent 상태

Agent가 작업을 시작하거나 완료할 때:
```bash
echo "working" > pipelines/$PIPELINE_ID/signals/.agent_AGENT_ID
echo "done" > pipelines/$PIPELINE_ID/signals/.agent_AGENT_ID
```
예: `echo "working" > pipelines/$PIPELINE_ID/signals/.agent_alex`

### 활동 로그

대시보드에 표시할 진행 상황 메시지:
```bash
echo "AGENT_ID|TYPE|MESSAGE" >> pipelines/$PIPELINE_ID/signals/.activity
```
- TYPE: `info`, `progress`, `success`, `error`
- 예: `echo "alex|progress|요구사항 분석 중" >> pipelines/$PIPELINE_ID/signals/.activity`

### 산출물 등록

context 파일이 완성되었을 때:
```bash
echo "FILENAME|PHASE" >> pipelines/$PIPELINE_ID/signals/.output
```
예: `echo "context/01_plan.md|1" >> pipelines/$PIPELINE_ID/signals/.output`

### 체크포인트 (필수)

각 Phase의 체크포인트에서 **반드시** 다음을 수행한다:

1. 체크포인트 시그널 작성:
```bash
echo "PHASE|설명" > pipelines/$PIPELINE_ID/signals/.checkpoint
```
예: `echo "1|기획안 검토" > pipelines/$PIPELINE_ID/signals/.checkpoint`

2. **사용자 입력을 기다린다.** 대시보드 Runner가 사용자의 승인/거절 응답을 stdin으로 전달한다.

3. 응답에 따라:
   - **승인** → 다음 Phase로 진행
   - **거절 + 피드백** → 피드백을 반영하여 수정 후 다시 체크포인트 시그널 작성
---
name: assemble-context
description: "PM이 PHASE 3 진입 시 각 Agent에게 작업을 넘기기 전에 context/ 폴더의 산출물들(00_requirements.md, 01_plan.md, 02_design_spec.md, 03_api_spec.md 등)을 읽어서 Agent별 task 파일(04_task_*.md)을 조립할 때 사용하는 skill. 'task context 조립', '04_task 파일 생성', 'Agent에게 작업 넘기기', 'Phase 3 시작' 등의 상황에서 반드시 사용한다. QA Phase(Phase 4)에서 04_task_QA.md를 생성할 때도 이 skill을 사용한다."
---

# Assemble Context

PM Agent가 Phase 0~2 산출물을 조합하여 각 실행 Agent에게 전달할 `04_task_*.md` 파일을 조립하는 skill이다.

핵심 원칙은 **자족성(self-contained)**이다. 각 Agent는 자신의 task 파일 하나만 읽으면 작업에 필요한 모든 정보가 담겨 있어야 한다. 외부 파일을 추가로 참조할 필요가 없어야 한다.

---

## 조립 절차

### Step 1: 소스 파일 읽기

`context/` 폴더에서 아래 파일들을 읽는다. 파일이 없으면 해당 섹션은 건너뛴다.

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `context/00_requirements.md` | Section 1(프로젝트 현황), Section 2(요구사항) | **필수** |
| `context/01_plan.md` | Section 3(기획안 요약) | 있으면 포함 |
| `context/02_design_spec.md` | Section 5 참고 자료 (FE, QA용) | 있으면 포함 |
| `context/03_api_spec.md` | Section 5 참고 자료 (BE, FE, QA용) | 있으면 포함 |
| `context/03_erd.md` | Section 5 참고 자료 (BE, Infra용) | 있으면 포함 |

`00_requirements.md`가 없으면 조립을 중단하고 사용자에게 "Phase 0이 아직 완료되지 않았습니다"라고 알린다.

### Step 2: 대상 Agent 확인

호출 시 전달받은 Agent 목록을 확인한다. 일반적으로 `00_requirements.md`의 "필요 Agent" 섹션에 명시되어 있다.

가능한 Agent 유형:
- **FE** — 프론트엔드 개발
- **BE** — 백엔드 개발
- **INFRA** — 인프라/DevOps
- **QA** — QA/테스트 (Phase 4에서 생성할 수도 있음)

### Step 3: 공통 섹션 조립 (Section 1~3)

모든 Agent에게 동일하게 들어가는 내용을 먼저 구성한다.

```markdown
# TASK CONTEXT

## 1. 프로젝트 현황
```

`00_requirements.md`에서 서비스명, 기술 스택, 현재 서비스 상태 정보를 추출하여 작성한다. 코드베이스 탐색 결과가 있다면 그것도 반영한다.

```markdown
## 2. 이번 요구사항
```

`00_requirements.md`의 요청 내용과 분석 결과(작업 유형, 영향 범위)를 그대로 포함한다.

```markdown
## 3. 기획안 요약
```

`01_plan.md`의 핵심 내용을 요약하여 포함한다. 기능 명세, 화면 목록, API 목록, 엣지케이스 등을 포함한다. `01_plan.md`가 없으면 이 섹션은 "(기획안 없음 — 요구사항 기반으로 작업)" 으로 표기한다.

### Step 4: Agent별 섹션 조립 (Section 4~5)

각 Agent의 역할에 맞게 작업 지시와 참고 자료를 작성한다.

#### Section 4: 네 역할과 작업 지시

Agent마다 아래 항목을 구체적으로 작성한다:

| 항목 | 설명 |
|------|------|
| **역할** | 이 Agent가 맡은 역할 (예: 프론트엔드 개발자) |
| **해야 할 일** | 구체적인 작업 목록 (체크리스트 형태 권장) |
| **산출물 형식** | 무엇을 만들어야 하는지 (파일, 컴포넌트, API 등) |
| **완료 기준** | 이 작업이 "끝났다"의 기준 |
| **건드리면 안 되는 것** | 이 Agent의 관할 밖인 것을 명시 |

**Agent별 작성 가이드:**

**FE Agent** — `02_design_spec.md`의 화면 시안과 컴포넌트 구조를 기반으로 해야 할 일을 도출한다. API 명세에서 FE가 호출해야 할 엔드포인트 목록도 포함한다.

**BE Agent** — `03_api_spec.md`의 API 명세와 `03_erd.md`의 DB 스키마를 기반으로 해야 할 일을 도출한다. 각 엔드포인트의 요청/응답 형식, 비즈니스 로직, 에러 처리를 포함한다.

**INFRA Agent** — DB 마이그레이션, Docker 설정 변경, CI/CD 파이프라인 수정 등 인프라 관련 작업을 도출한다.

**QA Agent** — 기획안의 기능 명세와 엣지케이스를 기반으로 테스트 항목을 도출한다. FE/BE 구현 결과물을 검증하는 관점에서 작성한다.

#### Section 5: 참고 파일

Agent가 작업 중 참조해야 할 정보를 **인라인으로 포함**한다. 파일 경로만 나열하는 것이 아니라, 해당 Agent에게 필요한 부분을 발췌하여 직접 넣는다.

**Agent별 참고 자료 선별 기준:**

| Agent | 포함하는 것 | 포함하지 않는 것 |
|-------|------------|----------------|
| FE | 화면 시안, 컴포넌트 구조, 호출할 API 목록(엔드포인트+요청/응답) | ERD, DB 스키마, 인프라 설정 |
| BE | API 명세 전체, ERD/DB 스키마, 비즈니스 로직 규칙 | 화면 시안, CSS 구조 |
| INFRA | DB 스키마(마이그레이션용), 배포 관련 설정, 환경 변수 목록 | 화면 시안, 상세 API 로직 |
| QA | 기능 명세, 화면 플로우, API 엔드포인트 목록, 엣지케이스 목록 | DB 스키마 상세, 인프라 설정 |

### Step 5: 파일 저장

완성된 task 파일을 `context/` 폴더에 저장한다:

```
context/04_task_FE.md
context/04_task_BE.md
context/04_task_INFRA.md
context/04_task_QA.md
```

필요한 Agent의 파일만 생성한다. 예를 들어 FE만 필요한 작업이면 `04_task_FE.md`만 생성한다.

기존 `04_task_*.md`가 있으면 덮어쓰기 전에 사용자에게 확인한다.

### Step 6: 결과 보고

생성 완료 후 아래 형식으로 보고한다:

```
Task Context 조립 완료:
- context/04_task_FE.md ✓
- context/04_task_BE.md ✓
- context/04_task_QA.md ✓

각 파일의 Section 구성:
  Section 1~3: 공통 (프로젝트 현황, 요구사항, 기획안)
  Section 4: Agent별 작업 지시
  Section 5: Agent별 참고 자료
```

---

## 완성 파일 구조 예시

```markdown
# TASK CONTEXT

## 1. 프로젝트 현황
- 서비스명: MyApp
- 기술 스택: React + NestJS + PostgreSQL
- 현재 단계: MVP 운영 중

## 2. 이번 요구사항
- 작업 유형: 기능 수정
- 영향 범위: FE, BE
- 내용: 소셜 로그인(Google, Kakao) 추가

## 3. 기획안 요약
- Google/Kakao OAuth 2.0 연동
- 기존 이메일 로그인과 병행 운영
- 소셜 계정으로 첫 로그인 시 자동 회원가입
- 엣지케이스: 같은 이메일로 이메일 가입 + 소셜 가입 시 계정 연동

## 4. 네 역할과 작업 지시
- 역할: 프론트엔드 개발자
- 해야 할 일:
  - [ ] 로그인 페이지에 Google/Kakao 소셜 로그인 버튼 추가
  - [ ] OAuth 리다이렉트 콜백 페이지 구현
  - [ ] 소셜 로그인 상태 관리 (토큰 저장/갱신)
- 산출물: React 컴포넌트 + OAuth 콜백 페이지
- 완료 기준: 소셜 로그인 버튼 클릭 → OAuth 인증 → 토큰 수신 → 로그인 완료
- 건드리면 안 되는 것: API 서버 코드, DB 스키마

## 5. 참고 파일

### 화면 시안
(02_design_spec.md에서 발췌한 로그인 화면 관련 내용)

### 호출할 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /auth/google | Google OAuth 시작 |
| GET | /auth/google/callback | Google 콜백 처리 |
| GET | /auth/kakao | Kakao OAuth 시작 |
| GET | /auth/kakao/callback | Kakao 콜백 처리 |
```

---

## 품질 체크리스트

파일을 저장하기 전에 점검한다:

- [ ] `00_requirements.md`를 읽었는가?
- [ ] Section 1~3이 모든 Agent 파일에서 동일한가?
- [ ] Section 4의 "해야 할 일"이 구체적이고 체크리스트 형태인가?
- [ ] Section 5에 경로만 나열하지 않고 실제 내용을 발췌했는가?
- [ ] 각 Agent에게 불필요한 정보를 포함하지 않았는가? (FE에게 ERD 등)
- [ ] Agent가 이 파일 하나만 읽으면 작업을 시작할 수 있는가? (자족성)

# 개발 자동화 워크플로우

## 개요

운영 중인 프로젝트에 기능을 추가할 때, 사용자의 한 줄 요구사항부터 PR 생성까지 전 과정을 에이전트 기반으로 자동화하는 워크플로우.

## 전제 조건

- **아키텍처 문서** (`docs/architecture.md`): 프로젝트 구조, DB 스키마, API 목록, 디렉토리 구조
- **코딩 컨벤션 문서** (`docs/coding-convention.md`): 네이밍 규칙, 코드 스타일, 파일 구조, 에러 처리 패턴

## 전체 흐름

```
사용자 요구사항 입력
     │
     ▼
[1단계] PRD 생성 에이전트
     │   사용자 질문 → 답변 → 구조화된 PRD
     │
     ▼
[2단계] 이슈 생성 에이전트
     │   PRD → 이슈 분해 → 의존성 파악 → 사용자 확인 → 등록
     │
     ▼
[3단계] 이슈 실행 (에이전트 팀 × 이슈 수)
     │   Dev → QA → Review → Commit (이슈당)
     │
     ▼
[4단계] 오케스트레이터 (병렬 처리)
     │   의존성 그래프 기반 실행 순서 관리
     │   병렬 가능한 이슈 동시 실행
     │
     ▼
[5단계] E2E 테스트 + PR 생성
         통합 테스트 → 성공 시 PR 자동 생성 → 사람 최종 리뷰
```

## 각 단계 상세

### 1단계: PRD 생성

- 에이전트: `.claude/agents/01-prd-generator.md`
- 입력: 사용자의 자연어 요구사항
- 참조: `docs/architecture.md`
- 출력: 구조화된 PRD (기능 요구사항 + 영향 범위 + 비기능 요구사항)
- 사용자 개입: 질문 답변 + PRD 확인

### 2단계: 이슈 생성

- 에이전트: `.claude/agents/02-issue-generator.md`
- 입력: 1단계 PRD
- 출력: 이슈 목록 (area, complexity, depends_on 포함)
- 사용자 개입: 이슈 분해 결과 확인

### 3단계: 이슈 실행

- 에이전트 팀:
  - Dev: `.claude/agents/03-dev.md`
  - QA: `.claude/agents/04-qa.md`
  - Review: `.claude/agents/05-review.md`
- 실행 순서: Dev → QA → Review → Commit
- 이터레이션: 최대 3회, 실패 시 에스컬레이션
- area에 따라 에이전트 컨텍스트 동적 전환

### 4단계: 오케스트레이터

- 에이전트: `.claude/agents/06-orchestrator.md`
- 의존성 그래프 기반 실행 순서 관리
- 병렬 가능한 이슈 동시 실행 (제한 없음)

### 5단계: E2E 테스트 + PR

- 에이전트: `.claude/agents/07-e2e-test.md`
- PRD 기반 E2E 시나리오 작성 → CDP 기반 테스트 실행
- 이터레이션: 최대 3회, 실패 시 에스컬레이션
- 통과 시 PR 자동 생성

## Human-in-the-Loop 포인트

| 단계 | 사용자 개입 | 필수 여부 |
|------|-----------|----------|
| 1단계 | 질문 답변 + PRD 확인 | 필수 |
| 2단계 | 이슈 분해 확인 | 필수 |
| 3단계 | 에스컬레이션 시 개입 | 조건부 |
| 4단계 | 없음 | - |
| 5단계 | PR 최종 리뷰 + 머지 | 필수 |

## 프로젝트 파일 구조

```
project/
├── CLAUDE.md                        ← 프로젝트 공통 규칙
├── .claude/
│   └── agents/
│       ├── 01-prd-generator.md      ← PRD 에이전트 프롬프트
│       ├── 02-issue-generator.md    ← 이슈 생성 에이전트 프롬프트
│       ├── 03-dev.md                ← Dev 에이전트 프롬프트
│       ├── 04-qa.md                 ← QA 에이전트 프롬프트
│       ├── 05-review.md             ← Review 에이전트 프롬프트
│       ├── 06-orchestrator.md       ← 오케스트레이터 프롬프트
│       └── 07-e2e-test.md           ← E2E 테스트 에이전트 프롬프트
├── docs/
│   ├── architecture.md              ← 아키텍처 문서
│   ├── coding-convention.md         ← 코딩 컨벤션 문서
│   ├── automation-workflow.md       ← 이 문서
│   └── required-skills.md           ← 필요 스킬 목록
└── src/
```

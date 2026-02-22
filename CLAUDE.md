# Project Rules

## 프로젝트 개요

이 프로젝트는 에이전트 기반 개발 자동화 워크플로우를 사용한다.
사용자의 요구사항 입력부터 PR 생성까지 전 과정이 에이전트로 자동화된다.

## 공통 규칙

### 참조 문서

- 아키텍처 문서: `docs/architecture.md`
- 코딩 컨벤션: `docs/coding-convention.md`
- 자동화 워크플로우: `docs/automation-workflow.md`
- 필요 스킬 목록: `docs/required-skills.md`

### 커밋 규칙

Conventional Commits를 따른다:

```
<type>: <description> (#<issue-number>)
```

- feat: 새로운 기능
- fix: 버그 수정
- chore: 빌드, 설정 변경
- refactor: 리팩토링
- docs: 문서 변경

### 이슈 라벨

- area: frontend / backend / database / infra / design
- complexity: easy / normal / hard

### 에이전트 실행 규칙

- 모든 에이전트는 `.claude/agents/` 하위의 프롬프트를 참조한다.
- 이터레이션은 최대 3회까지 허용한다.
- 3회 초과 시 사람에게 에스컬레이션한다.
- area에 따라 시스템 프롬프트, 참조 문서, 도구가 동적으로 전환된다.

### 워크플로우 순서

```
1단계: PRD 생성        → .claude/agents/01-prd-generator.md
2단계: 이슈 생성       → .claude/agents/02-issue-generator.md
3단계: 이슈 실행       → .claude/agents/03-dev.md
                         .claude/agents/04-qa.md
                         .claude/agents/05-review.md
4단계: 병렬 처리       → .claude/agents/06-orchestrator.md
5단계: E2E + PR       → .claude/agents/07-e2e-test.md
```

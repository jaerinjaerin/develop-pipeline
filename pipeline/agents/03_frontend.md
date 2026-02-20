# Agent 03 — Frontend Agent (Generic)

## 역할

API 명세를 계약서로 삼아 컴포넌트 및 페이지 UI를 구현합니다.
프로젝트의 기술 스택에 따라 해당 스택 가이드라인을 참조합니다.

## 스택 가이드라인 참조 방식

1. 프로젝트 `CLAUDE.md`에서 `fe_stack` 값 확인
2. `pipeline/stacks/{fe_stack}/frontend-guidelines.md` 참조
3. 해당 가이드라인에 따라 코드 작성

> 예: fe_stack이 `nextjs`이면 → `pipeline/stacks/nextjs/frontend-guidelines.md`를 참조

## 전제 조건 (실행 전 필수 확인)

아래 항목을 모두 확인한 후에만 실행합니다.

```bash
# 1. GitHub 이슈 존재 확인
gh issue list --label "frontend" --state open

# 2. 참조 문서 확인
ls docs/화면명세서.md docs/API명세초안.md

# 3. gh CLI 인증 확인
gh auth status
```

- FE 이슈 0개 → "Phase 2(이슈 생성)를 먼저 완료해주세요" 안내 후 중단
- 참조 문서 미존재 → "Phase 1(문서화)을 먼저 완료해주세요" 안내 후 중단

## 입력

- 할당된 FE 이슈 (GitHub)
- `docs/화면명세서.md` — UI 레이아웃, 컴포넌트 구조
- `docs/API명세초안.md` — API 호출 인터페이스
- Mermaid 다이어그램 — 시퀀스(통신 순서), 상태(UI 상태)

## 출력

- 컴포넌트 코드 (프로젝트 `frontend/` 디렉토리)
- 페이지 코드
- API 호출 코드 (초기에는 Mock, 연동 단계에서 실제 API)
- PR 생성

## 실행 절차

### Wave 기반 개발

1. Orchestrator로부터 `blocked by`가 없는 FE 이슈를 할당받음
2. **이슈 전용 브랜치 생성**: `git checkout -b feat/fe-{이슈번호}-{설명}`
3. 이슈의 Acceptance Criteria를 읽고 **스택 가이드라인**을 참조하여 코드 작성
4. **`/commit` 커맨드로 커밋** (필수, 커밋 메시지에 이슈번호 포함)
5. PR 생성 (`gh pr create`) → GitHub 이슈 close (`gh issue close`)
6. 다음 Wave 이슈 자동 할당 (의존성 해제된 이슈)

> **주의**: 커밋 없이 다음 이슈로 넘어가는 것은 금지됩니다. 반드시 `/commit` 후 PR을 생성해야 합니다.

### API 연동 (Wave 3)

1. FE + BE 모든 이슈 완료 후 연동 단계 진입
2. Mock 데이터를 실제 API 호출로 교체
3. 통합 테스트 후 최종 PR 생성

## 코드 작성 규칙

- 화면명세서의 레이아웃, 반응형 스펙 준수
- API명세의 요청/응답 구조를 타입으로 정의
- 상태 다이어그램의 모든 상태(idle, loading, success, error) 처리
- 시퀀스 다이어그램의 통신 순서 준수
- 에러 UI는 기능명세서에 정의된 에러 시나리오와 일치

## 도구

- `gh` CLI — PR 생성, 이슈 상태 관리

### 주요 명령어

```bash
# PR 생성
gh pr create --title "[FE] #12 LoginForm 컴포넌트 구현" \
  --body "## 변경사항\n- ...\n\nCloses #12"

# 이슈 close
gh issue close 12

# PR 목록 확인
gh pr list
```

## 다음 단계

FE + BE 모든 이슈 완료 → API 연동 → Agent 05 (QA) 실행

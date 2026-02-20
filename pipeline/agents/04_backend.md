# Agent 04 — Backend Agent (Generic)

## 역할

API 명세를 기준으로 엔드포인트를 구현하고 DB 스키마를 설계합니다.
프로젝트의 기술 스택에 따라 해당 스택 가이드라인을 참조합니다.

## 스택 가이드라인 참조 방식

1. 프로젝트 `CLAUDE.md`에서 `be_stack` 값 확인
2. `pipeline/stacks/{be_stack}/backend-guidelines.md` 참조
3. 해당 가이드라인에 따라 코드 작성

> 예: be_stack이 `fastapi`이면 → `pipeline/stacks/fastapi/backend-guidelines.md`를 참조

## 전제 조건 (실행 전 필수 확인)

아래 항목을 모두 확인한 후에만 실행합니다.

```bash
# 1. GitHub 이슈 존재 확인
gh issue list --label "backend" --state open

# 2. 참조 문서 확인
ls docs/API명세초안.md docs/기능명세서.md

# 3. gh CLI 인증 확인
gh auth status
```

- BE 이슈 0개 → "Phase 2(이슈 생성)를 먼저 완료해주세요" 안내 후 중단
- 참조 문서 미존재 → "Phase 1(문서화)을 먼저 완료해주세요" 안내 후 중단

## 입력

- 할당된 BE 이슈 (GitHub)
- `docs/API명세초안.md` — 엔드포인트 정의
- `docs/기능명세서.md` — 비즈니스 로직, 예외 처리
- Mermaid 다이어그램 — ER(DB 구조), 시퀀스(통신 순서)

## 출력

- API 엔드포인트 코드 (프로젝트 `backend/` 디렉토리)
- DB 스키마 / 마이그레이션
- PR 생성

## 실행 절차

### Wave 기반 개발

1. Orchestrator로부터 `blocked by`가 없는 BE 이슈를 할당받음
2. **이슈 전용 브랜치 생성**: `git checkout -b feat/be-{이슈번호}-{설명}`
3. 이슈의 Acceptance Criteria를 읽고 **스택 가이드라인**을 참조하여 코드 작성
4. **`/commit` 커맨드로 커밋** (필수, 커밋 메시지에 이슈번호 포함)
5. PR 생성 (`gh pr create`) → GitHub 이슈 close (`gh issue close`)
6. 다음 Wave 이슈 자동 할당 (의존성 해제된 이슈)

> **주의**: 커밋 없이 다음 이슈로 넘어가는 것은 금지됩니다. 반드시 `/commit` 후 PR을 생성해야 합니다.

### API 연동 (Wave 3)

1. FE + BE 모든 이슈 완료 후 연동 단계 진입
2. FE Agent와 함께 실제 API 연동 확인
3. 통합 테스트 후 최종 PR 생성

## 코드 작성 규칙

- API명세의 엔드포인트, 요청/응답 구조 정확히 구현
- ER 다이어그램의 테이블 관계, 필드 타입 준수
- 기능명세서의 비즈니스 로직 (유효성 검사, 에러 처리, 정책) 구현
- 에러 코드는 API명세에 정의된 것과 일치
- DB 마이그레이션 파일 포함

## 도구

- `gh` CLI — PR 생성, 이슈 상태 관리

### 주요 명령어

```bash
# PR 생성
gh pr create --title "[BE] #15 POST /auth/login 엔드포인트" \
  --body "## 변경사항\n- ...\n\nCloses #15"

# 이슈 close
gh issue close 15

# PR 목록 확인
gh pr list
```

## 다음 단계

FE + BE 모든 이슈 완료 → API 연동 → Agent 05 (QA) 실행

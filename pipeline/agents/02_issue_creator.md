# Agent 02 — 이슈 생성 Agent

## 역할

승인된 문서를 페이지/컴포넌트/API 단위로 분해하여 GitHub 이슈를 자동 생성합니다.
이슈가 FE/BE/QA Agent의 작업 단위가 됩니다.

## 전제 조건 (실행 전 필수 확인)

아래 항목을 모두 확인한 후에만 실행합니다. 하나라도 미충족 시 실행을 중단하고 부족한 항목을 안내합니다.

```bash
# 1. Phase 1 산출물 확인
ls docs/화면명세서.md docs/기능명세서.md docs/API명세초안.md

# 2. 사용자 승인 확인
# → Phase 1 완료 후 사용자가 문서를 검토/승인했는지 확인

# 3. GitHub 도구 확인
gh --version && gh auth status && git remote -v
```

- `docs/` 문서 3종 미존재 → "Phase 1(문서화)을 먼저 완료해주세요" 안내 후 중단
- `gh` 미설치 또는 미인증 → 설치/인증 안내 후 중단
- 원격 저장소 미연결 → `git remote add origin` 안내 후 중단

## 입력

- 승인된 `docs/` 폴더 (화면명세서, 기능명세서, API명세초안)
- 프로젝트 CLAUDE.md의 GitHub 정보 (`github` 필드)

## 출력

- GitHub 이슈 (FE / BE / QA 라벨)
- 이슈별 Acceptance Criteria
- 이슈 간 의존성 연결 (`blocked by`)

## 실행 절차

1. `docs/` 폴더의 문서를 분석하여 작업 단위 분해
2. 분해 원칙: **하나의 이슈 = 하나의 PR이 될 수 있는 단위**
   - FE: 컴포넌트/페이지 단위
   - BE: 엔드포인트/스키마 단위
   - QA: 테스트 시나리오 단위
3. 각 이슈에 포함할 내용:
   - **제목**: `[FE]`, `[BE]`, `[QA]` 라벨 접두사
   - **본문**: 구현 요구사항, 참조 문서 경로
   - **Acceptance Criteria**: 체크리스트 형태
   - **의존성**: `blocked by #이슈번호` 관계 설정
4. GitHub에 이슈 생성 후 의존성 연결

## 이슈 분해 가이드

| 유형 | 분해 기준 | 예시 |
|---|---|---|
| FE | 독립된 컴포넌트 또는 페이지 단위 | LoginForm, SocialLoginButtons, /login 페이지 조립 |
| BE | 엔드포인트 또는 DB 스키마 단위 | POST /auth/login, DB 스키마 생성 |
| QA | 페이지 또는 기능 단위 (시나리오 묶음) | 로그인 페이지 E2E 테스트 |

## 의존성 규칙

- 페이지 조립 이슈 → `blocked by` 해당 페이지의 컴포넌트 이슈
- QA 이슈 → `blocked by` 관련 FE + BE 이슈 전체
- BE 엔드포인트 → `blocked by` DB 스키마 (필요 시)

## 사전 확인

이슈 생성 전 아래를 반드시 확인합니다:

```bash
gh --version          # gh CLI 설치 확인
gh auth status        # GitHub 인증 상태 확인
git remote -v         # 원격 저장소 연결 확인
```

- `gh` 미설치 시 → `brew install gh` 안내 후 중단
- 인증 미완료 시 → `gh auth login` 안내 후 중단
- 원격 저장소 미연결 시 → `git remote add origin <URL>` 안내 후 중단

## 도구

- `gh` CLI — 이슈 생성, 라벨 설정, 의존성 연결

### 주요 명령어

```bash
# 이슈 생성
gh issue create --title "[FE] LoginForm 컴포넌트 구현" \
  --body "## 요구사항\n- ...\n\n## Acceptance Criteria\n- [ ] ..." \
  --label "frontend"

# 라벨 생성 (최초 1회)
gh label create frontend --color 0075ca
gh label create backend --color e99695
gh label create qa --color d4c5f9

# 이슈 목록 확인
gh issue list --state open
```

## 이슈 기록

GitHub 이슈 생성 후 `docs/issues.md`에도 이슈 목록을 기록합니다:

```markdown
# 이슈 목록

| # | 라벨 | 제목 | 의존성 | 상태 |
|---|---|---|---|---|
| 1 | FE | LoginForm 컴포넌트 구현 | - | open |
| 2 | BE | POST /auth/login 엔드포인트 | - | open |
| 3 | QA | 로그인 페이지 E2E 테스트 | #1, #2 | open |
```

## 다음 단계

이슈 생성 완료 → Agent 03 (FE) + Agent 04 (BE) 병렬 실행

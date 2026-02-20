# Agent 02 — 이슈 생성 Agent

## 역할

승인된 문서를 페이지/컴포넌트/API 단위로 분해하여 GitHub 이슈를 자동 생성합니다.
이슈가 FE/BE/QA Agent의 작업 단위가 됩니다.

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

## 사용 MCP

- `GitHub MCP` — 이슈 생성, 라벨 설정, 의존성 연결

## 다음 단계

이슈 생성 완료 → Agent 03 (FE) + Agent 04 (BE) 병렬 실행

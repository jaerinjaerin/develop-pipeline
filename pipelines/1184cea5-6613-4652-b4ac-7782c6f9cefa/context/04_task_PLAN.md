# TASK CONTEXT — 기획자 (Mina)

## 1. 프로젝트 현황
- 서비스명: Pipeline Dashboard
- 현재 단계: PHASE 1 (기획)
- 기술 스택:
  - FE: Next.js 14 (App Router, TypeScript), Tailwind CSS + 커스텀 다크 테마 CSS 변수
  - BE: Next.js API Routes (pipeline 관련 4개 존재: start, stream, approve, outputs)
  - DB: 없음 (파일 기반 상태 관리)
  - 인증: 없음
  - 인프라: 없음 (.env 파일 없음, Docker 미구성)
- 기존 페이지: `/` (대시보드) 1개만 존재
- UI 라이브러리: 없음 (커스텀 컴포넌트)

## 2. 이번 요구사항

로그인 페이지 신규 구현. 현재 대시보드는 인증 없이 누구나 접근 가능한 상태이며, 사용자 인증 시스템이 전혀 존재하지 않는다. 로그인 페이지를 신규 구현하여 대시보드 접근을 인증된 사용자로 제한한다.

**영향 범위:**
| 영역 | 상세 |
|------|------|
| FE | 로그인 페이지 UI, 폼 유효성 검사, 인증 상태 관리, 라우트 보호(미인증 시 리다이렉트) |
| BE | 인증 API 엔드포인트 (로그인/로그아웃), 세션 또는 JWT 토큰 관리, 사용자 검증 로직 |
| DB | 사용자 테이블 신규 생성 (DB 도입 필요 — 현재 DB 없음) |
| Infra | DB 컨테이너 설정, 환경변수 관리 (JWT 시크릿, DB 연결 문자열), Docker 구성 |

**주요 결정 필요 사항 (기획에서 명확히 해야 함):**
1. DB 선택: 경량 DB(SQLite) vs 본격 DB(PostgreSQL) — 프로젝트 규모와 운영 환경 고려
2. 인증 방식: JWT(Stateless) vs Session(Stateful)
3. 회원가입 포함 여부: 로그인만 구현할지, 회원가입도 포함할지, 아니면 초기 관리자 계정 시딩 방식으로 할지
4. 기존 API 보호: 로그인 구현 후 기존 pipeline API 라우트에도 인증 미들웨어 적용 여부

## 3. 기획안
(이 파일의 목적이 기획안 작성이므로 해당 없음 — 당신이 작성할 산출물이 기획안이다.)

## 4. 내 역할 및 작업 지시
- **역할**: 기획자 (Mina)
- **해야 할 일**:
  1. `explore-codebase` skill을 사용하여 기존 서비스 코드베이스를 탐색하고 현재 구현 현황을 파악한다.
  2. `write-plan-doc` skill의 포맷 기준에 따라 기획안을 작성한다.
  3. Section 2의 "주요 결정 필요 사항" 4가지에 대해 명확한 방향을 제시한다.
  4. 로그인 플로우의 모든 시나리오 (성공, 실패, 엣지케이스)를 정의한다.

- **산출물**:
  - `context/01_plan.md` — Agent들이 참조할 기획안 (마크다운)
  - `context/01_plan.html` — 사용자가 검토할 시각적 보고서 (HTML)

- **산출물 포맷 (7개 섹션)**:
  1. 개요 (목적, 핵심 가치, 작업 범위)
  2. 유저 스토리
  3. 기능 명세 (표 형식)
  4. 화면 목록 (표 형식)
  5. API 초안 (Method / Path / 설명 / 인증 여부)
  6. 엣지케이스 & 예외 처리
  7. 비기능 요구사항 (성능, 보안, 접근성)

- **건드리면 안 되는 것**:
  - 기존 프로덕션 코드 수정
  - `context/00_requirements.md` 수정
  - 디자인이나 API 상세 설계 (Phase 2에서 담당)

## 5. 참고 자료
- 요구사항 분석: `context/00_requirements.md` (이 파일의 Section 1~2에 이미 포함됨)
- 기존 대시보드 코드: `/home/jrlee/document/jaerinjaerin/claude-guide/dashboard/` (explore-codebase skill로 탐색)
- 기존 API 라우트: pipeline 관련 4개 (start, stream, approve, outputs) — 탐색 시 인증 미들웨어 적용 방안도 고려할 것

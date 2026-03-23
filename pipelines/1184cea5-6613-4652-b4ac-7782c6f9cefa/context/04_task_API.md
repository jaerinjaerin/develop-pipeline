# TASK CONTEXT — BE 설계자 (Sam)

## 1. 프로젝트 현황

- 서비스명: Agent Pipeline Dashboard
- 현재 단계: Phase 2 — 설계 (API 명세 + ERD 작성)
- 기술 스택:
  - 프레임워크: Next.js 14 (App Router, TypeScript)
  - 스타일링: Tailwind CSS + 커스텀 다크 테마 CSS 변수
  - UI 라이브러리: 없음 (커스텀 컴포넌트)
  - 기존 페이지: `/` (대시보드) 1개만 존재
  - 기존 API 라우트: pipeline 관련 4개 (start, stream, approve, outputs)
  - 인증/인가: 없음 (이번에 신규 구현)
  - 데이터베이스: 없음 (이번에 SQLite 도입)
  - ORM: 없음 (이번에 도입 필요)

## 2. 이번 요구사항

로그인 페이지를 신규 구현하여 대시보드 접근을 인증된 사용자로 제한한다.

**작업 유형:** 신규 기능

**BE 영향 범위:**
- 인증 API 엔드포인트 (로그인/로그아웃/토큰 검증)
- JWT 토큰 발급 및 관리
- 사용자 테이블 신규 생성 (SQLite DB 도입)
- 비밀번호 해싱 (bcrypt)
- 초기 관리자 계정 시딩 스크립트
- 기존 pipeline API에 인증 미들웨어 적용

## 3. 기획안

### 3.1 기능 명세

| ID | 기능명 | 설명 | 우선순위 |
|----|-------|------|---------|
| F-02 | 로그인 API | 이메일/비밀번호를 받아 검증 후 JWT 액세스 토큰을 발급하는 API | P0 |
| F-03 | 라우트 가드 | 미인증 사용자가 대시보드(`/`) 또는 API에 접근하면 401 반환 | P0 |
| F-04 | JWT 토큰 관리 | httpOnly 쿠키에 JWT 토큰 저장. 토큰 만료 시 자동 로그아웃 | P0 |
| F-05 | 로그아웃 | 토큰 쿠키를 삭제하여 로그아웃 처리 | P0 |
| F-07 | 사용자 DB | SQLite 기반 사용자 테이블. bcrypt로 비밀번호 해싱 저장 | P0 |
| F-08 | 초기 계정 시딩 | 환경변수에서 초기 관리자 이메일/비밀번호를 읽어 DB에 시딩하는 스크립트 | P0 |
| F-09 | 기존 API 보호 | pipeline 관련 기존 API 라우트에 인증 미들웨어를 적용하여 미인증 요청을 차단 | P0 |

### 3.2 API 초안

| Method | Path | 설명 | 인증 여부 |
|--------|------|------|----------|
| POST | /api/auth/login | 이메일/비밀번호로 로그인, JWT 토큰을 httpOnly 쿠키에 설정 | N |
| POST | /api/auth/logout | 쿠키의 JWT 토큰을 삭제하여 로그아웃 처리 | Y |
| GET | /api/auth/me | 현재 로그인한 사용자 정보를 반환 (토큰 유효성 검증 포함) | Y |
| POST | /api/pipeline/start | (기존) 파이프라인 시작 — 인증 미들웨어 추가 | Y |
| GET | /api/pipeline/list | (기존) 파이프라인 목록 — 인증 미들웨어 추가 | Y |
| GET | /api/pipeline/[id] | (기존) 파이프라인 상세 — 인증 미들웨어 추가 | Y |
| POST | /api/pipeline/[id]/approve | (기존) 체크포인트 승인 — 인증 미들웨어 추가 | Y |
| GET | /api/pipeline/[id]/stream | (기존) SSE 스트림 — 인증 미들웨어 추가 | Y |
| GET | /api/pipeline/[id]/outputs/[file] | (기존) 산출물 조회 — 인증 미들웨어 추가 | Y |

### 3.3 엣지케이스 (BE 관련)

| ID | 상황 | 예상 동작 |
|----|------|----------|
| E-01 | 존재하지 않는 이메일로 로그인 시도 | "이메일 또는 비밀번호가 올바르지 않습니다" — 이메일 존재 여부 미노출 |
| E-02 | 잘못된 비밀번호로 로그인 시도 | E-01과 동일한 에러 메시지 (타이밍 공격 방지를 위해 동일 응답 시간) |
| E-03 | JWT 토큰 만료 후 API 요청 | 401 응답 반환 |
| E-07 | JWT 시크릿 환경변수 미설정 | 서버 시작 시 에러 로그 출력 및 기본값 사용 방지 (앱 시작 실패) |
| E-08 | 토큰이 변조된 요청 | 401 응답 반환, 쿠키 삭제 |
| E-09 | DB 파일 손상 또는 접근 불가 | 500 에러 반환, 서버 로그에 상세 에러 기록 |
| E-10 | SSE 스트림 연결 중 토큰 만료 | 스트림 연결 종료 |

### 3.4 비기능 요구사항 (BE 관련)

| 항목 | 기준 |
|------|------|
| 성능 | 로그인 API 응답 500ms 이내 (bcrypt cost factor 10~12) |
| 보안 | 비밀번호는 bcrypt로 해싱하여 저장 — 평문 저장 금지 |
| 보안 | JWT 토큰은 httpOnly + Secure + SameSite=Strict 쿠키에 저장 |
| 보안 | JWT 만료 시간 24시간 |
| 보안 | 로그인 실패 시 이메일 존재 여부 미노출 (열거 공격 방지) |
| 보안 | CSRF 방지를 위한 SameSite=Strict 쿠키 설정 |
| 인프라 | SQLite DB 파일은 프로젝트 루트의 data/ 디렉토리에 저장 |
| 인프라 | 환경변수: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD |

## 4. 내 역할 및 작업 지시

- **역할:** BE 설계자 (Sam) — Phase 2에서는 **설계만** 수행한다. 코드 구현은 Phase 3에서 한다.
- **해야 할 일:**
  1. `explore-be-codebase` skill로 기존 API 라우트 구조(Next.js App Router)를 파악한다
  2. 기획안의 API 초안을 기반으로 **상세 API 명세**를 작성한다:
     - 각 엔드포인트의 Request Body / Response Body 타입을 TypeScript로 정의
     - HTTP 상태 코드별 응답 명세
     - 에러 응답 형식 통일
     - 인증 미들웨어 적용 범위
  3. **ERD**를 작성한다:
     - 사용자(users) 테이블 스키마
     - 컬럼명, 타입, 제약조건, 인덱스
     - 향후 확장성 고려 (단, 현재 범위에서 구현하지 않을 것은 포함하지 않는다)
  4. **인증 흐름**을 설계한다:
     - JWT 토큰 생성/검증 흐름
     - 쿠키 설정 옵션
     - 미들웨어 적용 방식 (Next.js middleware.ts 또는 API Route 내 검증)

- **산출물:**
  - `context/03_api_spec.md` — 상세 API 명세
  - `context/03_erd.md` — ERD (테이블 & 관계)

- **핵심 주의사항:**
  - 이 Phase에서는 설계 문서만 작성한다. 코드를 작성하지 않는다.
  - Next.js App Router의 API Route 패턴(`app/api/*/route.ts`)을 기준으로 설계한다
  - 기존 pipeline API 라우트의 패턴을 파악하고 일관성을 유지한다
  - DB는 SQLite를 사용한다 (기획안에서 결정됨)
  - 에러 응답 형식을 통일한다: `{ success: false, error: { code, message, details } }`
- **건드리면 안 되는 것:** 프론트엔드 코드, 디자인 관련 파일, 실제 코드 구현

## 5. 참고 자료

- **기존 API 라우트:** `/home/jrlee/document/jaerinjaerin/claude-guide/dashboard/src/app/api/` (기존 패턴 파악용)
- **Next.js 설정:** `/home/jrlee/document/jaerinjaerin/claude-guide/dashboard/next.config.mjs`
- **패키지 정보:** `/home/jrlee/document/jaerinjaerin/claude-guide/dashboard/package.json` (현재 의존성 파악)
- **프로젝트 구조:** `/home/jrlee/document/jaerinjaerin/claude-guide/dashboard/src/` (전체 디렉토리 구조 파악)

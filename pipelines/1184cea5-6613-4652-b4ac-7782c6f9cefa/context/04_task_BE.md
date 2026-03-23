# TASK CONTEXT — BE 개발자 (Sam)

## 1. 프로젝트 현황

- 서비스명: Agent Pipeline Dashboard
- 현재 단계: Phase 3 — 구현
- 기술 스택:
  - Next.js 14 (App Router, TypeScript)
  - Tailwind CSS + 커스텀 다크 테마 CSS 변수
  - UI 라이브러리 없음 (커스텀 컴포넌트)
  - 인증/인가: 없음 (이번에 신규 구현)
  - 기존 페이지: `/` (대시보드) 1개
  - 기존 API: pipeline 관련 4개 (start, stream, approve, outputs)

## 2. 이번 요구사항

로그인 페이지를 신규 구현하여 대시보드 접근을 인증된 사용자로 제한한다.

**포함 범위:**
- 인증 API (로그인 / 로그아웃 / 토큰 검증)
- JWT 기반 인증 토큰 관리 (httpOnly 쿠키)
- SQLite DB 도입 + users 테이블 생성
- 초기 관리자 계정 시딩 스크립트
- 기존 pipeline API에 인증 미들웨어 적용
- bcrypt 비밀번호 해싱

**미포함:** 회원가입, 비밀번호 찾기, 소셜 로그인, 사용자 관리, RBAC

## 3. 기획안

### 기능 명세

| ID | 기능명 | 설명 | 우선순위 |
|----|-------|------|---------|
| F-02 | 로그인 API | 이메일/비밀번호 검증 후 JWT 액세스 토큰 발급 | P0 |
| F-03 | 라우트 가드 | 미인증 API 요청 시 401 반환 | P0 |
| F-04 | JWT 토큰 관리 | httpOnly 쿠키에 JWT 저장. 만료 시 401 | P0 |
| F-05 | 로그아웃 | 토큰 쿠키 삭제 | P0 |
| F-07 | 사용자 DB | SQLite 기반 users 테이블. bcrypt 비밀번호 해싱 | P0 |
| F-08 | 초기 계정 시딩 | 환경변수에서 관리자 계정 읽어 DB 시딩 | P0 |
| F-09 | 기존 API 보호 | pipeline API에 인증 미들웨어 적용 | P0 |

### 엣지케이스

| ID | 상황 | 예상 동작 |
|----|------|----------|
| E-01 | 존재하지 않는 이메일 | "이메일 또는 비밀번호가 올바르지 않습니다" (이메일 존재 여부 미노출) |
| E-02 | 잘못된 비밀번호 | E-01과 동일 메시지 + 타이밍 공격 방지 (더미 bcrypt.compare) |
| E-03 | JWT 토큰 만료 | 401 반환 |
| E-07 | JWT_SECRET 미설정 | 서버 시작 실패 |
| E-08 | 토큰 변조 | 401 반환 + 쿠키 삭제 |
| E-09 | DB 파일 접근 불가 | 500 에러 + 서버 로그 기록 |

## 4. 내 역할 및 작업 지시

- **역할:** 백엔드 개발자
- **해야 할 일:**
  1. SQLite DB 연결 설정 (`src/lib/db/index.ts`) — better-sqlite3 싱글턴
  2. 마이그레이션 파일 작성 (`src/lib/db/migrations/001_create_users.sql`)
  3. DB 초기화 로직 (마이그레이션 자동 실행)
  4. 초기 관리자 계정 시딩 스크립트 (`src/lib/db/seed.ts`)
  5. 비밀번호 해싱/비교 유틸 (`src/lib/auth/password.ts`) — bcryptjs, cost factor 12
  6. JWT 생성/검증 유틸 (`src/lib/auth/jwt.ts`) — jose 라이브러리
  7. 인증 미들웨어 (`src/lib/auth/middleware.ts`) — 쿠키에서 토큰 추출 → 검증
  8. 타입 정의 (`src/lib/auth/types.ts`)
  9. POST /api/auth/login 구현
  10. POST /api/auth/logout 구현
  11. GET /api/auth/me 구현
  12. 기존 pipeline API 라우트에 인증 미들웨어 적용
  13. 필요 패키지 설치: `better-sqlite3`, `@types/better-sqlite3`, `bcryptjs`, `@types/bcryptjs`, `jose`
- **산출물 형식:** API 라우트 + DB 마이그레이션 + 인증 유틸 모듈
- **건드리면 안 되는 것:** 프론트엔드 컴포넌트/페이지, CSS/Tailwind 설정, Docker/CI/CD 설정

### 작업 순서 권장

```
1단계 (선행 — Infra 환경변수 설정 완료 후):
  - 패키지 설치
  - DB 연결 + 마이그레이션
  - 시드 스크립트

2단계 (인증 모듈):
  - password.ts (bcrypt 유틸)
  - jwt.ts (JWT 유틸)
  - middleware.ts (인증 미들웨어)
  - types.ts

3단계 (API 구현):
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me

4단계 (기존 API 보호):
  - pipeline API 라우트에 인증 미들웨어 적용
```

## 5. 참고 자료

### API 명세 (03_api_spec.md 전문)

#### 인증 설계

- 방식: JWT (HS256), Stateless
- 저장: httpOnly 쿠키 (`token`)
- 만료: 24시간
- 쿠키 옵션: `httpOnly`, `secure` (production), `sameSite: strict`, `path: /`
- 시크릿: `JWT_SECRET` 환경변수 (필수, 미설정 시 시작 실패)

JWT Payload:
```typescript
interface JWTPayload {
  sub: string;    // user.id (UUID)
  email: string;
  role: string;
  iat: number;
  exp: number;    // iat + 24h
}
```

인증 미들웨어 흐름:
```
요청 → 쿠키에서 token 추출 → 없음 → 401
                              → JWT 검증 → 실패 → 401 + 쿠키 삭제
                                         → 성공 → payload를 request context에 첨부
```

#### POST /api/auth/login

인증 불필요.

Request: `{ email: string, password: string }`

Response 200:
```typescript
{
  success: true,
  user: { id: string, email: string, name: string, role: string }
}
// Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

Response 401: `{ success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다" }`
Response 400: `{ success: false, error: "..." }` (유효성 검사 실패)

처리 로직:
1. email, password 추출
2. 입력값 검증 (빈값, 이메일 형식)
3. email로 사용자 조회
4. 미존재 → 더미 해시에 bcrypt.compare (타이밍 공격 방지) → 401
5. bcrypt.compare(password, user.password_hash)
6. 불일치 → 401
7. 일치 → JWT 생성 → 쿠키 설정 → 200

#### POST /api/auth/logout

인증 필요.
Request: 본문 없음
Response 200: `{ success: true }` + `Set-Cookie: token=; Max-Age=0`

#### GET /api/auth/me

인증 필요.
Response 200: `{ success: true, user: { id, email, name, role } }`
Response 401: `{ success: false, error: "인증이 필요합니다" }`

#### 기존 Pipeline API 보호

| Method | Path | 변경 |
|--------|------|------|
| POST | /api/pipeline/start | 인증 미들웨어 추가 |
| GET | /api/pipeline/list | 인증 미들웨어 추가 |
| GET | /api/pipeline/[id] | 인증 미들웨어 추가 |
| POST | /api/pipeline/[id]/approve | 인증 미들웨어 추가 |
| GET | /api/pipeline/[id]/stream | 인증 미들웨어 추가 (SSE 쿠키 검증) |
| GET | /api/pipeline/[id]/outputs/[file] | 인증 미들웨어 추가 |

미인증 응답: `401 { success: false, error: "인증이 필요합니다" }`

#### 에러 응답 형식

성공: `{ success: true, [key]: data }`
실패: `{ success: false, error: "메시지" }`
코드: 200 성공, 400 입력 오류, 401 미인증, 500 서버 에러

#### 보안 고려사항

| 항목 | 구현 방식 |
|------|----------|
| 비밀번호 저장 | bcrypt (cost factor 12) |
| 타이밍 공격 방지 | 이메일 미존재 시에도 bcrypt.compare 실행 |
| 열거 공격 방지 | 로그인 실패 시 동일 에러 메시지 |
| XSS 토큰 탈취 방지 | httpOnly 쿠키 |
| CSRF 방지 | SameSite=Strict |
| JWT 시크릿 | 환경변수 필수, 미설정 시 시작 차단 |
| 토큰 변조 | JWT 서명 검증 실패 시 401 + 쿠키 삭제 |

### ERD (03_erd.md 전문)

#### users 테이블

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | TEXT (UUID) | PK | 사용자 고유 식별자 |
| email | TEXT | UNIQUE, NOT NULL | 로그인 이메일 |
| password_hash | TEXT | NOT NULL | bcrypt 해싱된 비밀번호 |
| name | TEXT | NOT NULL | 표시 이름 |
| role | TEXT | NOT NULL, DEFAULT 'admin' | 사용자 역할 |
| created_at | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성 시각 |
| updated_at | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정 시각 |

인덱스: `idx_users_email` — email (UNIQUE)

#### DB 설정

- DBMS: SQLite (파일 기반, 별도 서버 불필요)
- 드라이버: better-sqlite3 (동기 API)
- 파일 위치: `data/app.db`
- 마이그레이션: `src/lib/db/migrations/` 디렉토리에 순번 SQL 파일

#### 시딩

환경변수: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
로직: email 없으면 INSERT, 있으면 SKIP (멱등), 비밀번호 bcrypt(cost=12) 해싱

### 디렉토리 구조

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts              # SQLite 연결 싱글턴 + 마이그레이션 실행
│   │   ├── migrations/
│   │   │   └── 001_create_users.sql
│   │   └── seed.ts               # 초기 관리자 계정 시딩
│   └── auth/
│       ├── jwt.ts                # JWT 생성/검증
│       ├── middleware.ts         # 인증 미들웨어
│       ├── password.ts           # bcrypt 유틸
│       └── types.ts              # 타입 정의
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       └── pipeline/             # 기존 (인증 미들웨어 추가)
```

### 환경변수

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `JWT_SECRET` | 예 | 없음 (미설정 시 시작 실패) | JWT 서명 시크릿 (최소 32자) |
| `ADMIN_EMAIL` | 예 | 없음 | 초기 관리자 이메일 |
| `ADMIN_PASSWORD` | 예 | 없음 | 초기 관리자 비밀번호 |
| `JWT_EXPIRES_IN` | 아니오 | `24h` | JWT 만료 시간 |

### 의존성 패키지

| 패키지 | 용도 |
|--------|------|
| `better-sqlite3` + `@types/better-sqlite3` | SQLite 드라이버 |
| `bcryptjs` + `@types/bcryptjs` | 비밀번호 해싱 |
| `jose` | JWT 생성/검증 (Web Crypto API 기반) |

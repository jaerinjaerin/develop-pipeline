# API 명세: 로그인 인증 시스템

## 1. 인증 설계

### 방식: JWT (Stateless)

| 항목 | 설정값 | 사유 |
|------|--------|------|
| 토큰 타입 | JWT (HS256) | 단일 서버 환경, 비대칭 키 불필요 |
| 저장 위치 | httpOnly 쿠키 (`token`) | XSS로 토큰 탈취 방지 |
| 만료 시간 | 24시간 | 기획안 비기능 요구사항 준수 |
| 쿠키 옵션 | `httpOnly`, `secure` (production), `sameSite: strict`, `path: /` | CSRF 방지, 보안 강화 |
| 시크릿 관리 | `JWT_SECRET` 환경변수 (필수) | 미설정 시 서버 시작 실패 |

### JWT Payload

```typescript
interface JWTPayload {
  sub: string;    // user.id (UUID)
  email: string;  // user.email
  role: string;   // user.role
  iat: number;    // 발급 시각 (Unix timestamp)
  exp: number;    // 만료 시각 (Unix timestamp, iat + 24h)
}
```

### 인증 미들웨어 동작

```
요청 수신
  → 쿠키에서 `token` 추출
  → 토큰 없음 → 401 반환
  → JWT 검증 (시크릿, 만료)
    → 실패 → 401 반환 + 쿠키 삭제
    → 성공 → payload를 request context에 첨부 → 다음 핸들러
```

---

## 2. 인증 API 엔드포인트

### POST /api/auth/login

이메일/비밀번호로 로그인하고 JWT 토큰을 httpOnly 쿠키에 설정한다.

**인증 필요:** 아니오

**Request:**

```typescript
// Content-Type: application/json
interface LoginRequest {
  email: string;     // 이메일 주소
  password: string;  // 비밀번호 (평문)
}
```

**Response — 성공 (200):**

```typescript
interface LoginResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
// Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

**Response — 실패 (401):**

```typescript
interface LoginErrorResponse {
  success: false;
  error: "이메일 또는 비밀번호가 올바르지 않습니다";
}
```

**Response — 유효성 검사 실패 (400):**

```typescript
interface ValidationErrorResponse {
  success: false;
  error: string;  // "email은 필수입니다" | "password는 필수입니다" | "올바른 이메일 형식이 아닙니다"
}
```

**처리 로직:**
1. 요청 본문에서 email, password 추출
2. 입력값 검증 (빈값, 이메일 형식)
3. email로 사용자 조회
4. 사용자 미존재 → bcrypt.compare를 더미 해시에 실행 (타이밍 공격 방지) → 401
5. bcrypt.compare(password, user.password_hash)
6. 불일치 → 401 (동일 에러 메시지)
7. 일치 → JWT 생성 → 쿠키 설정 → 200 + 사용자 정보

---

### POST /api/auth/logout

쿠키의 JWT 토큰을 삭제하여 로그아웃 처리한다.

**인증 필요:** 예

**Request:** 본문 없음

**Response — 성공 (200):**

```typescript
interface LogoutResponse {
  success: true;
}
// Set-Cookie: token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

**Response — 미인증 (401):**

```typescript
interface UnauthorizedResponse {
  success: false;
  error: "인증이 필요합니다";
}
```

---

### GET /api/auth/me

현재 로그인한 사용자 정보를 반환한다. 토큰 유효성 검증 겸용.

**인증 필요:** 예

**Request:** 없음 (쿠키의 JWT 토큰으로 인증)

**Response — 성공 (200):**

```typescript
interface MeResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
```

**Response — 미인증 (401):**

```typescript
interface UnauthorizedResponse {
  success: false;
  error: "인증이 필요합니다";
}
```

---

## 3. 기존 Pipeline API (인증 미들웨어 추가)

기존 pipeline API 라우트 전체에 인증 미들웨어를 적용한다. 미인증 요청은 401을 반환한다.

| Method | Path | 변경사항 |
|--------|------|---------|
| POST | /api/pipeline/start | 인증 미들웨어 추가 |
| GET | /api/pipeline/list | 인증 미들웨어 추가 |
| GET | /api/pipeline/[id] | 인증 미들웨어 추가 |
| POST | /api/pipeline/[id]/approve | 인증 미들웨어 추가 |
| GET | /api/pipeline/[id]/stream | 인증 미들웨어 추가 (SSE 연결 시 쿠키 검증) |
| GET | /api/pipeline/[id]/outputs/[file] | 인증 미들웨어 추가 |

**미인증 응답 (공통):**

```typescript
// 401 Unauthorized
{
  success: false,
  error: "인증이 필요합니다"
}
```

---

## 4. 서비스 경계 및 모듈 구조

### 디렉토리 구조

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts              # SQLite 연결 싱글턴 + 마이그레이션 실행
│   │   ├── migrations/
│   │   │   └── 001_create_users.sql  # users 테이블 생성
│   │   └── seed.ts               # 초기 관리자 계정 시딩
│   └── auth/
│       ├── jwt.ts                # JWT 생성/검증 유틸
│       ├── middleware.ts         # 인증 미들웨어 (쿠키 → JWT 검증 → user context)
│       ├── password.ts           # bcrypt 해싱/비교 유틸
│       └── types.ts              # 인증 관련 TypeScript 타입
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts    # POST /api/auth/login
│       │   ├── logout/route.ts   # POST /api/auth/logout
│       │   └── me/route.ts       # GET /api/auth/me
│       └── pipeline/             # 기존 라우트 (인증 미들웨어 추가)
```

### 모듈 의존성

```
[API Routes]
  ├── auth/login    → password.ts, jwt.ts, db/index.ts
  ├── auth/logout   → middleware.ts, jwt.ts
  ├── auth/me       → middleware.ts, db/index.ts
  └── pipeline/*    → middleware.ts (추가)

[lib/auth]
  ├── middleware.ts  → jwt.ts
  ├── jwt.ts        → (jose 라이브러리)
  ├── password.ts   → (bcryptjs 라이브러리)
  └── types.ts      → (의존성 없음)

[lib/db]
  ├── index.ts      → (better-sqlite3)
  └── seed.ts       → password.ts, index.ts
```

### 의존성 패키지 (신규 추가 필요)

| 패키지 | 용도 | 사유 |
|--------|------|------|
| `better-sqlite3` | SQLite 드라이버 | 동기 API, 성능 우수, Next.js 서버 사이드 호환 |
| `@types/better-sqlite3` | 타입 정의 | TypeScript 지원 |
| `bcryptjs` | 비밀번호 해싱 | 순수 JS 구현, native 빌드 불필요 |
| `@types/bcryptjs` | 타입 정의 | TypeScript 지원 |
| `jose` | JWT 생성/검증 | Web Crypto API 기반, Edge Runtime 호환 |

---

## 5. 환경변수

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `JWT_SECRET` | 예 | 없음 (미설정 시 시작 실패) | JWT 서명 시크릿 (최소 32자 권장) |
| `ADMIN_EMAIL` | 예 | 없음 | 초기 관리자 이메일 |
| `ADMIN_PASSWORD` | 예 | 없음 | 초기 관리자 비밀번호 (시딩 시 bcrypt 해싱) |
| `JWT_EXPIRES_IN` | 아니오 | `24h` | JWT 토큰 만료 시간 |

**.env.example:**

```
JWT_SECRET=your-secret-key-at-least-32-characters-long
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
JWT_EXPIRES_IN=24h
```

---

## 6. 에러 응답 형식 (공통)

모든 API는 일관된 응답 형식을 사용한다.

**성공:**

```typescript
interface SuccessResponse<T> {
  success: true;
  [key: string]: T;  // 엔드포인트별 데이터
}
```

**실패:**

```typescript
interface ErrorResponse {
  success: false;
  error: string;  // 사용자 표시용 에러 메시지
}
```

**HTTP 상태 코드:**

| 코드 | 의미 | 사용 상황 |
|------|------|----------|
| 200 | 성공 | 정상 처리 |
| 400 | 잘못된 요청 | 입력값 검증 실패 |
| 401 | 미인증 | 토큰 없음, 만료, 변조 |
| 500 | 서버 에러 | DB 오류, 예기치 않은 에러 |

---

## 7. 보안 고려사항

| 항목 | 구현 방식 |
|------|----------|
| 비밀번호 저장 | bcrypt (cost factor 12) |
| 타이밍 공격 방지 | 이메일 미존재 시에도 bcrypt.compare 실행 |
| 열거 공격 방지 | 로그인 실패 시 동일 에러 메시지 ("이메일 또는 비밀번호가 올바르지 않습니다") |
| XSS 토큰 탈취 방지 | httpOnly 쿠키 |
| CSRF 방지 | SameSite=Strict 쿠키 |
| JWT 시크릿 관리 | 환경변수 필수, 미설정 시 앱 시작 차단 |
| 토큰 변조 감지 | JWT 서명 검증 실패 시 401 + 쿠키 삭제 |

# TASK CONTEXT — FE 개발자 (Jay)

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
- 로그인 페이지 UI (이메일 + 비밀번호 폼)
- JWT 기반 인증 토큰 관리 (httpOnly 쿠키)
- 미인증 사용자 리다이렉트 (라우트 가드)
- 대시보드 헤더에 사용자 정보/로그아웃 버튼 추가
- 클라이언트 사이드 폼 유효성 검사

**미포함:** 회원가입, 비밀번호 찾기, 소셜 로그인, 사용자 관리, RBAC

## 3. 기획안

### 기능 명세

| ID | 기능명 | 설명 | 우선순위 |
|----|-------|------|---------|
| F-01 | 로그인 폼 | 이메일, 비밀번호 입력 필드와 로그인 버튼. 클라이언트 유효성 검사 포함 | P0 |
| F-03 | 라우트 가드 | 미인증 사용자가 대시보드(`/`) 또는 API 접근 시 `/login`으로 리다이렉트 | P0 |
| F-04 | JWT 토큰 관리 | httpOnly 쿠키에 JWT 저장. 만료 시 자동 로그아웃 | P0 |
| F-05 | 로그아웃 | 토큰 쿠키 삭제 후 로그인 페이지로 이동 | P0 |
| F-06 | 폼 유효성 검사 | 이메일 형식 검증, 비밀번호 빈값 검증. 에러 메시지 실시간 표시 | P1 |
| F-10 | 로그인 상태 표시 | 대시보드 헤더에 사용자 이메일 + 로그아웃 버튼 | P1 |

### 화면 목록

| ID | 화면명 | 경로 | 주요 요소 |
|----|-------|------|----------|
| S-01 | 로그인 페이지 | /login | 로고/앱 타이틀, 이메일 입력, 비밀번호 입력, 로그인 버튼, 에러 메시지 영역 |
| S-02 | 대시보드 (수정) | / | 기존 대시보드 + 헤더에 사용자 정보/로그아웃 버튼 추가 |

### 엣지케이스

| ID | 상황 | 예상 동작 |
|----|------|----------|
| E-03 | JWT 토큰 만료 후 API 요청 | 401 응답 감지 → 로그인 페이지로 리다이렉트 |
| E-04 | 이미 로그인한 사용자가 /login 접근 | 대시보드(`/`)로 리다이렉트 |
| E-05 | 빈 이메일 또는 비밀번호로 제출 | 클라이언트 사이드에서 제출 차단, 인라인 에러 표시 |
| E-06 | 잘못된 형식의 이메일 입력 | 이메일 형식 검증 실패 메시지 표시 |
| E-10 | SSE 스트림 연결 중 토큰 만료 | 스트림 종료, 재인증 요청 |

## 4. 내 역할 및 작업 지시

- **역할:** 프론트엔드 개발자
- **해야 할 일:**
  1. 공통 컴포넌트 구현: `TextInput`, `Button`, `UserBadge`
  2. 로그인 페이지 구현: `app/login/page.tsx` + `LoginForm` 컴포넌트
  3. 폼 유효성 검사 로직 구현 (클라이언트 사이드)
  4. 로그인 API 연동 (`POST /api/auth/login`)
  5. 로그아웃 API 연동 (`POST /api/auth/logout`)
  6. 라우트 가드 구현: 미인증 시 `/login` 리다이렉트, 인증 시 `/login`에서 `/` 리다이렉트
  7. 대시보드 헤더 수정: UserBadge 추가 (`GET /api/auth/me`로 사용자 정보 조회)
  8. 401 응답 글로벌 처리: API 응답이 401이면 로그인 페이지로 리다이렉트
- **산출물 형식:** React 컴포넌트 + 페이지 라우팅
- **건드리면 안 되는 것:** API 서버 코드 (`src/lib/` 하위의 auth/db 모듈), DB 스키마, 환경변수 설정, Docker/CI/CD 설정

### 작업 순서 권장

```
1단계 (독립 착수):
  - TextInput, Button 공통 컴포넌트 구현
  - LoginForm 컴포넌트 구현 (폼 UI + 유효성 검사)
  - 로그인 페이지 (app/login/page.tsx)

2단계 (BE API 완료 후):
  - 로그인 API 연동
  - 로그아웃 API 연동
  - GET /api/auth/me 연동
  - 라우트 가드 구현
  - 대시보드 헤더 수정 (UserBadge)
  - 401 글로벌 핸들링
```

## 5. 참고 자료

### 디자인 명세 (02_design_spec.md 전문)

#### 디자인 토큰

**색상:**

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--bg-body` | `#0a0a14` | 페이지 배경 |
| `--bg-card` | `#1a1a2e` | 로그인 카드 배경 |
| `--bg-input` | `#12121e` | 입력 필드 배경 |
| `--border-default` | `#1e1e30` | 카드/입력 필드 기본 테두리 |
| `--border-focus` | `#2e2e50` | 입력 필드 포커스 테두리 |
| `--border-error` | `#e74c3c` | 유효성 검사 실패 테두리 |
| `--text-primary` | `#ffffff` | 제목, 버튼 텍스트 |
| `--text-secondary` | `#888888` | 라벨, 보조 텍스트 |
| `--text-muted` | `#555555` | placeholder |
| `--text-error` | `#e74c3c` | 에러 메시지 |
| `--accent-blue` | `#3498db` | 로그인 버튼 배경, 포커스 링 |
| `--accent-blue-hover` | `#2980b9` | 로그인 버튼 hover |
| `--accent-blue-disabled` | `rgba(52, 152, 219, 0.4)` | 버튼 비활성 |

**타이포그래피:**

| 토큰명 | 크기 | 굵기 | 용도 |
|--------|------|------|------|
| `heading-lg` | 24px (`text-2xl`) | `font-bold` | 앱 타이틀 |
| `heading-sm` | 14px (`text-sm`) | `font-semibold` | 카드 제목, 라벨 |
| `body` | 13px (`text-xs`) | `font-medium` | 입력 필드 텍스트 |
| `caption` | 12px (`text-xs`) | `font-normal` | 에러 메시지, 힌트 |

- Font: `'Inter', system-ui, -apple-system, sans-serif`

**간격:** `space-xs` 4px, `space-sm` 8px, `space-md` 16px, `space-lg` 24px, `space-xl` 32px

**반경:** `radius-card` 12px (`rounded-xl`), `radius-input` 8px (`rounded-lg`)

**그림자:** `shadow-card` `0 4px 24px rgba(0, 0, 0, 0.5)`, `shadow-input-focus` `0 0 0 2px rgba(52, 152, 219, 0.3)`

#### 컴포넌트 상세

**TextInput Props:**

```typescript
interface TextInputProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}
```

상태별 스타일:
- Default: border `--border-default`, bg `--bg-input`
- Hover: border `#2e2e4a`
- Focus: border `--border-focus`, shadow `shadow-input-focus`
- Error: border `--border-error`, 하단 에러 메시지
- Disabled: `opacity: 0.5`, cursor `not-allowed`
- label-input 간격 8px, input-error 간격 4px, input height 44px (`h-11`), padding `px-3`

**Button Props:**

```typescript
interface ButtonProps {
  children: React.ReactNode;
  type?: 'submit' | 'button';
  variant: 'primary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

Primary 상태별: Default `--accent-blue`, Hover `--accent-blue-hover` + `brightness-110`, Active `scale(0.98)`, Disabled `opacity: 0.4`, Loading 스피너 (16px, `animate-spin`)
Ghost 상태별: Default 투명/`--text-secondary`, Hover `rgba(255,255,255,0.05)`/`--text-primary`
공통: height 44px, radius 8px, font `text-sm font-semibold`, width 100%, transition `all 0.2s`

**UserBadge Props:**

```typescript
interface UserBadgeProps {
  email: string;
  onLogout: () => void;
}
```

- 이메일: `text-xs`, `--text-secondary`, truncate
- 로그아웃: ghost 버튼, `text-xs`
- 구분선: `border-l --border-default`
- 높이 32px, gap-2
- 모바일(<480px): 이메일 숨기고 로그아웃 아이콘만

#### 레이아웃

**로그인 페이지:**
- 카드: max-w 400px, padding 24px, shadow-card, radius-card, bg-card
- 정중앙: `min-h-screen flex items-center justify-center`
- 구성: 🤖 이모지(48px) → "Agent Pipeline Dashboard" (heading-lg) → "계속하려면 로그인하세요" (caption, --text-secondary) → gap 32px → 이메일 필드 → gap 16px → 비밀번호 필드 → gap 24px → 로그인 버튼 → gap 16px → 서버 에러 박스 (조건부)
- 반응형: ≥768px 카드 중앙, 480-767px 좌우 px-6, <480px 전체 너비 px-4 shadow 제거 border 유지

**대시보드 헤더 수정:**
- UserBadge를 "새 요청" 버튼 왼쪽에 배치
- `flex items-center gap-3`
- 모바일(<480px): 이메일 숨기고 로그아웃 아이콘만

#### 인터랙션 플로우

```
[페이지 로드] → 이메일 autoFocus, 카드 fade-in (0.4s ease-out, translateY 8→0)
[입력 중] → 포커스 border/shadow 전환 (0.2s)
[Tab] → 이메일 → 비밀번호 → 로그인 버튼
[제출] → 유효성 검사 → 실패: error border + 메시지 fade-in (0.15s) / 성공: 버튼 loading, 필드 disabled
[API 성공] → router.push('/')
[API 실패] → loading 해제, 에러 박스 slide-down+fade-in (0.2s), 비밀번호 초기화+focus
[로그아웃] → POST /api/auth/logout → router.push('/login')
[401 감지] → 로그인 페이지로 즉시 리다이렉트
```

**서버 에러 박스:** bg `rgba(231,76,60,0.1)`, border `rgba(231,76,60,0.3)`, text `--text-error text-xs`, radius 8px, padding `px-3 py-2.5`, ⚠ 아이콘

#### 접근성

- `<main>`, `<form noValidate>`, `<label htmlFor>`, `<input required>`
- 이메일: `id="email"`, `type="email"`, `autoComplete="email"`
- 비밀번호: `id="password"`, `type="password"`, `autoComplete="current-password"`
- 서버 에러: `role="alert"`, `aria-live="assertive"`
- 인라인 에러: `aria-describedby`로 입력과 연결
- Loading 버튼: `aria-busy="true"`, `aria-label="로그인 처리 중"`, 스피너 `aria-hidden="true"`
- 키보드: Tab 순서 이메일→비밀번호→버튼, Enter 제출

#### 유효성 검사 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|-----------|
| 이메일 | 빈값 | "이메일을 입력해주세요" |
| 이메일 | 형식 (`/.+@.+\..+/`) | "올바른 이메일 형식이 아닙니다" |
| 비밀번호 | 빈값 | "비밀번호를 입력해주세요" |

#### 서버 에러 매핑

| 상태 코드 | 표시 메시지 |
|----------|-----------|
| 401 | "이메일 또는 비밀번호가 올바르지 않습니다" |
| 500 | "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요" |
| Network Error | "네트워크 연결을 확인해주세요" |

### API 명세

**POST /api/auth/login** (인증 불필요)

Request:
```json
{ "email": "string", "password": "string" }
```

Response 200:
```json
{
  "success": true,
  "user": { "id": "string", "email": "string", "name": "string", "role": "string" }
}
// Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

Response 401: `{ "success": false, "error": "이메일 또는 비밀번호가 올바르지 않습니다" }`
Response 400: `{ "success": false, "error": "email은 필수입니다" | "password는 필수입니다" | "올바른 이메일 형식이 아닙니다" }`

**POST /api/auth/logout** (인증 필요)

Response 200: `{ "success": true }`
// Set-Cookie: token=; Max-Age=0

**GET /api/auth/me** (인증 필요)

Response 200:
```json
{
  "success": true,
  "user": { "id": "string", "email": "string", "name": "string", "role": "string" }
}
```

Response 401: `{ "success": false, "error": "인증이 필요합니다" }`

### 파일 배치 가이드

```
src/
├── app/
│   └── login/
│       └── page.tsx          ← 로그인 페이지
├── components/
│   ├── LoginForm.tsx         ← 로그인 폼 (폼 로직 + 유효성 검사)
│   ├── TextInput.tsx         ← 공통 입력 컴포넌트
│   ├── Button.tsx            ← 공통 버튼 컴포넌트
│   └── UserBadge.tsx         ← 헤더 사용자 정보
```

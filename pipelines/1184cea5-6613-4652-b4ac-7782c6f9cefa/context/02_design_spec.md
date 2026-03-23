# 02_design_spec.md — 로그인 페이지 디자인 명세

---

## 1. 디자인 토큰

기존 대시보드의 다크 테마를 그대로 계승한다. 신규 토큰은 로그인 페이지에 필요한 최소한만 추가한다.

### 1.1 색상

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

### 1.2 타이포그래피

| 토큰명 | 크기 | 굵기 | 용도 |
|--------|------|------|------|
| `heading-lg` | 24px (`text-2xl`) | `font-bold` | 앱 타이틀 |
| `heading-sm` | 14px (`text-sm`) | `font-semibold` | 카드 제목, 라벨 |
| `body` | 13px (`text-xs`) | `font-medium` | 입력 필드 텍스트 |
| `caption` | 12px (`text-xs`) | `font-normal` | 에러 메시지, 힌트 |

- Font: `'Inter', system-ui, -apple-system, sans-serif`
- Smoothing: antialiased

### 1.3 간격

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `space-xs` | 4px (`gap-1`) | 아이콘-텍스트 간격 |
| `space-sm` | 8px (`gap-2`) | 에러 메시지 위 여백 |
| `space-md` | 16px (`gap-4`) | 필드 간 간격 |
| `space-lg` | 24px (`gap-6`) | 카드 내부 패딩 |
| `space-xl` | 32px (`gap-8`) | 섹션 간 간격 |

### 1.4 반경

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `radius-card` | 12px (`rounded-xl`) | 로그인 카드 |
| `radius-input` | 8px (`rounded-lg`) | 입력 필드, 버튼 |

### 1.5 그림자

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `shadow-card` | `0 4px 24px rgba(0, 0, 0, 0.5)` | 로그인 카드 |
| `shadow-input-focus` | `0 0 0 2px rgba(52, 152, 219, 0.3)` | 입력 필드 포커스 |

---

## 2. 공통 컴포넌트

### 2.1 TextInput

이메일, 비밀번호 입력에 공통으로 사용하는 텍스트 입력 컴포넌트.

**Props:**

```typescript
interface TextInputProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;          // 에러 메시지 (있으면 에러 상태)
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}
```

**상태별 스타일:**

| 상태 | 테두리 | 배경 | 기타 |
|------|--------|------|------|
| Default | `--border-default` | `--bg-input` | — |
| Hover | `#2e2e4a` | `--bg-input` | — |
| Focus | `--border-focus` | `--bg-input` | `shadow-input-focus` 적용 |
| Error | `--border-error` | `--bg-input` | 하단에 에러 메시지 표시 |
| Disabled | `--border-default` | `--bg-input` | `opacity: 0.5`, 커서 `not-allowed` |

**구조:**
```
┌─ label (text-sm, font-semibold, --text-secondary) ─────────┐
│                                                              │
│  ┌─ input ────────────────────────────────────────────────┐  │
│  │  placeholder (--text-muted)                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ⚠ error message (text-xs, --text-error)                     │
└──────────────────────────────────────────────────────────────┘
```

- label과 input 사이: `space-sm` (8px)
- input과 error 사이: `space-xs` (4px)
- input height: 44px (`h-11`)
- input padding: `px-3`

### 2.2 Button

로그인 제출 버튼. 기존 대시보드의 버튼 패턴을 따른다.

**Props:**

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

**상태별 스타일 (variant: primary):**

| 상태 | 배경 | 텍스트 | 기타 |
|------|------|--------|------|
| Default | `--accent-blue` | `--text-primary` | — |
| Hover | `--accent-blue-hover` | `--text-primary` | `brightness-110` |
| Active | `--accent-blue-hover` | `--text-primary` | `scale(0.98)` |
| Disabled | `--accent-blue-disabled` | `--text-primary` | `opacity: 0.4`, 커서 `not-allowed` |
| Loading | `--accent-blue-disabled` | 숨김 | 스피너 표시, 클릭 비활성 |

**상태별 스타일 (variant: ghost):**

| 상태 | 배경 | 텍스트 | 기타 |
|------|------|--------|------|
| Default | 투명 | `--text-secondary` | — |
| Hover | `rgba(255,255,255,0.05)` | `--text-primary` | — |

**구조:**
- height: 44px (`h-11`)
- border-radius: `radius-input` (8px)
- font: `text-sm`, `font-semibold`
- width: 100% (로그인 폼 내에서)
- transition: `all 0.2s ease-in-out`

**Loading 스피너:**
- 16px 원형, `border-2 border-white/30 border-t-white`
- `animate-spin`
- 버튼 중앙 정렬

### 2.3 UserBadge

대시보드 헤더에 표시할 로그인 사용자 정보 + 로그아웃 버튼.

**Props:**

```typescript
interface UserBadgeProps {
  email: string;
  onLogout: () => void;
}
```

**구조:**
```
┌──────────────────────────────────────┐
│  📧 user@email.com  │  로그아웃 ▸   │
└──────────────────────────────────────┘
```

- 이메일: `text-xs`, `--text-secondary`, 최대 너비 제한 + `truncate`
- 로그아웃 버튼: `variant: ghost`, `text-xs`
- 구분선: `border-l`, `--border-default`
- 전체 높이: 32px
- 간격: `gap-2`

---

## 3. 화면별 레이아웃

### 3.1 S-01: 로그인 페이지 (`/login`)

**레이아웃 (데스크톱, ≥768px):**

```
┌─────────────────────────────────────────────────────────────┐
│                     body (--bg-body)                         │
│                                                              │
│                                                              │
│            ┌────────────────────────────────┐                │
│            │      LOGIN CARD (--bg-card)    │                │
│            │      max-w: 400px              │                │
│            │      padding: space-lg (24px)  │                │
│            │      shadow: shadow-card       │                │
│            │      radius: radius-card       │                │
│            │                                │                │
│            │   ┌──────────────────────┐     │                │
│            │   │  🤖  (48px emoji)    │     │                │
│            │   └──────────────────────┘     │                │
│            │                                │                │
│            │   Agent Pipeline Dashboard     │                │
│            │   (heading-lg, center)         │                │
│            │                                │                │
│            │   계속하려면 로그인하세요       │                │
│            │   (caption, --text-secondary)  │                │
│            │                                │                │
│            │   ── gap: space-xl (32px) ──   │                │
│            │                                │                │
│            │   [이메일 label]               │                │
│            │   ┌──────────────────────┐     │                │
│            │   │ name@example.com     │     │                │
│            │   └──────────────────────┘     │                │
│            │   ⚠ 에러 메시지 (조건부)       │                │
│            │                                │                │
│            │   ── gap: space-md (16px) ──   │                │
│            │                                │                │
│            │   [비밀번호 label]              │                │
│            │   ┌──────────────────────┐     │                │
│            │   │ ••••••••             │     │                │
│            │   └──────────────────────┘     │                │
│            │   ⚠ 에러 메시지 (조건부)       │                │
│            │                                │                │
│            │   ── gap: space-lg (24px) ──   │                │
│            │                                │                │
│            │   ┌──────────────────────┐     │                │
│            │   │      로그인          │     │                │
│            │   └──────────────────────┘     │                │
│            │                                │                │
│            │   ── gap: space-md (16px) ──   │                │
│            │                                │                │
│            │   ┌──────────────────────┐     │                │
│            │   │  ⚠ 서버 에러 메시지  │     │                │
│            │   │  (조건부, 전체 너비) │     │                │
│            │   └──────────────────────┘     │                │
│            │                                │                │
│            └────────────────────────────────┘                │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**반응형 3단계:**

| 단계 | Breakpoint | 변경 사항 |
|------|-----------|----------|
| Desktop | ≥768px | 카드 `max-w-[400px]`, 수평/수직 중앙 정렬 |
| Tablet | 480–767px | 카드 `max-w-[400px]`, 좌우 `px-6` 여백 |
| Mobile | <480px | 카드 전체 너비 (`w-full`), 좌우 `px-4` 여백, 카드 `shadow` 제거, `border` 유지 |

**카드 정중앙 배치:**
- `min-h-screen flex items-center justify-center`
- 모바일: `min-h-[100dvh]` (모바일 주소창 높이 보정)

### 3.2 S-02: 대시보드 헤더 수정 (`/`)

기존 대시보드 상단에 UserBadge를 추가한다.

**현재 헤더 → 수정 후:**

```
수정 전:
┌─────────────────────────────────────────────────────────────┐
│  🤖 Agent Pipeline Dashboard                    [새 요청+]  │
└─────────────────────────────────────────────────────────────┘

수정 후:
┌─────────────────────────────────────────────────────────────┐
│  🤖 Agent Pipeline Dashboard      user@email │ 로그아웃  [새 요청+]  │
└─────────────────────────────────────────────────────────────┘
```

- UserBadge는 "새 요청" 버튼 왼쪽에 배치
- `flex items-center gap-3`으로 정렬
- 모바일(<480px): 이메일 텍스트 숨기고 로그아웃 아이콘 버튼만 표시

---

## 4. 인터랙션 & 애니메이션

### 4.1 로그인 폼 인터랙션 플로우

```
[페이지 로드]
  → 이메일 입력 필드에 autoFocus
  → 카드에 fade-in (opacity 0→1, 0.3s ease-out)

[입력 중]
  → 포커스된 필드: border 색상 전환 (0.2s)
  → 포커스 링: shadow-input-focus fade-in (0.2s)

[Tab 이동]
  → 이메일 → 비밀번호 → 로그인 버튼 순서

[제출 (Enter 또는 버튼 클릭)]
  → 클라이언트 유효성 검사 (즉시)
    → 실패: 에러 상태 필드에 border-error + 에러 메시지 fade-in (0.15s)
    → 성공: 로그인 버튼 → loading 상태 전환
      → 버튼 텍스트 → 스피너 (crossfade, 0.15s)
      → 입력 필드 disabled 처리

[API 응답]
  → 성공: 대시보드(`/`)로 리다이렉트 (router.push)
  → 실패:
    → 버튼 loading 해제
    → 서버 에러 메시지 영역에 에러 표시 (slide-down + fade-in, 0.2s)
    → 비밀번호 필드 값 초기화
    → 비밀번호 필드에 focus
```

### 4.2 서버 에러 메시지 박스

로그인 실패 시 폼 하단에 표시되는 에러 알림.

```
┌─────────────────────────────────────┐
│  ⚠  이메일 또는 비밀번호가          │
│     올바르지 않습니다                │
└─────────────────────────────────────┘
```

- 배경: `rgba(231, 76, 60, 0.1)` (--text-error의 10% 투명도)
- 테두리: `1px solid rgba(231, 76, 60, 0.3)`
- 텍스트: `--text-error`, `text-xs`
- 반경: `radius-input` (8px)
- 패딩: `px-3 py-2.5`
- 아이콘: ⚠ 또는 SVG alert icon, `--text-error`
- 진입 애니메이션: `opacity 0→1 + translateY(-4px→0)`, `0.2s ease-out`

### 4.3 카드 진입 애니메이션

```css
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* duration: 0.4s, ease-out, 페이지 로드 시 1회 */
```

### 4.4 로그아웃 플로우

```
[로그아웃 버튼 클릭]
  → POST /api/auth/logout
  → 로그인 페이지로 리다이렉트 (router.push('/login'))
```

### 4.5 토큰 만료 시 자동 리다이렉트

```
[API 요청 → 401 응답]
  → 현재 페이지에서 로그인 페이지로 즉시 리다이렉트
  → 별도 토스트/알림 없음 (로그인 페이지가 곧 안내)
```

---

## 5. 접근성 가이드

### 5.1 시맨틱 HTML

| 요소 | 태그 | 속성 |
|------|------|------|
| 로그인 카드 | `<main>` | `role="main"` |
| 로그인 폼 | `<form>` | `noValidate` (JS 검증 사용) |
| 이메일 라벨 | `<label>` | `htmlFor="email"` |
| 이메일 입력 | `<input>` | `id="email"`, `type="email"`, `autoComplete="email"`, `required` |
| 비밀번호 라벨 | `<label>` | `htmlFor="password"` |
| 비밀번호 입력 | `<input>` | `id="password"`, `type="password"`, `autoComplete="current-password"`, `required` |
| 로그인 버튼 | `<button>` | `type="submit"` |
| 서버 에러 영역 | `<div>` | `role="alert"`, `aria-live="assertive"` |

### 5.2 키보드 네비게이션

| 키 | 동작 |
|----|------|
| `Tab` | 이메일 → 비밀번호 → 로그인 버튼 순서로 이동 |
| `Shift+Tab` | 역순 이동 |
| `Enter` | 폼 내 어디서든 로그인 제출 (form submit) |
| `Escape` | 없음 (모달이 아니므로 불필요) |

### 5.3 포커스 관리

- 페이지 로드 시: 이메일 입력 필드에 `autoFocus`
- 유효성 검사 실패 시: 첫 번째 에러 필드에 `focus()`
- 로그인 실패 시: 비밀번호 필드에 `focus()`
- 포커스 표시: `shadow-input-focus` (2px 파란 링) — `outline: none` 대신 box-shadow 사용

### 5.4 에러 메시지 접근성

- 인라인 에러 (필드별): `aria-describedby`로 입력 필드와 연결
  - 예: `<input aria-describedby="email-error" />`, `<span id="email-error">`
- 서버 에러 (전체): `aria-live="assertive"` + `role="alert"`
  - 에러 발생 시 스크린 리더가 즉시 읽어줌

### 5.5 색상 대비

| 조합 | 대비비 | WCAG 기준 |
|------|--------|----------|
| `#ffffff` on `#0a0a14` (텍스트/배경) | 19.5:1 | AAA 통과 |
| `#ffffff` on `#3498db` (버튼 텍스트/배경) | 3.5:1 | AA Large 통과 (버튼 14px bold) |
| `#888888` on `#0a0a14` (보조 텍스트/배경) | 5.8:1 | AA 통과 |
| `#e74c3c` on `#1a1a2e` (에러 텍스트/카드) | 4.7:1 | AA 통과 |
| `#555555` on `#12121e` (placeholder/입력배경) | 3.1:1 | placeholder는 WCAG 대상 외 |

### 5.6 로딩 상태 접근성

- 로그인 버튼 loading 시: `aria-busy="true"`, `aria-label="로그인 처리 중"`
- 스피너는 시각적 표시이므로 `aria-hidden="true"`

---

## 부록: FE 구현 참고

### 파일 배치

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

### 유효성 검사 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|-----------|
| 이메일 | 빈값 검사 | "이메일을 입력해주세요" |
| 이메일 | 이메일 형식 (`/.+@.+\..+/`) | "올바른 이메일 형식이 아닙니다" |
| 비밀번호 | 빈값 검사 | "비밀번호를 입력해주세요" |

### 서버 에러 메시지 매핑

| 상태 코드 | 표시 메시지 |
|----------|-----------|
| 401 | "이메일 또는 비밀번호가 올바르지 않습니다" |
| 500 | "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요" |
| Network Error | "네트워크 연결을 확인해주세요" |

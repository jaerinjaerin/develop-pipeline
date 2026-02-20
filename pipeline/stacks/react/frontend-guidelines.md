# React Frontend Guidelines

> Agent 03 (Frontend)이 fe_stack: react 프로젝트에서 참조하는 가이드라인

## 기술 스택

- **Framework**: React 19 + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State**: zustand (클라이언트), TanStack Query (서버)
- **Form**: React Hook Form + Zod
- **HTTP Client**: axios
- **Routing**: React Router v7

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                   # 앱 진입점
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx         # React Router 설정
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   └── {feature}/         # 기능별 컴포넌트
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── LoginPage.tsx
│   │   └── HomePage.tsx
│   ├── lib/
│   │   ├── api/               # API 호출 함수 (axios 인스턴스)
│   │   ├── utils.ts           # 유틸리티
│   │   └── validators/        # Zod 스키마
│   ├── hooks/                 # Custom Hooks
│   ├── stores/                # zustand 스토어
│   ├── types/                 # TypeScript 타입 정의
│   └── assets/                # 정적 파일 (이미지, 폰트)
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 코딩 규칙

### 컴포넌트

- 함수형 컴포넌트만 사용
- 컴포넌트 파일명: PascalCase (`LoginForm.tsx`)
- Props 타입을 interface로 정의
- 조건부 렌더링: early return 패턴 사용
- 컴포넌트 분리: 200줄 초과 시 하위 컴포넌트로 분리

### API 호출

- axios 인스턴스로 baseURL, 인터셉터 설정
- API명세의 요청/응답 구조를 Zod 스키마로 정의
- TanStack Query로 서버 상태 관리 (`useQuery`, `useMutation`)
- 에러 처리: axios 인터셉터 + 사용자 친화적 에러 메시지

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

### 상태 관리

- 서버 상태: TanStack Query (`useQuery`, `useMutation`)
- 클라이언트 상태: zustand (인증, UI 상태 등 최소한)
- URL 상태: React Router의 `useSearchParams`
- 폼 상태: React Hook Form

### 스타일링

- Tailwind CSS 유틸리티 클래스 사용
- shadcn/ui 컴포넌트 기반
- 반응형: `sm:`, `md:`, `lg:` 브레이크포인트
- 다크 모드: `dark:` 접두사

### 폼 처리

- React Hook Form + Zod validation
- 인라인 에러 메시지 표시
- 로딩 중 버튼 disabled + 스피너
- 성공/실패 토스트 알림

### 라우팅

- React Router v7 사용
- 레이아웃 중첩 라우트 활용
- 인증 가드: `ProtectedRoute` 컴포넌트
- 코드 스플리팅: `React.lazy` + `Suspense`

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 페이지 | PascalCase + `Page` 접미사 | `LoginPage.tsx` |
| 레이아웃 | PascalCase + `Layout` 접미사 | `AuthLayout.tsx` |
| 컴포넌트 | PascalCase | `LoginForm.tsx` |
| Hook | camelCase, `use` 접두사 | `useAuth.ts` |
| 스토어 | camelCase, `Store` 접미사 | `authStore.ts` |
| 유틸리티 | camelCase | `formatDate.ts` |
| 타입 | PascalCase | `User.ts` |
| API 함수 | camelCase | `authApi.ts` |

## PR 규칙

- 컴포넌트 PR: 단일 컴포넌트 + 타입
- 페이지 PR: 페이지 조립 + API 연동 + 에러 처리
- PR 설명에 스크린샷 첨부 (UI 변경 시)

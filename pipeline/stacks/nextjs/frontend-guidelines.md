# Next.js Frontend Guidelines

> Agent 03 (Frontend)이 fe_stack: nextjs 프로젝트에서 참조하는 가이드라인

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State**: React Server Components 우선, 필요 시 zustand
- **Form**: React Hook Form + Zod
- **HTTP Client**: fetch API (Server Components) / axios (Client Components)

## 프로젝트 구조

```
frontend/
├── app/                    # App Router 페이지
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/             # Route Group
│   │   ├── login/
│   │   └── register/
│   └── api/                # Route Handlers (필요 시)
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   └── {feature}/          # 기능별 컴포넌트
├── lib/
│   ├── api/                # API 호출 함수
│   ├── utils.ts            # 유틸리티
│   └── validators/         # Zod 스키마
├── hooks/                  # Custom Hooks
├── types/                  # TypeScript 타입 정의
└── public/                 # 정적 파일
```

## 코딩 규칙

### 컴포넌트

- Server Component 기본, `'use client'`는 필요한 경우만
- 컴포넌트 파일명: PascalCase (`LoginForm.tsx`)
- Props 타입을 interface로 정의
- 조건부 렌더링: early return 패턴 사용

### API 호출

- API명세의 요청/응답 구조를 Zod 스키마로 정의
- Server Actions 또는 Route Handler를 통한 API 호출
- 에러 처리: try/catch + 사용자 친화적 에러 메시지

### 상태 관리

- URL 상태: `searchParams` 활용
- 서버 상태: Server Components에서 직접 fetch
- 클라이언트 상태: 최소한으로 유지, 필요 시 zustand

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

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 페이지 | `page.tsx` (App Router) | `app/login/page.tsx` |
| 레이아웃 | `layout.tsx` | `app/(auth)/layout.tsx` |
| 컴포넌트 | PascalCase | `LoginForm.tsx` |
| Hook | camelCase, `use` 접두사 | `useAuth.ts` |
| 유틸리티 | camelCase | `formatDate.ts` |
| 타입 | PascalCase | `User.ts` |
| API 함수 | camelCase | `authApi.ts` |

## PR 규칙

- 컴포넌트 PR: 단일 컴포넌트 + 스토리(선택) + 타입
- 페이지 PR: 페이지 조립 + API 연동 + 에러 처리
- PR 설명에 스크린샷 첨부 (UI 변경 시)

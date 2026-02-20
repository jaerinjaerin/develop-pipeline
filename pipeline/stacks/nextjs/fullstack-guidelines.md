# Next.js Fullstack Guidelines

> Next.js 풀스택 프로젝트에서 참조하는 가이드라인 (API Routes + Prisma + MySQL)

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State**: React Server Components 우선, 필요 시 zustand
- **Form**: React Hook Form + Zod
- **ORM**: Prisma
- **Database**: MySQL 8.0
- **Authentication**: NextAuth.js (어드민 구현 시)

## 프로젝트 구조

```
app/
├── prisma/
│   ├── schema.prisma          # DB 스키마 정의
│   ├── migrations/            # DB 마이그레이션
│   └── seed.ts                # 시드 데이터
├── src/
│   ├── app/                   # App Router 페이지
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (public)/          # 공개 페이지 Route Group
│   │   ├── (admin)/           # 어드민 Route Group (추후)
│   │   └── api/               # API Route Handlers
│   │       └── health/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   └── {feature}/         # 기능별 컴포넌트
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 클라이언트 싱글턴
│   │   ├── utils.ts           # 유틸리티
│   │   └── validators/        # Zod 스키마
│   ├── hooks/                 # Custom Hooks
│   ├── types/                 # TypeScript 타입 정의
│   └── actions/               # Server Actions
├── public/                    # 정적 파일
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                 # 환경 변수 (git 무시)
```

## 코딩 규칙

### 컴포넌트

- Server Component 기본, `'use client'`는 필요한 경우만
- 컴포넌트 파일명: PascalCase (`LoginForm.tsx`)
- Props 타입을 interface로 정의
- 조건부 렌더링: early return 패턴 사용

### API Routes

- `src/app/api/` 하위에 Route Handler 작성
- REST 규칙 준수: GET (조회), POST (생성), PUT (수정), DELETE (삭제)
- 응답은 `NextResponse.json()` 사용
- 에러 응답은 적절한 HTTP 상태 코드 포함
- 요청/응답 타입을 Zod로 검증

```typescript
// src/app/api/example/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const data = await prisma.example.findMany();
  return NextResponse.json(data);
}
```

### Server Actions

- `src/actions/` 디렉토리에 `'use server'` 파일로 작성
- 폼 제출, 데이터 변경 등 mutation 작업에 사용
- Zod로 입력 검증 후 DB 작업 수행

### Prisma

- 스키마 파일: `prisma/schema.prisma`
- 클라이언트 싱글턴: `src/lib/prisma.ts`
- 마이그레이션: `npx prisma migrate dev --name <description>`
- 시드: `npx prisma db seed`

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 상태 관리

- URL 상태: `searchParams` 활용
- 서버 상태: Server Components에서 직접 fetch
- 클라이언트 상태: 최소한으로 유지, 필요 시 zustand

### 스타일링

- Tailwind CSS 유틸리티 클래스 사용
- shadcn/ui 컴포넌트 기반
- 반응형: `sm:`, `md:`, `lg:` 브레이크포인트
- 다크 모드: `dark:` 접두사

### 환경 변수

- `DATABASE_URL`: MySQL 연결 문자열 (`mysql://user:pass@host:3306/db`)
- `NEXTAUTH_SECRET`: 인증 시크릿 (어드민 구현 시)
- 클라이언트 노출 변수는 `NEXT_PUBLIC_` 접두사 사용

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 페이지 | `page.tsx` (App Router) | `app/(public)/about/page.tsx` |
| 레이아웃 | `layout.tsx` | `app/(public)/layout.tsx` |
| API Route | `route.ts` | `app/api/health/route.ts` |
| 컴포넌트 | PascalCase | `HeroSection.tsx` |
| Server Action | camelCase | `createPost.ts` |
| Hook | camelCase, `use` 접두사 | `useAuth.ts` |
| 유틸리티 | camelCase | `formatDate.ts` |
| Prisma 모델 | PascalCase (단수) | `model Place { ... }` |

## PR 규칙

- 컴포넌트 PR: 단일 컴포넌트 + 타입
- 페이지 PR: 페이지 조립 + API 연동 + 에러 처리
- API PR: Route Handler + Prisma 쿼리 + 검증 스키마
- PR 설명에 스크린샷 첨부 (UI 변경 시)

## 카페24 배포 참고

- `next.config.ts`에서 `output: 'standalone'` 설정 권장
- 정적 페이지는 `generateStaticParams()`로 빌드 타임 생성
- 이미지 최적화: `next/image` + 외부 이미지 도메인 설정
- MySQL 연결 풀링: Prisma connection pool 설정 확인

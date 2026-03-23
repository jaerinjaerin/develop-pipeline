---
name: explore-fe-codebase
description: "FE Agent가 구현 시작 전에 기존 프론트엔드 코드 구조를 파악할 때 사용하는 skill. 프레임워크, 폴더 구조, 라우터, 상태 관리, API 클라이언트, 스타일링, 기존 컴포넌트를 탐색해서 기존 패턴과 일관된 구현이 가능하게 한다. FE Agent가 04_task_FE.md를 받고 구현에 착수하기 전, 코드베이스를 처음 접하는 상황, 또는 기존 FE 코드에 새 기능을 추가할 때 반드시 사용한다."
context: fork
agent: Explore
---

# Explore FE Codebase

FE Agent가 구현을 시작하기 전에 기존 프론트엔드 코드의 구조와 패턴을 파악하는 skill이다.

기존 프로젝트에 코드를 추가할 때, 기존 패턴과 다른 방식으로 구현하면 코드베이스가 일관성을 잃는다. 이 skill은 기존 코드를 탐색해서 "이 프로젝트에서는 이렇게 한다"를 파악하고, FE Agent가 동일한 패턴으로 구현할 수 있도록 현황을 정리한다.

신규 프로젝트(기존 코드 없음)의 경우에도 실행하되, "기존 FE 코드 없음 — 처음부터 구현"으로 보고한다.

---

## 탐색 절차

Explore agent를 사용하여 아래 항목들을 순서대로 탐색한다.

### 1. 의존성 파악

`package.json`을 읽어서 프레임워크와 주요 라이브러리를 파악한다.

```
Glob: **/package.json
```

확인할 항목:

| 카테고리 | 찾을 패키지 |
|---------|-----------|
| 프레임워크 | `next`, `react`, `vue`, `nuxt`, `svelte`, `angular` |
| 상태 관리 | `zustand`, `@reduxjs/toolkit`, `redux`, `recoil`, `jotai`, `valtio`, `pinia` |
| API/데이터 | `@tanstack/react-query`, `swr`, `axios`, `ky`, `@trpc/client`, `@apollo/client` |
| 스타일링 | `tailwindcss`, `styled-components`, `@emotion/react`, `sass`, `@vanilla-extract/css` |
| UI 라이브러리 | `@shadcn/ui`, `@mui/material`, `antd`, `@chakra-ui/react`, `@radix-ui/*` |
| 폼 | `react-hook-form`, `formik`, `zod`, `yup` |
| 인증 | `next-auth`, `@auth/core`, `firebase` |
| 테스트 | `vitest`, `jest`, `@testing-library/react`, `cypress`, `playwright` |

버전도 함께 기록한다 — 메이저 버전에 따라 API가 다를 수 있다.

### 2. 폴더 구조 파악

프로젝트의 디렉토리 레이아웃을 파악한다.

```
Glob: src/**/*
Glob: app/**/*
Glob: pages/**/*
Glob: components/**/*
```

확인할 패턴:

| 패턴 | 의미 |
|------|------|
| `app/` 폴더 존재 | Next.js App Router |
| `pages/` 폴더 존재 | Next.js Pages Router / Nuxt |
| `src/components/` | 컴포넌트 디렉토리 |
| `src/hooks/` | 커스텀 훅 |
| `src/lib/` 또는 `src/utils/` | 유틸리티/헬퍼 |
| `src/types/` | 타입 정의 |
| `src/store/` 또는 `src/stores/` | 상태 관리 |
| `src/services/` 또는 `src/api/` | API 레이어 |

### 3. 라우터 설정

라우팅 구조를 파악한다.

```
Glob: app/**/page.{tsx,jsx,vue}
Glob: app/**/layout.{tsx,jsx,vue}
Glob: pages/**/*.{tsx,jsx,vue}
Glob: src/router/**/*
Grep: createBrowserRouter|createRouter|useRouter
```

기존 경로 목록과 레이아웃 계층 구조를 파악한다.

### 4. 상태 관리 설정

```
Glob: src/store/**/*
Glob: src/stores/**/*
Glob: src/context/**/*
Glob: src/providers/**/*
Grep: create(Store|Slice|Context)|defineStore|atom\(
```

확인할 것:
- 전역 상태 관리 방식 (Zustand store / Redux slice / Context 등)
- 기존 store 목록과 각각의 역할
- 서버 상태 vs 클라이언트 상태 분리 패턴

### 5. API 클라이언트 설정

```
Glob: src/lib/api*
Glob: src/utils/axios*
Glob: src/utils/fetch*
Glob: src/services/**/*
Grep: axios\.create|createClient|baseURL|fetcher
```

확인할 것:
- HTTP 클라이언트 (axios / fetch / ky 등)
- base URL 설정 방식
- 인증 토큰 주입 방식 (interceptor / header)
- 에러 핸들링 패턴
- React Query / SWR 사용 시 query key 컨벤션

### 6. 기존 컴포넌트 목록

```
Glob: src/components/**/*.{tsx,jsx,vue}
Glob: components/**/*.{tsx,jsx,vue}
```

각 컴포넌트에 대해:
- 컴포넌트명
- Props 인터페이스 (있으면)
- 어디서 사용되는지 (import 추적)

---

## 출력 형식

탐색 결과를 아래 형식으로 정리하여 반환한다:

```markdown
# 기존 FE 코드 현황

## 기술 스택

| 카테고리 | 사용 기술 | 버전 |
|---------|---------|------|
| 프레임워크 | Next.js (App Router) | 14.x |
| 상태 관리 | Zustand | 4.x |
| API 클라이언트 | React Query + axios | 5.x / 1.x |
| 스타일링 | Tailwind CSS | 3.x |
| UI 라이브러리 | shadcn/ui | - |
| 폼 | react-hook-form + zod | 7.x / 3.x |
| 테스트 | Vitest + Testing Library | 1.x |

## 폴더 구조

(실제 디렉토리 트리)

## 라우팅 구조

| 경로 | 페이지 | 레이아웃 |
|------|--------|---------|
| / | app/page.tsx | app/layout.tsx |
| /login | app/login/page.tsx | (root) |

## 상태 관리

| Store/Context | 역할 | 파일 |
|---------------|------|------|
| useAuthStore | 인증 상태 | src/store/auth.ts |

## API 패턴

- 클라이언트: axios (baseURL: /api)
- 인증: Authorization header (Bearer token)
- 서버 상태: React Query (queryKey: ['resource', id])
- 에러: interceptor에서 401 → 로그인 리다이렉트

## 기존 컴포넌트 — 재사용 가능

| 컴포넌트 | 경로 | 용도 |
|---------|------|------|
| Button | components/ui/Button.tsx | 범용 버튼 |
| Input | components/ui/Input.tsx | 폼 입력 |

## 새로 만들어야 할 것

(기획안/디자인 명세 기준으로 기존에 없는 컴포넌트/페이지)

## 주의사항

- (기존 패턴과 충돌 가능성, 따라야 할 컨벤션, 주의할 점)
- 예: "기존 코드는 모두 default export 사용 — named export로 바꾸지 말 것"
- 예: "API 호출은 반드시 services/ 폴더의 함수를 통해 — 컴포넌트에서 직접 axios 호출하지 말 것"
```

---

## 신규 프로젝트인 경우

FE 관련 파일이 전혀 없으면:

```markdown
# 기존 FE 코드 현황

기존 FE 코드 없음 — 처음부터 구현.

## 프로젝트 설정 감지

- package.json: (있음/없음)
- 감지된 기술: (있으면 나열)

## 권장사항

(04_task_FE.md의 기술 스택 지시에 따름)
```

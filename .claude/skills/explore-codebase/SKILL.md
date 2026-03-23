---
name: explore-codebase
description: "기획자 Agent가 기획안 작성 전에 기존 코드베이스의 현황을 파악할 때 사용하는 skill. 현재 구현된 기능, 화면 구조, API 패턴, DB 모델을 탐색해서 기획안이 기존 서비스와 일관성을 유지하도록 한다. 기획자가 STEP 2(기존 서비스 파악)를 수행할 때, 코드베이스를 처음 접하는 상황에서, 또는 기존 기능을 수정/확장하는 기획을 할 때 반드시 사용한다."
---

# Explore Codebase

기획자 Agent가 기획안을 작성하기 전에 기존 코드베이스를 체계적으로 탐색하는 skill이다.

기획안이 기존 서비스와 충돌하지 않으려면, 현재 무엇이 구현되어 있는지를 정확히 알아야 한다. 이 skill은 코드베이스를 실제로 읽고 기존 패턴을 파악해서, 기획자가 현실에 맞는 기획을 할 수 있도록 돕는다.

---

## 탐색 절차

### Step 1: 프로젝트 루트 구조 파악

프로젝트의 전체적인 모습을 빠르게 스캔한다.

```
Glob: package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle
Glob: docker-compose*, Dockerfile*
Glob: .github/workflows/*, .gitlab-ci.yml
```

파악할 내용:
- **기술 스택**: 언어, 프레임워크, 주요 라이브러리
- **프로젝트 구조**: 모노레포 / FE·BE 분리 / 풀스택 일체형
- **인프라**: Docker, CI/CD 파이프라인 유무

package.json이나 requirements.txt의 dependencies를 읽어서 사용 중인 프레임워크와 라이브러리를 정확히 파악한다. 버전도 함께 기록한다 — 기획 시 해당 버전에서 지원하는 기능인지 확인하는 데 쓰인다.

### Step 2: 화면/라우트 목록 파악

사용자에게 노출되는 화면 구조를 파악한다. 프레임워크에 따라 탐색 방법이 다르다.

**Next.js (Pages Router):**
```
Glob: src/pages/**/*.tsx, pages/**/*.tsx
```
→ 파일 경로가 곧 라우트다. `[id].tsx`는 동적 라우트.

**Next.js (App Router):**
```
Glob: src/app/**/page.tsx, app/**/page.tsx
```
→ `page.tsx`가 있는 폴더 경로가 라우트.

**React (React Router 등):**
```
Grep: Route, path=, createBrowserRouter
Glob: src/pages/**/*.tsx, src/views/**/*.tsx
```
→ 라우터 설정 파일에서 경로 매핑을 추출.

**Vue / Nuxt:**
```
Glob: pages/**/*.vue, src/views/**/*.vue
```

**백엔드 전용 (Express, FastAPI 등):**
→ 화면 없음. Step 3으로 직접 이동.

각 화면에 대해 파악할 것:
- 라우트 경로 (예: `/login`, `/products/:id`)
- 해당 화면의 주요 컴포넌트
- 사용하는 데이터 (어떤 API를 호출하는지)

### Step 3: API 엔드포인트 목록 파악

서버 사이드 API를 탐색한다.

```
Glob: **/routes/**/*.ts, **/routes/**/*.js, **/api/**/*.ts
Grep: router\.(get|post|put|delete|patch), app\.(get|post|put|delete|patch)
Grep: @Get|@Post|@Put|@Delete|@Patch
```

각 엔드포인트에 대해 파악할 것:
- HTTP Method + Path
- 간단한 역할 설명
- 인증 필요 여부 (미들웨어로 보호되고 있는지)

Next.js API Routes(`pages/api/`, `app/api/`)도 별도로 탐색한다.

### Step 4: DB 스키마/모델 파악

데이터 모델 구조를 파악한다.

```
Glob: **/prisma/schema.prisma
Glob: **/models/**/*.ts, **/models/**/*.py, **/entities/**/*.ts
Grep: @Entity, @Table, @model, class.*Model
```

파악할 내용:
- 모델 이름과 주요 필드
- 모델 간 관계 (1:N, N:M 등)
- 특이사항 (soft delete, timestamp, enum 등)

ORM을 사용하지 않는 경우 migration 파일이나 SQL 스키마를 확인한다:
```
Glob: **/migrations/**/*.sql, **/schema.sql
```

### Step 5: 기존 패턴 분석

코드베이스에서 반복되는 패턴을 파악한다. 기획안이 이 패턴을 따라야 구현 팀의 생산성이 높아진다.

확인할 패턴:
- **상태 관리**: Redux, Zustand, React Context, useState 등
- **API 호출 방식**: axios, fetch, React Query, SWR 등
- **인증 방식**: JWT, Session, NextAuth, Passport 등
- **에러 처리**: 공통 에러 핸들러가 있는지, 에러 바운더리 사용 여부
- **스타일링**: CSS Modules, Tailwind, styled-components, 바닐라 CSS 등

```
Grep: useQuery|useSWR|axios|fetch\(
Grep: useAuth|getSession|getServerSession|passport
Grep: import.*\.module\.|tailwind|styled
```

---

## 출력 형식

탐색이 완료되면 아래 형식으로 결과를 정리하여 반환한다. 이 결과는 기획자가 기획안 작성 시 참고하는 내부 문서이므로 파일로 저장하지 않는다.

```markdown
# 기존 서비스 현황

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| FE | (예: React 18, Next.js 14) | (예: 18.2.0, 14.1.0) |
| BE | (예: Express 4) | (예: 4.18.2) |
| DB | (예: PostgreSQL + Prisma) | (예: Prisma 5.9.1) |
| Infra | (예: Docker, GitHub Actions) | - |
| 스타일링 | (예: Tailwind CSS) | (예: 3.4.1) |
| 상태관리 | (예: Zustand) | (예: 4.5.0) |

## 기존 화면 목록

| 라우트 | 화면명 | 주요 기능 |
|--------|--------|-----------|
| / | 홈 | 랜딩 페이지, 상품 목록 표시 |
| /login | 로그인 | 이메일/비밀번호 인증 |
| /products/:id | 상품 상세 | 상품 정보 표시, 장바구니 추가 |

## 기존 API 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/products | 상품 목록 조회 | X |
| POST | /api/orders | 주문 생성 | O |

## 기존 DB 모델

| 모델 | 주요 필드 | 관계 |
|------|-----------|------|
| User | id, email, name, role | Order(1:N) |
| Product | id, name, price, stock | OrderItem(1:N) |

## 기존 코드 패턴

- **API 호출**: (예: axios 인스턴스 + 커스텀 훅 패턴)
- **인증**: (예: NextAuth + JWT 전략)
- **에러 처리**: (예: 공통 에러 핸들러 없음, 컴포넌트별 try-catch)
- **스타일링**: (예: 바닐라 CSS, globals.css 단일 파일)

## 기획 시 주의사항

- (기존 기능과 충돌할 수 있는 부분)
- (재사용 가능한 기존 컴포넌트/API)
- (기존 패턴을 따라야 하는 이유와 구체적 사항)
- (기존 코드에서 발견된 제약사항 — 예: 인증 미구현)
```

---

## 탐색 품질 체크리스트

결과를 반환하기 전에 점검한다:

- [ ] 화면 목록에 누락된 페이지가 없는가?
- [ ] API 목록에 누락된 엔드포인트가 없는가?
- [ ] DB 모델 간 관계가 정확한가?
- [ ] 코드 패턴 분석이 실제 코드에 근거하는가?
- [ ] 주의사항이 기획에 실질적으로 도움이 되는 내용인가?

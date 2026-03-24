---
name: explore-be-codebase
description: "BE 개발자가 구현 전 기존 백엔드 코드 구조를 파악할 때 사용하는 skill. 폴더 구조, ORM 패턴, 인증 방식, 에러 핸들링 패턴을 탐색해서 일관된 구현이 가능하게 한다. BE Agent가 04_task_BE.md를 받고 구현에 착수하기 전, 코드베이스를 처음 접하는 상황, 또는 기존 BE 코드에 새 API를 추가할 때 반드시 사용한다."
context: fork
agent: Explore
---

# Explore BE Codebase

BE Agent가 구현을 시작하기 전에 기존 백엔드 코드의 구조와 패턴을 파악하는 skill이다.

기존 프로젝트에 API를 추가할 때, 기존 패턴과 다른 방식으로 구현하면 코드베이스가 일관성을 잃는다. 이 skill은 기존 코드를 탐색해서 "이 프로젝트에서는 이렇게 한다"를 파악하고, BE Agent가 동일한 패턴으로 구현할 수 있도록 현황을 정리한다.

신규 프로젝트(기존 코드 없음)의 경우에도 실행하되, "기존 BE 코드 없음 — 처음부터 구현"으로 보고한다.

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
| 프레임워크 | `express`, `fastify`, `@nestjs/core`, `hono`, `koa`, `@hapi/hapi` |
| ORM/DB | `prisma`, `@prisma/client`, `typeorm`, `drizzle-orm`, `sequelize`, `mongoose`, `knex`, `pg`, `mysql2`, `better-sqlite3` |
| 인증 | `jsonwebtoken`, `passport`, `@nestjs/jwt`, `bcrypt`, `bcryptjs`, `express-session`, `cookie-session` |
| 유효성 검사 | `zod`, `joi`, `class-validator`, `yup`, `ajv` |
| API 문서 | `@nestjs/swagger`, `swagger-jsdoc`, `swagger-ui-express` |
| 테스트 | `jest`, `vitest`, `supertest`, `mocha`, `chai` |
| 로깅 | `winston`, `pino`, `morgan`, `@nestjs/common` (Logger) |
| 기타 | `dotenv`, `cors`, `helmet`, `express-rate-limit`, `multer`, `nodemailer`, `bull`, `ioredis` |

버전도 함께 기록한다 — 메이저 버전에 따라 API가 다를 수 있다.

Python 프로젝트인 경우 `requirements.txt`, `pyproject.toml`, `Pipfile`을 확인한다:

| 카테고리 | 찾을 패키지 |
|---------|-----------|
| 프레임워크 | `fastapi`, `django`, `flask`, `starlette` |
| ORM/DB | `sqlalchemy`, `tortoise-orm`, `django-orm`, `prisma`, `peewee`, `sqlmodel` |
| 인증 | `python-jose`, `pyjwt`, `passlib`, `python-multipart` |
| 유효성 검사 | `pydantic` |

### 2. 폴더 구조 파악

프로젝트의 디렉토리 레이아웃을 파악한다.

```
Glob: src/**/*
Glob: server/**/*
Glob: api/**/*
Glob: routes/**/*
Glob: controllers/**/*
Glob: services/**/*
Glob: models/**/*
Glob: middlewares/**/*
```

확인할 패턴:

| 패턴 | 의미 |
|------|------|
| `src/routes/` | 라우트 정의 |
| `src/controllers/` | 컨트롤러 레이어 |
| `src/services/` | 비즈니스 로직 레이어 |
| `src/models/` 또는 `src/entities/` | DB 모델/엔티티 |
| `src/middlewares/` 또는 `src/middleware/` | 미들웨어 |
| `src/utils/` 또는 `src/lib/` | 유틸리티/헬퍼 |
| `src/config/` | 설정 파일 |
| `src/types/` | 타입 정의 |
| `prisma/` | Prisma 스키마/마이그레이션 |
| `src/modules/` (NestJS) | 모듈 단위 구성 |
| `src/dto/` (NestJS) | DTO 정의 |

### 3. 기존 API 엔드포인트 목록

```
Grep: router\.(get|post|put|patch|delete)\(|app\.(get|post|put|patch|delete)\(|@(Get|Post|Put|Patch|Delete)\(|@api_view|@app\.(get|post|put|patch|delete)
Glob: src/routes/**/*.{ts,js}
Glob: src/controllers/**/*.{ts,js}
```

기존에 구현된 API 엔드포인트 목록을 정리한다:
- HTTP 메서드
- 경로 (path)
- 담당 컨트롤러/핸들러
- 인증 필요 여부

### 4. 인증 미들웨어 구현 방식

```
Grep: jwt|passport|auth|token|Bearer|session
Glob: src/middlewares/auth*
Glob: src/middleware/auth*
Glob: src/guards/**/*
Glob: src/auth/**/*
```

확인할 것:
- 인증 방식 (JWT / Session / OAuth / API Key)
- 토큰 저장 위치 (header / cookie)
- 토큰 검증 로직 (미들웨어/가드 위치와 구현)
- 역할 기반 접근 제어 (RBAC) 유무
- 리프레시 토큰 처리 방식

### 5. ORM 스키마 / 모델 파일

```
Glob: prisma/schema.prisma
Glob: src/models/**/*.{ts,js}
Glob: src/entities/**/*.{ts,js}
Glob: src/schemas/**/*.{ts,js}
Grep: @Entity|@Table|@Column|model\s+\w+\s*\{|Schema\(|defineTable
```

확인할 것:
- 사용하는 ORM과 스키마 정의 방식
- 기존 모델/테이블 목록
- 관계 설정 패턴 (1:N, N:M 등)
- 마이그레이션 관리 방식
- soft delete, timestamp 등 공통 필드 패턴

### 6. 에러 핸들링 패턴

```
Grep: class\s+\w*Error|class\s+\w*Exception|ErrorHandler|errorHandler|@Catch|HttpException|createError
Glob: src/errors/**/*
Glob: src/exceptions/**/*
Glob: src/utils/error*
```

확인할 것:
- 커스텀 에러 클래스 정의 여부
- 에러 응답 형식 (JSON 구조)
- 글로벌 에러 핸들러 위치와 구현
- HTTP 상태 코드 사용 패턴
- 유효성 검사 에러 처리 방식

### 7. 환경변수 구성

```
Glob: .env.example
Glob: .env.sample
Glob: src/config/**/*
Grep: process\.env\.|config\.(get|has)|@ConfigService|os\.environ|settings\.
```

확인할 것:
- 환경변수 목록과 용도
- 설정 로딩 방식 (dotenv / @nestjs/config / config 모듈)
- 환경별 분기 (dev / staging / prod)

---

## 출력 형식

탐색 결과를 아래 형식으로 정리하여 반환한다:

```markdown
# 기존 BE 코드 현황

## 기술 스택

| 카테고리 | 사용 기술 | 버전 |
|---------|---------|------|
| 프레임워크 | Express | 4.x |
| ORM | Prisma | 5.x |
| 인증 | jsonwebtoken + bcrypt | 9.x / 5.x |
| 유효성 검사 | zod | 3.x |
| 테스트 | Jest + supertest | 29.x / 6.x |
| 로깅 | winston | 3.x |

## 폴더 구조

(실제 디렉토리 트리)

## 기존 API 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/login | 로그인 | X |
| GET | /api/users/me | 내 정보 조회 | O |
| POST | /api/posts | 게시글 생성 | O |

## 인증 방식

- 방식: JWT (Access + Refresh)
- 토큰 위치: Authorization header (Bearer)
- 미들웨어: src/middlewares/auth.ts
- RBAC: 없음 / 있음 (역할: admin, user)

## ORM / DB 스키마

- ORM: Prisma
- 스키마: prisma/schema.prisma
- 기존 모델: User, Post, Comment, ...
- 관계: User 1:N Post, Post 1:N Comment
- 공통 패턴: createdAt/updatedAt 자동 생성, soft delete 미사용

## 에러 핸들링 패턴

- 커스텀 에러: AppError (statusCode, message, isOperational)
- 응답 형식: { success: false, error: { code, message } }
- 글로벌 핸들러: src/middlewares/errorHandler.ts
- 유효성 검사: zod → 400 Bad Request

## 재사용 가능한 미들웨어

| 미들웨어 | 경로 | 용도 |
|---------|------|------|
| auth | middlewares/auth.ts | JWT 검증 |
| validate | middlewares/validate.ts | 요청 유효성 검사 |
| upload | middlewares/upload.ts | 파일 업로드 (multer) |

## 환경변수

| 변수 | 용도 |
|------|------|
| DATABASE_URL | DB 연결 |
| JWT_SECRET | 토큰 서명 |
| PORT | 서버 포트 |

## 주의사항

- (기존 패턴과 충돌 가능성, 따라야 할 컨벤션, 주의할 점)
- 예: "모든 라우트는 /api 접두사를 사용 — 직접 / 에 매핑하지 말 것"
- 예: "비즈니스 로직은 반드시 services/ 레이어에 — controller에서 직접 DB 호출하지 말 것"
- 예: "에러는 반드시 AppError 클래스를 사용 — new Error() 직접 사용 금지"
```

---

## 신규 프로젝트인 경우

BE 관련 파일이 전혀 없으면:

```markdown
# 기존 BE 코드 현황

기존 BE 코드 없음 — 처음부터 구현.

## 프로젝트 설정 감지

- package.json: (있음/없음)
- 감지된 기술: (있으면 나열)

## 권장사항

(04_task_BE.md의 기술 스택 지시에 따름)
```

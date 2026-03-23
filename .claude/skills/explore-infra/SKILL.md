---
name: explore-infra
description: "인프라 엔지니어가 작업 전 기존 인프라 설정을 파악할 때 사용하는 skill. Dockerfile, docker-compose, CI/CD 파이프라인, 환경변수, 배포 플랫폼을 탐색해서 기존 설정과 일관된 작업이 가능하게 한다. Infra Agent가 04_task_INFRA.md를 받고 작업에 착수하기 전, 코드베이스를 처음 접하는 상황, 또는 기존 인프라에 새 서비스를 추가할 때 반드시 사용한다."
context: fork
agent: Explore
---

# Explore Infra

Infra Agent가 작업을 시작하기 전에 기존 인프라 설정과 배포 환경을 파악하는 skill이다.

기존 프로젝트에 인프라를 추가하거나 변경할 때, 기존 설정과 다른 방식으로 구성하면 환경이 일관성을 잃는다. 이 skill은 기존 인프라를 탐색해서 "이 프로젝트에서는 이렇게 배포한다"를 파악하고, Infra Agent가 동일한 패턴으로 작업할 수 있도록 현황을 정리한다.

신규 프로젝트(기존 인프라 없음)의 경우에도 실행하되, "기존 인프라 없음 — 처음부터 구성"으로 보고한다.

---

## 탐색 절차

Explore agent를 사용하여 아래 항목들을 순서대로 탐색한다.

### 1. Dockerfile 확인

```
Glob: **/Dockerfile*
Glob: **/.dockerignore
```

확인할 항목:

| 항목 | 왜 중요한가 |
|------|-----------|
| Dockerfile 수 | 모노레포면 서비스별 Dockerfile이 있을 수 있다 |
| 베이스 이미지 | `node:20-alpine` vs `node:20` 등 — 새 Dockerfile도 동일 계열로 |
| 멀티 스테이지 여부 | 기존이 멀티 스테이지면 새 것도 맞춘다 |
| .dockerignore 내용 | 빠진 항목이 없는지 확인 |

### 2. docker-compose 확인

```
Glob: docker-compose*.yml
Glob: docker-compose*.yaml
Glob: compose*.yml
Glob: compose*.yaml
```

확인할 항목:
- 정의된 서비스 목록과 각 역할
- 네트워크 구성 (커스텀 네트워크 / 기본)
- 볼륨 설정 (DB 영속성, 로컬 마운트)
- 포트 매핑 현황
- 환경변수 주입 방식 (`environment` / `env_file`)
- 헬스체크 설정 여부
- 개발용 / 프로덕션용 분리 여부

### 3. CI/CD 파이프라인 확인

```
Glob: .github/workflows/*.yml
Glob: .github/workflows/*.yaml
Glob: .gitlab-ci.yml
Glob: Jenkinsfile
Glob: .circleci/**/*
Glob: bitbucket-pipelines.yml
```

확인할 항목:
- CI/CD 도구 (GitHub Actions / GitLab CI / Jenkins 등)
- 트리거 조건 (PR / push / tag)
- 파이프라인 단계 (lint → test → build → deploy)
- 시크릿 참조 방식 (`${{ secrets.XXX }}`)
- 배포 대상 환경 (staging / production)
- 캐싱 설정 (node_modules, Docker layer 등)

### 4. 환경변수 확인

```
Glob: .env.example
Glob: .env.sample
Glob: .env.template
Glob: .env.*.example
Grep: process\.env\.|os\.environ|import\.meta\.env
```

확인할 항목:
- 정의된 환경변수 목록과 용도
- FE용 / BE용 / 공통 분류
- 시크릿 변수 (DB 비밀번호, API 키 등)
- 환경별 분기 여부 (.env.development / .env.production)

### 5. package.json scripts 확인

```
Glob: **/package.json
```

확인할 항목 (scripts 섹션):
- 빌드 명령어 (`build`, `build:prod`)
- 개발 서버 (`dev`, `start:dev`)
- 테스트 (`test`, `test:e2e`)
- 린트 (`lint`, `lint:fix`)
- DB 관련 (`migrate`, `seed`, `db:push`)
- 배포 관련 (`deploy`, `docker:build`)

### 6. 배포 플랫폼 설정 확인

```
Glob: vercel.json
Glob: netlify.toml
Glob: railway.toml
Glob: fly.toml
Glob: app.yaml
Glob: appspec.yml
Glob: Procfile
Glob: render.yaml
Glob: **/terraform/**/*
Glob: **/k8s/**/*
Glob: **/kubernetes/**/*
```

확인할 항목:
- 사용 중인 배포 플랫폼
- 빌드 설정 (빌드 명령어, 출력 디렉토리)
- 리전/존 설정
- 스케일링 설정
- 도메인/라우팅 설정

### 7. 외부 서비스 확인

```
Grep: postgresql|mysql|mongodb|redis|elasticsearch|rabbitmq|kafka|s3|cloudfront|sentry
Glob: prisma/schema.prisma
```

docker-compose, .env.example, package.json 의존성에서 외부 서비스를 추론한다:

| 단서 | 외부 서비스 |
|------|-----------|
| `pg`, `@prisma/client`, `DATABASE_URL` | PostgreSQL |
| `mysql2`, `MYSQL_` | MySQL |
| `mongoose`, `MONGODB_URI` | MongoDB |
| `ioredis`, `redis`, `REDIS_URL` | Redis |
| `@aws-sdk/client-s3`, `S3_BUCKET` | AWS S3 |
| `@sentry/node`, `SENTRY_DSN` | Sentry |
| `bull`, `bullmq` | Redis (큐) |

---

## 출력 형식

탐색 결과를 아래 형식으로 정리하여 반환한다:

```markdown
# 기존 인프라 현황

## 컨테이너화

| 항목 | 상태 |
|------|------|
| Dockerfile | FE: Dockerfile / BE: Dockerfile.be |
| 베이스 이미지 | node:20-alpine |
| 멀티 스테이지 | 사용 (builder → runner) |
| docker-compose | 개발용: docker-compose.yml / 프로덕션: docker-compose.prod.yml |
| 서비스 | app, db (postgres:15), redis |
| 네트워크 | 커스텀 (app-network) |

## CI/CD

| 항목 | 상태 |
|------|------|
| 도구 | GitHub Actions |
| CI | .github/workflows/ci.yml (PR → lint, test, build) |
| CD | .github/workflows/cd.yml (main → staging → production) |
| 캐싱 | node_modules 캐싱 설정됨 |
| 시크릿 | DEPLOY_KEY, DATABASE_URL 등 사용 |

## 배포 플랫폼

| 항목 | 상태 |
|------|------|
| 플랫폼 | AWS ECS / Vercel / Railway 등 |
| 환경 | staging, production |
| 배포 방식 | 롤링 / 블루-그린 등 |

## 환경변수

| 변수 | 분류 | 용도 |
|------|------|------|
| DATABASE_URL | BE | DB 연결 |
| JWT_SECRET | BE | 토큰 서명 |
| NEXT_PUBLIC_API_URL | FE | API 엔드포인트 |
| NODE_ENV | 공통 | 환경 구분 |
| PORT | 공통 | 서버 포트 |

## 외부 서비스

| 서비스 | 종류 | 연결 방식 |
|--------|------|----------|
| PostgreSQL 15 | DB | docker-compose (로컬) / RDS (프로덕션) |
| Redis 7 | 캐시/큐 | docker-compose (로컬) |

## 재사용 가능한 설정

- (기존 Dockerfile 패턴, CI/CD 워크플로우 등)
- 예: "기존 CI에 lint + test + build 3단계가 있으므로 새 서비스도 동일 구조로"
- 예: "docker-compose에 DB 서비스가 이미 있으므로 새로 추가하지 않아도 됨"

## 새로 만들어야 할 것

- (04_task_INFRA.md 기준으로 기존에 없는 설정)
- 예: "CD 파이프라인 없음 — 새로 작성 필요"
- 예: "BE용 Dockerfile 없음 — 기존 FE Dockerfile 패턴 참고하여 작성"

## 주의사항

- (기존 설정과 충돌 가능성, 따라야 할 규칙)
- 예: "포트 3000은 FE가 사용 중 — BE는 다른 포트를 써야 함"
- 예: "docker-compose 네트워크가 커스텀이므로 새 서비스도 같은 네트워크에 연결"
- 예: ".env 파일이 .gitignore에 없음 — 추가 필요"
```

---

## 신규 프로젝트인 경우

인프라 관련 파일이 전혀 없으면:

```markdown
# 기존 인프라 현황

기존 인프라 없음 — 처음부터 구성.

## 프로젝트 설정 감지

- package.json: (있음/없음)
- 감지된 기술: (있으면 나열)
- .gitignore: (.env 포함 여부)

## 권장사항

(04_task_INFRA.md의 인프라 요구사항에 따름)
```

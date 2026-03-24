---
name: write-dockerfile
description: "인프라 엔지니어가 FE/BE용 Dockerfile을 작성할 때 멀티 스테이지 빌드와 레이어 캐싱 최적화를 적용하기 위해 참조하는 skill. Infra Agent가 Dockerfile을 새로 작성하거나, 기존 Dockerfile을 개선하거나, 컨테이너 이미지를 최적화할 때 반드시 사용한다. 'Dockerfile 작성', 'Docker 이미지 빌드', '컨테이너화', '멀티 스테이지 빌드', '이미지 크기 최적화', '.dockerignore', 'HEALTHCHECK' 등의 상황에서 트리거된다."
---

# Write Dockerfile

인프라 엔지니어가 FE/BE 서비스용 Dockerfile을 작성할 때 따르는 패턴이다.

Dockerfile은 한 번 작성하면 모든 빌드와 배포에서 반복 실행된다. 잘못된 레이어 순서는 매 빌드마다 불필요한 재설치를 유발하고, 단일 스테이지 빌드는 프로덕션 이미지에 빌드 도구를 포함시켜 이미지 크기와 보안 위험을 키운다. 이 skill은 "빌드는 빠르게, 이미지는 작게, 실행은 안전하게"를 달성하는 패턴을 제공한다.

---

## 멀티 스테이지 빌드 구조

하나의 Dockerfile을 3개 스테이지로 나눈다. 각 스테이지는 자기 역할만 수행하고, 최종 이미지(runner)에는 실행에 필요한 것만 남긴다. 이렇게 하면 빌드 도구(TypeScript 컴파일러, devDependencies 등)가 프로덕션 이미지에 들어가지 않아 이미지 크기가 줄고 공격 표면이 줄어든다.

```
Stage 1 (deps)    → 의존성 설치만
Stage 2 (builder) → 빌드만
Stage 3 (runner)  → 실행에 필요한 것만 복사
```

### Next.js (FE) Dockerfile

```dockerfile
# ──── Stage 1: 의존성 설치 ────
FROM node:20-alpine AS deps
WORKDIR /app

# 의존성 파일만 먼저 복사 — 소스가 바뀌어도 이 레이어는 캐시됨
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ──── Stage 2: 빌드 ────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js standalone 모드 — 필요한 파일만 .next/standalone에 출력
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ──── Stage 3: 실행 ────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 보안: root가 아닌 전용 유저로 실행
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# standalone 빌드 결과만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
```

### Express/Fastify (BE) Dockerfile

```dockerfile
# ──── Stage 1: 의존성 설치 ────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ──── Stage 2: 빌드 ────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ──── Stage 3: 실행 ────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 보안: 전용 유저 생성
RUN addgroup --system --gid 1001 appgroup \
 && adduser --system --uid 1001 appuser

# 프로덕션 의존성만 설치 — devDependencies 제외
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

# 빌드 결과물만 복사
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Prisma 사용 시 — 스키마와 클라이언트도 복사
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 4000
ENV PORT=4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
```

---

## 레이어 캐싱 최적화

Docker는 각 명령어를 레이어로 캐싱한다. 레이어가 변경되면 그 이후 모든 레이어가 무효화된다. 따라서 변경 빈도가 낮은 것을 위에, 높은 것을 아래에 배치해야 캐시 히트율이 높아진다.

### 올바른 순서

```dockerfile
# 1. 베이스 이미지          — 거의 안 바뀜
FROM node:20-alpine

# 2. 시스템 패키지          — 거의 안 바뀜
RUN apk add --no-cache curl

# 3. 의존성 파일 복사       — 패키지 추가/삭제 시에만 바뀜
COPY package.json package-lock.json ./

# 4. 의존성 설치            — 3이 바뀔 때만 재실행
RUN npm ci

# 5. 소스 코드 복사         — 코드 수정마다 바뀜
COPY . .

# 6. 빌드                  — 5가 바뀔 때마다 재실행
RUN npm run build
```

### 흔한 실수

```dockerfile
# ❌ 나쁜 예: 소스를 먼저 복사하면 코드 한 줄 바꿔도 npm ci가 다시 실행됨
COPY . .
RUN npm ci
RUN npm run build

# ✅ 좋은 예: 의존성 파일만 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

---

## 보안 원칙

### root 유저로 실행하지 않기

컨테이너가 root로 실행되면 취약점을 통해 호스트 시스템까지 영향을 받을 수 있다. 전용 유저를 생성하고 해당 유저로 실행한다.

```dockerfile
RUN addgroup --system --gid 1001 appgroup \
 && adduser --system --uid 1001 appuser
USER appuser
```

### 시크릿을 이미지에 넣지 않기

`ARG`나 `ENV`로 시크릿을 전달하면 이미지 레이어에 기록되어 누구나 `docker history`로 볼 수 있다.

```dockerfile
# ❌ 시크릿이 이미지에 기록됨
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# ✅ 런타임에 환경변수로 주입
# docker run -e DATABASE_URL=... my-image
# 또는 docker-compose의 env_file 사용
```

빌드 시 시크릿이 필요한 경우(예: private npm registry) `--mount=type=secret`을 사용한다:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc npm ci
```

### .dockerignore 반드시 작성

빌드 컨텍스트에 불필요한 파일이 포함되면 빌드 시간과 이미지 크기가 늘어나고, `.env` 같은 시크릿이 이미지에 포함될 수 있다.

```
# .dockerignore
node_modules
.next
dist
.git
.env
.env.*
*.md
.vscode
.idea
coverage
__tests__
```

---

## 헬스체크

헬스체크가 없으면 Docker와 오케스트레이터(docker-compose, Kubernetes)가 컨테이너 상태를 알 수 없다. 서비스가 hang 상태여도 "healthy"로 판단되어 트래픽이 계속 들어온다.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:PORT/health || exit 1
```

| 옵션 | 값 | 설명 |
|------|-----|------|
| `--interval` | 30s | 체크 간격 |
| `--timeout` | 3s | 응답 대기 시간 |
| `--start-period` | 10s | 시작 후 유예 시간 (앱 초기화 대기) |
| `--retries` | 3 | 연속 실패 시 unhealthy 판정 |

alpine 이미지에는 `curl`이 없으므로 `wget`을 사용한다. curl이 필요하면 `apk add --no-cache curl`로 설치한다.

---

## 이미지 크기 최소화

| 기법 | 효과 |
|------|------|
| `alpine` 기반 이미지 사용 | ~120MB → ~50MB |
| 멀티 스테이지로 빌드 도구 제외 | devDependencies, TypeScript 등 제거 |
| `npm ci --omit=dev` (runner) | 프로덕션 의존성만 설치 |
| Next.js `standalone` 모드 | 필요한 node_modules만 포함 |
| `.dockerignore`로 불필요 파일 제외 | 빌드 컨텍스트 축소 |
| `--no-cache` 플래그로 apk 캐시 제거 | 패키지 매니저 캐시 제거 |

---

## Dockerfile 작성 체크리스트

Dockerfile을 작성한 후 아래를 확인한다:

1. [ ] **멀티 스테이지** — deps / builder / runner 3단계 구성
2. [ ] **레이어 캐싱** — package.json 먼저 복사 → npm ci → 소스 복사 순서
3. [ ] **alpine 이미지** — `node:XX-alpine` 사용
4. [ ] **비root 유저** — `adduser` + `USER` 지시어 설정
5. [ ] **시크릿 미포함** — ARG/ENV에 비밀번호, API 키 없음
6. [ ] **.dockerignore** — node_modules, .env, .git 등 제외
7. [ ] **HEALTHCHECK** — 헬스체크 엔드포인트 설정
8. [ ] **EXPOSE** — 사용하는 포트 명시
9. [ ] **ENV NODE_ENV=production** — runner 스테이지에 설정
10. [ ] **이미지 빌드 테스트** — `docker build` 성공 확인

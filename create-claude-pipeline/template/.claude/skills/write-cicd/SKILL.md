---
name: write-cicd
description: "인프라 엔지니어가 GitHub Actions CI/CD 파이프라인을 작성할 때 참조하는 skill. CI(PR 검증)와 CD(자동 배포)를 분리하여 작성하며, 캐싱, 헬스체크, 롤백, 시크릿 관리 패턴을 제공한다. Infra Agent가 CI/CD 파이프라인을 새로 만들거나, 기존 워크플로우를 수정하거나, 배포 자동화를 설정할 때 반드시 사용한다. 'CI/CD 작성', 'GitHub Actions 설정', '배포 파이프라인', '자동 배포', 'PR 검증 워크플로우', 'Docker 배포', 'GHCR 푸시', '롤백 설정', 'ci.yml 작성', 'cd.yml 작성' 등의 상황에서 트리거된다."
---

# Write CI/CD

인프라 엔지니어가 GitHub Actions CI/CD 파이프라인을 작성할 때 따르는 패턴이다.

CI와 CD를 별도 워크플로우 파일로 분리한다. CI는 "코드가 안전한가"를 검증하고, CD는 "검증된 코드를 배포"한다. 이 분리가 중요한 이유는, CI는 모든 PR에서 빈번하게 실행되므로 가볍고 빨라야 하고, CD는 main 머지 후에만 실행되므로 Docker 빌드 같은 무거운 작업을 포함할 수 있기 때문이다.

---

## 파일 구조

```
.github/
└── workflows/
    ├── ci.yml     # PR 검증 — lint, typecheck, test, build
    └── cd.yml     # 자동 배포 — Docker build, push, deploy, rollback
```

기존 프로젝트에 이미 워크플로우 파일이 있으면 기존 구조를 따른다.

---

## CI 워크플로우 (ci.yml)

PR이 생성되거나 업데이트될 때 실행된다. 모든 검증이 통과해야 머지할 수 있다.

```yaml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      # 1. 코드 체크아웃
      - uses: actions/checkout@v4

      # 2. Node.js 설정 + 의존성 캐싱
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      # 3. 의존성 설치
      - run: npm ci

      # 4. 린트 검사
      - run: npm run lint

      # 5. 타입 체크
      - run: npm run typecheck

      # 6. 테스트 실행
      - run: npm run test

      # 7. 빌드 확인
      - run: npm run build
```

### CI 설계 원칙

**concurrency 설정**: 같은 PR에서 새 커밋이 푸시되면 이전 CI를 취소한다. 불필요한 리소스 낭비를 방지한다.

**`npm ci` vs `npm install`**: `npm ci`는 `package-lock.json`을 그대로 사용하므로, 팀원 간 의존성 차이 없이 동일한 환경을 재현한다. CI에서는 항상 `npm ci`를 사용한다.

**캐싱**: `actions/setup-node`의 `cache: 'npm'`이 `~/.npm` 디렉토리를 자동 캐싱한다. 매번 모든 패키지를 다운로드하지 않아 CI 시간이 단축된다.

**단계 순서**: 빠르게 실패하는 검사를 먼저 실행한다. lint(초 단위) → typecheck(초 단위) → test(분 단위) → build(분 단위) 순서로, 빠른 검사에서 실패하면 느린 검사를 실행하지 않는다.

**Branch protection**: CI를 GitHub의 Branch Protection Rule에 등록하여, CI 통과 없이는 머지할 수 없게 한다. 이것은 수동 설정이므로 워크플로우 파일로는 할 수 없고, 레포지토리 설정에서 직접 해야 한다.

---

## CD 워크플로우 (cd.yml)

main 브랜치에 머지되면 자동으로 배포를 진행한다. 스테이징은 자동, 프로덕션은 수동 승인 후 배포된다.

```yaml
name: CD

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ─── Docker 이미지 빌드 & 푸시 ───
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ─── 스테이징 배포 (자동) ───
  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          # 배포 플랫폼에 맞게 수정한다
          # 예: Docker Compose, Kubernetes, AWS ECS, Railway 등
          echo "Deploying ${{ needs.build-and-push.outputs.image-tag }} to staging"
          # ssh ${{ secrets.STAGING_HOST }} "docker pull ... && docker compose up -d"
        env:
          DEPLOY_HOST: ${{ secrets.STAGING_HOST }}
          DEPLOY_KEY: ${{ secrets.STAGING_SSH_KEY }}

      - name: Health check (staging)
        run: |
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.STAGING_URL }}/health" || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "Staging health check passed"
              exit 0
            fi
            echo "Attempt $i/30: status=$STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Staging health check failed after 30 attempts"
          exit 1

  # ─── 프로덕션 배포 (수동 승인) ───
  deploy-production:
    needs: [build-and-push, deploy-staging]
    runs-on: ubuntu-latest
    environment: production  # GitHub Environment로 수동 승인 게이트
    steps:
      - uses: actions/checkout@v4

      - name: Save current version for rollback
        id: current
        run: |
          # 현재 배포된 버전을 기록해둔다 (롤백에 필요)
          CURRENT_TAG=$(curl -s "${{ secrets.PRODUCTION_URL }}/health" | jq -r '.version // "unknown"')
          echo "current-tag=$CURRENT_TAG" >> "$GITHUB_OUTPUT"
          echo "Current production version: $CURRENT_TAG"

      - name: Deploy to production
        id: deploy
        run: |
          echo "Deploying ${{ needs.build-and-push.outputs.image-tag }} to production"
          # ssh ${{ secrets.PRODUCTION_HOST }} "docker pull ... && docker compose up -d"
        env:
          DEPLOY_HOST: ${{ secrets.PRODUCTION_HOST }}
          DEPLOY_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}

      - name: Health check (production)
        id: healthcheck
        run: |
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.PRODUCTION_URL }}/health" || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "Production health check passed"
              exit 0
            fi
            echo "Attempt $i/30: status=$STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Production health check failed"
          exit 1

      - name: Rollback on failure
        if: failure() && steps.deploy.outcome == 'success'
        run: |
          echo "Rolling back to ${{ steps.current.outputs.current-tag }}"
          # ssh ${{ secrets.PRODUCTION_HOST }} "docker pull <previous-image> && docker compose up -d"
          # 롤백 후 헬스체크
          sleep 15
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.PRODUCTION_URL }}/health" || echo "000")
          if [ "$STATUS" = "200" ]; then
            echo "Rollback successful"
          else
            echo "CRITICAL: Rollback also failed. Manual intervention required."
            exit 1
          fi
```

### CD 설계 원칙

**이미지 태깅**: commit SHA를 태그로 사용한다. `latest`는 편의를 위해 추가하지만, 배포에는 항상 SHA 태그를 사용해야 어떤 커밋이 배포되었는지 추적할 수 있다.

**빌드 캐시**: `cache-from/cache-to: type=gha`로 GitHub Actions의 캐시를 활용한다. Docker 레이어 캐시를 통해 변경이 없는 레이어는 다시 빌드하지 않아 빌드 시간이 크게 단축된다.

**스테이징 → 프로덕션 순서**: 스테이징에서 먼저 검증한 후 프로덕션에 배포한다. `environment: production` 설정으로 GitHub에서 수동 승인을 요구하므로, 스테이징 검증 결과를 확인한 후 승인할 수 있다.

**헬스체크**: 배포 후 `/health` 엔드포인트를 최대 5분(10초 × 30회) 동안 폴링한다. 서비스가 기동하는 데 시간이 걸리기 때문에 즉시 확인하면 실패할 수 있다.

**자동 롤백**: 프로덕션 배포 후 헬스체크가 실패하면 이전 버전으로 자동 롤백한다. 배포 전에 현재 버전을 기록해두었다가 롤백에 사용한다. 롤백마저 실패하면 수동 개입이 필요함을 명시한다.

---

## 시크릿 관리

모든 민감 정보는 GitHub Secrets에 저장하고, 코드에 직접 작성하지 않는다.

### 필요한 시크릿 목록

| 시크릿 이름 | 용도 | 설정 위치 |
|------------|------|----------|
| `GITHUB_TOKEN` | GHCR 로그인 (자동 제공) | 자동 |
| `STAGING_HOST` | 스테이징 서버 주소 | Repository Secrets |
| `STAGING_SSH_KEY` | 스테이징 SSH 키 | Repository Secrets |
| `STAGING_URL` | 스테이징 URL (헬스체크용) | Repository Secrets |
| `PRODUCTION_HOST` | 프로덕션 서버 주소 | Environment Secrets (production) |
| `PRODUCTION_SSH_KEY` | 프로덕션 SSH 키 | Environment Secrets (production) |
| `PRODUCTION_URL` | 프로덕션 URL (헬스체크용) | Environment Secrets (production) |

**Repository Secrets vs Environment Secrets**: 프로덕션 관련 시크릿은 Environment Secrets에 저장한다. 이렇게 하면 `environment: production` 승인을 통과해야만 해당 시크릿에 접근할 수 있어서, 일반 워크플로우에서 프로덕션 크레덴셜이 노출되는 것을 방지한다.

### 시크릿 사용 규칙

- 워크플로우에서 `${{ secrets.NAME }}`으로 참조한다
- 시크릿 값은 로그에 자동 마스킹된다
- 새로운 시크릿이 필요하면 README나 주석에 어떤 시크릿을 설정해야 하는지 기록한다
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인한다

---

## 배포 플랫폼별 커스터마이징

CD 워크플로우의 배포 스텝은 플랫폼에 따라 달라진다. 위 템플릿의 배포 커맨드를 프로젝트에 맞게 교체한다.

| 플랫폼 | 배포 방식 |
|--------|----------|
| Docker Compose (VPS) | `ssh + docker compose pull && docker compose up -d` |
| Kubernetes | `kubectl set image deployment/app app=<image>` |
| AWS ECS | `aws ecs update-service --force-new-deployment` |
| Railway / Fly.io | 플랫폼 CLI 사용 (`railway up`, `fly deploy`) |
| Vercel / Netlify | 별도 CD 불필요 (Git 연동으로 자동 배포) |

Vercel/Netlify 같은 PaaS를 사용하는 프로젝트는 CD 워크플로우가 불필요할 수 있다. 이 경우 CI 워크플로우만 작성한다.

---

## 구현 순서 체크리스트

1. [ ] 기존 `.github/workflows/` 확인 (이미 있으면 기존 패턴 유지)
2. [ ] `ci.yml` 작성 — PR 트리거, lint/typecheck/test/build
3. [ ] `cd.yml` 작성 — main 머지 트리거, Docker build/push/deploy
4. [ ] Dockerfile 확인 (없으면 생성)
5. [ ] `/health` 엔드포인트 확인 (없으면 BE에게 요청)
6. [ ] GitHub Secrets 목록 정리 및 README에 기록
7. [ ] GitHub Environment 설정 (staging, production) 안내
8. [ ] Branch Protection Rule 설정 안내 (CI 통과 필수)

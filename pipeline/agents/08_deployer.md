# Agent 08 — 배포 Agent

## 역할

QA 전체 통과 후 Docker 기반으로 Staging 자동 배포 및 Production 승인 배포를 수행합니다.
Agent 07의 성공 로그와 `deploy/` 설정 파일을 입력받아 이미지 빌드, 배포, Health Check까지 자동 실행합니다.

## 입력

- Agent 07의 성공 로그 (docs/qa-logs/{날짜}_{페이지}/)
- `deploy/Dockerfile.frontend` — FE 이미지 빌드 설정
- `deploy/Dockerfile.backend` — BE 이미지 빌드 설정
- `deploy/docker-compose.yml` — 컨테이너 구성
- `deploy/deploy-config.yml` — 환경별 배포 설정 (staging/production)

## 출력

```
docs/deploy-logs/{날짜}_{환경}.md   ← 배포 결과 문서
```

## 실행 절차

### 1. 사전 검증

```
1. Docker 설치 확인 (docker --version)
2. deploy/ 디렉토리 존재 확인
3. 필수 설정 파일 4개 존재 확인:
   - deploy/Dockerfile.frontend
   - deploy/Dockerfile.backend
   - deploy/docker-compose.yml
   - deploy/deploy-config.yml
4. 실패 시 → 에러 메시지 출력 + 파이프라인 일시 정지
```

### 2. Docker 이미지 빌드

```
1. FE 이미지 빌드: docker build -f deploy/Dockerfile.frontend -t {프로젝트}-frontend:{태그} ./frontend
2. BE 이미지 빌드: docker build -f deploy/Dockerfile.backend -t {프로젝트}-backend:{태그} ./backend
3. 빌드 실패 시 → 에러 문서 생성 + 재시도 (최대 3회)
4. 태그 형식: {날짜}-{git-short-hash} (예: 20260220-a1b2c3d)
```

### 3. Staging 배포 (자동)

```
1. docker-compose -f deploy/docker-compose.yml --profile staging up -d
2. Health Check 실행:
   - FE: GET {staging_url}/ → 200 확인
   - BE: GET {staging_url}/health → 200 확인
3. Health Check 실패 시 → 롤백 절차 진입
4. 성공 시 → 배포 로그 문서 생성
```

### 4. Production 승인 대기

```
⏸️ Staging 배포 성공 후 Production 배포는 사람 승인 필요

승인 대기 시 출력:
  "Staging 배포 완료. Production 배포를 진행하시겠습니까?"
  - Staging URL: {staging_url}
  - 빌드 태그: {태그}
  - QA 결과: 전체 통과 ({N}건)

승인 시:
  1. docker-compose -f deploy/docker-compose.yml --profile production up -d
  2. Health Check (FE + BE)
  3. 성공 → 배포 완료 로그 문서 생성
  4. 실패 → 롤백 절차 진입
```

### 5. 배포 로그 문서화

```markdown
# docs/deploy-logs/{날짜}_{환경}.md

# 배포 로그 — {환경}

프로젝트:   {프로젝트명}
환경:       {Staging|Production}
일시:       {날짜 시간}
빌드 태그:  {태그}

## 빌드 결과
  FE 이미지: {프로젝트}-frontend:{태그} — {성공|실패}
  BE 이미지: {프로젝트}-backend:{태그} — {성공|실패}

## 배포 결과
  FE: {URL} → {상태코드} {응답시간}
  BE: {URL}/health → {상태코드} {응답시간}

## Health Check
  FE: {PASS|FAIL}
  BE: {PASS|FAIL}
```

## 롤백 절차

```
롤백 트리거:
  - Health Check 실패
  - 배포 후 서비스 응답 불가

롤백 실행:
  1. 이전 이미지 태그 조회 (deploy-logs에서 마지막 성공 태그)
  2. 이전 이미지로 컨테이너 재시작
  3. Health Check 재실행
  4. 롤백 결과 문서화

롤백 실패 시:
  - 1~2회: 다른 이전 태그로 재시도
  - 3회 이상: ⏸️ 파이프라인 일시 정지 → 사람에게 에스컬레이션
```

## 배포 확장 가이드

`deploy/deploy-config.yml`의 `provider` 설정으로 배포 대상 확장 가능:

| provider | 설명 |
|---|---|
| `docker` (기본값) | Docker Compose 기반 로컬/서버 배포 |
| `vercel` | Vercel CLI 기반 FE 배포 (BE는 별도) |
| `aws-ecs` | AWS ECS Fargate 배포 |
| `gcp-run` | Google Cloud Run 배포 |

기본값은 `docker`이며, 프로젝트별로 확장 설정을 추가할 수 있습니다.

## 사용 스킬

- `notion_logger` — 배포 결과를 Notion PIPELINE_LOG에 기록

## 사용 MCP

- `File System MCP` — 배포 로그 문서 저장
- `Notion MCP` — 배포 로그를 Notion에 기록 (선택적, 미연결 시 로컬 전용)

## Notion 로그 기록

실행 절차 완료 후 `notion_logger` 스킬을 사용:

1. PIPELINE_LOG 하위에 배포 결과 페이지 생성
   - 제목: {날짜} {프로젝트} {페이지} — DEPLOYED
   - 섹션: 배포 요약, 빌드 결과, Health Check 결과, 환경 정보
2. Pipeline Runs DB에 행 추가
   - Phase: Phase 6, Status: Deployed, Duration
3. Notion MCP 미연결 시: 경고 출력 후 로컬만 기록

## 다음 단계

- Staging 배포 성공 → Production 승인 대기
- Production 배포 성공 → 파이프라인 완료
- 배포 실패 → 롤백 → 3회 실패 시 에스컬레이션

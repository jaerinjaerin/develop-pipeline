# visit-gangnam 프로젝트

## 프로젝트 개요
서울 강남 지역을 소개하는 웹사이트. 프론트엔드와 어드민 두 개의 클라이언트가 존재하나, 1차 개발은 프론트엔드만 구현한다.

## Stack
- **Framework**: Next.js (App Router) — 프론트엔드 + API Routes 통합
- **DB**: MariaDB
- **Hosting**: 카페24 Node.js 호스팅

## Stack Guidelines
- Frontend + API: ../../pipeline/stacks/nextjs/frontend-guidelines.md

## 아키텍처

```
frontend/              ← Next.js 프로젝트 (프론트 + API Routes)
├── src/
│   ├── app/           ← App Router (pages, layouts)
│   │   └── api/       ← API Routes (백엔드)
│   ├── components/    ← React 컴포넌트
│   ├── lib/           ← 유틸리티, DB 연결
│   └── types/         ← TypeScript 타입
deploy/                ← 배포 설정 (Agent 08)
docs/                  ← Agent가 생성하는 문서
├── errors/            ← 에러 문서 (Agent 06)
├── qa-logs/           ← QA 성공 로그 (Agent 07)
├── deploy-logs/       ← 배포 로그 (Agent 08)
└── pipeline-logs/     ← 파이프라인 개선 로그
```

> `backend/` 디렉토리는 사용하지 않음. API는 `frontend/src/app/api/`에서 처리.

## 향후 계획
- **2차 개발**: 어드민 페이지 추가 (별도 프로젝트 또는 Next.js 내 `/admin` 라우트)

## Notion 통합 (선택적)
- PIPELINE_LOG Page ID: (루트 CLAUDE.md에서 상속)
- Pipeline Runs DB ID: (루트 CLAUDE.md에서 상속)

## 파이프라인 실행

이 프로젝트는 루트 CLAUDE.md의 파이프라인을 따릅니다.

```
Phase 1 · Agent 01 → 문서 작성 (docs/)
Phase 2 · Agent 02 → GitHub 이슈 생성
Phase 3 · Agent 03 → FE 개발 (API Routes 포함)
Phase 4 · Agent 05 → QA (E2E 테스트)
Phase 5 · Agent 06/07 → 로그 문서화
Phase 6 · Agent 08 → 배포 (Staging 자동 + Production 승인)
```

> Agent 04 (BE)는 별도 실행하지 않음. API Routes는 Agent 03이 함께 구현.

# TASK CONTEXT — 인프라 엔지니어 (Dex)

## 1. 프로젝트 현황

- 서비스명: Agent Pipeline Dashboard
- 현재 단계: Phase 3 — 구현
- 기술 스택:
  - Next.js 14 (App Router, TypeScript)
  - Tailwind CSS + 커스텀 다크 테마 CSS 변수
  - UI 라이브러리 없음 (커스텀 컴포넌트)
  - 인증/인가: 없음 (이번에 신규 구현)
  - 데이터베이스: 없음 (이번에 SQLite 도입)
  - 기존 페이지: `/` (대시보드) 1개
  - 기존 API: pipeline 관련 4개 (start, stream, approve, outputs)

## 2. 이번 요구사항

로그인 페이지를 신규 구현하여 대시보드 접근을 인증된 사용자로 제한한다.

**인프라 관련 범위:**
- SQLite DB 파일 저장 경로 설정 (`data/` 디렉토리)
- 환경변수 관리 (JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
- `.env.example` 파일 작성
- `.gitignore` 업데이트 (`.env`, `data/` 추가)
- Docker 설정 업데이트 (있는 경우)

**미포함:** 회원가입, 비밀번호 찾기, 소셜 로그인, 사용자 관리, RBAC

## 3. 기획안

### 관련 기능 명세

| ID | 기능명 | 설명 | 우선순위 |
|----|-------|------|---------|
| F-07 | 사용자 DB | SQLite 기반 users 테이블. DB 파일은 `data/app.db` | P0 |
| F-08 | 초기 계정 시딩 | 환경변수에서 관리자 계정 읽어 시딩 | P0 |

### 비기능 요구사항 (인프라 관련)

| 항목 | 기준 |
|------|------|
| SQLite DB 파일 위치 | `data/app.db` (프로젝트 루트 `data/` 디렉토리) |
| Docker 볼륨 | `data/` 디렉토리를 볼륨 마운트 대상으로 설정 |
| 환경변수 | `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`를 `.env`로 관리 |
| .gitignore | `.env`, `data/` 추가 |

### 엣지케이스

| ID | 상황 | 예상 동작 |
|----|------|----------|
| E-07 | JWT_SECRET 미설정 | 서버 시작 실패 (앱 레벨에서 검증) |
| E-09 | DB 파일 접근 불가 | 500 에러 + 서버 로그 기록 |

## 4. 내 역할 및 작업 지시

- **역할:** 인프라 엔지니어
- **해야 할 일:**
  1. `data/` 디렉토리 생성 + `.gitkeep` 파일 추가 (Git 추적 대상이되 DB 파일은 제외)
  2. `.env.example` 파일 작성 (필수 환경변수 템플릿)
  3. `.gitignore` 업데이트: `.env`, `data/*.db` 추가
  4. Docker 설정 확인/업데이트 (Dockerfile, docker-compose 있는 경우):
     - `data/` 디렉토리 볼륨 마운트
     - 환경변수 전달 설정
     - `better-sqlite3` 네이티브 빌드 관련 설정 (필요 시)
  5. 개발 환경 초기 설정 스크립트 필요 시 작성
- **산출물 형식:** 설정 파일 (.env.example, .gitignore, Docker 설정 등)
- **건드리면 안 되는 것:** 프론트엔드 컴포넌트/페이지, API 라우트 코드, 인증 로직, DB 스키마/마이그레이션 코드

### 작업 순서 권장

```
1단계 (최우선 — FE/BE에 선행):
  - data/ 디렉토리 + .gitkeep
  - .env.example 작성
  - .gitignore 업데이트

2단계 (Docker 설정, 있는 경우):
  - Dockerfile 업데이트
  - docker-compose 업데이트
```

## 5. 참고 자료

### 환경변수 명세

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `JWT_SECRET` | 예 | 없음 (미설정 시 시작 실패) | JWT 서명 시크릿 (최소 32자 권장) |
| `ADMIN_EMAIL` | 예 | 없음 | 초기 관리자 이메일 |
| `ADMIN_PASSWORD` | 예 | 없음 | 초기 관리자 비밀번호 (시딩 시 bcrypt 해싱) |
| `JWT_EXPIRES_IN` | 아니오 | `24h` | JWT 토큰 만료 시간 |

**.env.example 내용:**

```
# JWT 인증
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h

# 초기 관리자 계정 (시딩용)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

### DB 파일 구조

```
프로젝트 루트/
├── data/
│   ├── .gitkeep           ← Git 추적용 빈 파일
│   └── app.db             ← SQLite DB 파일 (런타임 생성, Git 제외)
```

- SQLite DB 파일은 BE Agent가 `better-sqlite3`로 자동 생성
- `data/` 디렉토리가 존재해야 DB 파일 생성 가능
- Docker 환경에서는 `data/` 를 볼륨으로 마운트하여 컨테이너 재시작 시에도 데이터 유지

### .gitignore 추가 항목

```
# 환경변수
.env
.env.local

# SQLite DB
data/*.db
data/*.db-journal
data/*.db-wal
```

### 의존성 참고

BE Agent가 설치할 패키지 중 인프라 관련 주의사항:

| 패키지 | 주의사항 |
|--------|---------|
| `better-sqlite3` | 네이티브 모듈 — Docker 빌드 시 `node-gyp`, `python3`, `make`, `g++` 필요 |

Docker 빌드 스테이지에서 `better-sqlite3` 빌드를 위해 빌드 도구가 필요할 수 있음:
```dockerfile
# 예시 (Alpine 기반)
RUN apk add --no-cache python3 make g++
```

### FE/BE Agent와의 소통 포인트

| 대상 | 소통 내용 |
|------|----------|
| BE (Sam) | `data/` 디렉토리 경로 확정, 환경변수 이름 확정 |
| FE (Jay) | 없음 (직접 의존성 없음) |

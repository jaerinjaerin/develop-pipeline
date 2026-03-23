# ERD: 로그인 인증 시스템

## 테이블 정의

### users

사용자 계정 정보를 저장하는 테이블. 초기에는 시드 스크립트로 관리자 계정만 생성한다.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | TEXT (UUID) | PK | 사용자 고유 식별자 |
| email | TEXT | UNIQUE, NOT NULL | 로그인 이메일 |
| password_hash | TEXT | NOT NULL | bcrypt 해싱된 비밀번호 |
| name | TEXT | NOT NULL | 표시 이름 |
| role | TEXT | NOT NULL, DEFAULT 'admin' | 사용자 역할 (현재 'admin'만 사용) |
| created_at | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성 시각 |
| updated_at | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정 시각 |

**인덱스:**
- `idx_users_email` — email (UNIQUE)

## 관계도 (ASCII)

```
┌─────────────────────────────────┐
│              users              │
├─────────────────────────────────┤
│ PK  id           TEXT (UUID)    │
│     email        TEXT UNIQUE    │
│     password_hash TEXT          │
│     name         TEXT           │
│     role         TEXT           │
│     created_at   TEXT           │
│     updated_at   TEXT           │
└─────────────────────────────────┘
```

> 현재 단일 테이블 구조. 향후 세션 관리, 감사 로그, RBAC 등 확장 시 테이블 추가 예정.

## DB 선택: SQLite

| 항목 | 결정 | 사유 |
|------|------|------|
| DBMS | SQLite | 현재 DB 없는 프로젝트에 최소 비용으로 도입. 파일 기반으로 별도 서버 불필요 |
| ORM | better-sqlite3 | Next.js 서버 사이드에서 동기 호출 가능. 경량하고 성능 우수 |
| 파일 위치 | `data/app.db` | 프로젝트 루트 `data/` 디렉토리. Docker 볼륨 마운트 대상 |
| 마이그레이션 | SQL 파일 기반 | `src/lib/db/migrations/` 디렉토리에 순번 SQL 파일 관리 |

## 초기 데이터 (Seed)

환경변수에서 관리자 계정 정보를 읽어 시딩:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<초기 비밀번호>
```

시딩 로직:
1. `users` 테이블에 해당 email이 없으면 INSERT
2. 있으면 SKIP (멱등성 보장)
3. 비밀번호는 bcrypt(cost=12)로 해싱 후 저장

# nextjs-api Backend Guidelines

> ⚠️ 이 파일은 `init-project.sh`에 의해 자동 생성되었습니다.
> Phase 1에서 Agent 01이 프로젝트 요구사항에 맞게 내용을 보강합니다.

> Agent 04 (Backend)이 be_stack: nextjs-api 프로젝트에서 참조하는 가이드라인

## 기술 스택

<!-- TODO: 프로젝트에서 사용할 주요 라이브러리와 버전을 명시하세요 -->
- **Framework**: nextjs-api
- **Language**: <!-- TODO: 언어 및 버전 (예: Python 3.12+, Node.js 20+, Java 21) -->
- **ORM**: <!-- TODO: ORM 선택 (예: SQLAlchemy, Prisma, TypeORM, JPA) -->
- **DB**: <!-- TODO: 데이터베이스 선택 (예: PostgreSQL, MySQL, MongoDB) -->
- **Migration**: <!-- TODO: 마이그레이션 도구 (예: Alembic, Prisma Migrate, Flyway) -->
- **Auth**: <!-- TODO: 인증 방식 (예: JWT, Session, OAuth2) -->
- **Validation**: <!-- TODO: 유효성 검사 라이브러리 (예: Pydantic, Zod, class-validator) -->
- **Testing**: <!-- TODO: 테스트 프레임워크 (예: pytest, Jest, JUnit) -->

## 프로젝트 구조

<!-- TODO: 프로젝트의 디렉토리 구조를 정의하세요 -->
```
backend/
├── src/                       # (또는 app/)
│   ├── main                   # 앱 진입점
│   ├── config                 # 설정 (환경변수)
│   ├── database               # DB 연결
│   ├── domain/                # 도메인 계층
│   │   └── {feature}/
│   │       ├── models         # DB 모델
│   │       ├── schemas        # 요청/응답 스키마
│   │       ├── service        # 비즈니스 로직
│   │       ├── repository     # DB 접근
│   │       └── router         # API 라우터 (또는 controller)
│   └── common/
│       ├── exceptions         # 커스텀 예외
│       └── responses          # 공통 응답 형식
├── migrations/                # DB 마이그레이션
├── tests/
│   └── {feature}/
└── package.json               # (또는 pyproject.toml, build.gradle 등)
```

## 코딩 규칙

### API 엔드포인트

<!-- TODO: API 엔드포인트 작성 규칙을 프레임워크에 맞게 정의하세요 -->
- API명세의 경로/메서드/상태코드를 정확히 구현
- 도메인별 라우터/컨트롤러 분리
- 응답 모델을 명시
- 에러는 적절한 HTTP 상태코드로 처리

### 모델

<!-- TODO: DB 모델 작성 규칙을 정의하세요 -->
- ER 다이어그램의 테이블/필드/관계를 정확히 반영
- 테이블명: snake_case 복수형
- 관계 매핑 정의

### 스키마

<!-- TODO: 요청/응답 스키마 규칙을 정의하세요 -->
- 요청/응답 스키마를 분리
- API명세의 JSON 구조와 정확히 일치

### 비즈니스 로직

<!-- TODO: 비즈니스 로직 계층 규칙을 정의하세요 -->
- Service 계층에서 처리 (Router/Controller는 얇게)
- Repository 패턴으로 DB 접근 분리

### 인증/인가

<!-- TODO: 인증/인가 구현 방식을 정의하세요 -->
- 토큰 기반 인증 구현
- 권한 검사 미들웨어/데코레이터 활용

### DB 마이그레이션

<!-- TODO: 마이그레이션 전략을 정의하세요 -->
- 모든 스키마 변경은 마이그레이션으로 관리
- 마이그레이션 메시지: 변경 내용 명시

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 모듈 | <!-- TODO --> | <!-- TODO --> |
| 클래스 | PascalCase | <!-- TODO --> |
| 함수 | <!-- TODO --> | <!-- TODO --> |
| 상수 | UPPER_SNAKE | <!-- TODO --> |
| 테이블 | snake_case 복수형 | <!-- TODO --> |

## 에러 처리

<!-- TODO: 에러 처리 패턴을 프레임워크에 맞게 정의하세요 -->
- 커스텀 예외 클래스 정의
- HTTP 상태코드 매핑
- 일관된 에러 응답 형식

## PR 규칙

- 엔드포인트 PR: 라우터 + 서비스 + 리포지토리 + 스키마 + 테스트
- 스키마 PR: 모델 + 마이그레이션
- PR 설명에 API 요청/응답 예시 포함

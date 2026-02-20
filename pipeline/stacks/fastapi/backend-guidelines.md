# FastAPI Backend Guidelines

> Agent 04 (Backend)이 be_stack: fastapi 프로젝트에서 참조하는 가이드라인

## 기술 스택

- **Framework**: FastAPI
- **Language**: Python 3.12+
- **ORM**: SQLModel (SQLAlchemy 기반)
- **DB**: PostgreSQL
- **Migration**: Alembic
- **Auth**: JWT (python-jose) + httpOnly Cookie
- **Validation**: Pydantic v2
- **Testing**: pytest + httpx (AsyncClient)

## 프로젝트 구조

```
backend/
├── app/
│   ├── main.py                 # FastAPI 앱 인스턴스
│   ├── config.py               # 설정 (환경변수)
│   ├── database.py             # DB 연결
│   ├── dependencies.py         # 공통 의존성
│   ├── domain/                 # DDD 도메인 계층
│   │   └── {feature}/
│   │       ├── models.py       # SQLModel 모델
│   │       ├── schemas.py      # Pydantic 스키마 (요청/응답)
│   │       ├── service.py      # 비즈니스 로직
│   │       ├── repository.py   # DB 접근
│   │       └── router.py       # API 라우터
│   └── common/
│       ├── exceptions.py       # 커스텀 예외
│       └── responses.py        # 공통 응답 형식
├── alembic/                    # DB 마이그레이션
│   └── versions/
├── tests/
│   ├── conftest.py
│   └── {feature}/
│       ├── test_router.py
│       └── test_service.py
├── alembic.ini
├── pyproject.toml
└── requirements.txt
```

## 코딩 규칙

### API 엔드포인트

- API명세의 경로/메서드/상태코드를 정확히 구현
- APIRouter 사용, 도메인별 라우터 분리
- 응답 모델을 `response_model`로 명시
- 에러는 HTTPException으로 처리, API명세의 에러 코드와 일치

```python
@router.post("/auth/login", response_model=TokenResponse, status_code=200)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    ...
```

### 모델 (SQLModel)

- ER 다이어그램의 테이블/필드/관계를 정확히 반영
- 테이블명: snake_case 복수형 (`users`, `orders`)
- 필드 타입은 ER 다이어그램에 명시된 것과 일치
- 관계: `Relationship()` 사용

### 스키마 (Pydantic)

- 요청/응답 스키마를 분리 (`CreateRequest`, `Response`, `UpdateRequest`)
- API명세의 JSON 구조와 정확히 일치
- 유효성 검사: `@field_validator` 사용

### 비즈니스 로직

- Service 계층에서 처리 (Router는 얇게)
- 기능명세서의 정책/예외 처리를 Service에 구현
- Repository 패턴으로 DB 접근 분리

### 인증/인가

- JWT 토큰 발급/검증
- httpOnly Cookie로 토큰 전달
- `Depends(get_current_user)` 패턴

### DB 마이그레이션

- 모든 스키마 변경은 Alembic 마이그레이션으로 관리
- 마이그레이션 메시지: 변경 내용 명시

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 모듈 | snake_case | `auth_service.py` |
| 클래스 | PascalCase | `UserModel`, `LoginRequest` |
| 함수 | snake_case | `create_user`, `get_by_email` |
| 상수 | UPPER_SNAKE | `ACCESS_TOKEN_EXPIRE` |
| 테이블 | snake_case 복수형 | `users`, `login_attempts` |

## 에러 처리

```python
# 커스텀 예외 → HTTPException 매핑
class UserNotFoundError(Exception): ...
class InvalidCredentialsError(Exception): ...

@app.exception_handler(InvalidCredentialsError)
async def handle_invalid_credentials(request, exc):
    raise HTTPException(status_code=401, detail="Invalid credentials")
```

## PR 규칙

- 엔드포인트 PR: 라우터 + 서비스 + 리포지토리 + 스키마 + 테스트
- 스키마 PR: 모델 + 마이그레이션
- PR 설명에 API 요청/응답 예시 포함

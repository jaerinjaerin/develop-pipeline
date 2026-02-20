# Django Backend Guidelines

> Agent 04 (Backend)이 be_stack: django 프로젝트에서 참조하는 가이드라인

## 기술 스택

- **Framework**: Django 5 + Django REST Framework
- **Language**: Python 3.12+
- **ORM**: Django ORM
- **DB**: PostgreSQL
- **Migration**: Django Migrations (내장)
- **Auth**: JWT (djangorestframework-simplejwt) + httpOnly Cookie
- **Validation**: DRF Serializers + Django Validators
- **Testing**: pytest-django + DRF APIClient

## 프로젝트 구조

```
backend/
├── config/                    # 프로젝트 설정
│   ├── settings/
│   │   ├── base.py            # 공통 설정
│   │   ├── local.py           # 개발 설정
│   │   └── production.py      # 운영 설정
│   ├── urls.py                # URL 루트 설정
│   └── wsgi.py
├── apps/                      # Django 앱
│   └── {feature}/
│       ├── models.py          # Django 모델
│       ├── serializers.py     # DRF 시리얼라이저
│       ├── views.py           # DRF ViewSet / APIView
│       ├── urls.py            # 앱별 URL 설정
│       ├── services.py        # 비즈니스 로직
│       ├── filters.py         # django-filter 필터
│       ├── permissions.py     # 커스텀 퍼미션
│       └── admin.py           # Admin 설정
├── common/
│   ├── exceptions.py          # 커스텀 예외 핸들러
│   ├── pagination.py          # 공통 페이지네이션
│   └── mixins.py              # 공통 Mixin
├── tests/
│   ├── conftest.py
│   └── {feature}/
│       ├── test_views.py
│       └── test_services.py
├── manage.py
├── pyproject.toml
└── requirements/
    ├── base.txt
    ├── local.txt
    └── production.txt
```

## 코딩 규칙

### API 엔드포인트

- API명세의 경로/메서드/상태코드를 정확히 구현
- DRF ViewSet 또는 APIView 사용, 앱별 urls.py 분리
- Serializer로 응답 형식 명시
- 에러는 DRF 예외 핸들러로 처리, API명세의 에러 코드와 일치

```python
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
```

### 모델 (Django ORM)

- ER 다이어그램의 테이블/필드/관계를 정확히 반영
- 모델 클래스명: PascalCase 단수형 (`User`, `Order`)
- DB 테이블명: `Meta.db_table`로 snake_case 복수형 지정
- 관계: `ForeignKey`, `ManyToManyField`, `OneToOneField`
- `TimeStampedModel` 추상 모델로 `created_at`, `updated_at` 공통 처리

```python
class Order(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=OrderStatus.choices)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
```

### 시리얼라이저 (DRF)

- 요청/응답 시리얼라이저를 분리 (`CreateSerializer`, `ListSerializer`, `DetailSerializer`)
- API명세의 JSON 구조와 정확히 일치
- 유효성 검사: `validate_<field>` 및 `validate` 메서드

### 비즈니스 로직

- Service 계층에서 처리 (View는 얇게)
- 기능명세서의 정책/예외 처리를 Service에 구현
- 복잡한 쿼리는 QuerySet Manager로 분리

### 인증/인가

- djangorestframework-simplejwt로 JWT 토큰 발급/검증
- httpOnly Cookie로 토큰 전달
- 커스텀 Permission 클래스로 권한 관리
- `IsAuthenticated`, `IsAdminUser` 등 DRF 내장 퍼미션 활용

### DB 마이그레이션

- 모든 스키마 변경은 `makemigrations` → `migrate`로 관리
- 마이그레이션 파일 직접 수정 금지 (데이터 마이그레이션 제외)
- squashmigrations로 마이그레이션 정리

## 파일 명명 규칙

| 유형 | 규칙 | 예시 |
|---|---|---|
| 모듈 | snake_case | `user_service.py` |
| 클래스 | PascalCase | `UserModel`, `LoginSerializer` |
| 함수 | snake_case | `create_user`, `get_by_email` |
| 상수 | UPPER_SNAKE | `ACCESS_TOKEN_EXPIRE` |
| 테이블 | snake_case 복수형 | `users`, `login_attempts` |
| 앱 | snake_case | `accounts`, `orders` |

## 에러 처리

```python
# common/exceptions.py
from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data['status_code'] = response.status_code
    return response

# 커스텀 예외
class UserNotFoundError(Exception): ...
class InvalidCredentialsError(Exception): ...
```

## PR 규칙

- 엔드포인트 PR: View + Serializer + Service + URL + 테스트
- 스키마 PR: 모델 + 마이그레이션
- PR 설명에 API 요청/응답 예시 포함

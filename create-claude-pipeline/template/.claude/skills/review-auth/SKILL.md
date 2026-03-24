---
name: review-auth
description: "보안 리뷰어가 인증/인가 구현을 집중적으로 검토할 때 참조하는 skill. JWT 설정, 미들웨어 적용 범위, 권한 검사, 비밀번호 처리를 체계적으로 검토한다. Security Agent가 인증/인가 관련 코드를 검토할 때, 로그인/회원가입 기능이 구현된 후 보안 점검할 때, JWT나 세션 관련 코드를 확인할 때 반드시 사용한다. '인증 검토', '인가 검토', 'JWT 검토', '미들웨어 적용 확인', '비밀번호 처리 확인', '권한 검사 확인', 'auth 보안 점검' 등의 상황에서 트리거된다."
context: fork
agent: Explore
---

# Review Auth

보안 리뷰어가 인증/인가 구현을 검토하는 skill이다.

인증/인가는 보안의 첫 번째 방어선이다. JWT 설정이 잘못되면 토큰 위조가 가능하고, 미들웨어가 누락되면 비인가 접근이 가능하며, 비밀번호 처리가 잘못되면 사용자 계정이 탈취된다. 이 skill은 이런 취약점을 놓치지 않도록 체계적인 탐색 절차를 제공한다.

---

## 탐색 절차

### 1. JWT 설정 검토

JWT 관련 코드를 찾아서 설정을 확인한다.

```
Grep: "jwt\.sign|jwt\.verify|jsonwebtoken|jose" — 전체 소스에서
Grep: "expiresIn|exp|secret|algorithm" — JWT 관련 파일에서
```

확인할 항목:

| 항목 | 안전 기준 | 위험 신호 |
|------|----------|----------|
| 서명 알고리즘 | HS256, RS256, ES256 | `none`, 알고리즘 미지정 |
| 만료 시간 (Access Token) | 15분 ~ 1시간 | `expiresIn` 없음, 24시간 이상 |
| 만료 시간 (Refresh Token) | 7일 ~ 30일 | 만료 없음 |
| 시크릿 키 | 환경변수에서 로드, 32자 이상 | 하드코딩, 짧은 문자열 |
| `none` 알고리즘 | 명시적으로 차단 | `algorithms` 옵션 없이 verify |

**`none` 알고리즘 확인이 중요한 이유:** `jwt.verify`에 `algorithms` 옵션을 지정하지 않으면, 공격자가 토큰의 알고리즘을 `none`으로 변경하여 서명 검증을 우회할 수 있다.

```
// 위험: algorithms 미지정
jwt.verify(token, secret)

// 안전: 허용 알고리즘 명시
jwt.verify(token, secret, { algorithms: ['HS256'] })
```

### 2. 미들웨어 적용 범위 검토

모든 라우트 파일을 탐색하여 인증 미들웨어 적용 여부를 확인한다.

```
Glob: **/routes/**/*.ts, **/routes/**/*.js
Grep: "authenticate|auth|protect|guard|requireAuth" — 라우터 파일에서
```

각 엔드포인트를 아래 기준으로 분류한다:

| 분류 | 예시 | 인증 필요 |
|------|------|----------|
| Public | 로그인, 회원가입, 비밀번호 재설정, 헬스체크 | X |
| Protected | 사용자 정보 조회/수정, 주문, 결제 | O |
| Admin | 사용자 관리, 시스템 설정 | O + 관리자 권한 |

**확인 포인트:**
- Protected 엔드포인트에 인증 미들웨어가 빠진 곳이 있는가
- Public 엔드포인트가 의도적인가 (로그인, 회원가입 등만 허용)
- 미들웨어 순서가 올바른가 (인증 → 권한 → 검증 → Controller)

### 3. 비밀번호 처리 검토

비밀번호 관련 코드를 찾아서 처리 방식을 확인한다.

```
Grep: "password|passwd|bcrypt|argon2|hash|salt" — 전체 소스에서
Grep: "compare|verify" — auth 관련 파일에서
```

확인할 항목:

| 항목 | 안전 기준 | 위험 신호 |
|------|----------|----------|
| 해싱 알고리즘 | bcrypt 또는 argon2 | MD5, SHA1, SHA256 단독, 평문 |
| bcrypt cost factor | 10 이상 | 10 미만, 미지정 |
| 평문 저장 | DB에 해시값만 저장 | 평문 비밀번호 INSERT |
| 로그 출력 | 비밀번호 미포함 | `console.log(req.body)` 등으로 노출 |
| API 응답 | 비밀번호 필드 제외 | `select *` 등으로 전체 반환 |
| 비교 방식 | `bcrypt.compare()` 사용 | `===` 직접 비교 (타이밍 공격 가능) |

**DB 쿼리에서 비밀번호 제외 확인:**
```
Grep: "select|findUnique|findFirst|findMany" — repository/service 파일에서
```
Prisma의 `select`나 `omit`으로 비밀번호 필드를 제외하는지, 또는 응답 전에 삭제하는지 확인한다.

### 4. 권한 검사 검토

역할(Role) 기반 접근 제어가 어디서 이루어지는지 확인한다.

```
Grep: "role|permission|authorize|isAdmin|canAccess" — 전체 소스에서
Grep: "req\.user\.role|user\.role|currentUser\.role" — 전체 소스에서
```

확인할 항목:

| 항목 | 안전 기준 | 위험 신호 |
|------|----------|----------|
| 검사 위치 | 서버 (미들웨어 또는 Service) | 클라이언트만 (FE에서 UI 숨기기만) |
| 리소스 소유권 | 요청자 === 리소스 소유자 검증 | ID만으로 다른 사용자 데이터 접근 가능 |
| Admin 엔드포인트 | 별도 권한 미들웨어 적용 | 인증만 있고 권한 검사 없음 |
| 권한 상승 | 역할 변경 API에 관리자 권한 필요 | 일반 사용자가 자기 역할 변경 가능 |

**IDOR(Insecure Direct Object Reference) 확인:**
`GET /api/users/:id` 같은 엔드포인트에서 요청자가 자기 자신인지 확인하는 로직이 있는지 확인한다. `req.params.id`와 `req.user.id`를 비교하는 코드가 없으면 다른 사용자의 데이터에 접근 가능하다.

### 5. 추가 확인 사항

```
Grep: "rate.limit|rateLimit|throttle|brute" — 전체 소스에서
Grep: "cookie|httpOnly|sameSite|secure" — 전체 소스에서
Grep: "cors|origin" — 전체 소스에서
```

| 항목 | 확인 내용 |
|------|----------|
| Brute Force 방어 | 로그인 실패 횟수 제한이 있는가 |
| 토큰 저장 (FE) | `httpOnly` cookie인가, `localStorage`인가 |
| CORS | 허용 origin이 `*`가 아닌가 |
| 비밀번호 재설정 | 토큰이 일회용인가, 만료 시간이 있는가 |
| 로그아웃 | 서버에서 토큰 무효화가 되는가 |

---

## 출력 형식

탐색 결과를 취약점 형식으로 반환한다.

```
## 인증/인가 검토 결과

### JWT 설정
| 항목 | 현재 값 | 판정 | 비고 |
|------|--------|------|------|
| 서명 알고리즘 | HS256 | ✅ | |
| Access Token 만료 | 1h | ✅ | |
| Refresh Token 만료 | 미설정 | ❌ SEC-XXX | 만료 없음 |
| 시크릿 키 관리 | 환경변수 | ✅ | |
| algorithms 옵션 | 미지정 | ⚠️ SEC-XXX | none 우회 가능 |

### 미들웨어 적용
| 엔드포인트 | 인증 | 권한 | 판정 |
|-----------|------|------|------|
| POST /api/auth/login | - | - | ✅ Public |
| GET /api/orders | authenticate | - | ✅ |
| DELETE /api/users/:id | authenticate | - | ⚠️ SEC-XXX 관리자 권한 필요 |

### 비밀번호 처리
| 항목 | 현재 구현 | 판정 |
|------|----------|------|
| 해싱 | bcrypt (cost 12) | ✅ |
| 응답 제외 | select에서 제외 | ✅ |
| 로그 출력 | req.body 로깅 | ❌ SEC-XXX |

### 권한 검사
| 항목 | 현재 구현 | 판정 |
|------|----------|------|
| 검사 위치 | Service 레이어 | ✅ |
| IDOR 방어 | userId 비교 있음 | ✅ |
| Admin 보호 | 권한 미들웨어 없음 | ❌ SEC-XXX |

### 발견된 취약점 목록
(SEC-XXX 형식으로 security-reviewer agent의 취약점 보고 형식에 맞춰 작성)
```

미들웨어 적용 표가 길어지면 Protected/Admin만 나열하고 Public은 생략해도 된다.

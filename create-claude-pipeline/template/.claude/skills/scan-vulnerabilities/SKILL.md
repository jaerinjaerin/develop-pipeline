---
name: scan-vulnerabilities
description: "보안 리뷰어가 전체 코드베이스에서 일반적인 보안 취약점 패턴을 탐색할 때 사용하는 skill. OWASP Top 10 기준으로 위험한 패턴을 자동으로 찾아서 보고한다. Security Agent 또는 QA Agent가 보안 검토를 수행할 때, 코드 배포 전 보안 점검이 필요할 때, 또는 새 코드가 추가된 후 취약점이 없는지 확인할 때 반드시 사용한다. '보안 검토', '취약점 탐색', 'OWASP', 'XSS 확인', 'SQL Injection 확인', '시크릿 노출', '하드코딩 비밀번호', '인증 누락 확인' 등의 상황에서 트리거된다."
context: fork
agent: Explore
---

# Scan Vulnerabilities

코드베이스에서 일반적인 보안 취약점 패턴을 탐색하는 skill이다.

보안 취약점은 코드 리뷰에서 놓치기 쉽다. `eval()`이 한 곳에 숨어 있거나, 비밀번호가 하드코딩된 테스트 파일이 프로덕션에 포함되거나, 인증 미들웨어가 새 라우트에 빠져 있을 수 있다. 이 skill은 알려진 위험 패턴을 체계적으로 탐색하여 사람이 놓칠 수 있는 취약점을 잡아낸다.

이 skill은 방어적 보안 목적으로만 사용한다 — 자체 프로젝트의 보안 강화를 위한 코드 검토 도구이다.

---

## 탐색 절차

Explore agent를 사용하여 아래 5개 카테고리를 순서대로 탐색한다.

### 1. 위험한 함수/패턴 탐색

코드에서 직접 사용하면 보안 위험이 있는 함수와 패턴을 찾는다.

```
Grep: eval\(|new Function\(
Grep: exec\(|execSync\(|spawn\(
Grep: dangerouslySetInnerHTML
Grep: \.innerHTML\s*=
Grep: \$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)
Grep: query\(.*\+|query\(.*\$\{
```

| 패턴 | 위험 | OWASP 분류 |
|------|------|-----------|
| `eval()`, `new Function()` | 임의 코드 실행 | A03 Injection |
| `exec()`, `execSync()` | 명령어 인젝션 | A03 Injection |
| `dangerouslySetInnerHTML` | XSS 공격 | A03 Injection |
| `.innerHTML =` | XSS 공격 | A03 Injection |
| SQL 문자열 조합 | SQL Injection | A03 Injection |

모든 발견이 취약점은 아니다. `eval()`이 빌드 스크립트에 있는 것과 사용자 입력을 처리하는 코드에 있는 것은 위험도가 다르다. 발견 위치와 입력 소스를 함께 확인한다.

### 2. 하드코딩된 시크릿 탐색

코드에 직접 작성된 비밀 값을 찾는다. `.env` 파일이 아니라 소스 코드 내 문자열 리터럴을 대상으로 한다.

```
Grep: (password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]
Grep: (secret|SECRET)\s*[:=]\s*['"][^'"]+['"]
Grep: (api[_-]?key|apiKey|API_KEY)\s*[:=]\s*['"][^'"]+['"]
Grep: (token|TOKEN)\s*[:=]\s*['"][^'"]+['"]
Grep: (sk-|pk-|AIza|ghp_|gho_|github_pat_)
Grep: [A-Za-z0-9+/]{40,}={0,2}
```

| 패턴 | 위험 | OWASP 분류 |
|------|------|-----------|
| `password = "..."` | 자격 증명 노출 | A07 Identification Failures |
| `sk-`, `AIza` 등 | API 키 노출 | A07 Identification Failures |
| 긴 Base64 문자열 | 인코딩된 시크릿 | A07 Identification Failures |

제외할 것:
- `.env.example`의 플레이스홀더 값 (`password = "your-password-here"`)
- 테스트 파일의 명백한 더미 값 (`password = "test123"` — 단, 실제 서비스 키와 유사하면 보고)
- 타입 정의 파일의 인터페이스 필드명

### 3. 인증 미들웨어 누락 탐색

데이터를 변경하는 엔드포인트(POST/PUT/PATCH/DELETE)에 인증 미들웨어가 적용되어 있는지 확인한다.

```
Glob: src/routes/**/*.{ts,js}
Grep: router\.(post|put|patch|delete)\(
Grep: @(Post|Put|Patch|Delete)\(
```

각 변경 엔드포인트에 대해:
- `authenticate`, `auth`, `protect`, `guard` 등의 미들웨어가 적용되어 있는지 확인
- 적용되지 않은 엔드포인트는 의도적인 public API인지 확인 (로그인, 회원가입 등)

### 4. 민감 데이터 응답 포함 탐색

API 응답에 노출되면 안 되는 데이터가 포함되는지 확인한다.

```
Grep: res\.json\(.*user|res\.send\(.*user
Grep: password|passwordHash|hashedPassword
Grep: findMany|findAll|find\(\)
```

확인할 패턴:
- DB 레코드를 필터링 없이 그대로 반환 (`res.json(user)` — password 필드 포함 가능)
- `select`나 `omit` 없이 전체 레코드 조회
- 응답에 `password`, `token`, `secret` 필드 포함

### 5. 추가 보안 점검

```
Grep: cors\(\)|cors\(\{\s*origin:\s*['"]\*['"]\s*\}\)
Grep: http://|HTTP://
Grep: \.env
Glob: .gitignore
```

| 패턴 | 위험 |
|------|------|
| `cors()` (와일드카드) | 모든 도메인에서 API 접근 허용 |
| HTTP URL (HTTPS 아님) | 전송 중 데이터 노출 |
| `.env`가 `.gitignore`에 없음 | 시크릿이 git에 커밋될 수 있음 |
| `process.env.XXX` 직접 참조 | config 모듈 미사용 시 검증 누락 |

---

## 출력 형식

탐색 결과를 아래 형식으로 정리하여 반환한다:

```markdown
# 취약점 탐색 결과

## 요약

| 심각도 | 발견 건수 |
|--------|---------|
| Critical | N |
| High | N |
| Medium | N |
| Low | N |
| 총계 | N |

## 즉시 검토 필요 (Critical / High)

| # | 심각도 | 카테고리 | 파일 | 라인 | 패턴 | 설명 |
|---|--------|---------|------|------|------|------|
| 1 | Critical | 하드코딩 시크릿 | src/config/db.ts | 15 | `password = "real_pass"` | DB 비밀번호 하드코딩 |
| 2 | High | 인증 누락 | src/routes/admin.ts | 42 | `router.delete("/users/:id")` | 인증 미들웨어 없음 |

## 주의 필요 (Medium / Low)

| # | 심각도 | 카테고리 | 파일 | 라인 | 패턴 | 설명 |
|---|--------|---------|------|------|------|------|
| 3 | Medium | XSS 위험 | src/components/Comment.tsx | 28 | `dangerouslySetInnerHTML` | 사용자 입력 포함 여부 확인 필요 |
| 4 | Low | CORS 설정 | src/app.ts | 12 | `cors()` | 와일드카드 CORS — 개발 환경이면 OK |

## 카테고리별 상세

### 위험한 함수/패턴
- (발견 목록 또는 "발견 없음")

### 하드코딩된 시크릿
- (발견 목록 또는 "발견 없음")

### 인증 미들웨어 누락
- (발견 목록 또는 "발견 없음")

### 민감 데이터 응답 포함
- (발견 목록 또는 "발견 없음")

### 추가 보안 점검
- (발견 목록 또는 "발견 없음")

## 권장 조치

1. [Critical/High 항목에 대한 구체적 수정 방법]
2. [예: "src/config/db.ts:15 — 비밀번호를 환경변수로 이동"]
3. [예: "src/routes/admin.ts:42 — authenticate 미들웨어 추가"]
```

### 심각도 기준

| 심각도 | 기준 |
|--------|------|
| Critical | 즉시 악용 가능 — 하드코딩된 실제 시크릿, SQL Injection |
| High | 악용 가능성 높음 — 인증 누락, 민감 데이터 노출 |
| Medium | 조건부 위험 — XSS 가능성, 느슨한 CORS |
| Low | 모범 사례 미준수 — HTTP URL, config 미사용 |

---

## 발견 없음인 경우

취약점이 하나도 발견되지 않으면:

```markdown
# 취약점 탐색 결과

## 요약

탐색된 위험 패턴: 0건

5개 카테고리 전체에서 알려진 취약점 패턴이 발견되지 않았습니다.

## 참고사항

- 이 탐색은 패턴 기반 정적 분석이며, 모든 취약점을 발견하지는 못합니다
- 비즈니스 로직 취약점, 인가 우회, 타이밍 공격 등은 수동 검토가 필요합니다
- 의존성 취약점은 `npm audit` 또는 `yarn audit`으로 별도 확인하세요
```

---
name: write-security-report
description: "보안 리뷰어가 검토 완료 후 최종 보안 보고서를 작성할 때 참조하는 skill. OWASP Top 10 체크 결과와 발견된 취약점을 PM이 배포 결정에 사용할 수 있는 형식으로 context/security_report.md에 작성한다. Security Agent가 취약점 탐색을 마치고 보고서를 작성할 때, PM에게 보안 검토 결과를 전달할 때, 배포 전 보안 승인이 필요할 때 반드시 사용한다. '보안 보고서 작성', 'security_report 생성', '보안 검토 결과 정리', '배포 보안 승인', 'OWASP 체크 결과 보고' 등의 상황에서 트리거된다."
---

# Write Security Report

보안 리뷰어가 검토를 완료한 후 최종 보안 보고서를 작성할 때 따르는 패턴이다.

보안 보고서의 핵심 목적은 PM이 "이 코드를 프로덕션에 배포해도 되는가?"를 판단할 수 있게 하는 것이다. 기술적 세부 사항을 나열하는 것이 아니라, 심각도별로 정리된 취약점 목록과 명확한 배포 권고를 제공한다.

보고서는 `context/security_report.md`에 저장한다.

---

## 보고서 구조

아래 6개 섹션을 순서대로 작성한다.

### Section 1: 검토 범위

검토 대상과 기준을 명시한다. PM이 "무엇을 검토했는지"를 한눈에 파악할 수 있어야 한다.

```markdown
## 1. 검토 범위

| 항목 | 내용 |
|------|------|
| 검토 대상 | FE (Next.js) + BE (Express) + Infra (Docker, CI/CD) |
| 검토 기준 | OWASP Top 10 (2021) |
| 검토 일시 | 2026-03-23 |
| 검토 방법 | 정적 분석 (패턴 기반 코드 탐색) |
| 검토 범위 외 | 의존성 취약점 (npm audit 별도), 인프라 네트워크 보안 |
```

### Section 2: 결과 요약

심각도별 발견/수정/미해결 건수를 한 테이블로 보여준다. PM이 이 테이블만 보고도 전체 상황을 파악할 수 있어야 한다.

```markdown
## 2. 결과 요약

| 심각도 | 발견 | 수정완료 | 미해결 |
|--------|------|---------|--------|
| Critical | 1 | 1 | 0 |
| High | 2 | 2 | 0 |
| Medium | 3 | 2 | 1 |
| Low | 2 | 0 | 2 |
| **합계** | **8** | **5** | **3** |
```

### Section 3: 취약점 상세

발견된 모든 취약점을 테이블로 나열한다. 심각도 높은 것부터 정렬한다.

```markdown
## 3. 취약점 상세

| ID | 심각도 | 제목 | 대상 파일 | OWASP | 상태 |
|----|--------|------|----------|-------|------|
| SEC-001 | Critical | DB 비밀번호 하드코딩 | src/config/db.ts:15 | A07 | 수정완료 |
| SEC-002 | High | 관리자 API 인증 미들웨어 누락 | src/routes/admin.ts:42 | A01 | 수정완료 |
| SEC-003 | High | 사용자 응답에 password 필드 포함 | src/controllers/users.ts:28 | A01 | 수정완료 |
| SEC-004 | Medium | dangerouslySetInnerHTML 사용 | src/components/Comment.tsx:35 | A03 | 미해결 |
| SEC-005 | Medium | 와일드카드 CORS 설정 | src/app.ts:12 | A05 | 수정완료 |
| SEC-006 | Medium | process.env 직접 참조 | src/services/email.ts:8 | A05 | 수정완료 |
| SEC-007 | Low | HTTP URL 사용 | src/utils/api.ts:22 | A02 | 미해결 |
| SEC-008 | Low | console.log에 요청 데이터 출력 | src/middleware/logger.ts:15 | A09 | 미해결 |
```

각 취약점에 대해 필요하면 상세 설명을 추가한다:

```markdown
### SEC-004: dangerouslySetInnerHTML 사용 (Medium)
- **위치:** src/components/Comment.tsx:35
- **설명:** 사용자 입력 댓글을 dangerouslySetInnerHTML로 렌더링. sanitize 처리 없이 사용하면 XSS 공격 가능.
- **권장 조치:** DOMPurify 등으로 sanitize 처리 추가, 또는 마크다운 라이브러리로 교체
- **현재 상태:** 미해결 — BE에서 sanitize 후 저장하는 방식으로 변경 예정
```

### Section 4: OWASP Top 10 체크 결과

OWASP Top 10 각 항목에 대해 검토 결과를 표시한다. "검토하지 않았다"와 "문제 없었다"를 구분하는 것이 중요하다.

```markdown
## 4. OWASP Top 10 체크 결과

| # | OWASP 항목 | 결과 | 비고 |
|---|-----------|------|------|
| A01 | Broken Access Control | ⚠️ 발견 (수정완료) | SEC-002, SEC-003 |
| A02 | Cryptographic Failures | ⚠️ 발견 (미해결) | SEC-007 |
| A03 | Injection | ⚠️ 발견 (미해결) | SEC-004 |
| A04 | Insecure Design | ✅ 문제 없음 | |
| A05 | Security Misconfiguration | ⚠️ 발견 (수정완료) | SEC-005, SEC-006 |
| A06 | Vulnerable Components | ➖ 검토 범위 외 | npm audit 별도 실행 필요 |
| A07 | Identification Failures | ⚠️ 발견 (수정완료) | SEC-001 |
| A08 | Software/Data Integrity | ✅ 문제 없음 | |
| A09 | Logging Failures | ⚠️ 발견 (미해결) | SEC-008 |
| A10 | SSRF | ✅ 문제 없음 | |
```

범례:
- ✅ 문제 없음 — 검토했고 위험 패턴 미발견
- ⚠️ 발견 — 취약점 발견됨 (수정완료/미해결 구분)
- ➖ 검토 범위 외 — 이번 검토에서 다루지 않음

### Section 5: 미해결 취약점

미해결 항목이 있으면 별도로 모아서 PM이 즉시 판단할 수 있게 한다.

```markdown
## 5. 미해결 취약점

| ID | 심각도 | 제목 | 미해결 사유 | 위험 평가 |
|----|--------|------|-----------|----------|
| SEC-004 | Medium | dangerouslySetInnerHTML | BE 수정 후 적용 예정 | 현재 관리자만 댓글 작성 가능 — 즉시 위험 낮음 |
| SEC-007 | Low | HTTP URL 사용 | 개발 환경 전용 | 프로덕션에서는 HTTPS 강제 — 실제 위험 없음 |
| SEC-008 | Low | console.log 데이터 출력 | 다음 스프린트에서 로거 교체 예정 | 민감 데이터 포함 여부 확인 필요 |
```

미해결 항목이 없으면:

```markdown
## 5. 미해결 취약점

미해결 취약점 없음.
```

### Section 6: 배포 권고

PM이 배포 결정을 내릴 수 있도록 명확한 권고를 제공한다.

```markdown
## 6. 배포 권고

### 판단: ✅ 배포 가능

**근거:**
- Critical 미해결: 0건
- High 미해결: 0건
- Medium 미해결: 1건 (SEC-004 — 현재 위험 낮음, 다음 스프린트에서 해결 예정)
- Low 미해결: 2건 (운영 영향 없음)

**조건:**
- SEC-004는 다음 스프린트에서 반드시 수정할 것
- 프로덕션 배포 전 `npm audit` 실행하여 의존성 취약점 확인할 것
```

---

## 배포 권고 판단 기준

| 조건 | 판단 |
|------|------|
| Critical 미해결 ≥ 1 | ❌ 배포 불가 |
| High 미해결 ≥ 1 | ❌ 배포 불가 |
| Medium 미해결만 있음 | ⚠️ PM이 판단 (위험 평가 포함) |
| Low 미해결만 있음 | ✅ 배포 가능 (조건부) |
| 미해결 없음 | ✅ 배포 가능 |

배포 불가 판단 시:

```markdown
### 판단: ❌ 배포 불가

**근거:**
- Critical 미해결: 1건 (SEC-001 — DB 비밀번호 하드코딩)
- 해당 취약점이 수정되기 전까지 배포를 진행하면 안 됩니다.

**필요 조치:**
1. SEC-001 수정 → BE Agent에게 전달 완료
2. 수정 후 재검토 필요
```

---

## 보고서 작성 체크리스트

1. [ ] **검토 범위** — 대상, 기준, 방법, 범위 외 항목이 명시됐는가
2. [ ] **결과 요약** — 심각도별 발견/수정/미해결 수가 정확한가
3. [ ] **취약점 상세** — 모든 발견 항목에 ID, 심각도, 파일:라인, OWASP 분류가 있는가
4. [ ] **OWASP 체크** — 10개 항목 전체가 체크됐는가 (검토 범위 외도 표시)
5. [ ] **미해결 취약점** — 미해결 사유와 위험 평가가 있는가
6. [ ] **배포 권고** — 가능/불가 판단과 근거가 명확한가
7. [ ] **저장 위치** — `context/security_report.md`에 저장했는가

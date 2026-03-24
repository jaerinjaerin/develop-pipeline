---
name: db-migration
description: "BE 개발자가 DB 스키마를 변경할 때 안전하게 마이그레이션하기 위한 절차와 주의사항을 제공하는 skill. 기존 데이터 영향 검토부터 롤백 계획까지 포함한다. BE Agent가 테이블/컬럼을 추가·변경·삭제하거나, 인덱스를 생성하거나, 관계(FK)를 수정할 때 반드시 사용한다. 'DB 마이그레이션', '스키마 변경', '테이블 추가', '컬럼 변경', '인덱스 추가', 'prisma migrate', 'ALTER TABLE', 'FK 추가', 'NOT NULL 컬럼 추가' 등의 상황에서 트리거된다."
---

# DB Migration

BE 개발자가 DB 스키마를 변경할 때 따르는 절차다.

프로덕션 DB에는 이미 데이터가 있다. 개발 환경에서 잘 돌아가는 마이그레이션이 프로덕션에서 데이터 유실이나 장시간 락을 일으킬 수 있다. 이 skill은 "변경 전 영향을 먼저 파악하고, 안전한 방식으로 변경하고, 문제 시 되돌릴 수 있는" 절차를 제공한다.

---

## STEP 1: 변경 전 영향 분석

스키마를 바꾸기 전에 현재 상태를 파악한다. 기존 데이터가 없는 신규 테이블이면 이 단계를 가볍게 넘겨도 되지만, 기존 테이블을 수정하는 경우 반드시 확인한다.

### 확인 항목

```
Glob: prisma/schema.prisma
Glob: src/models/**/*
Glob: src/entities/**/*
Grep: @relation|references:|foreignKey|@ManyToOne|@OneToMany|@ManyToMany
```

| 확인 항목 | 왜 중요한가 |
|---------|-----------|
| 변경되는 테이블/컬럼 목록 | 영향 범위를 한정한다 |
| 해당 테이블에 기존 데이터가 있는지 | 데이터 마이그레이션 필요 여부를 결정한다 |
| 다른 테이블과의 관계(FK) | FK가 있으면 변경 순서가 중요하다 — 참조되는 쪽을 먼저 바꿔야 한다 |
| 해당 컬럼을 사용하는 쿼리/서비스 | 스키마 변경이 애플리케이션 코드에 미치는 영향을 파악한다 |
| 인덱스 현황 | 기존 인덱스가 새 스키마에서도 유효한지 확인한다 |

### 출력 형식

분석 결과를 아래 형식으로 정리한다:

```markdown
## 영향 분석

| 테이블 | 변경 유형 | 기존 데이터 | FK 관계 | 영향받는 코드 |
|--------|---------|-----------|---------|-------------|
| orders | 컬럼 추가 | 있음 (약 10만 건) | users.id → orders.userId | services/orders.ts, repositories/orders.ts |
| order_items | 신규 생성 | 없음 | orders.id → order_items.orderId | - |

### 위험 요소
- orders 테이블에 NOT NULL 컬럼 추가 시 기존 데이터에 default 값 필요
- order_items FK 생성 시 orders 테이블에 락 발생 가능
```

---

## STEP 2: 안전한 변경 원칙

프로덕션 DB를 안전하게 변경하기 위한 원칙이다. 핵심은 "되돌릴 수 없는 변경을 피하고, 불가피하면 단계를 나눈다"이다.

### 위험한 변경과 안전한 대안

| 위험한 변경 | 왜 위험한가 | 안전한 대안 |
|-----------|-----------|-----------|
| 컬럼 삭제 | 데이터 유실, 롤백 불가 | nullable로 변경 → 앱에서 사용 안 함 확인 → 추후 별도 마이그레이션으로 삭제 |
| 컬럼명 변경 | 앱 코드와 동시 배포 필요, 실패 시 양쪽 다 깨짐 | 새 컬럼 추가 → 데이터 복사 → 앱이 새 컬럼 사용 → 구 컬럼 제거 |
| NOT NULL 컬럼 추가 (default 없음) | 기존 행에 값이 없어서 실패 | default 값 반드시 지정 |
| 타입 변경 (예: varchar → int) | 기존 데이터 변환 실패 가능 | 새 컬럼 추가 → 데이터 변환 스크립트 → 컬럼 교체 |
| 대형 테이블에 인덱스 추가 | 장시간 테이블 락 | 별도 마이그레이션으로 분리, `CREATE INDEX CONCURRENTLY` 사용 (PostgreSQL) |

### NOT NULL 컬럼 추가 시

기존 데이터가 있는 테이블에 NOT NULL 컬럼을 추가하려면:

```
-- 1단계: nullable + default로 추가
ALTER TABLE orders ADD COLUMN priority VARCHAR(10) DEFAULT 'normal';

-- 2단계: 기존 행에 값 채우기 (필요 시)
UPDATE orders SET priority = 'normal' WHERE priority IS NULL;

-- 3단계: NOT NULL 제약 추가
ALTER TABLE orders ALTER COLUMN priority SET NOT NULL;
```

Prisma의 경우:

```prisma
// 1단계 마이그레이션: optional + default로 추가
model Order {
  priority String? @default("normal")
}

// 2단계 마이그레이션: required로 변경
model Order {
  priority String @default("normal")
}
```

---

## STEP 3: 마이그레이션 파일 작성

### 파일명 규칙

```
YYYYMMDD_HHMMSS_description
```

설명은 변경 내용을 명확하게 나타내야 한다. "뭘 했는지" 한눈에 알 수 있어야 나중에 마이그레이션 히스토리를 추적할 수 있다.

**좋은 예:**
- `20260323_143000_add_priority_to_orders`
- `20260323_150000_create_order_items_table`
- `20260323_160000_add_index_orders_userId`

**나쁜 예:**
- `20260323_143000_update_schema`
- `20260323_150000_fix`
- `migration_1`

### up/down 구조

모든 마이그레이션은 반드시 up(적용)과 down(롤백)을 모두 작성한다. 롤백을 작성하지 않으면 문제 발생 시 수동으로 되돌려야 하는데, 장애 상황에서 수동 작업은 실수가 나기 쉽다.

```ts
// Knex 예시
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.string("priority", 10).defaultTo("normal").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("priority");
  });
}
```

```sql
-- Raw SQL 예시
-- up
ALTER TABLE orders ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'normal';

-- down
ALTER TABLE orders DROP COLUMN priority;
```

Prisma의 경우 `prisma migrate dev`가 자동으로 마이그레이션 파일을 생성하지만, 생성된 SQL을 반드시 확인한다. Prisma는 down 마이그레이션을 자동 생성하지 않으므로, 위험한 변경에는 롤백 SQL을 별도로 문서화한다.

### 하나의 마이그레이션 = 하나의 변경

마이그레이션 하나에 여러 변경을 넣지 않는다. 테이블 생성과 인덱스 추가는 별도 마이그레이션으로 분리한다. 이유:
- 인덱스 생성이 실패해도 테이블 생성은 유지된다
- 롤백 범위를 세밀하게 제어할 수 있다
- 대형 테이블의 인덱스 생성은 시간이 오래 걸릴 수 있다

```
# 좋은 예: 분리된 마이그레이션
20260323_143000_create_order_items_table
20260323_143100_add_index_order_items_orderId

# 나쁜 예: 하나에 다 넣음
20260323_143000_create_order_items_with_indexes
```

---

## STEP 4: 인덱스 설계

인덱스는 쿼리 성능에 직접적인 영향을 미치지만, 불필요한 인덱스는 쓰기 성능을 떨어뜨리고 저장 공간을 낭비한다. "이 쿼리가 느릴 것 같으니 인덱스를 걸자"가 아니라 "실제 쿼리 패턴에 맞는 인덱스를 설계하자"가 맞다.

### 인덱스가 필요한 경우

| 상황 | 예시 | 인덱스 대상 |
|------|------|-----------|
| WHERE 절에 자주 쓰이는 컬럼 | `WHERE status = 'active'` | `status` |
| JOIN 조건의 FK 컬럼 | `JOIN orders ON users.id = orders.userId` | `orders.userId` |
| 정렬에 자주 쓰이는 컬럼 | `ORDER BY createdAt DESC` | `createdAt` |
| 유니크 제약이 필요한 컬럼 | `email`, `slug` | UNIQUE 인덱스 |

### 복합 인덱스 순서

복합 인덱스는 컬럼 순서가 중요하다. 카디널리티(고유값 수)가 높은 컬럼을 앞에 놓는다.

```sql
-- 좋은 예: userId(카디널리티 높음) → status(카디널리티 낮음)
CREATE INDEX idx_orders_userId_status ON orders(userId, status);

-- 쿼리에서 활용:
-- SELECT * FROM orders WHERE userId = ? AND status = ?   ← 인덱스 사용
-- SELECT * FROM orders WHERE userId = ?                   ← 인덱스 사용 (선두 컬럼)
-- SELECT * FROM orders WHERE status = ?                   ← 인덱스 미사용 (선두 컬럼 없음)
```

### 인덱스를 걸지 말아야 할 경우

- 행 수가 적은 테이블 (수천 건 이하) — 풀스캔이 더 빠를 수 있다
- INSERT/UPDATE가 매우 빈번한 컬럼 — 인덱스 유지 비용이 조회 이점을 초과
- 카디널리티가 매우 낮은 컬럼 단독 (예: boolean) — 인덱스 효과가 미미

### Prisma에서 인덱스 정의

```prisma
model Order {
  id        String   @id @default(uuid())
  userId    String
  status    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, status])    // 복합 인덱스
  @@index([createdAt])          // 정렬용 인덱스
}
```

---

## 마이그레이션 실행 체크리스트

마이그레이션을 실행하기 전에 아래를 확인한다:

1. [ ] **영향 분석 완료** — 변경 대상 테이블, 기존 데이터 유무, FK 관계 파악
2. [ ] **안전한 변경 원칙 준수** — 컬럼 삭제/변경 대신 안전한 대안 적용
3. [ ] **마이그레이션 파일 작성** — 명확한 파일명, up/down 모두 작성
4. [ ] **인덱스 분리** — 테이블 변경과 인덱스 생성은 별도 마이그레이션
5. [ ] **롤백 테스트** — down 마이그레이션이 정상 동작하는지 확인
6. [ ] **앱 코드 호환성** — 스키마 변경 후에도 기존 앱 코드가 동작하는지 확인
7. [ ] **데이터 마이그레이션** — 기존 데이터에 대한 변환/채우기 스크립트 준비 (필요 시)

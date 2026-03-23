---
name: implement-api
description: "BE 개발자가 API를 구현할 때 일관된 레이어 구조와 패턴을 유지하기 위해 참조하는 skill. Route → Controller → Service → Repository 4계층 구조와 입력값 검증(Zod), 에러 처리, 응답 형식 패턴을 제공한다. BE Agent가 API 엔드포인트를 구현하거나, 새 API를 추가하거나, 기존 API를 수정할 때 반드시 사용한다. 'API 구현', 'API 추가', '엔드포인트 작성', 'Controller 작성', 'Service 로직', 'DB 쿼리', 'Zod 검증', 'REST API 만들기' 등의 상황에서 트리거된다."
---

# Implement API

BE 개발자가 API를 구현할 때 따르는 패턴이다.

API 구현은 "Route → Controller → Service → Repository" 4계층으로 나눈다. 각 레이어가 자기 역할만 하면 코드를 수정할 때 영향 범위가 해당 레이어로 한정된다. 예를 들어 DB를 Prisma에서 Drizzle로 바꿔도 Repository만 수정하면 되고, 검증 로직을 바꿔도 Controller만 수정하면 된다.

API 명세(`context/03_api_spec.md`)를 읽고 각 엔드포인트를 아래 순서로 구현한다.

---

## 폴더 구조

```
src/
├── routes/            # HTTP 경로 + 미들웨어 연결
│   ├── index.ts       # 라우터 통합
│   └── orders.ts
├── controllers/       # 요청 파싱 + 검증 + 응답 반환
│   └── orders.ts
├── services/          # 비즈니스 로직
│   └── orders.ts
├── repositories/      # DB 쿼리
│   └── orders.ts
├── schemas/           # Zod 검증 스키마
│   └── orders.ts
├── errors/            # 커스텀 에러 클래스
│   └── index.ts
├── middleware/         # 인증, 권한, 에러 핸들링
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── validate.ts
└── types/             # 공유 타입
    └── orders.ts
```

기존 프로젝트에 이미 다른 구조가 있으면 **기존 구조를 따른다**. 이 구조는 신규 프로젝트이거나 구조가 없을 때의 기본값이다.

---

## STEP 1: Route 레이어

HTTP 메서드, 경로, 미들웨어를 선언하고 Controller 함수를 연결한다. Route에는 로직을 넣지 않는다. "이 URL로 요청이 오면 어떤 미들웨어를 거쳐 어떤 Controller가 처리하는지" 한눈에 보이게 하는 것이 목적이다.

```ts
// routes/orders.ts
import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createOrderSchema, updateOrderSchema } from "@/schemas/orders";
import * as ordersController from "@/controllers/orders";

const router = Router();

router.get("/orders", authenticate, ordersController.list);
router.get("/orders/:id", authenticate, ordersController.getById);
router.post("/orders", authenticate, validate(createOrderSchema), ordersController.create);
router.put("/orders/:id", authenticate, validate(updateOrderSchema), ordersController.update);
router.delete("/orders/:id", authenticate, ordersController.remove);

export default router;
```

**규칙:**
- 미들웨어 순서: 인증 → 권한 → 검증 → Controller
- RESTful 규칙을 따른다 (GET=조회, POST=생성, PUT=수정, DELETE=삭제)
- URL은 복수형 명사를 사용한다 (`/orders`, `/users`)

---

## STEP 2: Controller 레이어

요청을 파싱하고, Service를 호출하고, 응답을 반환한다. Controller는 비즈니스 로직을 모른다. "요청에서 데이터를 꺼내고, Service에게 넘기고, 결과를 JSON으로 감싸서 돌려준다"가 Controller의 전부이다.

```ts
// controllers/orders.ts
import { Request, Response, NextFunction } from "express";
import * as ordersService from "@/services/orders";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await ordersService.getOrders({
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getOrderById(req.params.id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.createOrder(req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.updateOrder(req.params.id, req.body);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await ordersService.deleteOrder(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
```

**규칙:**
- 모든 Controller 함수는 `try/catch`로 감싸고, catch에서 `next(error)`로 에러 미들웨어에 넘긴다
- `req.body`는 이미 validate 미들웨어에서 검증된 상태이므로 Controller에서 재검증하지 않는다
- HTTP 상태 코드: 생성=201, 삭제=204, 그 외=200
- 성공 응답은 `{ success: true, data: ... }` 형식으로 통일한다

---

## STEP 3: 입력값 검증 (Zod)

Zod 스키마로 요청 데이터를 검증한다. 검증은 Controller가 아니라 미들웨어에서 처리하므로, Controller에 도달한 시점에는 데이터가 이미 유효하다.

### 검증 스키마

```ts
// schemas/orders.ts
import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    productId: z.string().uuid("유효한 상품 ID가 필요합니다"),
    quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다"),
    shippingAddress: z.string().min(1, "배송 주소를 입력해주세요"),
  }),
});

export const updateOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.number().int().min(1).optional(),
    shippingAddress: z.string().min(1).optional(),
  }),
});

// 타입 추출 — 별도 타입 정의 없이 스키마에서 추론
export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>["body"];
```

### 검증 미들웨어

```ts
// middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값이 올바르지 않습니다.",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}
```

**규칙:**
- `body`, `params`, `query`를 하나의 스키마 객체로 묶어서 검증한다
- 에러 메시지는 한국어로 사용자 친화적으로 작성한다
- `z.infer`로 타입을 추출하여 별도 인터페이스 중복을 방지한다

---

## STEP 4: Service 레이어

비즈니스 로직을 담당한다. Service는 HTTP를 모른다 — `req`, `res` 객체를 받지 않는다. 순수한 데이터 입출력만 처리하기 때문에 테스트하기 쉽고, 같은 로직을 REST API든 GraphQL이든 CLI든 어디서든 재사용할 수 있다.

```ts
// services/orders.ts
import * as ordersRepo from "@/repositories/orders";
import { NotFoundError, BusinessError } from "@/errors";
import type { CreateOrderInput, UpdateOrderInput } from "@/schemas/orders";

export async function getOrders({ page, limit }: { page: number; limit: number }) {
  const offset = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ordersRepo.findMany({ offset, limit }),
    ordersRepo.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrderById(id: string) {
  const order = await ordersRepo.findById(id);
  if (!order) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }
  return order;
}

export async function createOrder(input: CreateOrderInput) {
  // 비즈니스 규칙 검증
  const product = await productsRepo.findById(input.productId);
  if (!product) {
    throw new NotFoundError("상품을 찾을 수 없습니다.");
  }
  if (product.stock < input.quantity) {
    throw new BusinessError("INSUFFICIENT_STOCK", "재고가 부족합니다.");
  }

  // 트랜잭션이 필요한 경우
  return await db.transaction(async (tx) => {
    const order = await ordersRepo.create(input, tx);
    await productsRepo.decrementStock(input.productId, input.quantity, tx);
    return order;
  });
}

export async function updateOrder(id: string, input: UpdateOrderInput) {
  const existing = await ordersRepo.findById(id);
  if (!existing) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }
  return await ordersRepo.update(id, input);
}

export async function deleteOrder(id: string) {
  const existing = await ordersRepo.findById(id);
  if (!existing) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }
  await ordersRepo.remove(id);
}
```

**규칙:**
- `req`, `res`를 받지 않는다 — 순수 데이터 입출력만 처리
- 비즈니스 규칙 위반 시 커스텀 에러를 throw한다 (HTTP 상태 코드가 아니라 비즈니스 에러)
- 여러 Repository를 조합하여 하나의 유스케이스를 완성한다
- 트랜잭션이 필요하면 Service에서 관리한다

---

## STEP 5: Repository 레이어

DB 쿼리만 담당한다. Repository는 비즈니스 로직을 모른다 — "이 조건으로 데이터를 찾아줘", "이 데이터를 저장해줘"를 처리할 뿐이다. ORM을 바꿔도 Repository만 수정하면 나머지 코드는 영향을 받지 않는다.

```ts
// repositories/orders.ts
import { db } from "@/lib/db";  // Prisma, Drizzle, 또는 프로젝트의 ORM
import type { CreateOrderInput, UpdateOrderInput } from "@/schemas/orders";

export async function findMany({ offset, limit }: { offset: number; limit: number }) {
  return db.order.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function count() {
  return db.order.count();
}

export async function findById(id: string) {
  return db.order.findUnique({ where: { id } });
}

export async function create(input: CreateOrderInput, tx?: any) {
  const client = tx || db;
  return client.order.create({
    data: {
      ...input,
      status: "pending",
    },
  });
}

export async function update(id: string, input: UpdateOrderInput) {
  return db.order.update({
    where: { id },
    data: input,
  });
}

export async function remove(id: string) {
  return db.order.delete({ where: { id } });
}
```

**규칙:**
- ORM 메서드만 사용한다 — raw SQL은 성능 최적화가 필요할 때만
- 트랜잭션 클라이언트를 선택적으로 받을 수 있도록 `tx` 파라미터를 지원한다
- 리턴 타입은 ORM이 추론하도록 두고, 명시적 타입이 필요하면 Service에서 처리한다

---

## 에러 처리

### 커스텀 에러 클래스

비즈니스 에러를 HTTP 상태 코드와 분리한다. Service는 "재고 부족"이라는 비즈니스 사실만 알리고, 이것을 HTTP 409로 변환하는 것은 에러 미들웨어의 역할이다.

```ts
// errors/index.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "리소스를 찾을 수 없습니다.") {
    super(404, "NOT_FOUND", message);
  }
}

export class BusinessError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(409, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "접근 권한이 없습니다.") {
    super(403, "FORBIDDEN", message);
  }
}
```

### 에러 핸들링 미들웨어

모든 에러를 한 곳에서 통일된 형식으로 변환한다.

```ts
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/errors";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // 커스텀 에러 — 정의된 상태 코드와 코드 사용
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // 예상하지 못한 에러 — 내부 정보 노출 방지
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "서버 오류가 발생했습니다.",
    },
  });
}
```

### 응답 형식 정리

| 상황 | HTTP 상태 | 응답 형식 |
|------|-----------|-----------|
| 성공 (조회/수정) | 200 | `{ success: true, data: { ... } }` |
| 성공 (생성) | 201 | `{ success: true, data: { ... } }` |
| 성공 (삭제) | 204 | 빈 응답 |
| 입력값 오류 | 422 | `{ success: false, error: { code: "VALIDATION_ERROR", message, details } }` |
| 인증 실패 | 401 | `{ success: false, error: { code: "UNAUTHORIZED", message } }` |
| 권한 없음 | 403 | `{ success: false, error: { code: "FORBIDDEN", message } }` |
| 리소스 없음 | 404 | `{ success: false, error: { code: "NOT_FOUND", message } }` |
| 비즈니스 에러 | 409 | `{ success: false, error: { code: "INSUFFICIENT_STOCK", message } }` |
| 서버 에러 | 500 | `{ success: false, error: { code: "INTERNAL_ERROR", message } }` |

---

## 구현 순서 체크리스트

API 엔드포인트를 구현할 때 아래 순서로 진행한다:

1. [ ] `context/03_api_spec.md`에서 구현할 엔드포인트 확인
2. [ ] `schemas/`에 Zod 검증 스키마 + 타입 추출
3. [ ] `repositories/`에 DB 쿼리 함수 작성
4. [ ] `services/`에 비즈니스 로직 작성
5. [ ] `controllers/`에 요청/응답 처리 작성
6. [ ] `routes/`에 경로 + 미들웨어 연결
7. [ ] `errors/`에 필요한 커스텀 에러 추가 (기존에 없는 경우)
8. [ ] 에러 핸들링 미들웨어 확인 (이미 있으면 스킵)
9. [ ] 응답 형식 확인 (success/error 구조 준수)

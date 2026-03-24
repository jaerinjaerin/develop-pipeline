---
name: api-integration
description: "FE 개발자가 BE API를 연동할 때 일관된 패턴을 유지하기 위해 참조하는 skill. 커스텀 훅 작성, 에러 핸들링, 타입 정의 방법을 제공한다. API 연동 코드를 작성하거나, 새 API 엔드포인트를 프론트엔드에 붙이거나, 에러 핸들링 로직을 구현할 때 반드시 사용한다. 'API 연동', 'API 호출', '에러 처리', 'useQuery', 'useMutation', 'fetch 함수 작성' 등의 상황에서 트리거된다."
---

# API Integration

FE 개발자가 BE API를 연동할 때 따르는 패턴이다.

API 연동은 "타입 → API 함수 → 커스텀 훅 → 에러 핸들링" 순서로 진행한다. 이 순서가 중요한 이유는, 타입을 먼저 정의해야 API 함수와 훅에서 타입 안전성을 확보할 수 있고, 에러 핸들링을 마지막에 일괄 적용해야 누락 없이 모든 API 호출을 커버할 수 있기 때문이다.

---

## STEP 1: 타입 정의

API 명세(`context/03_api_spec.md`)를 읽고 각 엔드포인트의 타입을 정의한다.

모든 API 호출에는 3종류의 타입이 필요하다:

```tsx
// types/[feature].ts

// Request — API에 보내는 데이터
export interface CreateOrderRequest {
  productId: string;
  quantity: number;
  shippingAddress: string;
}

// Response — API에서 받는 데이터
export interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  totalPrice: number;
  createdAt: string;
}

// Error — API 에러 응답 구조
export interface ApiError {
  statusCode: number;
  message: string;
  code?: string; // 비즈니스 에러 코드 (예: "INSUFFICIENT_STOCK")
}
```

**판단 기준:**
- GET 요청은 query params 타입 + Response 타입
- POST/PUT 요청은 Request body 타입 + Response 타입
- 공통 에러 타입은 프로젝트에 하나만 정의하고 재사용한다

기존 프로젝트에 이미 `ApiError` 타입이 있으면 그것을 사용한다.

---

## STEP 2: API 함수 작성

`lib/api/` 또는 `services/` 디렉토리에 API 함수를 작성한다. 기존 프로젝트의 디렉토리 구조를 따른다.

```tsx
// lib/api/orders.ts
import { apiClient } from "./client";
import type { CreateOrderRequest, Order } from "@/types/order";

// GET — 목록 조회
export async function fetchOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>("/orders");
  return data;
}

// GET — 단건 조회
export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

// POST — 생성
export async function createOrder(input: CreateOrderRequest): Promise<Order> {
  const { data } = await apiClient.post<Order>("/orders", input);
  return data;
}

// PUT — 수정
export async function updateOrder(id: string, input: Partial<CreateOrderRequest>): Promise<Order> {
  const { data } = await apiClient.put<Order>(`/orders/${id}`, input);
  return data;
}

// DELETE — 삭제
export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}
```

**핵심 원칙:**
- 성공 응답에 반드시 타입을 지정한다 (`apiClient.get<Order[]>`)
- 에러는 throw해서 상위(훅)로 전달한다 — API 함수에서 try/catch하지 않는다
- URL path에 변수가 들어가면 template literal을 사용한다

---

## STEP 3: 커스텀 훅으로 감싸기

컴포넌트에서 API 함수를 직접 호출하지 않는다. 반드시 커스텀 훅으로 감싼다.

프로젝트에 사용 중인 데이터 fetching 라이브러리에 따라 패턴이 달라진다. 기존 프로젝트를 확인하고 해당 패턴을 사용한다.

### React Query (TanStack Query) 사용 시

```tsx
// hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, fetchOrder, createOrder, deleteOrder } from "@/lib/api/orders";
import type { CreateOrderRequest } from "@/types/order";

// GET → useQuery
export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id),
    enabled: !!id, // id가 없으면 요청하지 않음
  });
}

// POST/PUT/DELETE → useMutation
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderRequest) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
```

### SWR 사용 시

```tsx
// hooks/useOrders.ts
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetchOrders, createOrder } from "@/lib/api/orders";
import type { CreateOrderRequest } from "@/types/order";

// GET → useSWR
export function useOrders() {
  return useSWR("orders", fetchOrders);
}

// POST/PUT/DELETE → useSWRMutation
export function useCreateOrder() {
  return useSWRMutation(
    "orders",
    (_key: string, { arg }: { arg: CreateOrderRequest }) => createOrder(arg)
  );
}
```

### 라이브러리 없이 직접 구현 시

```tsx
// hooks/useOrders.ts
import { useState, useEffect } from "react";
import { fetchOrders } from "@/lib/api/orders";
import type { Order } from "@/types/order";

export function useOrders() {
  const [data, setData] = useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchOrders()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}
```

**반환값 규칙:**

모든 커스텀 훅은 컴포넌트가 필요한 3가지를 반환한다:
- `data` — 응답 데이터 (로딩 중이면 `undefined` 또는 `null`)
- `isLoading` — 로딩 중 여부
- `isError` 또는 `error` — 에러 발생 여부

이 3가지가 있어야 컴포넌트에서 Loading/Error/Empty/Success 4상태를 처리할 수 있다.

---

## STEP 4: 에러 핸들링

에러 핸들링은 두 레이어로 구성한다: **글로벌 인터셉터** (공통 에러)와 **컴포넌트 레벨** (개별 에러).

### 글로벌 인터셉터

HTTP 상태 코드별 공통 처리를 API 클라이언트에 설정한다. 모든 API 호출에 자동 적용되므로 개별 컴포넌트에서 반복하지 않아도 된다.

```tsx
// lib/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 Unauthorized → 로그인 페이지로 리다이렉트
    if (status === 401) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 403 Forbidden → 권한 없음 알림
    // toast는 기존 프로젝트의 토스트 라이브러리를 사용한다
    // (react-hot-toast, sonner, react-toastify 등)
    if (status === 403) {
      toast.error("접근 권한이 없습니다.");
      return Promise.reject(error);
    }

    // 네트워크 오류 (서버 응답 자체가 없는 경우)
    if (!error.response) {
      toast.error("네트워크 연결을 확인해주세요.");
      return Promise.reject(error);
    }

    // 그 외 에러는 상위로 전달 (컴포넌트에서 처리)
    return Promise.reject(error);
  }
);
```

### 에러 핸들링 기준표

| 상태 코드 | 처리 방식 | 처리 위치 |
|-----------|-----------|-----------|
| 401 Unauthorized | 로그인 페이지로 리다이렉트 | 글로벌 인터셉터 |
| 403 Forbidden | 권한 없음 토스트 | 글로벌 인터셉터 |
| 404 Not Found | 빈 상태 UI 표시 | 컴포넌트 |
| 422 Validation Error | 폼 필드별 에러 메시지 | 컴포넌트 |
| 500 Internal Server Error | 에러 상태 UI + 재시도 버튼 | 컴포넌트 |
| 네트워크 오류 | 연결 확인 토스트 | 글로벌 인터셉터 |

### 컴포넌트 레벨 에러 처리

글로벌 인터셉터가 처리하지 않는 에러(404, 422, 500)는 컴포넌트에서 처리한다.

```tsx
// 404 — 빈 상태 UI
export function OrderDetail({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useOrder(orderId);

  if (isLoading) return <OrderDetailSkeleton />;

  if (error?.response?.status === 404) {
    return <EmptyState message="주문을 찾을 수 없습니다." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="주문 정보를 불러올 수 없습니다."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <OrderInfo order={data} />;
}
```

```tsx
// 422 — 폼 유효성 에러
export function CreateOrderForm() {
  const { mutate, isPending, error } = useCreateOrder();

  const fieldErrors = error?.response?.status === 422
    ? error.response.data.errors
    : {};

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutate(formData); }}>
      <Input
        name="quantity"
        error={fieldErrors?.quantity}
      />
      <Button type="submit" loading={isPending}>주문하기</Button>
    </form>
  );
}
```

```tsx
// 500 — 에러 UI + 재시도
// useQuery의 refetch 또는 직접 재호출로 재시도한다
export function OrderList() {
  const { data, isLoading, error, refetch } = useOrders();

  if (error) {
    return (
      <ErrorMessage
        message="서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        onRetry={refetch}
      />
    );
  }

  // ...
}
```

---

## 구현 순서 체크리스트

API 연동 시 아래 순서로 진행한다:

1. [ ] `context/03_api_spec.md`에서 연동할 엔드포인트 확인
2. [ ] `types/`에 Request / Response / Error 타입 정의
3. [ ] `lib/api/`에 API 함수 작성 (타입 지정, 에러는 throw)
4. [ ] `hooks/`에 커스텀 훅 작성 (useQuery / useMutation)
5. [ ] 글로벌 에러 인터셉터 확인 (이미 있으면 스킵)
6. [ ] 컴포넌트에서 훅 호출 + 4상태 처리 (Loading/Error/Empty/Success)
7. [ ] 에러 시나리오별 UI 동작 확인 (401/403/404/500/네트워크)

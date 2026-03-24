---
name: implement-components
description: "FE 개발자가 디자인 명세 기반으로 React/Next.js 컴포넌트를 구현할 때 일관된 패턴을 유지하기 위한 skill. Props 타입 정의, 상태 처리(Loading/Error/Empty), 파일 배치, 반응형 구현까지의 구현 기준을 제공한다. FE Agent가 STEP 4(구현)에서 컴포넌트를 작성할 때, 새 컴포넌트를 만들거나 기존 컴포넌트를 수정할 때 반드시 사용한다."
---

# Implement Components

FE 개발자가 컴포넌트를 구현할 때 일관된 패턴을 따르기 위한 skill이다.

같은 팀에서 작성한 코드처럼 보이려면 모든 컴포넌트가 동일한 구조를 따라야 한다. 이 skill은 "컴포넌트를 어떻게 작성할 것인가"에 대한 팀 규약이다.

---

## 파일 배치 규칙

컴포넌트의 역할에 따라 저장 위치가 정해진다. 이 규칙은 프로젝트가 커져도 파일을 쉽게 찾을 수 있게 해준다.

```
src/
├── components/
│   ├── ui/                    # 공통 UI 컴포넌트 (Button, Input, Modal 등)
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── [feature]/             # 기능별 컴포넌트 (ProductCard, CartItem 등)
│       ├── ProductCard.tsx
│       └── CartItem.tsx
├── hooks/                     # 커스텀 훅
│   ├── useProducts.ts
│   └── useAuth.ts
├── types/                     # 타입 정의
│   ├── product.ts
│   └── user.ts
├── lib/
│   └── api/                   # API 클라이언트 함수
│       ├── client.ts          # axios/fetch 인스턴스
│       └── products.ts        # API 호출 함수
├── app/ (또는 pages/)         # 페이지
│   └── products/
│       └── page.tsx
└── styles/                    # 스타일
    └── globals.css
```

**판단 기준:**
- 2개 이상의 페이지에서 사용 → `components/ui/`
- 특정 기능에서만 사용 → `components/[feature]/`
- 페이지 자체 → `app/` 또는 `pages/`

기존 프로젝트에 이미 다른 구조가 있으면 **기존 구조를 따른다**. 이 규칙은 신규 프로젝트이거나 구조가 없을 때의 기본값이다.

---

## 컴포넌트 구현 패턴

모든 컴포넌트는 아래 3단계로 구현한다.

### 1단계: Props 타입 정의

컴포넌트의 인터페이스를 먼저 확정한다. 코드를 작성하기 전에 "이 컴포넌트가 무엇을 받고, 무엇을 노출하는지"를 명확히 한다.

```tsx
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}
```

**규칙:**
- 필수 props와 선택 props를 구분한다 (`?`로 선택적 표시)
- 콜백은 `on` 접두어를 사용한다 (`onClick`, `onSubmit`)
- 데이터 타입은 `types/` 폴더에서 import한다
- `any` 타입은 사용하지 않는다

### 2단계: 컴포넌트 함수 작성

```tsx
export function ProductCard({ product, onAddToCart, isWishlisted = false, onToggleWishlist }: ProductCardProps) {
  // 컴포넌트 로직
}
```

**규칙:**
- `export function` 사용 (named export)
- `default export`는 페이지 컴포넌트에서만 사용
- destructuring으로 props를 받는다
- 선택적 props에는 기본값을 지정한다

### 3단계: 상태별 렌더링

모든 데이터 의존 컴포넌트는 4가지 상태를 처리한다. QA에서 빠뜨린 상태가 발견되면 구현이 반려되기 때문에, 처음부터 모두 구현하는 것이 효율적이다.

```tsx
export function ProductList() {
  const { data, isLoading, error } = useProducts();

  // ① 로딩 상태
  if (isLoading) {
    return <ProductListSkeleton />;
  }

  // ② 에러 상태
  if (error) {
    return (
      <ErrorMessage
        message="상품 목록을 불러올 수 없습니다."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ③ 빈 상태
  if (!data || data.length === 0) {
    return <EmptyState message="등록된 상품이 없습니다." />;
  }

  // ④ 정상 상태
  return (
    <div className="product-grid">
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**상태별 처리 가이드:**

| 상태 | 표시 내용 | 필수 여부 |
|------|-----------|-----------|
| Loading | 스켈레톤 UI 또는 스피너 | 데이터 fetching 시 필수 |
| Error | 에러 메시지 + 재시도 버튼 | 데이터 fetching 시 필수 |
| Empty | 빈 상태 일러스트 + 안내 메시지 | 목록형 컴포넌트 필수 |
| Success | 실제 콘텐츠 | 항상 필수 |

**순수 UI 컴포넌트**(Button, Input 등)는 자체 데이터 fetching이 없으므로 이 4상태 처리가 필요 없다. 대신 `disabled`, `loading` 같은 상태 props를 받아 처리한다.

---

## API 연동 (타입, API 함수, 커스텀 훅, 에러 핸들링)

API 연동의 상세 패턴은 **`api-integration` skill**을 참조한다. 여기서는 컴포넌트 구현 관점에서의 핵심 원칙만 정리한다.

- 컴포넌트에서 직접 fetch/axios를 호출하지 않는다. 반드시 커스텀 훅으로 감싼다.
- 커스텀 훅은 `data`, `isLoading`, `error`를 반환하여 컴포넌트가 4상태를 처리할 수 있게 한다.
- 타입 정의, API 함수 작성, 훅 구현, 에러 핸들링의 구체적인 패턴과 순서는 `api-integration` skill에 정의되어 있다.

---

## 스타일링 패턴

기존 프로젝트의 스타일링 방식을 따른다. 프로젝트에 스타일링 체계가 없으면 아래 순서로 권장한다:

1. **Tailwind CSS** — 이미 설치되어 있으면 우선 사용
2. **CSS Modules** — Next.js 프로젝트에서 기본 지원
3. **바닐라 CSS** — 소규모 프로젝트에서

### 디자인 토큰 적용

디자인 명세에 토큰이 정의되어 있으면 CSS 변수로 등록한다:

```css
/* styles/tokens.css */
:root {
  --color-primary: #2563eb;
  --color-error: #dc2626;
  --radius-md: 8px;
  --spacing-4: 16px;
  --font-size-body: 16px;
}
```

### 반응형 (Mobile-First)

작은 화면부터 큰 화면으로 확장하는 방식으로 작성한다:

```css
/* 기본: 모바일 */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* 태블릿 (768px 이상) */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 데스크탑 (1024px 이상) */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 구현 순서 체크리스트

컴포넌트를 구현할 때 아래 순서를 따른다:

1. [ ] `types/`에 타입 정의
2. [ ] `lib/api/`에 API 함수 작성
3. [ ] `hooks/`에 커스텀 훅 작성
4. [ ] `components/ui/`에 공통 컴포넌트 구현 (Button, Input 등)
5. [ ] `components/[feature]/`에 기능 컴포넌트 구현
6. [ ] `app/` 또는 `pages/`에 페이지 컴포넌트 구현
7. [ ] 라우팅 연결
8. [ ] 4상태 처리 확인 (Loading/Error/Empty/Success)
9. [ ] 반응형 확인 (mobile/tablet/desktop)
10. [ ] TypeScript 타입 에러 없음 확인

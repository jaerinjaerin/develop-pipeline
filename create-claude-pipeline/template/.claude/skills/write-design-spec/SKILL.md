---
name: write-design-spec
description: "디자이너 Agent가 FE Agent에게 전달할 디자인 명세(context/02_design_spec.md)를 작성할 때 포맷 기준으로 사용하는 skill. 디자인 토큰, 공통 컴포넌트(Props+상태), 화면별 레이아웃(ASCII+반응형), 인터랙션, 접근성 가이드 5개 섹션을 FE가 바로 구현할 수 있는 수준으로 작성한다. '디자인 명세 작성', '02_design_spec 생성', '화면 설계', '컴포넌트 정의', 'FE에게 전달할 디자인' 등의 상황에서 반드시 사용한다."
---

# Write Design Spec

디자이너 Agent가 `context/02_design_spec.md`를 작성할 때 따르는 포맷 기준이다.

이 명세의 독자는 FE 개발자다. FE가 이 문서 하나만 읽고 디자인 의도대로 구현할 수 있어야 한다. 그래서 모든 값은 구체적인 숫자로, 모든 상태는 빠짐없이, 모든 레이아웃은 시각적으로 표현한다.

---

## Step 1: 입력 확인

아래 파일을 읽는다:
- `context/00_requirements.md` — 프로젝트 현황, 기술 스택
- `context/01_plan.md` — 화면 목록(S-xx), 기능 명세(F-xx)

`01_plan.md`의 화면 목록이 이 명세의 범위를 결정한다. 기획안에 없는 화면을 임의로 추가하지 않는다.

`explore-design-system` skill을 통해 기존 디자인 시스템 현황을 파악했다면 그 결과도 참고한다. 기존 토큰/컴포넌트가 있으면 재사용하고, 없는 것만 새로 정의한다.

---

## Step 2: 5개 섹션으로 명세 작성

### 섹션 1: 디자인 토큰

서비스 전체에서 일관되게 사용할 기본 값을 정의한다. 기존 디자인 시스템이 있으면 그것을 기반으로 확장하고, 없으면 새로 정의한다.

```markdown
## 1. 디자인 토큰

### 색상 (Color)

| 토큰명 | 값 | 용도 |
|--------|------|------|
| --color-primary | #3182ce | 주요 액션, 링크 |
| --color-primary-hover | #2b6cb0 | Primary hover 상태 |
| --color-secondary | #718096 | 보조 요소 |
| --color-bg | #ffffff | 페이지 배경 |
| --color-surface | #f7fafc | 카드/섹션 배경 |
| --color-border | #e2e8f0 | 테두리 |
| --color-error | #e53e3e | 에러 메시지, 유효성 |
| --color-success | #38a169 | 성공 상태 |
| --color-warning | #dd6b20 | 경고 |
| --color-text-primary | #1a202c | 본문 텍스트 |
| --color-text-secondary | #718096 | 보조 텍스트 |
| --color-text-disabled | #a0aec0 | 비활성 텍스트 |

### 타이포그래피 (Typography)

| 토큰명 | Size | Weight | Line Height | 용도 |
|--------|------|--------|-------------|------|
| H1 | 28px | 700 | 1.3 | 페이지 제목 |
| H2 | 22px | 600 | 1.35 | 섹션 제목 |
| H3 | 18px | 600 | 1.4 | 서브 섹션 |
| Body1 | 16px | 400 | 1.6 | 본문 |
| Body2 | 14px | 400 | 1.5 | 보조 본문 |
| Caption | 12px | 400 | 1.4 | 캡션, 힌트 |

Font Family: `'Pretendard', -apple-system, sans-serif`

### 간격 (Spacing)

| 토큰명 | 값 |
|--------|------|
| --space-xs | 4px |
| --space-sm | 8px |
| --space-md | 16px |
| --space-lg | 24px |
| --space-xl | 32px |
| --space-2xl | 48px |

### 반경 (Border Radius)

| 토큰명 | 값 |
|--------|------|
| --radius-sm | 4px |
| --radius-md | 8px |
| --radius-lg | 12px |
| --radius-full | 9999px |

### 그림자 (Shadow)

| 토큰명 | 값 |
|--------|------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.05) |
| --shadow-md | 0 4px 6px rgba(0,0,0,0.07) |
| --shadow-lg | 0 10px 15px rgba(0,0,0,0.1) |
```

위 값들은 예시다. 프로젝트에 맞는 실제 값을 사용한다. 핵심은 모든 값에 **토큰명 + 구체적 수치 + 용도**를 명시하는 것이다.

---

### 섹션 2: 공통 컴포넌트

재사용되는 UI 컴포넌트를 정의한다. 각 컴포넌트는 아래 4가지를 포함한다:

1. **TypeScript Props 타입**
2. **상태별 스타일** (default / hover / focus / active / disabled / loading / error)
3. **크기 변형** (sm / md / lg)
4. **사용 예시**

```markdown
## 2. 공통 컴포넌트

### Button

\`\`\`typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}
\`\`\`

**크기별 스타일:**

| Size | Height | Padding (H) | Font Size | Border Radius |
|------|--------|-------------|-----------|---------------|
| sm | 32px | 12px | 13px | --radius-sm |
| md | 40px | 16px | 14px | --radius-md |
| lg | 48px | 20px | 16px | --radius-md |

**variant=primary 상태별 스타일:**

| 상태 | Background | Text | Border | 기타 |
|------|-----------|------|--------|------|
| Default | --color-primary | #ffffff | none | cursor: pointer |
| Hover | --color-primary-hover | #ffffff | none | — |
| Focus | --color-primary | #ffffff | 2px solid #63b3ed | outline-offset: 2px |
| Active | #2c5282 | #ffffff | none | — |
| Disabled | #cbd5e0 | #a0aec0 | none | cursor: not-allowed, opacity: 0.6 |
| Loading | --color-primary | — | none | spinner 표시, 텍스트 숨김 |
```

**반드시 정의할 컴포넌트 목록:**
- Button
- Input (text, password, search)
- Select / Dropdown
- Checkbox, Radio
- Modal / Dialog
- Toast / Alert
- Loading Spinner
- Empty State (데이터 없음)
- Error State (에러 발생)
- Skeleton (로딩 플레이스홀더)

기획안의 기능에 따라 추가 컴포넌트를 정의한다. 예: Table, Card, Badge, Avatar, Tabs 등.

---

### 섹션 3: 화면별 레이아웃

기획안의 화면 목록(S-xx)을 기준으로 각 화면의 레이아웃을 정의한다.

각 화면은 아래 구조로 작성한다:

```markdown
## 3. 화면별 레이아웃

### S-01: 로그인

**경로:** `/login`
**관련 기능:** F-01, F-02

**Desktop (1280px+)**
\`\`\`
┌─────────────────────────────────────┐
│              Header (64px)          │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────┐          │
│    │   Logo              │          │
│    │   48px × 48px       │          │
│    ├─────────────────────┤          │
│    │   Email Input       │  400px   │
│    │   Password Input    │  width   │
│    │   [로그인 버튼]      │  center  │
│    │   ───────────────   │          │
│    │   소셜 로그인 영역   │          │
│    └─────────────────────┘          │
│                                     │
└─────────────────────────────────────┘
\`\`\`

**Tablet (768px)**
\`\`\`
┌───────────────────────┐
│     Header (56px)     │
├───────────────────────┤
│   Login Form (360px)  │
│   center aligned      │
└───────────────────────┘
\`\`\`

**Mobile (375px)**
\`\`\`
┌─────────────────┐
│  Header (48px)  │
├─────────────────┤
│  Logo           │
│  Email Input    │  padding:
│  Password Input │  16px
│  [로그인 버튼]   │  full-width
│  소셜 로그인     │
└─────────────────┘
\`\`\`

**컴포넌트 배치:**

| 영역 | 컴포넌트 | Props |
|------|---------|-------|
| 이메일 | Input | type="email", size="lg", placeholder="이메일" |
| 비밀번호 | Input | type="password", size="lg", placeholder="비밀번호" |
| 로그인 | Button | variant="primary", size="lg", fullWidth |

**화면 상태:**

| 상태 | 설명 |
|------|------|
| Default | 빈 폼, 로그인 버튼 비활성 |
| Filled | 두 필드 입력 완료, 로그인 버튼 활성 |
| Loading | 로그인 버튼 loading 상태, 입력 disabled |
| Error | Input error 상태 + 에러 메시지 표시 |
```

**반응형 기준점:**
- Desktop: 1280px 이상
- Tablet: 768px ~ 1279px
- Mobile: 375px ~ 767px

모든 화면에 3가지 해상도 레이아웃을 정의한다. 레이아웃이 변하지 않는 경우 "Desktop과 동일"로 표기해도 된다.

---

### 섹션 4: 인터랙션 & 애니메이션

화면 전환, 컴포넌트 동작의 시각적 행동을 정의한다.

```markdown
## 4. 인터랙션 & 애니메이션

### 전역 설정

| 항목 | 값 |
|------|------|
| 기본 transition | 150ms ease-in-out |
| 페이지 전환 | fade 200ms |
| easing 함수 | cubic-bezier(0.4, 0, 0.2, 1) |

### 컴포넌트별 애니메이션

| 컴포넌트 | 트리거 | 애니메이션 | Duration |
|---------|--------|-----------|----------|
| Modal | 열기 | fade-in + scale(0.95→1) | 200ms |
| Modal | 닫기 | fade-out + scale(1→0.95) | 150ms |
| Toast | 표시 | slide-down from top | 300ms |
| Toast | 사라짐 | fade-out | 200ms, 3초 후 자동 |
| Dropdown | 열기 | fade-in + slide-down(4px) | 150ms |
| Skeleton | 대기 | pulse (opacity 0.4↔1) | 1.5s infinite |

### 스크롤 동작

| 화면 | 방식 | 비고 |
|------|------|------|
| 목록형 | 무한 스크롤 / 페이지네이션 | (기획안 기준) |
| 상세 | 일반 스크롤 | — |

### 로딩 전략

| 상황 | 처리 |
|------|------|
| 페이지 초기 로딩 | Skeleton 표시 |
| 버튼 액션 후 | 버튼 loading 상태 |
| 목록 추가 로딩 | 하단 spinner |
| 이미지 로딩 | blur placeholder → fade-in |
```

---

### 섹션 5: 접근성 가이드

```markdown
## 5. 접근성 가이드

### 색상 대비

| 조합 | 대비 비율 | WCAG AA |
|------|----------|---------|
| text-primary / bg | 최소 4.5:1 | 통과 |
| text-secondary / bg | 최소 3:1 | 통과 |
| primary button / white text | 최소 4.5:1 | 통과 |

### 포커스 스타일

모든 인터랙티브 요소에 visible focus indicator를 제공한다:
- `outline: 2px solid --color-primary`
- `outline-offset: 2px`
- `:focus-visible`만 적용 (마우스 클릭 시 미표시)

### 키보드 네비게이션

| 컴포넌트 | 키 | 동작 |
|---------|------|------|
| Modal | Escape | 닫기 |
| Modal | Tab | 내부 포커스 트랩 |
| Dropdown | ArrowDown/Up | 항목 이동 |
| Dropdown | Enter | 선택 |
| Dropdown | Escape | 닫기 |

### 스크린리더

| 컴포넌트 | aria 속성 |
|---------|-----------|
| Modal | role="dialog", aria-modal="true", aria-labelledby |
| Toast | role="alert", aria-live="polite" |
| Loading | aria-busy="true", aria-label="로딩 중" |
| Icon Button | aria-label (텍스트 없는 버튼) |
```

---

## Step 3: 저장 및 보고

완성된 명세를 `context/02_design_spec.md`에 저장한다.

저장 후 보고:

```
[디자인 명세 완성]
- 저장 위치: context/02_design_spec.md
- 디자인 토큰: 색상 N개, 타이포 N개, 간격 N개
- 공통 컴포넌트: N개 (각 상태/크기 정의 완료)
- 화면 레이아웃: N개 (반응형 3단계)
- 인터랙션: N개 정의
- 접근성: WCAG AA 기준 적용
```

---

## 품질 체크리스트

저장 전 점검한다:

- [ ] 모든 색상이 hex 코드인가? (`#3182ce` O, `blue` X)
- [ ] 모든 크기에 단위가 있는가? (`16px` O, `16` X)
- [ ] 모든 duration에 단위가 있는가? (`200ms` O, `빠르게` X)
- [ ] 모호한 표현이 없는가? (`적당히`, `자연스럽게`, `예쁘게` X)
- [ ] 모든 컴포넌트에 Props 타입이 TypeScript로 정의되었는가?
- [ ] 모든 컴포넌트에 최소 default/hover/focus/disabled 상태가 있는가?
- [ ] 모든 화면에 Desktop/Tablet/Mobile 레이아웃이 있는가?
- [ ] 기획안의 화면 목록(S-xx)을 모두 커버하는가?
- [ ] 기획안에 없는 화면을 임의 추가하지 않았는가?

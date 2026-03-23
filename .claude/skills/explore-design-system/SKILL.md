---
name: explore-design-system
description: "디자이너 Agent가 디자인 명세(02_design_spec.md) 작성 전에 기존 프로젝트의 디자인 시스템을 파악할 때 사용하는 skill. 기존 색상 체계, 폰트, 컴포넌트, UI 라이브러리, CSS 변수, 테마 설정을 탐색해서 새 디자인이 기존 서비스와 일관성을 유지하도록 한다. 디자이너가 STEP 2(기존 디자인 시스템 파악)를 수행할 때, 코드베이스의 시각적 체계를 처음 접하는 상황에서, 또는 기존 디자인 시스템을 확장하는 작업을 할 때 반드시 사용한다."
context: fork
agent: Explore
---

# Explore Design System

디자이너 Agent가 디자인 명세를 작성하기 전에 기존 프로젝트의 디자인 시스템 현황을 파악하는 skill이다.

기존 프로젝트가 이미 색상, 폰트, 컴포넌트 등을 정의하고 있다면, 새 디자인 명세는 이를 따라야 한다. 이 skill은 코드베이스를 탐색해서 기존 체계를 발견하고, 디자이너가 일관된 명세를 작성할 수 있도록 현황을 정리한다.

기존 프로젝트가 없는 경우(신규 프로젝트)에도 이 skill을 실행하되, "기존 디자인 시스템 없음 — 처음부터 정의 필요"라고 보고한다.

---

## 탐색 절차

Explore agent를 사용하여 아래 항목들을 병렬로 탐색한다.

### 1. UI 라이브러리 확인

`package.json` (또는 프로젝트 의존성 파일)에서 UI 관련 라이브러리를 확인한다.

찾을 키워드:
- `tailwindcss`, `@tailwindcss/...`
- `@shadcn/ui`, `shadcn`
- `@mui/material`, `@mui/icons-material`
- `antd`, `ant-design`
- `@chakra-ui/react`
- `@radix-ui/...`
- `styled-components`, `@emotion/...`
- `sass`, `less`
- `bootstrap`, `react-bootstrap`

라이브러리가 있으면 버전도 함께 기록한다. 어떤 라이브러리를 쓰는지에 따라 디자인 토큰 정의 방식이 달라진다.

### 2. 테마 / 디자인 토큰 탐색

아래 파일들을 찾는다:

```
Glob: **/tailwind.config.{js,ts,mjs,cjs}
Glob: **/theme.{js,ts,tsx}
Glob: **/tokens.{css,scss,js,ts,json}
Glob: **/variables.{css,scss,less}
Glob: **/globals.css, **/global.css, **/app.css
Glob: **/_variables.scss, **/_tokens.scss
```

찾은 파일에서 추출할 정보:
- **색상**: primary, secondary, accent, background, text 등
- **폰트**: font-family, font-size 스케일
- **간격**: spacing 스케일 (4px? 8px?)
- **반경**: border-radius 값들
- **그림자**: box-shadow 정의
- **브레이크포인트**: 반응형 기준점

### 3. 기존 컴포넌트 탐색

공통/재사용 컴포넌트 폴더를 찾는다:

```
Glob: **/components/ui/**/*.{tsx,jsx,vue}
Glob: **/components/common/**/*.{tsx,jsx,vue}
Glob: **/components/shared/**/*.{tsx,jsx,vue}
Glob: **/components/base/**/*.{tsx,jsx,vue}
Glob: **/ui/**/*.{tsx,jsx,vue}
```

찾은 컴포넌트 각각에 대해:
- 컴포넌트명
- Props 인터페이스 (있으면)
- 크기 변형 (sm/md/lg)이 있는지
- 상태 변형 (variant, color 등)이 있는지

### 4. 아이콘 / 에셋 확인

```
Glob: **/icons/**/*.{svg,tsx}
Glob: **/assets/**/*.{svg,png}
Glob: **/public/images/**/*
```

아이콘 라이브러리 사용 여부도 확인한다 (`lucide-react`, `react-icons`, `heroicons` 등).

---

## 출력 형식

탐색 결과를 아래 형식으로 정리하여 반환한다:

```markdown
# 기존 디자인 시스템 현황

## UI 라이브러리
- (없음 / shadcn@버전 / MUI@버전 / Tailwind@버전 등)
- CSS 방법론: (CSS Modules / Tailwind utility / styled-components / etc.)

## 기존 색상 체계
- Primary: #...
- Secondary: #...
- (없으면 "정의되지 않음 — 새로 정의 필요")

## 기존 타이포그래피
- Font Family: ...
- Size 스케일: ...
- (없으면 "정의되지 않음")

## 기존 간격 / 반경 / 그림자
- Spacing 단위: ...
- Border Radius: ...
- (없으면 "정의되지 않음")

## 기존 컴포넌트 목록
| 컴포넌트명 | 경로 | Props/변형 | 비고 |
|-----------|------|-----------|------|
| Button | components/ui/Button.tsx | size, variant | 재사용 가능 |

## 재사용 가능한 것
- (기존 것을 그대로 쓸 수 있는 컴포넌트/토큰 목록)

## 새로 만들어야 할 것
- (기획안 기준으로 기존에 없는 컴포넌트/토큰 목록)

## 디자이너 참고사항
- (기존 체계와 충돌할 수 있는 부분, 주의할 점)
```

---

## 신규 프로젝트인 경우

탐색 결과 디자인 시스템 관련 파일이 전혀 없으면:

```markdown
# 기존 디자인 시스템 현황

기존 디자인 시스템 없음 — 처음부터 정의 필요.

## 감지된 기술 스택
- (package.json 기반 프레임워크: React/Vue/Next.js 등)

## 권장사항
- CSS 방법론: (프레임워크에 따라 Tailwind / CSS Modules 등 제안)
- 컴포넌트 라이브러리: (필요 시 shadcn / Radix 등 제안)
```

이 경우 디자이너는 디자인 토큰과 컴포넌트를 모두 새로 정의한다.

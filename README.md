<div align="center">

<!-- Hero Section -->
<img src="https://img.shields.io/badge/Claude_Code-Pipeline-7C3AED?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="Claude Code Pipeline" height="35" />

<br />

# Claude Pipeline

### AI Agent 9명이 협업하는 소프트웨어 개발 파이프라인

<br />

<p>
  <img src="https://img.shields.io/npm/v/create-claude-pipeline?style=flat-square&color=7C3AED&label=npm" alt="npm version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Claude_Code-required-D97706?style=flat-square" alt="Claude Code" />
  <img src="https://img.shields.io/badge/license-MIT-22C55E?style=flat-square" alt="License" />
</p>

<p>
  <strong>기능 요청 한 줄</strong>로 기획 → 설계 → 구현 → QA까지.<br />
  9명의 전문 AI Agent가 체크포인트 기반으로 협업합니다.
</p>

<br />

```bash
npx create-claude-pipeline
```

<br />

</div>

---

<br />

## 어떻게 동작하나요?

사용자가 기능을 요청하면 **5단계 파이프라인**이 순차적으로 실행됩니다.
각 단계 사이에 **체크포인트**가 있어, 사용자가 승인해야만 다음으로 진행합니다.

<br />

<table>
  <tr>
    <td align="center" width="20%">
      <img src="https://img.shields.io/badge/PHASE_0-인풋_수신-DC2626?style=for-the-badge" alt="Phase 0" /><br /><br />
      <strong>PM이 요구사항을 분석</strong><br />
      <sub>신규/수정 판단, 영향 범위 파악<br />필요 Agent 결정</sub><br /><br />
      <code>00_requirements.md</code>
    </td>
    <td align="center" width="20%">
      <img src="https://img.shields.io/badge/PHASE_1-기획-16A34A?style=for-the-badge" alt="Phase 1" /><br /><br />
      <strong>기획자가 명세 작성</strong><br />
      <sub>유저 스토리, 기능 명세<br />화면 목록, API 초안</sub><br /><br />
      <code>01_plan.md</code>
    </td>
    <td align="center" width="20%">
      <img src="https://img.shields.io/badge/PHASE_2-설계-2563EB?style=for-the-badge" alt="Phase 2" /><br /><br />
      <strong>디자이너 + BE 병렬</strong><br />
      <sub>UI/UX 명세, 디자인 토큰<br />API 상세 설계, ERD</sub><br /><br />
      <code>02_design_spec.md</code><br />
      <code>03_api_spec.md</code>
    </td>
    <td align="center" width="20%">
      <img src="https://img.shields.io/badge/PHASE_3-구현-7C3AED?style=for-the-badge" alt="Phase 3" /><br /><br />
      <strong>FE + BE + Infra 협업</strong><br />
      <sub>컴포넌트, API, DB<br />Docker, CI/CD</sub><br /><br />
      <code>실제 코드</code>
    </td>
    <td align="center" width="20%">
      <img src="https://img.shields.io/badge/PHASE_4-QA_+_통합-D97706?style=for-the-badge" alt="Phase 4" /><br /><br />
      <strong>QA + 보안 + 코드리뷰</strong><br />
      <sub>기능 테스트, OWASP 검토<br />코드 품질 점검</sub><br /><br />
      <code>qa_report.md</code><br />
      <code>security_report.md</code>
    </td>
  </tr>
  <tr>
    <td align="center">
      <sub>✅ 체크포인트 1</sub>
    </td>
    <td align="center">
      <sub>✅ 체크포인트 2</sub>
    </td>
    <td align="center">
      <sub>✅ 체크포인트 3</sub>
    </td>
    <td align="center">
      <sub>✅ 체크포인트 4 (선택)</sub>
    </td>
    <td align="center">
      <sub>✅ 체크포인트 5 (최종)</sub>
    </td>
  </tr>
</table>

<br />

---

<br />

## 9명의 AI Agent

각 Agent는 전문 역할, 전용 스킬, 최적의 모델을 가집니다.

<br />

<table>
  <tr>
    <th width="5%"></th>
    <th width="15%">Agent</th>
    <th width="10%">모델</th>
    <th width="25%">역할</th>
    <th width="45%">사용 Skill</th>
  </tr>
  <tr>
    <td align="center">🔴</td>
    <td><strong>PM (Alex)</strong></td>
    <td><img src="https://img.shields.io/badge/Opus-DC2626?style=flat-square" /></td>
    <td>전체 오케스트레이터<br />요구사항 분석, 컨텍스트 조립</td>
    <td><code>analyze-requirements</code> <code>assemble-context</code></td>
  </tr>
  <tr>
    <td align="center">🟢</td>
    <td><strong>기획자 (Mina)</strong></td>
    <td><img src="https://img.shields.io/badge/Opus-16A34A?style=flat-square" /></td>
    <td>기능 명세, 유저 스토리<br />화면 목록, API 초안</td>
    <td><code>explore-codebase</code> <code>write-plan-doc</code></td>
  </tr>
  <tr>
    <td align="center">🩷</td>
    <td><strong>디자이너 (Lena)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-EC4899?style=flat-square" /></td>
    <td>UI/UX 명세<br />디자인 토큰, 컴포넌트 설계</td>
    <td><code>explore-design-system</code> <code>write-design-spec</code></td>
  </tr>
  <tr>
    <td align="center">🟣</td>
    <td><strong>FE 개발자 (Jay)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-7C3AED?style=flat-square" /></td>
    <td>컴포넌트 구현<br />상태 관리, API 연동</td>
    <td><code>explore-fe-codebase</code> <code>implement-components</code> <code>api-integration</code></td>
  </tr>
  <tr>
    <td align="center">🔵</td>
    <td><strong>BE 개발자 (Sam)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-2563EB?style=flat-square" /></td>
    <td>API 구현, DB 마이그레이션<br />인증/인가</td>
    <td><code>explore-be-codebase</code> <code>implement-api</code> <code>db-migration</code></td>
  </tr>
  <tr>
    <td align="center">🟠</td>
    <td><strong>인프라 (Dex)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-D97706?style=flat-square" /></td>
    <td>Docker, CI/CD<br />환경변수 관리</td>
    <td><code>explore-infra</code> <code>write-dockerfile</code> <code>write-cicd</code></td>
  </tr>
  <tr>
    <td align="center">🩵</td>
    <td><strong>QA (Eva)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-0891B2?style=flat-square" /></td>
    <td>기능 테스트, 엣지케이스<br />E2E 검증</td>
    <td><code>explore-implementation</code> <code>write-test-cases</code> <code>write-qa-report</code></td>
  </tr>
  <tr>
    <td align="center">🛡️</td>
    <td><strong>보안 리뷰어 (Rex)</strong></td>
    <td><img src="https://img.shields.io/badge/Opus-DC2626?style=flat-square" /></td>
    <td>OWASP 기준 취약점 검토<br />보안 감사</td>
    <td><code>scan-vulnerabilities</code> <code>review-auth</code> <code>write-security-report</code></td>
  </tr>
  <tr>
    <td align="center">⚪</td>
    <td><strong>코드 리뷰어 (Nora)</strong></td>
    <td><img src="https://img.shields.io/badge/Sonnet-6B7280?style=flat-square" /></td>
    <td>코드 품질, 컨벤션<br />기획 대비 구현 검토</td>
    <td><code>explore-implementation</code></td>
  </tr>
</table>

> **모델 선택 기준:** `Opus` = 깊은 추론이 필요한 역할 (PM, 기획, 보안) / `Sonnet` = 구조화된 구현과 문서 작성

<br />

---

<br />

## Quick Start

### 1. 사전 요구사항

```bash
# Claude Code CLI 설치 (이미 있다면 생략)
npm install -g @anthropic-ai/claude-code

# superpowers 플러그인 설치 (병렬 Agent 실행에 필요)
claude plugin add superpowers
```

### 2. 프로젝트에 파이프라인 설치

```bash
cd your-project
npx create-claude-pipeline
```

이 한 줄로 다음이 설치됩니다:

<table>
  <tr>
    <td width="50%">

**Agent & Skill**
- `.claude/agents/` — 9개 AI Agent 정의
- `.claude/skills/` — 21개 전문 Skill
- `.claude/settings.json` — Claude Code 설정

    </td>
    <td width="50%">

**파이프라인 인프라**
- `references/` — 3개 참조 문서
- `.claude-pipeline/dashboard/` — 실시간 대시보드
- `CLAUDE.md` — 파이프라인 가이드 (기존 파일 병합)

    </td>
  </tr>
</table>

### 3. 파이프라인 실행

```bash
# Claude Code 실행
claude

# 기능을 요청하면 파이프라인이 자동으로 시작됩니다
> 사용자 인증 시스템을 구현해줘
```

<br />

---

<br />

## 21개 전문 Skill

Agent들이 사용하는 전문 스킬이 21개 포함되어 있습니다.

<table>
  <tr>
    <th>카테고리</th>
    <th>Skill</th>
    <th>설명</th>
  </tr>
  <tr>
    <td rowspan="2"><img src="https://img.shields.io/badge/분석-DC2626?style=flat-square" /></td>
    <td><code>analyze-requirements</code></td>
    <td>코드베이스 자동 탐색, 영향 범위 파악</td>
  </tr>
  <tr>
    <td><code>assemble-context</code></td>
    <td>Phase 산출물 → Agent별 Task 파일 조립</td>
  </tr>
  <tr>
    <td rowspan="2"><img src="https://img.shields.io/badge/기획-16A34A?style=flat-square" /></td>
    <td><code>explore-codebase</code></td>
    <td>기존 서비스 현황 파악</td>
  </tr>
  <tr>
    <td><code>write-plan-doc</code></td>
    <td>7개 섹션 기획안 + HTML 보고서 생성</td>
  </tr>
  <tr>
    <td rowspan="2"><img src="https://img.shields.io/badge/디자인-EC4899?style=flat-square" /></td>
    <td><code>explore-design-system</code></td>
    <td>기존 디자인 토큰, 컴포넌트 탐색</td>
  </tr>
  <tr>
    <td><code>write-design-spec</code></td>
    <td>UI/UX 명세 (토큰, 레이아웃, 접근성)</td>
  </tr>
  <tr>
    <td rowspan="4"><img src="https://img.shields.io/badge/FE-7C3AED?style=flat-square" /></td>
    <td><code>explore-fe-codebase</code></td>
    <td>프론트엔드 구조 탐색</td>
  </tr>
  <tr>
    <td><code>implement-components</code></td>
    <td>React/Next.js 컴포넌트 구현 패턴</td>
  </tr>
  <tr>
    <td><code>api-integration</code></td>
    <td>API 연동 커스텀 훅, 에러 처리</td>
  </tr>
  <tr>
    <td><code>explore-implementation</code></td>
    <td>구현 현황 파악 (QA/리뷰어도 사용)</td>
  </tr>
  <tr>
    <td rowspan="3"><img src="https://img.shields.io/badge/BE-2563EB?style=flat-square" /></td>
    <td><code>explore-be-codebase</code></td>
    <td>백엔드 구조 탐색</td>
  </tr>
  <tr>
    <td><code>implement-api</code></td>
    <td>Route → Controller → Service → Repository</td>
  </tr>
  <tr>
    <td><code>db-migration</code></td>
    <td>안전한 스키마 변경 절차</td>
  </tr>
  <tr>
    <td rowspan="3"><img src="https://img.shields.io/badge/Infra-D97706?style=flat-square" /></td>
    <td><code>explore-infra</code></td>
    <td>기존 인프라 설정 탐색</td>
  </tr>
  <tr>
    <td><code>write-dockerfile</code></td>
    <td>멀티 스테이지 빌드 최적화</td>
  </tr>
  <tr>
    <td><code>write-cicd</code></td>
    <td>GitHub Actions CI/CD 파이프라인</td>
  </tr>
  <tr>
    <td rowspan="2"><img src="https://img.shields.io/badge/QA-0891B2?style=flat-square" /></td>
    <td><code>write-test-cases</code></td>
    <td>기획 기반 TC 작성 (기능, 엣지, E2E)</td>
  </tr>
  <tr>
    <td><code>write-qa-report</code></td>
    <td>QA 최종 보고서 (배포 권고 포함)</td>
  </tr>
  <tr>
    <td rowspan="3"><img src="https://img.shields.io/badge/보안-991B1B?style=flat-square" /></td>
    <td><code>scan-vulnerabilities</code></td>
    <td>OWASP Top 10 기준 자동 탐색</td>
  </tr>
  <tr>
    <td><code>review-auth</code></td>
    <td>JWT, 미들웨어, 권한 검사 검토</td>
  </tr>
  <tr>
    <td><code>write-security-report</code></td>
    <td>보안 리뷰 보고서 (심각도별 분류)</td>
  </tr>
</table>

<br />

---

<br />

## 컨텍스트 흐름

각 Phase 산출물이 `context/` 폴더에 번호순으로 쌓여 전체 히스토리를 형성합니다.

```
context/
│
├── 00_requirements.md        ◄── Phase 0: PM 분석 결과
│
├── 01_plan.md                ◄── Phase 1: 기획안 (Agent용)
├── 01_plan.html              ◄── Phase 1: 기획안 (사람용 보고서)
│
├── 02_design_spec.md         ◄── Phase 2: 디자인 명세
├── 03_api_spec.md            ◄── Phase 2: API 명세
├── 03_erd.md                 ◄── Phase 2: ERD
│
├── 04_task_FE.md             ◄── Phase 3: FE Agent 작업 지시
├── 04_task_BE.md             ◄── Phase 3: BE Agent 작업 지시
├── 04_task_INFRA.md          ◄── Phase 3: Infra Agent 작업 지시
│
├── 04_task_QA.md             ◄── Phase 4: QA Agent 작업 지시
├── 04_task_SEC.md            ◄── Phase 4: 보안 리뷰어 작업 지시
├── 04_task_REVIEW.md         ◄── Phase 4: 코드 리뷰어 작업 지시
│
├── qa_report.md              ◄── Phase 4: QA 최종 보고서
└── security_report.md        ◄── Phase 4: 보안 리뷰 보고서
```

<br />

---

<br />

## 실시간 대시보드

`npx create-claude-pipeline` 실행 시 자동으로 열리는 **Next.js 기반 모니터링 대시보드**입니다.

<table>
  <tr>
    <td width="50%">
      <strong>파이프라인 추적</strong><br />
      <sub>진행 중/완료된 파이프라인 목록 표시<br />Phase별 진행률 시각화</sub>
    </td>
    <td width="50%">
      <strong>실시간 모니터링</strong><br />
      <sub>WebSocket으로 Agent 활동 실시간 확인<br />작업 로그 스트리밍</sub>
    </td>
  </tr>
  <tr>
    <td>
      <strong>Agent 상태 보드</strong><br />
      <sub>9개 Agent의 대기/작업중/완료 상태<br />Agent 간 메시지 추적</sub>
    </td>
    <td>
      <strong>산출물 뷰어</strong><br />
      <sub>기획서, API 명세 등 마크다운 렌더링<br />체크포인트 승인/거절 인터페이스</sub>
    </td>
  </tr>
</table>

<br />

---

<br />

## 기존 프로젝트와의 호환

이미 `CLAUDE.md`나 `.claude/settings.json`이 있는 프로젝트에서도 안전하게 사용할 수 있습니다.

| 파일 | 동작 |
|------|------|
| `CLAUDE.md` | 기존 내용 보존 + 파이프라인 섹션을 끝에 추가 |
| `settings.json` | 기존 설정 유지 + 새 설정만 병합 |
| `agents/` `skills/` | 동일 이름 파일 → 건너뜀, 없는 것만 추가 |

<br />

---

<br />

## 핵심 원칙

<table>
  <tr>
    <td align="center" width="14%">
      <h3>🚦</h3>
      <strong>체크포인트 필수</strong><br />
      <sub>모든 Phase 전환 시<br />사용자 승인 필요</sub>
    </td>
    <td align="center" width="14%">
      <h3>📋</h3>
      <strong>컨텍스트 자족</strong><br />
      <sub>Agent는 자신의<br />Task 파일 하나로 충분</sub>
    </td>
    <td align="center" width="14%">
      <h3>⚡</h3>
      <strong>병렬 우선</strong><br />
      <sub>독립 작업은<br />항상 동시 실행</sub>
    </td>
    <td align="center" width="14%">
      <h3>💬</h3>
      <strong>직접 소통</strong><br />
      <sub>Agent 간 이슈는<br />직접 전달</sub>
    </td>
    <td align="center" width="14%">
      <h3>📦</h3>
      <strong>산출물 누적</strong><br />
      <sub>context/ 폴더에<br />번호순 히스토리</sub>
    </td>
    <td align="center" width="14%">
      <h3>🔒</h3>
      <strong>사람이 배포</strong><br />
      <sub>최종 승인 후에만<br />배포 실행</sub>
    </td>
    <td align="center" width="14%">
      <h3>❓</h3>
      <strong>모호하면 질문</strong><br />
      <sub>임의 가정 없이<br />사용자에게 확인</sub>
    </td>
  </tr>
</table>

<br />

---

<br />

## 프로젝트 구조

```
claude-guide/
├── CLAUDE.md                         # 파이프라인 가이드 (마스터)
├── references/                       # 참조 문서
│   ├── context-structure.md          #   context/ 디렉토리 구조 규칙
│   ├── task-context-template.md      #   04_task_*.md 작성 템플릿
│   └── pm-context-assembly.md        #   PM의 Task Context 조립 절차
│
├── create-claude-pipeline/           # npm 패키지
│   ├── src/                          #   TypeScript 소스
│   ├── bin/cli.js                    #   CLI 엔트리포인트
│   ├── template/                     #   설치 대상 파일들
│   │   ├── CLAUDE.md                 #     파이프라인 가이드
│   │   ├── references/               #     참조 문서 3개
│   │   ├── .claude/agents/           #     Agent 정의 8개
│   │   ├── .claude/skills/           #     Skill 정의 21개
│   │   ├── .claude/settings.json     #     Claude Code 설정
│   │   └── .claude-pipeline/         #     Next.js 대시보드
│   └── package.json
│
└── .claude/                          # 로컬 개발용
    ├── agents/                       #   Agent 정의
    ├── skills/                       #   Skill 정의
    └── settings.json                 #   설정
```

<br />

---

<br />

## 사전 요구사항

| 요구사항 | 버전 | 비고 |
|----------|------|------|
| **Node.js** | >= 18 | `node --version`으로 확인 |
| **Claude Code CLI** | latest | `npm i -g @anthropic-ai/claude-code` |
| **superpowers 플러그인** | latest | `claude plugin add superpowers` |

<br />

---

<br />

## 기술 스택

<p>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/tsup-FFC107?style=flat-square" />
</p>

| 영역 | 기술 |
|------|------|
| **CLI 패키지** | TypeScript, tsup, chalk, ora, fs-extra |
| **대시보드** | Next.js 14, React, Tailwind CSS, WebSocket |
| **Agent 정의** | YAML frontmatter + Markdown |
| **Skill 정의** | YAML frontmatter + Markdown |

<br />

---

<br />

## License

MIT

<br />

<div align="center">
  <sub>Built with <a href="https://claude.ai/claude-code">Claude Code</a></sub>
</div>

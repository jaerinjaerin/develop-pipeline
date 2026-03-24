# create-claude-pipeline

Claude Code 파이프라인 시스템을 프로젝트에 설치하고 실시간 모니터링 대시보드를 실행합니다.

![Dashboard Screenshot](https://raw.githubusercontent.com/jaerinjaerin/claude-guide/main/create-claude-pipeline/screenshots/dashboard.png)

## Quick Start

```bash
npx create-claude-pipeline
```

이 한 줄이면 끝입니다. 현재 디렉토리에 파이프라인 시스템이 설치되고 대시보드가 자동으로 열립니다.

## What It Does

### 최초 실행

```
$ npx create-claude-pipeline

  🚀 Claude Pipeline 설치 중...

  [1/6] 파일 복사 중...
        ✓ .claude/agents/ (8개 복사, 0개 건너뜀)
        ✓ .claude/skills/ (21개 폴더 복사, 0개 건너뜀)
        ✓ references/ (3개 복사, 0개 건너뜀)
  [2/6] CLAUDE.md 병합 중...
        ✓ CLAUDE.md 생성
  [3/6] .claude/settings.json 병합 중...
        ✓ settings.json 생성
  [4/6] .gitignore 업데이트 중...
        ✓ .gitignore에 3개 항목 추가
  [5/6] 대시보드 설치 중...
        ✓ npm install 완료
  [6/6] 대시보드 실행 중...

  ✅ 완료! 대시보드: http://localhost:3000
     종료: Ctrl+C
```

### 재실행 (이미 설치된 프로젝트)

```
$ npx create-claude-pipeline

  ✓ 이미 설치됨 — 대시보드만 실행합니다

  ✅ 완료! 대시보드: http://localhost:3000
     종료: Ctrl+C
```

## 설치되는 것들

```
my-project/
├── .claude/
│   ├── agents/          # 9개 AI Agent 정의 (PM, 기획, 디자인, FE, BE, Infra, QA, 보안, 리뷰)
│   ├── skills/          # 21개 Skill (기획서 작성, API 구현, 테스트 등)
│   └── settings.json    # Claude Code 설정
├── .claude-pipeline/
│   └── dashboard/       # 실시간 모니터링 대시보드 (Next.js)
├── references/          # 파이프라인 참조 문서
├── pipelines/           # 파이프라인 실행 데이터 (자동 생성)
├── CLAUDE.md            # 파이프라인 가이드 (기존 파일에 병합됨)
└── .gitignore           # 파이프라인 항목 자동 추가
```

## 파이프라인 구조

5단계 파이프라인으로 기능 요청을 처리합니다:

| Phase | Agent | 역할 |
|-------|-------|------|
| 0. 인풋 | PM (Alex) | 요구사항 분석, 작업 범위 결정 |
| 1. 기획 | 기획자 (Mina) | 기능 명세, 화면 목록, API 초안 |
| 2. 설계 | 디자이너 (Lena) + BE (Sam) | UI 명세 + API/DB 설계 (병렬) |
| 3. 구현 | FE (Jay) + BE (Sam) + Infra (Dex) | 컴포넌트, API, 인프라 구현 |
| 4. QA | QA (Eva) + 보안 (Rex) + 리뷰 (Nora) | 테스트, 보안 검토, 코드 리뷰 |

각 Phase 사이에 체크포인트가 있어 사용자 승인 후 다음 단계로 진행합니다.

## 대시보드 기능

- **파이프라인 목록**: 진행 중인/완료된 파이프라인을 한눈에 확인
- **실시간 모니터링**: WebSocket으로 Agent 활동을 실시간 확인
- **Agent 상태**: 9개 Agent의 작업 상태 (대기/작업중/완료) 표시
- **산출물 뷰어**: 기획서, 디자인 명세, API 명세 등을 마크다운으로 렌더링
- **체크포인트 승인**: 대시보드에서 직접 Phase 전환 승인/거절

## 기존 프로젝트와의 호환

이미 `CLAUDE.md`나 `.claude/settings.json`이 있는 프로젝트에서도 안전하게 사용할 수 있습니다:

- **CLAUDE.md**: 기존 내용을 보존하고 파이프라인 섹션을 끝에 추가
- **settings.json**: 기존 설정을 유지하고 새 설정만 병합
- **agents/skills**: 동일 이름 파일이 있으면 건너뛰고 없는 것만 추가

## 사전 요구사항

- **Node.js 18+**
- **Claude Code CLI** (`claude` 명령어가 설치되어 있어야 파이프라인 실행 가능)
- **superpowers 플러그인**: `claude plugin add superpowers`

## Options

```
npx create-claude-pipeline --help     # 사용법 안내
npx create-claude-pipeline --version  # 버전 확인
```

## License

MIT

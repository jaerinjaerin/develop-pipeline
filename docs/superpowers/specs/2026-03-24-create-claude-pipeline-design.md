# create-claude-pipeline 설계 문서

## 개요

`npx create-claude-pipeline` 명령어로 Claude Code 파이프라인 시스템(CLAUDE.md, agents, skills, references, 대시보드)을 사용자 프로젝트에 한번에 설치하고, 대시보드를 자동 실행하는 CLI 패키지.

**핵심 동작:**
- 최초 실행: 전체 파이프라인 시스템 설치 + 대시보드 실행
- 재실행: 이미 설치된 걸 감지하고 대시보드만 실행

---

## 패키지 구조

### npm 패키지 (`create-claude-pipeline`)

```
create-claude-pipeline/
├── package.json
├── bin/
│   └── cli.js                # 진입점 (#!/usr/bin/env node)
├── src/
│   ├── index.ts              # 메인 로직 오케스트레이터
│   ├── copy-template.ts      # 템플릿 파일 복사
│   ├── merge-claude-md.ts    # CLAUDE.md 병합 로직
│   ├── merge-settings.ts     # .claude/settings.json 병합
│   ├── install.ts            # npm install 실행
│   └── start-dashboard.ts    # 대시보드 실행 + 브라우저 열기
└── template/                 # 사용자 프로젝트에 복사될 파일들
    ├── .claude/
    │   ├── agents/           # 8개 agent .md 파일 (pm, planner, designer, fe/be/infra-developer, qa-engineer, security-reviewer)
    │   ├── skills/           # 21개 skill 폴더
    │   └── settings.json
    ├── .claude-pipeline/
    │   └── dashboard/        # Next.js 대시보드 전체
    ├── references/           # 참조 문서
    └── CLAUDE.md             # 파이프라인 가이드
```

### 사용자 프로젝트 설치 후

```
my-project/
├── .claude/                  # ← 병합됨
│   ├── agents/
│   ├── skills/
│   └── settings.json
├── .claude-pipeline/         # ← 새로 생성
│   └── dashboard/            # Next.js 앱
├── references/               # ← 복사됨
├── CLAUDE.md                 # ← 병합됨
├── package.json              # 사용자 기존 파일 (건드리지 않음)
└── ...
```

---

## 실행 흐름

### 최초 설치

```
$ npx create-claude-pipeline

  🚀 Claude Pipeline 설치 중...

  [1/6] 파일 복사 중...
        ✓ .claude/agents/ (8개 파일)
        ✓ .claude/skills/ (21개 폴더)
        ✓ references/ (3개 파일)

  [2/6] CLAUDE.md 병합 중...
        ✓ 기존 CLAUDE.md 발견 → 파이프라인 섹션 추가
        (또는)
        ✓ CLAUDE.md 생성

  [3/6] .claude/settings.json 병합 중...
        ✓ 기존 settings.json 발견 → 파이프라인 설정 병합
        (또는)
        ✓ settings.json 생성

  [4/6] .gitignore 업데이트 중...
        ✓ .gitignore에 파이프라인 항목 추가

  [5/6] 대시보드 설치 중...
        ✓ .claude-pipeline/dashboard/ 생성
        ✓ npm install 완료

  [6/6] 대시보드 실행 중...
        ✓ http://localhost:3000 에서 실행 중
        ✓ 브라우저 열림

  ✅ 완료! 대시보드: http://localhost:3000
     종료: Ctrl+C
```

### 재실행

```
$ npx create-claude-pipeline

  ✓ 이미 설치됨 — 대시보드만 실행합니다
  ✓ http://localhost:3000 에서 실행 중
```

**감지 기준:** `.claude-pipeline/dashboard/package.json` 존재 여부

---

## 병합 로직

### CLAUDE.md 병합

- 마커 주석 `<!-- claude-pipeline-start -->` / `<!-- claude-pipeline-end -->` 쌍으로 파이프라인 섹션을 감싸서 중복 감지
- 기존 CLAUDE.md가 있으면: 파일 끝에 `---` 구분선 + 파이프라인 섹션 추가
- 기존 CLAUDE.md에 이미 마커가 있으면: 건너뜀
- 기존 CLAUDE.md가 없으면: 템플릿 파일 그대로 복사

### settings.json 병합

- 기존 키 보존, 새 키만 추가
- agents/skills 등 배열 타입 값은 기존 + 새 항목 합침 (중복 제거)
- 기존 파일이 없으면: 템플릿 파일 그대로 복사

### .claude/agents/, skills/, references/ 복사

- 동일 이름 파일이 이미 존재하면: 건너뜀
- 없는 파일만 복사

---

## .gitignore 자동 추가

설치 시 사용자 프로젝트의 `.gitignore`에 다음 항목을 추가 (이미 있으면 건너뜀):

```
.claude-pipeline/dashboard/node_modules/
.claude-pipeline/dashboard/.next/
pipelines/
```

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| npm install 실패 | 에러 메시지 출력 + 수동 설치 안내 (`cd .claude-pipeline/dashboard && npm install`) |
| 포트 3000 사용 중 | 자동으로 다음 포트 시도 (3001, 3002...) |
| Node.js 버전 미달 | 최소 요구 버전(18+) 안내 후 종료 |
| Ctrl+C (SIGINT) | 대시보드 자식 프로세스 종료 후 CLI 종료 |

---

## CLI 플래그

| 플래그 | 설명 |
|--------|------|
| `--help` | 사용법 안내 출력 |
| `--version` | 패키지 버전 출력 |

---

## 기술 스택

### CLI 의존성

```
dependencies:
  fs-extra          # 파일 복사/병합 유틸
  chalk             # 터미널 색상 출력
  ora               # 스피너 애니메이션
  open              # 브라우저 자동 열기
  detect-port       # 사용 가능한 포트 찾기

devDependencies:
  typescript
  tsup              # CLI 번들링
```

### 대시보드 (변경 사항)

| 항목 | 현재 | 변경 |
|------|------|------|
| 위치 | `dashboard/` | `template/.claude-pipeline/dashboard/` |
| PIPELINES_DIR | 상대경로 `../pipelines/` (process.cwd 기준) | CLI가 절대경로로 환경변수 주입 (`join(cwd, 'pipelines')`) |
| 포트 | 하드코딩 3000 | 환경변수 + detect-port |
| pipelines.ts 기본값 | `path.join(process.cwd(), '..', 'pipelines')` | `process.env.PIPELINES_DIR` 우선, 폴백 제거 |
| 실행 방식 | `tsx server.ts` (커스텀 서버 + WebSocket) | 동일 — 커스텀 서버 유지 필수 |

**주의:** 대시보드는 커스텀 서버(`server.ts`)와 WebSocket(`ws`)을 사용하므로, `npm run dev` = `tsx server.ts`가 유지되어야 한다. `pipelines.ts`의 `PIPELINES_DIR` 기본값 폴백은 CLI가 항상 절대경로를 환경변수로 주입하므로 삭제하거나, 안전한 기본값(`process.cwd()`)으로 변경한다.

### package.json (npm 배포용)

```json
{
  "name": "create-claude-pipeline",
  "version": "0.1.0",
  "bin": {
    "create-claude-pipeline": "./bin/cli.js"
  },
  "files": ["bin/", "template/"],
  "engines": {
    "node": ">=18"
  }
}
```

---

## CLI 메인 로직

```typescript
async function main() {
  const cwd = process.cwd()
  const isInstalled = existsSync(join(cwd, '.claude-pipeline/dashboard/package.json'))

  if (isInstalled) {
    log('✓ 이미 설치됨 — 대시보드만 실행합니다')
    await startDashboard(cwd)
    return
  }

  // Step 1: 템플릿 파일 복사
  await copyTemplateFiles(cwd)

  // Step 2: CLAUDE.md 병합
  await mergeCLAUDEmd(cwd)

  // Step 3: settings.json 병합
  await mergeSettingsJson(cwd)

  // Step 4: .gitignore 업데이트
  await updateGitignore(cwd)

  // Step 5: 대시보드 npm install
  await npmInstall(join(cwd, '.claude-pipeline/dashboard'))

  // Step 6: 대시보드 실행
  await startDashboard(cwd)
}

async function startDashboard(cwd: string) {
  const port = await detectPort(3000)
  const child = spawn('npm', ['run', 'dev'], {
    cwd: join(cwd, '.claude-pipeline/dashboard'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      PIPELINES_DIR: join(cwd, 'pipelines')
    }
  })

  // Ctrl+C 시 자식 프로세스 정리 후 종료
  process.on('SIGINT', () => {
    child.kill('SIGINT')
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    child.kill('SIGTERM')
    process.exit(0)
  })

  await open(`http://localhost:${port}`)
  log(`✅ 대시보드: http://localhost:${port}`)
  log(`   종료: Ctrl+C`)
}
```

---

## 결정 사항 요약

| 항목 | 결정 |
|------|------|
| 패키지 이름 | `create-claude-pipeline` |
| 설치 범위 | 전체 (CLAUDE.md + agents + skills + references + dashboard) |
| 대시보드 위치 | `.claude-pipeline/dashboard/` (프로젝트 내부 숨김 폴더) |
| 설치 후 동작 | 대시보드 자동 실행 + 브라우저 열기 |
| 재실행 | 같은 명령어 (`npx create-claude-pipeline`) → 대시보드만 실행 |
| 기존 파일 충돌 | 병합 (기존 내용 보존 + 파이프라인 설정 추가) |
| 인터랙티브 프롬프트 | 없음 (현재 디렉토리에 바로 설치) |
| 아키텍처 | 단일 npm 패키지 (CLI + 템플릿 번들) |

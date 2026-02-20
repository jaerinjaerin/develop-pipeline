---
description: Commit convention에 따라 변경사항을 분석하고 커밋합니다
argument-hint: (선택) 추가 커밋 메시지 컨텍스트 (예: "배포 설정 관련", "버그 수정")
---

## 커밋 컨벤션

아래 Conventional Commits 규칙에 따라 커밋 메시지를 작성합니다.

### 형식

```
<type>(<scope>): <subject>

<body>      ← 선택 (변경 사항이 복잡할 때)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Type (영어)

| Type | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경만 (코드 변경 없음) |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `style` | 포맷팅, 세미콜론 등 코드 의미 변경 없음 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 의존성 등 유지보수 |
| `ci` | CI/CD 파이프라인 변경 |

### Scope (영어, 소문자)

변경 대상에 따라 선택:

| Scope | 대상 |
|---|---|
| `orchestrator` | 루트 CLAUDE.md (Orchestrator 흐름) |
| `agent-01` ~ `agent-08` | 개별 Agent 정의 파일 |
| `pipeline` | 파이프라인 인프라 (init-project.sh, templates 등) |
| `skills` | 스킬 파일 (notion_logger, manage-skills 등) |
| `commands` | 커맨드 파일 |
| `deploy` | 배포 설정 (Dockerfile, docker-compose 등) |
| `docs` | 문서 (docs/ 하위) |
| `fe` | 프론트엔드 코드 |
| `be` | 백엔드 코드 |
| `qa` | QA/테스트 관련 |
| `hooks` | Git/Claude hooks |

복수 scope 시: `agent-08,pipeline` 또는 가장 대표적인 하나만 사용.

### Subject (한국어)

- 50자 이내
- 마침표 없음
- 명령형: "추가", "수정", "제거", "개선", "리팩토링"
- "~함", "~했음" 대신 "~추가", "~수정" 형태

### Body (한국어, 선택)

- 72자 줄바꿈
- **왜** 변경했는지 설명 (what보다 why 중심)
- 복수 파일 변경 시 주요 변경 요약

### 예시

```
feat(agent-08): 배포 자동화 Agent 추가

Docker 기반 Staging 자동 배포 + Production 승인 배포.
롤백 3회 실패 시 에스컬레이션 패턴 준수.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
fix(be): 로그인 엔드포인트 500 에러 수정

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
docs(orchestrator): Phase 6 배포 흐름 추가

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
chore(pipeline): init-project.sh에 deploy 설정 파일 생성 추가

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## 실행 절차

아래 순서대로 실행합니다.

1. `git status`로 변경 파일 확인 (절대 -uall 플래그 사용 금지)
2. `git diff`로 staged/unstaged 변경 내용 확인
3. `git log --oneline -5`로 최근 커밋 스타일 확인
4. 변경 내용을 분석하여:
   - 적절한 **type** 결정
   - 변경된 파일 경로에서 **scope** 결정
   - 변경의 핵심을 **subject**로 요약 (한국어)
   - 복잡한 변경이면 **body** 추가 (한국어, why 중심)
5. `.env`, credentials 등 민감 파일이 포함되어 있으면 경고 후 제외
6. 관련 파일을 staging하고 커밋 실행

사용자가 추가 컨텍스트를 제공한 경우: $ARGUMENTS

### 주의사항

- 항상 새 커밋 생성 (amend 금지, 사용자가 명시적으로 요청한 경우 제외)
- pre-commit hook 실패 시: 문제 수정 후 새 커밋 생성
- 빈 변경사항이면 커밋하지 않고 알림
- `git add .`이나 `git add -A` 대신 파일명을 명시적으로 지정
- 커밋 메시지는 반드시 HEREDOC으로 전달

# Agent 03 — Frontend Agent (Generic)

## 역할

API 명세를 계약서로 삼아 컴포넌트 및 페이지 UI를 구현합니다.
프로젝트의 기술 스택에 따라 해당 스택 가이드라인을 참조합니다.

## 스택 가이드라인 참조 방식

1. 프로젝트 `CLAUDE.md`에서 `fe_stack` 값 확인
2. `pipeline/stacks/{fe_stack}/frontend-guidelines.md` 참조
3. 해당 가이드라인에 따라 코드 작성

> 예: fe_stack이 `nextjs`이면 → `pipeline/stacks/nextjs/frontend-guidelines.md`를 참조

## 입력

- 할당된 FE 이슈 (GitHub)
- `docs/화면명세서.md` — UI 레이아웃, 컴포넌트 구조
- `docs/API명세초안.md` — API 호출 인터페이스
- Mermaid 다이어그램 — 시퀀스(통신 순서), 상태(UI 상태)

## 출력

- 컴포넌트 코드 (프로젝트 `frontend/` 디렉토리)
- 페이지 코드
- API 호출 코드 (초기에는 Mock, 연동 단계에서 실제 API)
- PR 생성

## 실행 절차

### Wave 기반 개발

1. Orchestrator로부터 `blocked by`가 없는 FE 이슈를 할당받음
2. 이슈의 Acceptance Criteria를 읽고 구현 시작
3. **스택 가이드라인**을 참조하여 코드 작성
4. 컴포넌트/페이지 구현 완료 → PR 생성 → GitHub 이슈 close
5. 다음 Wave 이슈 자동 할당 (의존성 해제된 이슈)

### API 연동 (Wave 3)

1. FE + BE 모든 이슈 완료 후 연동 단계 진입
2. Mock 데이터를 실제 API 호출로 교체
3. 통합 테스트 후 최종 PR 생성

## 코드 작성 규칙

- 화면명세서의 레이아웃, 반응형 스펙 준수
- API명세의 요청/응답 구조를 타입으로 정의
- 상태 다이어그램의 모든 상태(idle, loading, success, error) 처리
- 시퀀스 다이어그램의 통신 순서 준수
- 에러 UI는 기능명세서에 정의된 에러 시나리오와 일치

## 사용 MCP

- `File System MCP` — 코드 파일 읽기/쓰기
- `GitHub MCP` — PR 생성, 이슈 상태 관리

## 다음 단계

FE + BE 모든 이슈 완료 → API 연동 → Agent 05 (QA) 실행

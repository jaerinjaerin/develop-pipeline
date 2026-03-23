# PM 컨텍스트 조립 가이드

PM Agent의 핵심 역할 중 하나는 각 Phase 산출물을 누적 조합하여 실행 Agent용 Task Context를 생성하는 것이다.

## 조립 흐름

```
00_requirements.md (Phase 0 산출물)
      +
01_plan.md (Phase 1 기획자 산출물)
      +
02_design_spec.md (Phase 2 디자이너 산출물)
      +
03_api_spec.md (Phase 2 BE 설계 산출물)
      ↓
PM이 합쳐서 → 04_task_FE.md 생성
              04_task_BE.md 생성
              04_task_INFRA.md 생성
              04_task_QA.md 생성
```

## 조립 절차

1. `00_requirements.md`에서 프로젝트 현황과 요구사항을 추출 → Section 1, 2에 배치
2. `01_plan.md`에서 기획안 내용을 추출 → Section 3에 배치
3. Agent 역할에 맞는 작업 지시를 작성 → Section 4에 배치
4. `02_design_spec.md`, `03_api_spec.md` 등에서 해당 Agent에 필요한 참고 자료를 선별 → Section 5에 배치

## 조립 규칙

- **Section 1~3은 복사**: 모든 `04_task_*.md`에 동일하게 들어간다.
- **Section 4~5는 맞춤 작성**: Agent의 역할과 필요한 참고 자료에 따라 다르게 작성한다.
- **자족성 보장**: 각 Agent가 자신의 파일 하나만 읽으면 작업에 필요한 모든 정보가 포함되어야 한다. 외부 파일을 추가로 읽어야 하는 상황을 만들지 않는다.
- **참고 자료 선별**: FE Agent에게 ERD 전체를 줄 필요는 없다. 각 Agent에게 실제로 필요한 부분만 포함한다.

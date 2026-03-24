# 컨텍스트 파일 구조

## 디렉토리 레이아웃

```
project/
├── context/
│   ├── 00_requirements.md     ← 원본 요구사항 (Phase 0 산출물)
│   ├── 01_plan.md             ← 기획자 산출물 (Phase 1, 체크포인트 2 승인 후 확정)
│   ├── 02_design_spec.md      ← 디자이너 산출물 (Phase 2, 체크포인트 3 승인 후 확정)
│   ├── 03_api_spec.md         ← BE 설계 산출물 (Phase 2, 체크포인트 3 승인 후 확정)
│   ├── 04_task_FE.md          ← FE Agent용 최종 컨텍스트
│   ├── 04_task_BE.md          ← BE Agent용 최종 컨텍스트
│   ├── 04_task_INFRA.md       ← Infra Agent용 최종 컨텍스트
│   └── 04_task_QA.md          ← QA Agent용 최종 컨텍스트
└── reports/
    └── *.html                  ← 사람이 보는 버전 (context/ 파일에서 자동 변환)
```

## 파일 번호 규칙

| 번호 | Phase | 파일 | 확정 시점 |
|------|-------|------|-----------|
| 00 | Phase 0 | `00_requirements.md` | 체크포인트 1 승인 후 |
| 01 | Phase 1 | `01_plan.md` | 체크포인트 2 승인 후 |
| 02 | Phase 2 | `02_design_spec.md` | 체크포인트 3 승인 후 |
| 03 | Phase 2 | `03_api_spec.md` | 체크포인트 3 승인 후 |
| 04 | Phase 3~4 | `04_task_*.md` | PM이 조립 후 배포 |

## 핵심 규칙

- 체크포인트마다 `context/` 파일이 누적되어 히스토리가 보존된다.
- 각 Agent는 자신의 `04_task_*.md` 하나만 읽으면 필요한 컨텍스트가 전부 포함되어 있다.
- 사람은 `reports/` 폴더의 HTML을 통해 검토한다.

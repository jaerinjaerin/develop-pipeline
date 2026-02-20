# Notion Logger — 파이프라인 로그 기록 스킬

## 역할

파이프라인 실행 결과(QA 성공/실패, 배포 결과)를 Notion PIPELINE_LOG 페이지에 기록합니다.
Agent 06(에러 문서화), Agent 07(성공 로그), Agent 08(배포)이 공통으로 사용하는 Notion 쓰기 스킬입니다.

---

## 참조 정보

| 항목 | 값 |
|---|---|
| PIPELINE_LOG Page ID | `30db717d-4315-8099-b939-e6a70d60d428` |
| Pipeline Runs DB ID | `{CLAUDE.md에서 참조 — 최초 실행 시 수동 생성 후 기입}` |

---

## 사전 조건 확인

### 1. Notion MCP 연결 확인

```
실행 전 반드시 확인:
1. Notion MCP가 연결되어 있는지 확인
2. 미연결 시:
   ⚠️ "Notion MCP 미연결 — 로컬 docs/ 기록으로 전환합니다."
   → 파이프라인 중단 없이 로컬 전용 모드로 계속 진행
3. 연결 확인 후 → 다음 단계 진행
```

### 2. Pipeline Runs DB ID 확인

```
Pipeline Runs DB ID가 설정되어 있는지 확인:
- 미설정 시:
  ℹ️ "Pipeline Runs DB가 아직 생성되지 않았습니다.
      PIPELINE_LOG 페이지에서 인라인 데이터베이스를 수동 생성 후
      DB ID를 CLAUDE.md의 'Pipeline Runs DB ID'에 기입해주세요."
  → 페이지 생성은 가능, DB 행 추가는 건너뜀
```

---

## 쓰기 프로토콜 (2단계)

### 단계 1: PIPELINE_LOG 하위에 결과 페이지 생성

`mcp__notion__API-post-page` 사용:

```json
{
  "parent": {
    "page_id": "30db717d-4315-8099-b939-e6a70d60d428"
  },
  "properties": {
    "title": [
      {
        "text": {
          "content": "{날짜} {프로젝트} {페이지} — {PASSED|FAILED|ESCALATED}"
        }
      }
    ]
  }
}
```

### 단계 2: 페이지에 상세 내용 블록 추가

`mcp__notion__API-patch-block-children` 사용:

생성된 페이지 ID를 `block_id`로 지정하여 상세 블록 추가.

#### 성공(PASSED) 페이지 블록 구성

```json
{
  "children": [
    {
      "heading_2": { "rich_text": [{ "text": { "content": "성공 요약" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "프로젝트: {프로젝트명}\n페이지: {페이지명}\n실행일: {날짜}\n소요 시간: {N}분\nTC 전체: {N}건 / 통과: {N}건" } }]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "TC별 결과 테이블" } }] }
    },
    {
      "table": {
        "table_width": 5,
        "has_column_header": true,
        "children": [
          {
            "table_row": {
              "cells": [
                [{ "text": { "content": "TC" } }],
                [{ "text": { "content": "시나리오" } }],
                [{ "text": { "content": "결과" } }],
                [{ "text": { "content": "주요 API" } }],
                [{ "text": { "content": "응답시간" } }]
              ]
            }
          }
        ]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "Baseline 기준값" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "{baseline.json 주요 수치 요약}" } }]
      }
    }
  ]
}
```

#### 실패(FAILED) 페이지 블록 구성

```json
{
  "children": [
    {
      "heading_2": { "rich_text": [{ "text": { "content": "실패 요약" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "프로젝트: {프로젝트명}\n페이지: {페이지명}\n실행일: {날짜}\nTC 전체: {N}건 / 통과: {N}건 / 실패: {N}건\n원인 판단: {FE|BE|FE+BE}\n재시도 횟수: {N}회차" } }]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "TC별 결과 테이블" } }] }
    },
    {
      "table": {
        "table_width": 5,
        "has_column_header": true,
        "children": [
          {
            "table_row": {
              "cells": [
                [{ "text": { "content": "TC" } }],
                [{ "text": { "content": "시나리오" } }],
                [{ "text": { "content": "결과" } }],
                [{ "text": { "content": "원인" } }],
                [{ "text": { "content": "에러 상세" } }]
              ]
            }
          }
        ]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "에러 상세" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "{CDP 수집 데이터 요약: Network, Console, Screenshot 경로}" } }]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "시도 이력" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "{각 회차별 수정 내용 기록}" } }]
      }
    }
  ]
}
```

#### 배포(DEPLOYED) 페이지 블록 구성

```json
{
  "children": [
    {
      "heading_2": { "rich_text": [{ "text": { "content": "배포 요약" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "프로젝트: {프로젝트명}\n환경: {Staging|Production}\n실행일: {날짜}\n빌드 태그: {태그}\n소요 시간: {N}분" } }]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "빌드 결과" } }] }
    },
    {
      "table": {
        "table_width": 3,
        "has_column_header": true,
        "children": [
          {
            "table_row": {
              "cells": [
                [{ "text": { "content": "이미지" } }],
                [{ "text": { "content": "태그" } }],
                [{ "text": { "content": "결과" } }]
              ]
            }
          }
        ]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "Health Check 결과" } }] }
    },
    {
      "table": {
        "table_width": 4,
        "has_column_header": true,
        "children": [
          {
            "table_row": {
              "cells": [
                [{ "text": { "content": "서비스" } }],
                [{ "text": { "content": "URL" } }],
                [{ "text": { "content": "상태코드" } }],
                [{ "text": { "content": "응답시간" } }]
              ]
            }
          }
        ]
      }
    },
    {
      "heading_2": { "rich_text": [{ "text": { "content": "환경 정보" } }] }
    },
    {
      "paragraph": {
        "rich_text": [{ "text": { "content": "Provider: {docker|vercel|aws-ecs|gcp-run}\nStaging URL: {URL}\nProduction URL: {URL}" } }]
      }
    }
  ]
}
```

### 단계 2-B: Pipeline Runs DB에 행 추가 (DB ID 설정 시)

`mcp__notion__API-post-page` 사용 (DB를 parent로 지정):

```json
{
  "parent": {
    "database_id": "{Pipeline Runs DB ID}"
  },
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "{날짜} {프로젝트} {페이지} — {결과}" } }]
    },
    "Project": { "select": { "name": "{프로젝트명}" } },
    "Phase": { "select": { "name": "{Phase 5|Phase 6}" } },
    "Status": { "select": { "name": "{Running|Passed|Failed|Escalated|Deployed|Deploy_Failed}" } },
    "Run Date": { "date": { "start": "{YYYY-MM-DD}" } },
    "Duration": { "number": "{소요 시간(분)}" },
    "TC Total": { "number": "{전체 TC 수}" },
    "TC Passed": { "number": "{통과 수}" },
    "TC Failed": { "number": "{실패 수}" },
    "Failure Round": { "number": "{재시도 횟수}" },
    "Root Cause": { "select": { "name": "{FE|BE|FE+BE|None}" } },
    "Escalated": { "checkbox": "{true|false}" },
    "Notes": {
      "rich_text": [{ "text": { "content": "{요약 메모}" } }]
    }
  }
}
```

---

## MCP 도구 매핑

| 작업 | MCP 도구 ID | 용도 |
|---|---|---|
| 페이지 생성 | `mcp__notion__API-post-page` | PIPELINE_LOG 하위에 결과 페이지 생성 |
| 블록 추가 | `mcp__notion__API-patch-block-children` | 페이지에 상세 내용(heading, table, paragraph) 추가 |
| 페이지 조회 | `mcp__notion__API-retrieve-a-page` | 기존 페이지 확인 |
| DB 조회 | `mcp__notion__API-query-data-source` | Pipeline Runs DB 기존 행 조회 |
| 페이지 수정 | `mcp__notion__API-patch-page` | 기존 DB 행 속성 업데이트 |

---

## Graceful Degradation

```
Notion MCP 미연결 시:
  1. ⚠️ 경고 출력: "Notion MCP 미연결 — 로컬 전용 모드"
  2. 로컬 docs/ 기록은 정상 진행
  3. 파이프라인 절대 중단 금지
  4. 다음 실행 시 Notion 연결되면 자동으로 Notion 기록 재개

Pipeline Runs DB ID 미설정 시:
  1. ℹ️ 안내 출력: DB 수동 생성 필요
  2. PIPELINE_LOG 하위 페이지 생성은 정상 진행
  3. DB 행 추가만 건너뜀
```

---

## Pipeline Runs DB 스키마

최초 실행 전 Notion에서 수동 생성이 필요한 인라인 데이터베이스 스키마:

| 속성 | 타입 | 용도 |
|---|---|---|
| Name | title | `{날짜} {프로젝트} {페이지} — {결과}` |
| Project | select | 프로젝트명 |
| Phase | select | Phase 1–6 |
| Status | select | Running / Passed / Failed / Escalated / Deployed / Deploy_Failed |
| Run Date | date | 실행일 |
| Duration | number | 소요 시간(분) |
| TC Total | number | 전체 테스트 시나리오 수 |
| TC Passed | number | 통과 수 |
| TC Failed | number | 실패 수 |
| Failure Round | number | 재시도 횟수 |
| Root Cause | select | FE / BE / FE+BE / None |
| Escalated | checkbox | 3회 이상 실패 시 true |
| Notes | rich_text | 요약 메모 |

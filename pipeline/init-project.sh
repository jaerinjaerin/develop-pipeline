#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# init-project.sh — 프로젝트 초기화 스크립트
#
# Usage:
#   ./pipeline/init-project.sh <project-name> <fe-stack> <be-stack>
#
# Example:
#   ./pipeline/init-project.sh shopping-mall nextjs fastapi
#   ./pipeline/init-project.sh blog-site react django
#
# 지원 스택:
#   사전 정의: nextjs, react (FE) / fastapi, django (BE)
#   그 외 스택도 지정 가능 — 가이드라인이 없으면 템플릿에서 자동 생성
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE_DIR="$ROOT_DIR/pipeline"
PROJECTS_DIR="$ROOT_DIR/projects"

# --- 인자 검증 ---
if [ $# -lt 3 ]; then
    echo "Usage: $0 <project-name> <fe-stack> <be-stack>"
    echo ""
    echo "  project-name  프로젝트 이름 (영문, 하이픈 허용)"
    echo "  fe-stack      Frontend 스택 (예: nextjs, react, vue, svelte ...)"
    echo "  be-stack      Backend 스택 (예: fastapi, django, nestjs, spring ...)"
    echo ""
    echo "Example:"
    echo "  $0 shopping-mall nextjs fastapi"
    exit 1
fi

PROJECT_NAME="$1"
FE_STACK="$2"
BE_STACK="$3"

# --- 스택 가이드라인 확인/생성 ---
FE_GUIDELINE="$PIPELINE_DIR/stacks/$FE_STACK/frontend-guidelines.md"
if [ ! -f "$FE_GUIDELINE" ]; then
    echo "  ℹ️  No guideline for '$FE_STACK'. Generating from template..."
    mkdir -p "$PIPELINE_DIR/stacks/$FE_STACK"
    sed "s|{{FE_STACK}}|$FE_STACK|g" "$PIPELINE_DIR/templates/frontend-guidelines.md.template" > "$FE_GUIDELINE"
fi

BE_GUIDELINE="$PIPELINE_DIR/stacks/$BE_STACK/backend-guidelines.md"
if [ ! -f "$BE_GUIDELINE" ]; then
    echo "  ℹ️  No guideline for '$BE_STACK'. Generating from template..."
    mkdir -p "$PIPELINE_DIR/stacks/$BE_STACK"
    sed "s|{{BE_STACK}}|$BE_STACK|g" "$PIPELINE_DIR/templates/backend-guidelines.md.template" > "$BE_GUIDELINE"
fi

# --- 프로젝트 중복 확인 ---
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
if [ -d "$PROJECT_DIR" ]; then
    echo "Error: Project '$PROJECT_NAME' already exists at $PROJECT_DIR"
    exit 1
fi

echo "=== Creating project: $PROJECT_NAME ==="
echo "  FE Stack: $FE_STACK"
echo "  BE Stack: $BE_STACK"
echo ""

# --- 1. 디렉토리 구조 생성 ---
echo "[1/9] Creating directory structure..."
mkdir -p "$PROJECT_DIR/.claude/agents"
mkdir -p "$PROJECT_DIR/.claude/skills"
mkdir -p "$PROJECT_DIR/.claude/commands"
mkdir -p "$PROJECT_DIR/.claude/hooks"
mkdir -p "$PROJECT_DIR/frontend"
mkdir -p "$PROJECT_DIR/backend"
mkdir -p "$PROJECT_DIR/deploy"
mkdir -p "$PROJECT_DIR/docs/errors"
mkdir -p "$PROJECT_DIR/docs/qa-logs"
mkdir -p "$PROJECT_DIR/docs/deploy-logs"
mkdir -p "$PROJECT_DIR/docs/pipeline-logs"
mkdir -p "$PROJECT_DIR/dev/active"

# --- 2. 에이전트 symlink 연결 (pipeline/agents/ 단일 소스) ---
echo "[2/9] Linking agents..."
AGENTS_SOURCE="$PIPELINE_DIR/agents"
AGENTS_TARGET="$PROJECT_DIR/.claude/agents"

for agent_file in "$AGENTS_SOURCE"/*.md; do
    filename="$(basename "$agent_file")"
    relative_path="$(realpath --relative-to="$AGENTS_TARGET" "$agent_file")"
    ln -s "$relative_path" "$AGENTS_TARGET/$filename"
    echo "  → $filename"
done

# --- 3. 스킬 symlink 연결 (pipeline/skills/ 단일 소스) ---
echo "[3/9] Linking skills..."
SKILLS_SOURCE="$PIPELINE_DIR/skills"
SKILLS_TARGET="$PROJECT_DIR/.claude/skills"

# 플랫 .md 파일
for skill_file in "$SKILLS_SOURCE"/*.md; do
    if [ -f "$skill_file" ]; then
        filename="$(basename "$skill_file")"
        relative_path="$(realpath --relative-to="$SKILLS_TARGET" "$skill_file")"
        ln -s "$relative_path" "$SKILLS_TARGET/$filename"
        echo "  → $filename"
    fi
done

# 디렉토리형 스킬
for skill_dir in "$SKILLS_SOURCE"/*/; do
    if [ -d "$skill_dir" ]; then
        dirname="$(basename "$skill_dir")"
        relative_path="$(realpath --relative-to="$SKILLS_TARGET" "$skill_dir")"
        ln -s "$relative_path" "$SKILLS_TARGET/$dirname"
        echo "  → $dirname/"
    fi
done

# skill-rules.json 복사 (프로젝트별로 독립적으로 수정 가능)
cp "$SKILLS_SOURCE/skill-rules.json" "$SKILLS_TARGET/skill-rules.json"
echo "  → skill-rules.json (copied)"

# --- 4. 스택 스킬 룰 주입 ---
echo "[4/9] Injecting stack-specific skill rules..."

# FE 스택 룰 주입
inject_fe_rule() {
    local stack="$1"
    local rules_file="$2"
    local tmp_file="${rules_file}.tmp"

    case "$stack" in
        nextjs)
            jq '.skills["nextjs-frontend-guidelines"] = {
                "type": "guardrail",
                "enforcement": "block",
                "priority": "high",
                "description": "Next.js App Router, React, TypeScript best practices",
                "promptTriggers": {
                    "keywords": ["component", "react", "UI", "page", "Next.js", "nextjs", "server component", "client component", "app router", "use client"],
                    "intentPatterns": ["(create|add|make|build|update).*?(component|UI|page|modal|form)", "(server|client).*?component"]
                },
                "fileTriggers": {
                    "pathPatterns": ["frontend/src/**/*.tsx", "frontend/src/**/*.ts"],
                    "pathExclusions": ["**/*.test.tsx", "**/*.spec.tsx"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → nextjs-frontend-guidelines rule injected"
            ;;
        react)
            jq '.skills["react-frontend-guidelines"] = {
                "type": "guardrail",
                "enforcement": "block",
                "priority": "high",
                "description": "React SPA, TypeScript best practices",
                "promptTriggers": {
                    "keywords": ["component", "react", "UI", "page", "hook", "state", "styling"],
                    "intentPatterns": ["(create|add|make|build|update).*?(component|UI|page|modal|form)"]
                },
                "fileTriggers": {
                    "pathPatterns": ["frontend/src/**/*.tsx", "frontend/src/**/*.ts"],
                    "pathExclusions": ["**/*.test.tsx", "**/*.spec.tsx"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → react-frontend-guidelines rule injected"
            ;;
        *)
            jq --arg stack "$stack" '.skills[$stack + "-frontend-guidelines"] = {
                "type": "guardrail",
                "enforcement": "suggest",
                "priority": "high",
                "description": ($stack + " frontend best practices"),
                "promptTriggers": {
                    "keywords": ["component", "UI", "page", "frontend", "styling"],
                    "intentPatterns": ["(create|add|make|build|update).*?(component|UI|page|modal|form)"]
                },
                "fileTriggers": {
                    "pathPatterns": ["frontend/src/**/*"],
                    "pathExclusions": ["**/*.test.*", "**/*.spec.*"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → $stack-frontend-guidelines rule injected (generic)"
            ;;
    esac
}

# BE 스택 룰 주입
inject_be_rule() {
    local stack="$1"
    local rules_file="$2"
    local tmp_file="${rules_file}.tmp"

    case "$stack" in
        fastapi)
            jq '.skills["fastapi-backend-guidelines"] = {
                "type": "domain",
                "enforcement": "suggest",
                "priority": "high",
                "description": "FastAPI async patterns, SQLModel/SQLAlchemy, domain-driven design",
                "promptTriggers": {
                    "keywords": ["backend", "fastapi", "endpoint", "API", "async", "SQLModel", "SQLAlchemy", "repository", "service", "router"],
                    "intentPatterns": ["(create|add|implement).*?(route|endpoint|API|service|repository)", "(async|await).*?(pattern|function)"]
                },
                "fileTriggers": {
                    "pathPatterns": ["backend/**/*.py"],
                    "pathExclusions": ["**/__pycache__/**", "**/test_*.py"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → fastapi-backend-guidelines rule injected"
            ;;
        django)
            jq '.skills["django-backend-guidelines"] = {
                "type": "domain",
                "enforcement": "suggest",
                "priority": "high",
                "description": "Django ORM, views, serializers, admin best practices",
                "promptTriggers": {
                    "keywords": ["backend", "django", "model", "view", "serializer", "admin", "migration", "queryset", "ORM"],
                    "intentPatterns": ["(create|add|implement).*?(model|view|serializer|admin|endpoint)", "(django|ORM).*?(pattern|query)"]
                },
                "fileTriggers": {
                    "pathPatterns": ["backend/**/*.py"],
                    "pathExclusions": ["**/__pycache__/**", "**/test_*.py"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → django-backend-guidelines rule injected"
            ;;
        *)
            jq --arg stack "$stack" '.skills[$stack + "-backend-guidelines"] = {
                "type": "domain",
                "enforcement": "suggest",
                "priority": "high",
                "description": ($stack + " backend best practices"),
                "promptTriggers": {
                    "keywords": ["backend", "endpoint", "API", "service", "model", "database"],
                    "intentPatterns": ["(create|add|implement).*?(route|endpoint|API|service|model)"]
                },
                "fileTriggers": {
                    "pathPatterns": ["backend/**/*"],
                    "pathExclusions": ["**/test_*", "**/*.test.*", "**/*.spec.*"]
                }
            }' "$rules_file" > "$tmp_file" && mv "$tmp_file" "$rules_file"
            echo "  → $stack-backend-guidelines rule injected (generic)"
            ;;
    esac
}

inject_fe_rule "$FE_STACK" "$SKILLS_TARGET/skill-rules.json"
inject_be_rule "$BE_STACK" "$SKILLS_TARGET/skill-rules.json"

# --- 5. Hooks 복사 및 설치 (pipeline/hooks/ 단일 소스) ---
echo "[5/9] Setting up hooks..."
HOOKS_SOURCE="$PIPELINE_DIR/hooks"
HOOKS_TARGET="$PROJECT_DIR/.claude/hooks"

# 모든 hook 파일 복사
cp "$HOOKS_SOURCE/skill-activation-prompt.sh" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/skill-activation-prompt.ts" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/post-tool-use-tracker.sh" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/tsc-check.sh" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/error-handling-reminder.sh" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/error-handling-reminder.ts" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/package.json" "$HOOKS_TARGET/"
cp "$HOOKS_SOURCE/tsconfig.json" "$HOOKS_TARGET/"

# 실행 권한 설정
chmod +x "$HOOKS_TARGET"/*.sh

# npm 의존성 설치
echo "  Installing hook dependencies..."
(cd "$HOOKS_TARGET" && npm install --silent 2>/dev/null) || echo "  ⚠️  npm install failed - run manually: cd $HOOKS_TARGET && npm install"

echo "  → Hooks installed"

# --- 6. Commands symlink 연결 (pipeline/commands/ 단일 소스) ---
echo "[6/9] Linking commands..."
COMMANDS_SOURCE="$PIPELINE_DIR/commands"
COMMANDS_TARGET="$PROJECT_DIR/.claude/commands"

for cmd_file in "$COMMANDS_SOURCE"/*.md; do
    if [ -f "$cmd_file" ]; then
        filename="$(basename "$cmd_file")"
        relative_path="$(realpath --relative-to="$COMMANDS_TARGET" "$cmd_file")"
        ln -s "$relative_path" "$COMMANDS_TARGET/$filename"
        echo "  → /$filename"
    fi
done

# --- 7. settings.json 생성 ---
echo "[7/9] Creating project settings.json..."
cat > "$PROJECT_DIR/.claude/settings.json" << 'SETTINGS_EOF'
{
  "enableAllProjectMcpServers": true,
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/tsc-check.sh"
          }
        ]
      }
    ]
  }
}
SETTINGS_EOF
echo "  → settings.json"

# --- 8. 프로젝트 CLAUDE.md 생성 ---
echo "[8/9] Generating project CLAUDE.md..."
TEMPLATE="$PIPELINE_DIR/templates/CLAUDE.md.template"

sed -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
    -e "s|{{FE_STACK}}|$FE_STACK|g" \
    -e "s|{{BE_STACK}}|$BE_STACK|g" \
    -e "s|{{GITHUB_OWNER}}|owner|g" \
    -e "s|{{DESCRIPTION}}|$PROJECT_NAME 프로젝트|g" \
    "$TEMPLATE" > "$PROJECT_DIR/CLAUDE.md"

# --- 9. Deploy 설정 파일 생성 ---
echo "[9/9] Creating deploy configuration..."

cat > "$PROJECT_DIR/deploy/Dockerfile.frontend" << 'DEPLOY_FE_EOF'
# Frontend Dockerfile
# 프로젝트 FE 스택에 맞게 수정하세요

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
DEPLOY_FE_EOF

cat > "$PROJECT_DIR/deploy/Dockerfile.backend" << 'DEPLOY_BE_EOF'
# Backend Dockerfile
# 프로젝트 BE 스택에 맞게 수정하세요

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
DEPLOY_BE_EOF

cat > "$PROJECT_DIR/deploy/docker-compose.yml" << DEPLOY_COMPOSE_EOF
version: "3.8"

services:
  frontend:
    build:
      context: ../frontend
      dockerfile: ../deploy/Dockerfile.frontend
    image: ${PROJECT_NAME}-frontend:\${TAG:-latest}
    ports:
      - "\${FE_PORT:-3000}:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
      - NEXT_PUBLIC_API_URL=\${API_URL:-http://backend:8000}
    depends_on:
      - backend
    profiles:
      - staging
      - production

  backend:
    build:
      context: ../backend
      dockerfile: ../deploy/Dockerfile.backend
    image: ${PROJECT_NAME}-backend:\${TAG:-latest}
    ports:
      - "\${BE_PORT:-8000}:8000"
    environment:
      - DATABASE_URL=\${DATABASE_URL:-sqlite:///./app.db}
      - ENVIRONMENT=\${ENVIRONMENT:-production}
    profiles:
      - staging
      - production

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=\${POSTGRES_DB:-app}
      - POSTGRES_USER=\${POSTGRES_USER:-app}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-changeme}
    volumes:
      - db_data:/var/lib/postgresql/data
    profiles:
      - staging
      - production

volumes:
  db_data:
DEPLOY_COMPOSE_EOF

cat > "$PROJECT_DIR/deploy/deploy-config.yml" << 'DEPLOY_CONFIG_EOF'
# 배포 설정 — Agent 08이 참조합니다
# provider를 변경하여 배포 대상을 확장할 수 있습니다

provider: docker  # docker | vercel | aws-ecs | gcp-run

staging:
  url: http://localhost:3000
  api_url: http://localhost:8000
  health_check:
    frontend: /
    backend: /health
  timeout: 30  # Health Check 타임아웃 (초)

production:
  url: https://example.com
  api_url: https://api.example.com
  health_check:
    frontend: /
    backend: /health
  timeout: 60
  requires_approval: true  # Production은 반드시 사람 승인 필요

rollback:
  max_retries: 3  # 롤백 최대 시도 횟수
  escalate_after: 3  # 이 횟수 이후 사람에게 에스컬레이션
DEPLOY_CONFIG_EOF

echo "  → Dockerfile.frontend"
echo "  → Dockerfile.backend"
echo "  → docker-compose.yml"
echo "  → deploy-config.yml"

# --- 완료 ---
echo ""
echo "=== Project created successfully ==="
echo ""
echo "  Location:    projects/$PROJECT_NAME/"
echo "  CLAUDE.md:   projects/$PROJECT_NAME/CLAUDE.md"
echo "  Agents:      projects/$PROJECT_NAME/.claude/agents/"
echo "  Skills:      projects/$PROJECT_NAME/.claude/skills/"
echo "  Commands:    projects/$PROJECT_NAME/.claude/commands/"
echo "  Hooks:       projects/$PROJECT_NAME/.claude/hooks/"
echo ""
echo "  Included infrastructure:"
echo "    Hooks:    skill-activation, post-tool-use-tracker, tsc-check, error-handling-reminder"
echo "    Agents:   planner, auto-error-resolver, code-architecture-reviewer, frontend-error-fixer"
echo "    Agents:   + pipeline agents (01~08)"
echo "    Deploy:   Dockerfile.frontend, Dockerfile.backend, docker-compose.yml, deploy-config.yml"
echo "    Commands: /dev-docs, /dev-docs-update, /pipeline-dashboard"
echo "    Skills:   skill-developer, verify-implementation, manage-skills, visualization-notion"
echo "    Rules:    skill-rules.json (with $FE_STACK + $BE_STACK rules injected)"
echo ""
echo "  Next steps:"
echo "    1. Edit projects/$PROJECT_NAME/CLAUDE.md to set GitHub owner and description"
echo "    2. cd projects/$PROJECT_NAME && claude"
echo "    3. Start the pipeline with Agent 01"

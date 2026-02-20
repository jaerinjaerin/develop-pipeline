#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# init-project.sh — 프로젝트 초기화 스크립트
#
# Usage:
#   ./pipeline/init-project.sh <project-name> <fe-stack> <be-stack>
#   ./pipeline/init-project.sh <project-name> <fe-stack> none    # 풀스택 모드
#
# Example:
#   ./pipeline/init-project.sh shopping-mall nextjs fastapi
#   ./pipeline/init-project.sh blog-site react django
#   ./pipeline/init-project.sh visit-gangnam nextjs none         # Next.js 풀스택
#
# 지원 스택:
#   사전 정의: nextjs, react (FE) / fastapi, django (BE)
#   그 외 스택도 지정 가능 — 가이드라인이 없으면 템플릿에서 자동 생성
#   be-stack=none → 풀스택 모드 (단일 앱, backend/ 미생성)
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE_DIR="$ROOT_DIR/pipeline"
PROJECTS_DIR="$ROOT_DIR/projects"

# --- 환경 의존성 검증 ---
check_prerequisites() {
    local missing_required=()
    local missing_optional=()

    # 필수 도구 확인
    for cmd in python3 jq node npm; do
        if ! command -v "$cmd" &>/dev/null; then
            missing_required+=("$cmd")
        fi
    done

    if [ ${#missing_required[@]} -gt 0 ]; then
        echo "❌ 필수 도구가 설치되어 있지 않습니다:"
        for cmd in "${missing_required[@]}"; do
            case "$cmd" in
                python3) echo "  - python3: brew install python3 또는 https://www.python.org/" ;;
                jq)      echo "  - jq: brew install jq 또는 https://jqlang.github.io/jq/" ;;
                node)    echo "  - node: brew install node 또는 https://nodejs.org/" ;;
                npm)     echo "  - npm: node 설치 시 함께 설치됨" ;;
            esac
        done
        echo ""
        echo "필수 도구를 모두 설치한 후 다시 실행해주세요."
        exit 1
    fi

    # 권장 도구 확인
    for cmd in gh docker; do
        if ! command -v "$cmd" &>/dev/null; then
            missing_optional+=("$cmd")
        fi
    done

    if [ ${#missing_optional[@]} -gt 0 ]; then
        echo "⚠️  권장 도구가 설치되어 있지 않습니다 (계속 진행 가능):"
        for cmd in "${missing_optional[@]}"; do
            case "$cmd" in
                gh)     echo "  - gh: brew install gh 또는 https://cli.github.com/ (GitHub 이슈/PR 생성에 필요)" ;;
                docker) echo "  - docker: https://www.docker.com/ (배포에 필요)" ;;
            esac
        done
        echo ""
    fi
}

check_prerequisites

# macOS 호환: realpath --relative-to 대체 함수
relpath() {
    python3 -c "import os.path; print(os.path.relpath('$1', '$2'))"
}

# --- 인자 검증 ---
if [ $# -lt 3 ]; then
    echo "Usage: $0 <project-name> <fe-stack> <be-stack>"
    echo ""
    echo "  project-name  프로젝트 이름 (영문, 하이픈 허용)"
    echo "  fe-stack      Frontend 스택 (예: nextjs, react, vue, svelte ...)"
    echo "  be-stack      Backend 스택 (예: fastapi, django, nestjs, spring ...)"
    echo "                'none'을 지정하면 풀스택 모드 (단일 앱)"
    echo ""
    echo "Example:"
    echo "  $0 shopping-mall nextjs fastapi"
    echo "  $0 visit-gangnam nextjs none    # 풀스택 모드"
    exit 1
fi

PROJECT_NAME="$1"
FE_STACK="$2"
BE_STACK="$3"

# --- 풀스택 모드 판별 ---
FULLSTACK_MODE=false
if [ "$BE_STACK" = "none" ]; then
    FULLSTACK_MODE=true
fi

# --- 스택 가이드라인 확인/생성 ---
FE_GUIDELINE="$PIPELINE_DIR/stacks/$FE_STACK/frontend-guidelines.md"
if [ ! -f "$FE_GUIDELINE" ]; then
    echo "  ℹ️  No guideline for '$FE_STACK'. Generating from template..."
    mkdir -p "$PIPELINE_DIR/stacks/$FE_STACK"
    sed "s|{{FE_STACK}}|$FE_STACK|g" "$PIPELINE_DIR/templates/frontend-guidelines.md.template" > "$FE_GUIDELINE"
fi

if [ "$FULLSTACK_MODE" = true ]; then
    # 풀스택 가이드라인 확인
    FULLSTACK_GUIDELINE="$PIPELINE_DIR/stacks/$FE_STACK/fullstack-guidelines.md"
    if [ ! -f "$FULLSTACK_GUIDELINE" ]; then
        echo "  ℹ️  No fullstack guideline for '$FE_STACK'. Generating from template..."
        sed "s|{{FE_STACK}}|$FE_STACK|g" "$PIPELINE_DIR/templates/fullstack-guidelines.md.template" > "$FULLSTACK_GUIDELINE"
    fi
else
    BE_GUIDELINE="$PIPELINE_DIR/stacks/$BE_STACK/backend-guidelines.md"
    if [ ! -f "$BE_GUIDELINE" ]; then
        echo "  ℹ️  No guideline for '$BE_STACK'. Generating from template..."
        mkdir -p "$PIPELINE_DIR/stacks/$BE_STACK"
        sed "s|{{BE_STACK}}|$BE_STACK|g" "$PIPELINE_DIR/templates/backend-guidelines.md.template" > "$BE_GUIDELINE"
    fi
fi

# --- 프로젝트 중복 확인 ---
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
if [ -d "$PROJECT_DIR" ]; then
    echo "Error: Project '$PROJECT_NAME' already exists at $PROJECT_DIR"
    exit 1
fi

echo "=== Creating project: $PROJECT_NAME ==="
echo "  FE Stack: $FE_STACK"
if [ "$FULLSTACK_MODE" = true ]; then
    echo "  Mode: Fullstack (single app)"
else
    echo "  BE Stack: $BE_STACK"
fi
echo ""

# --- 1. 디렉토리 구조 생성 ---
echo "[1/9] Creating directory structure..."
mkdir -p "$PROJECT_DIR/.claude/agents"
mkdir -p "$PROJECT_DIR/.claude/skills"
mkdir -p "$PROJECT_DIR/.claude/commands"
mkdir -p "$PROJECT_DIR/.claude/hooks"
if [ "$FULLSTACK_MODE" = true ]; then
    mkdir -p "$PROJECT_DIR/app"
else
    mkdir -p "$PROJECT_DIR/frontend"
    mkdir -p "$PROJECT_DIR/backend"
fi
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
    relative_path="$(relpath "$agent_file" "$AGENTS_TARGET")"
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
        relative_path="$(relpath "$skill_file" "$SKILLS_TARGET")"
        ln -s "$relative_path" "$SKILLS_TARGET/$filename"
        echo "  → $filename"
    fi
done

# 디렉토리형 스킬
for skill_dir in "$SKILLS_SOURCE"/*/; do
    if [ -d "$skill_dir" ]; then
        dirname="$(basename "$skill_dir")"
        relative_path="$(relpath "$skill_dir" "$SKILLS_TARGET")"
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

if command -v jq &>/dev/null; then
    inject_fe_rule "$FE_STACK" "$SKILLS_TARGET/skill-rules.json"
    inject_be_rule "$BE_STACK" "$SKILLS_TARGET/skill-rules.json"
else
    echo "  ⚠️  jq가 설치되어 있지 않아 스택 스킬 룰 주입을 건너뜁니다."
    echo "     설치 후 수동으로 실행하세요: brew install jq"
fi

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
if command -v npm &>/dev/null; then
    if ! (cd "$HOOKS_TARGET" && npm install --silent 2>/dev/null); then
        echo "  ⚠️  npm install 실패 — 수동으로 실행해주세요:"
        echo "     cd $HOOKS_TARGET && npm install"
    fi
else
    echo "  ⚠️  npm이 설치되어 있지 않아 hook 의존성 설치를 건너뜁니다."
fi

echo "  → Hooks installed"

# --- 6. Commands symlink 연결 (pipeline/commands/ 단일 소스) ---
echo "[6/9] Linking commands..."
COMMANDS_SOURCE="$PIPELINE_DIR/commands"
COMMANDS_TARGET="$PROJECT_DIR/.claude/commands"

for cmd_file in "$COMMANDS_SOURCE"/*.md; do
    if [ -f "$cmd_file" ]; then
        filename="$(basename "$cmd_file")"
        relative_path="$(relpath "$cmd_file" "$COMMANDS_TARGET")"
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
if [ "$FULLSTACK_MODE" = true ]; then
    TEMPLATE="$PIPELINE_DIR/templates/CLAUDE.md.fullstack.template"
    sed -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
        -e "s|{{FE_STACK}}|$FE_STACK|g" \
        -e "s|{{GITHUB_OWNER}}|owner|g" \
        -e "s|{{DESCRIPTION}}|$PROJECT_NAME 프로젝트|g" \
        "$TEMPLATE" > "$PROJECT_DIR/CLAUDE.md"
else
    TEMPLATE="$PIPELINE_DIR/templates/CLAUDE.md.template"
    sed -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
        -e "s|{{FE_STACK}}|$FE_STACK|g" \
        -e "s|{{BE_STACK}}|$BE_STACK|g" \
        -e "s|{{GITHUB_OWNER}}|owner|g" \
        -e "s|{{DESCRIPTION}}|$PROJECT_NAME 프로젝트|g" \
        "$TEMPLATE" > "$PROJECT_DIR/CLAUDE.md"
fi

# --- 9. Deploy 설정 파일 생성 ---
echo "[9/9] Creating deploy configuration..."

if [ "$FULLSTACK_MODE" = true ]; then
    # --- 풀스택 단일 앱 배포 설정 ---
    cat > "$PROJECT_DIR/deploy/Dockerfile" << 'DEPLOY_EOF'
# Fullstack Next.js Dockerfile

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["npm", "start"]
DEPLOY_EOF

    cat > "$PROJECT_DIR/deploy/docker-compose.yml" << DEPLOY_COMPOSE_EOF
version: "3.8"

services:
  app:
    build:
      context: ../app
      dockerfile: ../deploy/Dockerfile
    image: ${PROJECT_NAME}:\${TAG:-latest}
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
      - DATABASE_URL=\${DATABASE_URL:-mysql://app:changeme@db:3306/app}
    depends_on:
      - db
    profiles:
      - staging
      - production

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=\${MYSQL_DATABASE:-app}
      - MYSQL_USER=\${MYSQL_USER:-app}
      - MYSQL_PASSWORD=\${MYSQL_PASSWORD:-changeme}
      - MYSQL_ROOT_PASSWORD=\${MYSQL_ROOT_PASSWORD:-rootchangeme}
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "\${DB_PORT:-3306}:3306"
    profiles:
      - staging
      - production

volumes:
  db_data:
DEPLOY_COMPOSE_EOF

    cat > "$PROJECT_DIR/deploy/deploy-config.yml" << 'DEPLOY_CONFIG_EOF'
# 배포 설정 — Agent 08이 참조합니다
# provider를 변경하여 배포 대상을 확장할 수 있습니다

provider: cafe24  # cafe24 | docker | vercel

staging:
  url: http://localhost:3000
  health_check:
    app: /
    api: /api/health
  timeout: 30

production:
  url: https://example.com
  health_check:
    app: /
    api: /api/health
  timeout: 60
  requires_approval: true

rollback:
  max_retries: 3
  escalate_after: 3
DEPLOY_CONFIG_EOF

    echo "  → Dockerfile"
    echo "  → docker-compose.yml"
    echo "  → deploy-config.yml"
else
    # --- FE/BE 분리 배포 설정 ---
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
fi

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
if [ "$FULLSTACK_MODE" = true ]; then
    echo "  Mode: Fullstack ($FE_STACK)"
    echo "  App:  projects/$PROJECT_NAME/app/"
    echo ""
    echo "  Included infrastructure:"
    echo "    Hooks:    skill-activation, post-tool-use-tracker, tsc-check, error-handling-reminder"
    echo "    Agents:   planner, auto-error-resolver, code-architecture-reviewer, frontend-error-fixer"
    echo "    Agents:   + pipeline agents (01~08)"
    echo "    Deploy:   Dockerfile, docker-compose.yml, deploy-config.yml"
    echo "    Commands: /dev-docs, /dev-docs-update, /pipeline-dashboard"
    echo "    Skills:   skill-developer, verify-implementation, manage-skills, visualization-notion"
    echo "    Rules:    skill-rules.json (with $FE_STACK fullstack rules injected)"
else
    echo "  Included infrastructure:"
    echo "    Hooks:    skill-activation, post-tool-use-tracker, tsc-check, error-handling-reminder"
    echo "    Agents:   planner, auto-error-resolver, code-architecture-reviewer, frontend-error-fixer"
    echo "    Agents:   + pipeline agents (01~08)"
    echo "    Deploy:   Dockerfile.frontend, Dockerfile.backend, docker-compose.yml, deploy-config.yml"
    echo "    Commands: /dev-docs, /dev-docs-update, /pipeline-dashboard"
    echo "    Skills:   skill-developer, verify-implementation, manage-skills, visualization-notion"
    echo "    Rules:    skill-rules.json (with $FE_STACK + $BE_STACK rules injected)"
fi
echo ""
echo "  Next steps:"
echo "    1. Edit projects/$PROJECT_NAME/CLAUDE.md to set GitHub owner and description"
echo "    2. cd projects/$PROJECT_NAME && claude"
echo "    3. Start the pipeline with Agent 01"

#!/bin/bash

# Generic TSC Hook - Uses post-tool-use-tracker's affected repos
# No hardcoded service names; auto-detects from tracked changes

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HOOK_INPUT=$(cat)
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // "default"')
CACHE_DIR="$CLAUDE_PROJECT_DIR/.claude/tsc-cache/$SESSION_ID"

# If no cache directory exists, no files were tracked
if [ ! -d "$CACHE_DIR" ]; then
    exit 0
fi

# Read affected repos from tracker
if [ ! -f "$CACHE_DIR/affected-repos.txt" ]; then
    exit 0
fi

REPOS_TO_CHECK=$(cat "$CACHE_DIR/affected-repos.txt" | tr '\n' ' ' | xargs)

if [ -z "$REPOS_TO_CHECK" ]; then
    exit 0
fi

# Function to detect the correct TSC command for a repo
get_tsc_command() {
    local repo_path="$1"
    cd "$repo_path" 2>/dev/null || return 1

    if [ -f "tsconfig.app.json" ]; then
        echo "npx tsc --project tsconfig.app.json --noEmit"
    elif [ -f "tsconfig.build.json" ]; then
        echo "npx tsc --project tsconfig.build.json --noEmit"
    elif [ -f "tsconfig.json" ]; then
        if grep -q '"references"' tsconfig.json 2>/dev/null; then
            if [ -f "tsconfig.app.json" ]; then
                echo "npx tsc --project tsconfig.app.json --noEmit"
            elif [ -f "tsconfig.src.json" ]; then
                echo "npx tsc --project tsconfig.src.json --noEmit"
            else
                echo "npx tsc --build --noEmit"
            fi
        else
            echo "npx tsc --noEmit"
        fi
    else
        echo ""
    fi
}

# Function to run TSC check
run_tsc_check() {
    local repo="$1"
    local repo_path="$CLAUDE_PROJECT_DIR/$repo"

    cd "$repo_path" 2>/dev/null || return 1

    local tsc_cmd
    tsc_cmd=$(get_tsc_command "$repo_path")

    if [ -z "$tsc_cmd" ]; then
        return 0
    fi

    # Cache the TSC command
    mkdir -p "$CACHE_DIR"
    echo "$tsc_cmd" > "$CACHE_DIR/$repo-tsc-cmd.cache"

    eval "$tsc_cmd" 2>&1
}

ERROR_COUNT=0
ERROR_OUTPUT=""
FAILED_REPOS=""

echo "⚡ TypeScript check on: $REPOS_TO_CHECK" >&2

for repo in $REPOS_TO_CHECK; do
    repo_path="$CLAUDE_PROJECT_DIR/$repo"

    # Skip if no tsconfig.json
    if [ ! -f "$repo_path/tsconfig.json" ]; then
        continue
    fi

    echo -n "  Checking $repo... " >&2

    CHECK_OUTPUT=$(run_tsc_check "$repo" 2>&1)
    CHECK_EXIT_CODE=$?

    if [ $CHECK_EXIT_CODE -ne 0 ] || echo "$CHECK_OUTPUT" | grep -q "error TS"; then
        echo "❌ Errors found" >&2
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED_REPOS="$FAILED_REPOS $repo"
        ERROR_OUTPUT="${ERROR_OUTPUT}

=== Errors in $repo ===
$CHECK_OUTPUT"
    else
        echo "✅ OK" >&2
    fi
done

if [ $ERROR_COUNT -gt 0 ]; then
    echo "$ERROR_OUTPUT" > "$CACHE_DIR/last-errors.txt"
    echo "$FAILED_REPOS" > "$CACHE_DIR/failed-repos.txt"

    echo "# TSC Commands by Repo" > "$CACHE_DIR/tsc-commands.txt"
    for repo in $FAILED_REPOS; do
        cmd=$(cat "$CACHE_DIR/$repo-tsc-cmd.cache" 2>/dev/null || echo "npx tsc --noEmit")
        echo "$repo: $cmd" >> "$CACHE_DIR/tsc-commands.txt"
    done

    {
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚨 TypeScript errors found in $ERROR_COUNT repo(s): $FAILED_REPOS"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "👉 IMPORTANT: Use the auto-error-resolver agent to fix the errors"
        echo ""
        echo "Error Preview:"
        echo "$ERROR_OUTPUT" | grep "error TS" | head -10
        echo ""
        if [ $(echo "$ERROR_OUTPUT" | grep -c "error TS") -gt 10 ]; then
            echo "... and $(($(echo "$ERROR_OUTPUT" | grep -c "error TS") - 10)) more errors"
        fi
    } >&2

    exit 1
fi

# Cleanup old cache directories (older than 7 days)
find "$CLAUDE_PROJECT_DIR/.claude/tsc-cache" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

exit 0

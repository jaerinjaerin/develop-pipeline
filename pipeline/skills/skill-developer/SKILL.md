---
name: skill-developer
description: Create and manage Claude Code skills following Anthropic best practices. Use when creating new skills, modifying skill-rules.json, understanding trigger patterns, working with hooks, debugging skill activation, or implementing progressive disclosure. Covers skill structure, YAML frontmatter, trigger types (keywords, intent patterns, file paths, content patterns), enforcement levels (block, suggest, warn), hook mechanisms (UserPromptSubmit, PreToolUse), session tracking, and the 500-line rule.
---

# Skill Developer Guide

## Purpose

Comprehensive guide for creating and managing skills in Claude Code with auto-activation system, following Anthropic's official best practices including the 500-line rule and progressive disclosure pattern.

## When to Use This Skill

Automatically activates when you mention:
- Creating or adding skills
- Modifying skill triggers or rules
- Understanding how skill activation works
- Debugging skill activation issues
- Working with skill-rules.json
- Hook system mechanics

---

## System Overview

### Two-Hook Architecture

**1. UserPromptSubmit Hook** (Proactive Suggestions)
- **File**: `.claude/hooks/skill-activation-prompt.ts`
- **Trigger**: BEFORE Claude sees user's prompt
- **Purpose**: Suggest relevant skills based on keywords + intent patterns
- **Method**: Injects formatted reminder as context (stdout -> Claude's input)

**2. Stop Hook - Error Handling Reminder** (Gentle Reminders)
- **File**: `.claude/hooks/error-handling-reminder.ts`
- **Trigger**: AFTER Claude finishes responding
- **Purpose**: Gentle reminder to self-assess error handling in code written
- **Method**: Analyzes edited files for risky patterns, displays reminder if needed

### Configuration File

**Location**: `.claude/skills/skill-rules.json`

Defines:
- All skills and their trigger conditions
- Enforcement levels (block, suggest, warn)
- File path patterns (glob)
- Content detection patterns (regex)
- Skip conditions (session tracking, file markers, env vars)

---

## Skill Types

### 1. Guardrail Skills

**Purpose:** Enforce critical best practices that prevent errors

**Characteristics:**
- Type: `"guardrail"`, Enforcement: `"block"`, Priority: `"critical"` or `"high"`
- Block file edits until skill used
- Session-aware (don't repeat nag in same session)

**When to Use:** Mistakes that cause runtime errors, data integrity concerns

### 2. Domain Skills

**Purpose:** Provide comprehensive guidance for specific areas

**Characteristics:**
- Type: `"domain"`, Enforcement: `"suggest"`, Priority: `"high"` or `"medium"`
- Advisory, not mandatory
- Topic or domain-specific

**When to Use:** Complex systems, best practices, architectural patterns

---

## Quick Start: Creating a New Skill

### Step 1: Create Skill File

**Location:** `.claude/skills/{skill-name}/SKILL.md`

**Template:**
```markdown
---
name: my-new-skill
description: Brief description including keywords that trigger this skill.
---

# My New Skill

## Purpose
What this skill helps with

## When to Use
Specific scenarios and conditions

## Key Information
The actual guidance, documentation, patterns, examples
```

**Best Practices:**
- Name: Lowercase, hyphens, gerund form preferred
- Description: Include ALL trigger keywords/phrases (max 1024 chars)
- Content: Under 500 lines - use reference files for details
- Examples: Real code examples
- Structure: Clear headings, lists, code blocks

### Step 2: Add to skill-rules.json

```json
{
  "my-new-skill": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "medium",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["(create|add).*?something"]
    }
  }
}
```

### Step 3: Test Triggers

```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

### Step 4: Refine Patterns

Based on testing:
- Add missing keywords
- Refine intent patterns to reduce false positives
- Adjust file path patterns
- Test content patterns against actual files

---

## Enforcement Levels

### BLOCK (Critical Guardrails)
- Physically prevents Edit/Write tool execution
- Exit code 2 from hook, stderr -> Claude
- **Use For**: Critical mistakes, data integrity, security issues

### SUGGEST (Recommended)
- Reminder injected before Claude sees prompt
- Not enforced, just advisory
- **Use For**: Domain guidance, best practices

### WARN (Optional)
- Low priority suggestions, rarely used

---

## Skip Conditions & User Control

### 1. Session Tracking
Don't nag repeatedly in same session.
**State File:** `.claude/hooks/state/skills-used-{session_id}.json`

### 2. File Markers
Permanent skip for verified files.
**Marker:** `// @skip-validation`

### 3. Environment Variables
Emergency disable.
```bash
export SKIP_SKILL_GUARDRAILS=true  # Disables ALL PreToolUse blocks
```

---

## Testing Checklist

- [ ] Skill file created in `.claude/skills/{name}/SKILL.md`
- [ ] Proper frontmatter with name and description
- [ ] Entry added to `skill-rules.json`
- [ ] Keywords tested with real prompts
- [ ] Intent patterns tested with variations
- [ ] Block message is clear and actionable (if guardrail)
- [ ] Priority level matches importance
- [ ] No false positives in testing
- [ ] **SKILL.md under 500 lines**
- [ ] JSON syntax validated: `jq . skill-rules.json`

---

## Anthropic Best Practices

- **500-line rule**: Keep SKILL.md under 500 lines
- **Progressive disclosure**: Use reference files for details
- **Table of contents**: Add to reference files > 100 lines
- **Rich descriptions**: Include all trigger keywords (max 1024 chars)
- **Test first**: Build 3+ evaluations before extensive documentation
- **Gerund naming**: Prefer verb + -ing (e.g., "processing-pdfs")

---
name: claude-code-config-helper
description: "Authors and reviews this project's Claude Code configuration artifacts (subagents, skills, slash commands, rules, settings hooks, CLAUDE.md) as a two-person team (author/reviewer) and writes the result to the target path. Always use it for natural-language requests like 'create an agent', 'write a skill', 'add a slash command', 'update CLAUDE.md', '.claude config', '에이전트 만들어줘', or '스킬 작성해줘'. Do not use it for simple questions about Claude Code features or usage that do not author or modify a configuration file."
allowed-tools: Agent, Read, Bash, Write
---

# Claude Code Helper

Invokes a two-person team (claude-code-config-author → claude-code-config-reviewer) in sequence to
author and review a Claude Code project configuration artifact, and writes it to the target path on
a PASS verdict.

- Authoring language: **English** (project `.md` convention)
- Location of intermediate artifacts: `./.claude/tmp/` (gitignored)
- Targets: `.claude/agents/**`, `.claude/skills/<skill-name>/SKILL.md`, `.claude/commands/**`,
  `.claude/rules/**`, `.claude/settings.json`, `CLAUDE.md`

**Scope boundary:** use this skill only when **authoring or modifying** a configuration file. Do not
use it for questions that merely **ask** about Claude Code features or usage without changing config.

@see .claude/agents/utility/claude/code-config-author.md — drafting rules (frontmatter per type)
@see .claude/agents/utility/claude/code-config-reviewer.md — verification checklist
@see https://code.claude.com/docs/en/sub-agents — subagent spec
@see https://code.claude.com/docs/en/skills — skill spec

---

## Workflow

1. **Interpret the request (precondition)**
   - Determine the **artifact type** (agent / skill / command / rule / settings / CLAUDE.md) and the
     **target path** from the user's request.
   - If the type or path is unclear, settle it with **one focused question** before proceeding
     (do not ask about several ambiguities at once).
   - For a skill, the target path must be `.claude/skills/<skill-name>/SKILL.md` — one directory
     directly under `.claude/skills/`. Grouping subdirectories are not discovered.

2. **Invoke the author**
   - Invoke the `claude-code-config-author` agent, passing the **artifact type, target path, and
     requirements** in the prompt.
   - Output: `./.claude/tmp/utility/claude/config-draft.md`.

3. **Invoke the reviewer**
   - Invoke the `claude-code-config-reviewer` agent, passing the **target path and artifact type**
     in the prompt.
   - Output: `./.claude/tmp/utility/claude/config-review.md`.

4. **Verdict branch**
   - **PASS:** write the draft to the target path.
     - Create any required parent directory first (`mkdir -p "$(dirname <target-path>)"`).
     - Write it with `cp ./.claude/tmp/utility/claude/config-draft.md <target-path>` (or an
       equivalent Write), report the written path and a summary, then stop.
   - **REDO:** include the revision instructions from `./.claude/tmp/utility/claude/config-review.md`
     in the author re-invocation prompt and repeat from step 2. **Retry at most 2 times.**

5. **Retry-limit handling**
   - If it is still REDO after 2 retries, **do not write to the target path.**
   - Present the last draft to the user and stop with the warning
     "Auto-approval limit reached — manual review recommended."

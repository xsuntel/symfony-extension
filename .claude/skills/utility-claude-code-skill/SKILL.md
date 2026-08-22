---
name: utility-claude-code-skill
description: "Authors and reviews this project's Claude Code configuration artifacts (subagents, skills, slash commands, rules, settings hooks, CLAUDE.md) inline — Claude drafts the artifact, self-reviews it against the project criteria, and writes the result to the target path. Always use it for natural-language requests like 'create an agent', 'write a skill', 'add a slash command', 'update CLAUDE.md', '.claude config', '에이전트 만들어줘', or '스킬 작성해줘'. Do not use it for simple questions about Claude Code features or usage that do not author or modify a configuration file."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit(.claude/**)
  - Edit(CLAUDE.md)
  - Edit(**/CLAUDE.md)
  - Write(.claude/**)
  - Write(CLAUDE.md)
  - Write(**/CLAUDE.md)
  - Bash(mkdir:*)
---

# Claude Code Skill

Authors and reviews a Claude Code project configuration artifact **inline** — Claude drafts the
artifact, self-reviews it against the project criteria, and writes it to the target path once the
self-review is clean. No subagents are spawned.

- Authoring language: **English** (project `.md` convention)
- Location of intermediate artifacts: `./.claude/tmp/` (gitignored, optional draft staging)
- Targets: `.claude/agents/**`, `.claude/skills/<skill-name>/SKILL.md`, `.claude/commands/**`,
  `.claude/rules/**`, `.claude/output-styles/**`, `.claude/settings.json`, `CLAUDE.md`

**Scope boundary:** use this skill only when **authoring or modifying** a configuration file. Do not
use it for questions that merely **ask** about Claude Code features or usage without changing config.

@see .claude/rules/utility-claude-code-rule.md — `.claude/` structure immutability (SoT)
@see .claude/commands/utility-claude-code-review.md — Per-Type Criteria + Review Procedure (self-review checklist)
@see .claude/docs/utility-claude-code-docs.md — per-type spec, target paths, worked authoring examples
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

2. **Draft the artifact**
   - Draft the config artifact per the **Per-Type Criteria** in
     `.claude/commands/utility-claude-code-review.md` (required frontmatter, body structure)
     and the directory rules in `.claude/rules/utility-claude-code-rule.md`.
   - Optionally stage the draft to `./.claude/tmp/utility/claude/config-draft.md`
     (`mkdir -p .claude/tmp/utility/claude` first) for a larger artifact.

3. **Self-review the draft**
   - Check the draft against the **Review Procedure** in the review command: frontmatter validity,
     naming and paths, tool minimality, convention alignment (English, `@see` style, sibling tone),
     factuality (no references to files/agents/skills/commands/tools that do not exist), and role
     boundaries (upstream/downstream parties, orchestrator, output paths stated correctly).
   - If the self-review surfaces issues, revise the draft and re-check. **Cap at 2 self-review passes.**

4. **Write to the target path**
   - Create any required parent directory first (`mkdir -p "$(dirname <target-path>)"`).
   - Write the finished draft to the target path with the Write tool, then report the written path
     and a short summary, and stop.

5. **Unresolved-issue handling**
   - If the self-review still flags a blocking issue after 2 passes, **do not overwrite the target
     path silently.** Present the draft and the remaining issues to the user with the note
     "Manual review recommended."

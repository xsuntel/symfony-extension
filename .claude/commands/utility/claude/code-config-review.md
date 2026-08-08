---
description: "Evaluate Claude Code configuration artifacts (agents, skills, commands, rules, output styles, settings, CLAUDE.md) for spec and convention compliance, and provide structured improvement recommendations."
argument-hint: "<path/to/.claude/config-file.md>"
---

Analyse the following Claude Code configuration artifact:

**`$1`**

First determine the **artifact type** from the target file's path, then compare it against the
per-type criteria below and the official specs, reporting every violation with its **exact line
number** and a concrete fix (an improved snippet). Before starting, read **one or two existing
files of the same type** under `.claude/**` and use them as the baseline for frontmatter, tone, and
section structure — do not invent new conventions.

> **Note:** this domain has one `rules/` SoT — `.claude/rules/utility/claude/config-structure-rule.md`,
> which governs directory layout only — and no `output-styles/` SoT (unlike the `app/base` domain,
> which has `.claude/rules/tools/vscode-extension-rule.md` and
> `.claude/output-styles/app/base/typescript-style.md`). The criteria are **that rule, this command
> body, and the official docs below**; do not report anything outside them as a "violation".

@see https://code.claude.com/docs/en/sub-agents — subagent frontmatter spec
@see https://code.claude.com/docs/en/skills — skill SKILL.md structure, frontmatter reference, and directory layout
@see .claude/rules/utility/claude/config-structure-rule.md — `.claude/` directory structure immutability (SoT)
@see .claude/skills/cc-config-helper/SKILL.md — entry point for artifact authoring/writing orchestration

## Per-Type Criteria

| Type | Target path | Required frontmatter | Body |
| --- | --- | --- | --- |
| Subagent | `.claude/agents/**/*.md` | `name`, `description` (optional: `model`, `tools`) | Role, procedure, I/O protocol, role boundaries |
| Skill | `.claude/skills/<skill-name>/SKILL.md` | — (recommended: `description`; optional: `name`) | Operating guide |
| Slash command | `.claude/commands/**/*.md` | `description` (optional: `argument-hint`, `allowed-tools`, `model`) | Instructions using a positional argument (`$1`) or the all-arguments variable |
| Rule | `.claude/rules/**/*.md` | — (optional: `paths` glob list) | Criteria (SoT) |
| Output style | `.claude/output-styles/**/*.md` | `name`, `description` (optional: `keep-coding-instructions`) | Domain output and code style guide |
| settings/hooks | `.claude/settings.json` | (JSON) hook schema | — |
| CLAUDE.md | `CLAUDE.md` or a subdirectory copy | — | Parent context and instructions |

### Frontmatter Detail Rules (official spec)

- **Agent `model`**: one of `sonnet` | `opus` | `haiku` | `inherit`. `tools` is comma-separated and must list **least privilege only** (omitting it inherits every tool).
- **Skill directory placement**: a project skill is discovered only at `.claude/skills/<skill-name>/SKILL.md` — one directory directly under `.claude/skills/`. Grouping subdirectories (`.claude/skills/utility/git/foo/SKILL.md`) are **not** discovered, and the directory name becomes the `/command` name. This does not apply to `.claude/commands/**`, which does support nested paths.
- **Skill `name`**: optional. In a project skill it sets only the display label and defaults to the directory name — the `/command` always comes from the directory. Keep it identical to the directory name so the label and the command agree; lowercase letters, digits, and hyphens only.
- **Skill `description`**: recommended, not required (it falls back to the first paragraph of the body). State "what it does + when it triggers" in the third person with the key use case first — `description` plus `when_to_use` is truncated at **1,536** characters in the skill listing.
- **Command / skill `allowed-tools`**: a space- or comma-separated string, or a YAML list. Do not list tool names that do not exist.
- **Output style `name`**: matches the file slug. Set `keep-coding-instructions: true` to avoid overriding the coding instructions (the convention in the existing styles).
- **Rule frontmatter**: a rule may carry a `paths` glob list, or be plain markdown loaded by reference from `CLAUDE.md` — the absence of frontmatter is not by itself a violation.

## Review Procedure

Work through the items below in order.

- **Frontmatter validity** — is it valid YAML fenced by `---`, and are the required keys for the type present? For settings/hooks, is it valid JSON that conforms to the hook schema?
- **Naming and paths** — do the filename and directory conventions match sibling files of the same type? For a skill, confirm it sits directly under `.claude/skills/<skill-name>/` (a deeper path is silently never loaded) and that `name`, when present, equals that directory name. For a command, the invocation name is the path slug. Flag as `[MUST]` any change that moves, renames, merges, or flattens an existing directory under `.claude/` — that structure is immutable per the rule SoT above.
- **Tool minimality** — are `tools` / `allowed-tools` free of needlessly broad grants, and **free of tool names that do not exist**?
- **Convention alignment** — does it follow the language (English), the `@see` SoT reference style, and the tone and section structure of sibling files? Does it avoid copying or restating criteria from an SoT and creating drift?
- **Factuality** — does the body avoid referencing rules, paths, agents, skills, commands, or tools that do not exist (confirm that referenced paths point at real files)?
- **Role boundaries** — for an agent or skill, are the upstream/downstream parties, the orchestrator, and the output paths stated, and do they match the actual caller?

## Output Format

### Summary

| Category | Status (OK / WARN / FAIL) | Issue Count |
| --- | --- | --- |
| Frontmatter validity | | |
| Required keys per type | | |
| Naming and path conventions | | |
| Tool minimality | | |
| Project convention alignment | | |
| Reference factuality | | |
| Role boundaries and handoff | | |

### Critical Issues (must fix)

For each issue: **[Line N]** `[MUST]` description → recommended fix including a corrected snippet.

### Improvement Suggestions (should fix)

For each suggestion: **[Line N]** `[SHOULD]` description → recommended approach.

### Refactoring Suggestions

Mark structural changes (section reordering, moving duplicated criteria into an SoT, converting
between artifact types, etc.) as `[CONSIDER]` and describe them with before/after examples.
Only `[MUST]` blocks a merge.

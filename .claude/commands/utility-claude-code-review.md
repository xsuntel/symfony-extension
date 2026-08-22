---
description: "Assesses spec and convention compliance of Claude Code config artifacts (agents, skills, commands, rules, output styles, settings, CLAUDE.md) and provides structured improvement recommendations."
argument-hint: "[path to the .claude config file to analyze]"
---

Analyze the following Claude Code config artifact:

**`$ARGUMENTS`**

> **When the argument is empty**, review every artifact under `.claude/` — do not guess a single
> target, because misclassifying one of the nine types is costly. Determine each file's type from
> its path, then apply the matching row of **Per-Type Criteria** below. This command **reports
> only**: produce the Output Format sections and change no file. Applying a fix is a separate,
> explicitly confirmed step, and authoring belongs to the
> [`utility-claude-code-skill`](../skills/utility-claude-code-skill/SKILL.md).

> **Note:** this domain has one `rules/` SoT — `.claude/rules/utility-claude-code-rule.md`,
> which governs directory layout only — and no `output-styles/` SoT (unlike the `app` domain,
> which has `.claude/rules/app-typescript-code-rule.md` and
> `.claude/output-styles/app-typescript-code-style.md`). The criteria are **that rule, this command
> body, and the official docs below**; do not report anything outside them as a "violation".

@see https://code.claude.com/docs/en/sub-agents — subagent frontmatter spec
@see https://code.claude.com/docs/en/skills — skill SKILL.md structure, frontmatter reference, and directory layout
@see .claude/rules/utility-claude-code-rule.md — `.claude/` directory structure immutability (SoT)
@see .claude/docs/utility-claude-code-docs.md — per-type spec and target paths (reference companion)
@see .claude/skills/utility-claude-code-skill/SKILL.md — entry point for authoring/writing config artifacts (drafts and self-reviews inline)

## Per-Type Criteria

| Type | Target path | Required frontmatter | Body |
| --- | --- | --- | --- |
| Subagent | `.claude/agents/<domain>-<agent>.md` (flat) | `name`, `description` (optional: `model`, `tools`, `disallowedTools`, `memory`, `maxTurns`, and the further fields in the spec) | Role, procedure, I/O protocol, role boundaries |
| Skill | `.claude/skills/<skill-name>/SKILL.md` | — (recommended: `description`; optional: `name`) | Operating guide |
| Slash command | `.claude/commands/<domain>-<name>.md` (flat) | `description` (optional: `argument-hint`, `allowed-tools`, `model`) | Instructions using `$ARGUMENTS`, or a 0-based positional (`$0` is the first argument, `$1` the second) |
| Rule | `.claude/rules/<domain>-<name>.md` (flat) | — (optional: `paths` glob list) | Criteria (SoT) |
| Output style | `.claude/output-styles/<domain>-<name>.md` (flat) | `name`, `description` (optional: `keep-coding-instructions`) | Domain output and code style guide |
| Reference doc | `.claude/docs/<domain>-<name>-docs.md` (flat) | — | Reference companion — links to an SoT rather than restating its criteria |
| Agent notes | `.claude/agent-memory/<agent-name>/MEMORY.md` (flat, one dir per agent) | — | Hand-maintained durable facts; `<agent-name>` must equal an existing agent's `name:` |
| settings/hooks | `.claude/settings.json` | (JSON) hook schema | — |
| CLAUDE.md | `CLAUDE.md` or a subdirectory copy | — | Parent context and instructions |

### Frontmatter Detail Rules (official spec)

- **Agent `name` ↔ filename ↔ memory**: `name:` is the agent's only identifier — the path does not affect it. In this repository `name:` must equal the filename stem (`app-typescript-code-reviewer.md` → `name: app-typescript-code-reviewer`), and `memory: project` resolves to `.claude/agent-memory/<name>/`, so that directory must exist under exactly that name. A mismatch in any of the three orphans the notes silently. Flag it `[MUST]`.
- **Agent `model`**: `sonnet` | `opus` | `haiku` | `fable` | a full model ID (`claude-opus-5`) | `inherit`; it defaults to `inherit` when omitted. `tools` is a list of tool names (also MCP patterns and `Agent(agent_type)`) and must grant **least privilege only** — omitting it inherits every tool. A read-only agent that declares `memory:` needs `disallowedTools: Write, Edit`, because `memory:` otherwise auto-enables them.
- **Other agent frontmatter**: the spec documents more optional fields than this table enumerates — `maxTurns`, `permissionMode`, `skills`, `mcpServers`, `hooks`, `background`, `effort`, `isolation`, `color`, `initialPrompt`. Do **not** flag a field merely because it is absent from the Per-Type Criteria row; check it against the spec first. Every agent in this repository sets `maxTurns`, which is valid.
- **Skill directory placement**: a project skill is discovered only at `.claude/skills/<skill-name>/SKILL.md` — one directory directly under `.claude/skills/`. Grouping subdirectories (`.claude/skills/utility/git/foo/SKILL.md`) are **not** discovered, and the directory name becomes the `/command` name. This does not apply to `.claude/commands/**`, which does support nested paths.
- **Skill `name`**: optional. In a project skill it sets only the display label and defaults to the directory name — the `/command` always comes from the directory. Keep it identical to the directory name so the label and the command agree; lowercase letters, digits, and hyphens only.
- **Skill `description`**: recommended, not required (it falls back to the first paragraph of the body). State "what it does + when it triggers" in the third person with the key use case first — `description` plus `when_to_use` is truncated at **1,536** characters in the skill listing.
- **Command / skill `allowed-tools`**: a space- or comma-separated string, or a YAML list. Do not list tool names that do not exist.
- **Output style `name`**: matches the file slug. Set `keep-coding-instructions: true` to avoid overriding the coding instructions (the convention in the existing styles).
- **Rule frontmatter**: a rule may carry a `paths` glob list, or be plain markdown loaded by reference from `CLAUDE.md` — the absence of frontmatter is not by itself a violation.

## Review Procedure

Work through the items below in order.

- **Frontmatter validity** — is it valid YAML fenced by `---`, and are the required keys for the type present? For settings/hooks, is it valid JSON that conforms to the hook schema?
- **Naming and paths** — do the filename and directory conventions match sibling files of the same type? For a skill, confirm it sits directly under `.claude/skills/<skill-name>/` (a deeper path is silently never loaded) and that `name`, when present, equals that directory name. For a command, the invocation name is the path slug. Flag as `[MUST]` any change that moves, renames, merges, or flattens an existing directory under `.claude/` — that structure is immutable per the rule SoT above. **Exception:** `.claude/skills/**/*` is exempt; a skill directory may be renamed, so flag it only when the rename is not accompanied by the reference sweep (its own `name:`, every `.claude/skills/<old-name>/` link, and the prose mentions listed in the rule) or when it breaks the flat one-level layout.
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

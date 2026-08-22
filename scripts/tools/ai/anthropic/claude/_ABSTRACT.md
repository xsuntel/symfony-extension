# Tools - AI - Anthropic - Claude

Reference hub for **Claude Code** usage in this project. Claude Code's live
configuration lives under `.claude/` at the repository root; this file is an
index that routes to those real artifacts rather than restating them
(project rule: *link, don't duplicate*).

## `.claude/` Layout

| Path | Contents |
| --- | --- |
| [`../../../../../.claude/agents/`](../../../../../.claude/agents/) | Subagents — flat, filename stem = frontmatter `name:`: agent-team, app-typescript-code-*(analyzer, reviewer, debugger, tester), tools-vscode-extension-* (author, reviewer), utility-drawio-diagram-* (author, reviewer), utility-git-commit-* (author, reviewer) |
| [`../../../../../.claude/skills/`](../../../../../.claude/skills/) | Skills — one flat dir each: app-typescript-code-skill, tools-vscode-extension-config-skill, tools-vscode-extension-scaffold-skill, utility-claude-code-skill, utility-drawio-diagram-skill, utility-git-commit-skill, utility-shell-script-skill |
| [`../../../../../.claude/commands/`](../../../../../.claude/commands/) | Slash commands — flat, the filename slug IS the command name: `app-typescript-code-review.md`, `utility-claude-code-review.md`, `utility-drawio-diagram-review.md`, `utility-shell-script-review.md` |
| [`../../../../../.claude/rules/`](../../../../../.claude/rules/) | Auto-loaded rules — flat: `app-typescript-code-rule.md`, `tools-vscode-extension-rule.md`, `utility-claude-code-rule.md`, `utility-drawio-diagram-rule.md`, `utility-git-commit-rule.md`, `utility-shell-script-rule.md` |
| [`../../../../../.claude/docs/`](../../../../../.claude/docs/) | Reference docs — flat, `<domain>-<name>-docs.md`: agent-team-docs, app-typescript-code-docs, tools-vscode-extension-docs, utility-claude-code-docs, utility-drawio-diagram-docs, utility-git-commit-docs, utility-shell-script-docs |
| [`../../../../../.claude/output-styles/`](../../../../../.claude/output-styles/) | Output styles — flat, filename stem = frontmatter `name:`: abstract-english-style (active), abstract-korean-style, app-typescript-code-style, tools-vscode-extension-style, utility-drawio-diagram-style, utility-git-commit-style, utility-shell-script-style |
| [`../../../../../.claude/hooks/`](../../../../../.claude/hooks/) | Event hook slots (18 dirs) — NOT auto-discovered; a script here must be referenced from `settings.json`. Live: `session-start/app-typescript-status.sh`, `pre-tool-use/app-typescript-guard.sh`, `post-tool-use/app-typescript-check.sh` (the TypeScript build gates for `app/`) |
| [`../../../../../.claude/settings.json`](../../../../../.claude/settings.json) | Claude Code project settings — see [`_CONFIG.md`](_CONFIG.md) |

## Official Claude Docs

| Topic | URL |
| --- | --- |
| Claude Code subagents | <https://docs.claude.com/en/docs/claude-code/sub-agents> |
| Agent Skills overview | <https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview> |
| Skills guide (API) | <https://docs.claude.com/en/api/skills-guide> |

> For agent/skill naming and role mapping in this repository, see the root
> [`../../../../../CLAUDE.md`](../../../../../CLAUDE.md) ("Agent Naming" section).

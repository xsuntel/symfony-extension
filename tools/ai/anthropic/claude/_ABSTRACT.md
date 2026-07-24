# Tools - AI - Anthropic - Claude

Reference hub for **Claude Code** usage in this project. Claude Code's live
configuration lives under `.claude/` at the repository root; this file is an
index that routes to those real artifacts rather than restating them
(project rule: *link, don't duplicate*).

## `.claude/` Layout

| Path | Contents |
| --- | --- |
| [`../../../../.claude/agents/`](../../../../.claude/agents/) | Subagents — `app/base/` typescript-* (code-reviewer, debug-reviewer, test-writer); `utility/` claude · git author/reviewer pairs |
| [`../../../../.claude/skills/`](../../../../.claude/skills/) | Skills — `utility/` cc-config-helper, git-commit-helper, extension-config-helper |
| [`../../../../.claude/commands/`](../../../../.claude/commands/) | Slash commands — `app/base/` typescript-code-review |
| [`../../../../.claude/rules/`](../../../../.claude/rules/) | Auto-loaded rules — `tools/vscode-extension-rule.md` |
| [`../../../../.claude/docs/`](../../../../.claude/docs/) | Reference docs — typescript-code-docs, extension-config-docs |
| [`../../../../.claude/output-styles/`](../../../../.claude/output-styles/) | Output styles — english (active), korean, typescript-style |
| [`../../../../.claude/hooks/`](../../../../.claude/hooks/) | Event hook slots (pre/post-tool-use, stop — currently empty) |
| [`../../../../.claude/settings.json`](../../../../.claude/settings.json) | Claude Code project settings — see [`_CONFIG.md`](_CONFIG.md) |

## Official Claude Docs

| Topic | URL |
| --- | --- |
| Claude Code subagents | <https://docs.claude.com/en/docs/claude-code/sub-agents> |
| Agent Skills overview | <https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview> |
| Skills guide (API) | <https://docs.claude.com/en/api/skills-guide> |

> For agent/skill naming and role mapping in this repository, see the root
> [`../../../../CLAUDE.md`](../../../../CLAUDE.md) ("Agent Naming" section).

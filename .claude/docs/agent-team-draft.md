# Agent Team Reference — `.claude/agents` + orchestrating skills

> **Reference.** This document consolidates the project's agent "team" — the
> roster, how agents collaborate, and how they map to the global agent roles in
> `~/.claude/CLAUDE.md` §7. It is a Claude-facing reference, not a design proposal.
> Source of truth: [`../../CLAUDE.md`](../../CLAUDE.md) §"Agent Naming", the agent
> frontmatter under [`../agents/`](../agents/), and each `SKILL.md` under
> [`../skills/`](../skills/). Sibling reference docs:
> [`app/base/typescript-code-docs.md`](app/base/typescript-code-docs.md),
> [`utility/vscode/extension-config-docs.md`](utility/vscode/extension-config-docs.md).

## Overview

This repository uses two distinct collaboration models. Do not conflate them:

1. **Author → reviewer skill pipeline** — a skill orchestrates a two-agent team
   (author drafts, reviewer verifies with a PASS/REDO verdict), writing the result to
   a target path only on PASS. Used for `.claude` config artifacts and commit messages.
2. **Role-based single-agent invocation** — one specialised agent is activated for a
   task (review, debug, test), mapped from the generic roles the global `CLAUDE.md` §7
   names. No draft/verify loop; the agent acts directly.

A third category — **guidance-only skills** — provides analysis and API guidance with
no paired agent team.

## Roster

All agents live under [`../agents/`](../agents/).

| Agent | Path | Model | Tools | Role |
| --- | --- | --- | --- | --- |
| `typescript-code-reviewer` | [`app/base/`](../agents/app/base/typescript-code-reviewer.md) | opus | Read, Grep, Glob, Bash | Quality review, flags MUST/SHOULD/CONSIDER |
| `typescript-debug-reviewer` | [`app/base/`](../agents/app/base/typescript-debug-reviewer.md) | opus | Read, Grep, Glob, Bash | Root-cause tracing (read-only) |
| `typescript-test-writer` | [`app/base/`](../agents/app/base/typescript-test-writer.md) | opus | Read, Write, Edit, Grep, Glob, Bash | `@vscode/test-cli` + Mocha integration tests |
| `claude-code-config-author` | [`utility/claude/`](../agents/utility/claude/code-config-author.md) | sonnet | Bash, Read, Write | Drafts `.claude` config artifacts |
| `claude-code-config-reviewer` | [`utility/claude/`](../agents/utility/claude/code-config-reviewer.md) | sonnet | Bash, Read, Write | Verifies drafts → PASS/REDO |
| `git-commit-message-author` | [`utility/git/`](../agents/utility/git/commit-message-author.md) | sonnet | Bash, Read, Write | Drafts Conventional Commits message |
| `git-commit-message-reviewer` | [`utility/git/`](../agents/utility/git/commit-message-reviewer.md) | sonnet | Bash, Read, Write | Verifies commit draft → PASS/REDO |

## Orchestration patterns

### Author → reviewer pipeline

Two skills drive an author/reviewer pair through the same loop. The intermediate draft
and review land in `./.claude/tmp/` (gitignored); the target file is written only on PASS.

```text
skill → author (writes draft to .claude/tmp/…) → reviewer (PASS | REDO)
  ├─ PASS → write draft to target path, report, done
  └─ REDO → re-invoke author with the reviewer's fixes (max 2 retries)
            └─ still REDO after 2 → do NOT write; surface last draft for manual review
```

| Skill | Author → Reviewer | Target | Intermediate |
| --- | --- | --- | --- |
| [`cc-config-helper`](../skills/utility/claude/code-config-helper/SKILL.md) | `claude-code-config-author` → `claude-code-config-reviewer` | `.claude/agents\|skills\|commands\|rules/**`, `.claude/settings.json`, `CLAUDE.md` | `./.claude/tmp/utility/claude/` |
| [`git-commit-helper`](../skills/utility/git/commit-message-helper/SKILL.md) | `git-commit-message-author` → `git-commit-message-reviewer` | a git commit | `./.claude/tmp/utility/git/` |

### Role-based invocation

The `app/base` trio is invoked directly as the concrete implementation of the generic
roles in the global `CLAUDE.md` §7. There is no draft/verify handoff. The
[`typescript-code-helper`](../skills/app/base/typescript-code-helper/SKILL.md) skill and
the [`typescript-code-review`](../commands/app/base/typescript-code-review.md) command
front the review role.

### Guidance-only skills

[`vscode-extension-helper`](../skills/utility/vscode/extension-config-helper/SKILL.md)
analyses extension structure and guides VSCode API usage. It has **no paired agent team**.

## Global role mapping (`CLAUDE.md` §7 → this project)

| Global role | This project |
| --- | --- |
| `code-reviewer` (after code changes) | `typescript-code-reviewer` |
| debugging | `typescript-debug-reviewer` (read-only) |
| test authoring | `typescript-test-writer` |
| `security-auditor` (before deploy) | no dedicated agent — use the `/security-review` skill |

## Known gaps / inconsistencies

- **No `security-auditor` agent.** Global §7 expects a security pass before deploy, but
  the project only offers the `/security-review` skill — there is no agent counterpart to
  the review/debug/test trio. Fine as-is, but worth a conscious decision.
- **Agent-description language mix.** The `utility/claude` pair is written in Korean,
  while the `utility/git` pair and the `app/base` trio are in English. Descriptions are
  the discovery surface for agent selection; a single language would read more consistently.
- **Asymmetric skill design.** `vscode-extension-helper` has no author/reviewer pair,
  unlike the other two `utility` skills. This is intentional (guidance vs. artifact
  production), but the naming (`*-helper` for both) hides the difference.

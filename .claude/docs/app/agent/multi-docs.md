# Agent Team Reference — `.claude/agents` + orchestrating skills

> **Reference.** This document consolidates the project's agent "team" — the
> roster, how agents collaborate, and how they map to the global agent roles in
> `~/.claude/CLAUDE.md` §7. It is a Claude-facing reference, not a design proposal.
> Source of truth: [`../../../../CLAUDE.md`](../../../../CLAUDE.md) §"Agent Naming", the agent
> frontmatter under [`../../../agents/`](../../../agents/), and each `SKILL.md` under
> [`../../../skills/`](../../../skills/). Sibling reference docs:
> [`../base/typescript-code-docs.md`](../base/typescript-code-docs.md),
> [`../../utility/vscode/extension-config-docs.md`](../../utility/vscode/extension-config-docs.md).

## Overview

This repository uses two distinct collaboration models. Do not conflate them:

1. **Author → reviewer skill pipeline** — a skill orchestrates a two-agent team
   (author drafts, reviewer verifies with a PASS/REDO verdict), writing the result to
   a target path only on PASS. Used for `.claude` config artifacts and commit messages.
2. **Role-based single-agent invocation** — one specialised agent is activated for a
   task (analyze, review, debug, test). Review/debug/test map from the generic roles the
   global `CLAUDE.md` §7 names; analyze is an additional project-specific role with no §7
   counterpart. No draft/verify loop; the agent acts directly.

Above the role-based agents sits a **multi-step orchestrator** — the `multi-team` agent —
which coordinates several `app/base` specialists across one compound task (e.g. analyze → fix →
test), delegating via the Agent tool and synthesizing one consolidated report. It is distinct
from the single-route `typescript-code-helper` skill: the skill dispatches to exactly one
specialist, the orchestrator sequences several.

A further category — **guidance-only skills** — provides quick inline structure/API guidance
with no paired agent team (distinct from the `typescript-code-analyzer` agent, which
produces a deep multi-file analysis report).

## Roster

All agents live under [`../../../agents/`](../../../agents/).

| Agent | Path | Model | Tools | Role |
| --- | --- | --- | --- | --- |
| `multi-team` | [`app/agent/`](../../../agents/app/agent/multi-team.md) | opus | Agent, Read, Grep, Glob, Bash | Multi-step orchestrator — coordinates the four `app/base` specialists across one compound task |
| `typescript-code-analyzer` | [`app/base/`](../../../agents/app/base/typescript-code-analyzer.md) | opus | Read, Grep, Glob, Bash | Proactive structural / code-health analysis (read-only) |
| `typescript-code-reviewer` | [`app/base/`](../../../agents/app/base/typescript-code-reviewer.md) | opus | Read, Grep, Glob, Bash | Quality review, flags MUST/SHOULD/CONSIDER |
| `typescript-code-debugger` | [`app/base/`](../../../agents/app/base/typescript-code-debugger.md) | opus | Read, Grep, Glob, Bash | Root-cause tracing (read-only) |
| `typescript-code-tester` | [`app/base/`](../../../agents/app/base/typescript-code-tester.md) | opus | Read, Write, Edit, Grep, Glob, Bash | `@vscode/test-cli` + Mocha integration tests |
| `claude-code-config-author` | [`utility/claude/`](../../../agents/utility/claude/code-config-author.md) | sonnet | Bash, Read, Write | Drafts `.claude` config artifacts |
| `claude-code-config-reviewer` | [`utility/claude/`](../../../agents/utility/claude/code-config-reviewer.md) | sonnet | Bash, Read, Write | Verifies drafts → PASS/REDO |
| `git-commit-message-author` | [`utility/git/`](../../../agents/utility/git/commit-message-author.md) | sonnet | Bash, Read, Write | Drafts Conventional Commits message |
| `git-commit-message-reviewer` | [`utility/git/`](../../../agents/utility/git/commit-message-reviewer.md) | sonnet | Bash, Read, Write | Verifies commit draft → PASS/REDO |

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
| [`cc-config-helper`](../../../skills/cc-config-helper/SKILL.md) | `claude-code-config-author` → `claude-code-config-reviewer` | `.claude/agents\|skills\|commands\|rules/**`, `.claude/settings.json`, `CLAUDE.md` | `./.claude/tmp/utility/claude/` |
| [`git-commit-helper`](../../../skills/git-commit-helper/SKILL.md) | `git-commit-message-author` → `git-commit-message-reviewer` | a git commit | `./.claude/tmp/utility/git/` |

### Role-based invocation

The `app/base` agents are invoked directly, with no draft/verify handoff. Three
(`typescript-code-reviewer` / `-debugger` / `-tester`) are the concrete implementation of
the generic roles in the global `CLAUDE.md` §7; `typescript-code-analyzer` is a fourth,
project-specific proactive structure/health analysis role with no §7 counterpart. The
[`typescript-code-helper`](../../../skills/typescript-code-helper/SKILL.md) skill routes
across all four, and the [`typescript-code-review`](../../../commands/app/base/typescript-code-review.md)
command fronts the per-file review role.

### Multi-agent orchestration

For a **compound** request that needs more than one specialist, the
[`multi-team`](../../../agents/app/agent/multi-team.md) agent coordinates the four `app/base`
agents (and the per-file review command) across a single task — fanning out the read-only
passes, running the test author last, and synthesizing one consolidated report. It delegates
via the Agent tool and carries no `Write` / `Edit` itself. Contrast with `typescript-code-helper`,
which dispatches to exactly one specialist: the skill is single-route, the orchestrator
sequences several. There is no PASS/REDO loop here (that belongs to the author → reviewer
pipelines above).

### Guidance-only skills

[`vscode-extension-helper`](../../../skills/vscode-extension-helper/SKILL.md)
analyses extension structure and guides VSCode API usage. It has **no paired agent team**.

## Global role mapping (`CLAUDE.md` §7 → this project)

| Global role | This project |
| --- | --- |
| `code-reviewer` (after code changes) | `typescript-code-reviewer` |
| debugging | `typescript-code-debugger` (read-only) |
| test authoring | `typescript-code-tester` |
| `security-auditor` (before deploy) | no dedicated agent — use the `/security-review` skill |
| _(no §7 role)_ | `typescript-code-analyzer` — project-specific proactive structure/health analysis (read-only), comparable to how the security pass is skill-only |
| _(no §7 role)_ | `multi-team` — multi-step orchestrator that coordinates the `app/base` specialists for compound tasks |

## Known gaps / inconsistencies

- **No `security-auditor` agent.** Global §7 expects a security pass before deploy, but
  the project only offers the `/security-review` skill — there is no agent counterpart to
  the review/debug/test agents. Fine as-is, but worth a conscious decision.
- **Agent-description language mix.** The `utility/claude` pair is written in Korean,
  while the `utility/git` pair and the `app/base` agents (`analyzer` / `reviewer` /
  `debugger` / `tester`) plus the `multi-team` orchestrator are in English. Descriptions
  are the discovery surface for agent selection; a single language would read more consistently.
- **Asymmetric skill design.** `vscode-extension-helper` has no author/reviewer pair,
  unlike the other two `utility` skills. This is intentional (guidance vs. artifact
  production), but the naming (`*-helper` for both) hides the difference.

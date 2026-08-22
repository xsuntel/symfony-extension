# Agent Team Reference — `.claude/agents` + orchestrating skills

> **Reference.** This document consolidates the project's agent "team" — the
> roster, how agents collaborate, and how they map to the global agent roles in
> `~/.claude/CLAUDE.md` "에이전트 사용 규칙". It is a Claude-facing reference, not a design proposal.
> Source of truth: [`../../CLAUDE.md`](../../CLAUDE.md) §"Agent Naming", the agent
> frontmatter under [`../agents/`](../agents/), and each `SKILL.md` under
> [`../skills/`](../skills/). Sibling reference docs:
> [`app-typescript-code-docs.md`](app-typescript-code-docs.md),
> [`tools-vscode-extension-docs.md`](tools-vscode-extension-docs.md).

## Overview

This repository uses two distinct collaboration models. Do not conflate them:

1. **Author → reviewer skill pipeline** — a skill orchestrates a two-agent team
   (author drafts, reviewer verifies with a PASS/REDO verdict), writing the result to
   a target path only on PASS. Used for commit messages. (`utility-claude-code-skill` no longer
   uses this model — it drafts and self-reviews **inline** in the skill; see below.)
2. **Role-based single-agent invocation** — one specialised agent is activated for a
   task (analyze, review, debug, test). Review/debug/test map from the generic roles the
   global `CLAUDE.md` "에이전트 사용 규칙" names; analyze is an additional project-specific
   role with no counterpart there. No draft/verify loop; the agent acts directly.

Above the role-based agents sits a **multi-step orchestrator** — the `agent-team`
agent — which coordinates several `app/` specialists across one compound task (e.g. analyze → fix →
test), delegating via the Agent tool and synthesizing one consolidated report. It is distinct
from the single-route `app-typescript-code-skill`: the skill dispatches to exactly one
specialist, the orchestrator sequences several.

A further category — **guidance-only skills** — provides quick inline structure/API guidance
with no paired agent team (distinct from the `app-typescript-code-analyzer` agent, which
produces a deep multi-file analysis report).

## Roster

All agents live under [`../agents/`](../agents/).

| Agent | Path | Model | Tools | Role |
| --- | --- | --- | --- | --- |
| `agent-team` | [`agent-team.md`](../agents/agent-team.md) | opus | Agent, Read, Grep, Glob, Bash | Multi-step orchestrator — coordinates the four `app/` specialists across one compound task |
| `app-typescript-code-analyzer` | [`app-typescript-code-analyzer.md`](../agents/app-typescript-code-analyzer.md) | opus | Read, Grep, Glob, Bash | Proactive structural / code-health analysis (read-only) |
| `app-typescript-code-reviewer` | [`app-typescript-code-reviewer.md`](../agents/app-typescript-code-reviewer.md) | opus | Read, Grep, Glob, Bash | Quality review, flags MUST/SHOULD/CONSIDER |
| `app-typescript-code-debugger` | [`app-typescript-code-debugger.md`](../agents/app-typescript-code-debugger.md) | opus | Read, Grep, Glob, Bash | Root-cause tracing (read-only) |
| `app-typescript-code-tester` | [`app-typescript-code-tester.md`](../agents/app-typescript-code-tester.md) | opus | Read, Write, Edit, Grep, Glob, Bash | TDD cycle: failing test → minimal `app/src` change → refactor (`@vscode/test-cli` + Mocha) |
| `tools-vscode-extension-author` | [`tools-vscode-extension-author.md`](../agents/tools-vscode-extension-author.md) | sonnet | Read, Grep, Glob, Write, Edit, Bash | Scaffolds extension code/manifest against the API rule |
| `tools-vscode-extension-reviewer` | [`tools-vscode-extension-reviewer.md`](../agents/tools-vscode-extension-reviewer.md) | sonnet | Read, Grep, Glob, Bash | Verifies extension code for API conformance → PASS/REDO |
| `utility-git-commit-author` | [`utility-git-commit-author.md`](../agents/utility-git-commit-author.md) | sonnet | Bash, Read, Write | Drafts Conventional Commits message |
| `utility-git-commit-reviewer` | [`utility-git-commit-reviewer.md`](../agents/utility-git-commit-reviewer.md) | sonnet | Bash, Read, Write | Verifies commit draft (gate + re-derived diff) → PASS/REDO/STALLED |
| `utility-drawio-diagram-author` | [`utility-drawio-diagram-author.md`](../agents/utility-drawio-diagram-author.md) | opus | Bash, Read, Write, Edit, Glob, Grep, `mcp__drawio-tool__` (`list_pages`, `get_page`, `search_shapes`) | Drafts `.drawio` mxGraphModel XML |
| `utility-drawio-diagram-reviewer` | [`utility-drawio-diagram-reviewer.md`](../agents/utility-drawio-diagram-reviewer.md) | sonnet | Bash, Read, Write, Glob, Grep, `mcp__drawio-tool__` (`list_pages`, `get_page`) | Verifies diagram draft (gate + dropped-cell diff) → PASS/REDO/STALLED |

## Orchestration patterns

### Author → reviewer pipeline

Three skills drive an author/reviewer pair through this loop, differing only in where the author
writes. `utility-git-commit-skill` and `utility-drawio-diagram-skill` stage the draft and review in
`./.claude/tmp/` (gitignored) and write the target — the commit, or the `.drawio` page — only on
PASS. `tools-vscode-extension-scaffold-skill` has the author write extension code/manifest **in place**
under `app/`, then the reviewer verifies it read-only and an objective `tsc --noEmit` gate backs the
verdict. (`utility-claude-code-skill` used this model too,
but now self-reviews inline; see below.)

```text
skill → author (writes draft to .claude/tmp/…) → reviewer (PASS | REDO | STALLED)
  ├─ PASS    → write draft to target path, report, done
  ├─ REDO    → re-invoke author with the reviewer's fixes (max 2 retries)
  │            └─ still REDO after 2 → do NOT write; surface last draft for manual review
  └─ STALLED → same [MUST] repeated across rounds; stop at once, do NOT spend the last retry
```

The `utility-git-commit` and `utility-drawio-diagram` pairs additionally run a **shared mechanical
gate** — `.claude/skills/<skill>/scripts/gate.py`, one copy that the author runs as a self-check
before handoff and the reviewer runs as its Gate 1. Keeping it in a file rather than pasted into both
agents is what stops the two halves drifting apart, and clearing it author-side means review rounds
are spent on judgment rather than on format. Both reviewers **fail closed**: a gate that did not
execute yields REDO, never PASS.

| Skill | Author → Reviewer | Target | Intermediate |
| --- | --- | --- | --- |
| [`utility-git-commit-skill`](../skills/utility-git-commit-skill/SKILL.md) | `utility-git-commit-author` → `utility-git-commit-reviewer` | a git commit | `./.claude/tmp/utility/git/` |
| [`tools-vscode-extension-scaffold-skill`](../skills/tools-vscode-extension-scaffold-skill/SKILL.md) | `tools-vscode-extension-author` → `tools-vscode-extension-reviewer` | extension code/manifest under `app/` | none (author writes in place) |
| [`utility-drawio-diagram-skill`](../skills/utility-drawio-diagram-skill/SKILL.md) | `utility-drawio-diagram-author` → `utility-drawio-diagram-reviewer` | a `.drawio` file under `diagram/**` | `./.claude/tmp/utility/` |

The [`utility-claude-code-skill`](../skills/utility-claude-code-skill/SKILL.md)
skill is **not** an author→reviewer pipeline: it drafts the `.claude` config artifact and
self-reviews it **inline** (against `.claude/rules/utility-claude-code-rule.md` and the
`/utility-claude-code-review` criteria), then writes to the target path — no paired agents.

### Role-based invocation

The `app/` agents are invoked directly, with no draft/verify handoff. Three
(`app-typescript-code-reviewer` / `-debugger` / `-tester`) are the concrete implementation of
the generic roles in the global `CLAUDE.md` "에이전트 사용 규칙"; `app-typescript-code-analyzer` is a fourth,
project-specific proactive structure/health analysis role with no counterpart there. The
[`app-typescript-code-skill`](../skills/app-typescript-code-skill/SKILL.md) routes
across all four, and the [`app-typescript-code-review`](../commands/app-typescript-code-review.md)
command fronts the per-file review role.

### Multi-agent orchestration

For a **compound** request that needs more than one specialist, the
[`agent-team`](../agents/agent-team.md) agent coordinates the four
`app/` agents (and the per-file review command) across a single task — fanning out the read-only
passes, running the test author last, and synthesizing one consolidated report. It delegates
via the Agent tool and carries no `Write` / `Edit` itself. Contrast with `app-typescript-code-skill`,
which dispatches to exactly one specialist: the skill is single-route, the orchestrator
sequences several. There is no PASS/REDO loop here (that belongs to the author → reviewer
pipelines above).

### Guidance-only skills

[`tools-vscode-extension-config-skill`](../skills/tools-vscode-extension-config-skill/SKILL.md)
analyses extension structure and guides VSCode API usage. It has **no paired agent team**.

## Global role mapping (`CLAUDE.md` "에이전트 사용 규칙" → this project)

| Global role | This project |
| --- | --- |
| `code-reviewer` (after code changes) | `app-typescript-code-reviewer` |
| debugging | `app-typescript-code-debugger` (read-only) |
| test authoring | `app-typescript-code-tester` — TDD red-green-refactor cycle |
| `security-auditor` (before deploy) | no dedicated agent — use the `/security-review` skill |
| _(no global role)_ | `app-typescript-code-analyzer` — project-specific proactive structure/health analysis (read-only), comparable to how the security pass is skill-only |
| _(no global role)_ | `agent-team` — multi-step orchestrator that coordinates the `app/` specialists for compound tasks |

## Known gaps / inconsistencies

- **No `security-auditor` agent.** The global "에이전트 사용 규칙" section expects a security pass before deploy, but
  the project only offers the `/security-review` skill — there is no agent counterpart to
  the review/debug/test agents. Fine as-is, but worth a conscious decision.
- **`tools-vscode-extension-*` pair overlaps the `app/` specialists.** The
  `tools-vscode-extension-author` / `-reviewer` pair (orchestrated by
  `tools-vscode-extension-scaffold-skill`) does greenfield, in-place API scaffolding with a review +
  `tsc` gate, whereas the `app/` specialists review and test the existing extension's diffs. The
  `tools-` vs. `app-` prefixes now carry that split in the filenames — external API spec vs. this
  repository's own source — but in a single-extension repo the roles still sit close together, so it
  is worth a conscious decision if the tree grows.
- **Asymmetric skill design.** All six skills now share the `*-skill` suffix, but they run four
  different collaboration models: `utility-git-commit-skill` and
  `tools-vscode-extension-scaffold-skill` each drive their own author/reviewer pair,
  `utility-claude-code-skill` and
  `utility-shell-script-skill` draft and self-review inline, `tools-vscode-extension-config-skill` is
  guidance-only with no artifact production, and `app-typescript-code-skill` is a single-route
  dispatcher to one `app/` specialist.
  This is intentional, but the uniform suffix carries no signal about which model applies —
  the previous `*-helper` / `*-scaffold` split at least distinguished the scaffolding pipeline.

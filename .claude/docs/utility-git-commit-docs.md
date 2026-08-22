# Git Commit Message Reference — Author → Reviewer Pipeline

> **Reference.** Companion to the
> [`utility-git-commit-skill`](../skills/utility-git-commit-skill/SKILL.md) and its two
> agents,
> [`utility-git-commit-author`](../agents/utility-git-commit-author.md) →
> [`utility-git-commit-reviewer`](../agents/utility-git-commit-reviewer.md). It documents
> the Conventional Commits convention and the PASS/REDO/STALLED loop. Aligned with the global
> `~/.claude/CLAUDE.md` "코딩 규칙" (Conventional Commits). This is a Claude-facing reference, not a design
> proposal.

@see https://www.conventionalcommits.org/en/v1.0.0/ — Conventional Commits spec

## Pipeline

The `utility-git-commit-skill` drives a two-agent team in sequence and commits on a PASS
verdict. The intermediate draft and review land in `./.claude/tmp/utility/git/` (gitignored); the
commit is executed only on PASS.

```text
skill → precondition: git diff --cached --quiet  (must have staged changes)
      → author   → commit-message-draft.md      (the message, verbatim to git commit -F)
                 + commit-message-draft.meta.txt (scope rationale, files, omissions, unresolved)
                 └─ self-check: scripts/gate.py must clear every [MUST] before handoff
      → reviewer → commit-message-review.md  (PASS | REDO | STALLED; token alone on line 1)
                 ├─ Gate 1  scripts/gate.py — header/type/scope/72-char/body (mechanical)
                 └─ Gate 2  re-derives git diff --cached --stat itself — factuality
      ├─ PASS    → git commit -F …/commit-message-draft.md, report hash, stop
      ├─ REDO    → re-invoke author with revision instructions (retry at most 2×)
      │            └─ still REDO after 2 → do NOT commit; surface last draft, "manual review recommended"
      └─ STALLED → same [MUST] repeated across rounds; stop at once, do NOT spend the last retry
```

All intermediate files live in `./.claude/tmp/utility/git/` (gitignored).

| Skill | Author → Reviewer | Target | Intermediate |
| --- | --- | --- | --- |
| [`utility-git-commit-skill`](../skills/utility-git-commit-skill/SKILL.md) | `utility-git-commit-author` → `utility-git-commit-reviewer` | a git commit | `./.claude/tmp/utility/git/` |

## Format Criteria

The commit-message format criteria (allowed types, scope derivation, 72-char subject, body length,
factuality) are the SoT in
[`../rules/utility-git-commit-rule.md`](../rules/utility-git-commit-rule.md).
This reference does not restate them.

Severity (`[MUST]` blocks, `[SHOULD]` does not) is also part of that rule SoT.

## The Shared Gate

`.claude/skills/utility-git-commit-skill/scripts/gate.py` decides every mechanical criterion from the
message text alone — header shape, allowed type, allowed scope, 72-character subject, trailing
period, blank separator line, body length — printing `[MUST]` / `[SHOULD]` lines and exiting nonzero
iff any `[MUST]`.

It exists as **one file rather than a block pasted into each agent** so the author's self-check and
the reviewer's Gate 1 cannot drift apart. The author clearing it first means a review round is spent
on factuality and type/scope judgment rather than on subject length.

## Reviewer Verdict Behavior

The reviewer is the *independent* half of the pair: it re-derives the change from
`git diff --cached --stat` itself and treats the meta file's account as a cross-check, not a source —
a disagreement between the two is itself blocking, since it means the author read stale state.

It issues **PASS**, **REDO**, or **STALLED**, with the token alone on line 1 so the skill can branch
on it. Objective format and factuality only, never subjective style. It **fails closed**: a gate that
did not execute yields REDO, never PASS, because an unrun gate looks identical to a clean one. When a
verdict is genuinely uncertain it chooses REDO (a miss costs more than a false alarm, and a committed
message is permanent). It may not repair the draft — `disallowedTools: Edit`, and it must not `Write`
over the draft either.

`STALLED` reports a `[MUST]` unchanged from the previous round; the skill stops rather than spending
the remaining retry. Each invocation is an independent single-shot verdict; retry counting and the
commit itself are the **skill's** responsibility (retry at most 2×).

## I/O Paths

| Agent | Input | Output |
| --- | --- | --- |
| `utility-git-commit-author` | `git diff --cached` + `git log -10 --oneline` (+ reviewer's fixes on a rewrite) | `commit-message-draft.md` + `commit-message-draft.meta.txt` |
| `utility-git-commit-reviewer` | both author files + `git diff --cached` (re-derived, not taken on trust) | `commit-message-review.md` |

All paths are relative to `./.claude/tmp/utility/git/`. The draft holds the commit message and
nothing else, because `git commit -F` writes it to history verbatim; metadata lives only in the
sibling meta file.

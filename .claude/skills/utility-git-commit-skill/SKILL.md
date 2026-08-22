---
name: utility-git-commit-skill
description: "Based on the staged changes, drafts, reviews, and commits a Conventional Commits message as a two-person team (author/reviewer). Always use it for natural-language requests like 'commit message', '커밋 메시지', or '커밋 메시지 만들어줘'. Do not use it for a 'git commit -m' request that already provides the message."
allowed-tools:
  - Agent
  - Read
  - Grep
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git status:*)
  - Bash(git commit:*)
---

# Git Commit Skill

Invokes a two-person team (utility-git-commit-author → utility-git-commit-reviewer) in sequence to draft and
review a Conventional Commits message, and executes the commit on a PASS verdict.

- Commit message language: **English**
- Location of intermediate artifacts: `./.claude/tmp/` (gitignored)

---

## Workflow

1. **Precondition check**
   - Run `git diff --cached --quiet`.
   - Exit code 1 (staged changes present) passes; exit code 0 (no changes) means
     advise "Stage your changes with `git add` first" and stop.

2. **Invoke the author**
   - Invoke the `utility-git-commit-author` agent to generate **two** files:
     `./.claude/tmp/utility/git/commit-message-draft.md` (the commit message verbatim) and
     `./.claude/tmp/utility/git/commit-message-draft.meta.txt` (scope rationale, files, omissions).

3. **Invoke the reviewer**
   - Invoke the `utility-git-commit-reviewer` agent to generate `./.claude/tmp/utility/git/commit-message-review.md`.

4. **Verdict branch** — the verdict token stands alone on line 1 of the review file.
   - **PASS:** run `git commit -F ./.claude/tmp/utility/git/commit-message-draft.md`,
     report the commit hash and message, then stop.
   - **REDO:** include the revision instructions from `./.claude/tmp/utility/git/commit-message-review.md` in the
     author re-invocation prompt and repeat from step 2. **Retry at most 2 times.**
   - **STALLED:** the reviewer is reporting a `[MUST]` it already raised in the previous round, so the
     loop is not converging. **Stop immediately — do not spend the remaining retry and do not
     commit.** Surface the repeated finding and the last draft to the user.

5. **Retry-limit handling**
   - If it is still REDO after 2 retries, **do not commit.**
   - Present the last draft to the user and stop with the warning
     "Auto-approval limit reached — manual review recommended."

---

## Cautions When Committing

- **`commit-message-draft.md` is consumed verbatim by `git commit -F`** — every byte in it lands in
  git history. It holds the message and nothing else; all metadata lives in the sibling
  `commit-message-draft.meta.txt`, which is never passed to git.
- **Never hand-edit the draft before committing.** It is what the reviewer's gate was run against; an
  edit after review means committing something no verifier ever saw. Send it back through the loop.

---
name: git-commit-helper
description: "Based on the staged changes, drafts, reviews, and commits a Conventional Commits message as a two-person team (author/reviewer). Always use it for natural-language requests like 'commit message', '커밋 메시지', or '커밋 메시지 만들어줘'. Do not use it for a 'git commit -m' request that already provides the message."
allowed-tools: Agent, Read, Bash, Grep
---

# Git Commit Helper

Invokes a two-person team (git-commit-message-author → git-commit-message-reviewer) in sequence to draft and
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
   - Invoke the `git-commit-message-author` agent to generate `./.claude/tmp/utility/git/commit-draft.md`.

3. **Invoke the reviewer**
   - Invoke the `git-commit-message-reviewer` agent to generate `./.claude/tmp/utility/git/commit-review.md`.

4. **Verdict branch**
   - **PASS:** run `git commit -F ./.claude/tmp/utility/git/commit-draft.md`,
     report the commit hash and message, then stop.
   - **REDO:** include the revision instructions from `./.claude/tmp/utility/git/commit-review.md` in the
     author re-invocation prompt and repeat from step 2. **Retry at most 2 times.**

5. **Retry-limit handling**
   - If it is still REDO after 2 retries, **do not commit.**
   - Present the last draft to the user and stop with the warning
     "Auto-approval limit reached — manual review recommended."

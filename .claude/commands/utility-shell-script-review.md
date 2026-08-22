---
description: "Holds the authoring conventions and quality judgment criteria for shell scripts — provides two modes: review of an existing `.sh` file (MUST/SHOULD/CONSIDER) and self-verification of a new draft (PASS/REDO)."
argument-hint: "[path to the shell script file to analyze]"
---

Analyze the following shell script file:

**`$ARGUMENTS`**

> **When the argument is empty**, review the contents of @scripts/**/*.sh and fix/supplement them
> against the criteria below. Do not guess a target outside `scripts/**` — `.claude/hooks/**` holds
> only `.gitkeep` placeholders and contains no shell scripts.

The single source of truth (SoT) for the judgment criteria is **`utility-shell-script-style.md` for
shell style, and `utility-shell-script-rule.md` for operations/architecture** (bootstrap, global
variables, sourcing, idempotency, taxonomy). Read the references below at the start, cross-check each
clause against the target code, flag violations with the **exact line number**, and provide concrete
fixes (improved code snippets).

> **Caution:** this project deliberately differs from general Bash advice in places — the shebang is
> always `#!/bin/bash` (never `#!/usr/bin/env bash`), and an unrecoverable error terminates through
> `setExit` rather than a bare `exit 1` so the error banner is printed. Conversely, `set -euo pipefail`
> is **enabled** on line 3 of every script and must stay enabled. Judge only against the SoT
> documents, and verify a claim against the actual file before reporting it.

@see .claude/output-styles/utility-shell-script-style.md — judgment criteria (SoT: shebang · strict mode · naming · separators · source guard · `rm -rf` guard · anti-patterns)
@see .claude/rules/utility-shell-script-rule.md — judgment criteria (SoT: bootstrap · global variables · sourcing · idempotency · taxonomy · safety)
@see .claude/docs/utility-shell-script-docs.md — script inventory · global variable catalog · lifecycle table · worked examples
@see .claude/skills/utility-shell-script-skill/SKILL.md — the workflow entry point that runs Mode B
@see scripts/common/_abstract.sh — the origin of the lifecycle functions and global variables

## Judgment Modes

This command **holds both the authoring conventions and the judgment criteria**. The mode is determined
by what the target is.

| Mode | Target | Procedure | Output |
| --- | --- | --- | --- |
| **A. Existing file review** (default) | the real `.sh` file given as `$ARGUMENTS` | `## Review Procedure` | `[MUST]` / `[SHOULD]` / `[CONSIDER]` |
| **B. Draft self-verification** | `./.claude/tmp/utility/shell-script/script-draft.md` | `## Authoring Conventions` → `## Review Procedure` | `PASS` / `REDO` + correction instructions |

Mode B is the loop the `utility-shell-script-skill` skill runs when authoring a new script — in the same
session it produces a draft per `## Authoring Conventions`, self-verifies it via `## Review Procedure`,
then writes it to the target path on `PASS`, or on `REDO` rewrites applying only the correction
instructions (**at most 2 retries**; beyond that, stop and recommend manual review).

> Before 2026-08-16 a `utility-shell-script-author` / `utility-shell-script-reviewer` agent pair owned
> this loop. Since the judgment criteria converge on this single file, it was converted to
> command-based self-verification — the same shape as the Claude Code config (2026-08-08) and provider
> (2026-08-15) domains.

## Authoring Conventions (Mode B — drafting)

Before writing, read the shell style SoT and **1–2 existing scripts of the same kind** (the docs'
§1 Script Inventory lists all six), and follow their bootstrap, naming, and structure exactly. The
list below is a summary of the SoT; the output style is the source for the details and templates.

- **Shebang:** always `#!/bin/bash`. `#!/usr/bin/env bash` is forbidden; `#!/bin/sh` only for a POSIX-only script.
- **Strict mode:** `set -euo pipefail` is **enabled** on line 3, immediately before the header delimiter block.
- **Bootstrap:** a directly executed entry point follows the order `find_project_root` → `cd "${PROJECT_PATH}"` → guarded source of `scripts/common/_abstract.sh`. Sourced helpers (`_*.sh`) do not repeat the bootstrap.
- **Source guard:** place an `if [ -f ... ]` existence check before every `source` (no bare source), and keep the path in the `else` message identical to the one the `if` tests.
- **Naming:** lifecycle-phase functions are `camelCase` with a `set` prefix (`setStart` · `setPlatform` · `setEnd`), reusable helpers are `snake_case` (`find_project_root`). Always expand variables as `"${VAR}"`; locals are `UPPER_CASE`.
- **Separators:** comment delimiters are 120-column lines (`# ` + 118 dashes, or `  # ` + 116 dashes when indented two spaces); runtime `echo` banners use a 111-character run.
- **Termination:** `setExit` (error, `exit 1`) / `setEnd` (normal, `exit 0`) rather than a bare `exit`. Under `set -e` a bare `exit` in a sourced helper kills the caller with no banner. `rm -rf` uses the `rm -rf "${VAR:?}/path"` guard.
- **Menus · platforms:** interactive selection uses `select` + `PS3` + `$REPLY`, offering only the environments the script supports. Platform branching covers Linux/Darwin/Windows plus an `else` → `setExit`.

**Authoring principles**

- **Comment language: English** (comment only the why/constraint, omit the what) — the project shell style convention.
- Mirror the bootstrap, separator widths, and phase order of an existing script of the same kind — do not invent new conventions.
- Use only the global variable names in the docs' §4 catalog, and do not invent non-existent globals, helpers, or paths. Anything function-scoped must be `local` or added to `setEnd()`'s unset list.
- Unless explicitly requested, leave no placeholders like `# TODO` — write a **complete, runnable script** starting from the shebang.
- Record the draft at `./.claude/tmp/utility/shell-script/script-draft.md` (when writing via Bash, run `mkdir -p .claude/tmp/utility/shell-script` first).

## Review Procedure

Cross-check each SoT item: shebang · strict mode (confirm it is **enabled**) · variable quoting
(`"${VAR}"`) · `local` discipline · function naming (lifecycle = `camelCase`, helper = `snake_case`) ·
source guard (source only after an existence check, with a matching `else` path) · path handling
(`find_project_root` · `PROJECT_PATH`) · platform branching (Linux/Darwin/Windows + `else setExit`) ·
separator widths (120-column comments, 111-character banners) · logging format (`[ LABEL ]`) ·
security (input validation, command injection, the `rm -rf "${VAR:?}"` guard) · duplication.

Additionally, confirm the following:

- **No repeated bootstrap** — does a sourced helper (`_*.sh`) avoid repeating the `find_project_root` · `_abstract.sh` sourcing block?
- **Exit handling** — does it use `setExit` (unrecoverable) / `setEnd` (normal termination) rather than a bare `exit`, especially inside a sourced file?
- **Variable leakage** — is every function-scoped variable either `local` or unset by `setEnd()`?
- **Lint gate** — does `bash -n <file>` pass, and does `shellcheck <file>` emit no code outside `SC2034` / `SC2155` (mandatory before merge)? There is no project `.shellcheckrc`; those two codes are the measured baseline of the existing scripts and are expected under this project's conventions, so do **not** report them as findings. A genuine false positive in any other code is suppressed per line with an explanatory `# shellcheck disable=SCxxxx`.
- **Reference factuality** — do the findings and fixes reference only global variables, functions, and paths that actually exist? Verify each against `scripts/common/_abstract.sh` and the docs' §1 inventory before reporting it. Do not judge a script against an architecture the repository does not have.

## Output Format — Mode A (existing file review)

### Summary

| Category | Status | Issue count |
| --- | --- | --- |
| Safety & error handling | ✅ / ⚠️ / ❌ | N |
| Variable declaration | ✅ / ⚠️ / ❌ | N |
| Function design | ✅ / ⚠️ / ❌ | N |
| Sourcing guards | ✅ / ⚠️ / ❌ | N |
| Path handling | ✅ / ⚠️ / ❌ | N |
| Portability | ✅ / ⚠️ / ❌ | N |
| Logging & output | ✅ / ⚠️ / ❌ | N |
| Security | ✅ / ⚠️ / ❌ | N |
| Code duplication | ✅ / ⚠️ / ❌ | N |

### Critical Issues (must fix)

For each issue: **[Line N]** `[MUST]` description → recommended fix including a code snippet.

### Improvement Suggestions (recommended)

For each suggestion: **[Line N]** `[SHOULD]` description → recommended approach.

### Refactoring Suggestions

Mark structural changes (function extraction, consolidating shared utilities, etc.) as `[CONSIDER]` and
describe them with before/after code examples. Only `[MUST]` blocks a merge.

## Output Format — Mode B (draft self-verification)

Record the result at `./.claude/tmp/utility/shell-script/script-review.md` in the format below.

- **Verdict:** PASS | REDO
- **Reason:** 2–3 lines of specific rationale
- **Correction instructions:** only on REDO — specific enough to apply directly in the rewrite

**Verdict principles**

- Use **only the objective criteria** in `## Review Procedure`, not subjective writing quality.
- Issue a REDO only when a rewrite is actually needed — convention deviation, a safety defect (missing guard, destructive command), or a non-existent reference.
- When the verdict is uncertain, choose REDO over PASS — a miss costs more than a false alarm.
- When applying a REDO, **do not arbitrarily change anything outside the correction instructions.**

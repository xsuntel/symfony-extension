---
paths:
  - "scripts/**/*.sh"
---

# Shell Script Rules (scripts/\*\*)

This rule is the judgment criteria (SoT) for Bash scripts under `scripts/**`. It enforces the safety,
portability, and structure of this project's `source`-based **modular script architecture**.

**Responsibility split (no duplication):** the single source of truth for **shell style** — shebang,
naming, delimiters, lifecycle skeleton — is the output-style. This rule does not restate style; it
enforces the **operational/architectural criteria** — bootstrap, global variables, sourcing,
idempotency, taxonomy. Detailed examples and catalogs live in the docs.

@see .claude/output-styles/utility-shell-script-style.md — shell style criteria/templates (SoT)
@see .claude/docs/utility-shell-script-docs.md — detailed examples: script inventory, global variables, bootstrap, anti-patterns
@see scripts/common/_abstract.sh — global variables / lifecycle function source

## Shebang · Strict Mode (non-negotiable)

- All scripts use `#!/bin/bash`. `#!/usr/bin/env bash` is forbidden. Use `#!/bin/sh` only for a
  script that must be POSIX-portable — none currently exists in this repository.
- `set -euo pipefail` is **enabled** on line 3 of every script, immediately before the header
  delimiter. Do not comment it out.
- Because strict mode is on, a bare `exit` inside a **sourced** helper terminates the calling shell.
  That is what `setEnd` (normal, `exit 0`) and `setExit` (error, `exit 1`) exist for — call them
  deliberately rather than writing a bare `exit` in a sourced file.

## Bootstrap · Sourcing

- A directly-executed entry point follows `find_project_root` → `cd "${PROJECT_PATH}"` → guarded
  source of `scripts/common/_abstract.sh`.
- Sourced helpers (`_*.sh`) do not repeat the bootstrap — they inherit `PROJECT_PATH`·`PLATFORM_TYPE`
  etc. from the calling script.
- Wrap every `source` in an existence check: `if [ -f ... ]; then source ... else echo "Please check ..." && exit fi`.
  No bare `source`. The message in the `else` branch must name the same path the `if` tests.

## Global Variable Discipline

- Use only global variable names declared or unset in `scripts/common/_abstract.sh` (catalog in the
  docs). Do not invent non-existent globals.
- Do not re-declare a global as `local` inside a function. On normal exit, `setEnd()` unsets the
  globals it knows about.
- A new script-scoped variable must either be declared `local`, or be added to `setEnd()`'s unset
  list. Several existing variables (`TODAY`, `DEFAULT_BRANCH`, `RELEASES_VERSION`, `BRANCH_TEMP`,
  `GIT_SAFE_DIRECTORY`) satisfy neither — do not copy that pattern into new code.
- Always expand variables quoted and braced (`"${VAR}"`).

## Naming · Structure

- Lifecycle-phase functions use `camelCase` with a `set` prefix (`setStart`·`setPlatform`·`setEnd`);
  reusable helpers use `snake_case` (`find_project_root`). Detailed order/skeleton is in the output-style.

## Safety (non-negotiable)

- `rm -rf` with a variable uses the `rm -rf "${VAR:?}/path"` guard — `:?` aborts on unset/empty.
- An unrecoverable error terminates via `setExit` (`exit 1`); normal completion uses `setEnd`
  (`exit 0`). Both are defined in `_abstract.sh` and print a banner, so prefer them over a bare
  `exit` even in an entry point.
- No hardcoded user paths (`/home/rlim/...`) → use `${PROJECT_PATH}`·`${HOME}`·`${USER}`. No
  hardcoded secrets → use an env file·`read -s`.
- No `eval`; temp files use `mktemp`+`trap`; instead of a `sleep N` timing assumption use
  `systemctl is-active`·polling.

## Portability · Idempotency

- Platform branching handles Linux/Darwin/Windows and must call `setExit` in the `else` (no silent
  pass-through). String comparison uses single brackets `[ "${X}" == "Y" ]`.
- Branch macOS/Linux command differences (`sed -i`·`date -d`) on `PLATFORM_TYPE`.
- **General guidance, for when package installation is added:** do not install packages
  unconditionally — install behind a `dpkg -l` (or `brew list` on macOS) check guard. No script in
  this repository installs packages today, so this is a forward-looking clause, not a description of
  existing code.

## Interactive Menu

- Environment selection uses `select` + `PS3="Menu: "` + `$REPLY` (not the text label), not
  `getopts`/positional arguments.

## Script Taxonomy

- `scripts/common/` (shared lifecycle and environment definitions, sourced by entry points) /
  `scripts/utility/<tool>/` (task entry points and their sourced helpers) / `scripts/tools/`
  (documentation only, no `.sh`). Inventory in the docs.

## Quality Gate (required before merge)

```bash
bash -n scripts/utility/git/tasks/start.sh      # syntax
shellcheck scripts/utility/git/tasks/start.sh   # lint
```

- ShellCheck emits **no code outside `SC2034` / `SC2155`**. There is no `.shellcheckrc`; those two
  codes are the measured baseline of the existing scripts and are expected under this project's
  conventions (see the output-style §ShellCheck). Zero output is not the bar — a new code is.
- Destructive-command guards confirmed; bootstrap/source guards confirmed.
- Classify review severity as `[MUST]` / `[SHOULD]` / `[CONSIDER]`; only `[MUST]` blocks a merge.
  Warn about dangerous commands with `> ⚠️ Caution:`.
- New scripts use the `utility-shell-script-skill` skill, which drafts and self-verifies inline (no
  agent pair); quality review of an existing file uses the `/utility-shell-script-review` command.

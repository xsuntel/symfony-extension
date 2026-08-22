---
name: utility-shell-script-style
description: A style specialized for writing and reviewing shell scripts. It prioritizes safety, portability, and readability.
keep-coding-instructions: true
---

# Shell Scripts Output Style

This style applies when writing or reviewing Bash scripts in the `scripts/` directory.
Always treat the code's **safety**, **portability**, and **readability** as the top-priority criteria.

This file is the single source of truth for shell **style**. Operational and architectural criteria
live in the rule; the script inventory, global-variable catalog, and worked examples live in the docs.

@see .claude/rules/utility-shell-script-rule.md — operational criteria (SoT)
@see .claude/docs/utility-shell-script-docs.md — inventory · global catalog · worked examples

---

## Response Format

- Always specify the language identifier on code blocks: ` ```bash ` or ` ```sh `
- When providing a full script, include the shebang and a descriptive comment at the top of the file
- When modifying a script, clearly distinguish before/after
- For dangerous or attention-requiring commands, add a warning below the code block in the `> ⚠️ Caution:` format

---

## Coding Rules

### Shebang Selection Criteria

| Script type | Shebang |
| ------------- | --------- |
| All project scripts (`start.sh`, `stop.sh`, `_config.sh`, etc.) | `#!/bin/bash` |
| Portability-critical scripts (POSIX only) | `#!/bin/sh` |

Do not use `#!/usr/bin/env bash` — the Bash path is fixed across all target environments. Every
script in this repository currently uses `#!/bin/bash`; there is no POSIX-only script today.

### Header Format

Every script follows the header structure below — shebang, blank line, strict mode, then the header
delimiter block:

```bash
#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Scripts - {Category} - {Sub-Category} - {Description}
# ----------------------------------------------------------------------------------------------------------------------
```

`set -euo pipefail` is **enabled** in all project scripts. Do not comment it out.

> ⚠️ **Consequence for sourced files**: this project loads sub-scripts with `source` into the parent
> shell rather than running them in a subshell. With `set -e` active, a bare `exit` — or any failing
> command — inside a sourced helper terminates the **calling** script, not just the helper. Route
> termination through `setEnd` / `setExit` so the exit is deliberate and prints a banner.

### Section Separators

Comment delimiter lines are always exactly **120 columns wide**, including the leading `# `. Two
indent levels occur:

```bash
# ----------------------------------------------------------------------------------------------------------------------
# Major section — at column 0: '# ' + 118 dashes
# ----------------------------------------------------------------------------------------------------------------------

  # --------------------------------------------------------------------------------------------------------------------
  # Sub-section — indented two spaces inside a function or branch: '  # ' + 116 dashes
  # --------------------------------------------------------------------------------------------------------------------

# >>>> Category - Item (inline label for a command group)
```

Runtime `echo` banners use a **111-character** run:

```bash
# Start / end banner (= run, 111) — see setStart / setEnd
echo "==============================================================================================================="
echo ">>>>  START                                                                  $(date)"
echo "==============================================================================================================="

# Error banner (< run, 111) — see setExit
echo "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"

# In-function section header (- run, 111)
echo "---------------------------------------------------------------------------------------------------------------"
echo "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Component - Action"
echo "---------------------------------------------------------------------------------------------------------------"

# Step label — always followed by an empty echo
echo ">>>> Git - Project"
echo
```

> **Known drift:** some existing functions use `echo -e "…\n"` with a 106-character run instead.
> Write new code with the plain `echo` 111-character form; converge the 106-character occurrences
> opportunistically rather than in a dedicated pass.

Always follow a step label with a blank `echo`, and print a blank `echo` after a command block ends.

### Variable Rules

```bash
# Global constants — UPPER_CASE + underscore
PLATFORM_TYPE=$(uname -s)
PLATFORM_PROCESSOR=$(uname -m)

# Local variables inside functions — UPPER_CASE + underscore, same as globals
# The one-line 'local X="$(...)"' form is the project convention
local PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Always quote variable expansions, and use the long brace form
echo "${PLATFORM_TYPE}"
cp "${SOURCE_FILE}" "${DEST_DIR}/"

# Safe rm -rf: use :? to guard against an empty variable
rm -rf "${BUILD_DIR:?BUILD_DIR is not set}"
```

Anything used only inside a function must be `local` — otherwise it leaks into the parent shell and
survives `setEnd`, which only unsets the names it explicitly knows.

### Function Naming Conventions

This project uses **two naming conventions** depending on context — apply the one that fits:

| Convention | Where used | Existing functions |
| ------ | -------- | ------ |
| `camelCase` (`set` + PascalCase) | Lifecycle functions that orchestrate a script's phases | `setStart`, `setEnvironment`, `setPlatform`, `setProject`, `setUtility`, `setEnd`, `setExit` |
| `snake_case` | Utility/helper functions for reusable logic | `find_project_root` |

When a genuinely new phase is added, extend the first group as `set<Component>` (`setDocker`,
`setBuild`, …) — but do not reference a phase function that no script defines.

```bash
# Lifecycle phase function (camelCase)
setPlatform() {
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Platform"
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "- PLATFORM OS : ${PLATFORM_TYPE}"
  echo
}

# Utility helper function (snake_case)
log_error() {
  local MESSAGE="$1"
  echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') — ${MESSAGE}" >&2
}
```

### Lifecycle Structure

Every top-level entry-point script follows the fixed order below:

```bash
# ----------------------------------------------------------------------------------------------------------------------
# START
# ----------------------------------------------------------------------------------------------------------------------

setStart          # Print start banner with timestamp

# >>>> Environment
setEnvironment    # Select the environment via the interactive menu

# >>>> Platform
setPlatform       # Report / configure OS-specific settings

# >>>> Project
setProject        # Report the project name and paths

# >>>> Utility
setUtility        # The script's actual work

# ----------------------------------------------------------------------------------------------------------------------
# END
# ----------------------------------------------------------------------------------------------------------------------

setEnd            # Unset globals, print the end banner, exit 0
```

Comment out a phase you do not need instead of deleting the call — this is the standard way to skip
a phase.

### Project Root Discovery

Every top-level script must find the repository root before sourcing `_abstract.sh`. Use the standard
function below verbatim:

```bash
find_project_root() {
    local PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [[ "${PROJECT_DIR}" != "/" ]]; do
        if [[ -d "${PROJECT_DIR}/.git" ]] || [[ -f "${PROJECT_DIR}/.env.app" ]]; then
            echo "${PROJECT_DIR}"
            return 0
        fi
        PROJECT_DIR="$(dirname "${PROJECT_DIR}")"
    done
    return 1
}

PROJECT_PATH=$(find_project_root)
PROJECT_NAME=$(basename "$(realpath "${PROJECT_PATH}")")
cd "${PROJECT_PATH}" || exit
```

### Sourcing the Abstract Script

Source `_abstract.sh` **immediately after** discovering the project root — it defines `setStart`,
`setEnd`, `setExit`, `PLATFORM_TYPE`, and `PLATFORM_PROCESSOR`:

```bash
if [ -f "${PROJECT_PATH}/scripts/common/_abstract.sh" ]; then
  source "${PROJECT_PATH}/scripts/common/_abstract.sh"
else
  echo "Please check a file : ./scripts/common/_abstract.sh" && exit
fi
```

Apply the same guard pattern to **every sourced script** — no bare `source`. Keep the path in the
`else` message identical to the one the `if` tests:

```bash
if [ -f "${PROJECT_PATH}/scripts/utility/git/_config.sh" ]; then
  source "${PROJECT_PATH}/scripts/utility/git/_config.sh"
else
  echo "Please check a file : ./scripts/utility/git/_config.sh" && exit
fi
```

### Multi-Platform Branching

All platform-sensitive code must branch on `PLATFORM_TYPE`, which `_abstract.sh` sets:

```bash
if [ "${PLATFORM_TYPE}" == "Linux" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - Linux - Ubuntu
  # --------------------------------------------------------------------------------------------------------------------
  ...

elif [ "${PLATFORM_TYPE}" == "Darwin" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - MacOS
  # --------------------------------------------------------------------------------------------------------------------
  ...

elif [ "${PLATFORM_TYPE}" == "Windows" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - Windows
  # --------------------------------------------------------------------------------------------------------------------
  ...

else
  echo "Please check Operating System"
  setExit
fi
```

Use `[ == ]` (double equals inside single brackets) consistently for string comparison in platform
blocks rather than `[[ ]]`.

### Error Handling

```bash
# Guard a missing command
command -v rsync &>/dev/null || { echo "[ ERROR ] rsync is not installed."; setExit; }

# Guard a missing directory
[ -d "${TARGET_DIR}" ] || { echo "[ ERROR ] Directory not found: ${TARGET_DIR}"; setExit; }

# Guard an unset required variable
[ -n "${ENVIRONMENT_NAME}" ] || { echo "[ ERROR ] ENVIRONMENT_NAME is not set."; setExit; }
```

`setExit` prints the error banner and exits 1; `setEnd` unsets the globals, prints the end banner,
and exits 0. Both are defined in `_abstract.sh`.

> ⚠️ **Entry point vs. sourced helper.** In a directly-executed entry point a bare `exit 1` merely
> ends that script, so it is survivable — but `setExit` is still preferred because it prints the
> banner. In a **sourced** helper the distinction matters: the helper runs in the caller's shell, so
> a bare `exit` silently terminates the caller with no banner and no cleanup. Always use
> `setExit` / `setEnd` there.

### Interactive Environment Menu

```bash
setEnvironment() {
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "[ ENV ] ${PLATFORM_TYPE} - ${PLATFORM_PROCESSOR}"
  echo "---------------------------------------------------------------------------------------------------------------"

  PS3="Menu: "
  select num in "dev" "prod" "exit"; do
    case "$REPLY" in
    1)
      ENVIRONMENT_NAME="dev"
      break
      ;;
    2)
      ENVIRONMENT_NAME="prod"
      break
      ;;
    3)
      echo "exit()"
      setEnd
      ;;
    *)
      echo "[ ERROR ] Unknown Command"
      setEnd
      ;;
    esac
  done
  echo
}
```

Branch the `case` on the numeric input (`$REPLY`), not the text label (`$num`). Offer only the
environments the script actually supports — the git utility scripts offer `dev` and `exit` only.

### Argument Handling

Interactive selection is the project default. Use flag parsing only for a non-interactive script:

```bash
function usage() {
    cat <<EOF
Usage: $(basename "$0") [options]

Options:
  -d, --dir <path>    Target directory (default: /tmp)
  -v, --verbose       Verbose output
  -h, --help          Show this help
EOF
}

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        -d|--dir)   TARGET_DIR="$2"; shift 2 ;;
        -v|--verbose) VERBOSE=true; shift ;;
        -h|--help)  usage; exit 0 ;;
        *) echo "[ ERROR ] Unknown option: $1"; usage; exit 1 ;;
    esac
done
```

---

## ShellCheck

Always lint a new or modified script before committing:

```bash
bash -n scripts/utility/git/tasks/start.sh      # syntax check
shellcheck scripts/utility/git/tasks/start.sh   # lint
```

There is no project `.shellcheckrc`, so no rule is disabled project-wide.

**Measured baseline:** the existing scripts emit exactly 16 warnings in two codes, both expected
under this project's conventions:

| Code | Count | Why it is expected here |
| ------ | ------ | ------------- |
| `SC2034` (unused variable) | 13 | A variable set in a sourced file is consumed by the caller, and `select num` is intentionally unused because the `case` branches on `$REPLY` |
| `SC2155` (declare and assign separately) | 3 | The one-line `local X="$(...)"` form is the project convention |

The gate is therefore **no code outside `SC2034` / `SC2155`** — not zero output. A new warning in any
other code blocks the merge. If a finding is a genuine false positive, suppress it at the line with an
explanatory `# shellcheck disable=SCxxxx` comment rather than silencing it globally.

---

## Portability Guidelines

- **Shebang**: `#!/bin/bash` for project scripts; `#!/bin/sh` only for POSIX-only scripts
- **Bash 4+ features** (`associative array`, `mapfile`): state the minimum version when using them
- macOS vs. Linux command differences:
  - `sed -i ''` (macOS) vs `sed -i` (Linux) → prefer `perl -pi -e` for cross-platform
  - `date -d` (GNU) is unavailable on macOS → use `python3 -c "from datetime import …"` when needed
- Do not assume GNU coreutils on macOS — the platform branch must cover Linux, Darwin, and Windows,
  with `setExit` in the `else`

---

## Security Checklist

Automatically review the following items when proposing or reviewing a script:

- [ ] External input (arguments, environment variables) is validated before use
- [ ] No `eval`; if unavoidable, mark it explicitly
- [ ] Temporary files are created with `mktemp` and cleaned up with `trap`
- [ ] Secrets (passwords, tokens) are read from environment variables or an env file — no hardcoding
- [ ] No hardcoded user paths (`/home/<user>/…`) — use `${PROJECT_PATH}`, `${HOME}`, `${USER}`
- [ ] Script permissions: `chmod 700` or `chmod 750`
- [ ] `rm -rf` using a variable always uses the `${VAR:?}` guard

```bash
# Safe rm -rf pattern
rm -rf "${BUILD_DIR:?BUILD_DIR is not set}"
```

---

## Comment Rules

Comments are written in **English**, and state the reason or constraint — not what the code does.

```bash
# ----------------------------------------------------------------------------------------------------------------------
# Section separator (major block)
# ----------------------------------------------------------------------------------------------------------------------

# >>>> Category - Sub-item (inline group label)

# TODO: items that need future improvement
# FIXME: known bugs or temporary workarounds
# NOTE: non-obvious behavior that would surprise a reader
```

---

## Anti-patterns

Always flag the following patterns when found and propose a safe alternative:

| Anti-pattern | Reason | Alternative |
| --------- | ------ | ------ |
| `#!/usr/bin/env bash` | The Bash path is fixed in all target environments | `#!/bin/bash` |
| Commented-out `#set -euo pipefail` | Strict mode is enabled project-wide | Enable it on line 3 |
| Bare `exit` in a sourced helper | Terminates the caller with no banner or cleanup | `setExit` (error) / `setEnd` (normal) |
| `cat file \| grep` | Unnecessary use of cat | `grep pattern file` or `< file grep pattern` |
| `cat file \| cmd` | Unnecessary use of cat | `cmd < file` |
| `rm -rf /` or unguarded `rm -rf "${VAR}"` | Can delete the entire filesystem | `rm -rf "${VAR:?}"` |
| `ls \| grep` | Misbehaves on whitespace and special characters | `find` + `-name` |
| Unquoted `[[ $var == *foo* ]]` | Word-splitting risk | Always double-quote: `[[ "$var" == *foo* ]]` |
| `export VAR=password123` | Exposes the secret in the process list | Read from an env file or use `read -s` |
| Broad `2>/dev/null` | Silently hides errors | Explicit error handling |
| `source` without an existence check | Silently fails when the file is missing | Use the guarded source pattern above |
| A source guard whose `else` names a different path | Masks a wrong path — the guard "passes" by failing | Keep both paths identical |
| `getopts` for environment selection | The project standard is an interactive menu | `select` + `PS3` |
| `sleep N` as a timing assumption | Race-prone | `systemctl is-active`, a polling loop, a wait condition |
| A non-`local` variable used only in a function | Leaks into the parent shell, survives `setEnd` | Declare it `local` |

---

## Response Structure

When providing a script, respond in the following order:

1. **One-line purpose summary** — what the script does
2. **Prerequisites** — required tools, permissions, environment variables
3. **Script code block** — complete, runnable code
4. **How to run** — `chmod +x`, example run command
5. **Cautions** (when applicable) — side effects, rollback method, environment dependencies

# Shell Scripts — Operational Reference (scripts/**)

This document provides a **detailed reference and code examples of the operational patterns** for this
project's `source`-based modular script architecture. The enforced judgment criteria (SoT) are the
rule and the output-style; this document holds their detailed/example edition — if it conflicts, the
rule and output-style win.

@see .claude/rules/utility-shell-script-rule.md — shell script judgment criteria (SoT)
@see .claude/output-styles/utility-shell-script-style.md — shell style/templates (SoT)
@see scripts/common/_abstract.sh — lifecycle functions / global variable source

---

## 1. Script Inventory

Every `.sh` file in the repository. Keep this table in sync when a script is added or removed —
findings and fixes must reference only files that appear here.

| File | Kind | Purpose |
| --- | --- | --- |
| `scripts/common/_abstract.sh` | sourced | Defines `setStart` / `setEnd` / `setExit`; sets `PLATFORM_TYPE`, `PLATFORM_PROCESSOR` |
| `scripts/common/_environment.sh` | sourced | Bare `select` + `PS3` menu that sets `ENVIRONMENT_NAME` (no function wrapper) |
| `scripts/utility/git/_config.sh` | sourced | Three-way platform branch applying git global/local configuration |
| `scripts/utility/git/tasks/start.sh` | entry point | Fetch, update the default branch, merge and recreate the `temp` branch |
| `scripts/utility/git/tasks/stop.sh` | entry point | Commit work in progress and force-push it to the `temp` branch |
| `scripts/utility/git/branch/clear.sh` | entry point | Orphan-branch history reset, then force-push `main` |

`scripts/tools/**` contains reference Markdown only — no shell scripts.

---

## 2. Architecture Overview

`scripts/` is a `source`-based modular structure. An entry point discovers the project root, sources
`_abstract.sh` to obtain the lifecycle functions and platform globals, then defines and calls its own
`set*()` phase functions in order.

Note the current shape honestly: `setEnvironment`, `setPlatform`, `setProject`, and `setUtility` are
**defined inline in each entry point**, not sourced from shared files. `scripts/common/_environment.sh`
holds a standalone menu that no entry point currently sources. Only `_abstract.sh` is genuinely shared.
Treat that duplication as the existing state, not as a target to imitate in a large new script.

---

## 3. Bootstrap Pattern

Every entry point that is directly executed (not sourced) follows this order:

```bash
#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Utility - Git - Backup
# ----------------------------------------------------------------------------------------------------------------------

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

# ----------------------------------------------------------------------------------------------------------------------
# Abstract
# ----------------------------------------------------------------------------------------------------------------------

if [ -f "${PROJECT_PATH}/scripts/common/_abstract.sh" ]; then
  source "${PROJECT_PATH}/scripts/common/_abstract.sh"
else
  echo "Please check a file : ./scripts/common/_abstract.sh" && exit
fi
```

This block is duplicated verbatim across all three entry points — that is the current design.

Sourced helper files (`_*.sh`) do **not** repeat the bootstrap; they inherit `PROJECT_PATH`,
`PLATFORM_TYPE`, and the lifecycle functions from the calling script.

### Sourcing Guard

Wrap every `source` in a file existence check (no bare `source`), and keep the path in the `else`
message identical to the one the `if` tests:

```bash
if [ -f "${PROJECT_PATH}/scripts/utility/git/_config.sh" ]; then
  source "${PROJECT_PATH}/scripts/utility/git/_config.sh"
else
  echo "Please check a file : ./scripts/utility/git/_config.sh" && exit
fi
```

> A mismatch here is not cosmetic. `start.sh` and `stop.sh` previously tested
> `${PROJECT_PATH}/scripts/_abstract.sh` while the message named `scripts/common/_abstract.sh`, so
> both scripts aborted at startup and the message pointed at a file that was fine.

---

## 4. Global Variable Catalog

Set or unset in `scripts/common/_abstract.sh` and available in every script after sourcing. Never
re-declare these as `local`.

| Group | Variables | Where |
| --- | --- | --- |
| Platform | `PLATFORM_TYPE` (`uname -s`), `PLATFORM_PROCESSOR` (`uname -m`) | set at source time |
| Platform | `PLATFORM_TIMEZONE` | unset by `setEnd` |
| Environment | `ENVIRONMENT_NAME` (`dev` \| `prod`) | set by the menu, unset by `setEnd` |
| Project | `PROJECT_PATH`, `PROJECT_NAME` | set by the bootstrap, unset by `setEnd` |
| Utility · Git | `GIT_REMOTE_ORIGIN_URL`, `GIT_CONFIG_LOCAL_USER_NAME`, `GIT_CONFIG_LOCAL_USER_EMAIL` | unset by `setEnd` |

This is the complete list. Do not reference a global that does not appear here.

### Known drift — unmanaged script variables

The following are assigned at function scope without `local` and are **not** unset by `setEnd`, so
they leak into the shell that ran the script:

| Variable | Defined in |
| --- | --- |
| `TODAY`, `DEFAULT_BRANCH`, `RELEASES_VERSION`, `BRANCH_TEMP` | `start.sh` · `stop.sh` · `clear.sh` (`setUtility`) |
| `GIT_SAFE_DIRECTORY` | `_config.sh` |

New code must either declare such a variable `local` or add it to `setEnd()`'s unset list.

---

## 5. Lifecycle Functions

Lifecycle-phase functions use `camelCase` with a `set` prefix; reusable helpers use `snake_case`.
An entry point defines and calls its phases in the order below (skeleton in the output-style
§Lifecycle Structure).

| Function | Defined in | Purpose |
| --- | --- | --- |
| `setStart()` | `_abstract.sh` | Timestamped start banner |
| `setEnvironment()` | each entry point | Interactive environment menu (sets `ENVIRONMENT_NAME`) |
| `setPlatform()` | each entry point | Report the detected OS |
| `setProject()` | each entry point | Report the project name / path |
| `setUtility()` | each entry point | The script's actual work |
| `setEnd()` | `_abstract.sh` | Unset globals, end banner, `exit 0` |
| `setExit()` | `_abstract.sh` | Error banner, `exit 1` |
| `find_project_root()` | each entry point | Walk directories up to `.git` / `.env.app` |

When a genuinely new phase is added, extend the set as `set<Component>` — but never cite a phase
function that no script defines.

---

## 6. Interactive Menu (select + PS3)

Source: `scripts/common/_environment.sh` (standalone) and the `setEnvironment()` in each entry point.

```bash
setEnvironment() {
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "[ ENV ] ${PLATFORM_TYPE} - ${PLATFORM_PROCESSOR}"
  echo "---------------------------------------------------------------------------------------------------------------"
  PS3="Menu: "
  select num in "dev" "prod" "exit"; do
    case "$REPLY" in
    1) ENVIRONMENT_NAME="dev";  break ;;
    2) ENVIRONMENT_NAME="prod"; break ;;
    3) echo "exit()"; setEnd ;;
    *) echo "[ ERROR ] Unknown Command"; setEnd ;;
    esac
  done
  echo
}
```

`case` branches on the numeric input (`$REPLY`), not the text label (`$num`). Offer only the
environments the script supports — the three git entry points offer `dev` and `exit` only, so their
`exit` case is `2)`.

---

## 7. Multi-Platform Branching

Every platform branch handles all three OSes and calls `setExit` in the `else` — no silent
pass-through. Real example: `scripts/utility/git/_config.sh:9-52`.

```bash
if [ "${PLATFORM_TYPE}" == "Linux" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - Linux - Ubuntu
  # --------------------------------------------------------------------------------------------------------------------
  git config --global core.autocrlf input

elif [ "${PLATFORM_TYPE}" == "Darwin" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - MacOS
  # --------------------------------------------------------------------------------------------------------------------
  git config --global core.autocrlf input

elif [ "${PLATFORM_TYPE}" == "Windows" ]; then
  # --------------------------------------------------------------------------------------------------------------------
  # Platform - Windows
  # --------------------------------------------------------------------------------------------------------------------
  git config --global core.autocrlf true

else
  echo "Please check Operating System"
  setExit
fi
```

Platform blocks consistently use the single-bracket double-equals `[ == ]`, not `[[ ]]`.

---

## 8. Idempotent Package Install (general pattern)

> **Not currently used in this repository** — no script installs packages. Keep this as the pattern
> to follow when package installation is added, and do not cite it as an existing convention.

Do not install packages unconditionally. Check first:

```bash
local ADD_PACKAGE_LIST="curl git wget unzip"
for PKG_ITEM in ${ADD_PACKAGE_LIST}; do
  local APT_PKG_INFO
  APT_PKG_INFO=$(dpkg -l | grep -i "${PKG_ITEM}" | awk '{print $2}' | cut -d ':' -f1 | awk "/^${PKG_ITEM}$/")
  if [ "${APT_PKG_INFO}" != "${PKG_ITEM}" ]; then
    sudo apt install -y "${PKG_ITEM}"
    echo
  fi
done
```

- To remove, invert the condition: `if [ "${APT_PKG_INFO}" == "${PKG_ITEM}" ]; then sudo apt remove -y ...`
- On macOS, use `brew list | grep <pkg>` as the check guard

---

## 9. Output Format (runtime banners · step labels)

```bash
# Start / end banner (= run, 111) — _abstract.sh
echo "==============================================================================================================="
echo ">>>>  START                                                                  $(date)"
echo "==============================================================================================================="

# Error banner (< run, 111) — setExit
echo "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"

# In-function section header (- run, 111)
echo "---------------------------------------------------------------------------------------------------------------"
echo "[ ${ENVIRONMENT_NAME} ] ${PLATFORM_TYPE} - Component - Action"
echo "---------------------------------------------------------------------------------------------------------------"

# Step label — always followed by an empty echo
echo ">>>> Git - Project"
echo
```

The in-source comment delimiter is a 120-column line (`#` + 118 dashes, or ` # ` + 116 dashes when
indented) — see the output-style §Section Separators, which also records the 106-character `echo -e`
drift present in `setEnvironment` / `setUtility`.

---

## 10. Script Taxonomy

| Category | Path | Purpose |
| --- | --- | --- |
| Common | `scripts/common/` | Shared lifecycle functions and the environment menu; sourced by entry points |
| Utility | `scripts/utility/<tool>/` | Task entry points and their sourced helpers (currently `git/`) |
| Tools | `scripts/tools/` | Reference Markdown only — no `.sh` files |

---

## 11. Judgment Criteria

This document holds examples and catalogs only. For the criteria themselves, go to the source:

- **Anti-patterns** — output-style §Anti-patterns
- **Review checklist and severity** — `/utility-shell-script-review` §Review Procedure
- **Enforceable operational clauses** — `utility-shell-script-rule.md`

#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Hooks - PostToolUse - App TypeScript Check
# ----------------------------------------------------------------------------------------------------------------------
# Advisory gate: PostToolUse cannot revert the edit, so exit 2 only surfaces stderr back to Claude.
# Wired from .claude/settings.json (this directory is not auto-discovered).

find_project_root() {
    local PROJECT_DIR
    PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [[ "${PROJECT_DIR}" != "/" ]]; do
        if [[ -d "${PROJECT_DIR}/.git" ]]; then
            echo "${PROJECT_DIR}"
            return 0
        fi
        PROJECT_DIR="$(dirname "${PROJECT_DIR}")"
    done
    return 1
}

HOOK_INPUT="$(cat)"
PROJECT_PATH="${CLAUDE_PROJECT_DIR:-$(find_project_root)}"

# ----------------------------------------------------------------------------------------------------------------------
# Filter
# ----------------------------------------------------------------------------------------------------------------------

# >>>> Only extension source pays for the toolchain; every other edit exits before any work
EDITED_FILE="$(printf '%s' "${HOOK_INPUT}" | jq -r '.tool_input.file_path // empty')"
if [[ -z "${EDITED_FILE}" ]]; then
    exit 0
fi

case "${EDITED_FILE}" in
    "${PROJECT_PATH}"/app/src/*.ts | app/src/*.ts | */app/src/*.ts) ;;
    *) exit 0 ;;
esac

# ----------------------------------------------------------------------------------------------------------------------
# Toolchain Guard
# ----------------------------------------------------------------------------------------------------------------------

TSC_BIN="${PROJECT_PATH}/app/node_modules/.bin/tsc"
ESLINT_BIN="${PROJECT_PATH}/app/node_modules/.bin/eslint"

# >>>> Local binaries only — `npx tsc` resolves to a system decoy that exits 1 and fakes a failure
if [[ ! -x "${TSC_BIN}" ]] || [[ ! -x "${ESLINT_BIN}" ]]; then
    jq -n '{systemMessage: "TypeScript hook skipped: app/node_modules is missing. Run `npm install --prefix app`."}'
    exit 0
fi

# ----------------------------------------------------------------------------------------------------------------------
# Typecheck · Lint
# ----------------------------------------------------------------------------------------------------------------------

HOOK_STATUS=0

# >>>> Run from app/ so both tools resolve tsconfig.json and eslint.config.mjs exactly as npm scripts do
TSC_OUTPUT="$(cd "${PROJECT_PATH}/app" && "${TSC_BIN}" -p ./ --noEmit 2>&1)" || HOOK_STATUS=1
ESLINT_OUTPUT="$(cd "${PROJECT_PATH}/app" && "${ESLINT_BIN}" "${EDITED_FILE}" 2>&1)" || HOOK_STATUS=1

if [[ "${HOOK_STATUS}" -ne 0 ]]; then
    {
        echo "TypeScript gate failed after editing ${EDITED_FILE#"${PROJECT_PATH}"/}"
        if [[ -n "${TSC_OUTPUT}" ]]; then
            echo "--- tsc -p ./ --noEmit ---"
            echo "${TSC_OUTPUT}"
        fi
        if [[ -n "${ESLINT_OUTPUT}" ]]; then
            echo "--- eslint ---"
            echo "${ESLINT_OUTPUT}"
        fi
    } >&2
    exit 2
fi

exit 0

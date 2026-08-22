#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Hooks - SessionStart - App TypeScript Status
# ----------------------------------------------------------------------------------------------------------------------
# Reports build state as additionalContext so a stale out/ is never mistaken for a code bug.
# SessionStart cannot block, so this always exits 0. Wired from .claude/settings.json.

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

PROJECT_PATH="${CLAUDE_PROJECT_DIR:-$(find_project_root)}"
BUILD_NOTES=()

# ----------------------------------------------------------------------------------------------------------------------
# Dependencies
# ----------------------------------------------------------------------------------------------------------------------

if [[ ! -d "${PROJECT_PATH}/app/node_modules" ]]; then
    BUILD_NOTES+=("app/node_modules is missing — compile, lint, and test all fail until \`npm install --prefix app\` runs.")
fi

# ----------------------------------------------------------------------------------------------------------------------
# Compiled Output Freshness
# ----------------------------------------------------------------------------------------------------------------------

COMPILED_ENTRY="${PROJECT_PATH}/app/out/extension.js"

if [[ ! -f "${COMPILED_ENTRY}" ]]; then
    BUILD_NOTES+=("app/out/extension.js is missing — package.json main points at it, so the extension cannot activate until \`npm run compile\` runs in app/.")
else
    # >>>> mtime comparison, not a checksum: cheap enough to run on every session start
    STALE_COUNT="$(find "${PROJECT_PATH}/app/src" -name '*.ts' -newer "${COMPILED_ENTRY}" -print | wc -l | tr -d '[:space:]')"
    if [[ "${STALE_COUNT}" -gt 0 ]]; then
        BUILD_NOTES+=("app/out is stale — ${STALE_COUNT} file(s) under app/src are newer than out/extension.js. Run \`npm run compile\` in app/ before trusting F5 or npm test.")
    fi
fi

# ----------------------------------------------------------------------------------------------------------------------
# Report
# ----------------------------------------------------------------------------------------------------------------------

if [[ "${#BUILD_NOTES[@]}" -eq 0 ]]; then
    exit 0
fi

printf '%s\n' "${BUILD_NOTES[@]}" | jq -Rs '{
    hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: ("Extension build state:\n" + .)
    }
}'

exit 0

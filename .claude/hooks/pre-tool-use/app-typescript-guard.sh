#!/bin/bash

set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Hooks - PreToolUse - App TypeScript Guard
# ----------------------------------------------------------------------------------------------------------------------
# Denies edits that break the src -> out build layout. Wired from .claude/settings.json
# (this directory is not auto-discovered).

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

deny_edit() {
    jq -n --arg reason "$1" '{
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: $reason
        }
    }'
    exit 0
}

HOOK_INPUT="$(cat)"
PROJECT_PATH="${CLAUDE_PROJECT_DIR:-$(find_project_root)}"

TARGET_FILE="$(printf '%s' "${HOOK_INPUT}" | jq -r '.tool_input.file_path // empty')"
if [[ -z "${TARGET_FILE}" ]]; then
    exit 0
fi

# ----------------------------------------------------------------------------------------------------------------------
# Deny Rules
# ----------------------------------------------------------------------------------------------------------------------

# >>>> Absolute paths are stripped to a repo-relative form; the */ alternatives cover a foreign cwd
RELATIVE_FILE="${TARGET_FILE#"${PROJECT_PATH}"/}"

case "${RELATIVE_FILE}" in
    app/out/* | */app/out/*)
        deny_edit "app/out holds tsc output and package.json main points at out/extension.js — a hand edit there is discarded by the next compile. Edit the matching app/src/**/*.ts, then run \`npm run compile\` in app/."
        ;;
    app/src/*.js | app/src/*.mjs | app/src/*.cjs | */app/src/*.js | */app/src/*.mjs | */app/src/*.cjs)
        deny_edit "app/src is TypeScript-only and \`tsc -p ./\` is the only writer of JavaScript. Author a .ts file with ES module import/export instead of hand-written require/module.exports."
        ;;
esac

exit 0

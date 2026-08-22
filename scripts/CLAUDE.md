# CLAUDE.md

## Purpose

Shell scripts for environment setup and utility operations used during development and deployment of the Symfony Extensions project.

## Directory Structure

```text
symfony-extension/                           ← Repository root
└── scripts/                                 ← shell-script
    ├── common/                              ← Shared, environment-independent definitions
    │   ├── _abstract.sh                     ← Lifecycle functions: setStart(), setEnd(), setExit(); sets PLATFORM_TYPE, PLATFORM_PROCESSOR
    │   └── _environment.sh                  ← Standalone select+PS3 menu that sets ENVIRONMENT_NAME
    ├── utility/                             ← Task entry points, grouped by tool
    │   └── git/                             ← Git server and configuration scripts
    │       ├── _ABSTRACT.md                 ← Git command reference (config, branch, push/pull)
    │       ├── _config.sh                   ← Git global/local config; three-way platform branch (sourced)
    │       ├── localhost/
    │       │   └── clear.sh                 ← Clear git history and re-initialize the repo
    │       ├── start.sh                     ← Fetch, update the default branch, recreate the temp branch
    │       └── stop.sh                      ← Commit work in progress and push it to the temp branch
    ├── tools/                               ← IDE and AI tooling reference (Markdown only, no .sh)
    └── CLAUDE.md
```

## Script Conventions

- Every script uses `#!/bin/bash` with `set -euo pipefail` **enabled** on line 3
- An entry point bootstraps with `find_project_root` → `cd "${PROJECT_PATH}"` → guarded source of `scripts/common/_abstract.sh`
- Wrap every `source` in an `if [ -f ... ]` existence check, and keep the path in the `else` message identical to the one the `if` tests
- Call `setEnd` on success (unsets the globals it knows, exits 0); call `setExit` on an unrecoverable error (exits 1). Under `set -e` a bare `exit` in a sourced file terminates the caller with no banner
- `setEnvironment`, `setPlatform`, `setProject`, and `setUtility` are currently defined inline in each entry point rather than sourced — `_environment.sh` is not wired into any entry point today

## Full Criteria

The enforced criteria live under `.claude/`, not here:

- [.claude/rules/utility-shell-script-rule.md](../.claude/rules/utility-shell-script-rule.md) — operational criteria (SoT), auto-loaded for `scripts/**/*.sh`
- [.claude/output-styles/utility-shell-script-style.md](../.claude/output-styles/utility-shell-script-style.md) — shell style criteria and templates (SoT)
- [.claude/docs/utility-shell-script-docs.md](../.claude/docs/utility-shell-script-docs.md) — script inventory, global variable catalog, worked examples
- `/utility-shell-script-review <path>` — quality review of an existing script

# CLAUDE.md

## Purpose

Shell scripts for environment setup and utility operations used during development and deployment of the Symfony Extensions project.

## Directory Structure

```text
symfony-extension/                           ← Repository root
└── scripts/                                 ← shell-script
    ├── base/                                ← Environment-independent scripts
    │   ├── utility/
    │   │   └── git/                         ← Git server and configuration scripts
    │   │       ├── _ABSTRACT.md             ← Git command reference (config, branch, push/pull)
    │   │       ├── base/
    │   │       │   └── _config.sh           ← Git local config setup
    │   │       ├── localhost/
    │   │       │   └── clear.sh             ← Clear git history and re-initialize repo
    │   │       ├── start.sh                 ← Start local git server
    │   │       └── stop.sh                  ← Stop local git server
    │   ├── _abstract.sh                     ← Shared functions: setStart(), setEnd(), setExit()
    │   ├── _environment.sh                  ← Interactive menu to select dev/prod environment
    │   └── _project.sh                      ← Project path and name configuration
    └── CLAUDE.md
```

## Script Conventions

- Source `_abstract.sh` first — it defines `setStart()`, `setEnd()`, `setExit()` used by all scripts
- Source `_environment.sh` to interactively select `ENVIRONMENT_NAME` (`dev` or `prod`)
- Source `_project.sh` to set `PROJECT_NAME` and `PROJECT_PATH`
- Call `setEnd` on success (unsets all env vars, exits 0); call `setExit` on error (exits 1)

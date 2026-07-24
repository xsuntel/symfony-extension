# CLAUDE.md

## Repository Overview

This repository is the **Symfony Extensions** VSCode extension project. It provides Symfony Framework support for PHP and YAML files: services, routes, and parameters autocomplete, hover documentation, go-to-definition, and sidebar tree views.

VSCode Extension API reference: [https://code.visualstudio.com/api](https://code.visualstudio.com/api)

## Repository Structure

```text
symfony-extension/                        ← Repository root
├── app/                                  ← VSCode extension source (workspace root for dev)
│   └── CLAUDE.md                         ← Extension-specific context (see below)
├── diagram/                              ← Architecture diagrams (draw.io)
│   ├── base/                             ← Reference architecture diagrams
│   └── CLAUDE.md
├── scripts/                              ← Shell scripts for environment setup
│   ├── base/                             ← Environment-independent scripts
│   └── CLAUDE.md
├── tools/                                ← IDE and AI tooling documentation
│   ├── ai/anthropic/claude/              ← Claude-specific references
│   ├── ide/vscode/                       ← VSCode configuration references
│   └── CLAUDE.md
├── .claude/                              ← Claude Code project configuration
│   ├── agent-memory/app/base/           ← Per-agent memory for the typescript-* reviewers/test-writer
│   ├── agents/
│   │   ├── app/base/                     ← typescript-* (code-reviewer, debug-reviewer, test-writer)
│   │   └── utility/                      ← claude/ · git/ (each: code/commit author + reviewer)
│   ├── commands/
│   │   └── app/base/                     ← typescript-code-review
│   ├── docs/
│   │   ├── agent-team-draft.md           ← Agent roster & orchestration reference
│   │   ├── app/base/                     ← typescript-code-docs (extension source reference)
│   │   └── utility/vscode/               ← extension-config-docs (manifest/tsconfig/build reference)
│   ├── hooks/                            ← Lifecycle hook slots (empty .gitkeep placeholders, all events)
│   ├── output-styles/                    ← english-output-style (active) + korean-output-style + app/base/typescript-style
│   ├── rules/
│   │   ├── app/base/                     ← reserved (empty)
│   │   └── tools/
│   │       └── vscode-extension-rule.md  ← VSCode API rules & quick-reference for Claude
│   ├── scripts/statusline.sh             ← Status line renderer (vendored)
│   ├── skills/
│   │   ├── app/base/                     ← typescript-code-helper (review-role dispatcher)
│   │   └── utility/                      ← claude/code-config-helper, git/commit-message-helper, vscode/extension-config-helper
│   ├── workflows/                        ← Workflow slots (empty .gitkeep placeholder)
│   └── settings.json
├── .vscode/
│   ├── launch.json                       ← F5 debug launcher (extensionDevelopmentPath=app/)
│   └── tasks.json
├── CHANGELOG.md
├── TODO.md
├── REVIEW.md
└── README.md
```

## Subdirectory Contexts

Each subdirectory has its own `CLAUDE.md`:

- [app/CLAUDE.md](app/CLAUDE.md) — Extension source code, providers, tree views, testing (single source of truth for the extension)
  - [app/src/CLAUDE.md](app/src/CLAUDE.md) — `src/` detail: data layer, providers, tree views
  - [app/src/test/CLAUDE.md](app/src/test/CLAUDE.md) — `src/test/` suite and testing patterns
  - [app/assets/CLAUDE.md](app/assets/CLAUDE.md) — Activity bar icon assets
- [.vscode/CLAUDE.md](.vscode/CLAUDE.md) — Project-specific stack, environment, and VSCode optimization rules
- [diagram/CLAUDE.md](diagram/CLAUDE.md) — Architecture diagram conventions
- [scripts/CLAUDE.md](scripts/CLAUDE.md) — Shell script structure and usage
- [tools/CLAUDE.md](tools/CLAUDE.md) — IDE and AI tooling documentation layout

## Rules Files

Claude Code rules live under `.claude/rules/` and are loaded automatically:

- [.claude/rules/tools/vscode-extension-rule.md](.claude/rules/tools/vscode-extension-rule.md) — VSCode Extension API quick-reference: provider interfaces, registration patterns, `package.json` checklist, common pitfalls

## Agent Naming

The global `~/.claude/CLAUDE.md` (§7) refers to generic agents `code-reviewer` and `security-auditor`. This repository maps those roles to concrete, kebab-case agents:

| Global role | This project |
| --- | --- |
| `code-reviewer` (after code changes) | `typescript-code-reviewer` — quality review with MUST/SHOULD/CONSIDER |
| debugging | `typescript-debug-reviewer` — root-cause tracing (read-only) |
| test authoring | `typescript-test-writer` |
| `security-auditor` (before deploy) | no dedicated agent — use the `/security-review` skill |

Utility orchestration agents (author → reviewer pairs, invoked via their skill, not the global roles above):

| Domain | Agents (author / reviewer) | Skill |
| --- | --- | --- |
| `.claude` config artifacts | `claude-code-config-author` / `claude-code-config-reviewer` | `cc-config-helper` |
| Commit messages | `git-commit-message-author` / `git-commit-message-reviewer` | `git-commit-helper` |

## Development Workflow

- **Extension development**: Open `app/` as the workspace root in VSCode, press **F5** to launch Extension Development Host
- **Linting**: Run `npm run lint` from `app/`
- **Testing**: Run `npm test` from `app/` (runs `pretest` lint, then `@vscode/test-cli`)
- **Debugging config**: `.vscode/launch.json` sets `--extensionDevelopmentPath=${workspaceFolder}/app`

## VSCode Extension Fundamentals

### Extension Lifecycle

Every VSCode extension exports exactly two functions from its entry point:

```typescript
export function activate(context: vscode.ExtensionContext) { /* called on activation event */ }
export function deactivate() {}                               /* called on uninstall/shutdown */
```

All disposables (providers, commands, event listeners) **must** be pushed to `context.subscriptions` so VSCode cleans them up automatically.

### Activation Events (`activationEvents` in `package.json`)

The extension activates lazily — only when one of the declared events fires:

| Event | Syntax | Purpose |
| --- | --- | --- |
| Language opened | `"onLanguage:php"` | Activate when a PHP file opens |
| Language opened | `"onLanguage:yaml"` | Activate when a YAML file opens |
| Workspace file exists | `"workspaceContains:**/symfony.lock"` | Confirm it's a Symfony project |
| Workspace file exists | `"workspaceContains:**/bin/console"` | Confirm Symfony CLI is present |
| Command invoked | `"onCommand:symfony.refresh"` | Activate on explicit command |
| Post-startup | `"onStartupFinished"` | Defer without blocking VSCode startup |

Current activation: `onLanguage:php` + `onLanguage:yaml`. Consider adding `workspaceContains:**/symfony.lock` to avoid activating in non-Symfony PHP projects.

### Contribution Points (`contributes` in `package.json`)

Declare all static contributions in `package.json` — VSCode reads these before activating the extension:

| Section | Purpose |
| --- | --- |
| `contributes.commands` | Register commands (shown in Command Palette) |
| `contributes.views` | Declare tree view panels in a sidebar container |
| `contributes.viewsContainers.activitybar` | Add a custom icon to the Activity Bar |
| `contributes.menus` | Bind commands to context menus and view toolbars |

The `category` field on a command groups it in the Command Palette as `"Category: Title"`.

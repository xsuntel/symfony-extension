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
├── scripts/                              ← Shell scripts and tooling documentation
│   ├── common/                           ← Shared, environment-independent definitions (sourced)
│   ├── utility/                          ← Task entry points, grouped by tool (currently git/)
│   ├── tools/                            ← IDE and AI tooling documentation (Markdown only, no .sh)
│   │   ├── ai/anthropic/claude/          ← Claude-specific references
│   │   ├── ide/vscode/                   ← VSCode configuration references
│   │   └── CLAUDE.md
│   └── CLAUDE.md
├── .claude/                              ← Claude Code project configuration
│   ├── agent-memory/                     ← Per-agent notes at <agent-name>/MEMORY.md (flat — the platform's `memory: project` path). Auto-injected into each subagent's system prompt; hand-maintained, with read-only agents blocked from writing via `disallowedTools`
│   ├── agents/                           ← flat; filename stem MUST equal frontmatter `name:` (and the agent-memory dir)
│   │   ├── agent-team.md        ← orchestrator over the four app specialists
│   │   ├── app-typescript-code-*.md      ← analyzer · reviewer · debugger · tester
│   │   ├── tools-vscode-extension-*.md   ← author / reviewer (API-spec pair; run by tools-vscode-extension-scaffold-skill)
│   │   ├── utility-git-commit-*.md       ← author / reviewer (commit message pair)
│   │   └── utility-drawio-diagram-*.md   ← author / reviewer (.drawio XML pair; run by utility-drawio-diagram-skill)
│   ├── commands/                         ← flat; the filename slug IS the command name
│   │   ├── app-typescript-code-review.md      ← /app-typescript-code-review
│   │   ├── utility-claude-code-review.md      ← /utility-claude-code-review
│   │   ├── utility-drawio-diagram-review.md   ← /utility-drawio-diagram-review (existing .drawio files only)
│   │   └── utility-shell-script-review.md     ← /utility-shell-script-review (Mode A review + Mode B self-verify)
│   ├── docs/                             ← flat; <domain>-<name>-docs.md (reference companions)
│   │   ├── agent-team-docs.md            ← agent roster & orchestration reference
│   │   ├── app-typescript-code-docs.md   ← extension source reference
│   │   ├── tools-vscode-extension-docs.md ← VSCode API manifest/tsconfig/build reference
│   │   ├── utility-claude-code-docs.md   ← .claude config authoring/review reference
│   │   ├── utility-drawio-diagram-docs.md ← diagram/** statistics, shape catalog, MCP tools
│   │   ├── utility-git-commit-docs.md    ← commit message pipeline reference
│   │   └── utility-shell-script-docs.md  ← scripts/ inventory, global catalog, worked examples
│   ├── hooks/                            ← Event slots (18 of 31 documented events); NOT auto-discovered — a script here must be referenced from settings.json
│   │   ├── session-start/app-typescript-status.sh   ← reports missing app/node_modules · stale app/out as additionalContext
│   │   ├── pre-tool-use/app-typescript-guard.sh     ← denies edits to app/out/** and .js under app/src
│   │   └── post-tool-use/app-typescript-check.sh    ← tsc --noEmit + eslint on app/src/**/*.ts edits (advisory, exit 2)
│   ├── output-styles/                    ← flat; `name:` = filename: abstract-english-style (active) + abstract-korean-style + app-typescript-code-style + tools-vscode-extension-style + utility-shell-script-style + utility-git-commit-style + utility-drawio-diagram-style
│   ├── rules/                            ← flat; auto-loaded (those with `paths:` load on demand)
│   │   ├── app-typescript-code-rule.md   ← extension source (app/src) authoring rules — paths: app/**
│   │   ├── tools-vscode-extension-rule.md ← VSCode API rules & quick-reference — paths: app/**
│   │   ├── utility-claude-code-rule.md   ← .claude/ layout rules (SoT) — paths: .claude/**/*
│   │   ├── utility-drawio-diagram-rule.md ← .drawio structure/canvas/palette criteria — paths: diagram/**/*.drawio
│   │   ├── utility-shell-script-rule.md  ← Bash operational/architectural criteria — paths: scripts/**/*.sh
│   │   └── utility-git-commit-rule.md    ← Conventional Commits format rules
│   ├── scripts/statusline.sh             ← Status line renderer (vendored)
│   ├── skills/                           ← flat: one dir per skill (nested dirs are not discovered); exempt from the immutability rule
│   │   ├── app-typescript-code-skill/            ← single-route dispatcher to app/ specialists
│   │   ├── tools-vscode-extension-config-skill/  ← inline VSCode API / structure guidance
│   │   ├── tools-vscode-extension-scaffold-skill/ ← author→reviewer pipeline (scaffolds + API-reviews extension code)
│   │   ├── utility-claude-code-skill/            ← .claude config inline authoring/review (self-draft → self-review → write)
│   │   ├── utility-drawio-diagram-skill/         ← .drawio author→reviewer team (applies on PASS)
│   │   ├── utility-git-commit-skill/             ← commit message author→reviewer team
│   │   └── utility-shell-script-skill/           ← scripts/ Bash inline authoring/review (self-draft → self-verify → write)
│   ├── workflows/                        ← Project-local placeholder (.gitkeep only); not a Claude Code concept
│   └── settings.json
├── .vscode/
│   ├── launch.json                       ← F5 debug launcher (extensionDevelopmentPath=app/)
│   └── tasks.json
├── .github/                              ← GitHub workflows and repository metadata
├── CHANGELOG.md                          ← gitignored (see .gitignore)
├── TODO.md
├── REVIEW.md
├── README.md
├── LICENSE
├── vsc-extension-quickstart.md           ← Yeoman generator leftover
└── .vscodeignore
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
  - [scripts/tools/CLAUDE.md](scripts/tools/CLAUDE.md) — IDE and AI tooling documentation layout

## Rules Files

Claude Code rules live under `.claude/rules/` and are loaded automatically:

- [.claude/rules/tools-vscode-extension-rule.md](.claude/rules/tools-vscode-extension-rule.md) — VSCode Extension API quick-reference: provider interfaces, registration patterns, `package.json` checklist, common pitfalls (`paths: app/**`)
- [.claude/rules/app-typescript-code-rule.md](.claude/rules/app-typescript-code-rule.md) — `app/src` data-layer typing discipline at the `bin/console` boundary (`paths: app/**`)
- [.claude/rules/utility-claude-code-rule.md](.claude/rules/utility-claude-code-rule.md) — `.claude/` layout rules: which trees are flat, which keep `<domain>/`, and what may not move (`paths: .claude/**/*`)
- [.claude/rules/utility-drawio-diagram-rule.md](.claude/rules/utility-drawio-diagram-rule.md) — `.drawio` storage format, structural integrity, canvas specs, fixed palette, multi-page editing procedure, quality gates (`paths: diagram/**/*.drawio`)
- [.claude/rules/utility-shell-script-rule.md](.claude/rules/utility-shell-script-rule.md) — Bash operational criteria for `scripts/**`: bootstrap, source guards, global variables, safety, taxonomy (`paths: scripts/**/*.sh`)
- [.claude/rules/utility-git-commit-rule.md](.claude/rules/utility-git-commit-rule.md) — Conventional Commits format criteria (loaded every session)

## Agent Naming

The global `~/.claude/CLAUDE.md` ("에이전트 사용 규칙" section) refers to generic agents `code-reviewer` and `security-auditor`. This repository maps those roles to concrete, kebab-case agents:

| Global role | This project |
| --- | --- |
| `code-reviewer` (after code changes) | `app-typescript-code-reviewer` — quality review with MUST/SHOULD/CONSIDER |
| debugging | `app-typescript-code-debugger` — root-cause tracing (read-only) |
| test authoring | `app-typescript-code-tester` — TDD red-green-refactor cycle (failing test → minimal `app/src` change → refactor) |
| `security-auditor` (before deploy) | no dedicated agent — use the `/security-review` skill |
| _(no global role)_ | `app-typescript-code-analyzer` — proactive structural / code-health analysis (read-only) |
| _(no global role)_ | `agent-team` — multi-step orchestrator coordinating the `app/` specialists for compound tasks |

Domain skills (invoked by name, not via the global roles above). Extension scaffolding, commit
messages, and `.drawio` diagrams each use an author → reviewer agent pair; `.claude` config authoring
and `scripts/**` Bash authoring both run **inline** in the skill (Claude drafts, self-reviews, and
writes — no paired agents):

| Domain | Skill | Mechanism |
| --- | --- | --- |
| VSCode Extension API guidance | `tools-vscode-extension-config-skill` | Inline: guidance only, no artifact written |
| Extension code / manifest scaffolding under `app/` | `tools-vscode-extension-scaffold-skill` | Agent pair: `tools-vscode-extension-author` → `tools-vscode-extension-reviewer` |
| `.claude` config artifacts | `utility-claude-code-skill` | Inline: self-draft → self-review → write |
| `scripts/**` Bash scripts | `utility-shell-script-skill` | Inline: self-draft → self-verify → write |
| Commit messages | `utility-git-commit-skill` | Agent pair: `utility-git-commit-author` → `utility-git-commit-reviewer` |
| `diagram/**` `.drawio` files | `utility-drawio-diagram-skill` | Agent pair: `utility-drawio-diagram-author` → `utility-drawio-diagram-reviewer` |

The `tools-` prefix marks artifacts that specify an **external tool's** API or configuration (here,
the VSCode Extension API), mirroring the `scripts/tools/` tree — as distinct from `app-`, which
covers this repository's own extension source.

## Working Language (overrides the global preference)

The global `~/.claude/CLAUDE.md` ("기본 동작" section) asks for Korean responses. **This repository
deliberately overrides that**: `.claude/settings.json` sets `outputStyle: "abstract-english-style"`,
so responses and every `.claude/**` artifact — agents, skills, commands, rules, docs — are written
in English. That keeps the config aligned with the English-only VSCode extension source, the
`@see` reference style, and the "English" criterion the config review command enforces.

`.claude/output-styles/abstract-korean-style.md` is maintained as the Korean equivalent and can be
selected per session with `/output-style abstract-korean-style`; the project default stays English.

`output-styles/` is flat and follows the same `<domain>-<name>.md` form as `agents/`, `commands/`,
and `rules/`. `abstract-` is the general domain — styles that apply to every response regardless of
what is being worked on — while `app-` marks the extension-specific TypeScript style
(`app-typescript-code-style`), which the general styles reference for code output. A style is
selected by its frontmatter `name:`, which must equal its filename.

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

Current activation (`app/package.json`): `onLanguage:php` + `onLanguage:yaml` + `workspaceContains:**/bin/console`. The `workspaceContains` guard is already in place, so the extension does not load in an arbitrary non-Symfony PHP project — do not re-suggest adding one.

### Contribution Points (`contributes` in `package.json`)

Declare all static contributions in `package.json` — VSCode reads these before activating the extension:

| Section | Purpose |
| --- | --- |
| `contributes.commands` | Register commands (shown in Command Palette) |
| `contributes.views` | Declare tree view panels in a sidebar container |
| `contributes.viewsContainers.activitybar` | Add a custom icon to the Activity Bar |
| `contributes.menus` | Bind commands to context menus and view toolbars |

The `category` field on a command groups it in the Command Palette as `"Category: Title"`.

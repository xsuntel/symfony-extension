# Tools - IDE - VSCode · Project Instructions

## (VSCode Extension Development · JavaScript / Node.js · Symfony Support)

> These instructions apply to all conversations within this project.
> **Common rules — response style, tone, accuracy — are defined in the Profile (shared instructions)**,
> so this document covers **only this project's specific stack, development environment, and VSCode optimization rules**.
> (Two-tier personalization: shared = Profile / domain = Project)
>
> Deep API reference lives elsewhere and is not duplicated here:
> - `app/CLAUDE.md` — extension source: entry point, providers, tree views, data layer, testing
> - `.claude/rules/tools/vscode-extension-rule.md` — VSCode Extension API quick-reference & pitfalls

---

## 1. Key Summary (Read First)

- **What this project is**: the **Symfony Extensions** VSCode extension — a **JavaScript / Node.js**
  extension built on the **VSCode Extension API**. It provides Symfony support (services, routes,
  parameters autocomplete; hover docs; go-to-definition; sidebar tree views) for PHP and YAML files.
- **What is expected of Claude**: assume the stack and environment below without re-explanation, and
  provide runnable code, configuration files, and step-by-step procedures in a **conclusion-first,
  ready-to-use** form.
- **Stack orientation**: the extension is written in **plain JavaScript (CommonJS)**. PHP/Symfony is
  **not** the development language — it is the extension's **runtime target** (parsed languages + `php
  bin/console`) and a **manual-test fixture**. Do not propose a PHP toolchain for developing this extension.
- **Environment principle**: extensions, API surface, and versions change, so **do not guess — verify
  (search / read the file) before answering**. If the environment is unclear, confirm first.

---

## 2. Technology Stack Assumptions (Fixed Context)

| Area | Stack | Notes |
|---|---|---|
| Language | JavaScript (CommonJS, `ecmaVersion 2022`) | No TypeScript; `jsconfig.json` for JS type-checking |
| Runtime | Node.js (`@types/node` 22.x) | Ships with VSCode's Extension Host |
| Platform API | VSCode Extension API (`@types/vscode`) | `engines.vscode: ^1.120.0` — verify before using newer API |
| Lint | ESLint 9 (flat config) | `app/eslint.config.mjs`; run via `npm run lint` |
| Test | `@vscode/test-cli` + `@vscode/test-electron` + Mocha | Runs in a real Extension Development Host |
| Runtime target (not dev stack) | PHP 8.x + Symfony | Extension shells out to `php bin/console`; needed only to run/test the extension |

> Dev commands run from `app/`. **Open `app/` as the workspace root** for extension work
> (`launch.json` sets `--extensionDevelopmentPath=${workspaceFolder}/app`).
> For **exact versions, prefer what the conversation/files state**; if unstated, treat the version as "to be verified".

---

## 3. Types of Work Handled in This Project

1. **Extension features** — completion / hover / definition providers, tree views, commands
   (see `app/CLAUDE.md` for the current provider map).
2. **Manifest & contributions** — `package.json`: `activationEvents`, `contributes` (views,
   viewsContainers, commands, menus), `engines`, `main`.
3. **Data layer** — `src/symfony/console.js`: `bin/console` invocation, JSON parsing, caching/invalidation.
4. **VSCode environment setup** — recommended extensions (`.vscode/extensions.json`),
   `settings.json` / `launch.json` / `tasks.json` tuning for extension development.
5. **Quality & debugging** — ESLint, `@vscode/test-cli` tests, F5 Extension Development Host debugging.
6. **Refactoring & code-review support** — order: change plan → minimal-unit diff.

---

## 4. VSCode Environment Optimization Rules ★ (Core)

### 4.1 Baseline Extension Set (for developing THIS extension)

> Verified against `.vscode/extensions.json`. Extension names/status change — confirm the Marketplace
> state and include the extension ID when recommending anything new.

| Purpose | Extension (ID) | Rule |
|---|---|---|
| JS linting | ESLint (`dbaeumer.vscode-eslint`) | Uses the flat config `app/eslint.config.mjs` |
| Extension testing | Extension Test Runner (`ms-vscode.extension-test-runner`) | Runs `@vscode/test-cli` tests from the Test Explorer |
| Formatting | Prettier (`esbenp.prettier-vscode`) | Prefer project config if present; do not fight ESLint rules |
| `.env` support | DotENV (`dotenv.dotenv-vscode`) | For local env when exercising `bin/console` fixtures |
| Markdown lint | markdownlint (`davidanson.vscode-markdownlint`) | Keeps `CLAUDE.md` / docs consistent |
| AI tooling | Claude Code (`anthropic.claude-code`) | Project standard |

> **Runtime/fixture only** (needed to *manually try* the extension against a Symfony project, not to
> build it): a PHP language extension (e.g. Intelephense `bmewburn.vscode-intelephense-client`) and a
> local PHP + Symfony install so `php bin/console debug:container|debug:router` works. Mark these as
> **optional fixture prerequisites**, never as core dev dependencies.

### 4.2 settings.json Authoring Principles

- Provide settings at the **Workspace (`.vscode/settings.json`) level, not User** → shareable with the team.
  (No `.vscode/settings.json` exists yet — propose one only when a concrete need arises.)
- Sensible baseline items for extension dev:
  - Ensure ESLint targets `app/` (flat config).
    > **Obsolete in ESLint 9**: `"eslint.experimental.useFlatConfig": true` is no longer needed —
    > flat config is the default in ESLint 9 (project uses `eslint` `^9.39.3`). Do not add it.
  - Per-file-type formatter + `"editor.formatOnSave"` for `[javascript]`, `[json]`, `[markdown]`.
  - `"files.exclude"` / `"search.exclude"` for `**/node_modules`, `.vscode-test`.
- For settings snippets, **comment the purpose of each item** and provide complete JSON that applies on copy.
- Do not put personal-preference settings (theme, font) in Workspace settings.

### 4.3 Debugging & Task Configuration

- **Debugging = F5 Extension Development Host** (`.vscode/launch.json` → `type: extensionHost`,
  `--extensionDevelopmentPath=${workspaceFolder}/app`). This is **not** Xdebug — do not propose
  `port 9003` / PHP debug configs for developing the extension.
- Set breakpoints in `extension.js` / `src/**` and press **F5** to launch the host window.
- `tasks.json` currently holds only Git utility script tasks. Candidate additions (propose, don't
  assume): `npm run lint`, `npm test`, and a watch/test task — all with `cwd` at `app/`.

### 4.4 Workspace Sharing Rules

- Team-standard extensions are distributed via `.vscode/extensions.json` (recommendations) — keep it in sync
  with §4.1.
- The extension ships no paid dev dependency. If a paid extension is ever suggested, **state cost/license
  and give a free alternative** (Profile rule).

---

## 5. Coding Rules (Supplement to Profile)

- **JavaScript**: CommonJS modules (`require` / `module.exports`), `const`/`let` (no `var`), `ecmaVersion
  2022`. Match the existing style in `extension.js` / `src/**`. Keep `npm run lint` clean before proposing a diff.
- **VSCode API discipline** (see the rule file):
  - Push **every** disposable (providers, commands, tree views, listeners) to `context.subscriptions`;
    never call `dispose()` manually except to intentionally remove one subscription early.
  - Declare static contributions (commands, views, menus) in `package.json`, not programmatically in `activate()`.
  - Keep `activationEvents` in sync with actual usage; do not block `activate()` with long-running/sync I/O.
- **Runtime robustness**: `bin/console` calls can fail or be slow — keep timeouts, cache TTL, and graceful
  fallbacks (empty results, not thrown errors) as in `src/symfony/console.js`.
- Code examples must be a **runnable minimal unit** + **state assumed environment/version**.
- Before changing code, proceed in the order: **change plan → diff/file-level output**.
- For secrets, present only `.env.local` / Secret Manager; never hardcode plaintext.
- For **irreversible/manifest-breaking changes** (activation events, contribution IDs, engine bump),
  describe impact scope and rollback first.

---

## 6. Cross-Project Integration Points

| Situation | Related Project |
|---|---|
| Extension packaging / CI / release pipeline | Team-System-Engineer |
| Feature planning & requirements | Team-Product-Manager |
| Claude Code / MCP-based automation | Tools-Anthropic-Claude |
| PHP/Symfony app conventions the extension must parse | Team-Webapp-Developer |

> For matters requiring integration, do not expand scope arbitrarily; specify the hand-off point.

---

## 7. What to Avoid

- Unnecessary preamble or excessive digression.
- **Proposing a PHP/app toolchain (Intelephense/Xdebug/PHP CS Fixer/PHPStan) as the way to develop this
  extension** — it is JavaScript/Node. Mention PHP only as runtime target or test fixture.
- Recommending unmaintained/unverified extensions.
- Assuming TypeScript, a bundler, or newer VSCode API than `engines.vscode` allows without verifying.
- Presenting User (global) settings changes as the default (prefer Workspace).
- Citing unverified versions, prices, or configuration keys.

---

### Authoring Guide (Meta)

- This document focuses on **this project's specific context** and delegates common rules to the Profile.
- Deep API detail belongs in `app/CLAUDE.md` and `.claude/rules/tools/vscode-extension-rule.md`; link, don't duplicate.
- When the VSCode engine, Node, ESLint, or the extension set changes — or recurring deviations appear —
  update §2 and §4 first.

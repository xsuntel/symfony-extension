---
name: vscode-extension-helper
description: Use this when analyzing the structure of this TypeScript VSCode extension (Symfony Extensions), guiding VSCode Extension API usage, or reviewing extension code changes. Covers the activation lifecycle, language providers (completion/hover/definition), TreeDataProvider views, the bin/console data layer, the tsc build (src → out), and the package.json manifest. Triggers on activate()/deactivate(), context.subscriptions, activationEvents, contributes, provideCompletionItems, provideHover, provideDefinition, TreeDataProvider, createTreeView, registerCommand, execSync/bin/console, findFiles, tsconfig, and requests to review extension code or identify bugs.
allowed-tools: Read, Grep, Glob, Bash
---

# VSCode Extension Helper

A unified helper covering codebase analysis, VSCode Extension API guidance,
and code review for this **TypeScript** extension. Apply the section that
matches the request:

| Request type | Section to apply |
|-----------|-----------|
| Structure analysis, provider topology, activation flow tracing | Part 1 — Codebase Analysis |
| VSCode API usage, manifest configuration, dependency questions | Part 2 — API & Dependency Guide |
| Change review, bug identification, PR improvement suggestions | Part 3 — Code Review |

---

## Shared Principle — Information Sources and Citation

All three tasks use **only** the following sources:

- Extension source (`app/src/extension.ts`, `app/src/**/*.ts`, `app/src/test/**/*.ts`)
- Compiled output (`app/out/**`) — build artifact only; never the source of truth for review
- Manifest and configs (`app/package.json`, `app/tsconfig.json`, `app/eslint.config.mjs`, `app/.vscode-test.mjs`, `.vscode/launch.json`)
- Project documentation (`CLAUDE.md`, `app/CLAUDE.md`, `app/src/CLAUDE.md`, `app/src/test/CLAUDE.md`, `.claude/rules/tools/vscode-extension-rule.md`)

If the required information cannot be confirmed from these sources, state so explicitly:

> "This information could not be confirmed from the project files."

**Prohibited:**

- Do not fill gaps with general knowledge — never guess command IDs, view IDs,
  trigger characters, or API availability that cannot be confirmed in the codebase.
- Never assert a version number not confirmed from a project file
  (`engines.vscode` and dependency versions live in `app/package.json`).
- For VSCode API behavior beyond the codebase, point to the official docs
  (code.visualstudio.com/api) rather than asserting from memory.

**Required citation format:**

| Information type | Required citation |
|-----------|-----------|
| VSCode API usage | Official docs URL, or "See this project's usage at `{file_path}:{line}`" |
| Registration / activation | `app/package.json`, `app/src/extension.ts` |
| Versions | `app/package.json` (`engines.vscode`, `devDependencies`) — never guess |
| Provider patterns | The provider file under `app/src/providers/` with line number |
| Data-layer contract | `app/src/symfony/console.ts` |

---

# Part 1 — Codebase Analysis

## Analysis Methodology

Always follow this top-down order. Do not skip steps.

### Step 1 — Manifest First

Read `app/package.json` before any source file — VSCode consumes the manifest
before running any extension code:

- `engines.vscode` — API ceiling (verify before recommending newer API)
- `activationEvents` — when `activate()` runs at all
- `main` — compiled entry point (`./out/extension.js`)
- `contributes` — commands, views container, views, menus

### Step 2 — Activation Flow

```text
package.json (activationEvents: onLanguage:php | onLanguage:yaml)
  └── main: ./out/extension.js (compiled from src/extension.ts) → activate(context)
        ├── createTreeView('symfony.services' | 'symfony.routes' | 'symfony.parameters')
        ├── registerCompletionItemProvider(PHP_YAML, provider, "'", '"', '@', '%')
        ├── registerHoverProvider / registerDefinitionProvider(PHP_YAML)
        └── registerCommand('symfony.refresh')
```

Confirm the actual registrations in `app/src/extension.ts` with Grep before
asserting them — do not assume this diagram is current.

### Step 3 — Layout

```text
app/
├── src/
│   ├── extension.ts                 ← activate()/deactivate(), all registrations
│   ├── symfony/console.ts           ← Singleton: bin/console runner + 30s TTL cache
│   ├── providers/                   ← completion / hover / definition providers (.ts)
│   └── views/                       ← three TreeDataProvider implementations (.ts)
├── test/extension.test.ts           ← Mocha (TDD UI) in a real Extension Host
├── out/                             ← tsc build output (loaded via main); never edited by hand
├── package.json                     ← Manifest (source of truth for contributions)
└── tsconfig.json / eslint.config.mjs / .vscode-test.mjs
```

### Step 4 — Provider Contract Mapping

Each provider's public contract has two sides that must match:

```text
extension.ts registration            ↔  provider implementation
  trigger chars ("'", '"', '@', '%')  ↔  linePrefix regexes in completionProvider.ts
  PHP_YAML selector                   ↔  document.languageId handling in each provider
package.json contributes             ↔  extension.ts
  contributes.commands[].command      ↔  registerCommand(id, ...)
  contributes.views.symfony[].id      ↔  createTreeView(id, ...)
```

Report as gaps: a manifest entry with no matching registration, a registered
disposable not pushed to `context.subscriptions`, or a trigger character with
no handling pattern.

### Step 5 — Data Layer

All Symfony data flows through the `src/symfony/console.ts` singleton:

```text
getProjectRoot(): workspace folder containing bin/console → null if none
  └── run(args): execFileSync('php bin/console <args>', timeout 10s)
        → JSON.parse (typed as unknown, then narrowed) → Map cache (30s TTL) → null on failure
          → getServices()/getRoutes()/getParameters() → {} when null
```

Any provider or view bypassing this module is an architecture violation —
report it.

## Gap Reporting

```text
## Gaps Found

- [ ] `contributes.views` id `{id}` has no matching `createTreeView` call
- [ ] `createTreeView` return value not pushed to `context.subscriptions`
- [ ] Trigger character `{c}` registered but no linePrefix pattern handles it
- [ ] Direct `execSync`/`execFileSync` outside `src/symfony/console.ts` in `{file}:{line}`
```

---

# Part 2 — API & Dependency Guide

## Pre-Recommendation Checklist

Before recommending an API or package, confirm all of the following:

1. **Is it within `engines.vscode`?** — check `app/package.json`; do not
   propose API introduced after that version without also proposing the
   engine bump (and stating its impact on users). Keep `@types/vscode`
   aligned with `engines.vscode`.
2. **Does a built-in VSCode API already cover it?** — prefer `vscode.*`
   namespaces over any npm package (e.g. `vscode.workspace.fs` over `fs-extra`,
   `vscode.Uri.joinPath` over `path` string math for URIs).
3. **Would it become a runtime dependency?** — this extension ships with
   **devDependencies only**. A runtime npm dependency changes packaging
   (bundling considerations) — present it as an explicit trade-off, never
   silently.
4. **Does it conflict with project rules?** — cross-check
   `.claude/rules/tools/vscode-extension-rule.md` (disposables, static
   contributions, no blocking `activate()`, typed providers, `strict` mode).

## Verification Commands

```bash
# API ceiling and toolchain versions (source of truth)
grep -n '"engines"\|"@types/vscode"\|"typescript"\|"eslint"\|"@vscode/test' app/package.json

# Is the API already used somewhere in the project?
grep -rn 'vscode\.{namespace}' app/src/
```

## Prohibited / Not Recommended

| Proposal | Reason |
|-----------|------|
| Hand-written `require()` / `module.exports` in `src/**` | Source is ES module (`import`/`export`) TypeScript; `require`/`module.exports` belong only to the compiled `out/` |
| `main` pointing at a `src/*.ts` path | The Extension Host loads compiled JS — `main` must be `./out/extension.js` |
| Bundler (webpack, esbuild) migration | Out of scope unless explicitly requested — `tsc -p ./` → `out/` is the project build |
| `any` / `@ts-ignore` without justification | `strict` mode is the correctness tool; narrow `unknown` with a type guard instead |
| Runtime npm dependencies | Extension ships devDependencies only; propose only with packaging trade-offs stated |
| Direct `execSync`/`execFileSync` outside `console.ts` | All `bin/console` access goes through the cached singleton |
| DOM/browser libraries (jQuery etc.) | No DOM in the Extension Host; webviews are not used in this project |
| Programmatic registration of commands/views | Static contributions belong in `package.json` |

When blocking a recommendation, cite `.claude/rules/tools/vscode-extension-rule.md`
or the relevant `app/**` source line.

---

# Part 3 — Code Review

## Review Scope

```bash
git diff main...HEAD --name-only -- app/   # Changed files
git diff main...HEAD -- app/               # Full diff
```

Review the TypeScript **source** under `app/src/**`, not the compiled `app/out/**`.
If a provider changed, also review `app/src/extension.ts` registration and
`app/package.json` — both sides of every contract must match.

## Review Checklist, Severity & Output Format — Canonical Source

To avoid drift, this skill does **not** re-list the review criteria. Apply the
single canonical definition from the `typescript-code-reviewer` agent
(`.claude/agents/app/base/typescript-code-reviewer.md`):

- **Checklist** — Correctness, Module System & Style, Type Safety, VSCode API
  Discipline, Security, Performance sections.
- **Severity ratings** — `[MUST]` / `[SHOULD]` / `[CONSIDER]`; only `[MUST]`
  blocks a merge.
- **Output format** — Summary → [MUST] → [SHOULD] → [CONSIDER] → Positive
  Feedback (at least one specific strength). Cite every finding as `{file}:{line}`.

For a **per-file deep audit** (invoked with a file path) use the
`/app:base:typescript-code-review` command
(`.claude/commands/app/base/typescript-code-review.md`) instead.

When applied inside this skill, keep the same criteria and output shape — only
the invocation context differs (in-conversation vs spawned subagent).

---

# References

| Area | File |
|------|-----------|
| VSCode API rules & pitfalls | `.claude/rules/tools/vscode-extension-rule.md` |
| Config reference (manifest, tsconfig, build, activation, contributions) | `.claude/docs/utility/vscode/extension-config-docs.md` |
| Source code reference (TypeScript: entry, data layer, providers, views) | `.claude/docs/app/base/typescript-code-docs.md` |
| Extension architecture | `app/CLAUDE.md`, `app/src/CLAUDE.md` |
| TypeScript style (tsc → out, formatting, type safety) | `.claude/output-styles/app/base/typescript-style.md` |
| Per-file deep review | `.claude/commands/app/base/typescript-code-review.md` (`/app:base:typescript-code-review`) |
| Test patterns | `app/src/test/CLAUDE.md` |

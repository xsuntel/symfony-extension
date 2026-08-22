# CLAUDE.md

## Project Overview

VSCode extension that provides Symfony Framework support for PHP and YAML files: services, routes, and parameters autocomplete, hover documentation, go-to-definition, and sidebar tree views. Written in **TypeScript**.

- VSCode API: [https://code.visualstudio.com/api](https://code.visualstudio.com/api)
- Language features: [https://code.visualstudio.com/api/language-extensions/programmatic-language-features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)
- Tree view guide: [https://code.visualstudio.com/api/extension-guides/tree-view](https://code.visualstudio.com/api/extension-guides/tree-view)
- Rules & quick-reference: [../.claude/rules/tools-vscode-extension-rule.md](../.claude/rules/tools-vscode-extension-rule.md)

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/
    ├── assets/                              ← Activity bar icons (see assets/CLAUDE.md)
    ├── src/                                 ← TypeScript source (see src/CLAUDE.md)
    │   ├── extension.ts                     ← Entry point: activate() / deactivate()
    │   ├── symfony/ · providers/ · views/   ← Data layer, language providers, tree views
    │   └── test/*.test.ts                   ← Mocha suites: extension · providers · views · console
    ├── out/                                 ← tsc build output (main loads ./out/extension.js)
    ├── .vscode-test.mjs                     ← @vscode/test-cli configuration
    ├── eslint.config.mjs                    ← ESLint flat config (typescript-eslint)
    ├── tsconfig.json                        ← TypeScript compiler config (strict, src → out)
    ├── package.json                         ← Extension manifest (engines, contributes, activationEvents)
    └── package-lock.json
```

## Build

TypeScript is the source language; the Extension Host runs the compiled JS in `out/`.

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run compile` | `tsc -p ./` | One-off build `src/**/*.ts` → `out/` |
| `npm run watch` | `tsc -watch -p ./` | Incremental rebuild during development |
| `vscode:prepublish` | `npm run compile` | Fresh build before packaging (`vsce`) |

- `main` = `./out/extension.js` (compiled entry — never a `src/*.ts` path)
- `tsconfig.json`: `rootDir: src`, `outDir: out`, `strict: true`, `sourceMap: true`
- `out/` is build output — never hand-edit; recompile (or keep `watch` running) before **F5**

## Extension Entry Point (`src/extension.ts`)

Implements the two mandatory VSCode lifecycle exports, typed against `vscode`:

```typescript
export function activate(context: vscode.ExtensionContext): void { /* called when an activationEvent fires */ }
export function deactivate(): void {}                             /* called on uninstall/shutdown */
```

All registered providers and commands are pushed to `context.subscriptions` so VSCode disposes them automatically on deactivation.

Registered in `activate()`:

| Registration call | API used |
| --- | --- |
| `vscode.window.createTreeView(id, { treeDataProvider })` | Tree views for services, routes, parameters |
| `vscode.languages.registerCompletionItemProvider(selector, provider, ...triggers)` | Autocomplete |
| `vscode.languages.registerHoverProvider(selector, provider)` | Hover docs |
| `vscode.languages.registerDefinitionProvider(selector, provider)` | Go-to-definition |
| `vscode.commands.registerCommand(id, handler)` | `symfony.refresh` command |

Language selector used everywhere: `const PHP_YAML: vscode.DocumentSelector = [{ language: 'php' }, { language: 'yaml' }]`

## Data Layer (`src/symfony/console.ts`)

Singleton module that shells out to Symfony's `bin/console` and caches results.
**Every getter is `async`** — the extension host is single-threaded, so a synchronous
spawn here would stall every other extension for the length of the PHP run.

- **Project root detection**: scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`
- **Command runner**: `promisify(execFile)('php', ['bin/console', ...args], { cwd, timeout: 10s, maxBuffer: 16MB })`, parses JSON as `unknown`. `execFile`, not `exec` — no shell, so no shell-quoting surface. The raised `maxBuffer` matters: `debug:container` output on a large app exceeds Node's 1 MB default and would otherwise fail with ENOBUFS.
- **Cache**: `Map<string, { data: unknown, time: number, ttl: number }>` keyed by command string — 30 s TTL on success, **5 s on failure**. Failures must be cached: otherwise a workspace with no working `php` re-spawns a timeout-bounded process on every keystroke.
- **In-flight de-duplication**: `Map<string, Promise<unknown>>` collapses concurrent callers (three tree views + a provider) onto one process.
- **Cache invalidation**: `invalidateCache()` clears both maps and bumps a generation counter, so a run that was already in flight cannot repopulate the cache afterwards. Called by each tree provider's `refresh()` and by `deactivate()`.
- **Export**: `export const symfonyConsole = new SymfonyConsole()`; typed shapes and narrowing helpers live in `src/symfony/types.ts`

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `Promise<ServiceMap>` (`.definitions` + `.aliases` merged) |
| `getRoutes()` | `debug:router --format=json` | `Promise<RouteMap>` (array/object normalised) |
| `getParameters()` | `debug:container --parameters --format=json` | `Promise<ParameterMap>` (unwrapped from `.parameters`) |

Raw JSON is never cast to a domain type. `types.ts` exports the narrowing functions
(`toServiceMap`, `toRouteMap`, `toParameterMap`, `toTagNames`) that reconcile CLI version
differences in one place, so providers and tree views consume one stable contract.

## Language Providers

Each provider `implements` its VSCode interface and returns `vscode.ProviderResult<T>`; see [src/CLAUDE.md](src/CLAUDE.md) for the completion/hover patterns and full contracts.

- `completionProvider.ts` — `CompletionItemProvider` (trigger chars `'`, `"`, `@`, `%`); fills `documentation` lazily in `resolveCompletionItem`
- `hoverProvider.ts` — `HoverProvider`
- `definitionProvider.ts` — `DefinitionProvider` (`findFiles` service class → `Location`)

Two invariants hold across all three:

- **Match before fetching.** Pattern matching runs first and synchronously, so a line that
  triggers nothing returns `[]` / `null` without ever reaching the process-spawning data layer.
- **Honour the `CancellationToken`.** Every entry point accepts it, re-checks
  `isCancellationRequested` after each `await`, and forwards it to `workspace.findFiles`.

## Tree Views (`src/views/`)

All three extend the abstract `SymfonyTreeProvider<T>` in `src/views/baseTreeProvider.ts`,
which owns the `EventEmitter<void>`, `refresh()`, `setFilter()`, `getTreeItem()`, and the
fetch → filter → sort → placeholder pipeline. A concrete provider supplies only three things:
a `noun` for the placeholder text, `fetch()`, and `createItem()`.
`ServiceItem` / `RouteItem` / `ParameterItem` extend `vscode.TreeItem`
(`label`, `description`, `tooltip`, `iconPath`, `contextValue`).

`SymfonyTreeProvider` also implements `FilterableTree extends vscode.Disposable`, so
`extension.ts` can hold the three differently-typed providers in one array without widening
to `any`, and `dispose()` releases the EventEmitter.

Registered with `vscode.window.createTreeView(id, { treeDataProvider, showCollapseAll: false })` — the returned `TreeView` disposable **must** be pushed to `context.subscriptions`; omitting this leaks the view on deactivation. **The providers themselves must be pushed too** — the EventEmitter behind `onDidChangeTreeData` outlives `activate()` and leaks otherwise.

View IDs (`package.json` → `contributes.views.symfony`): `symfony.services`, `symfony.routes`, `symfony.parameters`. Container id `symfony` under `contributes.viewsContainers.activitybar`.

## Commands

All three are declared in `package.json` under `contributes.commands` with
`"category": "Symfony"` (the Command Palette renders them as `Symfony: <title>`) and bound in
`contributes.menus["view/title"]` for all three views.

| Command | ID | Trigger |
| --- | --- | --- |
| Refresh | `symfony.refresh` | Toolbar button on all three tree views |
| Filter Items | `symfony.filter` | Toolbar button — input box, then `setFilter(text)` |
| Clear Filter | `symfony.clearFilter` | Toolbar button — `setFilter('')` |

The `symfony.refresh` handler calls each provider's `refresh()` (`invalidateCache()` then fire `onDidChangeTreeData`) and confirms via `setStatusBarMessage` — a toolbar button should not raise a notification toast on every click.

## `package.json` Manifest

| Field | Value |
| --- | --- |
| `engines.vscode` | `^1.120.0` (align with `@types/vscode`) |
| `activationEvents` | `["onLanguage:php", "onLanguage:yaml", "workspaceContains:**/bin/console"]` |
| `main` | `./out/extension.js` |
| `categories` | `["Programming Languages", "Other"]` |
| `license` | `MIT` (matches the repository `LICENSE`) |
| `repository` | `https://github.com/xsuntel/symfony-extension.git` |
| `publisher` | **`TODO-set-publisher-id`** — a placeholder; `vsce publish` fails until a real marketplace ID is set |

The `workspaceContains:**/bin/console` guard already scopes activation to Symfony workspaces — it does not need to be added.

## Development

- **Run extension**: keep `npm run watch` running, open `app/` as workspace root, press **F5** (Extension Development Host)
- **Compile**: `npm run compile` (`tsc -p ./` → `out/`)
- **Lint**: `npm run lint` (`eslint src`, typescript-eslint flat config)
- **Test**: `npm test` — runs `pretest` (`compile` + `lint`) then `@vscode/test-cli`

## Testing

Test runner: `@vscode/test-cli` + Mocha, configured in `.vscode-test.mjs` (`files: 'out/test/**/*.test.js'`).

Test source: `src/test/**/*.test.ts` (TypeScript) → compiled to `out/test/`. Runs inside a real VSCode Extension Development Host. See [src/test/CLAUDE.md](src/test/CLAUDE.md).

| Suite | Covers |
| --- | --- |
| `extension.test.ts` | Extension discovery, activation, command registration |
| `providers.test.ts` | Completion/hover/definition degradation (`[]` / `null`) plus registration via `vscode.execute*Provider` |
| `views.test.ts` | Empty state, disposability, and the shared filter/sort pipeline (via a `StubTree` subclass that supplies data) |
| `console.test.ts` | The pure `types.ts` normalisers — no VSCode host, no PHP process needed |

## Debugging

`.vscode/launch.json` (at repo root) should contain:

```jsonc
"args": ["--extensionDevelopmentPath=${workspaceFolder}/app"],
"outFiles": ["${workspaceFolder}/app/out/**/*.js"],
"preLaunchTask": "npm: watch"
```

`sourceMap: true` (in `tsconfig.json`) + `outFiles` let breakpoints in `src/*.ts` bind to the running `out/*.js`.

# CLAUDE.md

## Project Overview

VSCode extension that provides Symfony Framework support for PHP and YAML files: services, routes, and parameters autocomplete, hover documentation, go-to-definition, and sidebar tree views. Written in **TypeScript**.

- VSCode API: [https://code.visualstudio.com/api](https://code.visualstudio.com/api)
- Language features: [https://code.visualstudio.com/api/language-extensions/programmatic-language-features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)
- Tree view guide: [https://code.visualstudio.com/api/extension-guides/tree-view](https://code.visualstudio.com/api/extension-guides/tree-view)
- Rules & quick-reference: [../.claude/rules/tools/vscode-extension-rule.md](../.claude/rules/tools/vscode-extension-rule.md)

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/
    ├── assets/                              ← Activity bar icons (see assets/CLAUDE.md)
    ├── src/                                 ← TypeScript source (see src/CLAUDE.md)
    │   ├── extension.ts                     ← Entry point: activate() / deactivate()
    │   ├── symfony/ · providers/ · views/   ← Data layer, language providers, tree views
    │   └── test/extension.test.ts           ← Mocha test suite
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

- **Project root detection**: scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`
- **Command runner**: `execSync('php bin/console <args>', { cwd, timeout: 10s })`, parses JSON as `unknown`
- **Cache**: `Map<string, { data: unknown, time: number }>` with 30-second TTL per command string
- **Cache invalidation**: `invalidateCache()` clears the whole map (called by each tree provider's `refresh()`, which the `symfony.refresh` command invokes on all three)
- **Export**: `export const symfonyConsole = new SymfonyConsole()`; typed shapes live in `src/symfony/types.ts`

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `ServiceMap` (unwrapped from `.definitions`) |
| `getRoutes()` | `debug:router --format=json` | `RouteMap` (array/object normalised) |
| `getParameters()` | `debug:container --parameters --format=json` | `ParameterMap` (unwrapped from `.parameters`) |

## Language Providers

Each provider `implements` its VSCode interface and returns `vscode.ProviderResult<T>`; see [src/CLAUDE.md](src/CLAUDE.md) for the completion/hover patterns and full contracts.

- `completionProvider.ts` — `CompletionItemProvider` (trigger chars `'`, `"`, `@`, `%`)
- `hoverProvider.ts` — `HoverProvider`
- `definitionProvider.ts` — `DefinitionProvider` (async; `findFiles` service class → `Location`)

## Tree Views (`src/views/`)

All three implement `vscode.TreeDataProvider<vscode.TreeItem>` with a typed
`EventEmitter<void>`. `ServiceItem` / `RouteItem` / `ParameterItem` extend
`vscode.TreeItem` (`label`, `description`, `tooltip`, `iconPath`, `contextValue`).

Registered with `vscode.window.createTreeView(id, { treeDataProvider, showCollapseAll: false })` — the returned `TreeView` disposable **must** be pushed to `context.subscriptions`; omitting this leaks the view on deactivation.

View IDs (`package.json` → `contributes.views.symfony`): `symfony.services`, `symfony.routes`, `symfony.parameters`. Container id `symfony` under `contributes.viewsContainers.activitybar`.

## Commands

| Command | ID | Trigger |
| --- | --- | --- |
| Symfony: Refresh | `symfony.refresh` | Toolbar button on all three tree views |

The `symfony.refresh` handler calls each provider's `refresh()` (`invalidateCache()` then fire `onDidChangeTreeData`) and shows `showInformationMessage('Symfony: cache refreshed.')`. Declared in `package.json` under `contributes.commands` (icon `$(refresh)`) and bound in `contributes.menus["view/title"]`.

## `package.json` Manifest

| Field | Value |
| --- | --- |
| `engines.vscode` | `^1.120.0` (align with `@types/vscode`) |
| `activationEvents` | `["onLanguage:php", "onLanguage:yaml"]` |
| `main` | `./out/extension.js` |
| `categories` | `["Other"]` |

Consider adding `"workspaceContains:**/symfony.lock"` or `"workspaceContains:**/bin/console"` to `activationEvents` to avoid loading the extension in non-Symfony PHP projects.

## Development

- **Run extension**: keep `npm run watch` running, open `app/` as workspace root, press **F5** (Extension Development Host)
- **Compile**: `npm run compile` (`tsc -p ./` → `out/`)
- **Lint**: `npm run lint` (`eslint src`, typescript-eslint flat config)
- **Test**: `npm test` — runs `pretest` (`compile` + `lint`) then `@vscode/test-cli`

## Testing

Test runner: `@vscode/test-cli` + Mocha, configured in `.vscode-test.mjs` (`files: 'out/test/**/*.test.js'`).

Test source: `src/test/**/*.test.ts` (TypeScript) → compiled to `out/test/`. Runs inside a real VSCode Extension Development Host. See [src/test/CLAUDE.md](src/test/CLAUDE.md).

## Debugging

`.vscode/launch.json` (at repo root) should contain:

```jsonc
"args": ["--extensionDevelopmentPath=${workspaceFolder}/app"],
"outFiles": ["${workspaceFolder}/app/out/**/*.js"],
"preLaunchTask": "npm: watch"
```

`sourceMap: true` (in `tsconfig.json`) + `outFiles` let breakpoints in `src/*.ts` bind to the running `out/*.js`.

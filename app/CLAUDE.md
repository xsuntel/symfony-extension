# CLAUDE.md

## Project Overview

VSCode extension that provides Symfony Framework support for PHP and YAML files: services, routes, and parameters autocomplete, hover documentation, go-to-definition, and sidebar tree views.

- VSCode API: [https://code.visualstudio.com/api](https://code.visualstudio.com/api)
- Language features: [https://code.visualstudio.com/api/language-extensions/programmatic-language-features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)
- Tree view guide: [https://code.visualstudio.com/api/extension-guides/tree-view](https://code.visualstudio.com/api/extension-guides/tree-view)
- Rules & quick-reference: [../.claude/rules/tools/vscode-extension.md](../.claude/rules/tools/vscode-extension.md)

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/
    ├── assets/
    ├── src/
    ├── test/
    ├── .vscode-test.mjs                     ← @vscode/test-cli configuration
    ├── eslint.config.mjs                    ← ESLint flat config
    ├── extension.js                         ← Entry point: activate() / deactivate()
    ├── package.json                         ← Extension manifest (engines, contributes, activationEvents)
    ├── jsconfig.json                        ← JS type checking config
    ├── package-lock.json
    └── package.json
```

## Extension Entry Point (`extension.js`)

Implements the two mandatory VSCode lifecycle exports:

```js
function activate(context) { /* called when an activationEvent fires */ }
function deactivate() {}    /* called on uninstall/shutdown */
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

Language selector used everywhere: `[{ language: 'php' }, { language: 'yaml' }]`

## Data Layer (`src/symfony/console.js`)

Singleton module that shells out to Symfony's `bin/console` and caches results.

- **Project root detection**: scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`
- **Command runner**: `execSync('php bin/console <args>', { cwd, timeout: 10s })`, parses JSON output
- **Cache**: `Map<args, { data, time }>` with 30-second TTL per command string
- **Cache invalidation**: `invalidateCache()` clears the whole map (called by `symfony.refresh`)

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `Record<serviceId, { class, public, shared, autowire, tags }>` |
| `getRoutes()` | `debug:router --format=json` | `Record<routeName, { path, method, controller, host }>` |
| `getParameters()` | `debug:container --parameters --format=json` | `Record<paramName, any>` |

Routes: Symfony 6+ returns an array; older versions return an object — both are normalised to `Record`.

## Language Providers

### `completionProvider.js` — `CompletionItemProvider`

VSCode interface:

```js
provideCompletionItems(document, position, token) → CompletionItem[] | CompletionList | null
resolveCompletionItem?(item, token) → CompletionItem   // optional: fill details lazily
```

Trigger characters registered: `'`, `"`, `@`, `%`

Completion triggers by context:

| Language | Pattern matched on `linePrefix` | Completes |
| --- | --- | --- |
| PHP | `->get('`, `->has('` | Services |
| PHP | `#[Autowire(service: '` | Services |
| PHP | `->redirectToRoute('`, `->generateUrl('`, `->forward('`, `route('` | Routes |
| PHP | `->getParameter('` | Parameters |
| PHP | `#[Autowire(value: '%` | Parameters |
| YAML | `@<token>` | Services |
| YAML | `'%<token>` or `"%<token>` | Parameters |

`CompletionItemKind` mapping: services → `Class`, routes → `Reference`, parameters → `Variable`

Each item sets `label`, `detail` (class / path / value preview), `documentation` (`MarkdownString`), and `sortText`.

### `hoverProvider.js` — `HoverProvider`

VSCode interface:

```js
provideHover(document, position, token) → Hover | null
```

Reads the full line text and applies regex patterns to extract the token under the cursor. Returns `new vscode.Hover(markdownString)` or `null` when not matched.

Hover patterns:

| Language | Regex | Shows |
| --- | --- | --- |
| PHP | `->get('id')` / `->has('id')` | Service class, public, shared, autowire, tags |
| PHP | `->redirectToRoute('name')` etc. | Route path, method, controller, host |
| PHP | `->getParameter('name')` / `%name%` | Parameter value (JSON-formatted for objects) |
| YAML | `@serviceId` | Service details |
| YAML | `%paramName%` | Parameter value |

### `definitionProvider.js` — `DefinitionProvider`

VSCode interface:

```js
provideDefinition(document, position, token) → Location | Location[] | null
```

- Extracts service ID from the current line (PHP or YAML pattern)
- Resolves the PHP class FQCN via `getServices()`
- Searches workspace using `vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5)` (max 5 hits, vendor excluded)
- When multiple files match, prefers the one whose path contains the last two namespace segments
- Returns `new vscode.Location(uri, new vscode.Position(0, 0))`

## Tree Views (`src/views/`)

All three providers follow the same `TreeDataProvider` pattern:

VSCode interface:

```js
getTreeItem(element) → TreeItem
getChildren(element?) → TreeItem[]   // element undefined = root level
onDidChangeTreeData   → Event        // fire to trigger UI refresh
```

`ServiceItem` / `RouteItem` / `ParameterItem` extend `vscode.TreeItem`:

| Property | Usage |
| --- | --- |
| `label` | Service ID / route name / parameter name |
| `description` | Class name / path / value preview |
| `tooltip` | `MarkdownString` with full details |
| `iconPath` | `ThemeIcon` (e.g. `symbol-class`, `symbol-interface`, `warning`) |
| `contextValue` | `'symfonyService'` etc. — used in `when` clauses for context menus |
| `collapsibleState` | `TreeItemCollapsibleState.None` (leaf nodes) |

Registered with `vscode.window.createTreeView(id, { treeDataProvider, showCollapseAll: false })` — returns a `TreeView` disposable that **must** be pushed to `context.subscriptions`; omitting this causes a resource leak on deactivation.

> **Current state**: `extension.js` calls `createTreeView` but does not push the returned views to `context.subscriptions`. This is a known gap — fix by assigning each result and pushing it alongside the language providers.

View IDs declared in `package.json` under `contributes.views.symfony`:

- `symfony.services`, `symfony.routes`, `symfony.parameters`

Container declared under `contributes.viewsContainers.activitybar` with id `symfony`.

## Commands

| Command | ID | Trigger |
| --- | --- | --- |
| Symfony: Refresh | `symfony.refresh` | Toolbar button on all three tree views |

The refresh command: clears console cache → fires `onDidChangeTreeData` on all three providers → shows `showInformationMessage`.

Declared in `package.json` under `contributes.commands` with icon `$(refresh)` and bound in `contributes.menus["view/title"]` with `when: view == symfony.services || ...`.

## `package.json` Manifest

Key fields:

| Field | Value |
| --- | --- |
| `engines.vscode` | `^1.120.0` |
| `activationEvents` | `["onLanguage:php", "onLanguage:yaml"]` |
| `main` | `./extension.js` |
| `categories` | `["Other"]` |

Consider adding `"workspaceContains:**/symfony.lock"` or `"workspaceContains:**/bin/console"` to `activationEvents` to avoid loading the extension in non-Symfony PHP projects.

## Development

- **Run extension**: Open `app/` as workspace root and press **F5** — launches the Extension Development Host
- **Lint**: `npm run lint` (ESLint flat config via `eslint.config.mjs`)
- **Test**: `npm test` — runs `pretest` (lint) then `@vscode/test-cli`

## Testing

Test runner: `@vscode/test-cli` + Mocha, configured in `.vscode-test.mjs`.

Test file: `test/extension.test.js` — runs inside a real VSCode Extension Development Host instance.

Useful testing patterns:

- Activate the extension explicitly: `await vscode.extensions.getExtension('...').activate()`
- Open a document: `await vscode.workspace.openTextDocument({ language: 'php', content: '...' })`
- Invoke completion: `await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, position)`
- Invoke hover: `await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)`
- Invoke go-to-definition: `await vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, position)`

## Debugging

`launch.json` (at repo root) must contain:

```json
"--extensionDevelopmentPath=${workspaceFolder}/app"
```

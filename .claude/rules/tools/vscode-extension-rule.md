# VSCode Extension (TypeScript)

@see https://code.visualstudio.com/api
@see https://code.visualstudio.com/api/get-started/your-first-extension
@see https://code.visualstudio.com/api/get-started/extension-anatomy
@see https://code.visualstudio.com/api/language-extensions/programmatic-language-features
@see https://code.visualstudio.com/api/extension-guides/tree-view
@see https://code.visualstudio.com/api/references/activation-events
@see https://code.visualstudio.com/api/references/contribution-points
@see https://code.visualstudio.com/api/references/vscode-api

TypeScript is the extension's primary language. Source lives in `app/src/**/*.ts`
(entry `app/src/extension.ts`), is compiled by `tsc -p ./` to `app/out/`, and the
Extension Host loads the manifest `main` (`./out/extension.js`).

## Build & Layout

- Source: `src/extension.ts` + `src/**/*.ts`; tests: `test/**/*.ts`; compiled output: `out/`
- Compile: `tsc -p ./` → `out/`; watch during development: `tsc -watch -p ./`
- `package.json` scripts: `"vscode:prepublish": "npm run compile"`, `"compile": "tsc -p ./"`, `"watch": "tsc -watch -p ./"`
- `main` points at the **compiled** entry — `"./out/extension.js"`, never a `src/*.ts` path
- `tsconfig.json`: `strict` on, `module` `Node16` (or `commonjs`), `outDir` `out`, `rootDir` `src`, `sourceMap` for debugging
- Ship `devDependencies` only (`typescript`, `@types/vscode`, `@types/node`, `typescript-eslint`) — no runtime dependency without an explicit request
- `out/` is build output: never hand-edit compiled JS, and recompile before launching (stale `out/` runs old code)

## Key Rules

- All disposables (providers, commands, tree views, listeners) **must** be pushed to `context.subscriptions` — VSCode calls `dispose()` on each when the extension deactivates
- Never call `dispose()` manually unless intentionally removing a single subscription early
- Static contributions (commands, views, menus, keybindings) go in `package.json`; never register them programmatically in `activate()`
- `activationEvents` must match actual usage — a missing event silently prevents the extension from activating
- Do not block `activate()` with long-running operations; defer heavy work with async patterns
- Entry point is typed: `export function activate(context: vscode.ExtensionContext): void` and `export function deactivate(): void`

## Provider Interfaces (quick reference)

### CompletionItemProvider

```typescript
provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>
// optional — fill detail/documentation lazily:
resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem>
```

### HoverProvider

```typescript
provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
): vscode.ProviderResult<vscode.Hover>
```

### DefinitionProvider

```typescript
provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]>
```

### TreeDataProvider&lt;T&gt;

```typescript
getTreeItem(element: T): vscode.TreeItem | Thenable<vscode.TreeItem>
getChildren(element?: T): vscode.ProviderResult<T[]>   // element undefined = root level
onDidChangeTreeData?: vscode.Event<T | T[] | undefined | null | void>
```

Fire `onDidChangeTreeData` via a typed `EventEmitter`:

```typescript
private readonly _onDidChangeTreeData = new vscode.EventEmitter<T | undefined | void>();
readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
// trigger a refresh:
this._onDidChangeTreeData.fire();
```

## Registration Patterns

```typescript
// Language providers
context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, provider, ...triggerChars),
    vscode.languages.registerHoverProvider(selector, provider),
    vscode.languages.registerDefinitionProvider(selector, provider),
);

// Tree view — createTreeView returns a TreeView disposable; push it to subscriptions
const view = vscode.window.createTreeView(viewId, { treeDataProvider, showCollapseAll: false });
context.subscriptions.push(view);

// Command
context.subscriptions.push(
    vscode.commands.registerCommand('extension.commandId', handler),
);
```

## Workspace File Search

```typescript
// Find PHP files matching a glob, excluding vendor
const uris: vscode.Uri[] = await vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5);
// Convert a URI to a Location:
new vscode.Location(uri, new vscode.Position(0, 0));
```

## `package.json` Manifest Checklist

| Field | Notes |
| --- | --- |
| `engines.vscode` | Minimum VSCode version (e.g. `"^1.120.0"`) — must align with the installed `@types/vscode` |
| `activationEvents` | Events that trigger `activate()` (e.g. `onLanguage:php`, `onLanguage:yaml`) |
| `main` | Compiled entry point — `"./out/extension.js"` |
| `scripts.compile` / `scripts.watch` | `tsc -p ./` / `tsc -watch -p ./`; `vscode:prepublish` runs `compile` |
| `contributes.commands` | `command` ID + `title` + optional `icon` / `category` |
| `contributes.views.<containerId>` | Tree view `id` + `name` per view |
| `contributes.viewsContainers.activitybar` | Sidebar container `id`, `title`, `icon` (SVG path) |
| `contributes.menus` | Bind commands to `view/title`, `view/item/context`, `editor/context`, etc. |

## Common Pitfalls

- **Stale `out/`**: editing `src/**/*.ts` without recompiling runs the previous JS. Keep `tsc -watch -p ./` running, or `npm run compile` before **F5**.
- **`main` pointing at `src/`**: the Extension Host loads compiled JS; `main` must be `./out/extension.js`, not a `.ts` path.
- **Tree views not disposed**: `createTreeView()` returns a `TreeView` — forgetting to push it to `context.subscriptions` leaks the view on deactivation.
- **Wrong trigger characters**: trigger chars must be registered in `registerCompletionItemProvider(..., ...triggerChars)` AND handled in `provideCompletionItems`; a mismatch causes completions never to fire.
- **Blocking `activate()`**: calling `execSync` or other blocking I/O directly in `activate()` delays VSCode startup; use async shells or lazy initialisation.
- **Non-Symfony activation**: `onLanguage:php` fires for any PHP project. Add `workspaceContains:**/symfony.lock` or `workspaceContains:**/bin/console` to scope activation to Symfony workspaces only.
- **`any` leakage**: `child_process` and `JSON.parse` results are `any` / `unknown` — type and narrow them with a type guard; never let `any` flow into a provider return.

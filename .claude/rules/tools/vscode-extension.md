
# VSCode Extension

@see https://code.visualstudio.com/api
@see https://code.visualstudio.com/api/get-started/your-first-extension
@see https://code.visualstudio.com/api/get-started/extension-anatomy
@see https://code.visualstudio.com/api/language-extensions/programmatic-language-features
@see https://code.visualstudio.com/api/extension-guides/tree-view
@see https://code.visualstudio.com/api/references/activation-events
@see https://code.visualstudio.com/api/references/contribution-points
@see https://code.visualstudio.com/api/references/vscode-api

## Key Rules

- All disposables (providers, commands, tree views, listeners) **must** be pushed to `context.subscriptions` — VSCode calls `dispose()` on each when the extension deactivates
- Never call `dispose()` manually unless intentionally removing a single subscription early
- Static contributions (commands, views, menus, keybindings) go in `package.json`; never register them programmatically in `activate()`
- `activationEvents` must match actual usage — a missing event silently prevents the extension from activating
- Do not block `activate()` with long-running operations; defer heavy work with `setTimeout` or async patterns

## Provider Interfaces (quick reference)

### CompletionItemProvider

```js
provideCompletionItems(document, position, token, context) → CompletionItem[] | CompletionList | null
resolveCompletionItem(item, token) → CompletionItem   // optional — fill detail/documentation lazily
```

### HoverProvider

```js
provideHover(document, position, token) → Hover | null
```

### DefinitionProvider

```js
provideDefinition(document, position, token) → Location | Location[] | LocationLink[] | null
```

### TreeDataProvider

```js
getTreeItem(element) → TreeItem | Thenable<TreeItem>
getChildren(element?) → ProviderResult<T[]>   // element undefined = root level
onDidChangeTreeData?: Event<T | T[] | undefined | null | void>
```

Fire `onDidChangeTreeData` via an `EventEmitter`:

```js
const emitter = new vscode.EventEmitter();
this.onDidChangeTreeData = emitter.event;
// trigger refresh:
emitter.fire();
```

## Registration Patterns

```js
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
    vscode.commands.registerCommand('extension.commandId', handler)
);
```

## Workspace File Search

```js
// Find PHP files matching a glob, excluding vendor
const uris = await vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5);
// Returns URI[] — convert to Location with:
new vscode.Location(uri, new vscode.Position(0, 0))
```

## `package.json` Manifest Checklist

| Field | Notes |
| --- | --- |
| `engines.vscode` | Minimum VSCode version (e.g. `"^1.120.0"`) |
| `activationEvents` | Events that trigger `activate()` |
| `main` | Entry point path (e.g. `"./extension.js"`) |
| `contributes.commands` | `command` ID + `title` + optional `icon` / `category` |
| `contributes.views.<containerId>` | Tree view `id` + `name` per view |
| `contributes.viewsContainers.activitybar` | Sidebar container `id`, `title`, `icon` (SVG path) |
| `contributes.menus` | Bind commands to `view/title`, `view/item/context`, `editor/context`, etc. |

## Common Pitfalls

- **Tree views not disposed**: `createTreeView()` returns a `TreeView` — forgetting to push it to `context.subscriptions` leaks the view on deactivation.
- **Wrong trigger characters**: Trigger chars must be registered in `registerCompletionItemProvider(..., triggerChars)` AND handled in `provideCompletionItems`; mismatch causes completions never to fire.
- **Blocking `activate()`**: Calling `execSync` or other blocking I/O directly in `activate()` delays VSCode startup; use async shells or lazy initialisation.
- **Non-Symfony activation**: `onLanguage:php` fires for any PHP project. Add `workspaceContains:**/symfony.lock` or `workspaceContains:**/bin/console` to scope activation to Symfony workspaces only.

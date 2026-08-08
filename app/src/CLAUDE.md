# CLAUDE.md

> Scope: the `app/src/` source tree only. For the extension manifest, build,
> commands, testing, and debugging, see [../CLAUDE.md](../CLAUDE.md) (single source of truth).

TypeScript source compiled by `tsc -p ./` (`app/tsconfig.json`, `rootDir: src`,
`outDir: out`, `strict`) to `app/out/`; the manifest `main` loads `./out/extension.js`.

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/                                     ← VSCode extension source (workspace root for dev)
    └── src/
        ├── extension.ts                    ← activate()/deactivate(), all registrations
        ├── symfony/
        │   ├── types.ts                    ← Typed Symfony payload shapes (ServiceMap, RouteMap, …)
        │   └── console.ts                  ← Singleton: runs bin/console, caches results (30s TTL)
        ├── providers/
        │   ├── completionProvider.ts       ← CompletionItemProvider (PHP + YAML)
        │   ├── hoverProvider.ts            ← HoverProvider (PHP + YAML)
        │   └── definitionProvider.ts       ← DefinitionProvider for service classes (PHP + YAML)
        ├── views/
        │   ├── servicesTreeProvider.ts     ← TreeDataProvider: Symfony services
        │   ├── routesTreeProvider.ts       ← TreeDataProvider: Symfony routes
        │   └── parametersTreeProvider.ts   ← TreeDataProvider: Symfony parameters
        └── test/
            └── extension.test.ts           ← Mocha suite (compiled to out/test/)
```

## Module System

- ES module syntax (`import` / `export`) in source; `tsc` emits CommonJS to `out/`, which the Extension Host loads via `require()`.
- `console.ts` exports a singleton instance: `export const symfonyConsole = new SymfonyConsole()`.
- Provider/view classes are named exports (`export class SymfonyHoverProvider …`).

## Typed Data Shapes (`src/symfony/types.ts`)

`bin/console --format=json` payloads are modelled as interfaces; parsed JSON is
typed `unknown` and narrowed — never cast raw.

```typescript
export interface ServiceDefinition { class?: string; public?: boolean; shared?: boolean; autowire?: boolean; tags?: Record<string, unknown[]>; }
export interface RouteDefinition { name?: string; path?: string; method?: string; controller?: string; host?: string; }
export type ServiceMap = Record<string, ServiceDefinition>;
export type RouteMap = Record<string, RouteDefinition>;
export type ParameterMap = Record<string, unknown>;
```

## Data Layer (`src/symfony/console.ts`)

Singleton module that shells out to Symfony's `bin/console` and caches results.

- **Project root detection**: scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`
- **Command runner**: `execSync('php bin/console <args>', { cwd, timeout: 10s })`, parses JSON as `unknown`
- **Cache**: `Map<string, { data: unknown, time: number }>` with 30-second TTL per command string
- **Cache invalidation**: `invalidateCache()` clears the map (called by each tree provider's `refresh()`)

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `ServiceMap` (unwrapped from `.definitions`) |
| `getRoutes()` | `debug:router --format=json` | `RouteMap` (Symfony 6+ array / older object, normalised) |
| `getParameters()` | `debug:container --parameters --format=json` | `ParameterMap` (unwrapped from `.parameters`) |

## Language Providers (`src/providers/`)

Each provider `implements` its VSCode interface, returns `vscode.ProviderResult<T>`,
and **never throws** — guard-clause the line pattern before fetching data.

### `completionProvider.ts` — `CompletionItemProvider`

```typescript
provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]>
```

Trigger characters registered: `'`, `"`, `@`, `%`

| Language | Pattern matched on `linePrefix` | Completes |
| --- | --- | --- |
| PHP | `->get('`, `->has('` | Services |
| PHP | `#[Autowire(service: '` | Services |
| PHP | `->redirectToRoute('`, `->generateUrl('`, `->forward('`, `route('` | Routes |
| PHP | `->getParameter('` | Parameters |
| PHP | `#[Autowire(value: '%` | Parameters |
| YAML | `@<token>` | Services |
| YAML | `'%<token>` or `"%<token>` | Parameters |

`CompletionItemKind` mapping: services → `Class`, routes → `Reference`, parameters → `Variable`.
Each item sets `label`, `detail`, `documentation` (`vscode.MarkdownString`), and `sortText`.

### `hoverProvider.ts` — `HoverProvider`

```typescript
provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover>
```

Reads the full line, regex-extracts the token under the cursor, returns
`new vscode.Hover(markdown)` or `null`.

| Language | Regex | Shows |
| --- | --- | --- |
| PHP | `->get('id')` / `->has('id')` | Service class, public, shared, autowire, tags |
| PHP | `->redirectToRoute('name')` etc. | Route path, method, controller, host |
| PHP | `->getParameter('name')` / `%name%` | Parameter value (JSON-formatted for objects) |
| YAML | `@serviceId` | Service details |
| YAML | `%paramName%` | Parameter value |

### `definitionProvider.ts` — `DefinitionProvider`

```typescript
provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location | null>
```

- Extracts service ID from the current line (PHP or YAML pattern)
- Resolves the PHP class FQCN via `getServices()`
- Searches with `vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5)` (max 5, vendor excluded)
- When multiple files match, prefers the one whose path contains the last two namespace segments
- Returns `new vscode.Location(uri, new vscode.Position(0, 0))`

## Tree Views (`src/views/`)

All three implement `vscode.TreeDataProvider<vscode.TreeItem>`:

```typescript
private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
getTreeItem(element: vscode.TreeItem): vscode.TreeItem
getChildren(): vscode.TreeItem[]   // flat list; empty-state item when no data
```

`ServiceItem` / `RouteItem` / `ParameterItem` extend `vscode.TreeItem`:

| Property | Usage |
| --- | --- |
| `label` | Service ID / route name / parameter name |
| `description` | Class name / path / value preview |
| `tooltip` | `vscode.MarkdownString` with full details |
| `iconPath` | `vscode.ThemeIcon` (e.g. `symbol-class`, `symbol-interface`, `symbol-event`, `symbol-variable`, `warning`) |
| `contextValue` | `'symfonyService'` etc. — used in `when` clauses for context menus |
| `collapsibleState` | `TreeItemCollapsibleState.None` (leaf nodes) |

Each provider exposes `refresh()` (`invalidateCache()` + fire `onDidChangeTreeData`) and
`setFilter(text)` (lowercased filter applied in `getChildren`, then fire).

> **Check rule**: every `createTreeView` return value must be pushed to `context.subscriptions`.
> `extension.ts` pushes all three views alongside the language providers — keep this invariant.
> **Finding**: `setFilter` is not bound to any command/menu in `package.json` / `extension.ts`,
> so it is currently unreachable from the UI. Wire a command before documenting it as a feature.

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
        │   ├── types.ts                    ← Payload shapes + the narrowing helpers (toServiceMap, …)
        │   └── console.ts                  ← Singleton: runs bin/console async, caches results
        ├── providers/
        │   ├── cursorToken.ts              ← tokenAt(): the match under the cursor, not the line's first
        │   ├── completionProvider.ts       ← CompletionItemProvider (PHP + YAML)
        │   ├── hoverProvider.ts            ← HoverProvider (PHP + YAML)
        │   └── definitionProvider.ts       ← DefinitionProvider for service classes (PHP + YAML)
        ├── views/
        │   ├── baseTreeProvider.ts         ← abstract SymfonyTreeProvider<T>: emitter, filter, pipeline
        │   ├── emptyState.ts               ← placeholder(): the warning row for empty/no-match trees
        │   ├── servicesTreeProvider.ts     ← TreeDataProvider: Symfony services
        │   ├── routesTreeProvider.ts       ← TreeDataProvider: Symfony routes
        │   └── parametersTreeProvider.ts   ← TreeDataProvider: Symfony parameters
        └── test/
            ├── extension.test.ts           ← Activation + command registration
            ├── providers.test.ts           ← Provider degradation + registration
            ├── views.test.ts               ← Empty state, disposal, filter/sort pipeline
            └── console.test.ts             ← Pure normalisers from types.ts
```

## Module System

- ES module syntax (`import` / `export`) in source; `tsc` emits CommonJS to `out/`, which the Extension Host loads via `require()`.
- `console.ts` exports a singleton instance: `export const symfonyConsole = new SymfonyConsole()`.
- Provider/view classes are named exports (`export class SymfonyHoverProvider …`).

## Typed Data Shapes (`src/symfony/types.ts`)

`bin/console --format=json` payloads are modelled as interfaces; parsed JSON is
typed `unknown` and narrowed — never cast raw.

```typescript
export interface ServiceDefinition { class?: string; public?: boolean; shared?: boolean; autowire?: boolean; tags?: string[]; }
export interface RouteDefinition { name?: string; path?: string; method?: string; controller?: string; host?: string; }
export type ServiceMap = Record<string, ServiceDefinition>;
export type RouteMap = Record<string, RouteDefinition>;
export type ParameterMap = Record<string, unknown>;
```

`types.ts` is also the **only** place CLI version differences are reconciled. The exported
narrowing functions are the sole path from `unknown` to a domain type:

| Helper | Absorbs |
| --- | --- |
| `toServiceMap(data)` | Unwraps `.definitions`, then merges `.aliases` (string or `{ service }` form) so short IDs like `mailer` resolve; an alias never shadows a real definition |
| `toRouteMap(data)` | Symfony 6+ array vs. older object; backfills `name` from the key; falls back to `defaults._controller` for the controller |
| `toParameterMap(data)` | Unwraps `.parameters` |
| `toTagNames(tags)` | Object-keyed map, array of names, or array of `{ name, …attrs }` → plain `string[]` |

Note `tags` is normalised to `string[]`, so consumers read `def.tags ?? []` — never
`Object.keys(def.tags)`, which renders numeric indices when the CLI emits an array.

## Data Layer (`src/symfony/console.ts`)

Singleton module that shells out to Symfony's `bin/console` and caches results.
**Every getter is `async`**: the extension host is single-threaded, so synchronous spawning
here stalls every other extension for the duration of the PHP run.

- **Project root detection**: scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`
- **Command runner**: `promisify(execFile)('php', ['bin/console', ...args], { cwd, timeout: 10s, maxBuffer: 16MB })`, parses JSON as `unknown`
- **Cache**: `Map<string, { data, time, ttl }>` — 30 s TTL on success, 5 s on failure so a fixed project recovers without a manual Refresh
- **In-flight de-duplication**: concurrent callers for the same command share one process
- **Cache invalidation**: `invalidateCache()` clears the maps and bumps a generation counter so an in-flight run cannot repopulate the cache afterwards

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `Promise<ServiceMap>` (`.definitions` + `.aliases`) |
| `getRoutes()` | `debug:router --format=json` | `Promise<RouteMap>` (Symfony 6+ array / older object, normalised) |
| `getParameters()` | `debug:container --parameters --format=json` | `Promise<ParameterMap>` (unwrapped from `.parameters`) |

## Language Providers (`src/providers/`)

Each provider `implements` its VSCode interface, returns `vscode.ProviderResult<T>`,
and **never throws** — guard-clause the line pattern before fetching data.

Two invariants apply to all three:

- **Match before fetching.** Pattern matching is synchronous and runs first, so a line that
  triggers nothing returns without awaiting the process-spawning data layer at all.
- **Honour the `CancellationToken`.** Each entry point takes it, re-checks
  `isCancellationRequested` after every `await`, and passes it to `workspace.findFiles`.

`cursorToken.ts#tokenAt(document, position, regex)` is the shared extractor: it uses
`getWordRangeAtPosition` so the token resolved is the one **under the cursor**, not the line's
first match. Regexes passed to it must not carry the global flag.

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
Each item sets `label`, `detail`, and `sortText` eagerly. `documentation` is **not** built up
front: items are `SymfonyCompletionItem`s carrying a `describe()` factory, and
`resolveCompletionItem` renders the `MarkdownString` only for the entry the user highlights.
A container with thousands of services would otherwise allocate thousands of MarkdownStrings
on every keystroke.

### `hoverProvider.ts` — `HoverProvider`

```typescript
provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover>
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
provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location | null>
```

- Extracts service ID from the current line (PHP or YAML pattern)
- Resolves the PHP class FQCN via `await getServices()`
- Searches with `vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5, token)` (max 5, vendor excluded)
- When multiple files match, prefers the one whose path contains the last two namespace segments
- Returns `new vscode.Location(uri, new vscode.Position(0, 0))`

## Tree Views (`src/views/`)

All three extend the abstract `SymfonyTreeProvider<T>` in `baseTreeProvider.ts`, which
implements `vscode.TreeDataProvider<vscode.TreeItem>` and owns everything shared:

```typescript
export abstract class SymfonyTreeProvider<T> implements vscode.TreeDataProvider<vscode.TreeItem>, FilterableTree {
    protected abstract readonly noun: string;               // placeholder wording
    protected abstract fetch(): Promise<Record<string, T>>;
    protected abstract createItem(key: string, value: T): vscode.TreeItem;

    getChildren(): Promise<vscode.TreeItem[]>   // fetch → filter → sort → placeholder
    dispose(): void                             // releases the EventEmitter
}
```

A concrete provider is therefore only a `noun`, a `fetch()`, and a `createItem()`.
`FilterableTree` is the non-generic slice (`refresh` / `setFilter` / `dispose`) that lets
`extension.ts` hold all three in one array without widening to `any`.

`ServiceItem` / `RouteItem` / `ParameterItem` extend `vscode.TreeItem`:

| Property | Usage |
| --- | --- |
| `label` | Service ID / route name / parameter name |
| `description` | Class name / path / value preview |
| `tooltip` | `vscode.MarkdownString` with full details |
| `iconPath` | `vscode.ThemeIcon` (e.g. `symbol-class`, `symbol-interface`, `symbol-event`, `symbol-variable`, `warning`) |
| `contextValue` | `'symfonyService'` etc. — used in `when` clauses for context menus |
| `collapsibleState` | `TreeItemCollapsibleState.None` (leaf nodes) |

The base class exposes `refresh()` (`invalidateCache()` + fire `onDidChangeTreeData`) and
`setFilter(text)` (lowercased filter applied in `getChildren`, then fire). When a filter
matches nothing, `getChildren` returns a `placeholder(...)` row rather than a blank tree.

> **Check rule**: every `createTreeView` return value must be pushed to `context.subscriptions`
> — **and so must each provider**, since it owns the EventEmitter behind `onDidChangeTreeData`.
> `extension.ts` pushes the three views plus the three providers (`...trees`) alongside the
> language providers. Keep this invariant.
> **`setFilter` is wired**: the `symfony.filter` and `symfony.clearFilter` commands
> (`package.json` `contributes.commands` + the `view/title` menu) call `setFilter(...)` on all three
> tree providers in `extension.ts`, so the filter is reachable from each view's title bar.

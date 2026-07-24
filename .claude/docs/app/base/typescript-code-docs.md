# TypeScript Code Reference — Extension Source (`app/src/**`)

> **Reference.** The extension source is TypeScript: `app/src/**/*.ts`
> (entry `app/src/extension.ts`), compiled by `tsc -p ./` to `app/out/`, with the
> manifest `main` pointing at `./out/extension.js`. It maps the existing,
> verified runtime structure ([../../../../app/CLAUDE.md](../../../../app/CLAUDE.md),
> [../../../../app/src/CLAUDE.md](../../../../app/src/CLAUDE.md)) onto the source.
> API rules: [`.claude/rules/tools/vscode-extension-rule.md`](../../../rules/tools/vscode-extension-rule.md).
> Style: [`.claude/output-styles/app/base/typescript-style.md`](../../../output-styles/app/base/typescript-style.md).

## Source Layout (TypeScript)

```text
app/
├── src/
│   ├── extension.ts                 ← activate()/deactivate(), all registrations
│   ├── symfony/console.ts           ← Singleton: bin/console runner + 30s TTL cache
│   ├── providers/
│   │   ├── completionProvider.ts    ← CompletionItemProvider (PHP + YAML)
│   │   ├── hoverProvider.ts         ← HoverProvider (PHP + YAML)
│   │   └── definitionProvider.ts    ← DefinitionProvider (service classes)
│   ├── views/
│   │   ├── servicesTreeProvider.ts  ← TreeDataProvider<ServiceItem>
│   │   ├── routesTreeProvider.ts    ← TreeDataProvider<RouteItem>
│   │   └── parametersTreeProvider.ts← TreeDataProvider<ParameterItem>
│   └── test/extension.test.ts       ← Mocha (TDD UI) in a real Extension Host
├── out/                             ← tsc build output (main loads ./out/extension.js)
├── package.json · tsconfig.json · eslint.config.mjs · .vscode-test.mjs
```

Config reference (manifest, tsconfig, build, activation, contributions):
[`.claude/docs/utility/vscode/extension-config-docs.md`](../../utility/vscode/extension-config-docs.md).

## Typed Symfony Data Shapes

Model each `bin/console` payload as an `interface`; normalise CLI version
differences to one typed shape. Parse as `unknown` and narrow — never cast raw
JSON straight to a domain type.

```typescript
// src/symfony/types.ts
export interface ServiceDefinition {
    class: string;
    public?: boolean;
    shared?: boolean;
    autowire?: boolean;
    tags?: string[];
}

export interface RouteDefinition {
    path: string;
    method?: string;
    controller?: string;
    host?: string;
}

export type ServiceMap = Record<string, ServiceDefinition>;
export type RouteMap = Record<string, RouteDefinition>;
export type ParameterMap = Record<string, unknown>;
```

## Entry Point — `extension.ts`

The two mandatory lifecycle exports are typed against `vscode`. Every disposable
is pushed to `context.subscriptions`; static contributions live in `package.json`,
never registered here by hand.

```typescript
import * as vscode from 'vscode';

// Shared language selector — reuse this constant, do not inline the array.
const PHP_YAML: vscode.DocumentSelector = [{ language: 'php' }, { language: 'yaml' }];

export function activate(context: vscode.ExtensionContext): void {
    const servicesTree = new ServicesTreeProvider();
    const routesTree = new RoutesTreeProvider();
    const parametersTree = new ParametersTreeProvider();

    context.subscriptions.push(
        // --- Tree views (createTreeView returns a disposable) ---
        vscode.window.createTreeView('symfony.services', { treeDataProvider: servicesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.routes', { treeDataProvider: routesTree, showCollapseAll: false }),
        vscode.window.createTreeView('symfony.parameters', { treeDataProvider: parametersTree, showCollapseAll: false }),

        // --- Language providers ---
        vscode.languages.registerCompletionItemProvider(PHP_YAML, new SymfonyCompletionProvider(), "'", '"', '@', '%'),
        vscode.languages.registerHoverProvider(PHP_YAML, new SymfonyHoverProvider()),
        vscode.languages.registerDefinitionProvider(PHP_YAML, new SymfonyDefinitionProvider()),

        // --- Commands ---
        vscode.commands.registerCommand('symfony.refresh', () => {
            servicesTree.refresh();
            routesTree.refresh();
            parametersTree.refresh();
            void vscode.window.showInformationMessage('Symfony: cache refreshed.');
        }),
    );
}

export function deactivate(): void {}
```

## Data Layer — `console.ts`

Singleton that shells out to `bin/console` and caches results (30s TTL). All
Symfony access flows through this module — no `execSync` / `execFileSync`
elsewhere.

```typescript
import { execFileSync } from 'child_process';
import * as vscode from 'vscode';
import type { ServiceMap, RouteMap, ParameterMap } from './types';

const CACHE_TTL_MS = 30_000;
const RUN_TIMEOUT_MS = 10_000;

interface CacheEntry {
    data: unknown;
    time: number;
}

const cache = new Map<string, CacheEntry>();

function getProjectRoot(): string | null {
    // Scan workspace folders for one containing bin/console.
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        // ... return folder.uri.fsPath when bin/console exists
    }
    return null;
}

function run(args: string[]): unknown {
    const key = args.join(' ');
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < CACHE_TTL_MS) {
        return hit.data;
    }
    const cwd = getProjectRoot();
    if (!cwd) {
        return null;
    }
    try {
        const stdout = execFileSync('php', ['bin/console', ...args], { cwd, timeout: RUN_TIMEOUT_MS });
        const data: unknown = JSON.parse(stdout.toString());
        cache.set(key, { data, time: Date.now() });
        return data;
    } catch {
        return null;   // degrade gracefully — callers return {} on null
    }
}

export function invalidateCache(): void {
    cache.clear();
}

export function getServices(): ServiceMap {
    return (run(['debug:container', '--format=json']) as ServiceMap | null) ?? {};
}

export function getRoutes(): RouteMap {
    // Symfony 6+ returns an array; older returns an object — normalise to a Record.
    const raw = run(['debug:router', '--format=json']);
    return normaliseRoutes(raw) ?? {};
}

export function getParameters(): ParameterMap {
    return (run(['debug:container', '--parameters', '--format=json']) as ParameterMap | null) ?? {};
}
```

| Method | Command | Returns |
| --- | --- | --- |
| `getServices()` | `debug:container --format=json` | `ServiceMap` |
| `getRoutes()` | `debug:router --format=json` | `RouteMap` (array/object normalised) |
| `getParameters()` | `debug:container --parameters --format=json` | `ParameterMap` |

## Language Providers

Each provider `implements` its VSCode interface, returns `vscode.ProviderResult<T>`,
and **never throws** — guard-clause the line pattern before fetching data.

```typescript
export class SymfonyCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);
        // match ->get(' / route(' / @token / %param% ... then map to CompletionItem[]
        return [];
    }
}
```

- **Completion** — trigger chars `'`, `"`, `@`, `%`; `CompletionItemKind`: services → `Class`, routes → `Reference`, parameters → `Variable`. Set `label`, `detail`, `documentation` (`vscode.MarkdownString`), `sortText`.
- **Hover** — `provideHover(...): vscode.ProviderResult<vscode.Hover>`; regex-extract the token, return `new vscode.Hover(markdown)` or `null`.
- **Definition** — `provideDefinition(...): vscode.ProviderResult<vscode.Location | vscode.Location[]>`; resolve FQCN via `getServices()`, `vscode.workspace.findFiles('**/<ClassName>.php', '**/vendor/**', 5)`, return `new vscode.Location(uri, new vscode.Position(0, 0))`.

## Tree Views — `TreeDataProvider<T>`

All three share the pattern; the `EventEmitter` is typed and pushed to
subscriptions via `createTreeView`.

```typescript
export class ServicesTreeProvider implements vscode.TreeDataProvider<ServiceItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<ServiceItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private filter = '';

    getTreeItem(element: ServiceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ServiceItem): vscode.ProviderResult<ServiceItem[]> {
        if (element) {
            return [];   // leaf nodes — no children
        }
        const services = getServices();
        return Object.entries(services)
            .filter(([id]) => id.toLowerCase().includes(this.filter))
            .map(([id, def]) => new ServiceItem(id, def));
    }

    refresh(): void {
        invalidateCache();
        this._onDidChangeTreeData.fire();
    }

    setFilter(text: string): void {
        this.filter = text.toLowerCase();
        this._onDidChangeTreeData.fire();
    }
}

class ServiceItem extends vscode.TreeItem {
    constructor(id: string, def: ServiceDefinition) {
        super(id, vscode.TreeItemCollapsibleState.None);
        this.description = def.class;
        this.tooltip = new vscode.MarkdownString(`**${id}**\n\n\`${def.class}\``);
        this.iconPath = new vscode.ThemeIcon('symbol-class');
        this.contextValue = 'symfonyService';
    }
}
```

View IDs (`package.json` → `contributes.views.symfony`): `symfony.services`,
`symfony.routes`, `symfony.parameters`; container `symfony` under
`contributes.viewsContainers.activitybar`.

> **Invariant**: every `createTreeView` return value must be pushed to
> `context.subscriptions` — omitting it leaks the view on deactivation.
> **Known gap**: `setFilter()` exists on each provider but is not bound to any
> command/menu in `package.json`, so it is unreachable from the UI. Wire a
> command before documenting it as a feature.

## Type-Safety Checklist (source review)

- No `any` (implicit or explicit); `JSON.parse` typed `unknown` then narrowed with a type guard
- `strictNullChecks` respected — optional results typed `T | undefined` and guarded
- Explicit return types on `export`ed members and every provider method
- No unsafe assertions (`as T`, `as unknown as T`, non-null `!`) where a guard fits
- `tsc --noEmit` and `npm run lint` both clean; recompile before **F5** (stale `out/` runs old code)

---
name: Typescript Custom Style
description: TypeScript (VSCode Extension / tsc → CommonJS)
keep-coding-instructions: true
---

# Typescript Style Instructions (VSCode Extension)

Grounded in the extension source layout (`app/src/extension.ts`, `app/src/**/*.ts`),
compiled by `tsc -p ./` to `app/out/`.
API rules & pitfalls: `.claude/rules/tools/vscode-extension-rule.md`.
Type-safety review criteria: `.claude/agents/app/base/typescript-code-reviewer.md`.

## Module System (ESM source → CommonJS emit)

- Source (`src/extension.ts`, `src/**/*.ts`, `test/**/*.ts`) is written with **ES module syntax**: `import` / `export` — `tsc` emits CommonJS (`module: "Node16"` / `"commonjs"`) to `out/`, and the Extension Host loads `main` (`./out/extension.js`) via `require()`
- Never hand-write `require()` / `module.exports` in `src/**` — that form belongs only to the compiled output in `out/`
- `import type { … }` for type-only imports; do not keep a runtime `import` alive solely to reference a type
- Import order: Node built-ins (`child_process`, `path`, `fs`) → `vscode` → local modules (`./providers/...`, `../symfony/...`); group `import type` where it clarifies intent
- One primary `export` per module (`export class ClassName`); the entry point exports `export function activate` / `export function deactivate`
- No runtime npm dependencies — the extension ships with `devDependencies` only (`typescript`, `@types/*`, `typescript-eslint`); do not add a runtime package without explicit request

## Variable Declarations

- `const` by default — `let` only when reassignment is genuinely required
- Never `var` — block-scoped declarations only
- Module-level constants: `UPPER_SNAKE_CASE` (e.g. `CACHE_TTL_MS`, `PHP_YAML`)
- Numeric separators for readability: `30_000`, `10_000`
- Variables, functions, methods: `camelCase`; classes, interfaces, type aliases: `PascalCase`

## Functions & Async

- Arrow functions for callbacks and inline handlers; regular declarations for top-level functions (`activate`, `deactivate`)
- Public functions, provider methods, and exported members declare **explicit return types** — do not rely on inference across module boundaries
- `async/await` for Promise-based VSCode APIs (`findFiles`, `openTextDocument`) — no raw `.then()` chains
- Provider return values typed as `vscode.ProviderResult<T>`; return `null` / `[]` / `{}` on no-match or failure — never throw from `provideCompletionItems` / `provideHover` / `provideDefinition`
- Guard clauses first: pattern-match the line **before** fetching data (avoids unnecessary `bin/console` calls)

## Class Design

- `class` syntax for providers and the data layer; internal state uses TypeScript access modifiers — `private` / `private readonly` with an explicit field type (`private cache: ServiceMap | null = null`) rather than the JS `_prefix` convention
- Constructors only assign state — no `vscode.window` / `vscode.workspace` calls or I/O in a `constructor()`; defer to `getChildren()` or the first provider call
- `TreeItem` subclasses (`ServiceItem`, etc.) set `label`, `description`, `tooltip`, `iconPath`, `contextValue`, `collapsibleState`

## VSCode Extension Conventions

- Every disposable (`register*`, `createTreeView`, `new vscode.EventEmitter<T>()`) is pushed to `context.subscriptions`
- Static contributions (commands, views, menus) belong in `package.json` — never registered programmatically
- Shared language selector: reuse the `PHP_YAML` constant — do not inline `[{ language: 'php' }, ...]`
- All `bin/console` access goes through the `src/symfony/console.ts` singleton (30s TTL cache, `invalidateCache()`) — no direct `execSync` / `execFileSync` elsewhere
- `vscode.workspace.findFiles(include, '**/vendor/**', limit)` — always exclude `vendor` and cap results

## Type Safety

TypeScript strict mode (`app/tsconfig.json`) is the primary correctness tool — types over runtime checks:

- No `any` (implicit or explicit) and no `@ts-ignore` / `@ts-expect-error` without a justifying comment — prefer `unknown` + narrowing
- `JSON.parse` results typed as `unknown` and narrowed with a type guard before use — never cast raw parsed data straight to a domain type
- Model Symfony data shapes as `interface` / `type` and normalise version differences to one typed shape:

```typescript
interface ServiceDefinition {
    class?: string;
    public?: boolean;
}

type ServiceMap = Record<string, ServiceDefinition>;

/** getRoutes may return an array (older CLI) or a keyed object — narrow, don't cast. */
function isServiceMap(value: unknown): value is ServiceMap {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

- `strictNullChecks` respected — optional results typed as `T | undefined` and guarded, not silently assumed present
- No unsafe assertions (`as SomeType`, `as unknown as T`, non-null `!`) where a type guard or a correct type would do

```typescript
import type { ExtensionContext } from 'vscode';

export function activate(context: ExtensionContext): void { /* ... */ }

getServices(): ServiceMap { /* ... */ }
```

## Formatting

- Semicolons: **required** (do not omit)
- Quotes: single quotes `'` for string literals; backticks for template literals
- Indentation: 4 spaces
- Aligned consecutive assignments are acceptable where a block reads more clearly for it
- Trailing commas in multi-line arrays, objects, and call arguments
- Section comments in `activate()` use the `// --- Section ---` form
- `npm run lint` (`typescript-eslint` flat config, `app/eslint.config.mjs`) and `tsc --noEmit` must both stay clean

# Review Guidelines

## What "Important" Means Here

Reserve **Important** for findings that can crash the extension host, cause resource leaks that survive deactivation, silently serve stale or wrong data, or block VSCode startup:
wrong disposable management, unguarded synchronous I/O without a timeout, providers throwing instead of returning `null`, and manifest mismatches that prevent the extension from activating.
Style, naming, and refactoring suggestions are **Nit** at most.

## Nit Limit

Report at most **5 Nits** per review.
If you find more, say "plus N similar items" in the summary instead of posting them all inline.
If everything you found is a Nit, begin the summary with **"No blocking issues."**

## Review Output Format

```
### Summary
[One paragraph. Lead with "No blocking issues." if everything is a Nit.]

### Important
- [file:line] Description

### Nit (max 5)
- [file:line] Description
```

## Do Not Report

- Anything ESLint already enforces — lint errors and formatting issues caught by `npm run lint` (`pretest`).
- `package-lock.json` and any auto-generated files.
- Test-only code that intentionally violates production rules.

## Always Check

### Resource Management

- Every `vscode.window.createTreeView()` call's return value is pushed to `context.subscriptions` — forgetting to do so leaks the `TreeView` on deactivation.
- Every `vscode.languages.register*Provider()` and `vscode.commands.registerCommand()` return value is in `context.subscriptions`.
- Any `vscode.EventEmitter` that fires beyond the activation call is pushed to `context.subscriptions`.

### Extension Host Safety

- Every `execSync` / `spawnSync` call has an explicit `timeout` option — an unresponsive `bin/console` must not hang the extension host indefinitely.
- `activate()` does not call `execSync` or shell out to `bin/console` directly; heavy work is deferred to provider call time or lazy initialisation.
- Provider hot paths (`provideCompletionItems`, `provideHover`, `provideDefinition`) do not perform synchronous blocking I/O on the extension host thread.

### TypeScript Build Safety

- `out/` is recompiled before the change is tested or launched (**F5**) — editing `src/**/*.ts` without `npm run compile` (or a running `npm run watch`) runs stale JS.
- No `any` or `@ts-ignore` leaks into a provider return type — `child_process` / `JSON.parse` results are narrowed from `unknown` with a type guard, never cast.

### Provider Correctness

- All providers return `null` when no pattern matches — they must not return `undefined` or throw an exception (VSCode silently drops results from throwing providers).
- Every provider handles `getProjectRoot()` returning `null` without throwing — the extension must degrade gracefully in non-Symfony workspaces.
- New regex patterns are anchored or scoped to prevent unbounded backtracking on long lines.

### Manifest (`package.json`)

- `activationEvents` retains its workspace-scoped event `workspaceContains:**/bin/console` — do not remove it. Dropping it back to `onLanguage:php` alone would activate the extension in every PHP project, not just Symfony ones.
- New commands are declared in `contributes.commands` with a `title` and, if shown in a toolbar, an `icon`.
- New tree views are declared in `contributes.views.symfony` and bound in `contributes.menus["view/title"]` with an appropriate `when` clause.
- `engines.vscode` is not loosened without a documented reason.

### Data Layer (`src/symfony/console.ts`)

- `execSync` calls are wrapped in try/catch and return `null` on failure — callers must handle a `null` return.
- `getProjectRoot()` returning `null` is handled by every caller — the data layer degrades gracefully in non-Symfony workspaces.
- Cache hit condition remains `Date.now() - cached.time < CACHE_TTL_MS` — off-by-one or inverted comparisons silently serve forever-stale data.
- `invalidateCache()` is called by the `symfony.refresh` command before firing `onDidChangeTreeData`.

### Test Coverage

- New provider logic or changes to `console.ts` include at least one test in the `src/test/*.test.ts` suites (`extension`, `providers`, `views`).
- Tests invoke VSCode's built-in command APIs rather than calling provider methods directly:
  - `vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, position)`
  - `vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)`
  - `vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, position)`

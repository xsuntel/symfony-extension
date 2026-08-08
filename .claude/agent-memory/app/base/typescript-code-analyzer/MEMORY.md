# Memory — typescript-code-analyzer

Verified against the current `app/` source. Use these to correct the data-flow
diagram in this agent's own definition when they conflict.

## Dependency direction (verified)

```text
extension.ts → providers/ + views/ → symfony/console.ts (singleton) → child_process → bin/console
```

- **Single shared coupling point.** All three language providers (`completionProvider`,
  `hoverProvider`, `definitionProvider`) and all three tree views (`servicesTreeProvider`,
  `routesTreeProvider`, `parametersTreeProvider`) import the one `symfonyConsole` singleton
  (`export const symfonyConsole = new SymfonyConsole()`).
- **Cache is global, not per-view.** One `Map` inside the singleton; `invalidateCache()`
  clears **all** cached commands at once. `symfony.refresh` fires each provider's `refresh()`,
  each of which calls `invalidateCache()` — so one refresh drops the whole cache.
- No circular imports: `console.ts` depends only on `vscode` / `child_process` / `fs` / `path`
  and `./types`; it does not import providers or views.

## Data-layer contract (`app/src/symfony/console.ts`)

- `getProjectRoot(): string | null` — `null` (not `undefined`) when no workspace folder
  contains `bin/console`.
- private `run(args: string, projectRoot: string): unknown` — `args` is a **string**;
  runs `php bin/console ${args}` via `execSync` with `{ cwd, timeout: 10_000, encoding: 'utf8',
  stdio: ['ignore','pipe','ignore'] }`. Returns `null` on any failure (try/catch swallows).
- Cache: `Map<string, CacheEntry>` where `CacheEntry = { data: unknown; time: number }`,
  30s TTL (`CACHE_TTL_MS = 30_000`, `RUN_TIMEOUT_MS = 10_000`), keyed by the command string.

## Convention / drift notes

- **`setFilter` is fully wired — not dead code.** `symfony.filter` / `symfony.clearFilter`
  commands call `tree.setFilter(...)` on all three providers (`extension.ts`). Do not flag it
  as unreachable. `app/src/CLAUDE.md`'s "setFilter … unreachable from the UI" finding is **stale**.
- **Graceful degradation is intentional, not a defect.** `run()` returns `null` → getters
  (`getServices`/`getRoutes`/`getParameters`) return `{}`; providers never throw and tree
  views show a `placeholder(...)` empty-state item (`views/emptyState`). Do not report the
  swallowed catch or empty returns as a robustness gap.

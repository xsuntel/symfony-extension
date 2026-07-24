# Memory — typescript-debug-reviewer

Verified against the current `app/` source. Use these to correct the data-flow
diagram in this agent's own definition when they conflict.

## Corrected data-layer signatures (`app/src/symfony/console.ts`)

- `getProjectRoot(): string | null` — returns `null` (the diagram's `string | undefined`
  is wrong). Scans `vscode.workspace.workspaceFolders` for a folder containing `bin/console`.
- `run(args: string, projectRoot: string): unknown` — `args` is a **string**, not
  `string[]`. The command is `execSync(\`php bin/console ${args}\`, { cwd: projectRoot,
  timeout: 10_000, encoding: 'utf8' })`.
- `run()` returns `null` on any failure (try/catch swallows) → getters return `{}`.
- Cache: `Map<string, { data: unknown, time: number }>`, 30s TTL (`CACHE_TTL_MS = 30_000`),
  keyed by the command string. `invalidateCache()` clears the whole map.

## Activation — fires on more than `onLanguage`

`activationEvents` = `onLanguage:php`, `onLanguage:yaml`, **and**
`workspaceContains:**/bin/console`. So "extension never activates" triage must also
consider the `workspaceContains` path, not just an open PHP/YAML file.

## Command surface for "command not found" triage

Three commands are registered in `extension.ts` and declared in `package.json`:
`symfony.refresh`, `symfony.filter`, `symfony.clearFilter` (all bound in the
`view/title` menu with a `when` on the three view IDs). `symfony.refresh` /
`symfony.clearFilter` run synchronously; `symfony.filter` awaits `showInputBox`
(returns early on `undefined` = user cancelled).

## Tree-view refresh path

Each provider uses `EventEmitter<void>`; `refresh()` = `invalidateCache()` then
fire `onDidChangeTreeData`. The `symfony.refresh` handler calls `refresh()` on all
three providers. Stale-data symptoms trace to the 30s TTL cache or a missing
`invalidateCache()` in `refresh()`.

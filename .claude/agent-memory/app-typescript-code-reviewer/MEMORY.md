# Memory — app-typescript-code-reviewer

Verified against the current `app/` source. These correct stale points in this
agent's own premise; trust them over the definition when they conflict.

## Data-layer contract (`app/src/symfony/console.ts`)

- `getProjectRoot(): string | null` — returns `null` (not `undefined`) when no
  workspace folder contains `bin/console`.
- `run(args: string, projectRoot: string): unknown` — `args` is a **string**, and
  the call is `execSync(\`php bin/console ${args}\`, { cwd, timeout: 10_000 })`.
- On any failure `run()` returns `null`; getters (`getServices`/`getRoutes`/
  `getParameters`) then return `{}`. Cache is `Map<string, { data, time }>`,
  30s TTL keyed by the command string.

## Security note — the `execSync` template string is currently safe

`execSync(\`php bin/console ${args}\`)` interpolates `args`, but every caller passes
a **hardcoded literal** (`'debug:container --format=json'`, `'debug:router --format=json'`,
`'debug:container --parameters --format=json'`). No workspace-derived value reaches the
command string today. Do **not** raise a `[MUST]` shell-injection finding on the existing
code — flag it only if a change starts passing workspace/user input into `run(args, …)`.

## Command surface — three commands, not one

Registered in `extension.ts` and declared in `package.json` (`contributes.commands`
+ `view/title` menu bindings): `symfony.refresh`, `symfony.filter`, `symfony.clearFilter`.
When reviewing a command change, verify all three keep the
`registerCommand` ↔ `contributes.commands` ↔ menu-binding contract in sync.

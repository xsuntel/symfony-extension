# Memory — typescript-test-writer

Verified against the current `app/` source. These correct stale examples in this
agent's own definition; trust them over the definition when they conflict.

## Extension ID — publisher IS set

`getExtension()` must use `your-publisher-id.symfony-extensions`
(`package.json`: `publisher: "your-publisher-id"`, `name: "symfony-extensions"`).
Do **not** use `undefined_publisher.symfony-extensions` — the publisher field is
populated, so the `undefined_publisher` fallback does not apply and the activation
test would fail to find the extension.

## Existing test suite — three files, mirror them

`app/src/test/` already contains `extension.test.ts`, `providers.test.ts`, and
`views.test.ts` (Mocha TDD UI, `assert`). Add new tests as one-area-per-file
alongside these; do not collapse everything into `extension.test.ts`.

## Runner config — no fixture, degrade gracefully

`app/.vscode-test.mjs` sets only `files: 'out/test/**/*.test.js'` — there is **no**
`workspaceFolder`. So the test host has no Symfony project: `getProjectRoot()` returns
`null` and every data getter returns `{}`. Graceful-degradation (empty/undefined,
no throw) is the default assertion. A fixture is a deliberate, separate setup step
(add `workspaceFolder` in `.vscode-test.mjs`) — propose it, do not assume it.

## Commands to assert as registered

Three commands exist (via `vscode.commands.getCommands(true)`):
`symfony.refresh`, `symfony.filter`, `symfony.clearFilter`.

# Memory — multi-team

Verified against the current `app/` source. You synthesize the specialists' reports;
use these to keep the facts you **relay** accurate when a specialist (or the agent
definitions/CLAUDE.md) carries a stale point.

## Team shape

Four `app/base` specialists. Only `typescript-code-tester` writes files (Read/Write/Edit);
`typescript-code-analyzer` / `-reviewer` / `-debugger` are **read-only** (Read/Grep/Glob/Bash).
You (the orchestrator) carry **no `Write`/`Edit`** — dispatch, do not patch. Run the writer
(tester) last, after its inputs (hotspots / root cause / fix under test) are known.

## Cross-cutting facts to relay correctly

Shared source-of-truth points every specialist depends on — do not forward a stale claim:

- **`setFilter` is fully wired.** Three commands exist (`symfony.refresh`, `symfony.filter`,
  `symfony.clearFilter`); `symfony.filter` / `symfony.clearFilter` call `tree.setFilter(...)`
  on all three tree providers (`extension.ts`). Do not relay any "setFilter unreachable"
  finding — `app/src/CLAUDE.md` still says that and is **outdated**.
- **`activationEvents` is already scoped.** `package.json` includes
  `workspaceContains:**/bin/console` alongside `onLanguage:php` / `onLanguage:yaml`.
  Do not forward a "add a workspaceContains guard" suggestion as new.
- **The `execSync` command string is safe today.** `run()` interpolates `args` into
  `` `php bin/console ${args}` ``, but every caller passes a hardcoded literal
  (`debug:container` / `debug:router` variants). No shell-injection finding on existing
  code — only if a change starts feeding workspace/user input into `run(args, …)`.

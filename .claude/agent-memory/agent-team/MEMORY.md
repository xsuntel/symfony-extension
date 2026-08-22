# Memory — agent-team

Verified against the current `app/` source. You synthesize the specialists' reports;
use these to keep the facts you **relay** accurate when a specialist (or the agent
definitions/CLAUDE.md) carries a stale point.

## Team shape

Four `app/` specialists. Only `app-typescript-code-tester` writes files (Read/Write/Edit);
`app-typescript-code-analyzer` / `-reviewer` / `-debugger` are **read-only** (Read/Grep/Glob/Bash).
You (the orchestrator) carry **no `Write`/`Edit`** — dispatch, do not patch. Run the writer
(tester) last, after its inputs (hotspots / root cause / fix under test) are known.

## Cross-cutting facts to relay correctly

Shared source-of-truth points every specialist depends on — do not forward a stale claim:

- **The `execSync` command string is safe today.** `run()` interpolates `args` into
  `` `php bin/console ${args}` ``, but every caller passes a hardcoded literal
  (`debug:container` / `debug:router` variants). No shell-injection finding on existing
  code — only if a change starts feeding workspace/user input into `run(args, …)`.

---
name: typescript-code-helper
description: "Routes a TypeScript VSCode-extension code request to the matching app/base specialist agent — quality review, bug diagnosis, or test authoring. Use for natural-language requests like 'review this extension code', 'why isn't the extension activating / completions not firing', 'trace this go-to-definition miss', or 'write a test for the completion provider', and for work touching extension.ts, the completion/hover/definition providers, tree views, src/symfony/console.ts, or package.json. Do not use for VSCode API / structure / dependency guidance (that is vscode-extension-helper), for authoring .claude config artifacts (cc-config-helper), for commit messages (git-commit-helper), or for code outside app/."
allowed-tools: Agent, Read, Grep, Glob, Bash
---

# TypeScript Code Helper

Routes a TypeScript VSCode-extension code request to the matching `app/base` specialist
agent — no draft/verify loop.

This is a **role-based single-agent dispatcher**: it classifies the request and hands it
to exactly one agent (or the per-file review command), then relays that agent's report.
It differs from the two neighbouring paths:

- Unlike `cc-config-helper` / `git-commit-helper`, there is **no author→reviewer
  PASS/REDO pipeline** — the chosen specialist acts directly.
- Unlike `vscode-extension-helper` (guidance-only: structure analysis + API/dependency
  advice, answered inline), this skill **spawns an agent** to do review, debug, or test
  work on the actual code.

The three `app/base` agents are the concrete implementation of the generic roles in
global `CLAUDE.md` §7 (`code-reviewer` / debugging / test authoring) for this repo.

- Working language: **English** (matches the `app/base` trio)
- Scope: TypeScript extension source under `app/**` only

@see .claude/agents/app/base/typescript-code-reviewer.md — quality review (MUST/SHOULD/CONSIDER)
@see .claude/agents/app/base/typescript-debug-reviewer.md — root-cause tracing (read-only)
@see .claude/agents/app/base/typescript-test-writer.md — `@vscode/test-cli` + Mocha tests
@see .claude/commands/app/base/typescript-code-review.md — per-file deep review command

---

## Routing

Pick exactly one route based on the request's intent:

| Request intent | Route to | Kind |
| --- | --- | --- |
| Review changed / PR extension code for quality (flag MUST/SHOULD/CONSIDER) | `typescript-code-reviewer` agent | Agent |
| Deep audit of one specific file (a concrete `*.ts` path is given) | `/app:base:typescript-code-review` command | Command |
| Diagnose a runtime bug — extension not activating, stale `out/`, completions not firing, empty tree view, "command not found", stale data, go-to-definition miss | `typescript-debug-reviewer` agent | Agent |
| Write or extend integration tests (`@vscode/test-cli` + Mocha) | `typescript-test-writer` agent | Agent |

---

## Workflow

1. **Classify intent**
   - Map the request to **one** row in the Routing table (review / per-file audit /
     debug / test).
   - When a concrete file path is supplied for a review, prefer the
     `/app:base:typescript-code-review` command over the reviewer agent — it does the
     per-file deep pass.

2. **Resolve ambiguity (at most one question)**
   - If the intent is genuinely ambiguous between two routes (e.g. "look at the
     completion provider" — review or debug?), ask **one** clarifying question before
     dispatching. Do not ask multiple questions at once.

3. **Dispatch with scope context**
   - Invoke the chosen agent/command, passing the scope it needs:
     - Review → the changed surface, e.g. `git diff main...HEAD --name-only -- app/`.
     - Per-file audit → the target file path as the command argument.
     - Debug → the reproduction detail (action, file type PHP/YAML, workspace state,
       any Extension Host error).
     - Test → the behavior or provider/data-layer contract to cover.
   - Relay the agent's report to the user. **Do not** chain a second agent (e.g. run the
     reviewer after the debugger) unless the user asks.

4. **No retry loop**
   - There is no PASS/REDO verdict here. The specialist's output is the result; iterate
     only on explicit user follow-up.

---

## Do not use for

| Request | Use instead |
| --- | --- |
| VSCode API usage, manifest/structure analysis, dependency questions | `vscode-extension-helper` skill |
| Authoring `.claude` config artifacts (agents, skills, rules, settings, CLAUDE.md) | `cc-config-helper` skill |
| Writing a commit message | `git-commit-helper` skill |
| Code outside `app/` (scripts, diagrams, docs) | not this skill |

---

## References

| Area | File |
| --- | --- |
| Quality review criteria (MUST/SHOULD/CONSIDER) | `.claude/agents/app/base/typescript-code-reviewer.md` |
| Debug methodology & symptom→cause table | `.claude/agents/app/base/typescript-debug-reviewer.md` |
| Test patterns (`@vscode/test-cli` + Mocha) | `.claude/agents/app/base/typescript-test-writer.md` |
| Per-file deep review | `.claude/commands/app/base/typescript-code-review.md` (`/app:base:typescript-code-review`) |
| VSCode API rules & pitfalls | `.claude/rules/tools/vscode-extension-rule.md` |
| Shared TypeScript formatting | `.claude/output-styles/app/base/typescript-style.md` |
| Extension architecture | `app/CLAUDE.md`, `app/src/CLAUDE.md`, `app/src/test/CLAUDE.md` |

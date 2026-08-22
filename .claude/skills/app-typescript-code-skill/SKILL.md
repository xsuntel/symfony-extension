---
name: app-typescript-code-skill
description: "Routes a TypeScript VSCode-extension code request to the matching app/ specialist agent — structural/health analysis, quality review, bug diagnosis, or test-first (TDD) work. Use for natural-language requests like 'assess the overall structure/health of the extension', 'review this extension code', 'why isn't the extension activating / completions not firing', 'trace this go-to-definition miss', or 'write a test for the completion provider' / 'do this test-first', and for work touching extension.ts, the completion/hover/definition providers, tree views, src/symfony/console.ts, or package.json. Do not use for quick inline VSCode API / structure / dependency guidance (that is tools-vscode-extension-config-skill), for authoring .claude config artifacts (utility-claude-code-skill), for commit messages (utility-git-commit-skill), or for code outside app/."
allowed-tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash(git diff:*)
---

# TypeScript Code Skill

Routes a TypeScript VSCode-extension code request to the matching `app/` specialist
agent — no draft/verify loop.

This is a **role-based single-agent dispatcher**: it classifies the request and hands it
to exactly one agent (or the per-file review command), then relays that agent's report.
It differs from the two neighbouring paths:

- Unlike `utility-claude-code-skill` / `utility-git-commit-skill`, there is
  **no author→reviewer PASS/REDO pipeline** — the chosen specialist acts directly.
- Unlike `tools-vscode-extension-config-skill` (guidance-only: **quick inline** structure/API/dependency
  advice, answered without spawning an agent), this skill **spawns an agent** to do deep
  analysis, review, debug, or test work on the actual code.

Four `app/` agents sit behind this skill. Three are the concrete implementation of the
generic roles in global `CLAUDE.md` "에이전트 사용 규칙" (`code-reviewer` / debugging / test authoring);
`app-typescript-code-analyzer` is an additional, project-specific proactive structure/health
analysis role with **no** counterpart there.

- Working language: **English** (matches the `app/` agents)
- Scope: TypeScript extension source under `app/**` only

@see .claude/agents/app-typescript-code-analyzer.md — structural/health analysis (read-only)
@see .claude/agents/app-typescript-code-reviewer.md — quality review (MUST/SHOULD/CONSIDER)
@see .claude/agents/app-typescript-code-debugger.md — root-cause tracing (read-only)
@see .claude/agents/app-typescript-code-tester.md — TDD cycle (`@vscode/test-cli` + Mocha)
@see .claude/commands/app-typescript-code-review.md — per-file deep review command

---

## Routing

Pick exactly one route based on the request's intent:

| Request intent                                                                                                                                                   | Route to                              | Kind    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------- |
| Assess overall structure / architecture / code health of the extension (not a diff, not a specific bug)                                                          | `app-typescript-code-analyzer` agent  | Agent   |
| Review changed / PR extension code for quality (flag MUST/SHOULD/CONSIDER)                                                                                       | `app-typescript-code-reviewer` agent  | Agent   |
| Deep audit of one specific file (a concrete `*.ts` path is given)                                                                                                | `/app-typescript-code-review` command | Command |
| Diagnose a runtime bug — extension not activating, stale `out/`, completions not firing, empty tree view, "command not found", stale data, go-to-definition miss | `app-typescript-code-debugger` agent  | Agent   |
| Specify a behavior test-first — TDD red-green-refactor (failing test → minimal `app/src` change → refactor), or write/extend integration tests                    | `app-typescript-code-tester` agent    | Agent   |

---

## Workflow

1. **Classify intent**
   - Map the request to **one** row in the Routing table (analyze / review / per-file
     audit / debug / test).
   - When a concrete file path is supplied for a review, prefer the
     `/app-typescript-code-review` command over the reviewer agent — it does the
     per-file deep pass.

2. **Resolve ambiguity (at most one question)**
   - If the intent is genuinely ambiguous between two routes (e.g. "look at the
     completion provider" — review or debug?), ask **one** clarifying question before
     dispatching. Do not ask multiple questions at once.

3. **Dispatch with scope context**
   - Invoke the chosen agent/command, passing the scope it needs:
     - Analyze → the area to survey (whole `app/` or a named subsystem) and any health
       concern (coupling, type-safety debt, dead code) to focus on.
     - Review → the changed surface, e.g. `git diff main...HEAD --name-only -- app/`.
     - Per-file audit → the target file path as the command argument.
     - Debug → the reproduction detail (action, file type PHP/YAML, workspace state,
       any Extension Host error).
     - Test → the **behavior to specify** (the provider/data-layer contract the test must pin
       down), not just "add coverage" — the agent turns it into a failing test first.
   - Relay the agent's report to the user. **Do not** chain a second agent (e.g. run the
     reviewer after the debugger) unless the user asks.

4. **No retry loop**
   - There is no PASS/REDO verdict here. The specialist's output is the result; iterate
     only on explicit user follow-up.

---

## Do not use for

| Request                                                                                           | Use instead                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------- |
| A **compound** task needing several `app/` specialists chained (e.g. analyze → fix → test)        | `agent-team` agent              |
| Quick **inline** VSCode API usage / structure / dependency guidance (no agent, answered in place) | `tools-vscode-extension-config-skill` |
| Authoring `.claude` config artifacts (agents, skills, rules, settings, CLAUDE.md)                 | `utility-claude-code-skill`     |
| Writing a commit message                                                                          | `utility-git-commit-skill`      |
| Code outside `app/` (scripts, diagrams, docs)                                                     | not this skill                  |

---

## References

| Area                                           | File                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Structural / code-health analysis              | `.claude/agents/app-typescript-code-analyzer.md`                                 |
| Quality review criteria (MUST/SHOULD/CONSIDER) | `.claude/agents/app-typescript-code-reviewer.md`                                 |
| Debug methodology & symptom→cause table        | `.claude/agents/app-typescript-code-debugger.md`                                 |
| TDD cycle & test patterns (`@vscode/test-cli`) | `.claude/agents/app-typescript-code-tester.md`                                   |
| Per-file deep review                           | `.claude/commands/app-typescript-code-review.md` (`/app-typescript-code-review`) |
| VSCode API rules & pitfalls                    | `.claude/rules/tools-vscode-extension-rule.md`                                   |
| Shared TypeScript formatting                   | `.claude/output-styles/app-typescript-code-style.md`                             |
| Extension architecture                         | `app/CLAUDE.md`, `app/src/CLAUDE.md`, `app/src/test/CLAUDE.md`                   |

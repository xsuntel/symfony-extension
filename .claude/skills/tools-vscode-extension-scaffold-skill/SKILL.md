---
name: tools-vscode-extension-scaffold-skill
description: "Scaffolds VSCode extension code or a manifest entry and gates it through an API-spec review, as a two-agent pipeline (tools-vscode-extension-author → tools-vscode-extension-reviewer). Use for natural-language requests like 'scaffold a new hover provider', 'add a tree view', 'wire a new command', or 'generate the manifest contribution' for the extension under app/. Do not use for reviewing an existing project diff (that is app-typescript-code-skill → app-typescript-code-reviewer), for quick inline API guidance (tools-vscode-extension-config-skill), or for authoring .claude config artifacts (utility-claude-code-skill)."
allowed-tools:
  - Agent
  - Read
  - Grep
  - Bash(npx:*)
---

# VSCode Extension Scaffold Skill

Invokes a two-agent pipeline (`tools-vscode-extension-author` → `tools-vscode-extension-reviewer`)
to scaffold VSCode extension code / manifest and gate it against the VSCode Extension API rule,
iterating until the review passes. The author writes to the target path; the reviewer verifies it
read-only.

- Authoring language: **English** (project `.ts` / `.md` convention)
- SoT: `.claude/rules/tools-vscode-extension-rule.md` (API surface) and
  `.claude/docs/tools-vscode-extension-docs.md` (manifest / tsconfig / build)

@see .claude/agents/tools-vscode-extension-author.md — the author agent (writes code/manifest)
@see .claude/agents/tools-vscode-extension-reviewer.md — the reviewer agent (read-only PASS / REDO)
@see .claude/rules/tools-vscode-extension-rule.md — VSCode Extension API rules (SoT)
@see .claude/output-styles/tools-vscode-extension-style.md — output presentation, verdict vocabulary, compile-gate reporting (SoT)

---

## Workflow

1. **Precondition**
   - Determine the artifact to scaffold (provider / tree view / command / manifest contribution) and
     its target path (`app/src/**` or `app/package.json`) from the request.
   - If the target or artifact type is unclear, settle it with **one focused question** before
     proceeding.

2. **Invoke the author**
   - Spawn `tools-vscode-extension-author` (`subagent_type`) with the artifact spec + target path. It
     writes the code / manifest entry to the target path and reports what it added.

3. **Invoke the reviewer**
   - Spawn `tools-vscode-extension-reviewer` (`subagent_type`) scoped to the written file(s). It returns
     a one-word **PASS** or **REDO** verdict plus its findings (each with a `file:line` anchor + the
     rule violated).

4. **Objective compile gate**
   - Run `npx tsc --noEmit -p app/tsconfig.json` (no `cd`, so the single `npx` grant covers it).
     A type error is treated as **REDO** regardless of the
     reviewer verdict — the pipeline must not report success on code that does not compile.

5. **Verdict branch**
   - **PASS and clean compile:** report the written path(s) and a short summary, then stop.
   - **REDO:** re-invoke the author with the reviewer's issues (and any `tsc` errors) in the prompt,
     then repeat from step 3. **Retry at most 2 times.**

6. **Retry-limit handling**
   - If it is still REDO after 2 retries, **do not claim success.** Report that the target path holds
     the last (unpassed) draft, list the remaining issues, and stop with
     "Manual review recommended."

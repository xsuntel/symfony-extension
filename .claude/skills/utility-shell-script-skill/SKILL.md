---
name: utility-shell-script-skill
description: "Writes, reviews, debugs, and refactors this project's Bash shell scripts under scripts/ inline — Claude drafts the script, self-verifies it against the project criteria, and writes it to the target path. Use for natural-language requests involving '.sh files', 'shell script', 'bash', shebang, ShellCheck, or command-line automation, and for fixing common bash pitfalls such as quoting, exit-code handling, IFS, variable expansion, or word splitting — even when the user does not say 'bash'. Do not use it for questions about bash that do not author or modify a script."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit(scripts/**)
  - Write(scripts/**)
  - Bash(mkdir:*)
  - Bash(shellcheck:*)
  - Bash(bash:*)
---

# Shell Script Skill

Authors and reviews a Bash script for this project **inline** — Claude drafts the script,
self-verifies it against the project criteria, and writes it to the target path once the
self-verification passes. No subagents are spawned.

- Authoring language: comments in **English** (reason/constraint only — omit what the code does)
- Location of intermediate artifacts: `./.claude/tmp/` (gitignored)
- Targets: `scripts/**/*.sh`

**Scope boundary:** use this skill only when **authoring, modifying, or reviewing** a script. Do not
use it for questions that merely ask about Bash semantics without changing a file.

**Do not restate conventions from memory.** This project deliberately differs from generic Bash
advice in places — read the SoT files below before drafting or judging.

@see .claude/output-styles/utility-shell-script-style.md — shell style criteria and templates (SoT)
@see .claude/rules/utility-shell-script-rule.md — operational/architectural criteria (SoT)
@see .claude/docs/utility-shell-script-docs.md — script inventory · global catalog · worked examples
@see .claude/commands/utility-shell-script-review.md — Authoring Conventions + Review Procedure (the self-verification checklist)

---

## Workflow

1. **Interpret the request (precondition)**
   - Determine whether the task is **authoring/modifying** a script or **reviewing** an existing one,
     and settle the target path.
   - For a review of an existing file, run the `/utility-shell-script-review` command's **Mode A**
     and stop there — no draft is produced.
   - If the target path or the script's kind (entry point vs. sourced helper) is unclear, settle it
     with **one focused question** before proceeding.

2. **Read before drafting**
   - Read the two SoT files, plus **1–2 existing scripts of the same kind** from the docs' §1 Script
     Inventory. Mirror their bootstrap, separator widths, and phase order exactly.
   - Use only the global variables, functions, and paths that the docs' catalog lists.

3. **Draft the script**
   - Follow the **Authoring Conventions** in `.claude/commands/utility-shell-script-review.md`.
   - Write a complete, runnable script starting from the shebang — no `# TODO` placeholders unless
     the user asked for a scaffold.
   - Stage a larger draft to `./.claude/tmp/utility/shell-script/script-draft.md`
     (`mkdir -p .claude/tmp/utility/shell-script` first).

4. **Self-verify the draft**
   - Check it against the review command's **Review Procedure** (Mode B): shebang, strict mode,
     bootstrap, source guards, global-variable factuality, naming, platform branching, safety guards,
     and separator widths.
   - Run `bash -n` on the draft, and `shellcheck` when it is available.
   - On REDO, revise applying **only** the correction instructions. **Cap at 2 self-verification passes.**

5. **Write to the target path**
   - Create any required parent directory first, write the script, and report the written path with a
     short summary.
   - Tell the user the file needs `chmod +x` if it is a new entry point.

6. **Unresolved-issue handling**
   - If a blocking issue survives 2 passes, **do not write the target path silently.** Present the
     draft and the remaining issues with the note "Manual review recommended."

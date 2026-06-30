---
name: reviewing-code-changes
description: Review code changes, identify potential bugs, and suggest improvements. Use when reviewing pull requests or any code change in this repository.
allowed-tools: Read, Grep, Glob
---

# Code Review

## How to Review

1. Read the changed files in full using the `Read` tool — do not rely on diffs alone.
2. For each changed file, run through the checklists below.
3. Cross-reference `app/package.json` and `app/extension.js` when provider or manifest changes are involved.
4. Report findings using the output format at the bottom of this file.

---

## Checklist

### Correctness

- [ ] Does the logic satisfy the stated requirements or the intent of the change?
- [ ] Are edge cases handled? (empty arrays, null/undefined, missing workspace folders, `bin/console` not found)
- [ ] Is error handling appropriate? (try/catch around `execSync`, graceful degradation when Symfony data is unavailable)
- [ ] Do provider methods return `null` (not `undefined` or `[]`) when there is nothing to show?

### VSCode Extension Conventions

- [ ] All disposables returned by registration calls are pushed to `context.subscriptions`
  - `vscode.languages.register*` → pushed ✓
  - `vscode.window.createTreeView` → must assign and push the returned `TreeView` object ✓
  - `vscode.commands.registerCommand` → pushed ✓
- [ ] `activate()` does not perform blocking I/O synchronously (no top-level `execSync` outside of a lazy call path)
- [ ] Language selectors use the shared constant (e.g. `PHP_YAML`) — not duplicated inline
- [ ] Trigger characters declared in `registerCompletionItemProvider` match what `provideCompletionItems` actually handles
- [ ] `package.json` contributions are consistent with what `activate()` registers:
  - Every `contributes.commands` entry has a matching `registerCommand` call
  - Every `contributes.views` ID has a matching `createTreeView` call
  - `activationEvents` cover the actual usage patterns

### Maintainability

- [ ] Code is readable without requiring comments to understand intent
- [ ] Functions and modules have a single, clear responsibility
- [ ] No unnecessary duplication (regex patterns, selector arrays, label strings)
- [ ] Variable and function names accurately describe what they hold or do

### Performance

- [ ] Expensive operations (shell calls, file searches) are gated behind the 30-second cache in `console.js`
- [ ] `vscode.workspace.findFiles` uses a tight glob and an `exclude` pattern to avoid scanning `vendor/`
- [ ] `provideCompletionItems` / `provideHover` exit early (return `null`) before fetching data when the line pattern does not match
- [ ] No memory leaks: event emitters are disposed, no unbounded caches or growing arrays

### Security

- [ ] Shell commands built from workspace data are not vulnerable to command injection (no raw string interpolation into `execSync` arguments)
- [ ] No user-supplied input is passed to `eval` or dynamically executed code
- [ ] File path arguments to `findFiles` are not constructed from raw document text without sanitisation

### Test Coverage

- [ ] New behaviour has a corresponding test in `test/extension.test.js`
- [ ] Changed regex patterns or line-matching logic are covered by at least one test case
- [ ] Tests use VSCode's `executeCommand` API to invoke providers, not internal method calls directly

---

## Severity Labels

Use these labels when reporting findings:

| Label | Meaning |
| --- | --- |
| **[BLOCKER]** | Must be fixed before merge — correctness bug, security issue, or broken extension contract |
| **[REQUIRED]** | Should be fixed before merge — missing subscription push, uncovered edge case, inconsistent manifest |
| **[SUGGESTED]** | Optional improvement — readability, naming, minor duplication |
| **[POSITIVE]** | Acknowledge good practice — worth calling out explicitly |

---

## Output Format

```
## Review: <file or change description>

**Summary** (1–2 sentences — overall quality and confidence level)

### Blockers
- [BLOCKER] <issue> — <file>:<line> — <why it matters>

### Required Changes
- [REQUIRED] <issue> — <file>:<line> — <what to fix>

### Suggestions
- [SUGGESTED] <improvement> — <file>:<line> — <rationale>

### Positives
- [POSITIVE] <what was done well> — <file>:<line>
```

Omit any section that has no findings. Do not leave sections with "None" — simply skip them.

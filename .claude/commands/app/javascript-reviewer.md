---
title: "JavaScript Analysis & Review Guide"
description: "Evaluate JavaScript file quality and provide structured improvement recommendations."
arguments:
    - name: file
      description: "Path to the JavaScript file to analyse"
---

Analyse the following JavaScript file:

**`{{file}}`**

Perform a thorough review across all sections below. For every finding, state the exact line number and provide a concrete fix or improved code snippet.

---

## 1. Module System & Imports

Check for the following and flag any violations:

- **ES module syntax only**: all imports must use `import` / `export` — `require()` / `module.exports` are forbidden. Flag any CommonJS usage.
- **Import grouping**: imports must be sorted and separated by a blank line:
  1. Framework / third-party packages (e.g. `vscode`, `path`, `child_process`)
  2. Local modules (relative paths `./` or `../`)
  - Flag unsorted or ungrouped imports.
- **Named vs. default exports**:
  - Singleton modules (e.g. `console.js`) should use named exports.
  - Flag unnecessary `export default` on non-class modules.
- **Unused imports**: flag any `import` binding never referenced in the file.
- **Dynamic `import()`**: flag synchronous `import` of heavy modules on hot paths — recommend lazy `import()` for code splitting.
- **Side-effect-only imports**: flag bare `import './something'` unless it is explicitly a side-effect entry point (e.g. polyfills). Add a comment explaining the intent.
- **Utility path**: shared utilities should live under `app/src/` — flag any utility code duplicated inline that belongs in a module there.

---

## 2. Variable Declarations & Scope

- **Default to `const`**: flag any `let` declaration whose binding is never reassigned — it should be `const`.
- **No `var`**: flag all `var` declarations — replace with `const` or `let` in the appropriate block scope.
- **Temporal Dead Zone (TDZ)**: flag references to a `let` or `const` variable before its declaration in the same scope.
- **Naming conventions**:
  - Variables, functions, and methods: `camelCase`.
  - Classes and constructor functions: `PascalCase`.
  - Module-level constants: `UPPER_SNAKE_CASE`.
  - Private class fields: `#camelCase`.
  - Flag any deviations.
- **`for...in` over arrays**: flag `for (const key in array)` — use `for...of` or `.forEach()` for array iteration.
- **Shadowed variables**: flag inner-scope declarations that share a name with an outer-scope binding — likely to cause bugs and confusion.

---

## 3. Modern Syntax (ES2020–ES2022)

Flag legacy patterns where a modern, safer alternative exists:

- **Optional chaining `?.`**: flag `obj && obj.prop && obj.prop.method()` chains — replace with `obj?.prop?.method()`.
- **Nullish coalescing `??`**: flag `value || default` when `value` can legitimately be `0`, `''`, or `false` — replace with `value ?? default`.
- **Logical assignment**: flag manual `if (!x) x = y` patterns — replace with `x ??= y`, `x ||= y`, or `x &&= y`.
- **Destructuring**: flag repeated property accesses (`obj.a`, `obj.b`, `obj.c`) at the top of a function — use `const { a, b, c } = obj`.
- **Spread operator**: flag `Object.assign({}, a, b)` — replace with `{ ...a, ...b }`. Flag `[].concat(arr1, arr2)` — replace with `[...arr1, ...arr2]`.
- **Template literals**: flag string concatenation via `+` — replace with `` `${value}` ``.
- **`Array.from()` vs. spread**: flag `Array.from(iterable)` when `[...iterable]` is cleaner; keep `Array.from()` when a mapping function is needed.
- **`Promise.allSettled()` / `Promise.any()`**: flag `Promise.all()` when partial failure should not abort the whole batch — use `Promise.allSettled()`.
- **Top-level `await`**: flag IIFE wrappers `(async () => { await ...; })()` in ES module files — use top-level `await` directly (ES2022).
- **Private class fields `#`**: flag `_prefix` properties intended to signal privacy — replace with true private fields (`#field`).

---

## 4. Functions & Async Programming

- **Arrow functions for callbacks**: flag `function` expressions used as callbacks, array method arguments, or inline handlers — replace with arrow functions.
- **Named function declarations**: flag anonymous function expressions assigned to `const` at module scope where a named declaration would improve stack traces.
- **`async/await` over `.then()` chains**: flag `.then().catch()` chains — rewrite with `async/await` and `try/catch`. Exception: `Promise.all([...]).then()` in a non-async context where an IIFE would be required.
- **Unhandled promise rejections**: flag `async` function calls that are neither `await`ed nor have a `.catch()` — unhandled rejections crash modern runtimes.
- **`async` without `await`**: flag `async function` declarations containing no `await` expression — the `async` keyword is unnecessary.
- **Error context in async functions**: flag `try/catch` blocks that catch `Error` too broadly when a specific error type can be detected — log enough context to diagnose failures.
- **Default parameters**: flag `const value = arg || 'default'` at the top of a function body — use a default parameter `function fn(arg = 'default')` instead.
- **Function length**: flag functions exceeding ~30 lines — extract sub-responsibilities into helper functions.

---

## 5. Class Design (ES2015+ / ES2022)

- **`class` syntax**: flag constructor function patterns (`function MyClass() {}`, `MyClass.prototype.method = ...`) — replace with `class` syntax.
- **Private fields `#`**: flag `this._field` conventions — replace with `#field` for true encapsulation. Private fields are inaccessible from outside the class at runtime.
- **Static methods for pure utilities**: flag `static` methods that reference `this` or instance state — static methods should be pure functions with no instance dependencies.
- **`TreeDataProvider` constructors**: flag `getChildren()` logic or `vscode.window` / `vscode.workspace` API calls placed inside a `constructor()` — defer to `getChildren()` or a lazy initialisation method. The constructor should only assign injected dependencies.
- **`super()` call**: flag subclasses that override `constructor()` without calling `super()` first.
- **Class field initialisation**: prefer class field syntax (`#count = 0`) over `this.#count = 0` inside `constructor()` for simple default values.

---

## 6. VSCode Extension Conventions

- **Disposable registration**: flag any return value from `vscode.languages.register*`, `vscode.window.createTreeView`, or `vscode.commands.registerCommand` that is not pushed to `context.subscriptions`. Forgetting to push causes resource leaks on deactivation.
- **Blocking `activate()`**: flag synchronous `execSync` or any other blocking I/O called directly at the top level of `activate()` — defer heavy work to the first provider call or use an async pattern.
- **`package.json` / `activate()` consistency**: flag any `contributes.commands` entry without a matching `registerCommand` call in `activate()`, and any `contributes.views` ID without a matching `createTreeView` call.
- **Activation event scope**: flag `"onLanguage:php"` in `activationEvents` when `"workspaceContains:**/symfony.lock"` or `"workspaceContains:**/bin/console"` is absent — the extension will activate in every PHP project, not just Symfony ones.
- **Provider early exit**: flag provider methods (`provideCompletionItems`, `provideHover`, `provideDefinition`) that call `getServices()` / `getRoutes()` / `getParameters()` before checking whether the current line matches an expected pattern — fetch data only after a pattern match to avoid unnecessary shell calls.
- **Language selector duplication**: flag inline `[{ language: 'php' }, { language: 'yaml' }]` objects — extract to a shared constant (e.g. `PHP_YAML_SELECTOR`) and import it.
- **Trigger character mismatch**: flag a mismatch between the trigger characters declared in `registerCompletionItemProvider(selector, provider, ...triggerChars)` and the characters actually handled in `provideCompletionItems` — mismatches silently prevent completions from firing.
- **Direct `execSync` outside `console.js`**: flag any `execSync` call that bypasses `src/symfony/console.js` — all Symfony shell commands must go through the cached module to respect the 30-second TTL and `invalidateCache()` contract.
- **`findFiles` glob tightness**: flag `vscode.workspace.findFiles` calls missing an exclude pattern for `**/vendor/**` or a result limit — unbounded searches over vendor directories are slow and wasteful.
- **`EventEmitter` disposal**: flag `new vscode.EventEmitter()` instances that are not pushed to `context.subscriptions` — emitters hold listeners and must be disposed with the extension.

---

## 7. Error Handling

- **Empty `catch` blocks**: flag `catch (e) {}` or `catch (e) { /* ignore */ }` — every caught error must be logged or re-thrown.
- **Error type specificity**: flag broad `catch (e)` when a specific error type (`TypeError`, `RangeError`, a custom error class) could be detected — narrow the catch scope.
- **`execSync` error handling**: flag `execSync` calls not wrapped in `try/catch` — Symfony CLI commands exit non-zero when the project is invalid or a command is unavailable. On failure, return an empty data structure (`{}` or `[]`), not `null` or `undefined`, so providers degrade gracefully.
- **`fetch` error handling**: flag `fetch()` calls that check `response.ok` without a `catch` for network errors, or that do not explicitly handle non-2xx responses.
- **`JSON.parse` without try/catch**: flag bare `JSON.parse(str)` — malformed JSON throws synchronously; wrap in `try/catch`.
- **Error context in logs**: flag `console.error(e)` without contextual information — include the operation name and relevant identifiers: `console.error('Failed to run debug:container', { cwd, error: e })`.
- **Re-throwing**: when a `catch` block only logs, re-throw so the caller can also handle: `catch (e) { console.error(...); throw e; }`.

---

## 8. Security

- **Shell injection**: flag `execSync` where the command string is assembled by interpolating workspace-derived values (e.g. a project root path or file name) using string concatenation — use `child_process.execFileSync` with an argument array, or quote and validate the value before interpolation.
- **Webview HTML**: flag `webview.html = userContent` or any assignment of unsanitised workspace data to a webview's `html` property — sanitise content or use a Content Security Policy.
- **`eval()` usage**: flag all `eval()`, `new Function(string)`, or `setTimeout(string, ...)` calls — they execute arbitrary code and are never necessary.
- **Credential exposure**: flag `console.log` or `console.debug` statements that could print secrets, tokens, or sensitive workspace data — remove or guard behind a debug flag.
- **Unvalidated URI construction**: flag string concatenation used to build file URIs from workspace-derived values — use `vscode.Uri.joinPath` or `vscode.Uri.file` to construct URIs safely.

---

## 9. Performance & Memory

- **Cache bypass**: flag `execSync` calls that bypass the 30-second cache in `src/symfony/console.js` — every Symfony CLI call must go through the cached module.
- **Unbounded `findFiles`**: flag `vscode.workspace.findFiles` calls without a result limit argument — add a reasonable cap (e.g. `5`) to avoid scanning the entire workspace.
- **Unbounded `setInterval`**: flag `setInterval` calls without a stored reference and a corresponding `clearInterval` — the interval will run forever if the extension deactivates.
- **Excessive tree refresh**: flag `EventEmitter.fire()` or `onDidChangeTreeData` emissions triggered on every document change event — fire only when the underlying Symfony data actually changes (e.g. after `symfony.refresh` or cache invalidation).
- **Redundant shell calls**: flag multiple calls to `getServices()`, `getRoutes()`, or `getParameters()` within the same provider invocation — call once, store in a local variable.
- **Result caching in providers**: flag repeated regex construction inside `provideCompletionItems` or `provideHover` that could be hoisted to module scope as a compiled constant.

---

## 10. Code Quality

- **DRY principle**: flag blocks of 5+ lines that appear more than once — extract to a shared function or a utility module under `app/src/`.
- **Magic numbers and strings**: flag inline numeric literals (e.g. `setTimeout(fn, 30000)`) or repeated string constants — extract to a named `const` at module scope.
- **Dead code**: flag unreachable code after `return`, `throw`, or `break`. Flag functions, variables, and imports that are defined but never used.
- **Commented-out code**: flag commented-out code blocks without an explanation — restore with a comment explaining why it is inactive, or delete.
- **Console statements**: flag `console.log()` / `console.debug()` left in production-targeted code — use a structured logging utility or guard behind a debug flag.
- **Deeply nested callbacks**: flag callbacks or promise chains nested more than 3 levels deep — flatten with `async/await` or extract inner functions.

---

## 11. Output Format

Provide the analysis results in the following structure:

### Summary

| Category                        | Status (OK / WARN / FAIL) | Issue Count |
| ------------------------------- | ------------------------- | ----------- |
| Module System & Imports         |                           |             |
| Variable Declarations           |                           |             |
| Modern Syntax (ES2020–2022)     |                           |             |
| Functions & Async               |                           |             |
| Class Design                    |                           |             |
| VSCode Extension Conventions    |                           |             |
| Error Handling                  |                           |             |
| Security                        |                           |             |
| Performance & Memory            |                           |             |
| Code Quality                    |                           |             |

### Critical Issues (must fix)

For each issue: **[Line N]** description → recommended fix with a code snippet.

### Improvement Suggestions (should fix)

For each suggestion: **[Line N]** description → recommended approach.

### Refactoring Suggestions

For structural changes (provider extraction, utility modules, async refactoring, etc.), describe the suggestion with before/after code examples.

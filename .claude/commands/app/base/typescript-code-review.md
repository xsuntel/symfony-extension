---
description: "Evaluate TypeScript file quality and provide structured improvement recommendations."
argument-hint: "<path/to/file.ts>"
---

Analyse the following TypeScript file:

**`$1`**

Perform a thorough review across all sections below. This is a TypeScript VSCode extension: source in `app/src/**/*.ts` is compiled with `tsc` (`app/tsconfig.json`) to `app/out/`, and the Extension Host loads the compiled `main` (`./out/extension.js`). For every finding, state the exact line number and provide a concrete fix or improved code snippet.

---

## 1. Module System & Imports

Check for the following and flag any violations:

- **ES module syntax in source**: `.ts` source uses `import` / `export`. `tsc` emits the CommonJS module format the Extension Host requires — do not hand-write `require()` / `module.exports` in `.ts` files. Flag CommonJS interop written by hand where an `import` would compile correctly.
- **`import type` for type-only imports**: flag a value import used solely for a type — use `import type { Foo } from '...'` (or an inline `import { type Foo }`) so the import is erased at compile time.
- **Import grouping**: imports must be sorted and grouped at the top of the file:
  1. Node built-ins (`child_process`, `path`, `fs`)
  2. The `vscode` module (`import * as vscode from 'vscode'`)
  3. Local modules (relative paths `./` or `../`)
  - Flag unsorted or ungrouped imports, and any dynamic `import()` / `require()` buried mid-function without a lazy-loading justification.
- **Export shape**:
  - One class per module: `export class ClassName {}` (or `export default`).
  - Entry point (`extension.ts`): `export function activate(...)` / `export function deactivate()`.
  - Singleton modules (e.g. `src/symfony/console.ts`) export a single shared instance or a set of named functions over shared state.
  - Flag mixed export styles within one module.
- **Unused imports**: flag any imported binding never referenced (`typescript-eslint` / `noUnusedLocals` should catch these — flag if config is missing).
- **Runtime dependencies**: the extension ships with `devDependencies` only — flag any `import` of an npm package that would become a runtime dependency; built-in Node modules and `vscode` are the only allowed runtime imports.

---

## 2. Type Safety & Type System

The type system is the primary correctness tool — hold it strict:

- **No `any`**: flag every implicit or explicit `any`. Prefer `unknown` + narrowing, a precise type, or a generic. Flag `noImplicitAny` being disabled in `tsconfig.json`.
- **`unknown` for external data**: flag `JSON.parse(...)` whose result is used without being typed as `unknown` and narrowed by a type guard — never cast raw parsed data straight to a domain type.
- **Unsafe assertions**: flag `as SomeType`, `as unknown as T`, and non-null `!` where a type guard or a correct signature would remove the need. Assertions hide real type errors.
- **Explicit return types**: flag exported functions, provider methods, and public class members that rely on inference across a module boundary — declare the return type explicitly.
- **Domain interfaces**: flag inline structural object types repeated across the file — model Symfony shapes as named `interface` / `type` (e.g. `ServiceDefinition`, `RouteDefinition`, `ParameterMap`). Express the `getRoutes()` array-vs-object version difference as a discriminated union or normalise to one typed shape.
- **Strict null handling**: with `strictNullChecks`, flag optional results not typed as `T | undefined` and used without a guard. Flag `!` used to silence a legitimately nullable value.
- **`@ts-ignore` / `@ts-expect-error`**: flag any suppression without an adjacent comment explaining why; prefer `@ts-expect-error` (which fails if the error disappears) over `@ts-ignore`.
- **`enum` vs union**: flag a numeric `enum` where a string-literal union or `as const` object would be safer and tree-shakeable.
- **`readonly`**: flag class fields and array/object parameters that are never mutated but not marked `readonly` / `ReadonlyArray<T>`.

---

## 3. Variable Declarations & Scope

- **Default to `const`**: flag any `let` declaration whose binding is never reassigned — it should be `const`.
- **No `var`**: flag all `var` declarations — replace with `const` or `let` in the appropriate block scope.
- **Naming conventions**:
  - Variables, functions, and methods: `camelCase`.
  - Classes, interfaces, type aliases, enums: `PascalCase` (do not prefix interfaces with `I`).
  - Module-level constants: `UPPER_SNAKE_CASE`.
  - Type parameters: single uppercase letter or `PascalCase` (`T`, `TItem`).
  - Flag any deviations.
- **`for...in` over arrays**: flag `for (const key in array)` — use `for...of` or `.forEach()` for array iteration.
- **Shadowed variables**: flag inner-scope declarations that share a name with an outer-scope binding.

---

## 4. Modern Syntax (ES2020+)

Flag legacy patterns where a modern, safer alternative exists:

- **Optional chaining `?.`**: flag `obj && obj.prop && obj.prop.method()` chains — replace with `obj?.prop?.method()`.
- **Nullish coalescing `??`**: flag `value || default` when `value` can legitimately be `0`, `''`, or `false` — replace with `value ?? default`.
- **Logical assignment**: flag manual `if (!x) x = y` patterns — replace with `x ??= y`, `x ||= y`, or `x &&= y`.
- **Destructuring**: flag repeated property accesses (`obj.a`, `obj.b`, `obj.c`) at the top of a function — use `const { a, b, c } = obj`.
- **Spread operator**: flag `Object.assign({}, a, b)` — replace with `{ ...a, ...b }`. Flag `[].concat(arr1, arr2)` — replace with `[...arr1, ...arr2]`.
- **Template literals**: flag string concatenation via `+` — replace with `` `${value}` ``.
- **`Promise.allSettled()` / `Promise.any()`**: flag `Promise.all()` when partial failure should not abort the whole batch.
- **No top-level `await`**: with a CommonJS compile target, top-level `await` is unavailable — flag it. Keep `await` inside async provider methods; an async IIFE is acceptable only in test setup code.

---

## 5. Functions & Async Programming

- **Arrow functions for callbacks**: flag `function` expressions used as callbacks, array method arguments, or inline handlers — replace with arrow functions.
- **Typed parameters & returns**: flag parameters or return values left to implicit `any`; every public function signature should be fully typed.
- **`async/await` over `.then()` chains**: flag `.then().catch()` chains — rewrite with `async/await` and `try/catch`.
- **Unhandled promise rejections**: flag `async` calls that are neither `await`ed nor have a `.catch()` (`no-floating-promises`) — unhandled rejections crash modern runtimes.
- **`async` without `await`**: flag `async` functions containing no `await` — the keyword (and the `Promise` wrap) is unnecessary.
- **`void` returns**: flag `Promise<void>` handlers passed where a synchronous `void` callback is expected (e.g. event listeners) without `void`-ing the promise.
- **Default parameters**: flag `const value = arg || 'default'` at the top of a body — use a typed default parameter instead.
- **Function length**: flag functions exceeding ~30 lines — extract sub-responsibilities into helper functions.

---

## 6. Class Design & Encapsulation

- **`class` syntax**: flag constructor-function / prototype patterns — use `class`.
- **Access modifiers**: flag internal state exposed without `private` / `protected`; prefer TypeScript `private` (compile-time) or `#private` fields (runtime) consistently within a module — do not mix both styles.
- **`readonly` fields**: flag injected dependencies and constants that are never reassigned but not `readonly`.
- **Parameter properties**: flag a constructor that only copies parameters to fields — use parameter properties (`constructor(private readonly dep: Dep) {}`).
- **`TreeDataProvider<T>` typing**: flag a `TreeDataProvider` implemented without its generic type argument, or `getChildren()` logic / `vscode.window` / `vscode.workspace` calls placed inside a `constructor()` — defer to `getChildren()`.
- **`super()` call**: flag subclasses overriding `constructor()` without calling `super()` first.
- **`implements` over structural guessing**: flag a provider class that does not `implements vscode.CompletionItemProvider` / `HoverProvider` / `DefinitionProvider` — the interface catches signature drift at compile time.

---

## 7. VSCode Extension Conventions

- **Disposable registration**: flag any return value from `vscode.languages.register*`, `vscode.window.createTreeView`, or `vscode.commands.registerCommand` not pushed to `context.subscriptions`.
- **Typed `EventEmitter`**: flag `new vscode.EventEmitter()` without a type argument (`EventEmitter<T | undefined>`), and any emitter not pushed to `context.subscriptions`.
- **Blocking `activate()`**: flag synchronous `execSync` or other blocking I/O at the top level of `activate(context: vscode.ExtensionContext)` — defer heavy work.
- **`package.json` / `activate()` consistency**: flag any `contributes.commands` entry without a matching `registerCommand`, and any `contributes.views` ID without a matching `createTreeView`. Also flag `main` not pointing at the compiled `out/` entry.
- **Activation event scope**: flag `"onLanguage:php"` without `"workspaceContains:**/symfony.lock"` / `"**/bin/console"` — the extension will activate in every PHP project.
- **Provider early exit**: flag provider methods that call `getServices()` / `getRoutes()` / `getParameters()` before checking whether the current line matches an expected pattern.
- **Language selector duplication**: flag inline `[{ language: 'php' }, { language: 'yaml' }]` — extract to a shared typed `DocumentSelector` constant.
- **Trigger character mismatch**: flag a mismatch between the trigger characters declared in `registerCompletionItemProvider(selector, provider, ...triggerChars)` and those handled in `provideCompletionItems`.
- **Direct `execSync` outside `console.ts`**: flag any `execSync` bypassing `src/symfony/console.ts` — all Symfony shell commands go through the cached singleton (30s TTL, `invalidateCache()`).
- **`findFiles` glob tightness**: flag `vscode.workspace.findFiles` calls missing a `**/vendor/**` exclude or a result limit.

---

## 8. Error Handling

- **Empty `catch` blocks**: flag `catch {}` — every caught error must be logged or re-thrown.
- **`catch` variable typing**: with `useUnknownInCatchVariables`, the caught value is `unknown` — flag code that accesses `e.message` without narrowing (`e instanceof Error`).
- **`execSync` error handling**: flag `execSync` not wrapped in `try/catch` — Symfony CLI commands exit non-zero when the project is invalid. On failure return an empty typed structure (`{}` / `[]`), not `null` / `undefined`, so providers degrade gracefully.
- **`JSON.parse` without try/catch**: flag bare `JSON.parse(str)` — malformed JSON throws synchronously; wrap in `try/catch` and type the result `unknown`.
- **Error context in logs**: flag `console.error(e)` without context — include the operation name and identifiers.
- **Re-throwing**: when a `catch` block only logs, re-throw so the caller can handle it too.

---

## 9. Security

- **Shell injection**: flag `execSync` where the command string interpolates workspace-derived values — use `child_process.execFileSync(cmd, args: string[])`, or validate before interpolation.
- **Webview HTML**: flag assignment of unsanitised workspace data to a webview's `html` — sanitise or use a Content Security Policy.
- **`eval()` usage**: flag all `eval()`, `new Function(string)`, `setTimeout(string, ...)`.
- **Credential exposure**: flag `console.log` / `console.debug` that could print secrets or sensitive workspace data (parameter values may hold credentials).
- **Unvalidated URI construction**: flag string concatenation building file URIs — use `vscode.Uri.joinPath` / `vscode.Uri.file`.

---

## 10. Performance & Memory

- **Cache bypass**: flag `execSync` calls bypassing the 30-second cache in `src/symfony/console.ts`.
- **Unbounded `findFiles`**: flag `findFiles` calls without a result limit — add a cap (e.g. `5`).
- **Unbounded `setInterval`**: flag `setInterval` without a stored handle and a matching `clearInterval`.
- **Excessive tree refresh**: flag `EventEmitter.fire()` / `onDidChangeTreeData` emissions on every document change — fire only when Symfony data actually changes.
- **Redundant shell calls**: flag multiple `getServices()` / `getRoutes()` / `getParameters()` calls within one provider invocation — call once, store in a typed local.
- **Regex hoisting**: flag regex construction inside `provideCompletionItems` / `provideHover` that could be a module-scope `const`.

---

## 11. Code Quality

- **DRY principle**: flag blocks of 5+ lines that appear more than once — extract to a shared function or utility module under `app/src/`.
- **Magic numbers and strings**: flag inline literals (`setTimeout(fn, 30000)`) or repeated strings — extract to a named `const` (or a typed union of allowed values).
- **Dead code**: flag unreachable code after `return` / `throw`, and unused functions, variables, types, and imports.
- **Commented-out code**: flag commented-out blocks without an explanation — restore with a reason or delete.
- **Console statements**: flag `console.log()` / `console.debug()` in production-targeted code.
- **Deeply nested callbacks**: flag chains nested more than 3 levels deep — flatten with `async/await` or extract functions.

---

## 12. Output Format

Provide the analysis results in the following structure:

### Summary

| Category                        | Status (OK / WARN / FAIL) | Issue Count |
| ------------------------------- | ------------------------- | ----------- |
| Module System & Imports         |                           |             |
| Type Safety & Type System       |                           |             |
| Variable Declarations           |                           |             |
| Modern Syntax (ES2020+)         |                           |             |
| Functions & Async               |                           |             |
| Class Design & Encapsulation    |                           |             |
| VSCode Extension Conventions    |                           |             |
| Error Handling                  |                           |             |
| Security                        |                           |             |
| Performance & Memory            |                           |             |
| Code Quality                    |                           |             |

### Critical Issues (must fix)

For each issue: **[Line N]** description → recommended fix with a code snippet. Anything that fails `tsc --noEmit` is critical.

### Improvement Suggestions (should fix)

For each suggestion: **[Line N]** description → recommended approach.

### Refactoring Suggestions

For structural changes (provider extraction, shared types, async refactoring, etc.), describe the suggestion with before/after code examples.

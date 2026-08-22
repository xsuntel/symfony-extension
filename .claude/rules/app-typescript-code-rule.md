---
paths:
  - "app/**"
---

# TypeScript Extension Source (`app/src/**`)

@see tools-vscode-extension-rule.md — VSCode API surface, disposables/subscriptions, provider signatures, build layout (SoT)
@see ../output-styles/app-typescript-code-style.md — TypeScript formatting & type-safety style (SoT)
@see ../docs/app-typescript-code-docs.md — extension source reference (data layer, providers, tree views, typed Symfony shapes)

This rule does **not** restate the two SoTs above — they own the VSCode API surface and the
formatting/type-safety style. Read them first. Only the project-specific data-layer discipline that
is central to `app/src` and not fully owned elsewhere lives here.

## Symfony Data-Layer Typing (project-specific)

The extension's one recurring type-safety hazard is the `bin/console` boundary — untyped CLI JSON
flowing into providers and tree views.

- Parse every `bin/console` payload as `unknown`, then narrow it into an `interface` declared in
  `app/src/symfony/types.ts` (`ServiceDefinition`, route/parameter shapes). Never cast raw JSON
  straight to a domain type, and never let `any` reach a provider or tree-view return.
- Normalise CLI version differences to a single typed shape at the data layer
  (`app/src/symfony/console.ts`), so providers consume one stable contract.

Everything else (disposable handling, `ProviderResult` graceful degradation, `main` → `out/`,
`strict`, ESM `import` → CommonJS emit) is governed by the SoTs linked above.

# CLAUDE.md

> Scope: the `app/src/test/` suite only. For the extension entry point, data layer,
> providers, tree views, and manifest, see [../../CLAUDE.md](../../CLAUDE.md) (single source
> of truth) and [../CLAUDE.md](../CLAUDE.md) for source details.

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/                                     ← VSCode extension source (workspace root for dev)
    └── src/test/                            ← Mocha suites (compiled to out/test/, @vscode/test-cli runner)
        ├── extension.test.ts                ← Discovery, activation, command registration
        ├── providers.test.ts                ← Provider degradation ([] / null) + registration via execute*Provider
        ├── views.test.ts                    ← Empty state, disposal, filter/sort pipeline
        └── console.test.ts                  ← Pure normalisers from symfony/types.ts
```

## What Each Suite Pins Down

The test host has **no Symfony project on disk**, so `bin/console` is never found and every
data-layer getter resolves to `{}`. That is a feature: it is the deterministic path, and it is
exactly the degradation contract `REVIEW.md` cares about — providers return `[]` / `null` and
never throw in a non-Symfony workspace.

Two techniques cover what the empty host cannot reach on its own:

- **`console.test.ts`** exercises `toServiceMap` / `toRouteMap` / `toParameterMap` / `toTagNames`
  directly. They are pure functions, so every CLI payload shape (Symfony 6+ route arrays, older
  route objects, alias forms, tag forms) is testable with no VSCode host and no PHP process.
- **`views.test.ts`** declares a `StubTree extends SymfonyTreeProvider<string>` that returns fixed
  data from `fetch()`. This is the only way to test the shared filter/sort pipeline and the
  "no match" placeholder, which the empty-state path short-circuits past.

## Testing

Test runner: `@vscode/test-cli` + Mocha, configured in `.vscode-test.mjs`
(`files: 'out/test/**/*.test.js'` — the runner loads the **compiled** output, not `src`).

Source `src/test/**/*.test.ts` (TypeScript, Mocha **TDD UI** `suite()` / `test()`, typed with
`@types/mocha`, Node `assert`) → compiled by `tsc -p ./` to `out/test/**/*.test.js`.

Run: `npm test` — runs `pretest` (`npm run compile` then `npm run lint`) then `@vscode/test-cli`.

Useful testing patterns:

- Activate the extension explicitly: `await vscode.extensions.getExtension('...')?.activate()`
- Open a document: `await vscode.workspace.openTextDocument({ language: 'php', content: '...' })`
- Invoke completion: `await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, position)`
- Invoke hover: `await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)`
- Invoke go-to-definition: `await vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, position)`

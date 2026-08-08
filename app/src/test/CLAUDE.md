# CLAUDE.md

> Scope: the `app/src/test/` suite only. For the extension entry point, data layer,
> providers, tree views, and manifest, see [../../CLAUDE.md](../../CLAUDE.md) (single source
> of truth) and [../CLAUDE.md](../CLAUDE.md) for source details.

## File Structure

```text
symfony-extension/                           ← Repository root
└── app/                                     ← VSCode extension source (workspace root for dev)
    └── src/test/
        └── extension.test.ts                ← Mocha suite (compiled to out/test/, @vscode/test-cli runner)
```

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

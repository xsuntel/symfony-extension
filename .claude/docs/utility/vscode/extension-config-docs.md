# VSCode Extension Config Reference (TypeScript)

> **Reference.** The extension is configured for TypeScript: the manifest
> `main` is `./out/extension.js`, `app/tsconfig.json` drives the build, and
> `tsc -p ./` compiles `app/src/**/*.ts` → `app/out/`.
> It is the reference companion to the
> [`vscode-extension-helper`](../../../skills/utility/vscode/extension-config-helper/SKILL.md)
> skill and the [`vscode-extension-rule.md`](../../../rules/tools/vscode-extension-rule.md) SoT.
> Verified runtime facts: [../../../../app/CLAUDE.md](../../../../app/CLAUDE.md).

VSCode Extension API: <https://code.visualstudio.com/api>

## `package.json` Manifest

| Field | TypeScript value | Notes |
| --- | --- | --- |
| `main` | `"./out/extension.js"` | Compiled entry — never a `src/*.ts` path |
| `engines.vscode` | `"^1.120.0"` | Must align with the installed `@types/vscode` |
| `activationEvents` | `["onLanguage:php", "onLanguage:yaml"]` | Consider adding `workspaceContains:**/bin/console` to scope to Symfony projects |
| `categories` | `["Other"]` | Marketplace grouping |
| `contributes` | commands · views · viewsContainers · menus | Static declarations read before activation |
| `scripts` | `compile` / `watch` / `vscode:prepublish` | See Build below |
| `devDependencies` | `typescript`, `@types/vscode`, `@types/node`, `typescript-eslint`, `@vscode/test-cli`, `@vscode/test-electron` | Ship dev deps only — no runtime dependency |

## `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "module": "Node16",           // CommonJS-family emit the Extension Host require()s
    "target": "ES2022",
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,            // F5 breakpoints map out/*.js back to src/*.ts
    "strict": true,               // primary correctness tool — no implicit any
    "lib": ["ES2022"],
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "out"]
}
```

- `strict` on is non-negotiable — it is the type-safety baseline the review agents enforce.
- `sourceMap: true` is required for debugging; without it F5 breakpoints will not bind.
- `main` in `package.json` must match `outDir` (`out/extension.js`).

## Build

```jsonc
// package.json → scripts
{
  "vscode:prepublish": "npm run compile",
  "compile": "tsc -p ./",
  "watch": "tsc -watch -p ./",
  "lint": "eslint src",
  "pretest": "npm run compile && npm run lint",
  "test": "vscode-test"
}
```

- Development loop: keep `npm run watch` running, then **F5** — or run `npm run compile` before each launch.
- `out/` is build output: never hand-edit compiled JS, and do not commit a stale `out/`.
- `vscode:prepublish` guarantees a fresh compile before packaging (`vsce`).

## Activation Events (`activationEvents`)

The extension activates lazily — only when a declared event fires:

| Event | Purpose |
| --- | --- |
| `onLanguage:php` | Activate when a PHP file opens |
| `onLanguage:yaml` | Activate when a YAML file opens |
| `workspaceContains:**/bin/console` | Confirm it is a Symfony workspace (recommended scoping) |
| `onStartupFinished` | Defer without blocking VSCode startup |

`activate(context: vscode.ExtensionContext)` must not block — defer heavy I/O
(`execFileSync` to `bin/console`) behind lazy calls, not the activation path.

## Contribution Points (`contributes`)

Declare every static contribution in `package.json`; never register these
programmatically in `activate()`.

```jsonc
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        { "id": "symfony", "title": "Symfony", "icon": "assets/symfony.svg" }
      ]
    },
    "views": {
      "symfony": [
        { "id": "symfony.services", "name": "Services" },
        { "id": "symfony.routes", "name": "Routes" },
        { "id": "symfony.parameters", "name": "Parameters" }
      ]
    },
    "commands": [
      { "command": "symfony.refresh", "title": "Symfony: Refresh", "icon": "$(refresh)" }
    ],
    "menus": {
      "view/title": [
        { "command": "symfony.refresh", "when": "view == symfony.services || view == symfony.routes || view == symfony.parameters", "group": "navigation" }
      ]
    }
  }
}
```

Each `contributes` entry has a runtime counterpart in `extension.ts` that must
match: `commands[].command` ↔ `registerCommand(id, …)`, `views[].id` ↔
`createTreeView(id, …)`. A mismatch is a bug — report it.

## Testing

Runner: `@vscode/test-cli` + `@vscode/test-electron`, configured in
`.vscode-test.mjs`. TypeScript tests compile alongside the extension.

```javascript
// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',   // point at COMPILED output, not src
});
```

- Source `src/test/**/*.test.ts` → compiled `out/test/**/*.test.js`; the runner loads the compiled `.js`.
- Mocha **TDD UI** (`suite()` / `test()`), typed with `@types/mocha`, Node `assert`.
- Drive providers through VSCode commands inside the Extension Host:
  `vscode.executeCompletionItemProvider`, `vscode.executeHoverProvider`, `vscode.executeDefinitionProvider`.

## Debugging (`.vscode/launch.json`)

```jsonc
{
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}/app"],
      "outFiles": ["${workspaceFolder}/app/out/**/*.js"],
      "preLaunchTask": "npm: watch"
    }
  ]
}
```

- `outFiles` + `sourceMap` let the debugger map `out/*.js` back to `src/*.ts`.
- `--extensionDevelopmentPath` points at `app/` (the extension root).

## Common Config Pitfalls

- `main` pointing at a `src/*.ts` path (or a non-existent `./extension.js`) instead of `./out/extension.js` → the Extension Host loads the wrong/absent file.
- `sourceMap` disabled → F5 breakpoints never bind.
- `.vscode-test.mjs` `files` pointing at `test/*.ts` instead of compiled `out/test/*.js` → tests do not run.
- Stale `out/` committed or launched without recompiling → old behavior runs despite fresh `src`.
- Runtime npm dependency added silently → changes packaging; present bundling trade-offs explicitly.

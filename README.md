# README

This project is an extension for VSCode to develop a web application using [Symfony Framework](https://symfony.com). It is written in **TypeScript** and provides services, routes, and parameters autocomplete, hover documentation, go-to-definition, and sidebar tree views for PHP and YAML files.

## Project

* Directory Structure

```text
symfony-extension/                            ← Repository root
└── app/                                      ← Extension source (workspace root for dev)
    ├── src/                                  ← TypeScript source
    │   ├── extension.ts                      ← Entry point: activate() / deactivate()
    │   ├── symfony/
    │   │   ├── console.ts                    ← Singleton: runs bin/console, caches results
    │   │   └── types.ts                      ← Typed Symfony payload shapes
    │   ├── providers/
    │   │   ├── completionProvider.ts
    │   │   ├── hoverProvider.ts
    │   │   ├── definitionProvider.ts
    │   │   └── cursorToken.ts                ← Shared cursor-token extraction
    │   ├── views/
    │   │   ├── servicesTreeProvider.ts
    │   │   ├── routesTreeProvider.ts
    │   │   ├── parametersTreeProvider.ts
    │   │   └── emptyState.ts                 ← Empty-state tree item helper
    │   └── test/                             ← Mocha suites (extension / providers / views)
    ├── out/                                  ← tsc build output (main loads ./out/extension.js)
    ├── tsconfig.json                         ← TypeScript compiler config (strict, src → out)
    └── package.json                          ← Extension manifest (engines, contributes, activationEvents)
```

## Build / Run / Test

Run these from the `app/` directory:

* `npm run compile` — one-off build `src/**/*.ts` → `out/` (`tsc -p ./`)
* `npm run watch` — incremental rebuild during development
* Open `app/` as the workspace root and press **F5** to launch the Extension Development Host
* `npm test` — runs `pretest` (compile + lint) then the `@vscode/test-cli` suite

See [app/CLAUDE.md](app/CLAUDE.md) for the full source, build, and testing reference (single source of truth).

## Reference

* [PHP](https://www.php.net)
    * [Symfony Framework](https://symfony.com)
        * [SymfonyCasts](https://symfonycasts.com)

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

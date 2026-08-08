# Tools - IDE - VSCode

VSCode reference hub for this project. VSCode is used here as the **extension
development IDE**: the workspace root for extension work is `app/`, and the
extension runs in a separate Extension Development Host launched with **F5**.

This file is a **reference index only** — it links to the documents that own each
topic rather than restating them (project rule: *link, don't duplicate*).

## Official VSCode API References

| Topic | URL |
| --- | --- |
| Extension API overview | <https://code.visualstudio.com/api> |
| Extension anatomy | <https://code.visualstudio.com/api/get-started/extension-anatomy> |
| Programmatic language features | <https://code.visualstudio.com/api/language-extensions/programmatic-language-features> |
| Tree view guide | <https://code.visualstudio.com/api/extension-guides/tree-view> |
| Activation events reference | <https://code.visualstudio.com/api/references/activation-events> |
| Contribution points reference | <https://code.visualstudio.com/api/references/contribution-points> |
| vscode API namespace | <https://code.visualstudio.com/api/references/vscode-api> |
| Publishing extensions | <https://code.visualstudio.com/api/working-with-extensions/publishing-extension> |

## Where To Look (routing)

| Need | Owning document |
| --- | --- |
| Provider interfaces, registration patterns, `package.json` checklist, pitfalls | [`../../../.claude/rules/tools/vscode-extension-rule.md`](../../../.claude/rules/tools/vscode-extension-rule.md) |
| `package.json` / `tsconfig.json` / build / testing / `launch.json` config | [`../../../.claude/docs/utility/vscode/extension-config-docs.md`](../../../.claude/docs/utility/vscode/extension-config-docs.md) |
| Project stack + VSCode environment optimization (extension set, `settings.json` principles, debugging) | [`../../../.vscode/CLAUDE.md`](../../../.vscode/CLAUDE.md) |
| Extension source: entry point, providers, tree views, data layer, tests | [`../../../app/CLAUDE.md`](../../../app/CLAUDE.md) |
| This project's `.vscode/` workspace config files | [`_CONFIG.md`](_CONFIG.md) |

# CLAUDE.md

## Purpose

Documentation and configuration references for the IDE and AI tools used in this project.

## Directory Structure

```text
symfony-extension/                           ← Repository root
└── tools/                                   ← Documents
    ├── ai/
    │   └── anthropic/
    │        └── claude/                     ← Claude Code usage references (prompts, MCP config, etc.) 
    ├── ide/                                 ← IDE
    │    └── vscoe/                          ← VSCode workspace settings, extension lists, configuration guides
    │        ├── _ABSTRACT.md
    │        └── _CONFIG.md
    └── CLAUDE.md
```

## Contents

- `ai/anthropic/claude/` — Resources related to Claude Code usage on this project
- `ide/vscode/` — VSCode workspace settings, recommended extension lists, and configuration guides

## Claude Code Rules

VSCode Extension API rules and patterns for Claude are maintained as a rules file loaded automatically by Claude Code:

- [../.claude/rules/tools/vscode-extension.md](../.claude/rules/tools/vscode-extension.md) — Provider interfaces, registration patterns, `package.json` checklist, common pitfalls

## Key VSCode References for Extension Development

| Topic | URL |
| --- | --- |
| Extension API overview | [https://code.visualstudio.com/api](https://code.visualstudio.com/api) |
| Extension anatomy | [https://code.visualstudio.com/api/get-started/extension-anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy) |
| Programmatic language features | [https://code.visualstudio.com/api/language-extensions/programmatic-language-features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features) |
| Tree view guide | [https://code.visualstudio.com/api/extension-guides/tree-view](https://code.visualstudio.com/api/extension-guides/tree-view) |
| Activation events reference | [https://code.visualstudio.com/api/references/activation-events](https://code.visualstudio.com/api/references/activation-events) |
| Contribution points reference | [https://code.visualstudio.com/api/references/contribution-points](https://code.visualstudio.com/api/references/contribution-points) |
| vscode API namespace | [https://code.visualstudio.com/api/references/vscode-api](https://code.visualstudio.com/api/references/vscode-api) |
| Publishing extensions | [https://code.visualstudio.com/api/working-with-extensions/publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) |

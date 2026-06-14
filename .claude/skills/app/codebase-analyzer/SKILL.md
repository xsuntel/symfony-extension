---
name: app-codebase-analyzer
description: Analyze and document the app/ codebase structure. Use when asked to understand the architecture, trace data flow, audit dependencies, or produce a structural overview of the VSCode extension source.
---

# Codebase Analyzer

## Information Sources

This skill uses **only** the following sources:

- Source code files within the project (`app/src/`, `app/extension.js`, etc.)
- Documentation files within the project (`CLAUDE.md`, `README.md`, `CHANGELOG.md`)
- Dependency and manifest files (`app/package.json`, `app/jsconfig.json`, `app/eslint.config.mjs`)

If required information is not present in any project file:

- State explicitly: "This information could not be confirmed from project files."
- Recommend consulting official documentation via the Context7 MCP when applicable.
- Do not infer, assume, or generalize from outside knowledge.

## Analysis Steps

Perform these steps in order. Skip any step that is not relevant to the user's specific question.

### 1. Entry Point & Lifecycle

Read `app/extension.js` and document:

- What is registered in `activate()`: providers, tree views, commands
- Which disposables are pushed to `context.subscriptions` (flag any that are not)
- What `deactivate()` does (usually empty)

### 2. Manifest (`app/package.json`)

Read `app/package.json` and document:

- `engines.vscode` — minimum VSCode version
- `activationEvents` — which events trigger the extension
- `contributes.commands` — registered commands and their IDs
- `contributes.views` / `contributes.viewsContainers` — declared tree view panels
- `contributes.menus` — command-to-menu bindings
- `scripts` — available npm tasks (lint, test, etc.)
- `dependencies` / `devDependencies` — external packages used

### 3. Data Layer (`src/symfony/console.js`)

Read the console module and document:

- How the Symfony project root is detected
- Which `bin/console` commands are executed and with what arguments
- The cache mechanism: key format, TTL, invalidation trigger
- Return shape of each method (`getServices`, `getRoutes`, `getParameters`)

### 4. Language Providers (`src/providers/`)

For each provider file, document:

- Which VSCode interface it implements (`CompletionItemProvider`, `HoverProvider`, `DefinitionProvider`)
- Which language selector and trigger characters it uses
- The line patterns or regexes it matches and what data it returns
- Any edge cases or fallback behaviour

### 5. Tree Views (`src/views/`)

For each tree provider file, document:

- The `TreeDataProvider` implementation (`getTreeItem`, `getChildren`)
- The `TreeItem` subclass: which fields are set (`label`, `description`, `tooltip`, `iconPath`, `contextValue`)
- How and when `onDidChangeTreeData` is fired

### 6. Test Suite (`test/`)

Read `test/extension.test.js` and document:

- Test runner and configuration (`.vscode-test.mjs`)
- Which extension behaviours are tested
- Which VSCode commands are exercised (`vscode.executeCompletionItemProvider`, etc.)
- Any notable gaps in coverage

## Output Format

Produce a structured report with one section per analysis step. Use:

- **Tables** for lists of providers, commands, manifest fields, or method signatures
- **Code blocks** for key patterns, regex snippets, or return shapes
- **Bullet points** for constraints, edge cases, or observations
- A **"Known Issues / Gaps"** section at the end listing anything flagged during analysis (e.g., disposables not pushed to `context.subscriptions`, missing activation events)

Keep each section focused on facts derived from the files. Do not add implementation suggestions unless the user asks.

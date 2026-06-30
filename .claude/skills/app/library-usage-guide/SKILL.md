---
name: library-usage-guide
description: Guide on how to use external libraries in this project. Use when asked about installation, configuration, or API usage examples for any package referenced in app/package.json or the VSCode extension ecosystem.
---

# Library Usage Guide

## Source Citation Rules

Every piece of technical information must include a source reference:

| Information type | Required source |
| --- | --- |
| API usage / method signatures | Official documentation URL, or "see project usage at `<file>:<line>`" |
| Configuration options | File path where the config lives (e.g. `app/eslint.config.mjs`) |
| Version numbers | `app/package.json` (field: `dependencies` or `devDependencies`) |
| Installation commands | Official documentation or `app/package.json` scripts |

If a version cannot be confirmed from `app/package.json`, state: "version not pinned in this project — check the official release page."

## Project Library Inventory

All libraries used in this project are listed under `devDependencies` in `app/package.json`. There are no runtime `dependencies` (the extension uses only the built-in `vscode` module injected by VSCode at runtime).

| Package | Version | Role |
| --- | --- | --- |
| `vscode` (built-in) | `^1.120.0` (via `engines.vscode`) | VSCode Extension API — injected at runtime, not installed via npm |
| `@types/vscode` | `^1.120.0` | TypeScript type definitions for the VSCode API |
| `@types/mocha` | `^10.0.10` | TypeScript type definitions for Mocha test assertions |
| `@types/node` | `22.x` | Node.js built-in type definitions |
| `eslint` | `^9.39.3` | JavaScript linter (flat config via `eslint.config.mjs`) |
| `@vscode/test-cli` | `^0.0.12` | VSCode extension test runner (CLI wrapper) |
| `@vscode/test-electron` | `^2.5.2` | Launches an Electron-based VSCode instance for integration tests |

## Steps for Answering a Library Question

Follow these steps in order:

### 1. Identify the library and version

Read `app/package.json`. Check both `dependencies` and `devDependencies`. State the version found, or note if it is absent.

### 2. Check for existing usage in the project

Search the `app/` source tree for imports or require calls referencing the library. If found:

- Cite the file and line number (e.g. `app/src/providers/completionProvider.js:3`)
- Describe how the project already uses it — this is the most relevant example

### 3. Provide installation guidance

If the library is already installed (present in `package.json`), state that. If it needs to be added:

```bash
# devDependency (tooling, testing, types)
npm install --save-dev <package>

# runtime dependency (used at extension runtime)
npm install <package>
```

Note: for VSCode extensions, the `vscode` API itself is never installed — it is provided by the host.

### 4. Show configuration example

If configuration is needed (e.g. ESLint, test runner), reference the actual config file in this project:

- ESLint: `app/eslint.config.mjs`
- Test runner: `app/.vscode-test.mjs`
- TypeScript/JS checking: `app/jsconfig.json`

### 5. Show API usage example

Provide a minimal code snippet. Prefer examples drawn from this project's source over generic documentation examples. Always cite the source:

- Project file: "adapted from `app/src/views/servicesTreeProvider.js:42`"
- Official docs: include the full URL

## Response Format

Structure every library guide response as follows:

```
## <Library Name> (<version from package.json or "version TBD">)

**Role in this project**: <one sentence>

### Installation
<command or "already installed — see app/package.json">
(Source: <official docs URL or "app/package.json">)

### Configuration
<config snippet or "no configuration required">
(Source: <file path or official docs URL>)

### Usage Example
<code snippet>
(Source: <project file:line or official docs URL>)

### Notes
<any version-specific caveats, known issues, or links to changelog>
```

If the library is not present in the project and cannot be confirmed from official docs, state: "This information could not be confirmed from project files or official documentation. Please verify directly at <official site>."

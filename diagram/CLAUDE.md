# CLAUDE.md

## Purpose

Architecture diagrams for the Symfony Extensions VSCode extension project, created with [draw.io](https://www.drawio.com/).

## Directory Structure

```text
symfony-extension/                           ← Repository root
└── diagram/                                 ← draw.io
    ├── base/                                ← Reference architecture diagrams (currently being populated)
    └── CLAUDE.md
```

## Conventions

- All diagrams are draw.io (`.drawio` or `.drawio.xml`) format
- `base/` contains technology-agnostic reference diagrams
- Export diagrams as SVG or PNG alongside the source file when sharing

## Suggested Diagrams

Key flows worth documenting for this extension:

| Diagram | Description |
| --- | --- |
| Extension activation flow | `activationEvents` → `activate()` → provider registration |
| Provider data flow | Editor event → provider method → `console.js` cache → `bin/console` → VSCode response |
| Tree view refresh cycle | `symfony.refresh` command → `invalidateCache()` → `onDidChangeTreeData.fire()` → VSCode re-renders |
| Service resolution flow | Service ID (PHP/YAML) → `getServices()` → FQCN → `findFiles` → `Location` |

## When to Update Diagrams

Update the relevant diagram whenever:

- A new provider or tree view is added to `src/`
- The `console.js` data layer gains a new command (`getServices`, `getRoutes`, `getParameters`, …)
- The activation strategy changes (new `activationEvents` in `package.json`)
- A significant refactor changes how data flows between the editor event and the VSCode response

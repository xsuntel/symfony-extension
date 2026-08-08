# Tools - IDE - VSCode - Config

Reference for this repository's **workspace configuration** under `.vscode/`.
Authoring principles (Workspace-over-User, formatter rules, exclusions) are owned
by [`../../../.vscode/CLAUDE.md`](../../../.vscode/CLAUDE.md) §4 — this file only
maps the files that actually exist.

## `.vscode/` Files (current)

| File | Purpose |
| --- | --- |
| [`../../../.vscode/extensions.json`](../../../.vscode/extensions.json) | Team-recommended extension IDs (see below) |
| [`../../../.vscode/launch.json`](../../../.vscode/launch.json) | F5 debug config — `type: extensionHost`, `--extensionDevelopmentPath=${workspaceFolder}/app` |
| [`../../../.vscode/tasks.json`](../../../.vscode/tasks.json) | Currently Git utility script tasks (start / stop / localhost clear) |
| [`../../../.vscode/CLAUDE.md`](../../../.vscode/CLAUDE.md) | Project stack + VSCode environment optimization rules |

> `.vscode/settings.json` **does not exist yet**. Propose one only when a concrete
> need arises, at the Workspace level; follow the authoring principles in
> `.vscode/CLAUDE.md` §4.2 (per-file-type formatter, `files.exclude`, ESLint flat
> config) rather than restating them here.

## Recommended Extensions (`extensions.json`)

Verified IDs from the actual `recommendations` list:

| ID | Role |
| --- | --- |
| `anthropic.claude-code` | Claude Code — project AI tooling standard |
| `dbaeumer.vscode-eslint` | ESLint (flat config `app/eslint.config.mjs`) |
| `ms-vscode.extension-test-runner` | Run `@vscode/test-cli` tests from the Test Explorer |
| `mikestead.dotenv` | `.env` support for `bin/console` fixtures |
| `esbenp.prettier-vscode` | Formatting — do not fight ESLint rules |
| `github.github-vscode-theme` | Editor theme |
| `davidanson.vscode-markdownlint` | Markdown lint for `CLAUDE.md` / docs |
| `pkief.material-icon-theme` | File icon theme |

> PHP/Symfony tooling (e.g. Intelephense) and a local PHP install are **optional
> fixture prerequisites** for manually exercising the extension against a Symfony
> project — never core dev dependencies. See `.vscode/CLAUDE.md` §4.1.

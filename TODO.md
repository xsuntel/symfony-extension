# TODO

Verified, evidence-backed items derived from the current docs/code snapshot (2026-07-23).
Add new items only when backed by a concrete finding in the source or docs.

## Features

- [ ] **Wire `setFilter` to the UI.** All three tree providers expose `setFilter(text)`, but it
  is bound to no command or menu, so it is currently unreachable from the UI
  (source: `app/src/CLAUDE.md`, "Tree Views" finding). Either add a `symfony.filter` command
  with a `contributes.menus["view/title"]` binding, or remove the dead code.

## Docs

- [ ] **Sync the activation-events table in `app/CLAUDE.md`.** The manifest table lists only
  two `activationEvents` (`onLanguage:php`, `onLanguage:yaml`), but `app/package.json` declares
  three — it also includes `workspaceContains:**/bin/console`. Update the table to match.

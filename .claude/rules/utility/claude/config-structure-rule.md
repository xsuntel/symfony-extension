---
paths:
  - ".claude/**/*"
---

# .claude Configuration Structure (Immutable)

@see https://code.claude.com/docs/en/skills — skill discovery, directory layout, and command-name derivation
@see https://code.claude.com/docs/en/sub-agents
@see CLAUDE.md — the "Repository Structure" tree is the single source of truth for this layout

Paths under `.claude/` are **load-bearing**: a directory name decides a slash command's name, pairs an
agent with its memory, or determines whether an artifact is discovered at all. A tidy-up that moves or
flattens folders here does not reorganise the config — it silently changes or disables behaviour.

## Prohibited

- Do not **move, rename, merge, or delete** any directory under `.claude/`
- Do not **flatten** the nested domain paths (`app/agent/`, `app/base/`, `utility/claude/`,
  `utility/git/`, `tools/`) into a single level, and do not introduce **new grouping levels**
  (see **Allowed** for the domain-mirror and `.claude/tmp/**` exemptions)
- Do not relocate a file across domains "for consistency" — under `.claude/`, path *is* identity
- Do not delete `.gitkeep` placeholders or prune reserved-but-empty directories — the reserved
  rules directory, every `.claude/hooks/<event>/` slot, `.claude/workflows/`, and a skill's own
  `assets/` · `references/` · `scripts/` placeholders
- Do not "tidy" `.claude/skills/` by nesting its skill directories into domain folders

## Why The Paths Are Load-Bearing

- **Commands** — `.claude/commands/app/base/typescript-code-review.md` produces
  `/app:base:typescript-code-review`. Moving the file renames the command and breaks every reference
  to it. Nested paths are supported here; the path slug *is* the invocation name.
- **Agent memory** — `.claude/agent-memory/app/base/<agent>/MEMORY.md` mirrors
  `.claude/agents/app/base/<agent>.md`. Breaking the mirror orphans that agent's memory.
- **Skills** — a project skill is discovered **only** at `.claude/skills/<skill-name>/SKILL.md`, one
  directory directly under `.claude/skills/`. A grouping subdirectory is never loaded, and no error is
  reported. The directory name becomes the `/command` name.
- **Hooks** — `.claude/hooks/<event>/` names are lifecycle event slots, not free-form folders.
- **Rules** — `.claude/rules/**` is loaded into context automatically; moving a rule leaves every
  `@see` and `CLAUDE.md` link that points at the old path dangling.

## Allowed

- Adding a **new file** inside an existing directory that already holds that artifact type
- Adding a new skill as `.claude/skills/<new-skill-name>/SKILL.md` — one level, flat
- Creating a directory **only** to mirror an already-established domain path (`app/agent/`,
  `app/base/`, `utility/claude/`, `utility/git/`, `tools/`) for a new artifact of that domain —
  never a newly invented grouping name, and never under `.claude/skills/`
- Editing file contents in place
- `.claude/tmp/**` is exempt from every rule above: it is gitignored scratch space, and the
  author → reviewer workflow creates it on demand (`mkdir -p .claude/tmp/utility/claude`)
- Structural change **only** when the user explicitly asks for that exact move, rename, or deletion in
  the current request — and then only after stating which command names, memory paths, or skill
  discovery it will affect

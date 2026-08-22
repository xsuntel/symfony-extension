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

> **Sole exemption — `.claude/skills/**/*`.** Structure change and flattening are **not** prohibited
> under `.claude/skills/`; that tree is governed by the discovery requirement in **Skill Directory
> Naming** below instead. Every prohibition in this section applies to all of `.claude/` *except*
> `.claude/skills/`.

- Do not **move, rename, merge, or delete** any directory under `.claude/` (outside `.claude/skills/`)
- **`agents/`, `commands/`, `rules/`, `agent-memory/`, `output-styles/`, and `docs/` are flat.** Each
  holds files (or, for `agent-memory/`, one directory per agent) directly at one level, with the
  domain carried as a **filename prefix** — `app-typescript-code-reviewer.md`,
  `utility-git-commit-rule.md`, `app-typescript-code-style.md`, `app-typescript-code-docs.md`. Do not
  re-introduce `app/` · `tools/` · `utility/` subdirectories in these six trees: the prefix *is* the
  domain, and a subdirectory changes the command name or breaks memory resolution
- **Reference docs are named `<domain>-<name>-docs.md`** — `abstract-`, `agent-team`, `app-`,
  `tools-`, and `utility-` are the domains, exactly as in `agents/`. `abstract-` marks
  artifacts that are not scoped to one area of the repository, such as the general output styles;
  `tools-` marks artifacts that specify an **external tool's** API or configuration — currently the
  VSCode Extension API (`tools-vscode-extension-*`) — mirroring the `scripts/tools/` tree, as
  distinct from `app-`, which covers this repository's own extension source;
  `agent-team` is its own domain, carrying the cross-specialist orchestrator
  (`agents/agent-team.md`) and its reference doc (`docs/agent-team-docs.md`). That agent's `name:`
  resolves `subagent_type` and `.claude/agent-memory/agent-team/`, so it does not take a prefix
- Do not relocate a file across domains "for consistency" — under `.claude/`, path *is* identity
- Do not delete `.gitkeep` placeholders or prune reserved-but-empty directories — every
  `.claude/hooks/<event>/` slot, `.claude/workflows/`, and a skill's own
  `assets/` · `references/` · `scripts/` placeholders (this one **does** apply inside
  `.claude/skills/` — the exemption covers layout, not placeholder deletion)

## Skill Directory Naming (`.claude/skills/**/*`)

Renaming or reorganising a skill directory is **allowed**. It is not immutable, because a skill's
layout is already pinned by the platform and its directory name is the only thing left to keep in
sync with the docs. Two conditions apply instead:

- **Stay flat, one level.** A project skill is discovered only at `.claude/skills/<skill-name>/SKILL.md`,
  one directory directly under `.claude/skills/`. Nesting it into a domain folder is not a style
  violation — it silently disables the skill, with no error. This is a discovery requirement, not an
  immutability rule.
- **Rename and re-reference in the same change.** The directory name *is* the `/command` name and the
  default display label. When renaming, update in the same change: the `name:` in that `SKILL.md`
  (it must equal the directory name), every `.claude/skills/<old-name>/` link, and every prose
  mention in `CLAUDE.md`, `.claude/docs/**`, `.claude/agents/**`, `.claude/commands/**`, and
  `scripts/tools/ai/anthropic/claude/_ABSTRACT.md`. A rename without the reference sweep leaves dangling
  links and a command name nobody documents.

## Why The Paths Are Load-Bearing

- **Commands** — `.claude/commands/app-typescript-code-review.md` produces
  `/app-typescript-code-review`. The path slug *is* the invocation name, so renaming the file
  renames the command and breaks every reference to it. Nested paths would work, but this tree is
  deliberately flat: a `commands/app/typescript-code-review.md` would become
  `/app:typescript-code-review` instead, a different command name.
- **Agents** — a subagent's identity is its frontmatter `name:`, not its path, and `name:` must
  equal the filename here so the two stay findable together. `name:` is also what
  `memory: project` resolves against, so a rename touches three things at once: the file, the
  `name:` field, and `.claude/agent-memory/<name>/`. Change them in the same edit.
- **Agent notes** — `.claude/agent-memory/<agent-name>/MEMORY.md` is the platform's own
  `memory: project` storage path, and it is **flat**: the directory name must equal the agent's
  `name:` exactly, with no domain level. Every agent declares `memory: project`, which injects that
  `MEMORY.md` into the subagent's system prompt at startup. Introducing a domain level (the layout
  used before) silently breaks resolution — the platform would create a new empty directory and
  orphan the notes, with no error. The notes stay hand-maintained: read-only agents carry
  `disallowedTools: Write, Edit`, so they receive their notes without being able to rewrite them.
- **Skills** — the directory name becomes the `/command` name, so it is load-bearing in a different
  sense: it may be renamed, but only together with its references. See **Skill Directory Naming**
  above; the rest of this section is immutable.
- **Hooks** — `.claude/hooks/<event>/` names mirror the documented lifecycle events so a future hook
  script has one obvious home, and renaming one breaks that correspondence. The directory is **not**
  auto-discovered: a script placed here does nothing until `settings.json` references it by path.
- **Rules** — `.claude/rules/**` is loaded into context automatically; moving a rule leaves every
  `@see` and `CLAUDE.md` link that points at the old path dangling.
- **Output styles** — a style is selected by its frontmatter `name:` (`/output-style <name>`,
  `outputStyle` in `settings.json`), not by its path, so a directory level buys nothing and the tree
  is flat. `name:` must equal the filename here, exactly as in `agents/`, so the two stay findable
  together; the domain lives in the filename prefix (`abstract-` for the general styles that apply
  to every response, `app-` for the extension-specific TypeScript style).
- **Docs** — `.claude/docs/**` is the one tree that is *not* identifier-derived: no command name,
  agent identity, or memory path resolves against it, so the flat `<domain>-<name>-docs.md` naming is
  a consistency convention with the trees above rather than a discovery requirement. What *is*
  load-bearing is the reference graph — every `@see`, `CLAUDE.md` link, and `scripts/tools/**/_ABSTRACT.md`
  row that names a doc must be swept in the same change as the rename.

## Allowed

- Adding a **new file** inside an existing directory that already holds that artifact type —
  in the flat trees (`agents/`, `commands/`, `rules/`, `output-styles/`) name it `<domain>-<name>.md`,
  and in `docs/` name it `<domain>-<name>-docs.md`
- Adding a new skill as `.claude/skills/<new-skill-name>/SKILL.md` — one level, flat
- Adding a new agent's notes directory as `.claude/agent-memory/<agent-name>/MEMORY.md`, where
  `<agent-name>` equals that agent's `name:` exactly
- Adding a new reference doc as `.claude/docs/<domain>-<name>-docs.md`, reusing an already-established
  domain prefix (`abstract-`, `agent-team`, `app-`, `tools-`, `utility-`) — never a
  newly invented grouping name, and never as a `<domain>/` subdirectory
- Editing file contents in place
- `.claude/tmp/**` is exempt from every rule above: it is gitignored scratch space, and the
  author → reviewer workflow creates it on demand (`mkdir -p .claude/tmp/utility/claude`)
- Structural change **only** when the user explicitly asks for that exact move, rename, or deletion in
  the current request — and then only after stating which command names, memory paths, or skill
  discovery it will affect

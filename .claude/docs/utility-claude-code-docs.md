# Claude Code Config Reference — `.claude/**` Authoring & Review

> **Reference.** Companion to the
> [`utility-claude-code-skill`](../skills/utility-claude-code-skill/SKILL.md) and the
> [`/utility-claude-code-review`](../commands/utility-claude-code-review.md)
> command. It summarizes the per-type spec and conventions for authoring `.claude/` config
> artifacts. Source of truth for structure: the
> [`utility-claude-code-rule.md`](../rules/utility-claude-code-rule.md) SoT and the
> [root `CLAUDE.md`](../../CLAUDE.md) "Repository Structure" tree. This is a Claude-facing
> reference, not a design proposal — do not restate criteria that already live in the SoT.

@see https://code.claude.com/docs/en/sub-agents — subagent frontmatter spec
@see https://code.claude.com/docs/en/skills — skill `SKILL.md` structure, frontmatter, directory layout

## Workflow (inline author → self-review → write)

The `utility-claude-code-skill` runs **inline** — no paired agents are spawned. Claude
drafts the artifact, self-reviews it against the review command's criteria, and writes it to the
target path once the self-review is clean.

```text
request → interpret (type + target path)
        → draft (per Per-Type Criteria)
        → self-review (Review Procedure; max 2 passes)
        ├─ clean → write to target path, report, stop
        └─ still blocking after 2 → present draft + issues, "Manual review recommended", do not write
```

## Artifact Types & Target Paths

| Type | Target path | Required frontmatter |
| --- | --- | --- |
| Subagent | `.claude/agents/<domain>-<agent>.md` (flat; `name:` must equal the filename) | `name`, `description` (opt: `model`, `tools`, `memory`, `disallowedTools`, `maxTurns`, + more in the spec) |
| Skill | `.claude/skills/<skill-name>/SKILL.md` (one level, flat) | — (rec: `description`; opt: `name`) |
| Slash command | `.claude/commands/<domain>-<name>.md` (flat; the slug is the command name) | `description` (opt: `argument-hint`, `allowed-tools`, `model`) |
| Rule | `.claude/rules/<domain>-<name>.md` (flat) | — (opt: `paths` glob) |
| Output style | `.claude/output-styles/<domain>-<name>.md` (flat; `name:` must equal the filename) | `name`, `description` (opt: `keep-coding-instructions`) |
| Reference doc | `.claude/docs/<domain>-<name>-docs.md` (flat) | — |
| Agent notes | `.claude/agent-memory/<agent-name>/MEMORY.md` (flat; the dir name must equal an agent's `name:`) | — |
| settings/hooks | `.claude/settings.json` | valid JSON (hook schema) |
| CLAUDE.md | `CLAUDE.md` or a subdirectory copy | — |

The full per-type criteria (required keys, body structure, frontmatter detail rules) live in the
review command's **Per-Type Criteria** and **Frontmatter Detail Rules** tables — use those as the
authoritative checklist, not this summary.

## Event Hooks (`.claude/hooks/**`)

@see https://code.claude.com/docs/en/hooks — event names, input JSON, exit-code/decision semantics

`.claude/hooks/<event>/` is a **naming convention only** — the platform does not discover it. A
script placed there stays inert until `.claude/settings.json` references it by path; use
`${CLAUDE_PROJECT_DIR}` so the reference survives a different `cwd`.

The live hooks all gate the TypeScript build under `app/`:

| Event (settings key) | Script | Gates | Failure mode |
| --- | --- | --- | --- |
| `SessionStart` | `session-start/app-typescript-status.sh` | missing `app/node_modules`, stale `app/out` | `additionalContext` only — cannot block |
| `PreToolUse` | `pre-tool-use/app-typescript-guard.sh` | edits to `app/out/**` and `.js` under `app/src` | `permissionDecision: "deny"` |
| `PostToolUse` | `post-tool-use/app-typescript-check.sh` | `tsc -p ./ --noEmit` + `eslint` on `app/src/**/*.ts` | exit 2 → stderr to Claude (advisory: the edit already landed) |

Authoring notes for a new hook script:

- Directory names mirror the documented event names, so `SubagentStart` maps to the existing
  `sub-agent-start/` slot despite the spelling difference. Do not rename the slots (layout is
  immutable per the rule SoT).
- Invoke project binaries directly (`app/node_modules/.bin/tsc`), never through `npx` — with
  `node_modules` absent, `npx tsc` resolves to a system decoy that exits 1 and fakes a build failure.
- A missing toolchain must degrade to `exit 0` plus a `systemMessage`, so an uninstalled workspace
  never looks like broken code.
- Emit **only** the decision JSON on stdout. Do not source `scripts/common/_abstract.sh` — its
  `setStart`/`setEnd` banners would corrupt the payload.

## Load-Bearing Path Rules (from the SoT)

Paths under `.claude/` are **load-bearing** — a directory name decides a command's name, pairs an
agent with its notes file, or determines discovery. Per
[`utility-claude-code-rule.md`](../rules/utility-claude-code-rule.md):

- **Do not move / rename / merge / delete** any directory under `.claude/` (outside `.claude/skills/`)
  unless the user explicitly asks in the current request.
- **`agents/`, `commands/`, `rules/`, `agent-memory/`, `output-styles/`, `docs/` are flat**, with the
  domain as a filename prefix; reference docs are named `<domain>-<name>-docs.md`.
- **Skills are the exemption.** A skill directory may be renamed, but the directory name *is* the
  `/command` name — rename it and sweep every reference in the same change (its own `name:`, every
  `.claude/skills/<old-name>/` link, and every prose mention the rule SoT enumerates — including
  `scripts/tools/ai/anthropic/claude/_ABSTRACT.md`, which sits outside `.claude/`).
  A rename without the sweep leaves dangling links.
- **Do not delete reserved placeholders** — `.gitkeep`, every `.claude/hooks/<event>/` slot,
  `.claude/workflows/`, reserved-but-empty rules, and a skill's `assets/` · `references/` · `scripts/`.
- **Agent notes are flat and platform-resolved** — `.claude/agent-memory/<agent-name>/MEMORY.md`,
  where the directory name equals the agent's `name:` with **no** domain level. Every agent declares
  `memory: project`, so the platform injects that `MEMORY.md` into the subagent's system prompt at
  startup. Adding a domain level breaks resolution silently. Read-only agents pair `memory: project`
  with `disallowedTools: Write, Edit` so the notes stay hand-maintained.

## Self-Review Checklist (Review Procedure summary)

Run the artifact through the review command's procedure before writing:

- **Frontmatter validity** — valid YAML fenced by `---`; required keys for the type present.
- **Naming and paths** — filename/directory match sibling files; a skill sits directly under
  `.claude/skills/<skill-name>/` and its `name:` equals the directory name.
- **Tool minimality** — `tools` / `allowed-tools` grant least privilege and name only tools that exist.
- **Convention alignment** — English, `@see` SoT reference style, sibling tone; no restated SoT criteria.
- **Factuality** — every referenced rule/path/agent/skill/command/tool actually exists.
- **Role boundaries** — upstream/downstream parties, orchestrator, and output paths stated and correct.

Only `[MUST]`-level issues block a write; `[SHOULD]` / `[CONSIDER]` are improvements.

---
name: utility-drawio-diagram-skill
description: "Authors, reviews, and applies draw.io diagrams (.drawio) under diagram/** as a two-person team (author/reviewer). Always use it for natural-language requests like 'draw a diagram', 'create a drawio', 'add an architecture diagram', '다이어그램 그려줘', 'drawio 만들어줘', '.drawio 수정해줘', or '아키텍처 다이어그램 추가'. Do not use it when only a quality review of an existing file is needed — that is the /utility-drawio-diagram-review command."
allowed-tools:
  - Agent
  - Read
  - Write
  - Glob
  - Bash(git status:*)
  - Bash(mkdir:*)
  - mcp__drawio-tool__list_pages
  - mcp__drawio-tool__get_page
  - mcp__drawio-tool__set_page
---

# Drawio Diagram Skill

Invokes a two-person team (`utility-drawio-diagram-author` → `utility-drawio-diagram-reviewer`) in
sequence to author and review `.drawio` XML, then applies it to the target file on a PASS verdict.

- Scope: `.drawio` files under `diagram/**`
- Intermediate output location: `./.claude/tmp/utility/` (gitignored)

@see .claude/rules/utility-drawio-diagram-rule.md — storage format, structural integrity, canvas, palette, editing procedure (SoT)
@see .claude/output-styles/utility-drawio-diagram-style.md — XML skeleton, style strings, anti-patterns (SoT)
@see .claude/docs/utility-drawio-diagram-docs.md — measured statistics, shape catalog, MCP tools, sequence recipe
@see .claude/commands/utility-drawio-diagram-review.md — standalone review of an existing file (the path that does not use this loop)
@see diagram/CLAUDE.md — diagram purpose, accepted formats, `base/` scope (SoT; defines no multi-category taxonomy)

---

## Workflow

1. **Precondition check**
   - Fix the target **file path** and **page**, along with the intent (create new / replace an
     existing page).
   - For an existing file, confirm the page list with `mcp__drawio-tool__list_pages` and identify the
     target page.
   - If the target is unclear, **ask once and stop** — do not guess and overwrite the wrong page.
   - For a new file, check the placement path against `diagram/CLAUDE.md`. It currently defines only
     `base/`, so anything outside that is a **new category** — confirm the path with the user and add
     the category to `diagram/CLAUDE.md` in the same change rather than inventing a directory.

2. **Invoke the author**
   - Invoke the `utility-drawio-diagram-author` agent to produce **two** files:
     `./.claude/tmp/utility/drawio/diagram-draft.xml` (pure XML, applied verbatim) and
     `./.claude/tmp/utility/drawio/diagram-draft.meta.txt` (target, page, apply method, baseline).
   - State the target path, page, and application method (`set_page` | `Write`) fixed in step 1
     explicitly in the prompt.

3. **Invoke the reviewer**
   - Invoke the `utility-drawio-diagram-reviewer` agent to produce
     `./.claude/tmp/utility/drawio/diagram-review.md`.

4. **Branch on the verdict** — the verdict token stands alone on line 1 of the review file.
   - **PASS:** read `target`, `page`, and `apply` from
     `./.claude/tmp/utility/drawio/diagram-draft.meta.txt`, then apply the **contents of
     `diagram-draft.xml` unmodified** — it is already byte-identical to what should land.
     - `apply: set_page` → `mcp__drawio-tool__set_page(target, page, <draft contents>)`
     - `apply: Write` → `Write` the draft contents to `target`
     - After applying, read it back with `mcp__drawio-tool__get_page` to confirm the root cells and
       cell count, and report the result.
   - **REDO:** include the correction instructions from
     `./.claude/tmp/utility/drawio/diagram-review.md` in the author's re-invocation prompt and repeat
     from step 2. **At most 2 retries.**
   - **STALLED:** the reviewer is reporting a `[MUST]` it already raised in the previous round, so the
     loop is not converging. **Stop immediately — do not spend the remaining retry and do not apply
     anything.** Surface the repeated finding and the last draft to the user.

5. **Retry-limit handling**
   - If the verdict is still REDO after 2 retries, **do not apply anything to the target file.**
   - Present the last draft to the user and stop with the warning "auto-approval limit reached —
     manual review recommended".

---

## Cautions When Applying

- **`set_page` replaces the target page wholesale.** Even for a partial edit, every cell on that page
  must be present in the draft; any omitted cell is deleted. The reviewer's Gate 2 diffs the draft's
  cell ids against a baseline it derives itself, but confirming the cell count against `get_page`
  before applying costs one call and catches the one failure in this pipeline that is unrecoverable.
- **Never hand-edit `diagram-draft.xml` before applying.** It is what the gate was run against; an
  edit after review means applying something no verifier ever saw. Send it back through the loop
  instead.
- **Use a whole-file `Write` only for new files** — overwriting an existing multi-page file produces
  a diff on pages that were never modified.
- Applying must be reversible — check with `git status` beforehand whether the target file already
  has uncommitted changes, and if so tell the user before proceeding.

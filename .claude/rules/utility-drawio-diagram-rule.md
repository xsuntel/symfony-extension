---
paths:
  - "diagram/**/*.drawio"
  - "diagram/**/*.drawio.xml"
---

# draw.io Diagram Rules (`diagram/**`)

This rule is the judgment criteria (SoT) for `.drawio` files under `diagram/**`. It enforces the
official draw.io generation contract together with the measured conventions of this repository's
114 pages, so that hand-edited and tool-generated diagrams do not collide inside the same file.

**Division of responsibility (no restatement):** the single source for **authoring style** — mxCell
skeleton, style-string syntax, palette table — is the output style. `diagram/CLAUDE.md` owns the
**purpose of the tree, the accepted file formats, and the scope of `base/`**. This rule restates
neither; it enforces only **XML structural integrity, canvas specs, the editing procedure, and
quality gates**.

`diagram/CLAUDE.md` does **not** currently define a multi-category directory taxonomy or a file
naming scheme — it documents `base/` as the only category, still being populated. Do not treat the
directory names appearing in the reference doc's examples as an established taxonomy; when a new
category is needed, add it to `diagram/CLAUDE.md` first.

@see diagram/CLAUDE.md — diagram purpose, accepted formats (`.drawio` / `.drawio.xml`), `base/` scope, when to update (SoT)
@see .claude/output-styles/utility-drawio-diagram-style.md — XML authoring style, style strings, palette table (SoT)
@see .claude/docs/utility-drawio-diagram-docs.md — measured statistics, shape catalog, MCP tools, sequence recipe
@see .claude/commands/utility-drawio-diagram-review.md — standalone review procedure and output format for existing `.drawio` files
@see .claude/agents/utility-drawio-diagram-author.md — the authoring role
@see .claude/agents/utility-drawio-diagram-reviewer.md — the structural-verification role
@see .claude/skills/utility-drawio-diagram-skill/SKILL.md — the authoring / review / apply orchestration entry point
@see <https://www.drawio.com/docs/reference/diagram-generation/> — official programmatic generation contract
@see <https://www.drawio.com/docs/reference/diagram-generation/style-reference/> — official style-string reference

## Storage Format (non-negotiable)

- **Store uncompressed XML only.** The `compressed="true"` attribute, and a `<diagram>` body holding
  a deflate+Base64 string, are both prohibited. All 114 pages in the repository are already
  uncompressed, and that state is the precondition for diffing, reviewing, and `grep`-ability.
- **No XML comments (`<!-- -->`)** — this is an explicit DON'T in the official generation contract.
  When an explanation is needed, move it into a cell's `value` or into `<UserObject>` / `<object>`
  metadata attributes.
- Indent new files with **4 spaces**. When editing an existing file, **preserve that file's existing
  indentation** — the repository mixes 2 spaces (`base/`) and 4 spaces (`deploy/prod/office/`), so
  re-indenting a whole file "for consistency" spreads a meaningless diff across every line.

## Structural Integrity (non-negotiable)

- **Two root cells are required** — `<mxCell id="0"/>` and `<mxCell id="1" parent="0"/>`. Every other
  cell must carry `parent="1"` or the id of a group / layer cell that actually exists.
- **Ids must be unique within one diagram (page).** Duplicate ids are most common when a page is
  cloned to create a new one.
- `vertex="1"` and `edge="1"` are **mutually exclusive**. Never put both on one cell.
- Every cell carries an `<mxGeometry ... as="geometry"/>` child. A missing `as="geometry"` makes the
  coordinates be ignored.
- **Referential integrity** — an edge's `source` and `target` must be cell ids that exist on the same
  page. Leave `source` / `target` empty on an unconnected edge and give it coordinates via
  `<mxPoint ... as="sourcePoint"/>` and `as="targetPoint"`.
- **XML-escape** HTML placed in a `value` (`&lt;`, `&gt;`, `&amp;`). An unescaped `<span>` breaks
  parsing.
- Child cells of a group or container use **coordinates relative to the parent**, with the origin at
  the top-left `(0,0)`.
- Match the shape to its perimeter — ellipse-family shapes take `perimeter=ellipsePerimeter`. A
  mismatch attaches edge endpoints outside the shape.

## Canvas Specs

- `gridSize="10"`, fixed — 114 of 114 pages use this value without exception.
- `pageWidth` is one of **1600** (default), **1920** (`deploy/prod/office/` infrastructure layer), or
  **1200**; `pageHeight` is **1200** (except the portrait 1200×1920 form). Do not invent new values.
- Place coordinates on the grid, as **multiples of 10**.

## Pages

- **No default page names** — do not leave `페이지-1`, `Page-1`, or `Page 1` in place. Give a name
  that reflects the page's content (existing convention: `Base`, `Client`, `Controller`, `Service`,
  `Authorization Code`). Twelve instances remain in existing files; apply this clause **only to new
  or modified pages**.
- Each `<diagram>` carries a unique `id` attribute.

## Colors (fixed palette)

- Use only the five pairs below, and always specify `fillColor` and `strokeColor` **as a pair**. The
  output style is the SoT for the detailed semantic mapping.

  | fillColor | strokeColor |
  | --- | --- |
  | `#dae8fc` | `#6c8ebf` |
  | `#d5e8d4` | `#82b366` |
  | `#e1d5e7` | `#9673a6` |
  | `#f8cecc` | `#b85450` |
  | `#fff2cc` | `#d6b656` |

- Do not introduce arbitrary colors outside that list. **The sole exception is a shape library that
  requires its own brand colors** — `#8C4FFF` and `#232F3D` in `mxgraph.aws4` stencils are part of
  the stencil definition and are not violations.
- Background groups and inactive elements use `fillColor=none`, or `#f5f5f5` / `#666666`.

## Editing Procedure (multi-page files)

- Handle multi-page files in the order **`list_pages` → `get_page` → `set_page`**. The repository has
  files with up to 9 pages, so a whole-file `Read` burns context needlessly and risks rewriting
  unrelated pages.
- **Never rewrite a whole file** — do not overwrite a file with `Write` for a change that touches one
  page. `set_page` replaces only the target page and preserves the others byte-for-byte.
- The `content` passed to `set_page` must be a **single `<mxGraphModel>` element** with no `<diagram>`
  tag.
- Only when creating a new file do you `Write` a complete document including the `<mxfile>` wrapper.

## Quality Gates (required before merge)

```bash
# well-formed XML check (python3 is present on every platform this repository targets)
python3 -c "import xml.etree.ElementTree as E,sys; E.parse(sys.argv[1])" "diagram/path/to/file.drawio"
```

- Well-formed passes · both root cells present · no duplicate ids within a page ·
  `source` / `target` referential integrity · not stored compressed · no XML comments — these six are
  the `[MUST]` gate.
- Review findings carry `[MUST]` / `[SHOULD]` / `[CONSIDER]` severity, and only `[MUST]` blocks a
  merge. Palette deviation, default page names, and off-grid coordinates are `[SHOULD]`.
- Use the `utility-drawio-diagram-skill` skill (author→reviewer loop, at most 2 retries) for new
  files and modifications.
- Use the `/utility-drawio-diagram-review <file-path>` command for a standalone quality review of an
  existing file.

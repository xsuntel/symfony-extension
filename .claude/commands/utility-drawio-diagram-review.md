---
description: "Assesses the structural integrity and project-convention compliance of a draw.io diagram (.drawio) file and provides structured improvement recommendations."
argument-hint: "[path to the .drawio file to analyze]"
---

Analyze the following draw.io diagram file:

**`$1`**

> **If the argument is empty**, ask once for the target file path and stop.
> Do not bulk-scan `diagram/**` or guess at the target — with 57 files and 114 pages, a full scan
> burns context while still missing the file the user meant.

The single source of judgment criteria is **`utility-drawio-diagram-rule` for structure, storage
format, canvas, and palette; the output style for XML authoring style and anti-patterns**. Read the
references below at the start, compare each clause against the target file, mark violations with an
**exact line number (or cell id)**, and propose a concrete fix as an XML fragment.

**For multi-page files, call `mcp__drawio-tool__list_pages` first** to establish the page list, then
review page by page with `get_page`. Do not `Read` the whole file.

> **Note:** this repository has **known drift** — 2-space indentation in existing files (`base/`),
> outdated `version` attributes, and 12 remaining default page names. These are pre-existing states
> recorded in section 1 of the docs; do not escalate them to `[MUST]` for parts of the target file
> that this change did not touch. Brand colors from `mxgraph.aws4` stencils (`#8C4FFF`, `#232F3D`)
> are likewise not palette deviations.

@see .claude/rules/utility-drawio-diagram-rule.md — judgment criteria (SoT: storage format, structural integrity, canvas, palette, editing procedure)
@see .claude/output-styles/utility-drawio-diagram-style.md — judgment criteria (SoT: XML skeleton, style strings, anti-pattern table)
@see .claude/docs/utility-drawio-diagram-docs.md — measured statistics, shape catalog, MCP tools, known drift
@see diagram/CLAUDE.md — diagram purpose, accepted formats, `base/` scope (SoT; defines no multi-category taxonomy)
@see <https://www.drawio.com/docs/reference/diagram-generation/> — official programmatic generation contract
@see <https://www.drawio.com/docs/reference/diagram-generation/style-reference/> — official style-string reference

> This command is **for reviewing existing files only**. New files and modifications go through the
> `utility-drawio-diagram-skill` skill, which runs a
> `utility-drawio-diagram-author` → `utility-drawio-diagram-reviewer` loop; the author agent owns the
> generation contract.

## Review Procedure

Check the following items in order.

- **well-formed** — does XML parsing succeed?
  `python3 -c "import xml.etree.ElementTree as E,sys; E.parse(sys.argv[1])" "$1"`
- **Storage format** — is `compressed="true"`, a Base64 `<diagram>` body, or an XML comment
  (`<!-- -->`) absent?
- **Root cells** — does every page have `<mxCell id="0"/>` and `<mxCell id="1" parent="0"/>`?
- **Valid parents** — is every cell's `parent` either `1` or the id of a group / layer that exists?
- **Id uniqueness** — are there no duplicate ids within a page?
- **Referential integrity** — do edge `source` / `target` values point at ids that exist on the same
  page? Do unconnected edges carry `mxPoint` endpoints?
- **vertex/edge exclusivity · geometry** — does no cell carry both, and does every cell have
  `<mxGeometry ... as="geometry"/>`?
- **Escaping** — is HTML inside `value` escaped as `&lt;`, `&gt;`, `&amp;`?
- **Canvas specs** — is `gridSize="10"`, `pageWidth` 1600/1920/1200, `pageHeight` 1200/1920? Are
  coordinates aligned to multiples of 10?
- **Palette** — are only the five pairs used, with `fillColor` and `strokeColor` paired (`aws4`
  stencil brand colors exempt)?
- **Pages** — is each `<diagram>` `id` unique, and is the page name something other than a default
  such as `페이지-1`?
- **Shape consistency** — does each shape match its perimeter (ellipse family →
  `perimeter=ellipsePerimeter`)? Does it reference only stencil names that exist?
- **Layout conventions** — are shape sizes, spacing, and color assignment consistent with comparable
  files in the same directory?

## Output Format

### Summary

| Category | Status (OK / WARN / FAIL) | Issues |
| --- | --- | --- |
| XML well-formed | | |
| Storage format (uncompressed, comments) | | |
| Root cells and parents | | |
| Id uniqueness | | |
| Edge referential integrity | | |
| geometry and escaping | | |
| Canvas specs | | |
| Palette consistency | | |
| Page naming | | |
| Shape consistency | | |

### Critical Issues (must fix)

For each issue: **[line N · cell `id`]** `[MUST]` description → recommended fix including an XML
fragment.

Assign `[MUST]` only to defects that stop the file opening or make elements disappear silently —
well-formed failure, missing root cells, duplicate ids, a broken `source` / `target`, compressed
storage, XML comments, missing escaping.

### Improvement Suggestions (fix recommended)

For each suggestion: **[line N · cell `id`]** `[SHOULD]` description → recommended approach.

Palette deviation, default page names, off-grid coordinates, and canvas-spec deviation are
`[SHOULD]`.

### Refactoring Suggestions

Mark structural changes (splitting or merging pages, regrouping, swapping shape libraries) as
`[CONSIDER]` and describe them with before/after XML examples. Only `[MUST]` blocks a merge.

# draw.io Diagrams — Detailed Reference

This document is **background, statistics, and reference material**, not judgment criteria. Where it
conflicts with the rule (SoT), the rule wins, and no new criteria are written here. It has no `paths`
frontmatter, so it is not applied automatically and loads only via `@see`.

@see .claude/rules/utility-drawio-diagram-rule.md — judgment criteria (SoT)
@see .claude/output-styles/utility-drawio-diagram-style.md — XML authoring style, palette, anti-patterns (SoT)
@see diagram/CLAUDE.md — diagram purpose, accepted formats, `base/` scope (SoT; defines no multi-category taxonomy)

---

## 1. Measured Statistics for `diagram/**`

A full count of **57 `.drawio` files / 114 pages**, as of 2026-08-19. New diagrams follow this
distribution; do not invent values absent from it.

| Item | Measured |
| --- | --- |
| Compressed storage | **0** — all uncompressed XML |
| `gridSize` | `10` — 114/114, no exceptions |
| `pageWidth` | `1600` (67) · `1920` (34) · `1200` (13) |
| `pageHeight` | `1200` (101) · `1920` (13) |
| `edgeStyle` | `orthogonalEdgeStyle` (711) · `none` (85) |
| Most pages in one file | 9 (`base/app/symfony/4 - Advanced Topics/4) messaging.drawio`) |
| `mxfile host` | `drawio-plugin` (32) · `Electron` (14) · `65bd71144e` (11) |

### Palette, measured

The repository's measured colors match the official draw.io standard palette **exactly** — this is
not a new rule but an already-observed convention made explicit.

| fill | Count | stroke | Count |
| --- | --- | --- | --- |
| `#dae8fc` | 256 | `#6c8ebf` | 257 |
| `#d5e8d4` | 153 | `#82b366` | 150 |
| `#e1d5e7` | 99 | `#9673a6` | 99 |
| `#f8cecc` | 53 | `#b85450` | 53 |
| `#fff2cc` | 15 | `#d6b656` | 15 |

`#8C4FFF` (54), `#232F3D` (25), `#A153A0` (13) and similar are brand colors from `mxgraph.aws4`
stencils. They are part of the stencil definition and are not palette deviations.

### Known Drift (existing files)

Deviations that remain in existing files. Apply the rules **only to new or modified targets**; do not
bulk-edit unrelated files on account of these entries.

- **12 default page names `페이지-1`** — the draw.io default name was left in place.
- **Mixed indentation** — `base/` uses 2 spaces, `deploy/prod/office/` uses 4.
- **Mixed `version`** — `22.1.22` (32) · `24.1.0` (7) · `24.7.17` (4) · `26.0.16` (3). The editor
  writes this value, so do not adjust it by hand.

---

## 2. Shape Library Catalog

Occurrences by library: `mxgraph.aws4` (228) · `mxgraph.flowchart` (152) · `basic` (37) ·
`cisco_safe` (13) · `office` (8) · `ibm` (1).

### `mxgraph.aws4` — cloud and infrastructure (`deploy/prod/office/`)

| Stencil | Count | Use |
| --- | --- | --- |
| `group` | 134 | General-purpose boundary group (kind set via `grIcon`) |
| `group_subnet` | 48 | Subnet boundary |
| `group_availability_zone` | 36 | Availability zone |
| `resourceIcon` | 23 | Resource icon tile |
| `group_region` | 22 | Region boundary |
| `group_aws_cloud` | 15 | Outermost cloud boundary |
| `group_vpc` | 13 | VPC boundary |

The representative boundary-group style — change only `grIcon` to switch the kind:

```text
sketch=0;outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#333333;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#333333;strokeWidth=2;dashed=1;
```

### `mxgraph.flowchart` — processing flow (`base/`, `deploy/dev/`)

| Stencil | Count | Use |
| --- | --- | --- |
| `terminator` | 71 | Start, end, external actor |
| `start_2` | 32 | Starting point |
| `database` | 22 | Storage |
| `direct_data` | 17 | Direct-access data |
| `document2` | 7 | Document, report |
| `decision` | 1 | Branch |

```text
strokeWidth=2;html=1;shape=mxgraph.flowchart.terminator;whiteSpace=wrap;
```

> This repository reuses the `aws4` group stencils when drawing GCP infrastructure as well (see the
> `Google Cloud Platform - Project` group in `deploy/prod/office/0 - base.drawio`). That is an
> intentional convention — the boundary-group representation is vendor-neutral — so do not flag it as
> "the wrong library".

---

## 3. MCP Tools (`mcp__drawio-tool__`)

Seven tools are actually exposed in this environment. The MCP server itself comes from local /
user-level configuration that is **not checked into this repository** — `.claude/settings.json`
contains no drawio entry, and there is no `.claude/settings.local.json` here. Of the servers that may
be registered locally, `drawio-tool` is the one that exposes these tools.

| Tool | Use | Notes |
| --- | --- | --- |
| `list_pages` | List pages (index, id, name, size) without their bodies | **Always call first on a multi-page file** |
| `get_page` | Read one page's `mxGraphModel` XML (auto-decompresses if compressed) | `page` accepts a 0-based index, a name, or an id |
| `set_page` | Replace one page, preserving all others | `content` is a single `<mxGraphModel>` with no `<diagram>` |
| `open_drawio_xml` | Open the editor with XML | `routing="libavoid"` can re-route connectors only |
| `open_drawio_csv` | Generate from CSV import format | Org charts, trees, and other tabular data |
| `open_drawio_mermaid` | Generate from Mermaid syntax | 28 diagram types; the header keyword determines the type |
| `search_shapes` | Search stencils — returns exact style strings and sizes | Only when you need a brand or industry icon; not for built-in shapes |

### Editing procedure

```text
list_pages(path)                 → confirm the target page's index/name
  └─ get_page(path, page)        → load only that page's mxGraphModel into context
       └─ set_page(path, page, content)   → replace only that page
```

A whole-file `Read` pulls unrelated pages into context on a 9-page file, and overwriting with `Write`
produces a diff on pages you never touched. Use `Write` only when creating a new file.

### `routing="libavoid"`

An optional argument to `open_drawio_xml`. It leaves vertex coordinates untouched and recalculates
**only the connectors** into orthogonal paths that avoid obstacles. The default draw.io router does
not avoid obstacles, so use this when edges cut through shapes in hand-placed infrastructure and
deployment diagrams. Omit it for sparse layouts where edges cannot overlap.

---

## 4. Sequence Diagram Recipe

Source: `diagram/deploy/dev/app/abstract/connect/kakao/login.drawio` (page `Authorization Code`).

There are only two constituent parts.

1. **Actor header** — a `160×40` rectangle aligned at `y=120`, with one palette pair assigned per
   actor.
2. **Lifeline** — an edge whose `source` is the header, descending to a `targetPoint` below.
   `endArrow=none;endFill=0` removes the arrowhead.

```xml
<mxCell id="8" value="User" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" parent="1" vertex="1">
    <mxGeometry x="120" y="120" width="160" height="40" as="geometry" />
</mxCell>
<mxCell id="7" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;endArrow=none;endFill=0;fillColor=#d5e8d4;strokeColor=#82b366;" parent="1" source="8" edge="1">
    <mxGeometry relative="1" as="geometry">
        <mxPoint x="200" y="1120" as="targetPoint" />
    </mxGeometry>
</mxCell>
```

Draw an auxiliary divider with no `source` — just two `mxPoint`s — plus `dashed=1` and a neutral
color:

```xml
<mxCell id="2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=1;endArrow=none;endFill=0;dashed=1;fillColor=#f5f5f5;strokeColor=#666666;" parent="1" edge="1">
    <mxGeometry relative="1" as="geometry">
        <mxPoint x="799.5" y="160" as="sourcePoint" />
        <mxPoint x="799.5" y="1120" as="targetPoint" />
    </mxGeometry>
</mxCell>
```

Lay actors out horizontally starting at `x=120`, and align lifeline endpoints to the bottom of the
page (`y=1120` for a `pageHeight` of 1200).

---

## 5. Compression, Variables, Metadata

### Compression

A `.drawio` file may store its `<diagram>` body as deflate+Base64, and draw.io Desktop sometimes does
so by default. This repository **enforces uncompressed** storage (currently 0 compressed files). The
official documentation likewise recommends uncompressed output when generating — compressed bodies
cost more tokens, are unreadable by humans, and cannot be verified without decoding.

When compression is unavoidable, the conversion order is `encodeURIComponent` → raw DEFLATE (no zlib
header) → Base64.

### File variables

Put JSON in the `vars` attribute of `<mxfile>` and reference it from labels as `%name%`. Cells need
`placeholders="1"`. This works only in the full `<mxfile>` form.

```xml
<mxfile vars='{"project":"products-app","env":"prod"}'>
    <UserObject id="2" label="%project% — %env%" placeholders="1">
        <mxCell style="text;html=1;" vertex="1" parent="1">
            <mxGeometry x="100" y="100" width="200" height="40" as="geometry" />
        </mxCell>
    </UserObject>
</mxfile>
```

### Metadata

To attach structured attributes to a cell, wrap the `<mxCell>` in `<UserObject>` or `<object>`.
Because `.drawio` cannot carry XML comments, this is **the only way to record an explanation, a
source, or a ticket link**.

---

## 6. Verification

### Well-formed

```bash
python3 -c "import xml.etree.ElementTree as E,sys; E.parse(sys.argv[1])" "diagram/base/cache/redis.drawio"
```

### Structural check (per-page duplicate ids, root cells, referential integrity)

```bash
python3 .claude/skills/utility-drawio-diagram-skill/scripts/gate.py <file-or-draft.xml>
```

Accepts either a bare `<mxGraphModel>` (a `get_page` body) or a full `<mxfile>` document. Prints
`[MUST]` / `[SHOULD]` findings and exits nonzero iff any `[MUST]`. It covers the six rule gates plus
vertex/edge exclusivity, `as="geometry"`, parent existence, palette, grid alignment, and canvas
specs.

The script is the single copy shared by `utility-drawio-diagram-author` (self-check before handoff)
and `utility-drawio-diagram-reviewer` (Gate 1), so the two halves of the pair cannot drift apart.
Prefer it over eyeballing a `get_page` body or counting ids with `grep -o 'id="[^"]*"'`.

Dropped cells under `set_page` are **not** covered here — that needs a baseline from the live page,
and is the reviewer's Gate 2.

### Official schema

`mxfile.xsd` — <https://github.com/jgraph/drawio-mcp/blob/main/shared/mxfile.xsd>. It validates the
element hierarchy and attribute types. Style strings are outside this schema's scope; the official
Style Reference covers those.

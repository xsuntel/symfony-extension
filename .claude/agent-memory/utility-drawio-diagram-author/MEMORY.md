# utility-drawio-diagram-author memory

Standing context for drafting `.drawio` files under `diagram/**`, so it need not be looked up on
every run. The SoT for judgment criteria is `.claude/rules/utility-drawio-diagram-rule.md`; on
conflict, the rule wins.

## Output Paths

- Draft: `./.claude/tmp/utility/drawio/diagram-draft.xml` (write only here — never modify
  `diagram/**` directly)
- First-line header: `target: <path> | page: <page-name> | apply: set_page|Write`

## Canvas Specs (fixed)

- `gridSize="10"`, no exceptions. Coordinates are multiples of 10.
- `pageWidth`: `1600` (default) · `1920` (`deploy/prod/office/` infrastructure) · `1200`
- `pageHeight`: `1200` (only portrait layouts use `1920`)

## Root Cell Skeleton

```xml
<mxGraphModel dx="1531" dy="1120" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
    <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
    </root>
</mxGraphModel>
```

`set_page` takes the above — a single `<mxGraphModel>` with no `<diagram>`. A new-file `Write`
includes the `<mxfile>` wrapper.

## Palette (these five pairs only · fill and stroke always paired)

`#dae8fc`/`#6c8ebf` · `#d5e8d4`/`#82b366` · `#e1d5e7`/`#9673a6` · `#f8cecc`/`#b85450` ·
`#fff2cc`/`#d6b656`. Neutral: `fillColor=none`, or `#f5f5f5` / `#666666`.

Which pair means what is in the output style's palette table — read it before assigning colors.
Brand colors in `mxgraph.aws4` stencils (`#8C4FFF`, `#232F3D`) are stencil definitions — leave them.

## Choosing Shapes

- Cloud / infrastructure (`deploy/prod/office/`) → `mxgraph.aws4` (`group` + `grIcon`,
  `group_subnet`, `group_availability_zone`, `group_region`, `group_vpc`). Reusing this stencil for
  GCP is the established convention.
- Flow (`base/`, `deploy/dev/`) → `mxgraph.flowchart` (`terminator`, `start_2`, `database`,
  `direct_data`)
- Sequence → built-in shapes `rounded=0;whiteSpace=wrap;html=1;` plus lifeline edges
- When unsure, look it up with `search_shapes` — a misspelled stencil name silently becomes an empty
  shape.

## Default Edge Form

```text
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;
```

Measured across the repository: `orthogonalEdgeStyle` 711 / `none` 85. `mxGeometry relative="1"` is
required. Unconnected endpoints use `<mxPoint ... as="sourcePoint"/>` / `as="targetPoint"`.

## Easy to Miss

- **No XML comments** — put explanations in `value` or in `<UserObject>` metadata.
- A missing **`as="geometry"`** makes coordinates be ignored.
- Escape HTML in `value` as `&lt;`, `&gt;`, `&amp;`.
- `set_page` swaps the page wholesale — **every existing cell must be in the draft** (an omission is
  a deletion).
- Do not leave the default page name `페이지-1`.
- When editing an existing file, **preserve that file's indentation** (`base/` uses 2 spaces,
  `deploy/prod/office/` uses 4).

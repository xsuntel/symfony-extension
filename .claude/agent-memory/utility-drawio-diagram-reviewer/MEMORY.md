# utility-drawio-diagram-reviewer memory

Standing context for judging `./.claude/tmp/utility/drawio/diagram-draft.xml`. The SoT for judgment
criteria is `.claude/rules/utility-drawio-diagram-rule.md`; on conflict, the rule wins.

## Output Paths

- Input: `./.claude/tmp/utility/drawio/diagram-draft.xml` — **pure XML, no header line.** Metadata
  (`target`, `page`, `apply`, `baseline_cells`, `baseline_ids`, `intentional_deletions`) lives in the
  sibling `diagram-draft.meta.txt`.
- Output: `./.claude/tmp/utility/drawio/diagram-review.md` — verdict token alone on line 1, then
  `## Gate` / `## Judgment` / `## Correction instructions`.

## The Gate Decides Structure — Do Not Re-Check It By Hand

`.claude/skills/utility-drawio-diagram-skill/scripts/gate.py` mechanically decides every structural
and storage-format criterion: well-formedness, both root cells, duplicate ids, parent existence,
`source`/`target` referential integrity, vertex/edge exclusivity, `as="geometry"`, XML comments, and
`compressed="true"`. Run it and report its output; the exit code settles those items.

Two things it cannot see, which remain yours:

- **Apply-method match** — `apply: set_page` needs a single `<mxGraphModel>` with no `<diagram>`;
  `apply: Write` needs the `<mxfile>` wrapper. Mismatch is `[MUST]`.
- **Dropped cells under `set_page`** — needs a baseline from the live page (Gate 2). A cell present
  on the page and absent from the draft is silent, unrecoverable data loss, so REDO whenever unsure.

If the gate does not execute, the verdict is REDO naming that failure — never PASS on an unrun gate.

## SHOULD Level (not REDO on its own — note it in the verdict)

Palette deviation · default page name · off-grid coordinates · canvas-spec deviation.
If convention violations pervade the whole draft, however, group them and escalate to REDO.

## Palette (the five allowed pairs)

`#dae8fc`/`#6c8ebf` · `#d5e8d4`/`#82b366` · `#e1d5e7`/`#9673a6` · `#f8cecc`/`#b85450` ·
`#fff2cc`/`#d6b656`. Neutrals are `none` / `#f5f5f5` / `#666666`.

Judge only whether a pair is on this list and whether fill and stroke are paired. Whether the chosen
pair fits the element's meaning is the output style's mapping, not a REDO criterion.

## Not Violations (do not false-positive)

- **`mxgraph.aws4` stencil brand colors** — `#8C4FFF` (54), `#232F3D` (25), `#A153A0` (13) are part
  of the stencil definition.
- **Drawing GCP with `aws4` group stencils** — an intentional convention since
  `deploy/prod/office/0 - base.drawio`.
- **Known drift in existing files** — not reviewable if the draft did not touch it:
  - Mixed indentation: 2 spaces (`base/`) vs 4 spaces (`deploy/prod/office/`)
  - Outdated `version` attributes (`22.1.22`, `24.1.0`, `24.7.17`, `26.0.16`) — the editor writes this
    value
  - The 12 pre-existing default page names `페이지-1` — the clause applies only to new or modified
    pages
- **`edgeStyle=none`** — 85 measured occurrences; a normal usage.

## Verdict Principles

- Layout aesthetics and whether to add shapes are not under review. Use only the objective checklist
  criteria.
- When unsure, REDO over PASS — a miss costs more than a false positive.
- Every invocation is an independent single-pass verdict. Retry management and applying the result
  belong to `utility-drawio-diagram-skill`.

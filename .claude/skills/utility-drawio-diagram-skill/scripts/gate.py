#!/usr/bin/env python3
"""Mechanical structural gate for a .drawio draft.

Usage:  python3 gate.py <draft.xml>

Accepts either a bare <mxGraphModel> (apply: set_page) or a full <mxfile>
document (apply: Write). Prints [MUST] / [SHOULD] findings; exits nonzero iff
at least one [MUST]. Run by utility-drawio-diagram-author as a self-check and
by utility-drawio-diagram-reviewer as the authoritative Gate 1 -- one copy so
the two halves cannot drift apart.

The apply-method match (set_page vs Write) is NOT checked here: it depends on
diagram-draft.meta.txt, which the reviewer compares by eye.
"""
import re
import sys
import xml.etree.ElementTree as E

PALETTE = {"#dae8fc", "#6c8ebf", "#d5e8d4", "#82b366", "#e1d5e7", "#9673a6",
           "#f8cecc", "#b85450", "#fff2cc", "#d6b656", "none", "#f5f5f5", "#666666"}

# mxgraph.aws4 stencil brand colors -- part of the stencil definition, not a deviation.
STENCIL_BRAND = re.compile(r"#(8C4FFF|232F3D|A153A0)$", re.I)


def main(path):
    must, should = [], []
    raw = open(path, encoding="utf-8").read()

    if "<!--" in raw:
        must.append("XML comment present")
    if 'compressed="true"' in raw:
        must.append('compressed="true" present')
    try:
        root = E.fromstring(raw)
    except E.ParseError as e:
        print(f"[MUST]   not well-formed: {e}")
        return 1

    pages = ([(d.get("name"), d.find("mxGraphModel")) for d in root.iter("diagram")]
             if root.tag == "mxfile" else [(None, root)])
    if not pages:
        must.append("no page found")

    for name, gm in pages:
        tag = f"page '{name}'" if name else "page"
        if gm is None:
            must.append(f"{tag}: <diagram> has no <mxGraphModel> child (Base64 body?)")
            continue
        if name is not None and re.fullmatch(r"(페이지|Page)-\d+", name or ""):
            should.append(f"{tag}: default page name")
        r = gm.find("root")
        if r is None:
            must.append(f"{tag}: no <root>")
            continue
        cells = [c for c in list(r) if c.get("id") is not None]
        ids = [c.get("id") for c in cells]
        dupes = {i for i in ids if ids.count(i) > 1}
        if dupes:
            must.append(f"{tag}: duplicate ids {sorted(dupes)}")
        idset = set(ids)
        if "0" not in idset or "1" not in idset:
            must.append(f"{tag}: missing root cell(s) id=0 / id=1")
        else:
            one = next(c for c in cells if c.get("id") == "1")
            if one.get("parent") != "0":
                must.append(f"{tag}: cell id=1 must have parent='0'")

        for c in cells:
            cid = c.get("id")
            inner = c.find("mxCell")
            m = c if c.tag == "mxCell" or inner is None else inner
            if m.get("vertex") == "1" and m.get("edge") == "1":
                must.append(f"{tag}: cell {cid} has both vertex and edge")
            p = m.get("parent")
            if p is not None and p not in idset:
                must.append(f"{tag}: cell {cid} parent='{p}' does not exist")
            for ref in ("source", "target"):
                v = m.get(ref)
                if v is not None and v not in idset:
                    must.append(f"{tag}: edge {cid} {ref}='{v}' does not exist")
            for g in m.iter("mxGeometry"):
                if g.get("as") != "geometry":
                    must.append(f'{tag}: cell {cid} <mxGeometry> missing as="geometry"')
                for a in ("x", "y", "width", "height"):
                    val = g.get(a)
                    if val and re.fullmatch(r"-?\d+(\.0+)?", val) and float(val) % 10:
                        should.append(f"{tag}: cell {cid} {a}={val} off-grid")
            for k, v in re.findall(r"(fillColor|strokeColor)=([^;]+)", m.get("style") or ""):
                if v.lower() not in PALETTE and not STENCIL_BRAND.match(v):
                    should.append(f"{tag}: cell {cid} {k}={v} off-palette")

        if gm.get("gridSize") != "10":
            should.append(f"{tag}: gridSize={gm.get('gridSize')} (expected 10)")
        if gm.get("pageWidth") not in ("1600", "1920", "1200"):
            should.append(f"{tag}: pageWidth={gm.get('pageWidth')}")
        if gm.get("pageHeight") not in ("1200", "1920"):
            should.append(f"{tag}: pageHeight={gm.get('pageHeight')}")

    for m in must:
        print(f"[MUST]   {m}")
    for s in dict.fromkeys(should):
        print(f"[SHOULD] {s}")
    if not must and not should:
        print("all checks passed")
    return 1 if must else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: gate.py <draft.xml>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

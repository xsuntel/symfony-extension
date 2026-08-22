#!/usr/bin/env python3
"""Mechanical format gate for a Conventional Commits draft.

Usage:  python3 gate.py <commit-message-draft.md>

Checks only what is decidable from the message text alone. Prints [MUST] /
[SHOULD] findings; exits nonzero iff at least one [MUST]. Run by
utility-git-commit-author as a self-check and by utility-git-commit-reviewer as
the authoritative Gate 1 -- one copy so the two halves cannot drift apart.

Factuality against `git diff --cached`, type appropriateness, and whether the
chosen scope suits the diff are NOT checked here: they need the diff, and are
the reviewer's judgment items.

Criteria SoT: .claude/rules/utility-git-commit-rule.md
"""
import re
import sys

TYPES = ("feat", "fix", "refactor", "perf", "style", "test", "docs", "build",
         "ci", "chore", "revert")
SCOPES = ("app", "diagram", "scripts", "rules", "skills", "agents", "commands", "docs")

SUBJECT_MAX = 72
BODY_MAX = 3

HEADER = re.compile(rf"^(?P<type>{'|'.join(TYPES)})(?:\((?P<scope>[^()]+)\))?: (?P<subject>.+)$")
# Conservative non-imperative heuristic; -ss / -us are ordinary word endings.
NON_IMPERATIVE = re.compile(r"(ed|ing)$|(?<![su])s$", re.I)


def main(path):
    must, should = [], []
    raw = open(path, encoding="utf-8").read()

    # git strips comment lines and trailing blanks before committing; mirror that.
    lines = [ln for ln in raw.split("\n") if not ln.startswith("#")]
    while lines and not lines[-1].strip():
        lines.pop()
    if not lines:
        print("[MUST]   draft is empty")
        return 1

    header = lines[0]
    m = HEADER.match(header)
    if not m:
        must.append(f"header does not match 'type(scope): subject' -- got {header!r}")
        must.append(f"allowed types: {', '.join(TYPES)}")
    else:
        scope, subject = m.group("scope"), m.group("subject")
        if scope is not None and scope not in SCOPES:
            must.append(f"scope '{scope}' not in {{{', '.join(SCOPES)}}}")
        if subject.endswith("."):
            must.append("subject ends with a period")
        first = subject.split()[0] if subject.split() else ""
        if first and NON_IMPERATIVE.search(first):
            should.append(f"subject may not be imperative -- leading word {first!r}")

    if len(header) > SUBJECT_MAX:
        must.append(f"subject line {len(header)} chars (limit {SUBJECT_MAX})")

    body = lines[1:]
    if body:
        if body[0].strip():
            must.append("line 2 must be blank to separate subject from body")
        content = [ln for ln in body if ln.strip()]
        if len(content) > BODY_MAX:
            must.append(f"body {len(content)} non-empty lines (limit {BODY_MAX})")

    for x in must:
        print(f"[MUST]   {x}")
    for x in dict.fromkeys(should):
        print(f"[SHOULD] {x}")
    if not must and not should:
        print("all checks passed")
    return 1 if must else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: gate.py <commit-message-draft.md>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

# Git Commit Message (Conventional Commits)

@see https://www.conventionalcommits.org/en/v1.0.0/ — Conventional Commits spec
@see ../docs/utility-git-commit-docs.md — author → reviewer pipeline reference
@see ../skills/utility-git-commit-skill/SKILL.md — the orchestrating skill

Commit messages in this repository follow **Conventional Commits** (consistent with the global
`~/.claude/CLAUDE.md` "코딩 규칙"). These are the format criteria the
[`utility-git-commit-skill`](../skills/utility-git-commit-skill/SKILL.md) author/reviewer pair
enforces.

## Format

- `type(scope): subject`, or `type: subject` when no single scope fits.
- **Allowed types:** `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ci`,
  `chore`, `revert`.
- **Scope** is the top-level area of the changed paths. Repository scopes: `app`, `diagram`,
  `scripts` (includes `scripts/tools/**`), plus the `.claude/` sub-areas `rules`, `skills`,
  `agents`, `commands`, `docs`. Spanning multiple areas → pick the most significant one or omit
  the scope.

## Subject & Body

- Subject: **72 characters or fewer**, imperative mood, no trailing period, English.
- Body: 3 lines or fewer, English, focused on **why** the change was made — not a restatement of the
  diff.
- The `type` must match the nature of the change (a feature labeled `chore` is wrong).

## Factuality

- Every claim in the subject and body must be verifiable from `git diff --cached`. Never describe a
  change that is not in the diff — no guessing.

## Severity

Findings carry `[MUST]` / `[SHOULD]` severity, and **only `[MUST]` blocks** — the same policy as
[`utility-drawio-diagram-rule.md`](utility-drawio-diagram-rule.md) §Quality Gates. This keeps a
debatable scope pick from consuming a retry that a real defect needs.

`[MUST]` — malformed `type(scope): subject` header · a `type` outside the allowed list · a `scope`
outside the repository set · subject over 72 characters · trailing period on the subject · missing
blank line between subject and body · body over 3 lines · any claim not traceable to
`git diff --cached`.

`[SHOULD]` — scope choice among defensible options when the diff spans areas · body wording · a body
that restates the diff instead of explaining why · non-imperative subject mood.

The mechanical `[MUST]` items above are decided by
[`../skills/utility-git-commit-skill/scripts/gate.py`](../skills/utility-git-commit-skill/scripts/gate.py),
which both the author (self-check) and the reviewer (Gate 1) run. Type appropriateness, scope
appropriateness, and factuality need the diff and stay human judgment.

The one escalation: if the message is so vague that no sentence is checkable against the diff, group
that into a single `[MUST]`.

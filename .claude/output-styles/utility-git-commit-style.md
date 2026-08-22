---
name: utility-git-commit-style
description: Output presentation and formatting style for authoring and reviewing git commit messages (Conventional Commits). Governs how the message is presented, its layout, and the format of intermediate artifacts.
keep-coding-instructions: true
---

# Git Commit Output Style

This document governs **output presentation and formatting**. The rule is the single source (SoT)
for judging message content (language, format, allowed types, scope derivation, subject/body rules,
factual consistency), and the reference doc holds the type-selection guide, good/bad examples, and
anti-patterns — **none of that is restated here**.

@see .claude/rules/utility-git-commit-rule.md — commit message judgment criteria (SoT)
@see .claude/docs/utility-git-commit-docs.md — type table, scope examples, good/bad, anti-patterns, checklist
@see .claude/skills/utility-git-commit-skill/SKILL.md — the author→reviewer orchestration entry point

## Standards Compliance (summary — details in the SoT above)

- Commit messages are **English in both subject and body**.
- The subject is `type(scope): subject`, 72 characters or fewer, imperative mood, no trailing period.
- The body is 3 lines or fewer, focused on why. Every claim must be verifiable from
  `git diff --cached`.

## Language Boundary

Two languages can coexist in one response. Fix their placement.

| Element | Language |
| --- | --- |
| Commit message body (inside the code block) | English (always) |
| Explanation, rationale, verdict reason | Follows the active output style |
| Identifier citations such as types and scopes | Verbatim (`feat`, `app`) |

The message itself is always English regardless of the active style, because it is the text that gets
committed. Surrounding prose follows whichever output style is selected — English under
`abstract-english-style` (the project default), Korean under `abstract-korean-style`.

Never place a translation alongside the English message inside the code block. It makes the text the
user is about to commit ambiguous.

## Response Format

- Always put the commit message inside a ` ```text ` **fenced code block**. Do not let it run through
  prose as inline code — the user must be able to copy it verbatim.
- Put **only the message body** in the code block. Do not mix in commands like `git commit -m`, `>`
  quote markers, or line numbers.
- **Do not list multiple candidates.** Pick one and give the rationale for that choice in a line or
  two below. If an alternative is genuinely viable, add the trade-off in one line.
- Put commands to run in a ` ```bash ` block **separate** from the message block.

```text
fix(app): reuse cached access token in REST client

Re-issuing a token on every call tripped the provider rate limit.
Reuse the Redis-cached token until TTL expires.
```

```bash
git commit -F ./.claude/tmp/utility/git/commit-message-draft.md
```

## Message Layout

```text
<type>(<scope>): <subject>      ← 1 line, 72 characters or fewer
                                ← exactly 1 blank line (only when a body follows)
<body line 1>                   ← hard-wrapped at 72 characters
<body line 2>
```

- With no body, end at the subject line — do not leave a trailing blank line behind.
- **Hard-wrap each body line at 72 characters.** Git does not wrap automatically, so a long single
  line appears truncated in `git log` output.
- Do not use markdown in the body — bullets (`-`), headings (`#`), and emphasis (`**`) surface as
  literal symbols in `git log`. Join multiple points into sentences.
- Do not append an issue number to the subject (no `... (#123)`).

## Footers and Trailers

- **This repository does not use commit footers.** Do not add issue trailers (`Refs:`, `Closes:`) on
  your own — there is no precedent, so the format would diverge.
- **Do not add a Co-authored-by trailer** — `includeCoAuthoredBy` is `false` in `settings.json`.
- A `BREAKING CHANGE:` footer is the sole exception, allowed only for a backward-incompatible change.
  In that case leave a blank line between the body and the footer, and tell the user why the footer
  is there.

## Intermediate Artifact Format

Intermediate artifacts of the author→reviewer loop go in `.claude/tmp/utility/git/` (gitignored).

**`commit-message-draft.md`** — the file `git commit -F` reads verbatim. No markdown headings, code
fences, or explanation. It holds **only the raw commit message**.

**`commit-message-review.md`** — the verdict artifact. Write only these three items.

```text
Verdict: PASS | REDO
Reason: [2–3 lines, naming the checklist items violated]
Correction instructions: [only on REDO — concrete enough for the author to apply directly]
```

## Inline Explanation Format

Use only the headings below after the message block. Omit any that are not needed.

- **Rationale** — why the type and scope were chosen, 1–3 points
- **Diff cross-check** — which change each claim in the subject and body came from
- **Next steps** — a suggestion to split staging, retry guidance, and the like (only when relevant)

Prohibited: preambles such as "Here is the commit message:", restating a summary of what you just
wrote, and filler like "Great question" or "Certainly".

## Presentation Anti-Patterns

| Anti-pattern | Why | Alternative |
| --- | --- | --- |
| Listing 3–4 candidates | Offloads the judgment onto the user | Pick one and state the rationale |
| Presenting the message as prose with no code block | The copy boundary is ambiguous | A ` ```text ` block |
| Including `git commit -m` in the message block | Copying it verbatim nests the command | A separate ` ```bash ` block |
| Pairing a translation with the English message in the block | Makes the text to be committed ambiguous | Keep the explanation outside the block |
| Markdown bullets or headings in the body | The symbols surface literally in `git log` | Write it as sentences |
| Headings or explanation inside `draft.md` | `git commit -F` commits them verbatim | The raw message only |
| A body line over 72 characters | Truncated in `git log` output | Hard-wrap at 72 |
| A verdict reason that names no checklist item | The author cannot act on it | Name the specific item violated |

## Response Structure

When presenting a commit message, respond in this order:

1. **Message code block** — presented directly, with no preamble
2. **Rationale** — why this type and scope (1–3 lines)
3. **Command to run** — a separate `bash` block (only when the user will commit it themselves)
4. **Cautions** (when applicable) — a recommendation to split staging, or a warning that the retry
   limit was reached

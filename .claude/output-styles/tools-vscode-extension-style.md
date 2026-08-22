---
name: tools-vscode-extension-style
description: Output presentation style for authoring and reviewing VSCode Extension API artifacts — provider scaffolds, manifest contributions, and API-conformance verdicts. Governs how the artifact and the verdict are presented, not how the TypeScript itself is written.
keep-coding-instructions: true
---

# VSCode Extension API Output Style

This style applies when scaffolding or API-reviewing extension artifacts through the
`tools-vscode-extension-` domain. It governs **output presentation** only: how a scaffold, a
manifest fragment, and a conformance verdict are laid out.

The rule below is the single source (SoT) for **what is API-correct** (disposables, provider
signatures, activation events, build layout), and `app-typescript-code-style.md` is the SoT for
**how the TypeScript is written** (imports, naming, formatting, type safety). Neither is restated
here.

@see .claude/rules/tools-vscode-extension-rule.md — VSCode Extension API criteria (SoT)
@see .claude/docs/tools-vscode-extension-docs.md — manifest / tsconfig / build / testing / launch reference
@see .claude/output-styles/app-typescript-code-style.md — TypeScript authoring style (SoT for the code itself)
@see .claude/skills/tools-vscode-extension-scaffold-skill/SKILL.md — the author→reviewer orchestration entry point

## Division of Labor (read first)

Two styles cover VSCode extension work. Mixing them produces duplicate, drifting criteria.

| Concern | Owning style |
| --- | --- |
| Import order, naming, `const`/`let`, semicolons, indentation, type safety | `app-typescript-code-style` |
| Where the code block sits, what surrounds it, how a verdict reads | This style |
| Whether the code is API-correct | `tools-vscode-extension-rule` (SoT — not a style) |

When output would satisfy both, apply `app-typescript-code-style` to the code inside the block and
this style to everything outside it.

## Language Boundary

| Element | Language |
| --- | --- |
| Code, manifest fragments, identifiers, command / view IDs | Verbatim — never translated |
| Code comments | English (reason / constraint only) |
| Explanation, rationale, verdict reason | Follows the active output style |

Command IDs, view IDs, trigger characters, and `contributes` keys are **identifiers**. Reproduce them
character-for-character and never localise or "tidy" them — a renamed ID silently breaks the
manifest ↔ runtime contract.

## Response Format

- Every code block carries a language identifier: ` ```typescript `, ` ```jsonc `, ` ```bash `.
- **Prefix each code block with its target file path as a comment** — `// app/src/providers/hoverProvider.ts`
  for TypeScript. Multi-file responses repeat this for every block.
- Present **only the added or changed member**, not the whole file. A provider addition shows the new
  method and its registration line, not the entire class.
- A manifest change is shown as a **fragment with its key path stated above the block**, never as a
  reproduced `package.json`:

  > `app/package.json` → `contributes.commands[]`

  ```jsonc
  {
    "command": "symfony.refresh",
    "title": "Refresh",
    "category": "Symfony"
  }
  ```

- Contributions have two sides. When either changes, **show both together** so the parity is visible
  in one glance — the static `contributes` entry and its runtime registration:

  ```typescript
  // app/src/extension.ts — matches contributes.commands[].command above
  context.subscriptions.push(
      vscode.commands.registerCommand('symfony.refresh', handler),
  );
  ```

- Never present a `contributes` entry without its registration, or a `register*` call without the
  manifest entry that declares it. A half-shown contract is the defect this domain exists to catch.

## Sourcing and Citation

This domain asserts facts about an external API, so every claim is traceable or it is not made.

| Claim | Required source |
| --- | --- |
| API availability / behavior | The official docs URL (`code.visualstudio.com/api`) — never memory |
| `engines.vscode`, dependency versions | `app/package.json`, read before citing — never guessed |
| A registration, ID, or trigger character in this project | `{file}:{line}` from the actual source |

Do not propose API introduced after the manifest's `engines.vscode` ceiling without also proposing
the engine bump and stating its impact on users. When a fact cannot be confirmed from these sources,
say so plainly rather than filling the gap: "This could not be confirmed from the project files."

## Scaffold Output (author)

The author writes **in place** under `app/` — there is no `.claude/tmp/` draft to display. That
changes what the report must contain:

- **Name every path written or edited.** With no intermediate artifact, the written path is the only
  record of what happened.
- State which `contributes` / `activationEvents` entries the new code depends on, so the reviewer and
  the user can check them without re-reading the manifest.
- Keep the summary to what was added and what it depends on. Do not restate the code that appears
  directly above it.

## Verdict Format (reviewer)

- The verdict is **`PASS` or `REDO`** — one word, first line, no hedging. Use this vocabulary
  consistently; an "issues list" with no explicit verdict leaves the pipeline unable to branch.
- Every finding carries a `{file}:{line}` anchor **and** the rule clause it violates. A finding that
  names no rule is not actionable and should not be reported.
- **Report objective spec violations only.** Subjective style preference belongs to
  `app-typescript-code-style`, and a quality verdict on a diff belongs to
  `app-typescript-code-reviewer` — neither is this reviewer's output.

```text
Verdict: PASS | REDO
Findings:
  - app/src/extension.ts:42 — createTreeView result not pushed to context.subscriptions
    (rule: Key Rules — all disposables must be pushed to context.subscriptions)
Correction instructions: [only on REDO — concrete enough for the author to apply directly]
```

## Compile Gate Reporting

The pipeline runs `npx tsc --noEmit -p app/tsconfig.json` as an objective gate that overrides the
reviewer's verdict.

- **Never report success without the gate having passed.** A type error is `REDO` regardless of what
  the reviewer said.
- On failure, quote the compiler output verbatim in a ` ```text ` block. Do not paraphrase a
  `tsc` diagnostic — the code and position are what make it actionable.
- If the retry limit (2) is reached and it is still `REDO`, say so explicitly: name the path holding
  the last unpassed draft, list what remains, and end with "Manual review recommended." Do not
  present an unpassed draft as finished work.

## Inline Explanation Format

Use only these headings after a code block, and omit any that are not needed:

- **How it works** — the mechanism, when it is not evident from the code
- **Why this way** — the rationale for the API or structural choice, with the alternative rejected
- **Next steps** — recompile, reload the Extension Development Host, add the matching test

Prohibited: preambles ("Here is the provider:"), restating the code as prose beneath it, and filler.

## Presentation Anti-Patterns

| Anti-pattern | Why | Alternative |
| --- | --- | --- |
| Reproducing the whole `package.json` for one entry | Buries the change; invites a bad paste | A fragment with its key path stated |
| A code block with no file path comment | The application point is ambiguous | Prefix every block with its path |
| Showing a `contributes` entry with no registration | Hides the exact parity defect this domain checks | Show both sides together |
| Asserting an API version from memory | The `engines.vscode` ceiling decides availability | Read `app/package.json` first |
| "Issues found" with no `PASS` / `REDO` | The pipeline cannot branch on it | Lead with the one-word verdict |
| A finding citing no rule clause | The author cannot act on it | Name the violated clause |
| Paraphrasing a `tsc` error | Drops the code and position | Quote the output verbatim |
| Reporting success with a failing compile | Ships code that does not build | `REDO`, regardless of the review verdict |
| Restating type-safety or formatting rules | Duplicates `app-typescript-code-style`, which then drifts | Cite that style and move on |

## Response Structure

When presenting scaffolded or reviewed extension work, respond in this order:

1. **Artifact** — the code / manifest fragment, path-prefixed, with no preamble
2. **Paired side** — the matching registration or manifest entry, when a contract is involved
3. **Explanation** — `How it works` / `Why this way` / `Next steps`, only as needed
4. **Verdict** — `PASS` / `REDO` with findings, when a review ran
5. **Cautions** — engine bump, packaging impact of a runtime dependency, or the retry limit reached

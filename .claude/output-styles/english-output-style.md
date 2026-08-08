---
name: english-output-style
description: English integrated output style — language rules, source verification/hallucination prevention, uncertainty expression, and architecture design (ADR)
keep-coding-instructions: true
---

# English Standard Style

The default output style for English-language work. This document is self-contained.
Covers general responses, code work, strict verification, and architecture design.

## Language Rules

- Conversational responses: English
- Code comments: English (reason/constraint only — omit what the code does)
- Technical terms: no dual-language labeling required; use the standard English term
- Error messages: English (preserves searchability)
- Documentation: English for both internal and public API docs

## Response Format

- Simple questions: paragraph form, no headings
- Complex explanations: structured with h2/h3 headings
- Code blocks: always specify the language (` ```typescript `, ` ```python `, ` ```text `, etc.)
- Lists: use only for 3+ items or parallel structures; prefer paragraphs when a sentence works

## Code Quality

- Suggest test cases for new code (refer to CLAUDE.md rules)
- Highlight potential security issues
- Recommend design patterns where applicable
- Point out code smells and refactoring opportunities
- Avoid over-abstraction in simple examples

## Source Verification

All verifiable technical claims must be traceable to a source confirmed via a tool.
Only cite information that actually appeared in a tool response.

**When citations apply:** Attach citations only to external information and verifiable technical fact claims (file contents, versions, API behavior, web/doc sources). Do not attach a citation to every sentence in general conversation or explanations of code you are actively writing.

**Items to verify with a tool before responding:**

- URLs → cite only those directly confirmed in tool results
- Version numbers → verify from actual project files (package.json, requirements.txt, etc.)
- API behavior → assert only from documentation search (WebFetch) results
- Benchmarks/performance figures → do not assert unverified values

**Citation format:**

- File-based: `[Read: path/filename:line]`
- Web-based: `[WebSearch: query]` or `[WebFetch: URL]`

**Prohibited:**

- Do not generate URLs by guessing patterns
- Do not assert version numbers without checking a file
- Do not claim API behavior without searching the documentation

If a URL is needed but cannot be found: state "URL not found in search results."

## Uncertainty Expression

Include a confidence label in responses based on the level of verification.

- `[Verified]` — information directly confirmed by a tool result
- `[Inferred]` — strong pattern-based reasoning, but not directly confirmed
- `[Uncertain]` — requires additional verification before use

**Acceptable phrasings:**

- "This information needs verification."
- "Based on my analysis — please confirm."
- "The official documentation should be consulted."

Do not assert technical facts in definitive terms without verification.

## Verification Fallback

When a claim cannot be verified with a tool, choose one of the following:

1. **Verify then answer**: "Let me confirm first." → run the tool → answer from the result
2. **Flag uncertainty**: Use the `[Uncertain]` label and state "Official documentation confirmation required."
3. **Defer**: "I will answer this item after direct verification." — when asserting without verification carries risk

## Architecture Design & Analysis

Apply the rules below when architecture design decisions or system structure analysis are requested.
(Do not apply to simple lookup questions.)

### ADR Format

When explaining a design decision, follow this structure:

```markdown
## Context
Current system state, constraints, and requirements

## Decision
The chosen approach and the reasons for it

## Consequences
Positive outcomes, negative outcomes, and trade-offs to accept
```

### Required Trade-off Analysis

When mentioning an architecture pattern, always state trade-offs on these three axes:

- **Scalability**: how the system responds to increasing load
- **Maintainability**: cost of change, cognitive load on the team
- **Performance**: latency and throughput impact

If there is a priority, ask explicitly: "Which of the three axes should take priority?"

### Dependency Direction

- State dependency direction between layers with arrows (`→`)
- Warn immediately if a circular dependency risk is detected
- Example: `Controller → Service → Repository → DB`

### Include Alternatives When Proposing a Pattern

When recommending one pattern, also present a viable alternative:

```text
Recommended: Event Sourcing
Alternative:  CRUD + Audit Log
Decision criteria: need to replay events → Event Sourcing; audit history only → Audit Log
```

### Code Example Standards

- Inline comments in English (reason/constraint only — omit what)
- Provide the rationale for implementation choices in prose outside the code block

---

## Output Examples

Domain-specific style details are defined in the individual example files. When working in that context, the rules in those files take precedence over the general rules in this document.

### TypeScript / VSCode Extension Output Example

> Full rules: `.claude/output-styles/app/base/typescript-style.md`
> API quick-reference: `.claude/rules/tools/vscode-extension-rule.md`

**Key rules:**

- TypeScript source (`src/**/*.ts`, ES module `import` / `export`) compiled by `tsc -p ./` to `out/` — never hand-write `require` / `module.exports` in `src`
- `strict` mode is the primary correctness tool: no `any` / `@ts-ignore` without justification; narrow `unknown` rather than cast
- No `var`, default to `const`; semicolons required, single quotes, 4-space indent
- Push every disposable (providers, commands, tree views) to `context.subscriptions`
- Providers return `vscode.ProviderResult<T>` and degrade gracefully (`null` / `[]` / `{}`) — never throw from a provider
- Explicit return types on exported members and provider methods
- Multi-file responses: prefix each code block with the file path as a comment
- Post-code explanation: only **How it works / Why this way / Next steps** headings allowed

```typescript
// app/src/providers/hoverProvider.ts
import * as vscode from 'vscode';
import { getServices } from '../symfony/console';

export class SymfonyHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.ProviderResult<vscode.Hover> {
        const line = document.lineAt(position.line).text;
        const match = line.match(/->get\('([^']+)'\)/);
        if (!match) {
            return null;   // fetch data only after a pattern match
        }

        const service = getServices()[match[1]];
        if (!service) {
            return null;
        }
        return new vscode.Hover(new vscode.MarkdownString(`**${match[1]}** — \`${service.class}\``));
    }
}
```

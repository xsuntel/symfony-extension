---
name: english-standard
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
- API behavior → assert only from documentation search (WebFetch/Context7) results
- Benchmarks/performance figures → do not assert unverified values

**Citation format:**

- File-based: `[Read: path/filename:line]`
- Web-based: `[WebSearch: query]` or `[WebFetch: URL]`
- Doc-based: `[Context7: library-name]`

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

### PHP / Symfony Output Example

> Full rules: `.claude/output-styles/examples/app-php-style.md`

**Key rules:**

- Every file requires `declare(strict_types=1)`; PHPStan level 8 must pass before merge
- Prefer PHP 8.4 features: constructor promotion, `readonly`, `match`, backed `enum`
- `final class` + constructor injection only; apply `readonly` to injected properties
- Multi-file responses: prefix each code block with the file path as a comment
- Post-code explanation: only **How it works / Why this way / Next steps** headings allowed

```php
// app/src/Service/OrderService.php
final class OrderService
{
    public function __construct(
        private readonly OrderRepository $repository,
        #[Target('cache_pool_company')]
        private readonly CacheInterface $cache,
    ) {}

    public function approve(int $orderId): void
    {
        $order = $this->repository->findOrFail($orderId);
        $order->approve();
        $this->repository->save($order);
    }
}
```

---

### JavaScript / Stimulus Output Example

> Full rules: `.claude/output-styles/examples/app-javascript-style.md`

**Key rules:**

- ES Modules only (`import`/`export`); no `var`, default to `const`
- Stimulus: declare `static targets/values/classes` at the top of the class
- No `document.querySelector()` — use `this.*Target`
- Omit semicolons, single quotes, 2-space indent
- Multi-file responses: prefix each code block with the file path as a comment

```javascript
// assets/controllers/drawer_controller.js
import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['panel']
  static values  = { open: Boolean }

  openValueChanged(open) {
    this.panelTarget.hidden = !open
  }

  toggle() {
    this.openValue = !this.openValue
  }
}
```

---

### Shell Scripts Output Example

> Full rules: `.claude/output-styles/examples/shell-scripts-style.md`

**Key rules:**

- Shebang: `#!/bin/bash` (project scripts), `#!/bin/sh` (container entrypoints)
- `set -euo pipefail` is intentionally commented out — source-based module architecture misbehaves with it
- Function naming: lifecycle phase → `camelCase` (`setPhp`), utility helper → `snake_case` (`log_error`)
- Always check file existence before `source` (bare `source` is forbidden)
- `rm -rf` requires the `${VAR:?}` guard pattern

```bash
#!/bin/bash
#set -euo pipefail
# ----------------------------------------------------------------------------------------------------------------------
# Scripts - Deploy - Linux - Ubuntu
# ----------------------------------------------------------------------------------------------------------------------

find_project_root() {
    local PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    while [[ "${PROJECT_DIR}" != "/" ]]; do
        [[ -d "${PROJECT_DIR}/.git" ]] && { echo "${PROJECT_DIR}"; return 0; }
        PROJECT_DIR="$(dirname "${PROJECT_DIR}")"
    done
    return 1
}

PROJECT_PATH=$(find_project_root)
cd "${PROJECT_PATH}" || exit

if [ -f "${PROJECT_PATH}/scripts/base/_abstract.sh" ]; then
  source "${PROJECT_PATH}/scripts/base/_abstract.sh"
else
  echo "Please check a file : ./scripts/base/_abstract.sh" && exit
fi

setStart
setEnvironment
setPlatform
setProject
setPhp
setBuild
setDocker
setUtility
setTools
setEnd
```

# Tools - AI - Anthropic - Claude - Config

Reference for Claude Code configuration in this project. The live settings file is
[`../../../../.claude/settings.json`](../../../../.claude/settings.json) — edit that,
not a copy here.

## `settings.json`

| Item | Value |
| --- | --- |
| Live file | `.claude/settings.json` (project scope) |
| JSON schema | <https://json.schemastore.org/claude-code-settings.json> |

Point the file at the schema for editor validation:

```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json"
}
```

## MCP & Secrets

- **Never hardcode secrets** (API keys, tokens, passwords) in `settings.json`, MCP
  server config, or any tracked file — global rule §3.3.
- Provide credentials via **environment variables** or a **Secret Manager**
  reference; keep plaintext out of the repository.
- MCP servers and env are configured through Claude Code settings; consult the
  schema above for the current key names before adding any (do not guess keys).

## Related

- `.claude/` layout and agent/skill index → [`_ABSTRACT.md`](_ABSTRACT.md)
- Agent naming & role mapping → root [`../../../../CLAUDE.md`](../../../../CLAUDE.md)

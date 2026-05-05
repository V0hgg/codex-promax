# Google Antigravity Setup

Veloran prepares Antigravity-compatible project guidance with:

- `GEMINI.md` for always-loaded workspace rules
- `.agent/skills/init-harness/SKILL.md`
- `.agent/skills/execplan-create/SKILL.md`
- `.agent/skills/execplan-execute/SKILL.md`
- `.agent/context/` and `.agent/memory/`

## Observability MCP

If you want Antigravity to query the local observability MCP server, add an MCP server entry in Antigravity Agent Chat using this shape:

```json
{
  "mcpServers": {
    "observability": {
      "command": "node",
      "args": [
        ".agent/harness/mcp/observability-server/server.mjs"
      ],
      "env": {
        "OBS_LOGS_URL": "http://127.0.0.1:9428",
        "OBS_METRICS_URL": "http://127.0.0.1:8428",
        "OBS_TRACES_URL": "http://127.0.0.1:10428"
      }
    }
  }
}
```

Antigravity may require adding or refreshing MCP servers through its Agent Chat MCP server manager. Veloran prepares the config and instructions but does not automate the IDE UI.

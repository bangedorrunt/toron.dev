# catalog/ — generated surface catalogs (ADR-0002 D3/D4)

**Never hand-edit these files.** They are emitted by extractors in the
product repos and pulled here by `scripts/sync-catalogs.sh` (or fetched at
build time). A surface change in toron/flywheel without a catalog regen is
unmergeable in that repo (CI freshness gate).

## toron-mcp.json — contract

Emitted by `toron catalog --json` (toron repo). 38 tools, frozen names
(toron ADR-0007 C3). Shape (v1):

```json
{
  "schema_version": 1,
  "generated_at": "2026-08-14T00:00:00Z",
  "toron_version": "0.1.0",
  "tools": [
    {
      "name": "acknowledge_message",
      "group": "Messaging",
      "description": "Acknowledge a message (private NIP-17 ack, idempotent).",
      "input_schema": { "...": "JSON Schema, verbatim from the MCP tool" },
      "output_schema": { "...": "JSON Schema" },
      "parity": "AM-Rust 38-tool surface",
      "example": { "message_id": "<hex event id>" }
    }
  ],
  "resources": [ { "name": "...", "uri": "...", "description": "..." } ],
  "cli_commands": [ { "name": "serve", "args": "...", "description": "..." } ]
}
```

`tools.length` MUST equal 38. Groups per ADR-0001 D7 (Identity 6 · Messaging 5 ·
Contacts 4 · File-reservations 5 · Search 2 · Macros 4 · Product-bus 5 ·
Build-slots 3 · Infrastructure 4).

## flywheel-cli.json — contract (same pattern)

CLI commands + workflow YAML trigger/action vocabulary. Emitted by the
flywheel repo extractor.

## Status

The stubs below are SEEDS so the tool-page generator can be built before the
toron-repo extractor lands (lane 4). The extractor's output replaces them.

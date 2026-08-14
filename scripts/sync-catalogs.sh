#!/usr/bin/env bash
# governed-by: ADR-0002
#
# Pull fresh surface catalogs from the product repos (ADR-0002 D3).
#   - clone --depth 1 each product repo
#   - copy its committed catalog into catalog/ (never hand-edit those files)
#   - verify the toron catalog carries exactly 38 tools (frozen names,
#     toron ADR-0007 C3)
#
# Local override for testing without pushing:
#   TORON_SYNC_TORON_REPO=/path/to/toron  (and TORON_SYNC_FLYWHEEL_REPO)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TORON_REPO="${TORON_SYNC_TORON_REPO:-https://github.com/bangedorrunt/toron.git}"
FLYWHEEL_REPO="${TORON_SYNC_FLYWHEEL_REPO:-https://github.com/bangedorrunt/flywheel.git}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== toron =="
git clone --quiet --depth 1 "$TORON_REPO" "$TMP/toron"
cp "$TMP/toron/docs/catalog/toron-mcp.json" catalog/toron-mcp.json
count="$(jq -r '.tools | length' catalog/toron-mcp.json)"
if [ "$count" -ne 38 ]; then
    echo "FAIL: catalog/toron-mcp.json carries $count tools (expected 38)" >&2
    exit 1
fi
echo "ok: toron-mcp.json synced ($count tools)"

echo "== flywheel =="
if git clone --quiet --depth 1 "$FLYWHEEL_REPO" "$TMP/flywheel" 2>/dev/null; then
    if [ -f "$TMP/flywheel/docs/catalog/flywheel-cli.json" ]; then
        cp "$TMP/flywheel/docs/catalog/flywheel-cli.json" catalog/flywheel-cli.json
        echo "ok: flywheel-cli.json synced"
    else
        echo "skip: flywheel repo has no docs/catalog/flywheel-cli.json yet"
    fi
else
    echo "skip: could not clone flywheel from $FLYWHEEL_REPO"
fi

echo "catalogs synced"

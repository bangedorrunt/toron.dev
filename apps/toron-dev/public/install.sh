#!/usr/bin/env sh
set -eu

if command -v toron >/dev/null 2>&1; then
  echo "toron is already installed: $(command -v toron)"
else
  if ! command -v cargo >/dev/null 2>&1; then
    echo "toron is not installed and cargo is unavailable." >&2
    echo "Install Rust, then rerun: curl -sSL https://toron.dev/install.sh | sh" >&2
    exit 1
  fi
  echo "Installing toron from the canonical repository..."
  cargo install --git https://github.com/bangedorrunt/toron.git --locked --package toron-cli
fi

printf '\nNext steps:\n'
printf '  toron daemon install\n'
printf '  toron daemon start\n'
printf '  toron doctor --check\n'
printf '  toron agent bootstrap --project <project> --as <Pin>\n'
printf '\nCanonical guide: https://toron.dev/agent-guide.md\n'

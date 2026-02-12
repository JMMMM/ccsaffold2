#!/bin/bash
# Install script for hook-session-log feature
# Usage: bash scripts/install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$FEATURE_DIR")")"

echo "[Session-Log] Installing hook-session-log feature..."

# Create target directories
mkdir -p "$PROJECT_ROOT/.claude/hooks"
mkdir -p "$PROJECT_ROOT/doc/session_log"

# Copy hook script
cp "$FEATURE_DIR/hooks/session-log.js" "$PROJECT_ROOT/.claude/hooks/session-log.js"
echo "[Session-Log] Copied session-log.js to .claude/hooks/"

# Merge settings.json
SETTINGS_SRC="$FEATURE_DIR/settings.json"
SETTINGS_DEST="$PROJECT_ROOT/.claude/settings.json"

if [ -f "$SETTINGS_DEST" ]; then
  echo "[Session-Log] Merging with existing settings.json..."
  # Use node to merge JSON files
  node -e "
    const fs = require('fs');
    const src = JSON.parse(fs.readFileSync('$SETTINGS_SRC', 'utf8'));
    let dest = {};
    try {
      dest = JSON.parse(fs.readFileSync('$SETTINGS_DEST', 'utf8'));
    } catch (e) {}

    // Merge hooks
    if (!dest.hooks) dest.hooks = {};
    for (const [event, configs] of Object.entries(src.hooks)) {
      if (!dest.hooks[event]) {
        dest.hooks[event] = [];
      }
      // Add new session-log hooks (avoid duplicates)
      for (const config of configs) {
        const exists = dest.hooks[event].some(c =>
          c.hooks && c.hooks.some(h => h.command && h.command.includes('session-log.js'))
        );
        if (!exists) {
          dest.hooks[event].push(config);
        }
      }
    }

    fs.writeFileSync('$SETTINGS_DEST', JSON.stringify(dest, null, 2));
    console.log('[Session-Log] settings.json merged successfully');
  "
else
  echo "[Session-Log] Creating new settings.json..."
  cp "$SETTINGS_SRC" "$SETTINGS_DEST"
fi

echo "[Session-Log] Installation complete!"
echo "[Session-Log] Log files will be stored in: doc/session_log/"

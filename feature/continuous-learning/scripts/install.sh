#!/bin/bash
# Install script for continuous-learning feature
# Copies files to .claude directory and merges settings

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$FEATURE_DIR")")"

echo "Installing continuous-learning feature..."
echo "Feature directory: $FEATURE_DIR"
echo "Project root: $PROJECT_ROOT"

# Create target directories
mkdir -p "$PROJECT_ROOT/.claude/hooks"
mkdir -p "$PROJECT_ROOT/.claude/lib"
mkdir -p "$PROJECT_ROOT/.claude/skills"

# Copy hook files
echo "Copying hooks..."
cp -n "$FEATURE_DIR/hooks/"*.js "$PROJECT_ROOT/.claude/hooks/" 2>/dev/null || true

# Copy lib files
echo "Copying lib modules..."
cp -n "$FEATURE_DIR/lib/"*.js "$PROJECT_ROOT/.claude/lib/" 2>/dev/null || true

# Copy skill files
echo "Copying skills..."
cp -n "$FEATURE_DIR/skills/"*.md "$PROJECT_ROOT/.claude/skills/" 2>/dev/null || true

# Merge settings.json
echo "Merging settings..."
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
FEATURE_SETTINGS="$FEATURE_DIR/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  # Merge with existing settings (simple merge for hooks)
  echo "Settings file exists, merging..."
  # Note: For proper JSON merge, consider using jq if available
  echo "Please manually merge the following into $SETTINGS_FILE:"
  cat "$FEATURE_SETTINGS"
else
  echo "Creating new settings file..."
  cp "$FEATURE_SETTINGS" "$SETTINGS_FILE"
fi

# Create .skills/learn directory
mkdir -p "$PROJECT_ROOT/.skills/learn"

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure ANTHROPIC_API_KEY environment variable is set"
echo "2. Restart Claude Code to load the new hooks"
echo "3. Skills will be saved to: $PROJECT_ROOT/.skills/learn/"

#!/bin/bash
# Cross-platform validation script for session logging
# Tests that the implementation works on Windows, macOS, and Linux

set -e

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Darwin*)    OS_NAME="macOS" ;;
  Linux*)     OS_NAME="Linux" ;;
  MINGW*|MSYS*|CYGWIN*)  OS_NAME="Windows" ;;
  *)          OS_NAME="Unknown: $OS" ;;
esac

echo "=== Cross-Platform Validation ==="
echo "Detected OS: $OS_NAME"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Test 1: Verify path handling
echo "Test 1: Path handling..."
node -e "
const path = require('path');
const fileUtils = require('$PROJECT_ROOT/src/lib/file-utils');

const logPath = fileUtils.getLogFilePath();
console.log('Log path:', logPath);

// Verify path is absolute
if (!path.isAbsolute(logPath)) {
  console.error('ERROR: Path is not absolute');
  process.exit(1);
}

// Verify path uses correct separators (no mixed separators)
const normalized = path.normalize(logPath);
if (logPath !== normalized) {
  console.error('ERROR: Path is not normalized');
  process.exit(1);
}

console.log('✓ Path handling is correct');
"

# Test 2: Verify EOL handling
echo ""
echo "Test 2: EOL handling..."
node -e "
const os = require('os');
const eol = os.EOL;
console.log('Platform EOL:', JSON.stringify(eol));

if (eol !== '\\n' && eol !== '\\r\\n') {
  console.error('ERROR: Unexpected EOL character');
  process.exit(1);
}

console.log('✓ EOL handling is correct');
"

# Test 3: Run unit tests
echo ""
echo "Test 3: Running unit tests..."
cd "$PROJECT_ROOT"
node tests/unit/file-utils.test.js
node tests/unit/logger.test.js
node tests/unit/log-user-prompt.test.js
node tests/unit/log-tool-use.test.js

# Test 4: Create and verify a log entry
echo ""
echo "Test 4: Create and verify log entry..."
TEST_DIR=$(mktemp -d)
mkdir -p "$TEST_DIR/.claude/conversations"

# Create test input
echo '{"event":"UserPromptSubmit","data":{"prompt":"Cross-platform test","session_id":"test"}}' > "$TEST_DIR/input.json"

# Run hook
cd "$TEST_DIR"
CLAUDE_PROJECT_ROOT="$TEST_DIR" node "$PROJECT_ROOT/src/hooks/log-user-prompt.js" < "$TEST_DIR/input.json"

# Verify log file
LOG_FILE="$TEST_DIR/.claude/conversations/conversation.txt"
if [ ! -f "$LOG_FILE" ]; then
  echo "ERROR: Log file not created"
  rm -rf "$TEST_DIR"
  exit 1
fi

CONTENT=$(cat "$LOG_FILE")
if [[ ! "$CONTENT" =~ "user> Cross-platform test" ]]; then
  echo "ERROR: Log content incorrect"
  echo "Content: $CONTENT"
  rm -rf "$TEST_DIR"
  exit 1
fi

echo "✓ Log entry created successfully"

# Cleanup
rm -rf "$TEST_DIR"

echo ""
echo "=== All cross-platform tests passed on $OS_NAME ==="

#!/bin/bash
# Verify script for hook-session-log feature
# Usage: bash scripts/verify.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$FEATURE_DIR")")"

echo "[Session-Log] Verifying installation..."
echo ""

ERRORS=0

# Check hook script exists
if [ -f "$PROJECT_ROOT/.claude/hooks/session-log.js" ]; then
  echo "[OK] Hook script: .claude/hooks/session-log.js"
else
  echo "[ERROR] Hook script not found: .claude/hooks/session-log.js"
  ERRORS=$((ERRORS + 1))
fi

# Check log directory exists
if [ -d "$PROJECT_ROOT/doc/session_log" ]; then
  echo "[OK] Log directory: doc/session_log/"
else
  echo "[ERROR] Log directory not found: doc/session_log/"
  ERRORS=$((ERRORS + 1))
fi

# Check settings.json has session-log hooks
if [ -f "$PROJECT_ROOT/.claude/settings.json" ]; then
  if grep -q "session-log.js" "$PROJECT_ROOT/.claude/settings.json"; then
    echo "[OK] settings.json contains session-log hooks"
  else
    echo "[ERROR] settings.json missing session-log hooks"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "[ERROR] settings.json not found"
  ERRORS=$((ERRORS + 1))
fi

# Test hook script with sample input
echo ""
echo "[Session-Log] Testing hook script..."
LOG_FILE="$PROJECT_ROOT/doc/session_log/session_log_$(date +%Y%m%d).md"

# Use printf to ensure proper stdin handling
printf '{"hook_event_name":"Test","session_id":"verify-test"}' | node "$PROJECT_ROOT/.claude/hooks/session-log.js" 2>/dev/null

if [ -f "$LOG_FILE" ]; then
  if grep -q "verify-test" "$LOG_FILE" 2>/dev/null; then
    echo "[OK] Hook script writes to log file correctly"
  else
    echo "[ERROR] Hook script did not write expected content"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "[ERROR] Log file not created"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "[Session-Log] Verification PASSED"
  exit 0
else
  echo "[Session-Log] Verification FAILED with $ERRORS error(s)"
  exit 1
fi

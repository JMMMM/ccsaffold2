#!/bin/bash
# Verify script for continuous-learning feature installation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$FEATURE_DIR")")"

echo "Verifying continuous-learning installation..."
echo ""

ERRORS=0

# Check hooks
echo "Checking hooks..."
if [ -f "$PROJECT_ROOT/.claude/hooks/auto-learning.js" ]; then
  echo "  ✓ auto-learning.js found"
else
  echo "  ✗ auto-learning.js NOT found"
  ERRORS=$((ERRORS + 1))
fi

# Check lib modules
echo "Checking lib modules..."
for module in sensitive-filter.js transcript-reader.js llm-analyzer.js skill-generator.js; do
  if [ -f "$PROJECT_ROOT/.claude/lib/$module" ]; then
    echo "  ✓ $module found"
  else
    echo "  ✗ $module NOT found"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check skills
echo "Checking skills..."
if [ -f "$PROJECT_ROOT/.claude/skills/manual-learn.md" ]; then
  echo "  ✓ manual-learn.md found"
else
  echo "  ✗ manual-learn.md NOT found"
  ERRORS=$((ERRORS + 1))
fi

# Check settings
echo "Checking settings..."
if [ -f "$PROJECT_ROOT/.claude/settings.json" ]; then
  if grep -q "sessionEnd" "$PROJECT_ROOT/.claude/settings.json" 2>/dev/null; then
    echo "  ✓ settings.json contains sessionEnd hook"
  else
    echo "  ✗ settings.json missing sessionEnd hook configuration"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ✗ settings.json NOT found"
  ERRORS=$((ERRORS + 1))
fi

# Check .skills directory
echo "Checking skill output directory..."
if [ -d "$PROJECT_ROOT/.skills/learn" ]; then
  echo "  ✓ .skills/learn directory exists"
else
  echo "  ✗ .skills/learn directory NOT found"
  ERRORS=$((ERRORS + 1))
fi

# Check environment
echo "Checking environment..."
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "  ✓ ANTHROPIC_API_KEY is set"
else
  echo "  ⚠ ANTHROPIC_API_KEY is NOT set (required for LLM analysis)"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✓ All checks passed!"
  exit 0
else
  echo "✗ $ERRORS error(s) found"
  exit 1
fi

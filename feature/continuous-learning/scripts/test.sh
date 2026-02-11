#!/bin/bash
# Test script for continuous-learning feature

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"

echo "Running all tests for continuous-learning feature..."
echo ""

PASSED=0
FAILED=0

run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file")

  echo "Running: $test_name"
  if node "$test_file" > /dev/null 2>&1; then
    echo "  ✓ PASSED"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ FAILED"
    FAILED=$((FAILED + 1))
  fi
}

# Run all test files
for test_file in "$FEATURE_DIR/tests/"*.test.js; do
  run_test "$test_file"
done

echo ""
echo "================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0

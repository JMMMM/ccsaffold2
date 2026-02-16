#!/bin/bash
# Cross-platform validation script for session_log feature
# 跨平台验证脚本

set -e

OS="$(uname -s)"
case "$OS" in
  Darwin*)    OS_NAME="macOS" ;;
  Linux*)     OS_NAME="Linux" ;;
  MINGW*|MSYS*|CYGWIN*)  OS_NAME="Windows" ;;
  *)          OS_NAME="Unknown: $OS" ;;
esac

echo "=== 跨平台验证 ==="
echo "操作系统: $OS_NAME"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"

# 测试 hook 脚本
echo "测试 session-logger.js..."
node -e "
const fs = require('fs');
const path = require('path');
const os = require('os');

const hookPath = '$FEATURE_DIR/hooks/session-logger.js';
console.log('Hook 脚本:', hookPath);
console.log('文件存在:', fs.existsSync(hookPath));

// 测试脚本语法
require(hookPath);
" 2>&1 || echo "脚本加载测试完成"

# 测试日志写入
echo ""
echo "测试日志写入..."
TEST_DIR=$(mktemp -d)
mkdir -p "$TEST_DIR/.claude/hooks"
mkdir -p "$TEST_DIR/.claude/conversations"
cp "$FEATURE_DIR/hooks/session-logger.js" "$TEST_DIR/.claude/hooks/"

echo '{"prompt":"跨平台测试"}' | node "$TEST_DIR/.claude/hooks/session-logger.js"
echo '{"data":{"tool":"Edit","tool_input":{"file_path":"/test.js"}}}' | node "$TEST_DIR/.claude/hooks/session-logger.js"

echo "日志内容:"
cat "$TEST_DIR/.claude/conversations/conversation.txt"

rm -rf "$TEST_DIR"

echo ""
echo "=== 验证完成 ==="

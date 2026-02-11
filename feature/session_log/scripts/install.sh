#!/bin/bash
# Install script for session_log feature
# 安装会话日志功能到项目

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEATURE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$FEATURE_DIR/../.." && pwd)"

echo "=== 安装 Session Log 功能 ==="
echo "功能目录: $FEATURE_DIR"
echo "项目根目录: $PROJECT_ROOT"
echo ""

# 创建目标目录
echo "创建目录..."
mkdir -p "$PROJECT_ROOT/.claude/hooks"
mkdir -p "$PROJECT_ROOT/.claude/conversations"

# 复制脚本
echo "复制脚本..."
cp "$FEATURE_DIR/hooks/session-logger.js" "$PROJECT_ROOT/.claude/hooks/"

# 合并 settings.json
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    echo "创建 settings.json..."
    echo '{}' > "$SETTINGS_FILE"
fi

echo "合并 settings.json..."
node -e "
const fs = require('fs');
const settingsPath = '$SETTINGS_FILE';
const featureSettings = require('$FEATURE_DIR/settings.json');

let settings = {};
try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch (e) {
    settings = {};
}

// Merge hooks
if (!settings.hooks) settings.hooks = {};
Object.assign(settings.hooks, featureSettings.hooks);

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('✓ settings.json 已合并');
"

echo ""
echo "=== 安装完成 ==="
echo ""
echo "日志文件位置: .claude/conversations/conversation.txt"
echo ""
echo "测试方法："
echo "  在 Claude Code 中输入任意内容，然后查看日志文件"

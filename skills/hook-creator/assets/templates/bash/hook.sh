#!/bin/bash
#
# Hook Script Template (Bash)
#
# stdin 输入格式参见 references/input-format.md
# 注意: 需要安装 jq 来解析 JSON
#

# 读取 stdin
input=$(cat)

# 解析事件类型 (需要 jq)
event=$(echo "$input" | jq -r '.hook_event_name' 2>/dev/null)

case "$event" in
    UserPromptSubmit)
        prompt=$(echo "$input" | jq -r '.prompt' 2>/dev/null)
        # TODO: 实现你的逻辑
        ;;
    PreToolUse)
        tool=$(echo "$input" | jq -r '.tool_name' 2>/dev/null)
        # TODO: 实现你的逻辑
        # 如需拦截，输出:
        # echo '{"decision": "deny", "reason": "拒绝原因"}'
        ;;
    PostToolUse)
        tool=$(echo "$input" | jq -r '.tool_name' 2>/dev/null)
        # TODO: 实现你的逻辑
        ;;
    Notification)
        notification=$(echo "$input" | jq -r '.notification' 2>/dev/null)
        # TODO: 实现你的逻辑
        ;;
    Stop)
        # TODO: 清理资源
        ;;
esac

exit 0

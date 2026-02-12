# Hook stdin 输入格式

## 通用输入字段

所有 hook 事件都包含以下基础字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `session_id` | string | 会话唯一标识 |
| `transcript_path` | string | 会话记录文件路径 (.jsonl) |
| `cwd` | string | 当前工作目录 |
| `permission_mode` | string | 权限模式：`"default"` / `"plan"` / `"acceptEdits"` / `"dontAsk"` / `"bypassPermissions"` |
| `hook_event_name` | string | 事件类型名称 |

### 完整通用输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/user/.claude/projects/project-name/00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "cwd": "/Users/user/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

---

## 处理 stdin 的最佳实践

### Node.js

```javascript
#!/usr/bin/env node
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data || '{}');
    const eventName = input.hook_event_name;

    // 根据事件类型处理
    switch (eventName) {
      case 'UserPromptSubmit':
        console.log(JSON.stringify({
          decision: 'block',
          reason: '拒绝原因'
        }));
        break;
      case 'PreToolUse':
        console.log(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow'
          }
        }));
        break;
    }
  } catch (e) {
    // 忽略解析错误
  }
  process.exit(0);
});
```

### Python

```python
#!/usr/bin/env python3
import sys
import json

try:
    data = sys.stdin.read()
    input_data = json.loads(data or '{}')
    event_name = input_data.get('hook_event_name', '')

    if event_name == 'UserPromptSubmit':
        print(json.dumps({
            'decision': 'block',
            'reason': '拒绝原因'
        }))
    elif event_name == 'PreToolUse':
        print(json.dumps({
            'hookSpecificOutput': {
                'hookEventName': 'PreToolUse',
                'permissionDecision': 'allow'
            }
        }))
except Exception:
    pass
sys.exit(0)
```

### Bash (需要 jq)

```bash
#!/bin/bash
INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')

case "$EVENT" in
  UserPromptSubmit)
    PROMPT=$(echo "$INPUT" | jq -r '.prompt')
    if [[ "$PROMPT" == *"forbidden"* ]]; then
      jq -n '{decision: "block", reason: "包含禁止内容"}'
      exit 0
    fi
    ;;
  PreToolUse)
    TOOL=$(echo "$INPUT" | jq -r '.tool_name')
    CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    if [[ "$CMD" == *"rm -rf"* ]]; then
      jq -n '{
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: "禁止删除命令"
        }
      }'
    fi
    ;;
esac
exit 0
```

---

## 输出格式

### 退出码

| 退出码 | 含义 | 行为 |
|--------|------|------|
| `0` | 成功 | 解析 stdout 中的 JSON 输出 |
| `2` | 阻断 | 忽略 stdout，将 stderr 作为错误信息反馈 |
| 其他 | 非阻断错误 | 显示 stderr，继续执行 |

### 退出码 2 的效果

| 事件 | 可阻断 | 行为 |
|------|--------|------|
| `PreToolUse` | 是 | 阻止工具调用 |
| `PermissionRequest` | 是 | 拒绝权限请求 |
| `UserPromptSubmit` | 是 | 阻止处理提示并清除 |
| `Stop` | 是 | 阻止停止，继续对话 |
| `SubagentStop` | 是 | 阻止子代理停止 |
| `TeammateIdle` | 是 | 阻止空闲，继续工作 |
| `TaskCompleted` | 是 | 阻止任务标记完成 |
| `PostToolUse` | 否 | 仅显示 stderr |
| `PostToolUseFailure` | 否 | 仅显示 stderr |
| `Notification` | 否 | 仅显示 stderr |
| `SessionStart` | 否 | 仅显示 stderr |
| `SessionEnd` | 否 | 仅显示 stderr |
| `PreCompact` | 否 | 仅显示 stderr |

---

## JSON 输出结构

### 通用字段

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `continue` | `true` | `false` 时完全停止 Claude 处理 |
| `stopReason` | 无 | `continue: false` 时显示给用户的消息 |
| `suppressOutput` | `false` | `true` 时在 verbose 模式隐藏输出 |
| `systemMessage` | 无 | 显示给用户的警告消息 |

```json
{
  "continue": false,
  "stopReason": "构建失败，修复错误后继续"
}
```

### 决策控制模式

不同事件使用不同的决策控制格式：

#### 模式 1: 顶层 decision (UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop)

```json
{
  "decision": "block",
  "reason": "测试套件必须通过才能继续"
}
```

#### 模式 2: hookSpecificOutput (PreToolUse)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "安全命令",
    "updatedInput": {
      "command": "npm run lint"
    },
    "additionalContext": "当前环境: production"
  }
}
```

#### 模式 3: hookSpecificOutput (PermissionRequest)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": { ... },
      "updatedPermissions": [ ... ]
    }
  }
}
```

#### 模式 4: 仅退出码 (TeammateIdle, TaskCompleted)

这些事件不支持 JSON 决策控制，只能通过 exit code 2 阻断：

```bash
#!/bin/bash
if [ ! -f "./dist/output.js" ]; then
  echo "构建产物缺失" >&2
  exit 2
fi
exit 0
```

---

## 事件特定输出字段

### SessionStart

| 字段 | 说明 |
|------|------|
| `additionalContext` | 添加到 Claude 上下文的字符串 |

### UserPromptSubmit

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 阻止处理 |
| `reason` | 显示给用户的原因 |
| `additionalContext` | 添加到上下文 |

### PreToolUse

| 字段 | 说明 |
|------|------|
| `permissionDecision` | `"allow"` / `"deny"` / `"ask"` |
| `permissionDecisionReason` | 原因说明 |
| `updatedInput` | 修改后的工具输入 |
| `additionalContext` | 添加到上下文 |

### PermissionRequest

| 字段 | 说明 |
|------|------|
| `decision.behavior` | `"allow"` / `"deny"` |
| `decision.updatedInput` | 修改后的输入 |
| `decision.updatedPermissions` | 权限规则更新 |
| `decision.message` | 拒绝原因 |
| `decision.interrupt` | `true` 时停止 Claude |

### PostToolUse

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 提示 Claude |
| `reason` | 解释原因 |
| `additionalContext` | 额外上下文 |
| `updatedMCPToolOutput` | 替换 MCP 工具输出 |

### PostToolUseFailure

| 字段 | 说明 |
|------|------|
| `additionalContext` | 失败相关的额外上下文 |

### Notification

| 字段 | 说明 |
|------|------|
| `additionalContext` | 添加到上下文 |

### SubagentStart

| 字段 | 说明 |
|------|------|
| `additionalContext` | 注入到子代理的上下文 |

### SubagentStop / Stop

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 阻止停止 |
| `reason` | 必须提供 |

---

## 环境变量

### CLAUDE_ENV_FILE

SessionStart 事件可访问此环境变量，用于持久化环境变量：

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
  echo 'export PATH="$PATH:./node_modules/.bin"' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

### CLAUDE_PROJECT_DIR

项目根目录，用于引用脚本：

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-style.sh"
      }]
    }]
  }
}
```

### CLAUDE_CODE_REMOTE

在远程 Web 环境中设置为 `"true"`，本地 CLI 中不设置。

---

## 路径解析

使用脚本所在目录解析相对路径：

```javascript
// Node.js
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'hook.log');
```

```python
# Python
import os
log_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 'hook.log')
```

避免依赖工作目录 (cwd)，因为工作目录可能变化。

---

## 调试

运行 `claude --debug` 查看 hook 执行详情：

```
[DEBUG] Executing hooks for PostToolUse:Write
[DEBUG] Getting matching hook commands for PostToolUse with query: Write
[DEBUG] Found 1 hook matchers in settings
[DEBUG] Matched 1 hooks for query "Write"
[DEBUG] Found 1 hook commands to execute
[DEBUG] Executing hook command: <Your command> with timeout 600000ms
[DEBUG] Hook command completed with status 0: <Your stdout>
```

使用 `Ctrl+O` 切换 verbose 模式查看 hook 输出。

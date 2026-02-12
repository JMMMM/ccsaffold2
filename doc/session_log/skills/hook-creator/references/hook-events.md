# Claude Code Hook 事件类型

## 事件列表

| 事件 | 触发时机 | Matcher 支持 | 可阻断 |
|------|---------|-------------|--------|
| SessionStart | 会话开始或恢复时 | startup/resume/clear/compact | 否 |
| UserPromptSubmit | 用户提交提示后 | 无 | 是 |
| PreToolUse | 工具执行前 | 工具名 (Bash/Write/Edit/...) | 是 |
| PermissionRequest | 权限对话框出现时 | 工具名 | 是 |
| PostToolUse | 工具执行成功后 | 工具名 | 是 |
| PostToolUseFailure | 工具执行失败后 | 工具名 | 是 |
| Notification | 发送通知时 | notification_type | 否 |
| SubagentStart | 子代理启动时 | agent_type | 否 |
| SubagentStop | 子代理完成时 | agent_type | 是 |
| Stop | 主代理完成响应时 | 无 | 是 |
| TeammateIdle | 团队成员即将空闲时 | 无 | 是 (exit 2) |
| TaskCompleted | 任务标记为完成时 | 无 | 是 (exit 2) |
| PreCompact | 上下文压缩前 | manual/auto | 否 |
| SessionEnd | 会话终止时 | clear/logout/... | 否 |

---

## SessionStart

会话开始或恢复时触发。可用于加载开发上下文、设置环境变量。

### Matcher 值

| Matcher | 触发时机 |
|---------|---------|
| `startup` | 新会话 |
| `resume` | `--resume`、`--continue` 或 `/resume` |
| `clear` | `/clear` 后 |
| `compact` | 自动或手动压缩后 |

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-5-20250929",
  "agent_type": "optional-agent-name"
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `additionalContext` | 添加到 Claude 上下文的字符串 |

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "项目特定的上下文信息"
  }
}
```

### 环境变量持久化

通过 `CLAUDE_ENV_FILE` 环境变量持久化环境变量：

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
  echo 'export PATH="$PATH:./node_modules/.bin"' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

---

## UserPromptSubmit

用户提交提示后、Claude 处理前触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate the factorial of a number"
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 阻止处理并清除提示 |
| `reason` | 阻止时显示给用户的原因 |
| `additionalContext` | 添加到上下文 |

```json
{
  "decision": "block",
  "reason": "提示内容不符合规范",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "额外的上下文信息"
  }
}
```

---

## PreToolUse

工具执行前触发。可以拦截、验证或修改工具输入。

### Matcher 值

匹配 `tool_name`：`Bash`、`Edit`、`Write`、`Read`、`Glob`、`Grep`、`Task`、`WebFetch`、`WebSearch`、MCP 工具名 (`mcp__server__tool`)

### 通用输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_use_id": "toolu_01ABC123...",
  "tool_input": { ... }
}
```

### 各工具 tool_input

#### Bash
```json
{
  "command": "npm test",
  "description": "Run test suite",
  "timeout": 120000,
  "run_in_background": false
}
```

#### Write
```json
{
  "file_path": "/path/to/file.txt",
  "content": "file content"
}
```

#### Edit
```json
{
  "file_path": "/path/to/file.txt",
  "old_string": "original text",
  "new_string": "replacement text",
  "replace_all": false
}
```

#### Read
```json
{
  "file_path": "/path/to/file.txt",
  "offset": 10,
  "limit": 50
}
```

#### Glob
```json
{
  "pattern": "**/*.ts",
  "path": "/path/to/dir"
}
```

#### Grep
```json
{
  "pattern": "TODO.*fix",
  "path": "/path/to/dir",
  "glob": "*.ts",
  "output_mode": "content",
  "-i": true,
  "multiline": false
}
```

#### WebFetch
```json
{
  "url": "https://example.com/api",
  "prompt": "Extract the API endpoints"
}
```

#### WebSearch
```json
{
  "query": "react hooks best practices",
  "allowed_domains": ["docs.example.com"],
  "blocked_domains": ["spam.example.com"]
}
```

#### Task
```json
{
  "prompt": "Find all API endpoints",
  "description": "Find API endpoints",
  "subagent_type": "Explore",
  "model": "sonnet"
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `permissionDecision` | `"allow"` / `"deny"` / `"ask"` |
| `permissionDecisionReason` | 原因说明 |
| `updatedInput` | 修改后的工具输入 |
| `additionalContext` | 添加到上下文 |

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "安全命令，自动批准",
    "updatedInput": {
      "command": "npm run lint"
    },
    "additionalContext": "当前环境: production"
  }
}
```

---

## PermissionRequest

权限对话框显示时触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PermissionRequest",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf node_modules",
    "description": "Remove node_modules directory"
  },
  "permission_suggestions": [
    { "type": "toolAlwaysAllow", "tool": "Bash" }
  ]
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `decision.behavior` | `"allow"` / `"deny"` |
| `decision.updatedInput` | 修改后的输入 (allow 时) |
| `decision.updatedPermissions` | 更新权限规则 |
| `decision.message` | 拒绝原因 (deny 时) |

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": {
        "command": "npm run lint"
      }
    }
  }
}
```

---

## PostToolUse

工具执行成功后触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 提示 Claude |
| `reason` | 解释原因 |
| `additionalContext` | 额外上下文 |

```json
{
  "decision": "block",
  "reason": "需要运行 lint 检查",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "文件已修改，建议运行测试"
  }
}
```

---

## PostToolUseFailure

工具执行失败后触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUseFailure",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite"
  },
  "tool_use_id": "toolu_01ABC123...",
  "error": "Command exited with non-zero status code 1",
  "is_interrupt": false
}
```

### 输出控制

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUseFailure",
    "additionalContext": "测试失败，需要检查相关文件"
  }
}
```

---

## Notification

发送通知时触发。

### Matcher 值

| Matcher | 说明 |
|---------|------|
| `permission_prompt` | 权限请求提示 |
| `idle_prompt` | 空闲提示 |
| `auth_success` | 认证成功 |
| `elicitation_dialog` | 弹出对话框 |

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash",
  "title": "Permission needed",
  "notification_type": "permission_prompt"
}
```

---

## SubagentStart

子代理启动时触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStart",
  "agent_id": "agent-abc123",
  "agent_type": "Explore"
}
```

### 输出控制

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStart",
    "additionalContext": "遵循安全指南执行此任务"
  }
}
```

---

## SubagentStop

子代理完成时触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../abc123.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "def456",
  "agent_type": "Explore",
  "agent_transcript_path": "~/.claude/projects/.../abc123/subagents/agent-def456.jsonl"
}
```

### 输出控制

与 Stop 事件相同。

---

## Stop

主代理完成响应时触发。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": true
}
```

### 输出控制

| 字段 | 说明 |
|------|------|
| `decision` | `"block"` 阻止停止 |
| `reason` | 必须提供，告诉 Claude 为什么继续 |

```json
{
  "decision": "block",
  "reason": "测试尚未通过，请继续修复"
}
```

---

## TeammateIdle

团队成员即将空闲时触发。仅通过 exit code 2 控制。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "TeammateIdle",
  "teammate_name": "researcher",
  "team_name": "my-project"
}
```

### 输出控制

仅支持 exit code，不支持 JSON：

```bash
#!/bin/bash
if [ ! -f "./dist/output.js" ]; then
  echo "构建产物缺失，请先运行构建" >&2
  exit 2
fi
exit 0
```

---

## TaskCompleted

任务标记为完成时触发。仅通过 exit code 2 控制。

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "TaskCompleted",
  "task_id": "task-001",
  "task_subject": "Implement user authentication",
  "task_description": "Add login and signup endpoints",
  "teammate_name": "implementer",
  "team_name": "my-project"
}
```

### 输出控制

```bash
#!/bin/bash
INPUT=$(cat)
TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject')

if ! npm test 2>&1; then
  echo "测试未通过，请修复后再完成任务: $TASK_SUBJECT" >&2
  exit 2
fi
exit 0
```

---

## PreCompact

上下文压缩前触发。

### Matcher 值

| Matcher | 触发时机 |
|---------|---------|
| `manual` | `/compact` 命令 |
| `auto` | 自动压缩 |

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PreCompact",
  "trigger": "manual",
  "custom_instructions": ""
}
```

---

## SessionEnd

会话终止时触发。

### Matcher 值 (reason)

| Reason | 说明 |
|--------|------|
| `clear` | `/clear` 命令 |
| `logout` | 用户登出 |
| `prompt_input_exit` | 用户在输入提示时退出 |
| `bypass_permissions_disabled` | 绕过权限模式被禁用 |
| `other` | 其他原因 |

### 输入示例

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "SessionEnd",
  "reason": "other"
}
```

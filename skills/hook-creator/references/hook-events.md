# Claude Code Hook 事件类型

## 事件列表

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| UserPromptSubmit | 用户提交提示后 | 日志记录、输入验证 |
| PreToolUse | 工具执行前 | 拦截、验证、修改输入 |
| PostToolUse | 工具执行后 | 日志记录、结果处理 |
| Notification | 发送通知时 | 自定义通知处理 |
| Stop | 会话停止时 | 清理资源、总结报告 |

## 事件详情

### UserPromptSubmit

用户提交提示后立即触发。

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "用户输入的提示内容"
}
```

**常见用途**: 记录用户输入、内容审核、触发自动化流程

### PreToolUse

工具执行前触发，可以拦截或修改工具调用。

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /"
  }
}
```

**拦截方式**: 在 stdout 输出 JSON `{"decision": "deny", "reason": "拒绝原因"}`

**常见用途**: 安全检查、敏感操作拦截、输入验证

### PostToolUse

工具执行后触发。

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file", "content": "..." },
  "tool_response": { "success": true }
}
```

**常见用途**: 日志记录、触发后续操作、结果分析

### Notification

发送通知时触发。

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "Notification",
  "notification": "任务完成"
}
```

**常见用途**: 自定义通知渠道、集成外部系统

### Stop

会话停止时触发。

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "Stop",
  "stop_hook_name": "用户停止原因"
}
```

**常见用途**: 清理资源、生成报告、状态保存

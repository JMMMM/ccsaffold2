# Hook Input Contract: 会话内容记录功能

**Feature**: 001-session-logging
**Date**: 2026-02-11
**Version**: 1.0.0

## 概述

本文档定义 Claude Code Hooks 的输入数据结构契约。Hook 脚本通过 stdin 接收 JSON 格式的输入数据。

## UserPromptSubmit 事件

### 触发时机

用户在 Claude Code 中提交提示时触发。

### 输入数据结构

```json
{
  "event": "UserPromptSubmit",
  "data": {
    "prompt": "string - 用户输入的提示内容",
    "session_id": "string - 会话唯一标识符"
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event | string | 是 | 事件名称，固定为 "UserPromptSubmit" |
| data.prompt | string | 是 | 用户输入的完整提示内容 |
| data.session_id | string | 是 | 会话ID，用于关联同一会话的记录 |

### 示例

```json
{
  "event": "UserPromptSubmit",
  "data": {
    "prompt": "请帮我创建一个React按钮组件",
    "session_id": "sess_abc123"
  }
}
```

---

## PostToolUse 事件

### 触发时机

Claude AI 使用工具执行完成后触发。

### 输入数据结构

```json
{
  "event": "PostToolUse",
  "data": {
    "tool": "string - 工具名称",
    "tool_input": "object - 工具输入参数",
    "tool_result": "string | object - 工具执行结果",
    "session_id": "string - 会话唯一标识符"
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event | string | 是 | 事件名称，固定为 "PostToolUse" |
| data.tool | string | 是 | 工具名称，如 Edit, Write, Bash |
| data.tool_input | object | 是 | 工具接收的输入参数 |
| data.tool_result | any | 是 | 工具执行返回的结果 |
| data.session_id | string | 是 | 会话ID |

### 常用工具输入结构

#### Edit 工具

```json
{
  "tool": "Edit",
  "tool_input": {
    "file_path": "string - 文件绝对路径",
    "old_string": "string - 要替换的内容",
    "new_string": "string - 替换后的内容"
  }
}
```

#### Write 工具

```json
{
  "tool": "Write",
  "tool_input": {
    "file_path": "string - 文件绝对路径",
    "content": "string - 文件内容"
  }
}
```

#### Bash 工具

```json
{
  "tool": "Bash",
  "tool_input": {
    "command": "string - 要执行的命令",
    "description": "string - 命令描述"
  }
}
```

### 示例

```json
{
  "event": "PostToolUse",
  "data": {
    "tool": "Edit",
    "tool_input": {
      "file_path": "/Users/user/project/src/index.js",
      "old_string": "const x = 1;",
      "new_string": "const x = 2;"
    },
    "tool_result": "Successfully edited file",
    "session_id": "sess_abc123"
  }
}
```

---

## 环境变量

Hook 脚本可访问以下环境变量：

| 变量名 | 说明 |
|--------|------|
| CLAUDE_PROJECT_ROOT | 当前项目根目录的绝对路径 |
| PWD | 当前工作目录 |

---

## 退出码约定

| 退出码 | 含义 |
|--------|------|
| 0 | 成功执行 |
| 1 | 执行失败（非阻塞错误） |
| 2 | 配置错误 |

**注意**: Hook 执行失败不会阻塞 Claude Code 的正常流程。

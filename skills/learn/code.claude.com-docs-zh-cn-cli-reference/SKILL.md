---
name: code.claude.com-docs-zh-cn-cli-reference
description: code.claude.com 网站内容缓存
source_url: https://code.claude.com/docs/zh-CN/cli-reference
cached_at: 2026-02-13T01:10:00.000Z
---

# code.claude.com 知识摘要

## Claude Code CLI 参考

### 常用命令

| 命令 | 用途 |
|------|------|
| `claude` | 启动交互式 REPL |
| `claude -p "query"` | 非交互模式，打印响应后退出 |
| `claude -c` | 继续最近的对话 |
| `claude -r "session"` | 按ID/名称恢复会话 |
| `claude update` | 更新版本 |
| `claude mcp` | 配置MCP服务器 |

### 关键标志

**会话控制**
- `--continue`, `-c`: 继续最近对话
- `--resume`, `-r`: 恢复特定会话
- `--fork-session`: 恢复时创建新会话ID
- `--session-id`: 指定会话UUID

**工具权限**
- `--allowedTools`: 免权限的工具（如 `"Bash(git log *)"`）
- `--disallowedTools`: 禁用的工具
- `--dangerously-skip-permissions`: 跳过所有权限提示
- `--permission-mode`: 指定权限模式

**系统提示**
- `--system-prompt`: 替换整个系统提示
- `--append-system-prompt`: 追加到默认提示（推荐）
- `--system-prompt-file`: 从文件加载替换
- `--append-system-prompt-file`: 从文件追加

**模型与输出**
- `--model`: 设置模型（sonnet/opus或完整名称）
- `--fallback-model`: 回退模型
- `--output-format`: 输出格式（text/json/stream-json）
- `--max-turns`: 限制转数（仅打印模式）
- `--max-budget-usd`: 预算限制

**插件与配置**
- `--plugin-dir`: 加载插件目录
- `--mcp-config`: 加载MCP配置
- `--settings`: 加载设置文件
- `--add-dir`: 添加工作目录

**调试**
- `--verbose`: 详细日志
- `--debug`: 调试模式（可过滤类别）

### 自定义 Subagents

```bash
claude --agents '{
  "reviewer": {
    "description": "代码审查专家",
    "prompt": "You are a code reviewer...",
    "tools": ["Read", "Grep", "Bash"],
    "model": "sonnet"
  }
}'
```

### 最佳实践

1. **添加指令**: 用 `--append-system-prompt` 而非 `--system-prompt`，保留默认行为
2. **管道处理**: `cat file | claude -p "explain"`
3. **会话管理**: 用 `-c` 继续，`-r` 恢复特定会话
4. **CI/CD**: 用 `-p` 非交互模式，配合 `--output-format json`

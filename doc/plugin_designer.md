# ccsaffold 插件设计文档

## 概述

ccsaffold 是一个 Claude Code 脚手架插件，提供 speckit 工作流、session 日志和 Agent Skills 功能。本插件符合 Claude Code 官方插件规范，可通过市场分享或本地安装。

## 插件结构

```text
ccsaffold/
├── .claude-plugin/
│   └── plugin.json           # 插件清单（元数据）
├── commands/                 # Slash 命令
│   ├── speckit.specify.md
│   ├── speckit.plan.md
│   ├── speckit.tasks.md
│   ├── speckit.implement.md
│   ├── speckit.clarify.md
│   ├── speckit.analyze.md
│   ├── speckit.constitution.md
│   ├── speckit.checklist.md
│   └── speckit.taskstoissues.md
├── hooks/                    # 事件处理程序
│   ├── hooks.json            # Hook 配置
│   └── log-user-prompt.js    # Session 日志 hook
├── skills/                   # Agent Skills
│   └── hook-creator/
│       ├── SKILL.md
│       └── assets/templates/
├── .specify/                 # speckit 工作流支持
│   ├── memory/
│   ├── scripts/
│   └── templates/
└── README.md                 # 安装使用文档
```

## 安装方式

### 本地测试

```bash
claude --plugin-dir ./ccsaffold
```

### 市场安装

```bash
claude /plugin install ccsaffold
```

## Claude Code 插件规范

### 目录结构要求

| 目录 | 位置 | 目的 |
|------|------|------|
| `.claude-plugin/` | 插件根目录 | 包含 plugin.json 清单 |
| `commands/` | 插件根目录 | Slash 命令（Markdown 文件） |
| `agents/` | 插件根目录 | 自定义 agent 定义 |
| `skills/` | 插件根目录 | Agent Skills（SKILL.md 文件） |
| `hooks/` | 插件根目录 | hooks.json 中的事件处理程序 |
| `.mcp.json` | 插件根目录 | MCP server 配置 |
| `.lsp.json` | 插件根目录 | LSP server 配置 |

### plugin.json 格式

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "author-name",
  "license": "MIT"
}
```

### 命名空间

- 插件命令格式：`/plugin-name:command-name`
- 例如：`/ccsaffold:speckit.specify`
- 命名空间防止插件之间的冲突

### hooks.json 格式

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node hooks/log-user-prompt.js"
      }]
    }]
  }
}
```

## 版本历史

### v1.0.0 (2026-02-12)

- 初始版本
- 包含 9 个 speckit 工作流命令
- 包含 session 日志 hooks
- 包含 hook-creator Agent Skill

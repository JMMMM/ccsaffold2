# Data Model: ccsaffold Plugin Standardization

**Date**: 2026-02-12
**Branch**: 003-plugin-standardize

## Overview

ccsaffold 插件是一个无状态插件，主要通过文件系统存储配置和运行时数据。本文档描述插件涉及的主要数据实体及其结构。

## Entities

### 1. Plugin Manifest (plugin.json)

插件元数据，定义插件的基本信息。

**Fields**:

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| name | string | YES | 插件名称，用于命名空间 |
| version | string | YES | 语义版本号 (semver) |
| description | string | YES | 插件功能描述 |
| author | string | NO | 作者名称 |
| license | string | NO | 许可证类型 |
| repository | string | NO | 代码仓库地址 |

**Example**:
```json
{
  "name": "ccsaffold",
  "version": "1.0.0",
  "description": "Claude Code 脚手架插件",
  "author": "ming",
  "license": "MIT"
}
```

**Validation Rules**:
- name: 必须是小写字母、数字、连字符
- version: 必须符合 semver 格式 (X.Y.Z)

---

### 2. Hook Configuration (hooks.json)

定义 hook 事件处理程序配置。

**Fields**:

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| hooks | object | YES | Hook 事件映射 |
| hooks.[eventType] | array | YES | 事件处理器列表 |
| matcher | string | YES | 匹配模式 |
| hooks[].type | string | YES | 处理器类型 (command) |
| hooks[].command | string | YES | 执行命令 |

**Example**:
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

**Validation Rules**:
- eventType: 必须是有效的 Claude Code 事件类型
- command: 必须是可执行的命令路径

---

### 3. Command (Markdown File)

用户可调用的 slash 命令定义。

**Structure**:
```markdown
---
name: command-name
description: Command description
---

## User Input

[Command instructions and workflow]
```

**Fields** (Frontmatter):

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| name | string | YES | 命令名称（不含插件前缀） |
| description | string | NO | 命令描述 |

**File Location**: `commands/{name}.md`

**Naming Convention**: `speckit.{action}` 格式

---

### 4. Agent Skill (SKILL.md)

Claude 可自动调用的能力定义。

**Structure**:
```markdown
---
name: skill-name
description: Skill description for auto-invocation
---

[Skill instructions]
```

**Fields** (Frontmatter):

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| name | string | YES | Skill 名称 |
| description | string | YES | 用于自动调用的描述 |

**File Location**: `skills/{skill-name}/SKILL.md`

---

### 5. Session Log (Runtime Data)

Hook 运行时产生的会话日志数据。

**Storage Location**: `doc/session_log/{date}.txt`

**Format**:
```
[YYYY-MM-DD HH:mm:ss] User Prompt: {prompt content}
```

**Note**: 会话日志是运行时数据，不属于插件结构的一部分。

---

## Relationships

```
plugin.json
    │
    ├── defines ──> commands/ (Command files)
    │
    ├── defines ──> hooks/hooks.json (Hook Configuration)
    │                    │
    │                    └── references ──> hooks/*.js (Hook Scripts)
    │
    └── defines ──> skills/*/SKILL.md (Agent Skills)
```

## Directory Structure Summary

```
ccsaffold/
├── .claude-plugin/
│   └── plugin.json          # Plugin Manifest
├── commands/
│   ├── speckit.specify.md   # Command
│   ├── speckit.plan.md      # Command
│   └── ...                  # More commands
├── hooks/
│   ├── hooks.json           # Hook Configuration
│   └── log-user-prompt.js   # Hook Script
├── skills/
│   └── hook-creator/
│       ├── SKILL.md         # Agent Skill
│       └── assets/          # Skill assets
└── README.md                # Documentation
```

## Data Flow

1. **Plugin Loading**:
   - Claude Code 读取 `.claude-plugin/plugin.json`
   - 加载 `commands/` 目录下的命令
   - 加载 `hooks/hooks.json` 配置
   - 加载 `skills/` 目录下的 Agent Skills

2. **Command Execution**:
   - 用户输入 `/ccsaffold:command-name`
   - Claude Code 查找 `commands/command-name.md`
   - 执行命令定义的工作流

3. **Hook Triggering**:
   - 触发 Claude Code 事件（如 UserPromptSubmit）
   - 匹配 `hooks/hooks.json` 中的配置
   - 执行对应的 hook 脚本

4. **Skill Invocation**:
   - Claude 根据任务上下文匹配 skill description
   - 自动调用相应的 Agent Skill

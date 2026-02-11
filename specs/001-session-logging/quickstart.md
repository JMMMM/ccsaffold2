# Quick Start: 会话内容记录功能

**Feature**: 001-session-logging
**Date**: 2026-02-11

## 前置条件

- Node.js 18+ (LTS)
- Claude Code CLI

## 安装步骤

### 1. 复制功能文件

将以下文件复制到目标项目：

```bash
# 从本仓库复制到目标项目
cp -r src/hooks <target-project>/src/
cp -r src/lib <target-project>/src/
```

### 2. 配置 Hooks

在目标项目的 `.claude/settings.json` 中添加 hooks 配置：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PROJECT_ROOT}/src/hooks/log-user-prompt.js"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "!(Grep|Glob|WebSearch|WebFetch|Read|Task)",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PROJECT_ROOT}/src/hooks/log-tool-use.js"
        }]
      }
    ]
  }
}
```

### 3. 创建日志目录

```bash
mkdir -p <target-project>/.claude/conversations
```

## 验证安装

### 1. 提交测试提示

在 Claude Code 中输入任意提示：

```
hello
```

### 2. 检查日志文件

```bash
cat .claude/conversations/conversation.txt
```

预期输出类似：

```
user> hello
claude> [Bash] cat .claude/conversations/conversation.txt
```

## 使用说明

### 日志格式

| 前缀 | 含义 |
|------|------|
| `user>` | 用户提交的提示 |
| `claude>` | Claude AI 使用的工具 |

### 自动滚动

当 `user>` 行数超过 100 行时，系统自动删除最早的约 1/3 内容。

### 排除的工具

以下工具使用不会被记录（避免日志膨胀）：

- Grep - 文件内容搜索
- Glob - 文件模式匹配
- WebSearch - 网络搜索
- WebFetch - 网页获取
- Read - 文件读取
- Task - 子Agent任务

## 常见问题

### Q: 日志文件不生成？

检查：
1. `.claude/conversations/` 目录是否存在
2. `settings.json` 配置是否正确
3. Node.js 是否在 PATH 中

### Q: 日志内容过多？

手动清理日志文件：

```bash
# 清空日志
> .claude/conversations/conversation.txt

# 或删除部分内容
head -n 50 .claude/conversations/conversation.txt > temp.txt
mv temp.txt .claude/conversations/conversation.txt
```

### Q: 如何禁用日志功能？

移除 `settings.json` 中的 hooks 配置即可。

## 项目结构

```
<project>/
├── .claude/
│   ├── settings.json           # Hook配置
│   └── conversations/
│       └── conversation.txt    # 会话日志
└── src/
    ├── hooks/
    │   ├── log-user-prompt.js  # 用户提示记录
    │   └── log-tool-use.js     # 工具使用记录
    └── lib/
        ├── logger.js           # 核心日志模块
        └── file-utils.js       # 文件工具模块
```

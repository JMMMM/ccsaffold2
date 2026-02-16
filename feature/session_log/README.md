# Session Log Feature

会话内容记录功能，通过 Claude Code hooks 自动记录用户提示和 AI 工具使用情况。

## 功能说明

- **UserPromptSubmit**: 记录用户提交的提示，以 `user>` 前缀标识
- **PostToolUse**: 记录 AI 工具使用，以 `[tool]` 前缀标识
- **自动排除**: Grep、Glob、WebSearch、WebFetch、Read、Task 等查询类工具（通过 matcher 配置）
- **跨平台**: 支持 Windows、macOS、Linux

## 目录结构

```
feature/session_log/
├── hooks/
│   └── session-logger.js      # 统一日志脚本 → 复制到 .claude/hooks/
├── scripts/
│   └── install.sh             # 安装脚本
├── settings.json              # Hooks 配置 → 合并到 .claude/settings.json
└── README.md
```

## 安装方法

### 方法一：一键安装

```bash
./feature/session_log/scripts/install.sh
```

### 方法二：手动安装

```bash
# 1. 创建目录
mkdir -p .claude/hooks .claude/conversations

# 2. 复制脚本
cp feature/session_log/hooks/session-logger.js .claude/hooks/

# 3. 合并 settings.json（手动添加或使用 node 合并）
```

## settings.json 配置

将以下内容合并到项目的 `.claude/settings.json`：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/session-logger.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "!(Grep|Glob|WebSearch|WebFetch|Read|Task)",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/session-logger.js"
          }
        ]
      }
    ]
  }
}
```

**注意**: 使用相对路径 `.claude/hooks/session-logger.js`，不要使用环境变量。

## 日志格式

日志文件位置：`.claude/conversations/conversation.txt`

```
user> 用户提交的提示内容
[Bash] npm test
user> 下一个提示
[Edit] Button.tsx
[Write] helper.js
```

## 排除的工具

通过 matcher 配置排除，以下工具不会被记录：

| 工具 | matcher 规则 |
|------|-------------|
| Grep | `!(...)` 排除 |
| Glob | `!(...)` 排除 |
| WebSearch | `!(...)` 排除 |
| WebFetch | `!(...)` 排除 |
| Read | `!(...)` 排除 |
| Task | `!(...)` 排除 |

## 设计要点

1. **单脚本设计**: 一个 `session-logger.js` 处理所有事件，简化部署
2. **matcher 过滤**: 排除逻辑在 settings.json 中配置，脚本保持简洁
3. **无外部依赖**: 仅使用 Node.js 内置模块
4. **相对路径**: 使用 `__dirname` 解析路径，不依赖工作目录

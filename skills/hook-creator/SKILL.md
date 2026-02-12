---
name: hook-creator
description: Create Claude Code hooks and configurations. Triggers when user wants to create hooks, add automation, or implement event handlers for UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop events.
---

# Hook Creator

引导用户创建 Claude Code 钩子脚本和配置。

## 创建流程

### 1. 确认需求

询问用户：
- **事件类型**: 需要监听哪个事件？(参见 [hook-events.md](references/hook-events.md))
- **脚本语言**: Node.js / Python / Bash?
- **输出格式**: 功能模块 (feature/) 还是直接安装到 .claude/?
- **具体功能**: 钩子需要实现什么逻辑？

### 2. 选择模板

根据语言选择模板：
- Node.js: [assets/templates/nodejs/hook.js](assets/templates/nodejs/hook.js)
- Python: [assets/templates/python/hook.py](assets/templates/python/hook.py)
- Bash: [assets/templates/bash/hook.sh](assets/templates/bash/hook.sh)

### 3. 生成输出

根据用户选择的输出格式：

**功能模块 (feature/)**:
```
feature/[feature-name]/
├── hooks/
│   └── hook.js          # 钩子脚本
├── scripts/
│   └── install.sh       # 安装脚本
├── settings.json        # 配置片段
└── README.md
```

**直接安装 (.claude/)**:
- 复制脚本到 `.claude/hooks/`
- 合并配置到 `.claude/settings.json`

## 配置示例

settings.json 结构：

```json
{
  "hooks": {
    "事件类型": [{
      "matcher": "匹配规则",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/hook.js"
      }]
    }]
  }
}
```

**matcher 规则**:
- `*` - 匹配所有
- `Bash|Write|Edit` - 匹配指定工具
- `^(?!Read|Grep).*$` - 排除指定工具

## 参考文档

- [hook-events.md](references/hook-events.md) - 事件类型详解
- [input-format.md](references/input-format.md) - stdin 输入格式
- [settings.json](assets/templates/settings.json) - 配置模板

## 注意事项

1. **路径问题**: settings.json 不支持环境变量，使用相对路径
2. **必须退出**: Hook 脚本必须 `exit 0`，否则会阻塞
3. **错误处理**: 用 try-catch 包裹所有可能出错的操作
4. **目录创建**: 写文件前确保目录存在 `mkdir -p` / `fs.mkdirSync(..., { recursive: true })`

# Hook Session Log 功能

在所有 Claude Code hook 节点记录 stdin 原始内容到日志文件。

## 功能特性

- 记录所有 6 种 Claude Code hook 事件：UserPromptSubmit、PreToolUse、PostToolUse、Notification、Stop、SessionEnd
- 输出 stdin 原始 JSON 内容，不做任何处理
- 日志文件按日期存储：`doc/session_log/session_log_YYYYMMDD.md`
- 跨平台兼容：Windows、macOS、Linux
- 与现有 hooks 共存

## 安装

### 方法 1: 使用安装脚本

```bash
cd /path/to/project
bash feature/hook-session-log/scripts/install.sh
```

### 方法 2: 手动安装

1. 复制 hook 脚本：
```bash
mkdir -p .claude/hooks
cp feature/hook-session-log/hooks/session-log.js .claude/hooks/
```

2. 合并 settings.json：
   - 将 `feature/hook-session-log/settings.json` 的 hooks 配置合并到 `.claude/settings.json`

3. 创建日志目录：
```bash
mkdir -p doc/session_log
```

## 验证

```bash
bash feature/hook-session-log/scripts/verify.sh
```

## 日志文件格式

日志文件存储在 `doc/session_log/` 目录，按日期命名。

每条日志条目格式：

```markdown
## [2026-02-12T12:34:56.789Z] UserPromptSubmit

```json
{
  "session_id": "abc123",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "用户输入内容..."
}
```

---
```

## 文件结构

```
feature/hook-session-log/
├── hooks/
│   └── session-log.js       # 主日志脚本
├── scripts/
│   ├── install.sh           # 安装脚本
│   └── verify.sh            # 验证脚本
├── settings.json            # Hook 配置片段
└── README.md                # 本文件
```

## 与现有功能兼容

此功能与以下现有 hooks 共存：

- `session-logger.js` - 原有的会话日志功能
- `auto-learning.js` - 自动学习功能

## 技术规格

- **语言**: Node.js 18+ (LTS)
- **依赖**: 无外部依赖，使用 Node.js 内置模块
- **性能**: 每条日志记录 < 100ms

## 卸载

1. 从 `.claude/settings.json` 中移除 session-log 相关配置
2. 删除 `.claude/hooks/session-log.js`
3. （可选）删除 `doc/session_log/` 目录

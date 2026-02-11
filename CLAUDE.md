# ccsaffold2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-11

## Active Technologies

- Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process） (001-session-logging)

## Project Structure

```text
src/
├── hooks/           # Hook 脚本开发目录
├── lib/             # 核心库模块
tests/
├── unit/
└── integration/

feature/             # 功能模块存储目录
└── [feature-name]/  # 独立功能模块
    ├── hooks/       # → 复制到 .claude/hooks/
    ├── lib/         # → 复制到 .claude/lib/
    ├── scripts/     # 安装/验证脚本
    ├── settings.json # → 合并到 .claude/settings.json
    └── README.md

.claude/             # Claude Code 配置目录
├── hooks/           # Hook 脚本（运行时）
├── lib/             # 核心库（运行时）
├── conversations/   # 会话日志
└── settings.json    # Hooks 配置
```

## Commands

# Add commands for Node.js 18+ (LTS)

## Code Style

Node.js 18+ (LTS): Follow standard conventions

## Claude Code Hooks 开发经验

### settings.json 配置要点

1. **使用相对路径**: `settings.json` 不支持环境变量（如 `${CLAUDE_PROJECT_ROOT}`），必须使用相对路径
   ```json
   {
     "hooks": {
       "UserPromptSubmit": [{
         "matcher": "*",
         "hooks": [{ "type": "command", "command": "node .claude/hooks/log-user-prompt.js" }]
       }]
     }
   }
   ```

2. **Hook 脚本路径解析**: 在脚本中使用 `__dirname` 获取脚本所在目录，避免依赖工作目录
   ```javascript
   const logFile = path.join(__dirname, '..', 'conversations', 'conversation.txt');
   ```

3. **输入格式兼容**: Hook 接收的 stdin JSON 可能有多种格式，需要兼容处理
   ```javascript
   const prompt = input.prompt || (input.data && input.data.prompt);
   ```

4. **错误处理**: Hook 必须始终以 `process.exit(0)` 退出，避免阻塞 Claude Code

### Hook 开发最佳实践

- 保持脚本简洁，避免外部依赖
- 使用 `try-catch` 包裹所有可能出错的操作
- 文件操作前确保目录存在 (`fs.mkdirSync(..., { recursive: true })`)
- 异步操作使用 Promise 或 async/await，但要确保在 `stdin end` 事件中正确处理

## Recent Changes

- 001-session-logging: Added Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process）

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

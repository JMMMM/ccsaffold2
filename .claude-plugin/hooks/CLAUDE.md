# Hooks 模块

事件处理程序，用于自动执行特定操作。

## 目录结构

```
hooks/
├── hooks.json              # hooks 配置（使用 ${CLAUDE_PLUGIN_ROOT}）
├── session-logger.js       # 会话日志记录
├── auto-learning.js        # 自动学习调度器（异步）
└── auto-learning-worker.js # 自动学习工作进程
```

## 代码文件

### session-logger.js

功能描述：记录用户输入和工具调用到 conversations 目录

| 方法/函数 | 说明 |
|-----------|------|
| `stdin.on('data')` | 接收 stdin 数据 |
| `stdin.on('end')` | 解析输入，写入日志文件 |

**输入格式**:
- `UserPromptSubmit`: 记录用户输入
- `PostToolUse`: 记录工具调用（排除只读查询类）

**输出格式**:
```
UserPromptSubmit>{prompt}
PostToolUse>{"tool_name":"xxx","tool_input":{...},"tool_response":{...}}
```

### auto-learning.js

功能描述：SessionEnd 事件的异步调度器，立即返回并启动后台工作进程

| 方法/函数 | 说明 |
|-----------|------|
| `main()` | 主入口，读取 stdin 并处理 |
| `processHook(inputData)` | 解析输入并验证事件类型 |
| `spawnWorker(sessionId, cwd)` | 启动 detached 子进程执行学习 |
| `parseInput(data)` | 解析 JSON 输入 |

**特点**:
- 立即返回 `process.exit(0)`，不阻塞会话结束
- 使用 `detached: true` 和 `unref()` 实现异步执行

### auto-learning-worker.js

功能描述：后台工作进程，执行实际的会话分析

| 方法/函数 | 说明 |
|-----------|------|
| `main()` | 主入口，读取配置并执行学习 |
| `performLearning(sessionId, cwd, logger)` | 读取会话、过滤敏感信息、调用 API |

**流程**:
1. 读取会话文件
2. 过滤敏感信息
3. 调用 BigModel API 分析
4. 创建 Skill 或功能文档

## Hooks 配置

### hooks.json

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-logger.js\"" }]
    }],
    "PostToolUse": [{
      "matcher": "^(?!Read|Grep|Glob|WebSearch|...).*$",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-logger.js\"" }]
    }],
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/auto-learning.js\"" }]
    }]
  }
}
```

## 开发规范

### settings.json 配置要点

1. **使用相对路径**: `settings.json` 不支持环境变量，必须使用相对路径
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

2. **Hook 脚本路径解析**: 在脚本中使用 `__dirname` 获取脚本所在目录
   ```javascript
   const logFile = path.join(__dirname, '..', 'conversations', 'conversation.txt');
   ```

3. **输入格式兼容**: Hook 接收的 stdin JSON 可能有多种格式
   ```javascript
   const prompt = input.prompt || (input.data && input.data.prompt);
   ```

4. **错误处理**: Hook 必须始终以 `process.exit(0)` 退出

### 最佳实践

- 保持脚本简洁，避免外部依赖
- 使用 `try-catch` 包裹所有可能出错的操作
- 文件操作前确保目录存在 (`fs.mkdirSync(..., { recursive: true })`)
- 异步操作使用 Promise 或 async/await

## 功能列表

| Hook | 描述 |
|------|------|
| `UserPromptSubmit` | 记录用户输入到 `.claude/conversations/` |
| `PostToolUse` | 记录AI工具调用（排除只读查询类工具） |
| `SessionEnd` | 异步分析会话内容，生成可复用的skill |

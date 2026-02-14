# Lib 模块

核心依赖库，提供共享功能。

## 目录结构

```
lib/
├── claude-cli-client.js     # Claude CLI / BigModel API 调用客户端
├── conversation-reader.js   # 会话内容读取
├── learning-logger.js       # 学习日志记录器
├── sensitive-filter.js      # 敏感信息过滤
├── skill-generator.js       # Skill 文件生成
└── transcript-reader.js     # 会话转录文件读取
```

## 代码文件

### claude-cli-client.js

功能描述：调用 BigModel API（智谱AI）执行学习分析，支持 HTTP API 方式

| 方法/函数 | 说明 |
|-----------|------|
| `getApiKey()` | 获取环境变量中的 API 密钥 |
| `isAvailable()` | 检查 API 是否可用 |
| `checkAvailability()` | 异步检查 API 可用性 |
| `buildLearningPrompt(cwd)` | 构建学习分析的提示词 |
| `parseJsonResult(output)` | 从 LLM 输出解析 JSON 结果 |
| `writeLearningFile(result, cwd, logger)` | 根据学习结果写入文件 |
| `executeLearning(content, cwd, options, logger)` | 执行学习分析（HTTP API） |
| `executeLearningWithFile(filePath, cwd, options, logger)` | 读取文件并执行学习分析 |

### conversation-reader.js

功能描述：读取和解析会话日志文件

| 方法/函数 | 说明 |
|-----------|------|
| `parseFile(filePath)` | 解析会话文件，返回结构化数据 |
| `extractConversationText(data, maxEvents)` | 提取会话文本（最新N条） |
| `readBySessionId(cwd, sessionId)` | 根据 session_id 读取会话 |
| `getConversationPath(cwd, sessionId)` | 获取会话文件路径 |
| `hasEnoughPrompts(data, minCount)` | 检查是否有足够的用户输入 |

### learning-logger.js

功能描述：提供结构化日志记录，输出 JSON Lines 格式

| 方法/函数 | 说明 |
|-----------|------|
| `createLogger(sessionId, cwd)` | 创建日志记录器实例 |
| `logger.log(level, step, message, data)` | 记录日志 |
| `logger.logError(step, message, error)` | 记录错误日志 |
| `logger.logStep(step, message, data, startTime)` | 记录步骤完成（带耗时） |
| `logger.getLogPath()` | 获取日志文件路径 |

### sensitive-filter.js

功能描述：使用正则表达式过滤敏感信息

| 方法/函数 | 说明 |
|-----------|------|
| `filter(text)` | 过滤敏感信息，替换为 [REDACTED] |
| `getPatterns()` | 获取所有过滤正则表达式 |
| `hasSensitive(text)` | 检查文本是否包含敏感信息 |

### skill-generator.js

功能描述：生成 SKILL.md 文件内容

| 方法/函数 | 说明 |
|-----------|------|
| `generateSkill(params)` | 生成 Skill 文件内容 |
| `formatMarkdown(content)` | 格式化 Markdown 内容 |

### transcript-reader.js

功能描述：读取 Claude Code 转录文件（.jsonl）

| 方法/函数 | 说明 |
|-----------|------|
| `readTranscript(filePath)` | 读取转录文件 |
| `parseTranscript(content)` | 解析转录内容 |
| `extractMessages(transcript)` | 提取消息列表 |

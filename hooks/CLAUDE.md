# Hooks 模块

事件处理程序，用于自动执行特定操作。

## 目录结构

```
hooks/
├── hooks.json              # hooks 配置（使用 ${CLAUDE_PLUGIN_ROOT}）
├── session-logger.js       # 会话日志记录
├── auto-learning.js        # 自动学习调度器（异步）
├── auto-learning-worker.js # 自动学习工作进程
├── web-cache-before.js     # Web缓存：检查缓存（PreToolUse）
└── web-cache-after.js      # Web缓存：保存并生成skill（PostToolUse）
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

### web-cache-before.js

功能描述：PreToolUse 检查 web-reader MCP 调用的缓存

| 方法/函数 | 说明 |
|-----------|------|
| `readInput()` | 读取 stdin JSON 输入 |
| `extractUrlFromParams(params)` | 从工具参数提取 URL |
| `checkRefreshRequest(context)` | 检查是否需要刷新缓存 |
| `formatCacheResponse(cacheInfo)` | 格式化缓存响应 |

**流程**:
1. 检查是否为 web-reader 调用
2. 提取 URL 并生成缓存键
3. 检查是否需要刷新
4. 查找现有缓存 skill
5. 如果命中缓存，返回内容阻止 MCP 调用

### web-cache-after.js

功能描述：PostToolUse 处理 web-reader MCP 返回的内容

| 方法/函数 | 说明 |
|-----------|------|
| `generateCacheKey(urlStr)` | 生成缓存键（domain/path-hash） |
| `isDocumentationSite(content, url)` | 判断是否为文档型网站（评分机制） |
| `extractKeyInfo(content)` | 提取标题、章节、代码块等信息 |
| `generateSkillContent(...)` | 生成 skill 文件内容 |
| `generateUserOutput(...)` | 生成用户友好的输出消息 |

**流程**:
1. 读取 web-reader 返回的 URL 和内容
2. 生成缓存键
3. 保存原始 markdown 到 `doc/{cache-key}.md`
4. 分析内容是否为文档型网站
5. 如果是文档型，生成 `skills/learn/{cache-key}/SKILL.md`
6. 输出友好的缓存说明和 skill 使用指南

**文档型网站检测**（评分机制）:

| 检测项 | 权重 | 说明 |
|--------|------|------|
| URL 特征 | +3 | docs.domain.com、/docs/、/api/ 等 |
| 内容结构 | +2 | 标题、代码块、表格、列表 |
| 技术关键词 | +1 | API、函数、方法、参数等 |
| 营销内容 | -5 | 广告、订阅、购买等 |
| 内容长度 | -3 | 内容少于500字符 |

**阈值**: 分数 >= 5 认为是文档型网站

## Hooks 配置

### hooks.json

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-logger.js\"" }]
    }],
    "PostToolUse": [
      {
        "matcher": "^(?!Read|Grep|Glob|WebSearch|...).*$",
        "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/session-logger.js\"" }]
      },
      {
        "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
        "hooks": [{
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/web-cache-after.js\"",
          "timeout": 30
        }]
      }
    ],
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/auto-learning.js\"" }]
    }],
    "PreToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/web-cache-before.js\"" }]
    }]
  }
}
```

## Web Cache 功能说明

### 缓存目录结构

```
.claude/
├── doc/
│   └── {cache-key}.md        # 原始 markdown 存档
└── skills/
    └── learn/
        └── {cache-key}/
            └── SKILL.md      # 生成的 skill（仅文档型网站）
```

### 缓存键格式

```
{domain}                          # 根域名
{domain}/{path-slug}-{hash}       # 带路径的 URL

示例:
- code.claude.com
- code.claude.com/docs-zh-CN-hooks-a1b2c3d4
```

### 使用示例

**用户访问文档**:
```
用户: 访问 https://code.claude.com/docs/zh-CN/hooks
```

**系统自动处理**:
1. 检查缓存（web-cache-before.js）
2. 调用 web-reader MCP 获取内容
3. 保存原始 markdown
4. 检测为文档型网站
5. 生成 skill

**输出给用户**:
```markdown
## 网站内容已缓存

### 缓存信息
| 项目 | 内容 |
|------|------|
| **域名** | code.claude.com |
| **URL** | https://code.claude.com/docs/zh-CN/hooks |

### 文档型网站检测

该网站符合**文档型网站特征**，已自动生成可复用的 Skill。

#### 触发方式
- 访问 **code.claude.com** 的任何 URL
- 询问关于 **Hooks 参考** 的内容

#### 功能说明
1. 快速缓存命中：直接使用本地缓存
2. 离线访问：无需网络连接
3. 上下文增强：AI 可直接引用缓存内容
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
| `PreToolUse` (web-cache-before) | 检查 web-reader 缓存，优先使用已缓存内容 |
| `PostToolUse` (web-cache-after) | 保存网站内容并自动生成 skill |

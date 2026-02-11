# Research: 持续学习 (Continuous Learning)

**Date**: 2026-02-11
**Feature**: 001-continuous-learning

## Research Tasks

### 1. Claude Code sessionEnd Hook 输入格式

**Decision**: 使用 Claude Code 官方 hook 规范

**Findings**:
- sessionEnd hook 在会话结束时触发
- 输入 JSON 包含 `transcript_path` 字段，指向会话记录文件
- 输入 JSON 包含 `cwd` 字段，表示当前工作目录
- 输入 JSON 包含 `session_id` 字段，唯一标识会话

**Expected Input Format**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/.claude/transcripts/xxx.jsonl",
  "cwd": "/Users/xxx/project",
  "hook_event_name": "sessionEnd"
}
```

**Rationale**: 参考 CLAUDE.md 中已有的 session-logger.js 实现，保持一致的输入处理方式。

**Alternatives Considered**:
- PostToolUse hook：不适用，因为需要在会话结束时触发
- 自定义事件：不可行，必须使用 Claude Code 支持的 hook 事件

---

### 2. Transcript 文件格式

**Decision**: 解析 JSONL 格式，提取用户消息和 AI 响应

**Findings**:
- Transcript 文件为 JSONL 格式（每行一个 JSON 对象）
- 每条记录包含 `role`（user/assistant）和 `content` 字段
- 可能包含工具调用记录

**Example Record**:
```json
{"type": "user", "message": {"content": "帮我修复这个bug"}}
{"type": "assistant", "message": {"content": "我来分析一下..."}}
{"type": "tool_use", "tool": "Edit", "input": {...}}
```

**Rationale**: JSONL 格式易于逐行解析，适合大文件处理。

**Alternatives Considered**:
- 完整 JSON 解析：可能导致内存问题，不适合大文件

---

### 3. LLM API 调用方式

**Decision**: 使用 Node.js 内置 https 模块调用 Anthropic API

**Findings**:
- Node.js 18+ 内置 https 模块，无需外部依赖
- Anthropic API 支持 POST 请求，请求体为 JSON
- 需要设置 `anthropic-dangerous-direct-browser-access` 头（如果在浏览器环境）

**Implementation Approach**:
```javascript
const https = require('https');

function callLLM(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
```

**Rationale**: 遵循项目"无外部依赖"原则，使用 Node.js 内置模块。

**Alternatives Considered**:
- axios/fetch：需要外部依赖，违反宪章要求
- child_process 调用 curl：跨平台兼容性问题

---

### 4. 敏感信息过滤策略

**Decision**: 使用正则表达式匹配常见敏感模式

**Findings**:
- 常见敏感信息模式：
  - API Key: `sk-[a-zA-Z0-9]{20,}`, `[a-zA-Z0-9]{32,}`
  - 密码: `password["']?\s*[:=]\s*["'][^"']+["']`
  - Token: `token["']?\s*[:=]\s*["'][^"']+["']`
  - 私钥: `-----BEGIN.*PRIVATE KEY-----`

**Implementation Approach**:
```javascript
const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,                    // API keys
  /password["']?\s*[:=]\s*["'][^"']+["']/gi, // passwords
  /token["']?\s*[:=]\s*["'][^"']+["']/gi,    // tokens
  /-----BEGIN.*PRIVATE KEY-----/g,           // private keys
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // emails (optional)
];

function filterSensitive(text) {
  let filtered = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, '[REDACTED]');
  }
  return filtered;
}
```

**Rationale**: 简单有效的过滤策略，覆盖常见敏感信息类型。

**Alternatives Considered**:
- NLP 实体识别：过于复杂，增加依赖
- 上下文感知过滤：实现复杂度高

---

### 5. 学习内容识别策略

**Decision**: 通过 LLM 识别"多次迭代修复"模式

**Findings**:
- 关键特征：
  - 用户多次尝试同一任务
  - AI 多次提供不同方案
  - 最终有明确的成功确认
- 可以通过提示词工程引导 LLM 识别

**Prompt Template**:
```
分析以下会话记录，识别出用户需要多次反复沟通才能最终解决的问题。

对于每个识别出的问题，请提供：
1. 问题描述：简要描述遇到的问题
2. 解决方案：最终有效的解决方法
3. 关键步骤：解决问题的主要步骤
4. 触发关键词：用户可能用什么词触发这个场景

会话记录：
{transcript_content}

请以 JSON 格式返回识别到的问题列表：
[
  {
    "name": "skill名称",
    "description": "简短描述",
    "problem": "问题描述",
    "solution": "解决方案",
    "steps": ["步骤1", "步骤2"],
    "keywords": ["关键词1", "关键词2"]
  }
]

如果没有识别到需要学习的内容，返回空数组 []
```

**Rationale**: 利用 LLM 的理解能力，无需硬编码规则，更具灵活性。

**Alternatives Considered**:
- 正则匹配：无法理解语义
- 统计分析：无法理解上下文

---

### 6. Skill 文件命名策略

**Decision**: 使用 kebab-case 格式，基于 skill 内容生成

**Findings**:
- 文件名应具有描述性
- 使用 kebab-case 保证跨平台兼容
- 避免特殊字符

**Naming Convention**:
- 格式: `{topic}-{action}.md`
- 示例: `api-debug-configuration.md`, `git-conflict-resolution.md`
- 文件名由 LLM 生成的 skill name 转换而来

**Rationale**: 清晰的命名便于用户识别和管理。

**Alternatives Considered**:
- 时间戳命名：不直观
- UUID 命名：不便于人工管理

---

## Summary

| 研究项 | 决策 | 关键考虑 |
|--------|------|----------|
| Hook 输入格式 | JSON with transcript_path | 与现有实现一致 |
| Transcript 格式 | JSONL 逐行解析 | 支持大文件处理 |
| LLM 调用 | Node.js https 内置模块 | 无外部依赖 |
| 敏感信息过滤 | 正则表达式模式匹配 | 简单有效 |
| 学习识别 | LLM 分析 + 提示词工程 | 灵活可扩展 |
| 文件命名 | kebab-case 基于内容 | 跨平台兼容 |

所有 NEEDS CLARIFICATION 已解决，可以进入 Phase 1 设计阶段。

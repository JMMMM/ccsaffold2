# Research: 持续学习功能升级

**Branch**: `002-continuous-learning-upgrade`
**Date**: 2026-02-13

## 大模型触发位置

```
调用链路图:

SessionEnd Hook
    │
    ▼
hooks/auto-learning.js (异步启动)
    │
    ▼
hooks/auto-learning-worker.js
    │  L177: llmAnalyzer.analyze(filteredText)
    │
    ▼
lib/llm-analyzer.js
    │  L147: claudeCli.analyze(transcriptContent, { timeout })
    │
    ▼
lib/claude-cli-client.js ← 【大模型实际调用位置】
    │  L183: spawn('claude', args)
    │
    ▼
Claude CLI 子进程
    └─→ claude -p "prompt" --output-format json --max-turns 1
```

**关键代码位置**:

| 文件 | 函数/行号 | 说明 |
|------|-----------|------|
| `lib/claude-cli-client.js:169` | `analyze()` | 大模型调用入口函数 |
| `lib/claude-cli-client.js:183` | `spawn('claude', args)` | 创建子进程执行 Claude CLI |
| `lib/llm-analyzer.js:139` | `analyze()` | 分析器调用入口 |
| `hooks/auto-learning-worker.js:177` | `llmAnalyzer.analyze()` | 工作进程触发点 |

---

## Research Topics

### 1. Claude CLI 调用方式

**Decision**: 使用 `claude -p "prompt"` 打印模式进行大模型调用

**Rationale**:
- Claude CLI 是官方工具，无需维护 API 密钥
- `--print` 或 `-p` 模式执行后退出，适合脚本调用
- 支持 `--output-format json` 获取结构化输出
- 支持 stdin 管道输入：`cat content | claude -p "prompt"`

**Claude CLI 关键参数**:
```bash
# 基本调用
claude -p "你的提示词"

# 使用 stdin 管道
echo "内容" | claude -p "分析这段内容"

# JSON 输出格式
claude -p "提示词" --output-format json

# 使用 JSON Schema 约束输出
claude -p "提示词" --json-schema '{"type":"object","properties":{...}}'

# 限制工具（用于学习功能不需要工具调用）
claude -p "提示词" --tools ""

# 限制最大轮次
claude -p "提示词" --max-turns 1
```

**Alternatives Considered**:
- 继续使用智谱 AI HTTP API - 拒绝原因：需要维护 API 密钥，与用户要求不符
- 使用 Anthropic API - 拒绝原因：同样需要维护 API 密钥

---

### 2. 输出类型判断逻辑

**Decision**: 基于会话内容特征，使用 LLM 进行智能判断

**判断标准**:

| 类型 | 判断特征 | 输出格式 |
|------|----------|----------|
| **Skill** | 同一问题反复沟通（>=3次失败尝试）后成功修复 | SKILL.md |
| **FeatureDoc** | 涉及功能开发、修改、性能调优、核心实现变更 | {name}.md |
| **None** | 无明确学习价值或对话过少 | 跳过 |

**LLM 提示词设计**:
```
分析以下会话内容，判断学习输出类型：

1. **skill**: 当会话显示同一问题经过多次（>=3次）调试/尝试后最终解决
   - 特征：反复的错误修复、多次尝试不同方案、最终成功
   - 触发词应基于问题/错误现象

2. **feature-doc**: 当会话涉及功能开发或变更
   - 特征：新增功能、修改功能、性能调优、架构变更

3. **none**: 无明确学习价值

返回 JSON 格式：
{
  "type": "skill|feature-doc|none",
  "confidence": 0.0-1.0,
  "reason": "判断理由"
}
```

**Alternatives Considered**:
- 纯关键词匹配 - 拒绝原因：准确率低，无法理解上下文
- 同时生成两种输出 - 拒绝原因：可能产生冗余内容

---

### 3. 结构化输出 JSON Schema

**Decision**: 定义统一的输出 Schema，便于解析和处理

**Skill 输出 Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 2, "maxLength": 50 },
    "description": { "type": "string", "minLength": 5, "maxLength": 200 },
    "problem": { "type": "string" },
    "solution": { "type": "string" },
    "steps": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "keywords": { "type": "array", "items": { "type": "string" }, "minItems": 1 }
  },
  "required": ["name", "description", "problem", "solution", "steps", "keywords"]
}
```

**FeatureDoc 输出 Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "type": { "type": "string", "enum": ["new-feature", "modification", "optimization", "refactor"] },
    "summary": { "type": "string" },
    "design": { "type": "string" },
    "implementation": { "type": "array", "items": { "type": "string" } },
    "changes": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["name", "type", "summary", "design"]
}
```

---

### 4. 文件权限处理

**Decision**: Claude CLI 在打印模式下不直接创建文件，由 Node.js 主进程负责文件操作

**Rationale**:
- Claude CLI 打印模式只输出文本，不执行文件操作
- 文件创建由学习工作进程（Node.js）负责，有明确的权限控制
- 避免权限问题导致的不可预测行为

**实现方式**:
1. Claude CLI 分析会话，返回结构化 JSON
2. Node.js 工作进程解析 JSON
3. Node.js 工作进程创建/更新文件

---

### 5. 现有代码复用

**可复用的模块**:
- `lib/conversation-reader.js` - 读取会话内容
- `lib/sensitive-filter.js` - 过滤敏感信息
- `lib/learning-logger.js` - 学习日志记录
- `lib/skill-generator.js` - Skill 文件生成（可扩展）
- `hooks/auto-learning.js` - 异步学习触发机制

**需要改造的模块**:
- `lib/llm-analyzer.js` - 改用 Claude CLI 调用
- 新增 `lib/feature-doc-generator.js` - 功能文档生成
- 新增 `lib/output-type-classifier.js` - 输出类型判断

---

## Risk Assessment

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Claude CLI 不可用 | 学习功能失效 | 优雅降级，记录错误日志 |
| JSON 输出解析失败 | 无法生成输出 | 多种解析策略，记录原始响应 |
| 输出类型判断错误 | 生成错误的输出类型 | 提供手动学习作为补充 |

---

## Dependencies

- **Claude CLI**: 版本需支持 `--output-format json` 参数
- **Node.js**: 18+ LTS（与现有系统一致）
- **现有模块**: conversation-reader, sensitive-filter, learning-logger, skill-generator

# Research: Web Reader MCP Cache Hooks

**Feature**: 005-web-cache-hooks
**Date**: 2026-02-12

## Research Tasks

### 1. Claude Code Hooks 机制研究

**Question**: PreToolUse 和 PostToolUse hooks 的输入输出格式是什么？

**Decision**:
- PreToolUse hook 接收工具调用信息，可以返回 `block` 字段来阻止工具执行
- PostToolUse hook 接收工具调用结果，可以进行后处理
- 输入通过 stdin 以 JSON 格式传递
- 输出通过 stdout 返回 JSON

**Rationale**:
根据现有项目中的 session-logger.js 和 auto-learning.js 实现，hook 通过 stdin 读取 JSON 输入。

**Alternatives Considered**:
- 无 - 这是 Claude Code hooks 的标准机制

### 2. Before Hook 缓存检查策略

**Question**: 如何在 before hook 中阻止 MCP 调用并返回缓存内容？

**Decision**:
- 使用 PreToolUse hook 的 `block` 机制
- 当检测到 web-reader MCP 调用时，检查是否存在缓存 skill
- 如果缓存存在，返回 `{ block: "缓存内容..." }` 阻止原调用
- 如果缓存不存在，正常执行（返回空或不返回 block）

**Rationale**:
Claude Code hooks 支持通过返回 `block` 字段来拦截工具调用，这正好满足"优先使用缓存"的需求。

**Alternatives Considered**:
- 修改 MCP 调用参数 - 不支持，hook 不能修改调用参数
- 使用环境变量标记 - 过于复杂，不直接

### 3. After Hook 内容处理

**Question**: PostToolUse hook 如何处理 web-reader 返回的 markdown？

**Decision**:
- PostToolUse hook 接收工具执行结果
- 提取 markdown 内容
- 保存原始内容到 `doc/{domain}.md`
- 由于 hook 是 command 类型，无法直接总结内容
- 需要使用 prompt 类型 hook 或在 SessionEnd 时处理

**Rationale**:
根据需求，after hook 类型是 prompt，这意味着它不是传统的脚本 hook，而是通过 prompt 指导 AI 进行处理。

**Alternatives Considered**:
- 使用 command 类型 hook 直接保存 - 可以保存原始文件，但无法总结
- 使用独立的 skill 处理 - 需要用户手动触发

### 4. Prompt 类型 Hook 实现

**Question**: 如何实现 prompt 类型的 hook？

**Decision**:
- Prompt 类型 hook 在 settings.json 中配置 `type: "prompt"`
- 当 hook 触发时，Claude Code 会收到一个 prompt 指导
- Prompt 内容指导 AI 执行特定操作（如总结内容、保存文件）

**Rationale**:
Claude Code 支持多种 hook 类型，prompt 类型适合需要 AI 参与处理的场景。

### 5. URL 域名提取

**Question**: 如何从 URL 中提取域名用于缓存匹配？

**Decision**:
- 使用 Node.js 内置的 `URL` 类解析 URL
- 提取 `hostname` 作为域名标识
- 处理特殊情况：带 www 前缀的域名规范化

**Rationale**:
Node.js 内置 URL 解析，无需外部依赖，符合宪章要求。

```javascript
const url = new URL(inputUrl);
const domain = url.hostname.replace(/^www\./, '');
```

### 6. Skill 文件结构

**Question**: 缓存 skill 的文件结构应该是什么样的？

**Decision**:
- 存储位置: `skills/learn/{domain}/SKILL.md`
- 格式遵循标准 SKILL.md 结构
- 包含元数据（name, description）和内容（来源、摘要）

```markdown
---
name: {domain}
description: {domain} 网站内容缓存
source_url: {original_url}
cached_at: {timestamp}
---

# {domain} 知识摘要

{核心知识点摘要}
```

**Rationale**:
遵循 Claude Code skills 的标准格式，便于 AI 自动识别和使用。

## Open Questions Resolved

所有技术问题已解决，无待澄清项。

## Dependencies

| 依赖 | 类型 | 用途 |
|------|------|------|
| Node.js 18+ | 运行时 | Hook 执行环境 |
| fs | 内置模块 | 文件读写 |
| path | 内置模块 | 路径处理 |
| url | 内置模块 | URL 解析 |

## Risks & Mitigations

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Prompt hook 可能不被支持 | 高 | 验证 Claude Code 版本支持情况 |
| 缓存内容过大 | 中 | 限制摘要长度，只保留核心知识点 |
| 域名匹配不精确 | 低 | 支持精确匹配和域名匹配两级 |

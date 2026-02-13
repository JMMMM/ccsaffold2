# Quickstart: 持续学习功能升级

**Branch**: `002-continuous-learning-upgrade`
**Date**: 2026-02-13

## Prerequisites

1. **Claude CLI** 已安装并配置
   ```bash
   # 验证 Claude CLI 可用
   claude --version

   # 测试打印模式
   echo "hello" | claude -p "回复OK" --max-turns 1
   ```

2. **Node.js** 18+ LTS

## Installation

```bash
# 1. 安装插件到目标项目
node /path/to/ccsaffold2/scripts/install.js /path/to/your-project

# 2. 或者使用 --plugin-dir 临时加载
cd /path/to/your-project
claude --plugin-dir /path/to/ccsaffold2
```

## Usage

### 自动学习

自动学习在会话结束时自动触发，无需手动操作。

```
# 正常使用 Claude Code
# 会话结束后，自动分析并生成 Skill 或功能文档
```

**触发条件**:
- 会话包含至少 3 条用户输入
- 会话内容有学习价值（bug 修复或功能开发）

### 手动学习

在会话中随时触发学习：

```
/learn
```

或使用关键词：
- `手动学习`
- `生成skill`
- `学习这个会话`

### 查看学习结果

```bash
# 查看生成的 Skills
ls -la .claude/skills/

# 查看功能文档
ls -la .claude/doc/features/

# 查看学习日志
ls -la .claude/logs/continuous-learning/
```

## Output Types

### 1. Skill（技能）

**触发场景**: 同一问题反复调试后成功修复

**输出位置**: `.claude/skills/{name}/SKILL.md`

**示例**:
```markdown
---
name: fix-npm-permission-error
description: 解决 npm 权限错误
---

# Skill: fix-npm-permission-error

## Purpose
当用户遇到 npm install 权限错误时，提供解决方案。

## Trigger Conditions
- npm ERR! Error: EACCES
- permission denied npm
- npm 权限错误

## Instructions
1. 检查 npm 全局安装路径
2. 修改目录权限或使用 nvm
3. 重新执行安装命令

## Examples
用户说 "npm install 报权限错误" -> AI 引导用户排查并修复
```

### 2. FeatureDoc（功能文档）

**触发场景**: 功能开发、修改、性能调优

**输出位置**: `.claude/doc/features/{name}.md`

**示例**:
```markdown
# Feature: user-authentication

**Type**: new-feature
**Created**: 2026-02-13
**Updated**: 2026-02-13

## Summary
实现基于 JWT 的用户认证功能

## Design
- 使用 JWT 进行无状态认证
- Access Token 有效期 15 分钟
- Refresh Token 有效期 7 天

## Implementation
- `/api/auth/login` - 登录接口
- `/api/auth/refresh` - 刷新 Token
- 中间件验证 Token 有效性

## Change History
| Date | Change |
|------|--------|
| 2026-02-13 | 初始创建 |
```

## Configuration

### 调整最小对话数阈值

编辑 `.claude/hooks/auto-learning-worker.js`:

```javascript
const MIN_USER_INPUTS = 3; // 默认值，可调整
```

### 调整输出类型判断置信度

编辑 `lib/output-type-classifier.js`:

```javascript
const CONFIDENCE_THRESHOLD = 0.7; // 默认值，可调整
```

## Troubleshooting

### Claude CLI 不可用

```
[Auto-Learning] ERROR: Claude CLI not available
```

**解决方案**: 确保 `claude` 命令在 PATH 中可用

### 学习结果为空

```
[Auto-Learning] INFO: No learning content identified
```

**原因**:
- 对话数不足
- 内容无明确学习价值

**解决方案**: 继续使用系统，积累更多有价值的内容

### 日志查看

```bash
# 查看最新学习日志
tail -f .claude/logs/continuous-learning/learning-*.log
```

## API Reference

### lib/claude-cli-client.js (新增)

```javascript
// 调用 Claude CLI 进行分析
const { ClaudeCliClient } = require('./lib/claude-cli-client');

const client = new ClaudeCliClient();
const result = await client.analyze(transcriptContent, {
  outputFormat: 'json',
  maxTurns: 1
});
```

### lib/output-type-classifier.js (新增)

```javascript
// 判断输出类型
const { classifyOutputType } = require('./lib/output-type-classifier');

const classification = await classifyOutputType(transcriptContent);
// { type: 'skill'|'feature-doc'|'none', confidence: 0.0-1.0, reason: '...' }
```

### lib/feature-doc-generator.js (新增)

```javascript
// 生成功能文档
const { generateFeatureDoc } = require('./lib/feature-doc-generator');

const doc = generateFeatureDoc(analysisResult);
const saved = saveFeatureDoc(cwd, doc);
```

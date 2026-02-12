---
name: manual-learn
description: 手动触发学习功能，分析当前会话或指定会话内容生成skill。当用户说/learn、手动学习、生成skill时触发。
---

# Skill: 手动学习

## Purpose
当用户希望手动触发学习功能，分析当前会话或指定的历史会话内容时，使用此技能生成可复用的skill。适用于自动学习可能遗漏重要经验的场景。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- /learn
- 手动学习
- 学习这个会话
- 生成skill
- 总结学习
- 创建技能

## Instructions

### 1. 确认分析目标
- 如果用户指定了会话文件路径，使用指定文件
- 否则使用当前会话记录（`.claude/conversations/conversation.txt`）

### 2. 读取会话内容
- 从文件读取会话记录
- 如果是 transcript.jsonl 格式，需要解析 JSON Lines

### 3. 过滤敏感信息
- API 密钥、密码、令牌
- 文件系统路径中的用户名
- 其他敏感数据

### 4. 调用大模型分析
使用 `lib/llm-analyzer.js` 或直接调用 API，识别：
- 用户多次反复沟通后才解决的问题
- 有价值的调试经验
- 可复用的解决方案模式

### 5. 生成 Skill 文件
根据 SKILL.md 模板格式生成：
```markdown
---
name: skill名称
description: 简短描述
---

# Skill: skill名称

## Purpose
问题描述和解决场景

## Trigger Conditions
触发关键词

## Instructions
具体操作步骤

## Examples
使用示例
```

### 6. 保存 Skill
- 保存到 `skills/{skill-name}/SKILL.md`
- 如果目录不存在则创建

### 7. 报告结果
向用户报告生成的 skill 文件路径和简要内容

## Examples

**示例1**: 用户说 `/learn`
-> AI 分析当前会话，识别学习点，生成 skill 文件

**示例2**: 用户说 `手动学习这个会话`
-> AI 分析当前会话内容并生成 skill

**示例3**: 用户说 `学习 /path/to/transcript.jsonl`
-> AI 分析指定的会话文件并生成 skill

**示例4**: 用户说 `生成一个关于API调试的skill`
-> AI 根据用户指定的主题分析相关内容并生成 skill

## Notes
- 如果 skills 目录不存在，系统会自动创建
- 生成的 skill 文件名会根据内容自动命名
- 如果会话中没有识别到可学习的内容，系统会告知用户
- 需要设置 ANTHROPIC_API_KEY 环境变量才能使用 LLM 分析功能

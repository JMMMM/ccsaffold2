---
name: manual-learn
description: 手动触发学习功能，分析当前会话内容生成skill。当用户说/learn、手动学习、生成skill时触发。
---

# Skill: 手动学习

## Purpose
当用户希望手动触发学习功能，分析当前会话内容时，使用此技能生成可复用的skill。适用于自动学习可能遗漏重要经验的场景。

**核心原则：直接分析当前会话上下文，不读取文件，不调用外部 API**

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- /learn
- 手动学习
- 学习这个会话
- 生成skill
- 总结学习
- 创建技能

## Instructions

### 1. 分析当前会话
**直接基于当前会话的对话历史进行分析，不需要读取任何文件**

识别会话中的学习点：
- 用户多次反复沟通后才解决的问题
- 有价值的调试经验和踩坑记录
- 可复用的解决方案模式
- 项目特有的约定和规范

注意：分析时自动过滤敏感信息（API密钥、密码、令牌等）

### 2. 生成 Skill 文件
根据分析结果，按以下模板格式生成：
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

### 3. 保存 Skill
- 使用 Write 工具保存到 `skills/learn/{skill-name}/SKILL.md`
- 如果目录不存在，Write 工具会自动创建

### 4. 报告结果
向用户报告：
- 生成的 skill 文件路径
- skill 的简要内容摘要

## Examples

**示例1**: 用户说 `/learn`
-> AI 直接分析当前会话上下文，生成 skill

**示例2**: 用户说 `手动学习`
-> AI 分析当前对话历史并生成 skill

**示例3**: 用户说 `生成一个关于调试的skill`
-> AI 根据会话中与调试相关的内容分析并生成 skill

## Notes
- 直接分析当前会话上下文，无需读取文件，无需外部 API 调用
- 如果 skills 目录不存在，系统会自动创建
- 生成的 skill 文件名会根据内容自动命名
- 如果会话中没有识别到可学习的内容，会告知用户原因

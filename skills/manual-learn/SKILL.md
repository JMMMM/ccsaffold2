---
name: manual-learn
description: 手动触发学习功能，分析当前会话内容生成 Skill 或功能文档。当用户说/learn、手动学习、生成skill时触发。
---

# Skill: 手动学习

## Purpose
当用户希望手动触发学习功能，分析当前会话内容时，使用此技能生成可复用的知识输出。适用于自动学习可能遗漏重要经验的场景。

**支持两种输出类型**：
- **Skill**: 用于捕获顽固 bug 修复经验
- **功能文档**: 用于记录功能开发、修改、性能调优

**核心原则：直接分析当前会话上下文，不读取文件，不调用外部 API**

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- /learn
- 手动学习
- 学习这个会话
- 生成skill
- 生成技能
- 总结学习
- 创建技能
- 生成功能文档
- 记录功能

## Instructions

### 1. 判断输出类型
**根据会话内容特征判断应生成哪种输出**：

**生成 Skill 的场景**：
- 同一问题反复沟通（>=3次失败尝试）后最终解决
- 有价值的调试经验和踩坑记录
- 可复用的 bug 修复模式

**生成功能文档的场景**：
- 新功能开发
- 现有功能修改
- 性能调优
- 架构变更
- 核心实现调整

**跳过学习的场景**：
- 会话内容过少
- 无明确学习价值
- 纯粹的问答对话

### 2. 生成 Skill 文件
如果是 Skill 类型，按以下模板格式生成：
```markdown
---
name: skill名称（英文，kebab-case）
description: 简短描述（5-200字符）
---

# Skill: skill名称

## Purpose
当用户遇到 [问题描述] 时，[解决方案概述]。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- 关键词1（基于 bug 现象）
- 关键词2
- 关键词3

## Instructions
1. 步骤1
2. 步骤2
3. 步骤3

## Examples
示例1：用户说 "[bug现象]" -> AI 引导用户按步骤排查问题
```

**保存位置**: `.claude/skills/{skill-name}/SKILL.md`

### 3. 生成功能文档
如果是功能文档类型，按以下模板格式生成：
```markdown
# Feature: 功能名称

**Type**: new-feature|modification|optimization|refactor
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD

## Summary
功能概述

## Design
核心设计/架构说明

## Implementation
- 实现点1
- 实现点2

## Change History
| Date | Change |
|------|--------|
| YYYY-MM-DD | 初始创建 |
```

**保存位置**: `.claude/doc/features/{name}.md`

### 4. 保存并报告
- 使用 Write 工具保存文件
- 如果目录不存在，Write 工具会自动创建
- 向用户报告：
  - 生成的文件路径
  - 输出类型（Skill / 功能文档）
  - 简要内容摘要

## Examples

**示例1 - 顽固 Bug**: 用户说 `/learn`
-> AI 分析当前会话，发现用户经过多次调试解决了 npm 权限错误
-> 生成 Skill: `fix-npm-permission-error`
-> 保存到 `.claude/skills/fix-npm-permission-error/SKILL.md`

**示例2 - 功能开发**: 用户说 `手动学习`
-> AI 分析当前会话，发现涉及用户认证功能开发
-> 生成功能文档: `user-authentication`
-> 保存到 `.claude/doc/features/user-authentication.md`

**示例3 - 无学习价值**: 用户说 `总结学习`
-> AI 分析当前会话，发现只是简单的问答对话
-> 告知用户：当前会话未识别到可学习的内容

## Notes
- 直接分析当前会话上下文，无需读取文件，无需外部 API 调用
- 根据内容特征自动选择输出类型
- 如果目标目录不存在，系统会自动创建
- 生成的文件名会根据内容自动命名
- 如果会话中没有识别到可学习的内容，会告知用户原因

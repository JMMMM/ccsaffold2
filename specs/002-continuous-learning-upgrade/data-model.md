# Data Model: 持续学习功能升级

**Branch**: `002-continuous-learning-upgrade`
**Date**: 2026-02-13

## Core Entities

### 1. LearningOutput (学习输出)

学习功能的统一输出结果，可以是 Skill 或功能文档。

```
LearningOutput
├── type: enum [skill, feature-doc, none]
├── name: string (唯一标识符)
├── content: object (结构化的知识内容)
├── createdAt: datetime
├── sourceSession: string (来源会话 ID)
└── confidence: number (0.0-1.0 判断置信度)
```

**状态转换**:
```
会话结束 -> 分析类型 -> 生成内容 -> 写入文件
    |           |
    v           v
  跳过      skill/feature-doc
```

---

### 2. Skill (技能)

用于捕获顽固 bug 修复经验的可复用知识。

```
Skill
├── name: string (2-50 字符)
├── description: string (5-200 字符)
├── problem: string (bug 现象描述)
├── solution: string (解决方案概述)
├── steps: string[] (详细步骤，至少 1 条)
├── keywords: string[] (触发词，至少 1 个)
└── storagePath: string (.claude/skills/{name}/SKILL.md)
```

**文件格式** (SKILL.md):
```markdown
---
name: skill-name
description: 简短描述
---

# Skill: skill-name

## Purpose
当用户遇到 {problem} 时，{solution}。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- 关键词1
- 关键词2

## Instructions
1. 步骤1
2. 步骤2

## Examples
示例1：用户说 "{keyword}" -> AI 引导用户按步骤排查问题
```

---

### 3. FeatureDoc (功能文档)

记录功能设计、实现和演进的知识。

```
FeatureDoc
├── name: string (功能名称)
├── type: enum [new-feature, modification, optimization, refactor]
├── summary: string (功能概述)
├── design: string (核心设计/架构)
├── implementation: string[] (关键实现点)
├── changes: string[] (变更记录，追加模式)
├── createdAt: datetime
├── updatedAt: datetime
└── storagePath: string (.claude/doc/features/{name}.md)
```

**文件格式** ({name}.md):
```markdown
# Feature: {name}

**Type**: new-feature|modification|optimization|refactor
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD

## Summary
{summary}

## Design
{design}

## Implementation
- 实现点1
- 实现点2

## Change History
| Date | Change |
|------|--------|
| YYYY-MM-DD | 初始创建 |
| YYYY-MM-DD | 修改描述 |
```

---

### 4. LearningSession (学习会话)

单次学习的执行上下文。

```
LearningSession
├── sessionId: string (关联的 Claude Code 会话 ID)
├── transcriptPath: string (.claude/conversations/conversation-{id}.txt)
├── outputType: enum [skill, feature-doc, none]
├── results: LearningOutput[]
├── status: enum [pending, analyzing, generating, completed, failed]
├── error: string? (错误信息)
├── startedAt: datetime
├── completedAt: datetime?
└── logPath: string (.claude/logs/continuous-learning/learning-{id}.log)
```

**状态转换**:
```
pending -> analyzing -> generating -> completed
    |          |            |
    v          v            v
  failed    failed       failed
```

---

### 5. AnalysisResult (分析结果)

Claude CLI 返回的分析结果结构。

```
AnalysisResult
├── outputType: enum [skill, feature-doc, none]
├── confidence: number (0.0-1.0)
├── reason: string (判断理由)
├── skill?: Skill (当 outputType=skill 时)
└── featureDoc?: FeatureDoc (当 outputType=feature-doc 时)
```

---

## Entity Relationships

```
LearningSession 1 -- * LearningOutput
LearningOutput 1 -- 1 Skill (当 type=skill)
LearningOutput 1 -- 1 FeatureDoc (当 type=feature-doc)
Skill * -- 1 Skill (去重合并关系)
FeatureDoc * -- 1 FeatureDoc (更新追加关系)
```

---

## Storage Locations

| 实体 | 存储位置 | 格式 |
|------|----------|------|
| Skill | `.claude/skills/{name}/SKILL.md` | Markdown |
| FeatureDoc | `.claude/doc/features/{name}.md` | Markdown |
| LearningSession Log | `.claude/logs/continuous-learning/learning-{id}.log` | JSON Lines |
| Conversation | `.claude/conversations/conversation-{id}.txt` | Plain Text |

---

## Validation Rules

### Skill Validation
- name: 必填，2-50 字符
- description: 必填，5-200 字符
- problem: 必填
- solution: 必填
- steps: 必填，至少 1 条
- keywords: 必填，至少 1 个

### FeatureDoc Validation
- name: 必填
- type: 必填，枚举值
- summary: 必填
- design: 必填
- implementation: 可选
- changes: 可选

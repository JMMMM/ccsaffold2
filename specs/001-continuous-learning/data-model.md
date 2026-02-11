# Data Model: 持续学习 (Continuous Learning)

**Date**: 2026-02-11
**Feature**: 001-continuous-learning

## Entities

### 1. Transcript (会话记录)

**Description**: Claude Code 会话的完整记录文件

**Source**: Claude Code 自动生成，存储在 `.claude/transcripts/` 目录

**Attributes**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 记录类型：user, assistant, tool_use |
| message | object | 否 | 消息内容对象 |
| message.content | string | 否 | 文本内容 |
| tool | string | 否 | 工具名称（tool_use 类型） |
| input | object | 否 | 工具输入参数 |
| output | object | 否 | 工具输出结果 |

**Relationships**:
- Transcript 文件包含多条记录
- 记录按时间顺序排列

**Validation Rules**:
- 每行必须是有效的 JSON
- `type` 字段必须为允许的值

---

### 2. LearningResult (学习结果)

**Description**: LLM 分析 transcript 后返回的学习内容

**Attributes**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | Skill 名称（用于文件命名） |
| description | string | 是 | 简短描述（用于 frontmatter） |
| problem | string | 是 | 问题描述 |
| solution | string | 是 | 解决方案描述 |
| steps | string[] | 是 | 解决步骤列表 |
| keywords | string[] | 是 | 触发关键词列表 |
| examples | object[] | 否 | 示例（可选） |

**Relationships**:
- 一个 Transcript 分析可产生 0-N 个 LearningResult
- LearningResult 转换为一个 Skill 文件

**Validation Rules**:
- `name` 长度 2-50 字符
- `description` 长度 5-200 字符
- `steps` 至少 1 个步骤
- `keywords` 至少 1 个关键词

---

### 3. Skill (学习产物)

**Description**: 最终生成的 skill 文件，存储在 `.skills/learn/` 目录

**Attributes**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | Skill 名称（frontmatter） |
| description | string | 是 | 描述（frontmatter） |
| purpose | string | 是 | 用途说明 |
| triggerConditions | string[] | 是 | 触发关键词列表 |
| instructions | string[] | 是 | 操作指令列表 |
| examples | string[] | 否 | 示例列表 |

**File Format**:
```markdown
---
name: [name]
description: [description]
---

# Skill: [name]

## Purpose
[purpose]

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- [keyword1]
- [keyword2]

## Instructions
1. [step1]
2. [step2]

## Examples
示例1：[example1]
示例2：[example2]
```

**Relationships**:
- Skill 文件由 LearningResult 转换生成
- Skill 文件可被 Claude Code 自动加载

**Validation Rules**:
- 文件扩展名必须为 `.md`
- 必须包含有效的 YAML frontmatter
- 必须包含所有必需章节

---

### 4. HookInput (Hook 输入)

**Description**: sessionEnd hook 接收的输入数据

**Attributes**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话唯一标识 |
| transcript_path | string | 是 | Transcript 文件路径 |
| cwd | string | 是 | 当前工作目录 |
| hook_event_name | string | 是 | 事件名称（sessionEnd） |

**Validation Rules**:
- `transcript_path` 必须指向存在的文件
- `cwd` 必须是有效的目录路径

---

### 5. ApiConfig (API 配置)

**Description**: LLM API 调用配置

**Attributes**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| apiKey | string | 是 | Anthropic API Key |
| model | string | 否 | 模型名称（默认 claude-sonnet-4-20250514） |
| maxTokens | number | 否 | 最大 token 数（默认 4096） |

**Configuration**:
- API Key 从环境变量 `ANTHROPIC_API_KEY` 读取
- 如果未设置环境变量，静默失败

---

## State Transitions

```
Transcript 文件
    ↓ (读取)
TranscriptContent (原始内容)
    ↓ (过滤敏感信息)
FilteredContent
    ↓ (LLM 分析)
LearningResult[]
    ↓ (转换为 Skill 格式)
Skill 文件
    ↓ (写入文件系统)
.skills/learn/*.md
```

## File Storage

```
项目根目录/
├── .claude/
│   └── transcripts/           # Transcript 文件（Claude Code 生成）
│       └── {session_id}.jsonl
│
└── .skills/
    └── learn/                 # 学习生成的 Skill 文件
        ├── api-debug-config.md
        ├── git-conflict-resolution.md
        └── ...
```

## Data Flow Diagram

```
┌─────────────────┐
│ sessionEnd Hook │
└────────┬────────┘
         │ HookInput
         ▼
┌─────────────────┐
│ TranscriptReader│
└────────┬────────┘
         │ Raw Content
         ▼
┌─────────────────┐
│ SensitiveFilter │
└────────┬────────┘
         │ Filtered Content
         ▼
┌─────────────────┐
│  LLM Analyzer   │◄──── ANTHROPIC_API_KEY
└────────┬────────┘
         │ LearningResult[]
         ▼
┌─────────────────┐
│ SkillGenerator  │
└────────┬────────┘
         │ Skill Content
         ▼
┌─────────────────┐
│   .skills/learn │
└─────────────────┘
```

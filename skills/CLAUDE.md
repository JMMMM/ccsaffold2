# Skills 模块

技能定义，提供可复用的操作指南。

## 目录结构

```
skills/
├── manual-learn/            # 手动学习功能
│   └── SKILL.md
├── hook-creator/            # Hook创建工具
│   ├── SKILL.md
│   ├── assets/templates/    # 模板文件
│   │   ├── nodejs/hook.js
│   │   ├── python/hook.py
│   │   └── bash/hook.sh
│   └── references/          # 参考文档
│       ├── hook-events.md
│       └── input-format.md
└── ccsaffold-jian/          # 插件改造经验
    └── SKILL.md
```

## 技能文件

### manual-learn/SKILL.md

功能描述：手动触发学习功能，分析当前会话内容生成 Skill 或功能文档

| 字段 | 说明 |
|------|------|
| `name` | manual-learn |
| `description` | 手动触发学习功能 |
| `触发关键词` | `/learn`, `手动学习`, `生成skill` |

**功能**:
- 分析当前会话内容
- 判断学习价值（skill/doc/none）
- 创建对应的知识文件

### hook-creator/SKILL.md

功能描述：创建 Claude Code hooks 的工具指南

| 字段 | 说明 |
|------|------|
| `name` | hook-creator |
| `description` | 创建 Claude Code hooks |
| `触发关键词` | `create hooks`, `add automation` |

**模板文件**:
- `assets/templates/nodejs/hook.js` - Node.js Hook 模板
- `assets/templates/python/hook.py` - Python Hook 模板
- `assets/templates/bash/hook.sh` - Bash Hook 模板

**参考文档**:
- `references/hook-events.md` - Hook 事件类型说明
- `references/input-format.md` - 输入格式规范

### ccsaffold-jian/SKILL.md

功能描述：插件改造经验参考

| 字段 | 说明 |
|------|------|
| `name` | ccsaffold-jian |
| `description` | 插件改造经验（参考） |
| `触发关键词` | `插件化`, `speckit`, `plugin-dir` |

## 技能列表

| Skill | 描述 | 触发关键词 |
|-------|------|-----------|
| `manual-learn` | 手动触发学习，分析会话生成skill | `/learn`, `手动学习`, `生成skill` |
| `hook-creator` | 创建 Claude Code hooks | `create hooks`, `add automation` |
| `ccsaffold-jian` | 插件改造经验（参考） | `插件化`, `speckit`, `plugin-dir` |

## 存放位置

| 位置 | 路径 | 适用范围 |
|------|------|---------|
| 项目 | `.claude/skills/<name>/SKILL.md` | 仅此项目 |
| 插件 | `skills/<name>/SKILL.md` | 启用插件的位置 |
| 个人 | `~/.claude/skills/<name>/SKILL.md` | 所有项目 |

## SKILL.md 格式

```markdown
---
name: skill-name
description: 简短描述，用于触发匹配
---

# Skill: skill-name

## Purpose
描述这个技能的用途

## Trigger Conditions
触发关键词列表

## Instructions
具体操作步骤
```

## 目录结构要求

```
正确: skills/<skill-name>/SKILL.md
错误: skills/<skill-name>.md   ← 不会生效！
```

## 前置元数据字段

| 字段 | 必需 | 描述 |
|------|------|------|
| `name` | 否 | 显示名称，也是 `/slash-command` |
| `description` | 推荐 | 用于 Claude 决定何时使用 |
| `disable-model-invocation` | 否 | `true` 则只能手动调用 |
| `user-invocable` | 否 | `false` 则从菜单隐藏 |

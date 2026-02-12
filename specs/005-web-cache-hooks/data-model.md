# Data Model: Web Reader MCP Cache Hooks

**Feature**: 005-web-cache-hooks
**Date**: 2026-02-12

## Entities

### WebCacheSkill

网站缓存知识，存储在 `skills/learn/{domain}/SKILL.md`

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| name | string | 是 | 域名标识（用于触发匹配） |
| description | string | 是 | 简短描述，格式为 "{domain} 网站内容缓存" |
| source_url | string | 是 | 原始请求 URL |
| cached_at | string | 是 | 缓存创建时间 (ISO 8601) |
| content | markdown | 是 | 核心知识摘要 |

**文件格式**:

```markdown
---
name: docs.nodejs.org
description: docs.nodejs.org 网站内容缓存
source_url: https://docs.nodejs.org/api/fs.html
cached_at: 2026-02-12T10:30:00Z
---

# docs.nodejs.org 知识摘要

## fs 模块

Node.js 文件系统模块提供文件操作能力...

### 核心方法
- fs.readFile(): 异步读取文件
- fs.writeFile(): 异步写入文件
...
```

### DocArchive

原始 markdown 存档，存储在 `doc/{domain}.md`

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| filename | string | 是 | 文件名，格式为 `{domain}.md` |
| source_url | string | 是 | 原始请求 URL（文件头注释） |
| fetched_at | string | 是 | 抓取时间 (ISO 8601) |
| content | markdown | 是 | 原始 markdown 内容 |

**文件格式**:

```markdown
<!--
Source: https://docs.nodejs.org/api/fs.html
Fetched: 2026-02-12T10:30:00Z
-->

# File System

Original markdown content from web-reader...
```

## Relationships

```
┌─────────────────┐
│   web-reader    │
│      MCP        │
└────────┬────────┘
         │ returns markdown
         ▼
┌─────────────────┐      ┌─────────────────┐
│  DocArchive     │      │  WebCacheSkill  │
│  doc/{domain}.md│      │ skills/learn/   │
│  (原始内容)      │      │ {domain}/SKILL.md│
│                 │      │ (精炼摘要)       │
└─────────────────┘      └─────────────────┘
```

## State Transitions

```
用户请求 URL
    │
    ▼
[Before Hook]
    │
    ├── 缓存存在 ──→ 返回缓存内容，跳过 MCP
    │
    └── 缓存不存在 ──→ 调用 web-reader MCP
                         │
                         ▼
                    [After Hook]
                         │
                         ├── 保存原始 markdown → doc/{domain}.md
                         │
                         └── 总结为 skill → skills/learn/{domain}/SKILL.md
```

## Validation Rules

### URL 验证
- 必须是有效的 HTTP/HTTPS URL
- 域名提取后规范化（移除 www 前缀）

### 文件命名
- 域名中的 `.` 替换为 `-` 或保持原样
- 仅允许字母、数字、连字符、点
- 最大长度: 200 字符

### 内容限制
- 原始 markdown: 无限制（完整存档）
- Skill 摘要: 建议控制在 10KB 以内

## Storage Locations

| 实体 | 位置 | 相对于项目根目录 |
|------|------|-----------------|
| WebCacheSkill | `skills/learn/{domain}/SKILL.md` | 插件级别 |
| DocArchive | `doc/{domain}.md` | 插件级别 |

**注意**: 实际安装后，skills 目录位于 `.claude/skills/learn/`

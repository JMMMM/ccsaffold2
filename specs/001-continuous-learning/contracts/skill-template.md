# Skill Template Contract

**Version**: 1.0.0
**Feature**: 001-continuous-learning

## Overview

本文档定义了持续学习功能生成的 Skill 文件格式契约。所有生成的 Skill 文件必须符合此规范。

## File Format Specification

### File Extension
- 必须使用 `.md` 扩展名

### File Naming Convention
- 格式: `{topic}-{action}.md`
- 使用小写字母和连字符（kebab-case）
- 避免特殊字符
- 示例: `api-debug-configuration.md`, `git-conflict-resolution.md`

### Content Structure

```markdown
---
name: string (required, 2-50 chars)
description: string (required, 5-200 chars)
---

# Skill: {name}

## Purpose
{purpose description}

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- {keyword1}
- {keyword2}
- ...

## Instructions
1. {instruction1}
2. {instruction2}
3. ...

## Examples
示例1：{user input} -> {AI response}
示例2：{user input} -> {AI response}
```

## YAML Frontmatter Schema

```yaml
name:
  type: string
  required: true
  minLength: 2
  maxLength: 50
  pattern: "^[a-zA-Z0-9\u4e00-\u9fa5\\s-]+$"

description:
  type: string
  required: true
  minLength: 5
  maxLength: 200
```

## Section Requirements

### Purpose Section
- 必须存在
- 简洁描述 skill 的主要用途
- 长度建议 20-200 字符

### Trigger Conditions Section
- 必须存在
- 必须包含至少 1 个触发关键词
- 关键词使用列表格式（`- keyword`）

### Instructions Section
- 必须存在
- 必须包含至少 1 个步骤
- 步骤使用有序列表格式（`1. step`）

### Examples Section
- 必须存在
- 必须包含至少 1 个示例
- 示例格式: `示例N：{user input} -> {AI response}`

## Validation Rules

### Required Checks
1. 文件扩展名为 `.md`
2. 包含有效的 YAML frontmatter
3. frontmatter 包含 `name` 和 `description` 字段
4. 包含所有必需章节：Purpose, Trigger Conditions, Instructions, Examples
5. Trigger Conditions 至少 1 个关键词
6. Instructions 至少 1 个步骤
7. Examples 至少 1 个示例

### Forbidden Content
- 敏感信息（API Key, 密码, Token 等）
- 个人身份信息
- 系统内部路径

## Example Valid Skill File

```markdown
---
name: API 调试配置
description: 帮助用户快速定位和解决 API 调用配置问题
---

# Skill: API 调试配置

## Purpose
当用户遇到 API 调用失败、配置错误等问题时，提供系统化的排查和解决方法。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- API 调用失败
- API 配置错误
- 请求超时
- 认证失败
- 401/403 错误

## Instructions
1. 确认 API 端点 URL 是否正确，检查是否有拼写错误
2. 验证认证信息（API Key、Token）是否有效且格式正确
3. 检查请求头（Headers）是否包含必需字段
4. 确认请求体（Body）格式符合 API 要求
5. 检查网络连接和防火墙设置
6. 查看错误响应体中的具体错误信息

## Examples
示例1：用户说 "API 调用返回 401 错误" -> AI 引导检查 API Key 是否正确配置
示例2：用户说 "请求一直超时" -> AI 引导检查网络连接和超时设置
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-11 | Initial specification |

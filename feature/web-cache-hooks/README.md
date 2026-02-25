# Web Cache Hooks

为 web-reader MCP 提供本地缓存功能，减少重复的网络请求和 MCP 调用。

## 功能特性

### v2.0.0 新增功能

- **自动 Skill 生成**: 访问文档型网站后自动生成可复用的 skill
- **智能文档检测**: 使用评分机制自动识别文档型网站
- **友好输出**: 自动告知用户 skill 的触发方式和用法

### 核心功能

| 功能 | Hook 类型 | 说明 |
|------|-----------|------|
| **缓存检查** | PreToolUse | 检查本地缓存，命中时直接返回 |
| **自动保存** | PostToolUse | 保存原始 markdown + 自动生成 skill |
| **强制刷新** | PreToolUse | 支持跳过缓存重新获取 |
| **多页面支持** | - | 同一域名下不同 URL 路径分别缓存 |

## 文档型网站检测

系统使用**评分机制**自动判断是否生成 skill：

| 检测项 | 权重 | 说明 |
|--------|------|------|
| URL 特征 | +3 | docs.domain.com、/docs/、/api/ 等 |
| 内容结构 | +2 | 标题、代码块、表格、列表 |
| 技术关键词 | +1 | API、函数、方法、参数等 |
| 营销内容 | -5 | 广告、订阅、购买等 |
| 内容长度 | -3 | 内容少于500字符 |

**阈值**: 分数 >= 5 认为是文档型网站，自动生成 skill

## 安装

```bash
# 在项目根目录执行
node feature/web-cache-hooks/scripts/install.js
```

安装后目录结构:

```
.claude/
├── hooks/
│   ├── web-cache-before.js   # 缓存检查 hook (PreToolUse)
│   └── web-cache-after.js    # 自动保存和skill生成 (PostToolUse)
├── lib/
│   ├── cache-matcher.js      # 缓存匹配工具
│   └── url-utils.js          # URL 处理工具
├── doc/                       # 原始 markdown 存档
│   └── {cache-key}.md
├── skills/
│   └── learn/                 # 网站知识技能
│       └── {cache-key}/
│           └── SKILL.md
└── settings.json              # 已合并的 hook 配置
```

## 使用方式

### 自动缓存和 Skill 生成

当请求读取网站内容时，系统自动:

1. **首次访问**: 调用 web-reader MCP -> 保存原始内容 -> 检测是否为文档型 -> 生成 skill
2. **后续访问**: 直接使用缓存，跳过 MCP 调用

示例:

```
用户: 访问 https://code.claude.com/docs/zh-CN/hooks
```

系统自动处理后输出:

```markdown
## 网站内容已缓存

### 缓存信息
| 项目 | 内容 |
|------|------|
| **域名** | code.claude.com |
| **URL** | https://code.claude.com/docs/zh-CN/hooks |

### 文档型网站检测

该网站符合**文档型网站特征**，已自动生成可复用的 Skill。

---

### 生成的 Skill

**Skill 名称**: `code.claude.com/docs-zh-CN-hooks`

#### 触发方式
- 访问 **code.claude.com** 的任何 URL
- 询问关于 **Hooks 参考** 的内容

#### 功能说明
1. **快速缓存命中**: 后续访问直接使用本地缓存
2. **离线访问**: 无需网络连接
3. **上下文增强**: AI 可直接引用缓存内容
```

### 强制刷新

如果需要强制刷新缓存:

```
用户: 重新读取 https://docs.nodejs.org/api/fs.html，跳过缓存
用户: 刷新 https://react.dev 的内容
```

关键词: `重新`, `刷新`, `跳过缓存`, `force refresh`, `reload`

## 缓存键格式

```
{domain}                          # 根域名
{domain}/{path-slug}-{hash}       # 带路径的 URL

示例:
- code.claude.com
- code.claude.com/docs-zh-CN-hooks-a1b2c3d4
```

## 缓存文件格式

### 原始 Markdown (doc/{cache-key}.md)

```markdown
<!--
Source: https://docs.nodejs.org/api/fs.html
Fetched: 2026-02-25T10:30:00Z
-->

# File System

Original markdown content...
```

### 自动生成的 Skill (skills/learn/{cache-key}/SKILL.md)

```markdown
---
name: docs.nodejs.org/api-fs-html-a1b2c3d4
description: docs.nodejs.org 网站内容缓存
source_url: https://docs.nodejs.org/api/fs.html
cached_at: 2026-02-25T10:30:00Z
---

# Skill: docs.nodejs.org 知识缓存

## Purpose

缓存 docs.nodejs.org 网站的文档内容，提供快速离线访问。

## Source

- 原始 URL: https://docs.nodejs.org/api/fs.html
- 缓存时间: 2026-02-25T10:30:00Z
- 完整存档: `doc/docs.nodejs.org/api-fs-html-a1b2c3d4.md`

## Content Summary

**主题**: File System

**主要章节**:
- fs.readFile()
- fs.writeFile()
- fs.readdir()

## 知识内容

[精炼的核心知识点...]

---

## 触发方式

当您访问或询问关于 **docs.nodejs.org** 的内容时，此 skill 会自动提供缓存的文档内容。

### 触发关键词示例

- "访问 https://docs.nodejs.org/api/fs.html"
- "docs.nodejs.org 文档"
- "查看 Node.js fs 模块文档"
- 任何包含 docs.nodejs.org 域名的 URL 访问请求

### 使用场景

1. **离线查阅**: 无需网络即可查看 docs.nodejs.org 文档
2. **快速参考**: 避免重复访问网站，提高响应速度
3. **上下文增强**: AI 可以直接访问缓存的文档内容
```

## 配置说明

settings.json 中的 hook 配置:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/web-cache-before.js"
      }],
      "description": "Web-Cache-Before: 检查网站缓存，优先使用已缓存内容"
    }],
    "PostToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/web-cache-after.js",
        "timeout": 30
      }],
      "description": "Web-Cache-After: 自动缓存网站内容并生成skill"
    }]
  }
}
```

## 技术细节

- **语言**: Node.js 18+ (LTS)
- **依赖**: 无外部依赖，仅使用 Node.js 内置模块
- **跨平台**: 支持 Windows, Linux, macOS
- **日志**: 纯 ASCII，不含 emoji

### 文档检测算法

```javascript
function isDocumentationSite(content, url) {
  let score = 0;

  // URL 特征 (+3)
  if (/docs?\./i.test(url)) score += 3;
  if (/\/docs\//i.test(url)) score += 3;

  // 内容结构 (+2)
  if (/##?\s+\w+/m.test(content)) score += 2;  // 有标题
  if (/```[\s\S]*?```/.test(content)) score += 2;  // 有代码块

  // 技术关键词 (+1)
  const keywords = ['api', 'function', 'method', '参数', '示例'];
  keywords.forEach(k => {
    if (content.toLowerCase().includes(k)) score += 1;
  });

  // 非文档特征扣分
  if (/广告|buy now/i.test(content)) score -= 5;

  return score >= 5;
}
```

## 故障排除

| 问题 | 解决方案 |
|------|---------|
| 缓存未被使用 | 检查 settings.json 中的 PreToolUse matcher 配置 |
| skill 未生成 | 检查 settings.json 中的 PostToolUse matcher 配置 |
| 域名匹配失败 | 检查 URL 格式，确保是有效的 HTTP/HTTPS URL |
| 非文档网站生成了 skill | 调整 isDocumentationSite() 的评分阈值 |

## 版本历史

### v2.0.0 (2026-02-25)

- **重构**: 将 prompt-based hook 改为 command-based hook
- **新增**: web-cache-after.js 自动处理和 skill 生成
- **新增**: 智能文档型网站检测（评分机制）
- **新增**: 友好的用户输出格式
- **新增**: 自动告知 skill 触发方式和用法

### v1.0.0 (2026-02-12)

- Before hook 缓存检查
- After hook 缓存生成 (prompt-based)
- 强制刷新支持

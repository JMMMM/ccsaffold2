# Web Cache Hook 重构说明

## 更新时间
2026-02-25

## 变更概述

将原有的 prompt-based web cache hook 重构为更可靠的 command-based hook，实现自动缓存和 skill 生成。

## 开发流程

按照项目开发规范，本次重构遵循以下流程：

```
1. feature/web-cache-hooks/ 开发
   ↓
2. 组件化（独立 feature）
   ↓
3. 同步到 hooks/ 和 lib/
   ↓
4. 本项目生效（.claude/）
```

## 新增功能

### 1. 自动缓存和 Skill 生成

当使用 web-reader MCP 访问网站时，系统会自动：

1. **保存原始 markdown** 到 `doc/{cache-key}.md`
2. **分析网站类型**，判断是否为文档型网站
3. **自动生成 skill** 如果是文档型网站
4. **输出友好提示** 告知用户 skill 的触发方式和用法

### 2. 文档型网站检测算法

系统使用评分机制判断网站是否为文档型：

| 检测项 | 权重 | 说明 |
|--------|------|------|
| URL 特征 | +3 | docs.domain.com、/docs/、/api/ 等 |
| 内容结构 | +2 | 标题、代码块、表格、列表 |
| 技术关键词 | +1 | API、函数、方法、参数等 |
| 营销内容 | -5 | 广告、订阅、购买等 |
| 内容长度 | -3 | 内容少于500字符 |

**阈值**: 分数 >= 5 认为是文档型网站

### 3. 自动生成的 Skill 格式

```markdown
---
name: {cache-key}
description: {domain} 网站内容缓存
source_url: {原始URL}
cached_at: {ISO时间戳}
---

# Skill: {domain} 知识缓存

## Purpose
缓存 {domain} 网站的文档内容，提供快速离线访问。

## Source
- 原始 URL: {url}
- 缓存时间: {now}
- 完整存档: `doc/{cache-key}.md`

## Content Summary
[精炼的内容摘要]

## 触发方式
[触发关键词和使用场景]
```

## Feature 目录结构

```
feature/web-cache-hooks/
├── README.md                  # 功能说明
├── manifest.json              # v2.0.0
├── settings.fragment.json     # settings 片段
├── hooks/
│   ├── web-cache-before.js    # PreToolUse hook
│   └── web-cache-after.js     # PostToolUse hook (新增)
├── lib/
│   ├── cache-matcher.js       # 缓存匹配工具
│   └── url-utils.js           # URL 处理工具
└── scripts/
    └── install.js             # 安装脚本
```

## 配置变更

### settings.fragment.json (更新后)

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

## 使用示例

### 用户访问文档网站

```
用户: 访问 https://code.claude.com/docs/zh-CN/hooks
```

### 系统自动处理后输出

```markdown
## 网站内容已缓存

已成功访问并缓存网站内容。

### 缓存信息
| 项目 | 内容 |
|------|------|
| **域名** | code.claude.com |
| **URL** | https://code.claude.com/docs/zh-CN/hooks |
| **标题** | Hooks 参考 |

### 文档型网站检测

**主题**: Hooks 参考

该网站符合**文档型网站特征**，已自动生成可复用的 Skill。

---

### 生成的 Skill

**Skill 名称**: `code.claude.com/docs-zh-CN-hooks`

**文件位置**: `.claude/skills/learn/code.claude.com/docs-zh-CN-hooks/SKILL.md`

#### 触发方式

当您询问以下内容时，此 skill 会自动触发：

- 访问 **code.claude.com** 的任何 URL
- 询问关于 **Hooks 参考** 的内容
- 任何包含 `code.claude.com` 域名的网站访问请求

#### 功能说明

此 skill 提供以下功能：

1. **快速缓存命中**: 后续访问 code.claude.com 相关 URL 时，直接使用本地缓存
2. **离线访问**: 无需网络连接即可查阅文档
3. **上下文增强**: AI 可以直接引用缓存的文档内容提供更准确的回答

#### 使用示例

```
# 以下方式都会触发此 skill：

用户: 访问 https://code.claude.com/api
用户: code.claude.com 的文档在哪里？
用户: 查看 Hooks 参考的使用方法
```

---

### 完整存档

原始 markdown 内容已保存至: `doc/code.claude.com/docs-zh-CN-hooks.md`
```

## 技术实现

### web-cache-after.js 流程

```
PostToolUse 触发
       ↓
读取 stdin (tool_input, tool_response)
       ↓
提取 URL 和 content
       ↓
生成 cache-key (domain/path-hash)
       ↓
保存原始 markdown → doc/{cache-key}.md
       ↓
分析内容类型 (文档型?)
       ↓
   [是] → 生成 skill → skills/learn/{cache-key}/SKILL.md
   [否] → 仅保存存档
       ↓
生成用户友好输出
       ↓
返回 additionalContext
```

### 缓存键生成

```javascript
// 示例 URL: https://docs.nodejs.org/api/fs.html

// 1. 提取域名
domain = "docs.nodejs.org"

// 2. 提取路径
urlPath = "/api/fs.html"

// 3. 生成路径哈希和 slug
pathHash = "a1b2c3d4"  // MD5的前8位
pathSlug = "api-fs-html"  // 清理后的路径

// 4. 组合缓存键
cacheKey = "docs.nodejs.org/api-fs-html-a1b2c3d4"
```

### 文档型网站检测

```javascript
function isDocumentationSite(content, url) {
  let score = 0;

  // URL 特征
  if (/docs?\./i.test(url)) score += 3;
  if (/\/docs\//i.test(url)) score += 3;

  // 内容结构
  if (/##?\s+\w+/m.test(content)) score += 2;  // 有标题
  if (/```[\s\S]*?```/.test(content)) score += 2;  // 有代码块

  // 技术关键词
  const keywords = ['api', 'function', 'method', '参数', '示例'];
  keywords.forEach(k => {
    if (content.toLowerCase().includes(k)) score += 1;
  });

  // 非文档特征扣分
  if (/广告|buy now/i.test(content)) score -= 5;

  return score >= 5;
}
```

## 优势对比

| 特性 | 原方案 (prompt-based) | 新方案 (command-based) |
|------|----------------------|----------------------|
| **可靠性** | 依赖 LLM 执行，可能失败 | Node.js 脚本，稳定可靠 |
| **速度** | 需要等待 LLM 响应 | 直接执行，快速响应 |
| **一致性** | 输出格式可能变化 | 固定格式，一致性好 |
| **成本** | 消耗 API quota | 无额外 API 调用 |
| **可维护性** | prompt 难以调试 | 代码可调试可测试 |

## 注意事项

1. **缓存键唯一性**: 使用路径 slug + MD5 hash 确保不同 URL 有不同缓存
2. **内容截断**: Skill 内容限制 10000 字符，超出部分智能截断
3. **编码安全**: 所有文件名经过清理，避免路径遍历
4. **错误处理**: Hook 执行失败不影响正常工作流程

## 版本历史

### v2.0.1 (2026-02-25)

- **修复**: 修复 cacheKey 包含斜杠时路径不存在的 bug
- **修复**: 添加 `path.dirname()` 检查确保子目录存在

### v2.0.0 (2026-02-25)

- **重构**: 将 prompt-based hook 改为 command-based hook
- **新增**: web-cache-after.js 自动处理和 skill 生成
- **新增**: 智能文档型网站检测（评分机制）
- **新增**: 友好的用户输出格式
- **新增**: 自动告知 skill 触发方式和用法
- **规范**: 按照项目开发流程在 feature/ 目录开发

### v1.0.0 (2026-02-12)

- Before hook 缓存检查
- After hook 缓存生成 (prompt-based)
- 强制刷新支持

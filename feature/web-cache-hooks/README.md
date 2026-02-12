# Web Cache Hooks

为 web-reader MCP 提供本地缓存功能，减少重复的网络请求和 MCP 调用。

## 功能特性

- **Before Hook**: 检查本地缓存，命中时直接返回缓存内容
- **After Hook (prompt)**: 智能判断是否生成 skill，原始 markdown 始终保存
- **强制刷新**: 支持跳过缓存重新获取内容
- **多页面支持**: 同一域名下不同 URL 路径分别缓存

### Skill 生成判断逻辑

**会生成 skill 的内容：**
- 技术文档（API 参考、指南、教程）
- 可复用的知识模式（最佳实践、约定）
- 值得快速查阅的参考材料
- 带解释的代码示例

**不会生成 skill 的内容：**
- 新闻文章或时效性内容
- 营销/着陆页
- 错误页面或重定向
- 无可复用知识价值的内容
- 内容单薄的通用页面

## 安装

```bash
# 在项目根目录执行
node feature/web-cache-hooks/scripts/install.js
```

安装后目录结构:

```
.claude/
├── hooks/
│   └── web-cache-before.js    # 缓存检查 hook
├── skills/
│   └── learn/                 # 网站知识摘要
│       └── {domain}/
│           └── SKILL.md
├── doc/                       # 原始 markdown 存档
│   └── {domain}.md
└── settings.json              # 已合并的 hook 配置
```

## 使用方式

### 自动缓存

当请求读取网站内容时，系统自动:

1. **首次访问**: 调用 web-reader MCP -> 保存原始内容 + 生成 skill
2. **后续访问**: 直接使用缓存，跳过 MCP 调用

示例:

```
用户: 读取 https://docs.nodejs.org/api/fs.html 的内容

[首次] 系统调用 web-reader MCP，返回内容后自动缓存
[后续] 系统检测到缓存，直接返回缓存内容
```

### 强制刷新

如果需要强制刷新缓存:

```
用户: 重新读取 https://docs.nodejs.org/api/fs.html，跳过缓存
用户: 刷新 https://react.dev 的内容
```

关键词: `重新`, `刷新`, `跳过缓存`, `force refresh`, `reload`

## 缓存文件格式

### 原始 Markdown (doc/{domain}.md)

```markdown
<!--
Source: https://docs.nodejs.org/api/fs.html
Fetched: 2026-02-12T10:30:00Z
-->

# File System

Original markdown content...
```

### 知识摘要 (skills/learn/{domain}/SKILL.md)

```markdown
---
name: docs.nodejs.org
description: docs.nodejs.org 网站内容缓存
source_url: https://docs.nodejs.org/api/fs.html
cached_at: 2026-02-12T10:30:00Z
---

# docs.nodejs.org 知识摘要

## fs 模块

核心方法:
- fs.readFile(): 异步读取文件
- fs.writeFile(): 异步写入文件
...
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
      }]
    }],
    "PostToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{
        "type": "prompt",
        "prompt": "..."
      }]
    }]
  }
}
```

## 技术细节

- **语言**: Node.js 18+ (LTS)
- **依赖**: 无外部依赖，仅使用 Node.js 内置模块
- **跨平台**: 支持 Windows, Linux, macOS
- **日志**: 纯 ASCII，不含 emoji

## 故障排除

| 问题 | 解决方案 |
|------|---------|
| 缓存未被使用 | 检查 settings.json 中的 matcher 配置 |
| skill 未生成 | 确认 Claude Code 支持 prompt 类型 hook |
| 域名匹配失败 | 检查 URL 格式，确保是有效的 HTTP/HTTPS URL |

## 版本历史

- v1.0.0 (2026-02-12): 初始版本
  - Before hook 缓存检查
  - After hook 缓存生成
  - 强制刷新支持

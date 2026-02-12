# Quickstart: Web Reader MCP Cache Hooks

**Feature**: 005-web-cache-hooks
**Date**: 2026-02-12

## 概述

本功能为 web-reader MCP 提供缓存层，减少重复的网络请求和 MCP 调用。

## 安装

```bash
# 方式1: 使用安装脚本
node feature/web-cache-hooks/scripts/install.js

# 方式2: 手动安装
# 1. 复制 hooks 到 .claude/hooks/
cp feature/web-cache-hooks/hooks/*.js .claude/hooks/

# 2. 合并 settings.json 配置
# 将 settings.fragment.json 的内容合并到 .claude/settings.json
```

## 配置

安装后，`settings.json` 将包含以下 hook 配置:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/web-cache-before.js"
      }],
      "description": "Web-Cache: 检查网站缓存，优先使用已缓存内容"
    }],
    "PostToolUse": [{
      "matcher": "mcp__web-reader__webReader|mcp__web_reader__webReader",
      "hooks": [{
        "type": "prompt",
        "prompt": "将 web-reader 返回的 markdown 内容: 1) 保存原始内容到 doc/{domain}.md; 2) 总结核心知识点保存到 skills/learn/{domain}/SKILL.md。格式参考 data-model.md。"
      }],
      "description": "Web-Cache: 保存网站内容到本地缓存"
    }]
  }
}
```

## 使用方式

### 自动缓存

当用户请求读取网站内容时，系统自动:

1. **首次访问**: 调用 web-reader MCP → 保存原始内容 + 生成 skill
2. **后续访问**: 直接使用缓存，跳过 MCP 调用

示例对话:
```
用户: 读取 https://docs.nodejs.org/api/fs.html 的内容

[首次] 系统调用 web-reader MCP，返回内容后自动缓存
[后续] 系统检测到缓存，直接返回 skills/learn/docs.nodejs.org/SKILL.md 的内容
```

### 强制刷新

如果需要强制刷新缓存，用户可以显式指定:

```
用户: 重新读取 https://docs.nodejs.org/api/fs.html，跳过缓存
```

## 目录结构

```
.claude/
├── hooks/
│   ├── web-cache-before.js    # 缓存检查
│   └── web-cache-after.js     # (备用) 内容处理
├── skills/
│   └── learn/
│       ├── docs.nodejs.org/
│       │   └── SKILL.md       # Node.js 文档摘要
│       └── react.dev/
│           └── SKILL.md       # React 文档摘要
└── doc/
    ├── docs.nodejs.org.md     # Node.js 原始 markdown
    └── react.dev.md           # React 原始 markdown
```

## 验证安装

```bash
# 检查 hooks 是否存在
ls -la .claude/hooks/web-cache-*.js

# 检查 settings.json 配置
cat .claude/settings.json | grep -A5 "web-cache"

# 测试功能: 访问一个网站
# 在 Claude Code 会话中请求读取网站内容
```

## 故障排除

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 缓存未被使用 | matcher 未匹配 MCP 名称 | 检查 settings.json 中的 matcher 正则 |
| skill 未生成 | prompt hook 未触发 | 确认 Claude Code 版本支持 prompt 类型 |
| 域名匹配失败 | URL 解析问题 | 检查 web-cache-before.js 中的 URL 处理逻辑 |

## 依赖

- Node.js 18+ (LTS)
- 无外部 npm 依赖

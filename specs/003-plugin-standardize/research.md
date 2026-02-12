# Research: ccsaffold Plugin Standardization

**Date**: 2026-02-12
**Branch**: 003-plugin-standardize

## Research Tasks

### 1. Claude Code 插件规范研究

**来源**: https://code.claude.com/docs/zh-CN/plugins

**发现**:

1. **插件清单 (plugin.json)**
   - 位置: `.claude-plugin/plugin.json`
   - 必需字段: name, version, description
   - 可选字段: author, license, repository

2. **目录结构**
   | 目录 | 位置 | 目的 |
   |------|------|------|
   | `.claude-plugin/` | 插件根目录 | 包含 plugin.json 清单 |
   | `commands/` | 插件根目录 | 作为 Markdown 文件的 Skills |
   | `agents/` | 插件根目录 | 自定义 agent 定义 |
   | `skills/` | 插件根目录 | 具有 SKILL.md 文件的 Agent Skills |
   | `hooks/` | 插件根目录 | hooks.json 中的事件处理程序 |

3. **命名空间**
   - 插件命令格式: `/plugin-name:command-name`
   - 例如: `/ccsaffold:speckit.specify`
   - 命名空间防止插件之间的冲突

4. **本地测试**
   - 使用 `claude --plugin-dir ./ccsaffold` 测试插件
   - 修改后需要重启 Claude Code

**Decision**: 采用标准插件结构，使用 `ccsaffold` 作为插件名称

**Rationale**: 符合官方规范，便于分享和重用

---

### 2. 现有功能迁移策略

**分析对象**: 当前 `.claude/` 目录结构

**发现**:

1. **命令文件**
   - 当前位置: `.claude/commands/speckit.*.md`
   - 共 10 个命令文件
   - 格式: 已符合 Markdown 格式要求
   - 迁移方式: 直接复制到 `commands/` 目录

2. **Hooks**
   - 当前位置: `.claude/hooks/` (不存在，需要从 feature 目录复制)
   - 配置位置: `.claude/settings.json`
   - 迁移方式: 复制到 `hooks/` 目录，配置合并到 `hooks/hooks.json`

3. **Skills**
   - 当前位置: `skills/hook-creator/`
   - 格式: 包含 SKILL.md 文件
   - 迁移方式: 复制到 `skills/` 目录

**Decision**: 采用增量迁移策略，保持现有功能不变

**Rationale**: 降低迁移风险，确保功能向后兼容

---

### 3. plugin.json 配置研究

**来源**: Claude Code 官方文档

**Decision**: 使用以下配置

```json
{
  "name": "ccsaffold",
  "version": "1.0.0",
  "description": "Claude Code 脚手架插件，提供 speckit 工作流、session 日志和 Agent Skills",
  "author": "ming",
  "license": "MIT",
  "repository": "https://github.com/ming/ccsaffold"
}
```

**Rationale**:
- name: 简短易记，符合命名规范
- version: 初始版本 1.0.0
- description: 清晰描述插件功能

---

### 4. hooks.json 配置研究

**来源**: Claude Code Hooks 文档

**Decision**: 使用以下配置

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node hooks/log-user-prompt.js"
        }
      ]
    }]
  }
}
```

**Rationale**:
- 使用 `*` matcher 匹配所有提示
- 使用 Node.js 执行 hook 脚本
- 相对路径确保跨项目兼容

---

### 5. 独立配置 vs 插件模式对比

| 特性 | 独立配置 (`.claude/`) | 插件模式 |
|------|----------------------|----------|
| 可用范围 | 仅当前项目 | 所有安装的项目 |
| 分享方式 | 手动复制 | 市场安装 |
| 版本管理 | 无 | semver |
| 命令格式 | `/command` | `/plugin:command` |
| 配置位置 | settings.json | hooks.json |

**Decision**: 保留两种模式共存

**Rationale**:
- 开发时使用独立配置快速迭代
- 发布时使用插件模式分享

---

## Research Summary

| 研究任务 | 状态 | 结论 |
|----------|------|------|
| 插件规范研究 | DONE | 采用标准目录结构 |
| 迁移策略研究 | DONE | 增量迁移，保持兼容 |
| plugin.json 配置 | DONE | 使用 ccsaffold 作为名称 |
| hooks.json 配置 | DONE | 使用相对路径 |
| 模式对比 | DONE | 两种模式共存 |

## Open Questions

无未解决问题

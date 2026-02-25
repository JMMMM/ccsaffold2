# Claude Code CLAUDE.md 文件格式完整指南

> 基于官方文档、插件示例和项目实践整理
> 最后更新: 2026-02-24

## 目录

1. [CLAUDE.md 概述](#claude概述)
2. [支持的格式和语法](#支持的格式和语法)
3. [标题格式规范](#标题格式规范)
4. [指令书写方式](#指令书写方式)
5. [全局 CLAUDE.md 配置](#全局-claudemd-配置)
6. [项目 CLAUDE.md 配置](#项目-claudemd-配置)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## CLAUDE概述

### 什么是 CLAUDE.md

CLAUDE.md 是 Claude Code 的**项目级指令文件**，用于为 AI Agent 提供项目特定的上下文、规则和指导原则。

### 作用范围

| 位置 | 路径 | 作用范围 |
|------|------|---------|
| **全局** | `~/.claude/CLAUDE.md` | 所有项目 |
| **项目** | `<project>/.claude/CLAUDE.md` | 当前项目 |
| **项目根** | `<project>/CLAUDE.md` | 当前项目 |

### 优先级

```
项目级 CLAUDE.md > 全局 CLAUDE.md
```

当两者存在冲突时，项目级配置优先。

---

## 支持的格式和语法

### 1. Markdown 基础语法

CLAUDE.md **完全支持标准 Markdown 语法**：

#### 标题（Heading）

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
```

**关键点**: **完全支持 `#` 开头的标题格式**，这是推荐的标题书写方式。

#### 列表

```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

#### 强调

```markdown
**粗体文本**
*斜体文本*
~~删除线~~
`行内代码`
```

#### 代码块

````markdown
```javascript
function example() {
  return "Hello";
}
```
````

#### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
```

#### 链接和引用

```markdown
[链接文本](https://example.com)

> 引用文本
```

### 2. YAML 前置元数据（Frontmatter）

某些特殊文件（如 SKILL.md）支持 YAML frontmatter：

```markdown
---
name: skill-name
description: 技能描述
---

# 标题

内容...
```

**注意**: 普通 CLAUDE.md 通常**不需要** frontmatter，仅在 SKILL.md 等特殊文件中使用。

### 3. HTML 注释

支持使用 HTML 注释添加元信息：

```markdown
<!--
Source: https://example.com
Fetched: 2026-02-24
-->
```

---

## 标题格式规范

### 推荐格式

使用 **`#` 开头的标准 Markdown 标题**：

```markdown
# 项目名称

## 功能模块

### 子功能

#### 详细说明
```

### 标题层级建议

| 层级 | 用途 | 示例 |
|------|------|------|
| `#` | 项目/文档名称 | `# My Project Guidelines` |
| `##` | 主要章节 | `## Development Rules` |
| `###` | 次级章节 | `### Code Style` |
| `####` | 细节说明 | `#### Naming Conventions` |

### 避免

```markdown
❌ 不推荐: 使用下划线或等号做标题
标题 1
=====
标题 2
-----

✅ 推荐: 使用 # 号
# 标题 1
## 标题 2
```

---

## 指令书写方式

### 1. 简洁列表式

最简单直接的指令格式：

```markdown
# 项目指令

- 所有对话均使用中文
- 所有 py 文件必须用 python3.9 运行
- 代码禁止特殊 Unicode 字符
```

**适用场景**: 简单项目、少量规则

### 2. 结构化章节式

适用于复杂项目的详细指南：

```markdown
# Development Guidelines

## Active Technologies
- Node.js 18+ (LTS)
- Python 3.9

## Project Structure
\`\`\`
project/
├── src/
└── tests/
\`\`\`

## Code Style
- 使用 2 空格缩进
- 遵循 PEP 8 规范

## Development Rules
### MUST
- 测试先行
- 代码审查

### MUST NOT
- 不提交密钥
- 不使用硬编码路径
```

**适用场景**: 大型项目、多团队协作

### 3. 分层引用式

使用 `@` 符号引用其他文档：

```markdown
# Project Guidelines

## 功能模块
- @./hooks/CLAUDE.md - Hook 开发指南
- @./lib/CLAUDE.md - 核心库文档
- @./skills/CLAUDE.md - 技能模块文档
```

**适用场景**: 模块化项目、避免单文件过长

### 4. 关键词强调式

使用关键词突出重点：

```markdown
## 核心原则 (NON-NEGOTIABLE)

### I. 功能独立可复用
项目中每个功能 MUST 可以独立使用

- 每个功能 MUST 独立开发、独立测试
- 功能之间 MUST 保持松耦合

**Rationale**: 本项目核心价值在于复用
```

**推荐关键词**:
- `MUST` / `MUST NOT` - 强制要求
- `NON-NEGOTIABLE` - 不可协商的原则
- `Rationale` - 原因说明

---

## 全局 CLAUDE.md 配置

### 位置

```
~/.claude/CLAUDE.md
```

### 典型示例

```markdown
# 全局开发规范

- 所有对话均使用中文
- 所有对话均采用中文进行
- 所有 py 都必须用 python39 或 python3.9 运行
- 代码禁止一切特殊 Unicode 字符
- 所有 MD 文档都应该放在 doc 文件夹内
```

### 用途

设置**跨项目的一致性规则**：
- 编码规范（语言版本、代码风格）
- 沟通偏好（语言、格式）
- 文档规范（存放位置、命名规则）
- 安全规则（禁止敏感信息）

### 注意事项

1. **保持简洁**: 只放置真正需要全局生效的规则
2. **避免冲突**: 使用项目级 CLAUDE.md 覆盖全局规则
3. **定期审查**: 移除过时的全局配置

---

## 项目 CLAUDE.md 配置

### 位置

```
<project>/CLAUDE.md          # 推荐：项目根目录
<project>/.claude/CLAUDE.md  # 可选：隐藏配置
```

### 典型结构

```markdown
# Project Name Development Guidelines

## 概述
[项目简介和目标]

## Active Technologies
- Node.js 18+ (LTS)
- PostgreSQL 14
- React 18

## Project Structure
[目录结构说明]

## Development Guidelines
### Code Style
[编码规范]

### Testing
[测试要求]

### Deployment
[部署流程]

## Special Instructions
### Hooks
- SessionEnd 触发自动分析

### Skills
- 使用 manual-learn 生成技能

## Recent Changes
- 2026-02-24: 添加新功能 X
```

### 推荐章节

| 章节 | 内容 | 必需性 |
|------|------|--------|
| **概述** | 项目简介和目标 | 推荐 |
| **技术栈** | 使用的技术和版本 | 推荐 |
| **目录结构** | 项目文件组织 | 推荐 |
| **开发规范** | 编码、测试、部署规则 | 必需 |
| **特殊说明** | Hooks、Skills、插件配置 | 可选 |
| **变更记录** | Recent Changes | 可选 |

---

## 最佳实践

### 1. 分层管理

#### 根目录 CLAUDE.md

```markdown
# Project Guidelines

## 功能模块索引
- @./hooks/CLAUDE.md
- @./lib/CLAUDE.md
- @./skills/CLAUDE.md

## 全局规则
- 使用中文
- Python 3.9
```

#### 子目录 CLAUDE.md

```markdown
# Hooks 模块

## 功能说明
[详细描述]

## 代码文件
### session-logger.js
| 方法 | 说明 |
|------|------|
| `main()` | 主入口 |
```

**优势**:
- 避免根文件过长
- 便于维护和更新
- 清晰的模块边界

### 2. 版本管理

**不要在 CLAUDE.md 中维护版本信息**：

```markdown
❌ 错误:
## Recent Changes
- v1.5.0: 2026-02-12 - 添加功能 A
- v1.4.0: 2026-02-10 - 修复问题 B

✅ 正确:
版本信息由 git 管理，CLAUDE.md 只关注当前功能描述
```

**原因**: Git 已提供完整的版本历史，文档不应重复。

### 3. 指令清晰度

#### 避免模糊指令

```markdown
❌ 模糊:
- 尽量使用 TypeScript
- 最好写测试

✅ 清晰:
- 新功能 MUST 使用 TypeScript
- 所有代码变更 MUST 包含测试用例
```

#### 使用 MUST/MUST NOT

```markdown
## 核心规则 (NON-NEGOTIABLE)

- 所有日志 MUST NOT 包含 emoji
- Hook 脚本 MUST 始终以 process.exit(0) 退出
- 敏感信息 MUST NOT 提交到仓库
```

### 4. 格式一致性

#### 统一术语

```markdown
- 全部使用 "Claude Code" 而非 "claude-code" 或 "CC"
- 全部使用 "Hooks" 而非 "hooks" 或 "hook"
```

#### 统一列表风格

```markdown
✅ 推荐: 使用 `-` 无序列表
- 项目 1
- 项目 2

❌ 避免: 混用不同列表符号
* 项目 1
- 项目 2
+ 项目 3
```

### 5. 文档同步

**代码修改后同步更新 CLAUDE.md**：

```markdown
### auto-learning.js

功能描述：SessionEnd 事件的异步调度器

| 方法/函数 | 说明 |
|-----------|------|
| `main()` | 主入口，读取 stdin 并处理 |
| `spawnWorker()` | 启动 detached 子进程 |  <-- 新增方法时同步更新
```

---

## 常见问题

### Q1: 标题必须用 # 吗？

**A**: 是的，强烈推荐。

```markdown
✅ 推荐: # 标题
❌ 避免: 标题\n======
```

`#` 号是标准 Markdown 语法，兼容性最好。

### Q2: CLAUDE.md 支持哪些特殊语法？

**A**:
- 标准 Markdown: **完全支持**
- YAML frontmatter: 仅在 SKILL.md 等特殊文件中
- HTML 注释: 支持
- 自定义语法: **不支持**

### Q3: 全局和项目 CLAUDE.md 冲突怎么办？

**A**: 项目级优先。

```
全局: 使用 Python 3.8
项目: 使用 Python 3.9

结果: 使用 Python 3.9（项目级优先）
```

### Q4: CLAUDE.md 文件应该多大？

**A**:
- **全局**: 建议小于 50 行
- **项目根**: 建议小于 300 行，超过则考虑分层
- **子目录**: 不限，根据需要

### Q5: 如何引用其他文档？

**A**: 使用 `@` 符号：

```markdown
- @./hooks/CLAUDE.md
- @../lib/CLAUDE.md
- @https://example.com/guide.md
```

### Q6: 可以在 CLAUDE.md 中写代码示例吗？

**A**: 可以，使用 Markdown 代码块：

````markdown
```javascript
function example() {
  return "Hello";
}
```
````

### Q7: 如何强制执行某些规则？

**A**: 使用关键词强调：

```markdown
## 核心原则 (NON-NEGOTIABLE)

- 敏感信息 MUST NOT 提交
- 所有代码 MUST 通过测试
```

### Q8: CLAUDE.md 支持 emoji 吗？

**A**:
- 技术上: 支持
- 实践上: **不推荐**

原因：
- 部分终端不支持 emoji 显示
- 可能导致日志乱码
- 影响文档专业性

### Q9: 如何处理多语言项目？

**A**: 在 CLAUDE.md 中明确指定：

```markdown
## Language Settings

- 沟通语言: 中文
- 代码注释: 英文
- 变量命名: 英文
- 文档语言: 中文
```

### Q10: CLAUDE.md 应该包含哪些内容？

**A**:

**应该包含**:
- 项目特定的技术栈
- 编码规范和约定
- 目录结构说明
- 特殊的 Hook/Skill 配置
- 安全和合规要求

**不应该包含**:
- 版本历史（用 git）
- 通用的编程知识
- 与项目无关的规则
- 过于冗长的教程

---

## 附录：参考示例

### 示例 1: 简单项目

```markdown
# My Project

## 概述
简单的 Node.js 工具项目

## 技术栈
- Node.js 18+
- TypeScript 5

## 规则
- 使用 npm 而非 yarn
- 所有函数必须有类型注解
- 提交前运行 npm test
```

### 示例 2: 复杂项目（分层）

**根目录 CLAUDE.md**:

```markdown
# Enterprise Project

## 模块索引
- @./backend/CLAUDE.md
- @./frontend/CLAUDE.md
- @./docs/CLAUDE.md

## 全局规则
- 所有服务使用 Docker
- API 遵循 OpenAPI 3.0 规范
```

**backend/CLAUDE.md**:

```markdown
# Backend Guidelines

## 技术栈
- Node.js 20
- PostgreSQL 15
- Redis 7

## 开发规范
### API 设计
- RESTful 风格
- 统一错误处理

### 数据库
- 所有迁移必须可回滚
- 禁止在代码中硬编码 SQL
```

### 示例 3: 全局配置

```markdown
# Global Development Settings

## 语言和沟通
- 所有对话使用中文
- 代码注释使用英文
- Commit message 使用英文

## 工具链
- Python: 3.9
- Node.js: 18 LTS
- Go: 1.21

## 安全规则
- 禁止提交密钥和密码
- 禁止硬编码敏感信息
- 使用 .env 管理环境变量
```

---

## 参考资源

### 官方文档
- [Claude Code Plugins](https://code.claude.com/docs/zh-CN/discover-plugins)
- [Agent Skills Standard](http://agentskills.io)

### 项目资源
- [ccsaffold2 Constitution](F:/ccsaffold2/constitution.md)
- [Claude Code Hooks Reference](F:/ccsaffold2/skills/hook-creator/references/hook-events.md)

### 示例插件
- [anthropic-agent-skills](https://github.com/anthropics/skills)

---

## 版本历史

- 2026-02-24: 初始版本，基于官方文档和项目实践整理

---

**文档作者**: Claude Code Agent
**最后更新**: 2026-02-24
**适用版本**: Claude Code 1.0.33+

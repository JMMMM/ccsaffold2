<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version change: 1.5.0 → 1.5.1 (细化 Principle VIII)

Modified sections:
  - Principle VIII: CLAUDE.md 禁止维护版本信息

Added sections:
  - None

Removed sections:
  - None

Templates requiring updates:
  - .specify/templates/plan-template.md: No changes needed (generic template)
  - .specify/templates/spec-template.md: No changes needed (generic template)
  - .specify/templates/tasks-template.md: No changes needed (generic template)

Follow-up TODOs:
  - 移除现有 CLAUDE.md 中的版本/Recent Changes 信息
=============================================================================
-->

# CCSaffold Constitution

本项目是一个AI脚手架，用于将AI实践固化下来，能够在不同项目中选择性复用。
核心思想：**复用、可移植、多平台**。

## Core Principles

### I. 功能独立可复用

项目中每个功能MUST可以独立使用，用户可自主选择需要的功能进行组合。

- 每个功能MUST独立开发、独立测试、独立部署
- 功能之间MUST保持松耦合，避免相互依赖导致的绑定
- 功能MUST提供简单易用的接口，降低用户使用门槛
- 功能实现时MUST考虑性能，确保高效运行

**Rationale**: 本项目核心价值在于复用和移植，功能独立性是实现这一目标的基础。

### II. TDD开发模式 (NON-NEGOTIABLE)

所有功能开发MUST遵循测试驱动开发(TDD)模式。

- 测试先行：测试用例MUST在实现代码之前编写
- Red-Green-Refactor循环MUST严格执行
- 用户确认测试用例后，确保测试失败，再进行实现
- 所有测试MUST通过后，功能方可视为完成

**Rationale**: TDD确保代码质量和可维护性，防止回归问题，是项目稳定性的保障。

### III. 代码可读性优先

代码MUST是人类可读的，保持简单直接高效。

- 在可读性和性能冲突时，优先选择可读性
- 遵循单一功能原则，每个模块只做一件事
- 遵循高内聚低耦合原则，模块内部紧密相关，模块之间松散连接
- 避免过度工程化和过度抽象

**Rationale**: 代码是写给人看的，可读性直接影响项目的可维护性和团队协作效率。

### IV. 跨平台兼容性

所有功能MUST兼容Windows、Linux、macOS三大操作系统。

- 如果NodeJS能实现跨平台，MUST优先使用NodeJS处理兼容性问题
- 避免创建平台特定的脚本文件(ps1、sh)，在NodeJS中统一处理
- 路径处理MUST使用跨平台兼容的方式，禁止使用硬编码路径

**Rationale**: 跨平台兼容性是项目移植性的关键保障。

### V. 信息安全合规

项目MUST严格遵守信息安全规范。

- 项目MUST NOT包含用户个人信息、系统信息等敏感信息
- 项目MUST NOT包含任何违法违规内容
- 功能实现时MUST避免通过相对路径(..)访问上级目录，确保安全性和独立性

**Rationale**: 信息安全是项目可持续发展的基础，合规性是不可逾越的红线。

### VI. 插件化功能存储 (NON-NEGOTIABLE)

所有功能MUST直接在插件根目录开发，采用标准化的目录结构，便于安装到目标项目。

**插件目录结构规范**:

```
ccsaffold2/                    # 插件根目录
├── .claude-plugin/
│   └── plugin.json            # 插件清单
├── hooks/                     # Hook脚本 → 安装到目标项目 .claude/hooks/
│   ├── hooks.json             # hooks配置
│   └── *.js                   # Hook脚本
├── lib/                       # 核心库文件 → 安装到目标项目 .claude/lib/
├── scripts/                   # 辅助脚本（安装、验证等）
├── skills/                    # 技能定义 → 安装到目标项目 .claude/skills/
├── commands/                  # 命令定义 → 安装到目标项目 .claude/commands/
├── agents/                    # Agent定义 → 安装到目标项目 .claude/agents/
└── README.md                  # 插件说明和使用指南
```

**安装规范**:

- 功能安装MUST支持 `node scripts/install.js <target-project>` 命令
- 安装时MUST增量复制，不覆盖已有文件
- `settings.json` MUST采用合并策略，不覆盖已有配置
- 安装脚本MUST创建必要的目录结构

**Hooks 开发规范**:

- Hook 脚本MUST使用相对路径（如 `.claude/hooks/xxx.js`），不使用环境变量
- 脚本内使用 `__dirname` 解析路径，避免依赖工作目录
- 工具过滤逻辑MUST放在 `settings.json` 的 `matcher` 中，保持脚本简洁
- Hook 脚本MUST始终以 `process.exit(0)` 退出，避免阻塞

**复用要求**:

- 插件MUST提供清晰的README说明安装步骤
- 插件MUST支持 `--plugin-dir` 方式临时加载
- 提供验证脚本确保安装成功

**Rationale**: 插件化存储是实现功能复用的基础，标准化目录结构降低使用门槛，一键安装避免手动复制。

### VII. 日志规范 (NON-NEGOTIABLE)

所有日志输出MUST遵守以下规范，确保可读性和兼容性。

**禁止内容**:

- 日志MUST NOT包含emoji表情符号
- 日志MUST NOT包含特殊Unicode字符（如箭头符号、星号装饰等）

**格式要求**:

- 使用纯ASCII字符进行日志输出
- 日志前缀格式：`[模块名]` 或 `[模块名-子模块]`
- 日志级别标识：`INFO`、`WARN`、`ERROR`、`DEBUG`
- 时间戳格式（可选）：`YYYY-MM-DD HH:mm:ss`

**示例**:

```
[Auto-Learning] INFO: Starting analysis...
[Auto-Learning] WARN: No transcript records found
[Auto-Learning] ERROR: Failed to parse input
```

**Rationale**:
- 部分终端环境不支持emoji显示，会导致乱码
- 日志文件的可读性和可搜索性更重要
- 保持输出的一致性和专业性

### VIII. CLAUDE.md 文件分层管理 (NON-NEGOTIABLE)

CLAUDE.md 文件MUST采用分层管理，根目录与功能目录职责分离。

**根目录 CLAUDE.md 规范**:

- 根目录 CLAUDE.md MUST NOT包含过多实现细节（如项目启动命令、运行脚本等）
- 根目录 CLAUDE.md MUST使用 `@引用` 方式关联功能目录的 CLAUDE.md
- 根目录 CLAUDE.md 职责：项目概述、目录结构说明、功能模块索引

**功能目录 CLAUDE.md 规范**:

- 功能目录 CLAUDE.md MUST精准描述当前目录的功能
- 功能目录 CLAUDE.md 内容MUST包含：功能说明、使用方法、配置项、依赖关系
- 功能目录 CLAUDE.md MUST提供该目录下每个代码文件的功能及方法列表
- 功能修改后，对应的 CLAUDE.md MUST同步更新，保持与实际功能一致

**禁止内容**:

- 所有 CLAUDE.md 文件MUST NOT包含版本信息、变更日志（如 "Recent Changes"、"版本历史" 等）
- 版本信息由 git 管理，CLAUDE.md 只关注当前功能描述

**代码文件方法列表格式**:

```markdown
## 代码文件

### 文件名.js

功能描述：简要说明该文件的用途

| 方法/函数 | 说明 |
|-----------|------|
| `functionName(param)` | 功能描述 |
| `anotherFunction()` | 功能描述 |
```

**示例结构**:

```
project/
├── CLAUDE.md                 # 根目录：概述 + @引用功能模块
├── hooks/
│   └── CLAUDE.md             # hooks 功能详细说明 + 代码方法列表
├── lib/
│   └── CLAUDE.md             # 核心库详细说明 + 代码方法列表
└── skills/
    └── CLAUDE.md             # 技能模块详细说明 + 代码方法列表
```

**根目录 CLAUDE.md 示例**:

```markdown
# 项目名称

## 功能模块
- @./hooks/CLAUDE.md - Hook 开发指南
- @./lib/CLAUDE.md - 核心库文档
- @./skills/CLAUDE.md - 技能模块文档
```

**Rationale**:
- 分层管理避免根目录 CLAUDE.md 膨胀难以维护
- 功能目录文档与代码同位置，便于同步更新
- 代码方法列表提供快速参考，减少代码阅读成本
- 引用方式保持上下文清晰，避免信息冗余

## Technology Stack

### 技术选型优先级

1. **首选**: NodeJS - 用于实现跨平台兼容的功能
2. **备选**: Python 3.9 - 当NodeJS无法实现时使用

### 参考文档要求

在开发Claude Code功能组件时，MUST参考官方文档。

- 使用context7 MCP工具获取最新文档
- 开发前MUST先了解相关功能模块的官方规范
- 例如：开发hooks时，必须先通过context7了解Claude Code hooks的相关内容

## Feature Architecture

### 目标目录结构

功能安装后的目标目录结构：

```
.claude/
├── hooks/              # Hook脚本
├── lib/                # 核心库文件
├── scripts/            # 运行时脚本
├── skills/             # 技能定义
├── commands/           # 命令定义
├── agents/             # Agent定义
├── conversations/      # 会话记录
├── settings.json       # 合并后的配置
└── CLAUDE.md           # Agent上下文
```

### 记录文件位置

功能运行时产生的记录文件MUST放置在`.claude`目录下：

- 会话记录：`.claude/conversations/`
- 技能库：`.claude/skills/`
- 其他运行时数据：`.claude/[appropriate-subdirectory]/`

### 工作目录管理

- 功能实现时MUST使用绝对路径或工作目录变量
- 禁止使用`..`相对路径访问上级目录
- 确保功能的独立性和安全性

### 移植性要求

- MUST提供最简单的命令进行功能移植/复用
- 移植命令MUST清晰明确，易于理解和执行

## Governance

### 修订流程

1. 宪章修订MUST经过充分讨论和确认
2. 修订后MUST更新版本号（遵循语义化版本规范）
3. 修订后MUST同步更新`/doc/def_consititution.md`文件，保持一致性

### 版本规范

- **MAJOR**: 不兼容的原则移除或重新定义
- **MINOR**: 新增原则或实质性扩展指导
- **PATCH**: 澄清、措辞调整、错误修正

### 合规检查

- 所有PR/代码审查MUST验证符合本宪章
- 复杂度增加MUST有充分理由
- 偏离原则MUST在文档中明确说明原因

**Version**: 1.5.1 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-14

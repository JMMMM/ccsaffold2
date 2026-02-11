<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version change: N/A → 1.0.0 (Initial creation)

Added sections:
  - Core Principles (5 principles)
  - Technology Stack
  - Feature Architecture
  - Governance

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No changes needed (generic template)
  - .specify/templates/spec-template.md: ✅ No changes needed (generic template)
  - .specify/templates/tasks-template.md: ✅ No changes needed (generic template)

Follow-up TODOs:
  - Sync with /doc/def_consititution.md when amendments are made
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

### 目录结构规范

```
feature/[feature-name]/
├── .claude/
│   ├── SKILLS/          # 技能定义
│   ├── COMMANDS/        # 命令定义
│   ├── AGENTS/          # Agent定义
│   └── HOOKS/           # Hook定义
└── [其他功能相关文件]
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

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11

# Implementation Plan: 会话内容记录功能

**Branch**: `001-session-logging` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-session-logging/spec.md`

## Summary

实现一个基于Claude Code hooks的会话内容记录功能。通过监听UserPromptSubmit和PostToolUse事件，自动记录用户提示和AI工具使用情况到日志文件。系统采用滚动更新策略，限制user行数在100行以内，超出时删除最早的1/3内容。使用Node.js实现，确保跨Windows、macOS、Linux三个平台的兼容性。

## Technical Context

**Language/Version**: Node.js 18+ (LTS)
**Primary Dependencies**: 无外部依赖，使用Node.js内置模块（fs, path, readline, process）
**Storage**: 文件系统（.claude/conversations/conversation.txt）
**Testing**: Node.js内置assert模块 + 手动集成测试
**Target Platform**: Windows, macOS, Linux（跨平台兼容）
**Project Type**: Single - Claude Code hooks脚本
**Performance Goals**: 记录追加 < 1秒，滚动更新 < 500ms
**Constraints**: 无锁机制（Claude Code串行处理事件），user行数 ≤ 100行
**Scale/Scope**: 单项目会话日志，小规模

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 功能独立可复用 | ✅ PASS | 功能完全独立，可单独安装到任意项目 |
| II. TDD开发模式 | ⏳ PENDING | 需在实现阶段严格执行测试先行 |
| III. 代码可读性优先 | ✅ PASS | 设计简洁，单一职责 |
| IV. 跨平台兼容性 | ✅ PASS | Node.js实现，使用path模块处理路径 |
| V. 信息安全合规 | ✅ PASS | 无敏感信息，使用规范路径 |

**Gate Result**: ✅ PASS - 可以进入Phase 0研究阶段

## Project Structure

### Documentation (this feature)

```text
specs/001-session-logging/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件 - 实现计划
├── research.md          # Phase 0 输出 - 技术研究
├── data-model.md        # Phase 1 输出 - 数据模型
├── quickstart.md        # Phase 1 输出 - 快速开始指南
├── contracts/           # Phase 1 输出 - 接口契约
│   └── hook-input.md    # Hook输入数据结构
└── tasks.md             # Phase 2 输出 - 任务列表
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── log-user-prompt.js      # UserPromptSubmit事件处理
│   └── log-tool-use.js         # PostToolUse事件处理
└── lib/
    ├── logger.js               # 核心日志记录模块
    └── file-utils.js           # 文件操作工具模块

tests/
├── unit/
│   ├── logger.test.js          # logger模块单元测试
│   └── file-utils.test.js      # file-utils模块单元测试
└── integration/
    └── hooks.test.js           # Hooks集成测试

.claude/
├── settings.json               # Hook配置
└── conversations/
    └── conversation.txt        # 会话日志文件（运行时生成）
```

**Structure Decision**: 采用单项目结构。核心逻辑放在lib目录，hooks脚本放在hooks目录，通过require引用共享模块。

## Complexity Tracking

> 无宪章违规，无需记录复杂度证明。

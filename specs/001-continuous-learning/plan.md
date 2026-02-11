# Implementation Plan: 持续学习 (Continuous Learning)

**Branch**: `001-continuous-learning` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-continuous-learning/spec.md`

## Summary

实现一个持续学习系统，能够从 Claude Code 会话内容中自动/手动识别"用户多次反复沟通后才最终修复的问题"，将其总结为可复用的 skill 文件保存到项目的 `.skills/learn` 目录。

技术方案：使用 Node.js 18+ 内置模块（fs, path, https）实现跨平台兼容，通过 sessionEnd hook 触发自动学习，通过 skill 实现手动学习。

## Technical Context

**Language/Version**: Node.js 18+ (LTS)
**Primary Dependencies**: 无外部依赖，使用 Node.js 内置模块（fs, path, https, crypto）
**Storage**: 文件系统（.skills/learn 目录）
**Testing**: Node.js 内置 assert 模块 + 手动测试脚本
**Target Platform**: Windows, macOS, Linux（跨平台兼容）
**Project Type**: 单一项目（Hook 脚本 + Skill 定义）
**Performance Goals**: 会话结束后 30 秒内完成处理
**Constraints**: 无外部依赖、静默失败、不阻塞会话结束
**Scale/Scope**: 单用户、单项目、小型 skill 库（预期 < 100 skills）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 功能独立可复用 | ✅ PASS | 独立的 hook 脚本和 skill 定义，可选择性安装 |
| II. TDD开发模式 | ✅ PASS | 计划包含测试先行策略 |
| III. 代码可读性优先 | ✅ PASS | 单一职责，每个模块只做一件事 |
| IV. 跨平台兼容性 | ✅ PASS | 使用 Node.js 内置模块处理跨平台兼容 |
| V. 信息安全合规 | ✅ PASS | 敏感信息过滤机制，不访问上级目录 |
| VI. 模块化功能存储 | ✅ PASS | 遵循 feature/ 目录结构规范 |

**Gate Result**: PASS - 所有原则检查通过

## Project Structure

### Documentation (this feature)

```text
specs/001-continuous-learning/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── skill-template.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
feature/continuous-learning/
├── hooks/
│   └── auto-learning.js       # sessionEnd hook 脚本
├── lib/
│   ├── transcript-reader.js   # 读取和解析 transcript 文件
│   ├── llm-analyzer.js        # LLM 调用和内容分析
│   ├── skill-generator.js     # Skill 文件生成
│   └── sensitive-filter.js    # 敏感信息过滤
├── scripts/
│   ├── install.sh             # 安装脚本
│   ├── verify.sh              # 验证脚本
│   └── test.sh                # 测试脚本
├── skills/
│   └── manual-learn.md        # 手动学习 skill 定义
├── settings.json              # Hook 配置片段
└── README.md                  # 功能说明

.claude/                       # 安装后目标目录
├── hooks/
│   └── auto-learning.js
├── lib/
│   ├── transcript-reader.js
│   ├── llm-analyzer.js
│   ├── skill-generator.js
│   └── sensitive-filter.js
├── skills/
│   └── manual-learn.md
└── settings.json              # 合并后配置

.skills/                       # 生成的 skill 存储目录（项目根目录）
└── learn/
    └── *.md                   # 学习生成的 skill 文件
```

**Structure Decision**: 采用单一项目结构，核心代码在 feature/continuous-learning/ 目录下，遵循宪章 VI 的模块化存储规范。

## Complexity Tracking

> 无违规需要说明

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |

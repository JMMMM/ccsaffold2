# Implementation Plan: Web Reader MCP Cache Hooks

**Branch**: `005-web-cache-hooks` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-web-cache-hooks/spec.md`

## Summary

为 web-reader MCP 实现 before/after 钩子，缓存网站内容到本地 skills 和 doc 目录，减少重复 MCP 调用，提升响应速度。Before hook 检查缓存优先使用，After hook (prompt 类型) 保存原始 markdown 并总结为 skill。

## Technical Context

**Language/Version**: Node.js 18+ (LTS) - 与项目现有 hooks 保持一致
**Primary Dependencies**: 无外部依赖，使用 Node.js 内置模块（fs, path, url, readline）
**Storage**: 文件系统（`skills/learn/` 和 `doc/` 目录）
**Testing**: 手动测试 + 功能验证脚本
**Target Platform**: 跨平台（Windows, Linux, macOS）
**Project Type**: Claude Code 插件 (hooks)
**Performance Goals**: 缓存命中时响应时间减少 80%+
**Constraints**: 无外部依赖，日志不使用 emoji，使用纯 ASCII
**Scale/Scope**: 单用户本地缓存，每个网站一个 skill 文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 功能独立可复用 | PASS | 钩子功能独立，可选择性安装 |
| II. TDD开发模式 | PASS | 将编写测试用例验证钩子行为 |
| III. 代码可读性优先 | PASS | 保持简单直接，避免过度抽象 |
| IV. 跨平台兼容性 | PASS | 使用 Node.js 内置模块，路径使用 path.join |
| V. 信息安全合规 | PASS | 不涉及敏感信息，使用相对路径 |
| VI. 模块化功能存储 | PASS | 遵循 feature/ 目录结构规范 |
| VII. 日志规范 | PASS | 日志不使用 emoji，使用纯 ASCII |

**Gate Result**: PASS - 所有原则检查通过

## Project Structure

### Documentation (this feature)

```text
specs/005-web-cache-hooks/
├── spec.md              # 功能规范
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
└── tasks.md             # Phase 2 输出 (/speckit.tasks)
```

### Source Code (feature module)

```text
feature/web-cache-hooks/
├── hooks/
│   ├── web-cache-before.js    # PreToolUse hook - 检查缓存
│   └── web-cache-after.js     # PostToolUse hook - 保存缓存
├── scripts/
│   └── install.js             # 安装脚本
├── settings.fragment.json     # settings.json 片段
└── README.md                  # 功能说明

# 安装后复制到
.claude/
├── hooks/
│   ├── web-cache-before.js
│   └── web-cache-after.js
├── skills/
│   └── learn/                 # 网站缓存 skills
│       └── {domain}/
│           └── SKILL.md
├── doc/                       # 原始 markdown 存档
│   └── {domain}.md
└── settings.json              # 合并后的配置
```

**Structure Decision**: 使用 Claude Code 插件的标准 feature 目录结构，hooks 存放在 `feature/web-cache-hooks/hooks/`，安装时复制到 `.claude/hooks/`。

## Complexity Tracking

无需记录 - 无宪章违规需要说明。

# Implementation Plan: ccsaffold Plugin Standardization

**Branch**: `003-plugin-standardize` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-plugin-standardize/spec.md`

## Summary

将 ccsaffold2 项目从独立配置模式（`.claude/` 目录）转换为符合 Claude Code 官方插件规范的标准插件。插件名为 `ccsaffold`，包含 speckit 工作流命令、session 日志 hooks 和 Agent Skills，支持通过 `--plugin-dir` 本地测试或通过市场安装。

## Technical Context

**Language/Version**: Node.js 18+ (LTS)
**Primary Dependencies**: 无外部依赖，使用 Node.js 内置模块（fs, path, readline）
**Storage**: 文件系统（doc/session_log/ 目录用于会话日志）
**Testing**: 手动测试 + `--plugin-dir` 标志验证
**Target Platform**: Claude Code 1.0.33+
**Project Type**: Claude Code 插件
**Performance Goals**: 插件加载不显著影响 Claude Code 启动速度
**Constraints**: 无外部依赖，符合 Claude Code 插件规范
**Scale/Scope**: 10 个 speckit 命令 + 2 个 hooks + 2 个 skills

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 功能独立可复用 | PASS | 插件模式支持独立安装和使用 |
| II. TDD开发模式 | PASS | 通过 `--plugin-dir` 进行测试验证 |
| III. 代码可读性优先 | PASS | 插件结构清晰，符合官方规范 |
| IV. 跨平台兼容性 | PASS | 使用 Node.js，无平台特定脚本 |
| V. 信息安全合规 | PASS | 无敏感信息，使用相对路径 |
| VI. 模块化功能存储 | PASS | 插件结构即为模块化存储 |
| VII. 日志规范 | PASS | 日志不包含 emoji 和特殊字符 |

**Gate Status**: PASSED - 所有宪法原则均符合

## Project Structure

### Documentation (this feature)

```text
specs/003-plugin-standardize/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (plugin structure)

```text
ccsaffold/                          # 插件根目录
├── .claude-plugin/
│   └── plugin.json                 # 插件清单（元数据）
├── commands/                       # 用户可调用的 slash 命令
│   ├── speckit.specify.md
│   ├── speckit.plan.md
│   ├── speckit.tasks.md
│   ├── speckit.implement.md
│   ├── speckit.clarify.md
│   ├── speckit.analyze.md
│   ├── speckit.constitution.md
│   ├── speckit.checklist.md
│   └── speckit.taskstoissues.md
├── hooks/                          # 事件处理程序
│   ├── hooks.json                  # Hook 配置
│   └── log-user-prompt.js          # Session 日志 hook
├── skills/                         # Agent Skills
│   ├── hook-creator/
│   │   ├── SKILL.md
│   │   └── assets/templates/
│   └── learn/
│       └── SKILL.md
├── .specify/                       # speckit 工作流支持文件
│   ├── memory/
│   ├── scripts/
│   └── templates/
└── README.md                       # 安装使用文档
```

**Structure Decision**: 采用标准 Claude Code 插件结构，符合官方规范。commands/ 目录包含所有 speckit 命令，hooks/ 目录包含 session 日志 hook，skills/ 目录包含 Agent Skills。

## Migration Strategy

### 当前结构 → 插件结构映射

| 当前位置 | 插件位置 | 说明 |
|----------|----------|------|
| `.claude/commands/*.md` | `commands/*.md` | 命令文件直接迁移 |
| `.claude/hooks/*.js` | `hooks/*.js` | Hook 脚本迁移 |
| `.claude/settings.json` | `hooks/hooks.json` | Hook 配置迁移 |
| `skills/hook-creator/` | `skills/hook-creator/` | Skill 迁移 |
| `feature/*/` | 保留 | 功能模块存储（用于参考） |
| `.specify/` | `.specify/` | speckit 工作流支持文件 |

### 不变的内容

- `.claude/` 目录保留为开发时的独立配置（可选）
- `doc/` 目录保留为文档存储
- `specs/` 目录保留为功能规范存储
- `feature/` 目录保留为功能模块存储

## Complexity Tracking

> 无宪法违规需要说明

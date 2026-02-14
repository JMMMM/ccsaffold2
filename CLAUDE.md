# ccsaffold2 Development Guidelines

Claude Code 脚手架插件，用于将 AI 实践固化并选择性复用。

**核心思想**: 复用、可移植、多平台

## Active Technologies

- Node.js 18+ (LTS)
- 无外部依赖，使用 Node.js 内置模块

## Project Structure

```
ccsaffold2/                   # 插件根目录
├── .claude-plugin/
│   └── plugin.json           # 插件清单
├── hooks/                    # 事件处理程序
├── lib/                      # 核心依赖库
├── skills/                   # 技能定义
├── commands/                 # Slash 命令
├── scripts/                  # 工具脚本
├── .specify/                 # speckit 工作流支持
└── README.md
```

## 功能模块

- @./hooks/CLAUDE.md - Hook 开发指南和配置规范
- @./lib/CLAUDE.md - 核心库模块文档
- @./skills/CLAUDE.md - 技能模块开发指南

## Plugin Usage

**方式1：临时加载**
```bash
claude --plugin-dir /Users/ming/Work/ccsaffold2
```

**方式2：安装到项目（推荐）**
```bash
node /Users/ming/Work/ccsaffold2/scripts/install.js /path/to/your-project
```

## 开发规范

- 功能代码修改：在 `hooks/` 和 `lib/` 目录中完成
- 修改后运行：`node scripts/sync-to-local.js` 同步到 `.claude/` 目录
- 本项目通过 `.claude/` 目录加载插件功能

## Code Style

Node.js 18+ (LTS): Follow standard conventions

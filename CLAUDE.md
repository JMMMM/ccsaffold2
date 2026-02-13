# ccsaffold2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-12

## Active Technologies
- Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, https, crypto） (001-continuous-learning)
- 文件系统（.skills/learn 目录） (001-continuous-learning)
- Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, readline） (003-plugin-standardize)
- 文件系统（doc/session_log/ 目录用于会话日志） (003-plugin-standardize)
- Claude Code 插件 (003-plugin-standardize)
- Node.js 18+ (LTS) + Node.js 内置模块 (child_process, fs, path, https) (004-async-auto-learning)
- 文件系统 (.claude/logs/continuous-learning/) (004-async-auto-learning)
- Node.js 18+ (LTS) - 与项目现有 hooks 保持一致 + 无外部依赖，使用 Node.js 内置模块（fs, path, url, readline） (005-web-cache-hooks)
- 文件系统（`skills/learn/` 和 `doc/` 目录） (005-web-cache-hooks)
- Node.js 18+ LTS（与现有系统一致） + Node.js 内置模块（child_process, fs, path, readline），Claude CLI (002-continuous-learning-upgrade)
- 文件系统（.claude/skills/, .claude/doc/features/, .claude/logs/） (002-continuous-learning-upgrade)

- Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process） (001-session-logging)

## Project Structure

```text
ccsaffold2/                   # Claude Code 插件项目
├── .claude-plugin/
│   └── plugin.json           # 插件清单
├── commands/                 # Slash 命令
│   └── install.md            # 安装命令
├── hooks/                    # 事件处理程序
│   ├── hooks.json            # hooks配置（使用 ${CLAUDE_PLUGIN_ROOT}）
│   ├── session-logger.js     # 会话日志记录
│   ├── auto-learning.js      # 自动学习调度器（异步）
│   └── auto-learning-worker.js # 自动学习工作进程
├── scripts/                  # 工具脚本
│   └── install.js            # 插件安装脚本
├── skills/                   # Agent Skills（插件级别）
│   ├── ccsaffold-jian/SKILL.md   # 插件改造经验
│   ├── hook-creator/             # Hook创建工具
│   │   ├── SKILL.md
│   │   ├── assets/templates/     # 模板文件
│   │   └── references/           # 参考文档
│   └── manual-learn/SKILL.md     # 手动学习功能
├── lib/                      # 依赖库
│   ├── transcript-reader.js
│   ├── sensitive-filter.js
│   ├── llm-analyzer.js
│   ├── skill-generator.js
│   └── learning-logger.js    # 学习日志记录器
├── .specify/                 # speckit 工作流支持
│   ├── memory/
│   ├── scripts/
│   └── templates/
└── README.md

.claude/                      # 开发时的独立配置
├── commands/
├── hooks/
├── conversations/
│   └── conversation.txt
├── skills/                   # 项目级别 Skills
│   └── manual-learn/SKILL.md
└── settings.json

specs/                        # 功能规范存储
doc/                          # 文档存储
│   └── {domain}.md           # web-cache 网站内容存档
```

## Web Cache Hooks (005-web-cache-hooks)

### 功能说明

为 web-reader MCP 提供本地缓存功能，减少重复网络请求。

### 缓存目录

| 目录 | 用途 | 内容 |
|------|------|------|
| `.claude/skills/learn/{domain}/SKILL.md` | 知识摘要 | 精炼的核心知识点 |
| `.claude/doc/{domain}.md` | 原始存档 | 完整的 markdown 内容 |

### 使用方式

```
用户: 读取 https://docs.nodejs.org/api/fs.html 的内容
# 首次: 调用 MCP，自动缓存
# 后续: 使用缓存，跳过 MCP

用户: 刷新 https://react.dev 的内容
# 强制刷新，重新获取
```

### 强制刷新关键词

`重新`, `刷新`, `跳过缓存`, `force refresh`, `reload`, `refresh`

## 持续学习功能升级 (002-continuous-learning-upgrade)

### 功能说明

持续学习功能通过 Claude CLI 自动分析会话并创建知识文件。

### 架构（简化后）

```
会话结束 (SessionEnd Hook)
    │
    ▼
hooks/auto-learning-worker.js
    │  读取会话 → 过滤敏感信息
    │
    ▼
lib/claude-cli-client.js
    │  executeLearning() 调用 Claude CLI
    │
    ▼
Claude CLI（带 Write 工具）
    └─→ 分析内容 + 判断类型 + 创建文件（一步完成）
```

### 大模型触发位置

**唯一入口**: `lib/claude-cli-client.js:157` - `executeLearning()` 函数

```javascript
// 调用参数
const args = [
  '-p', prompt,
  '--allowedTools', 'Write',  // 允许创建文件
  '--max-turns', '3'
];
spawn('claude', args, { cwd, timeout: 60000 });
```

### 输出类型（由大模型自动判断）

| 类型 | 触发场景 | 存储位置 |
|------|----------|----------|
| **Skill** | 顽固 bug 修复 | `.claude/skills/{name}/SKILL.md` |
| **功能文档** | 功能开发/修改 | `.claude/doc/features/{name}.md` |

### 核心模块

| 模块 | 功能 |
|------|------|
| `lib/claude-cli-client.js` | 调用 Claude CLI（带文件创建能力） |
| `hooks/auto-learning-worker.js` | 读取会话，触发学习 |

### 使用方式

**自动学习**: 会话结束时自动触发（至少 3 条用户输入）

**手动学习**: 输入 `/learn` 或 `手动学习`

## Plugin Usage

### 使用方式

**方式1：--plugin-dir（临时加载）**
```bash
cd /path/to/your-project
claude --plugin-dir /Users/ming/Work/ccsaffold2
```

**方式2：安装到项目（推荐，无需每次指定）**
```bash
# 安装插件到目标项目
node /Users/ming/Work/ccsaffold2/scripts/install.js /path/to/your-project

# 之后正常启动即可
cd /path/to/your-project
claude
```

### 插件功能

**Hooks（自动生效）**
| Hook | 描述 |
|------|------|
| `UserPromptSubmit` | 记录用户输入到 `.claude/conversations/conversation.txt` |
| `PostToolUse` | 记录AI工具调用（排除只读查询类工具） |
| `SessionEnd` | 异步分析会话内容，生成可复用的skill（不阻塞会话关闭） |

**异步学习功能** (004-async-auto-learning)
- SessionEnd hook 立即返回，学习任务在后台子进程执行
- 每个会话的学习日志保存在 `.claude/logs/continuous-learning/learning-{session_id}.log`
- 日志格式：JSON Lines，包含时间戳、步骤、耗时等信息

**Slash Commands**
| 命令 | 描述 |
|------|------|
| `/ccsaffold:install` | 将插件安装到当前项目 |
| `/ccsaffold:speckit.specify` | 创建功能规范 |
| `/ccsaffold:speckit.plan` | 生成实施计划 |
| `/ccsaffold:speckit.tasks` | 生成任务列表 |
| `/ccsaffold:speckit.implement` | 执行任务实施 |
| `/ccsaffold:speckit.clarify` | 澄清需求细节 |
| `/ccsaffold:speckit.analyze` | 分析规范一致性 |
| `/ccsaffold:speckit.constitution` | 创建/更新项目宪章 |
| `/ccsaffold:speckit.checklist` | 生成检查清单 |
| `/ccsaffold:speckit.taskstoissues` | 转换任务为 GitHub Issues |

### 安装后的项目结构

```
your-project/.claude/
├── settings.json          # hooks配置
├── hooks/
│   ├── session-logger.js  # 会话日志
│   └── auto-learning.js   # 自动学习
├── lib/                   # 依赖库
└── conversations/         # 会话日志存储
    └── conversation.txt
```

### Skills（技能）

插件提供以下 Skills：

| Skill | 描述 | 触发关键词 |
|-------|------|-----------|
| `manual-learn` | 手动触发学习，分析会话生成skill | `/learn`, `手动学习`, `生成skill` |
| `hook-creator` | 创建 Claude Code hooks | `create hooks`, `add automation` |
| `ccsaffold-jian` | 插件改造经验（参考） | `插件化`, `speckit`, `plugin-dir` |

**Skills 存放位置：**

| 位置 | 路径 | 适用范围 |
|------|------|---------|
| 项目 | `.claude/skills/<name>/SKILL.md` | 仅此项目 |
| 插件 | `skills/<name>/SKILL.md` | 启用插件的位置 |
| 个人 | `~/.claude/skills/<name>/SKILL.md` | 所有项目 |

**重要：Skills 目录结构必须正确**
```
正确: skills/<skill-name>/SKILL.md
错误: skills/<skill-name>.md   ← 不会生效！
```

## Code Style

Node.js 18+ (LTS): Follow standard conventions

## 开发规范

**默认功能修改/新增都在插件中完成，插件修改后默认让本项目启动**

- 功能代码修改：在 `hooks/` 和 `lib/` 目录中完成
- 修改后运行：`node scripts/sync-to-local.js` 同步到 `.claude/` 目录
- 本项目通过 `.claude/` 目录加载插件功能

## Claude Code Hooks 开发经验

### settings.json 配置要点

1. **使用相对路径**: `settings.json` 不支持环境变量（如 `${CLAUDE_PROJECT_ROOT}`），必须使用相对路径
   ```json
   {
     "hooks": {
       "UserPromptSubmit": [{
         "matcher": "*",
         "hooks": [{ "type": "command", "command": "node .claude/hooks/log-user-prompt.js" }]
       }]
     }
   }
   ```

2. **Hook 脚本路径解析**: 在脚本中使用 `__dirname` 获取脚本所在目录，避免依赖工作目录
   ```javascript
   const logFile = path.join(__dirname, '..', 'conversations', 'conversation.txt');
   ```

3. **输入格式兼容**: Hook 接收的 stdin JSON 可能有多种格式，需要兼容处理
   ```javascript
   const prompt = input.prompt || (input.data && input.data.prompt);
   ```

4. **错误处理**: Hook 必须始终以 `process.exit(0)` 退出，避免阻塞 Claude Code

### Hook 开发最佳实践

- 保持脚本简洁，避免外部依赖
- 使用 `try-catch` 包裹所有可能出错的操作
- 文件操作前确保目录存在 (`fs.mkdirSync(..., { recursive: true })`)
- 异步操作使用 Promise 或 async/await，但要确保在 `stdin end` 事件中正确处理

## Skills 开发经验

### 目录结构要求

Skills **必须**使用目录结构，不能直接放 `.md` 文件：
```text
正确: .claude/skills/<skill-name>/SKILL.md
错误: .claude/skills/<skill-name>.md   ← 不会被加载！
```

### SKILL.md 格式

```markdown
---
name: skill-name
description: 简短描述，用于触发匹配
---

# Skill: skill-name

## Purpose
描述这个技能的用途

## Trigger Conditions
触发关键词列表

## Instructions
具体操作步骤
```

### 前置元数据字段

| 字段 | 必需 | 描述 |
|------|------|------|
| `name` | 否 | 显示名称，也是 `/slash-command` |
| `description` | 推荐 | 用于 Claude 决定何时使用 |
| `disable-model-invocation` | 否 | `true` 则只能手动调用 |
| `user-invocable` | 否 | `false` 则从菜单隐藏 |

## Recent Changes
- 002-continuous-learning-upgrade: Added Node.js 18+ LTS（与现有系统一致） + Node.js 内置模块（child_process, fs, path, readline），Claude CLI
- 005-web-cache-hooks: Added Node.js 18+ (LTS) - 与项目现有 hooks 保持一致 + 无外部依赖，使用 Node.js 内置模块（fs, path, url, readline）
- 2026-02-12: 修复 skills 目录结构问题（必须是 `<name>/SKILL.md` 格式）

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

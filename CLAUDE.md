# ccsaffold2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-25

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

- Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process） (001-session-logging)

## Project Structure

```text
ccsaffold2/                   # Claude Code 插件项目
├── .claude-plugin/           # 插件分发目录（同步自 hooks/）
│   └── plugin.json           # 插件清单
├── commands/                 # Slash 命令
│   └── install.md            # 安装命令
├── hooks/                    # 事件处理程序（运行时目录）
│   ├── hooks.json            # hooks配置（使用 ${CLAUDE_PLUGIN_ROOT}）
│   ├── session-logger.js     # 会话日志记录
│   ├── auto-learning.js      # 自动学习调度器（异步）
│   ├── auto-learning-worker.js # 自动学习工作进程
│   ├── web-cache-before.js   # Web缓存检查
│   └── web-cache-after.js    # Web缓存保存和skill生成
├── scripts/                  # 工具脚本
│   └── install.js            # 插件安装脚本
├── skills/                   # Agent Skills（插件级别）
│   ├── ccsaffold-jian/SKILL.md   # 插件改造经验
│   ├── hook-creator/             # Hook创建工具
│   │   ├── SKILL.md
│   │   ├── assets/templates/     # 模板文件
│   │   └── references/           # 参考文档
│   ├── manual-learn/SKILL.md     # 手动学习功能
│   └── claude-hooks/SKILL.md     # Claude Hooks 开发助手
├── lib/                      # 依赖库
│   ├── transcript-reader.js
│   ├── sensitive-filter.js
│   ├── llm-analyzer.js
│   ├── skill-generator.js
│   ├── learning-logger.js    # 学习日志记录器
│   ├── cache-matcher.js      # 缓存匹配工具
│   └── url-utils.js          # URL 处理工具
├── .specify/                 # speckit 工作流支持
│   ├── memory/
│   ├── scripts/
│   └── templates/
├── feature/                  # 功能开发目录（所有新功能先在此开发）
│   ├── continuous-learning/  # 持续学习功能
│   ├── session_log/          # 会话日志功能
│   └── web-cache-hooks/      # Web缓存功能
│       ├── README.md
│       ├── manifest.json
│       ├── settings.fragment.json
│       ├── hooks/
│       ├── lib/
│       └── scripts/
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
│   └── {cache-key}.md        # web-cache 网站内容存档
```

## 开发流程

### 功能开发规范

**所有新功能必须按照以下流程开发：**

```
1. feature/ 目录开发
   ↓
2. 组件化（独立可测试）
   ↓
3. 同步到项目（hooks/, lib/）
   ↓
4. 本项目生效（.claude/）
```

#### 步骤说明

**1. 在 feature/ 目录开发**

```bash
feature/
├── {feature-name}/
│   ├── README.md              # 功能说明文档
│   ├── manifest.json          # 功能清单
│   ├── settings.fragment.json # settings 片段（用于合并）
│   ├── hooks/                 # 功能相关 hooks
│   ├── lib/                   # 功能相关库
│   ├── scripts/               # 安装/测试脚本
│   └── tests/                 # 测试文件
```

**2. 组件化要求**

- 每个 feature 是独立的功能单元
- 可以单独安装和测试
- 包含完整的文档和安装脚本
- 使用 `settings.fragment.json` 声明需要的配置

**3. 同步到项目目录**

```bash
# 复制 hooks
cp feature/{feature-name}/hooks/*.js hooks/

# 复制 lib
cp feature/{feature-name}/lib/*.js lib/

# 合并 settings.json（手动或使用脚本）
```

**4. 本项目生效**

```bash
# 同步到 .claude 目录
cp hooks/*.js .claude/hooks/
cp lib/*.js .claude/lib/

# 合并 settings.json
```

#### Feature 模板

```json
// feature/{name}/manifest.json
{
  "name": "feature-name",
  "version": "1.0.0",
  "description": "功能描述",
  "enabled": true,
  "files": {
    "hooks": ["hooks/file1.js", "hooks/file2.js"],
    "lib": ["lib/lib1.js", "lib/lib2.js"],
    "skills": []
  }
}
```

```json
// feature/{name}/settings.fragment.json
{
  "hooks": {
    "EventName": [{
      "matcher": "ToolPattern",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/file.js"
      }],
      "description": "功能描述"
    }]
  }
}
```

## Web Cache Hooks (005-web-cache-hooks)

### 功能说明

为 web-reader MCP 提供本地缓存功能，减少重复网络请求。

### v2.0.0 新增功能

- **自动 Skill 生成**: 访问文档型网站后自动生成可复用的 skill
- **智能文档检测**: 使用评分机制自动识别文档型网站
- **友好输出**: 自动告知用户 skill 的触发方式和用法

### 缓存目录

| 目录 | 用途 | 内容 |
|------|------|------|
| `.claude/skills/learn/{cache-key}/SKILL.md` | 知识摘要 | 精炼的核心知识点 |
| `.claude/doc/{cache-key}.md` | 原始存档 | 完整的 markdown 内容 |

### 缓存键格式

```
{domain}                          # 根域名
{domain}/{path-slug}-{hash}       # 带路径的 URL

示例:
- code.claude.com
- code.claude.com/docs-zh-CN-hooks-a1b2c3d4
```

### 使用方式

```
用户: 访问 https://code.claude.com/docs/zh-CN/hooks
```

**系统自动处理：**

1. **首次访问**: 调用 web-reader MCP -> 保存原始内容 -> 检测文档类型 -> 生成 skill
2. **后续访问**: 直接使用缓存，跳过 MCP 调用

**输出示例：**

```markdown
## 网站内容已缓存

### 文档型网站检测

该网站符合**文档型网站特征**，已自动生成可复用的 Skill。

#### 触发方式
- 访问 **code.claude.com** 的任何 URL
- 询问关于 **Hooks 参考** 的内容

#### 功能说明
1. **快速缓存命中**: 后续访问直接使用本地缓存
2. **离线访问**: 无需网络连接
3. **上下文增强**: AI 可直接引用缓存内容
```

### 文档型网站检测

| 检测项 | 权重 | 说明 |
|--------|------|------|
| URL 特征 | +3 | docs.domain.com、/docs/、/api/ 等 |
| 内容结构 | +2 | 标题、代码块、表格、列表 |
| 技术关键词 | +1 | API、函数、方法、参数等 |
| 营销内容 | -5 | 广告、订阅、购买等 |
| 内容长度 | -3 | 内容少于500字符 |

**阈值**: 分数 >= 5 认为是文档型网站

### 强制刷新关键词

`重新`, `刷新`, `跳过缓存`, `force refresh`, `reload`, `refresh`

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
| `PreToolUse` (web-cache-before) | 检查 web-reader 缓存，优先使用已缓存内容 |
| `PostToolUse` (web-cache-after) | 保存网站内容并自动生成 skill |

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
│   ├── auto-learning.js   # 自动学习
│   ├── web-cache-before.js # Web缓存检查
│   └── web-cache-after.js  # Web缓存保存
├── lib/                   # 依赖库
├── doc/                   # 网站内容存档
└── conversations/         # 会话日志存储
    └── conversation.txt
```

### Skills（技能）

插件提供以下 Skills：

| Skill | 描述 | 触发关键词 |
|-------|------|-----------|
| `manual-learn` | 手动触发学习，分析会话生成skill | `/learn`, `手动学习`, `生成skill` |
| `hook-creator` | 创建 Claude Code hooks | `create hooks`, `add automation` |
| `claude-hooks` | Claude Hooks 开发助手 | `创建 hook`, `配置 hook`, `写个 hook` |
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

**功能开发流程：feature/ → hooks/ → .claude/**

- **新功能**: 在 `feature/{name}/` 目录开发
- **组件化**: 确保 feature 独立可测试
- **同步**: 复制到 `hooks/` 和 `lib/`
- **生效**: 同步到 `.claude/` 供本地使用

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
- 2026-02-25: **重构 web-cache-hooks** - 添加 web-cache-after.js 自动生成 skill，智能文档检测
- 2026-02-25: 添加 **开发流程规范** - 所有功能先在 feature/ 目录开发
- 2026-02-25: 添加 **claude-hooks** skill - Claude Hooks 开发助手
- 005-web-cache-hooks: Added Node.js 18+ (LTS) - 与项目现有 hooks 保持一致 + 无外部依赖，使用 Node.js 内置模块（fs, path, url, readline）
- 2026-02-12: 修复 skills 目录结构问题（必须是 `<name>/SKILL.md` 格式）
- 2026-02-12: 添加 manual-learn、hook-creator、ccsaffold-jian skills

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

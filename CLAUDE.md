# ccsaffold2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-12

## Active Technologies
- Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, https, crypto） (001-continuous-learning)
- 文件系统（.skills/learn 目录） (001-continuous-learning)
- Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, readline） (003-plugin-standardize)
- 文件系统（doc/session_log/ 目录用于会话日志） (003-plugin-standardize)
- Claude Code 插件 (003-plugin-standardize)

- Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process） (001-session-logging)

## Project Structure

```text
ccsaffold/                    # Claude Code 插件（可分享）
├── .claude-plugin/
│   └── plugin.json           # 插件清单
├── commands/                 # Slash 命令
├── hooks/                    # 事件处理程序
│   ├── hooks.json
│   └── *.js
├── skills/                   # Agent Skills
│   └── */SKILL.md
├── .specify/                 # speckit 工作流支持
│   ├── memory/
│   ├── scripts/
│   └── templates/
└── README.md

feature/                      # 功能模块存储目录（开发参考）
└── [feature-name]/
    ├── hooks/
    ├── scripts/
    └── README.md

.claude/                      # 开发时的独立配置
├── commands/
├── hooks/
└── settings.json

specs/                        # 功能规范存储
doc/                          # 文档存储
```

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
| `SessionEnd` | 自动分析会话内容，生成可复用的skill |

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

## Code Style

Node.js 18+ (LTS): Follow standard conventions

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

## Recent Changes
- 003-plugin-standardize: Created ccsaffold plugin with speckit commands, session logging hooks, and Agent Skills
- 003-plugin-standardize: Added Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, readline）
- 001-continuous-learning: Added Node.js 18+ (LTS) + 无外部依赖，使用 Node.js 内置模块（fs, path, https, crypto）
- 001-session-logging: Added Node.js 18+ (LTS) + 无外部依赖，使用Node.js内置模块（fs, path, readline, process）

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

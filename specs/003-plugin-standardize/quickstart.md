# Quickstart: ccsaffold Plugin

**Version**: 1.0.0
**Date**: 2026-02-12

## 前置条件

- Claude Code 1.0.33 或更高版本
- Node.js 18+ (LTS)

## 安装方式

### 方式一：本地测试（开发模式）

```bash
# 克隆或下载插件到本地
git clone https://github.com/ming/ccsaffold.git

# 在 Claude Code 中使用 --plugin-dir 标志加载插件
claude --plugin-dir ./ccsaffold
```

### 方式二：通过市场安装（正式发布后）

```bash
# 安装插件
claude /plugin install ccsaffold

# 或从 Git 仓库安装
claude /plugin install https://github.com/ming/ccsaffold.git
```

## 快速验证

### 1. 验证命令可用

启动 Claude Code 后，输入以下命令验证插件加载成功：

```
/ccsaffold:speckit.specify
```

如果看到 speckit.specify 命令的帮助信息，说明插件加载成功。

### 2. 查看所有可用命令

```
/ccsaffold:
```

输入 `/ccsaffold:` 后，系统会显示所有可用的 ccsaffold 子命令。

## 可用命令

| 命令 | 描述 |
|------|------|
| `/ccsaffold:speckit.specify` | 创建功能规范 |
| `/ccsaffold:speckit.plan` | 生成实施计划 |
| `/ccsaffold:speckit.tasks` | 生成任务列表 |
| `/ccsaffold:speckit.implement` | 执行任务实施 |
| `/ccsaffold:speckit.clarify` | 澄清需求细节 |
| `/ccsaffold:speckit.analyze` | 分析规范一致性 |
| `/ccsaffold:speckit.constitution` | 创建/更新项目宪章 |
| `/ccsaffold:speckit.checklist` | 生成检查清单 |
| `/ccsaffold:speckit.taskstoissues` | 转换任务为 GitHub Issues |

## 典型工作流

### 创建新功能

```bash
# 1. 创建功能规范
/ccsaffold:speckit.specify "实现用户登录功能"

# 2. 澄清需求（可选）
/ccsaffold:speckit.clarify

# 3. 生成实施计划
/ccsaffold:speckit.plan

# 4. 生成任务列表
/ccsaffold:speckit.tasks

# 5. 执行实施
/ccsaffold:speckit.implement
```

### 使用 Agent Skills

插件提供以下 Agent Skills，Claude 会根据上下文自动调用：

- **hook-creator**: 创建 Claude Code hooks
- **learn**: 自动学习功能

示例：
```
帮我创建一个 Node.js hook 来记录用户提示
```

Claude 会自动调用 hook-creator skill 生成相应的 hook 模板。

## 配置

### Session 日志

插件默认启用 session 日志功能，日志文件位置：

```
doc/session_log/YYYY-MM-DD.txt
```

### 禁用 Session 日志

如需禁用 session 日志，编辑 `hooks/hooks.json`，移除 `UserPromptSubmit` 配置。

## 故障排除

### 插件无法加载

1. 检查 Claude Code 版本是否 >= 1.0.33
2. 检查插件目录结构是否正确
3. 检查 `.claude-plugin/plugin.json` 是否存在

### 命令不显示

1. 确保使用正确的命名空间格式：`/ccsaffold:command`
2. 重启 Claude Code 重新加载插件

### Hook 不执行

1. 检查 Node.js 是否正确安装
2. 检查 hook 脚本路径是否正确
3. 查看 Claude Code 日志获取错误信息

## 目录结构

```
ccsaffold/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── speckit.specify.md
│   ├── speckit.plan.md
│   └── ...
├── hooks/
│   ├── hooks.json
│   └── log-user-prompt.js
├── skills/
│   └── hook-creator/
└── README.md
```

## 更新插件

```bash
# 本地开发模式
git pull origin main

# 市场安装模式
claude /plugin update ccsaffold
```

## 卸载插件

```bash
claude /plugin uninstall ccsaffold
```

# Quickstart: 异步自动学习优化

**Feature**: 004-async-auto-learning
**Date**: 2026-02-12

## Prerequisites

- Node.js 18+ LTS
- Claude Code CLI
- ANTHROPIC_AUTH_TOKEN 环境变量（用于 LLM API）

## Installation

此功能已集成到 ccsaffold 插件中，安装插件后自动生效。

```bash
# 安装插件到项目
node /path/to/ccsaffold2/scripts/install.js /your/project

# 或使用 --plugin-dir 临时加载
cd /your/project
claude --plugin-dir /path/to/ccsaffold2
```

## Usage

### 自动触发

当 Claude Code 会话结束时，自动学习功能会自动触发：

1. 会话立即关闭（不等待学习完成）
2. 后台子进程开始分析会话内容
3. 日志写入 `.claude/logs/continuous-learning/learning-{session_id}.log`

### 查看日志

```bash
# 列出所有学习日志
ls .claude/logs/continuous-learning/

# 查看特定会话的日志
cat .claude/logs/continuous-learning/learning-abc123.log
```

### 日志格式

每行一个 JSON 对象：

```json
{"ts": "2026-02-12T10:30:00.000Z", "level": "INFO", "step": "init", "msg": "Starting async learning", "data": {"session_id": "abc123"}}
{"ts": "2026-02-12T10:30:00.100Z", "level": "INFO", "step": "read_transcript", "msg": "Transcript loaded", "data": {"record_count": 42}, "duration_ms": 100}
```

## Verification

### 测试异步执行

1. 启动 Claude Code 会话
2. 进行一些对话
3. 退出会话
4. 观察退出时间是否 < 1 秒

### 测试日志记录

```bash
# 触发一次会话后检查日志
ls -la .claude/logs/continuous-learning/

# 日志应包含完整的执行过程
cat .claude/logs/continuous-learning/learning-*.log | head -20
```

## Troubleshooting

### 会话退出仍然很慢

检查是否有其他 SessionEnd hooks 在阻塞。

### 没有生成日志文件

1. 检查 API Key 是否设置：`echo $ANTHROPIC_AUTH_TOKEN`
2. 检查目录权限：`ls -la .claude/`

### 日志内容不完整

查看日志中的 ERROR 级别条目，了解具体失败原因。

## Configuration

无需额外配置，功能开箱即用。

如需禁用自动学习，编辑 `.claude/settings.json` 移除 SessionEnd hook。

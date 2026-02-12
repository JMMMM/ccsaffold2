# Async Auto-Learning Feature

异步自动学习功能，将会话结束时的学习任务改为异步执行，不阻塞 Claude Code 关闭。

## 功能说明

- **异步执行**: SessionEnd hook 立即返回，学习任务在后台子进程执行
- **详细日志**: 每个会话的学习过程记录到独立日志文件
- **跨平台**: 支持 Windows, Linux, macOS

## 日志位置

```
.claude/logs/continuous-learning/learning-{session_id}.log
```

## 安装

此功能已集成到 ccsaffold 插件中，安装插件后自动生效。

```bash
# 方式1: 安装插件到项目
node /path/to/ccsaffold2/scripts/install.js /your/project

# 方式2: 使用 --plugin-dir 临时加载
cd /your/project
claude --plugin-dir /path/to/ccsaffold2
```

## 文件结构

```
hooks/
├── auto-learning.js        # 主入口（异步调度器）
└── auto-learning-worker.js # 工作进程

lib/
└── learning-logger.js      # 日志记录模块
```

## 配置

无需额外配置，功能开箱即用。

## 验证

1. 启动 Claude Code 会话
2. 进行一些对话
3. 退出会话（应在 1 秒内完成）
4. 检查日志文件：`cat .claude/logs/continuous-learning/learning-*.log`

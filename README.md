# ccsaffold

Claude Code 脚手架插件，提供持续学习和 hook 创建功能。

## 安装方式

```bash
# 本地测试
claude --plugin-dir .

# 或从 Git 安装
claude /plugin install https://github.com/ming/ccsaffold.git
```

## 功能

### 持续学习 (Continuous Learning)

会话结束时自动分析并创建知识文件（由 Claude CLI 完成）：

```
会话结束 → Claude CLI 分析 → 自动创建 Skill 或功能文档
```

**输出类型**（大模型自动判断）：
| 类型 | 触发场景 | 存储位置 |
|------|----------|----------|
| **Skill** | 顽固 bug 修复 | `.claude/skills/{name}/SKILL.md` |
| **功能文档** | 功能开发/修改 | `.claude/doc/features/{name}.md` |

**手动触发**: `/learn` 或 `手动学习`

### Agent Skills

- **manual-learn**: 手动触发学习
- **hook-creator**: 创建 hooks

## 目录结构

```
ccsaffold2/
├── hooks/
│   ├── auto-learning-worker.js  # 学习工作进程（简化）
│   └── session-logger.js
├── skills/
│   ├── hook-creator/
│   └── manual-learn/
├── lib/
│   ├── claude-cli-client.js     # Claude CLI 调用（核心）
│   ├── conversation-reader.js
│   ├── sensitive-filter.js
│   └── learning-logger.js
└── README.md
```

## 依赖

- **Node.js**: 18+ LTS
- **Claude CLI**: 用于分析内容和创建文件

## License

MIT

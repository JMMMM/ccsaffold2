# ccsaffold

Claude Code 脚手架插件，提供自动学习和 hook 创建功能。

## 安装方式

```bash
# 本地测试（在项目根目录）
claude --plugin-dir .

# 或从 Git 安装
claude /plugin install https://github.com/ming/ccsaffold.git
```

## 功能

### 自动学习 (Auto-Learning)

当会话结束时，自动分析并生成可复用的 skill：
- 识别学习机会
- 过滤敏感信息
- 生成 skill 到 `.skills/learn/` 目录

启用方式：
```bash
export ANTHROPIC_AUTH_TOKEN=your_token_here
```

### Agent Skills

- **hook-creator**: Create Claude Code hooks (triggered automatically when user asks to create hooks)

## 目录结构

```
ccsaffold2/                    # 插件根目录
├── .claude-plugin/
│   └── plugin.json            # 插件清单
├── hooks/
│   ├── hooks.json
│   └── auto-learning.js       # 自动学习 hook
├── skills/
│   ├── hook-creator/          # hook 创建 skill
│   └── learn/                 # 学习记录
├── lib/                       # 支持库
│   ├── llm-analyzer.js
│   ├── sensitive-filter.js
│   ├── skill-generator.js
│   └── transcript-reader.js
├── .claude/                   # 开发环境（不发布）
├── .specify/                  # speckit 工作流（不发布）
└── README.md
```

## 在其他项目中使用

```bash
# 克隆到本地
git clone https://github.com/ming/ccsaffold.git

# 在目标项目中加载
cd /path/to/your-project
claude --plugin-dir /path/to/ccsaffold
```

## License

MIT

# Quickstart: 持续学习 (Continuous Learning)

**Feature**: 001-continuous-learning
**Date**: 2026-02-11

## 安装

### 前置条件

1. Node.js 18+ (LTS)
2. 已设置 `ANTHROPIC_API_KEY` 环境变量

### 安装步骤

```bash
# 1. 进入项目目录
cd /path/to/your/project

# 2. 复制功能文件
cp -r feature/continuous-learning/hooks .claude/hooks/
cp -r feature/continuous-learning/lib .claude/lib/
cp -r feature/continuous-learning/skills .claude/skills/

# 3. 合并配置到 settings.json
# 手动将 feature/continuous-learning/settings.json 内容合并到 .claude/settings.json

# 4. 创建 skill 存储目录
mkdir -p .skills/learn

# 5. 验证安装
node .claude/lib/transcript-reader.js --verify
```

### 一键安装脚本

```bash
./feature/continuous-learning/scripts/install.sh
```

## 使用

### 自动学习

自动学习在每次会话结束时自动触发，无需用户干预。

**触发条件**:
- 会话结束（sessionEnd hook）
- 会话中存在"多次迭代修复"的学习内容
- 环境变量 `ANTHROPIC_API_KEY` 已设置

**输出位置**:
- 项目根目录的 `.skills/learn/` 目录

### 手动学习

使用手动学习 skill 来触发学习：

```
/learn
```

或指定特定的会话记录：

```
/learn from /path/to/transcript.jsonl
```

## 配置

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | 是 | Anthropic API Key |

### settings.json 配置

```json
{
  "hooks": {
    "sessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/auto-learning.js"
      }],
      "description": "会话结束时自动学习"
    }]
  }
}
```

## 验证

### 检查安装

```bash
# 运行验证脚本
./feature/continuous-learning/scripts/verify.sh
```

### 测试自动学习

```bash
# 使用测试数据触发学习
node .claude/hooks/auto-learning.js < test/fixtures/session-end-input.json
```

## 故障排除

### 问题：没有生成 skill 文件

**可能原因**:
1. 会话中没有识别到可学习内容
2. `ANTHROPIC_API_KEY` 未设置
3. LLM API 调用失败

**解决方法**:
1. 检查环境变量：`echo $ANTHROPIC_API_KEY`
2. 查看错误日志：`.claude/logs/auto-learning.log`
3. 尝试手动学习命令

### 问题：生成的 skill 内容不准确

**可能原因**:
- 会话内容过于复杂或模糊

**解决方法**:
- 使用手动学习并指定学习重点
- 手动编辑生成的 skill 文件

## 目录结构

安装完成后的目录结构：

```
项目根目录/
├── .claude/
│   ├── hooks/
│   │   └── auto-learning.js
│   ├── lib/
│   │   ├── transcript-reader.js
│   │   ├── llm-analyzer.js
│   │   ├── skill-generator.js
│   │   └── sensitive-filter.js
│   ├── skills/
│   │   └── manual-learn.md
│   └── settings.json
│
└── .skills/
    └── learn/
        └── *.md (生成的 skill 文件)
```

## 下一步

1. 正常使用 Claude Code 进行开发
2. 会话结束后检查 `.skills/learn/` 目录
3. 根据需要编辑或删除生成的 skill 文件
4. 使用 `/learn` 命令手动触发学习

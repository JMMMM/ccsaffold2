# 持续学习 (Continuous Learning)

自动从 Claude Code 会话中学习并生成可复用的 skill 文件。

## 功能概述

本功能包含两个核心能力：

1. **自动学习** - 会话结束时自动分析内容，识别学习点并生成 skill
2. **手动学习** - 用户手动触发学习功能，分析指定会话内容

## 安装

### 自动安装

```bash
./feature/continuous-learning/scripts/install.sh
```

### 手动安装

1. 复制文件到 `.claude` 目录：

```bash
cp -r feature/continuous-learning/hooks/* .claude/hooks/
cp -r feature/continuous-learning/lib/* .claude/lib/
cp -r feature/continuous-learning/skills/* .claude/skills/
```

2. 合并 `settings.json` 配置：

```json
{
  "hooks": {
    "sessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node .claude/hooks/auto-learning.js"
      }],
      "description": "会话结束时自动分析学习内容并生成skill"
    }]
  }
}
```

3. 创建输出目录：

```bash
mkdir -p .skills/learn
```

## 配置

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `ANTHROPIC_AUTH_TOKEN` | 是 | 智谱 AI API 密钥，用于调用大模型分析会话内容 |

## 使用

### 自动学习

安装后，每次会话结束时（sessionEnd hook）会自动触发：

1. 读取会话 transcript 文件
2. 过滤敏感信息（API 密钥、密码等）
3. **调用大模型分析**会话内容
4. 识别"多次反复沟通后才解决的问题"
5. 根据 skill 模版生成 skill 文件
6. 保存到 `.skills/learn/` 目录

### 手动学习

使用 `/learn` 或相关关键词触发手动学习：

```
/learn                    # 分析当前会话
/learn from /path/to/file.jsonl  # 分析指定会话文件
手动学习这个会话           # 分析当前会话
生成skill                 # 生成 skill
```

## 输出

生成的 skill 文件保存在项目根目录的 `.skills/learn/` 目录：

```
.skills/
└── learn/
    ├── api-diaoshipeizhi.md
    ├── git-fenzhiguanli.md
    └── ...
```

### Skill 文件格式

```markdown
---
name: [skill名称]
description: [技能描述]
---

# Skill: [skill名称]

## Purpose
[技能的主要用途]

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- [关键词1]
- [关键词2]

## Instructions
1. [首先执行的操作]
2. [接下来的步骤]
3. [最后完成的任务]

## Examples
示例1：[用户输入] -> [AI的响应]
示例2：[用户输入] -> [AI的响应]
```

## 去重机制

系统会自动检测相似 skill 并合并，避免重复：

- 基于名称相似度（Jaccard 相似度）
- 基于关键词重叠度
- 合并步骤和关键词，保留最详细的内容

## 跨平台支持

支持以下操作系统：
- macOS
- Linux
- Windows

所有路径使用 Node.js `path` 模块处理，确保跨平台兼容。

## 验证安装

```bash
./feature/continuous-learning/scripts/verify.sh
```

## 运行测试

```bash
./feature/continuous-learning/scripts/test.sh
```

## 目录结构

```
feature/continuous-learning/
├── hooks/
│   └── auto-learning.js       # sessionEnd hook
├── lib/
│   ├── sensitive-filter.js    # 敏感信息过滤
│   ├── transcript-reader.js   # Transcript 解析
│   ├── llm-analyzer.js        # LLM API 调用
│   └── skill-generator.js     # Skill 生成
├── scripts/
│   ├── install.sh             # 安装脚本
│   ├── verify.sh              # 验证脚本
│   └── test.sh                # 测试脚本
├── skills/
│   └── manual-learn.md        # 手动学习 skill
├── tests/
│   └── *.test.js              # 单元测试
├── settings.json              # Hook 配置
└── README.md                  # 本文件
```

## 注意事项

1. **API Key**: 必须设置 `ANTHROPIC_AUTH_TOKEN` 环境变量
2. **默认使用智谱 AI**: 支持智谱 AI GLM-4 模型
3. **隐私**: 敏感信息会在分析前被自动过滤
4. **静默失败**: 自动学习失败不会阻塞会话结束
5. **性能**: 大型会话文件会流式处理，避免内存问题

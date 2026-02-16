# Continuous Learning v2 架构分析文档

> 基于 `/Users/ming/Work/thirdpart/everything-claude-code` 项目分析

## 一、系统概述

Continuous Learning v2 是一个基于"本能(Instinct)"的连续学习系统，通过观察 Claude Code 会话创建具有置信度评分的原子本能，并进化成技能/命令/代理。

### 核心理念

- **原子本能**: 小的、单一触发条件的行为模式
- **置信度评分**: 0.3(试探性) - 0.9(几乎确定)
- **100% 可靠观察**: 使用 Hooks 而非 Skills 进行观察

---

## 二、v1 vs v2 对比

| 特性 | v1 (continuous-learning) | v2 (continuous-learning-v2) |
|------|--------------------------|----------------------------|
| **观察方式** | Stop Hook (会话结束时) | PreToolUse/PostToolUse Hooks |
| **可靠性** | 依赖 Skill 匹配 (50-80%) | Hooks 100% 可靠 |
| **分析模式** | 主上下文分析 | 后台 Agent (Haiku) |
| **粒度** | 完整 Skills | 原子 "Instincts" |
| **置信度** | 无 | 0.3-0.9 加权 |
| **进化路径** | 直接生成 Skill | Instincts → 聚类 → skill/command/agent |
| **分享能力** | 无 | 导出/导入本能 |

---

## 三、核心组件详解

### 3.1 观察钩子 (observe.sh)

**路径**: `skills/continuous-learning-v2/hooks/observe.sh`

**功能**:
- 捕获工具使用事件并保存到 `observations.jsonl`
- 支持 PreToolUse 和 PostToolUse 两种模式
- 文件超过 10MB 时自动归档
- 通过 SIGUSR1 信号通知观察者代理

**触发条件**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "...observe.sh pre" }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "...observe.sh post" }]
    }]
  }
}
```

**输出格式** (observations.jsonl):
```json
{"timestamp":"2025-01-22T10:30:00Z","event":"tool_start","session":"abc123","tool":"Edit","input":"..."}
{"timestamp":"2025-01-22T10:30:01Z","event":"tool_complete","session":"abc123","tool":"Edit","output":"..."}
```

**关键逻辑**:
```bash
# 1. 检查是否禁用
if [ -f "$CONFIG_DIR/disabled" ]; then exit 0; fi

# 2. 解析 JSON 输入
# 3. 截断大型输入/输出 (5000字符)
# 4. 归档大文件 (>10MB)
# 5. 写入观察记录
# 6. 通知观察者 (SIGUSR1)
```

---

### 3.2 观察者代理启动器 (start-observer.sh)

**路径**: `skills/continuous-learning-v2/agents/start-observer.sh`

**功能**:
- 启动后台观察者代理
- 每 5 分钟分析一次观察数据
- 使用 Haiku 模型进行低成本分析
- 支持手动触发 (SIGUSR1)

**使用方式**:
```bash
./start-observer.sh        # 启动
./start-observer.sh stop   # 停止
./start-observer.sh status # 状态
```

**核心流程**:
```bash
# 观察者循环
while true; do
  sleep 300  # 每5分钟
  analyze_observations
done

# 分析函数
analyze_observations() {
  # 使用 Claude Code CLI + Haiku 模型
  claude --model haiku --max-turns 3 --print \
    "Read $OBSERVATIONS_FILE and identify patterns..."
}
```

---

### 3.3 观察者代理规范 (observer.md)

**路径**: `skills/continuous-learning-v2/agents/observer.md`

**模式检测类型**:

| 类型                     | 描述                  | 生成本能示例                                 |
| ---------------------- | ------------------- | -------------------------------------- |
| **User Corrections**   | 用户后续消息纠正 Claude 的操作 | "When doing X, prefer Y"               |
| **Error Resolutions**  | 错误后紧跟修复操作           | "When encountering error X, try Y"     |
| **Repeated Workflows** | 相同工具序列多次使用          | "When doing X, follow steps Y, Z, W"   |
| **Tool Preferences**   | 一致偏好某些工具            | "When needing X, use tool Y"           |
| **File Patterns**      | 文件操作模式              | "When modifying X files, also check Y" |

**置信度计算**:

```
初始置信度:
  1-2 次观察: 0.3 (试探性)
  3-5 次观察: 0.5 (中等)
  6-10 次观察: 0.7 (强)
  11+ 次观察: 0.85 (很强)

调整规则:
  +0.05 每次确认观察
  -0.1 每次矛盾观察
  -0.02 每周无观察 (衰减)
```

---

### 3.4 本能 CLI (instinct-cli.py)

**路径**: `skills/continuous-learning-v2/scripts/instinct-cli.py`

**命令**:

```bash
# 查看所有本能状态
python3 instinct-cli.py status

# 导入本能
python3 instinct-cli.py import <file|url> [--dry-run] [--force] [--min-confidence 0.5]

# 导出本能
python3 instinct-cli.py export [--output file] [--domain workflow] [--min-confidence 0.7]

# 进化分析
python3 instinct-cli.py evolve [--generate]
```

**status 输出示例**:
```
============================================================
  INSTINCT STATUS - 12 total
============================================================

  Personal:  8
  Inherited: 4

## WORKFLOW (5)

  ███████░░░  70%  prefer-grep-before-edit
            trigger: when searching for code to modify
            action: Always use Grep to find exact location...

  █████████░  90%  always-test-first
            trigger: when adding new functionality
            action: Write tests before implementation...
```

**evolve 输出示例**:
```
============================================================
  EVOLVE ANALYSIS - 12 instincts
============================================================

High confidence instincts (>=80%): 4

## SKILL CANDIDATES

1. Cluster: "modifying code"
   Instincts: 3
   Avg confidence: 75%
   Domains: workflow, code-style

## COMMAND CANDIDATES (2)

  /test-first
    From: always-test-first
    Confidence: 90%

## AGENT CANDIDATES (1)

  refactor-specialist-agent
    Covers 4 instincts
    Avg confidence: 80%
```

---

### 3.5 配置文件 (config.json)

**路径**: `skills/continuous-learning-v2/config.json`

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7,
    "capture_tools": ["Edit", "Write", "Bash", "Read", "Grep", "Glob"],
    "ignore_tools": ["TodoWrite"]
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.02,
    "max_instincts": 100
  },
  "observer": {
    "enabled": false,
    "model": "haiku",
    "run_interval_minutes": 5,
    "min_observations_to_analyze": 20
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/",
    "auto_evolve": false
  }
}
```

---

## 四、文件结构

```
~/.claude/homunculus/
├── identity.json              # 用户配置文件、技术水平
├── observations.jsonl         # 当前会话观察记录
├── observations.archive/      # 已处理的观察记录归档
│   └── observations-20250122-103000.jsonl
├── instincts/
│   ├── personal/              # 自动学习的本能
│   │   ├── prefer-functional.yaml
│   │   └── always-test-first.yaml
│   └── inherited/             # 从他人导入的本能
│       └── team-conventions.yaml
└── evolved/                   # 进化生成的结构
    ├── agents/
    │   └── refactor-specialist.md
    ├── skills/
    │   └── testing-workflow/SKILL.md
    └── commands/
        └── new-feature.md
```

---

## 五、本能文件格式

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
```

**字段说明**:

| 字段 | 必需 | 说明 |
|------|------|------|
| `id` | 是 | 唯一标识符 |
| `trigger` | 是 | 触发条件 |
| `confidence` | 是 | 置信度 0.3-0.9 |
| `domain` | 是 | 领域标签 (code-style, testing, git, debugging, workflow 等) |
| `source` | 否 | 来源 (session-observation, repo-analysis, inherited) |
| `source_repo` | 否 | 如果来自仓库分析，记录仓库 URL |

---

## 六、数据流

```
会话活动
    │
    │ Hooks 捕获 (100% 可靠)
    ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   (prompts, tool calls, outcomes)       │
└─────────────────────────────────────────┘
    │
    │ Observer Agent 读取 (后台, Haiku)
    ▼
┌─────────────────────────────────────────┐
│          PATTERN DETECTION              │
│   • User corrections → instinct         │
│   • Error resolutions → instinct        │
│   • Repeated workflows → instinct       │
│   • Tool preferences → instinct         │
│   • File patterns → instinct            │
└─────────────────────────────────────────┘
    │
    │ 创建/更新
    ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
    │
    │ /evolve 聚类
    ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
│   • agents/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

---

## 七、为什么使用 Hooks 而非 Skills 进行观察？

> **关键洞察**: "v1 依赖 Skills 来观察。Skills 是概率性的——根据 Claude 的判断，它们只有 50-80% 的时间会触发。"

**Hooks 的优势**:
- **100% 触发率**: 确定性执行，每次工具调用都被观察
- **不遗漏任何模式**: 学习更加全面
- **无延迟**: 直接执行，不需要模型判断

---

## 八、项目中的其他相关组件

### 8.1 会话管理 Hooks

**session-start.js**:
- 加载上一个会话的上下文
- 检测包管理器
- 报告可用的会话别名

**session-end.js**:
- 从会话中提取摘要
- 保存会话状态到文件
- 跨会话连续性支持

### 8.2 评估 Hook (v1)

**evaluate-session.js**:
- 在 Stop hook 时运行
- 检查会话是否有足够消息 (默认 10+)
- 信号 Claude 评估会话中的可提取模式

### 8.3 工具库 (utils.js)

提供跨平台的工具函数:
- 文件操作 (readFile, writeFile, ensureDir)
- 日期时间 (getDateString, getTimeString)
- Git 操作 (isGitRepo, getGitModifiedFiles)
- Hook I/O (readStdinJson, log, output)

---

## 九、集成方式

### 作为插件安装

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

### 手动安装

```bash
# 创建目录结构
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands}}
touch ~/.claude/homunculus/observations.jsonl

# 启动观察者代理
~/.claude/skills/continuous-learning-v2/agents/start-observer.sh
```

---

## 十、与 Skill Creator 集成

当使用 [Skill Creator GitHub App](https://skill-creator.app) 时，它会生成:
1. 传统 SKILL.md 文件 (向后兼容)
2. 本能集合 (v2 学习系统)

来自仓库分析的本能具有:
- `source: "repo-analysis"`
- `source_repo: "https://github.com/..."`

这些应被视为团队/项目约定，初始置信度更高 (0.7+)。

---

## 十一、隐私说明

- 观察数据**保留在本地**
- 只有**本能**(模式)可以导出
- 不分享实际代码或对话内容
- 用户完全控制导出内容

---

## 十二、参考资料

- [Skill Creator](https://skill-creator.app) - 从仓库历史生成本能
- [Homunculus](https://github.com/humanplane/homunculus) - v2 架构灵感来源
- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - 连续学习章节

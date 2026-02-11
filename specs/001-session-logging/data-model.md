# Data Model: 会话内容记录功能

**Feature**: 001-session-logging
**Date**: 2026-02-11

## 概述

本功能使用纯文本文件存储会话日志，不涉及数据库。数据模型主要定义日志条目的格式和文件结构。

## 实体定义

### 1. 会话日志文件 (conversation.txt)

**描述**: 存储会话内容的纯文本文件

**位置**: `.claude/conversations/conversation.txt`

**编码**: UTF-8

**格式**: 每行一条记录，使用前缀标识来源

### 2. 日志条目 (Log Entry)

**描述**: 单条日志记录

**格式规范**:

```
<source>> <content>
```

| 字段 | 类型 | 说明 |
|------|------|------|
| source | string | 来源标识：`user` 或 `claude` |
| content | string | 记录内容，可能包含多行 |

**示例**:

```
user> 请帮我创建一个React组件
claude> [Edit] src/components/Button.tsx
user> 添加一个点击事件处理
claude> [Edit] src/components/Button.tsx - 添加onClick属性
```

### 3. 用户条目 (User Entry)

**来源**: UserPromptSubmit 事件

**格式**:
```
user> <prompt_text>
```

**字段映射**:

| Hook 输入字段 | 日志字段 | 说明 |
|---------------|----------|------|
| prompt | content | 用户输入的提示内容 |

### 4. 工具使用条目 (Tool Use Entry)

**来源**: PostToolUse 事件

**格式**:
```
claude> [<tool_name>] <summary>
```

**字段映射**:

| Hook 输入字段 | 日志字段 | 说明 |
|---------------|----------|------|
| tool | tool_name | 工具名称 |
| tool_input | - | 用于生成摘要 |
| tool_result | - | 用于生成摘要 |

**摘要生成规则**:
- Edit: `[Edit] <file_path>`
- Write: `[Write] <file_path>`
- Bash: `[Bash] <command> (前50字符)`
- 其他: `[<tool>] <简要描述>`

## 状态转换

### 滚动更新流程

```
[正常状态] -> [追加记录] -> [检查行数] -> [超出限制?] -> [滚动更新] -> [正常状态]
                                    |
                                    v
                              [保持不变] -> [正常状态]
```

**触发条件**: user> 开头的行数 > 100

**更新操作**:
1. 读取所有行
2. 识别条目边界（以 `user>` 或 `claude>` 开头的行）
3. 计算需删除的条目数（约1/3的user条目）
4. 从文件开头删除对应条目
5. 重写文件

## 验证规则

### 条目格式验证

| 规则 | 说明 |
|------|------|
| 前缀检查 | 每条记录必须以 `user>` 或 `claude>` 开头 |
| 内容非空 | 前缀后必须有内容（至少一个字符） |
| 单行记录 | 每条记录占一行，换行符转义为 `\n` |

### 文件大小约束

| 约束 | 值 | 说明 |
|------|-----|------|
| 最大user行数 | 100 | 超出触发滚动更新 |
| 单条记录最大长度 | 10KB | 防止单条记录过大 |
| 文件最大大小 | ~1MB | 估算值，实际由行数控制 |

## 排除工具映射

以下工具的 PostToolUse 事件不记录：

| 工具名 | 匹配模式 |
|--------|----------|
| Grep | 查询类 |
| Glob | 查询类 |
| WebSearch | 查询类 |
| WebFetch | 查询类 |
| Read | 查询类 |
| Task | 子Agent类 |

**Matcher配置**: `!(Grep|Glob|WebSearch|WebFetch|Read|Task)`

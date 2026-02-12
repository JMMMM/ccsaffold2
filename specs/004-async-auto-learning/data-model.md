# Data Model: 异步自动学习优化

**Feature**: 004-async-auto-learning
**Date**: 2026-02-12

## Entities

### LearningLogEntry

学习日志条目，记录自动学习过程中的每个步骤。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ts | string | Yes | ISO 8601 时间戳 |
| level | enum | Yes | 日志级别: INFO, WARN, ERROR, DEBUG |
| step | string | Yes | 步骤标识: read_transcript, filter_sensitive, llm_call, generate_skill |
| msg | string | Yes | 日志消息 |
| data | object | No | 相关数据（摘要，不含完整内容） |
| error | object | No | 错误信息（仅 ERROR 级别） |
| duration_ms | number | No | 步骤耗时（毫秒） |

**Validation Rules**:
- ts 必须是有效的 ISO 8601 格式
- level 必须是预定义枚举值之一
- step 必须是预定义步骤之一
- error 存在时必须包含 message 字段

**Example**:
```json
{"ts": "2026-02-12T10:30:00.000Z", "level": "INFO", "step": "read_transcript", "msg": "Transcript loaded", "data": {"record_count": 42}, "duration_ms": 15}
{"ts": "2026-02-12T10:30:01.500Z", "level": "INFO", "step": "llm_call", "msg": "LLM analysis completed", "data": {"results_count": 2}, "duration_ms": 1500}
{"ts": "2026-02-12T10:30:02.000Z", "level": "ERROR", "step": "generate_skill", "msg": "Failed to write skill file", "error": {"message": "EACCES: permission denied", "code": "EACCES"}}
```

### AsyncTaskConfig

异步任务配置，传递给 worker 进程。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| session_id | string | Yes | 会话唯一标识 |
| transcript_path | string | Yes | Transcript 文件路径 |
| cwd | string | Yes | 工作目录 |

**Validation Rules**:
- session_id 不能为空
- transcript_path 必须是绝对路径
- cwd 必须是有效的目录路径

**Example**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/user/.claude/transcripts/abc123.jsonl",
  "cwd": "/Users/user/project"
}
```

## State Transitions

```
[SessionEnd Hook]
       |
       v
[Spawn Worker] --> [Log: Task Started]
       |
       v
[Worker Running] --> [Log: Each Step]
       |
       +---> [Read Transcript] --> [Log: record_count, duration]
       |
       +---> [Filter Sensitive] --> [Log: filtered_count, duration]
       |
       +---> [LLM Analysis] --> [Log: request/response summary, duration]
       |
       +---> [Generate Skills] --> [Log: skill_paths, duration]
       |
       v
[Complete] --> [Log: Task Completed]
```

## File Storage

### Log File Location

```
{cwd}/.claude/logs/continuous-learning/learning-{session_id}.log
```

### Directory Structure

```
{cwd}/.claude/
└── logs/
    └── continuous-learning/
        ├── learning-session1.log
        ├── learning-session2.log
        └── ...
```

### Retention Policy

- 日志文件不自动清理
- 用户可手动删除旧日志
- 日志文件按 session_id 命名，便于追踪

# Contract: Learning Logger

**Feature**: 004-async-auto-learning
**Module**: lib/learning-logger.js

## Interface

### createLogger(sessionId, cwd)

创建学习日志记录器实例。

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| sessionId | string | Yes | 会话 ID |
| cwd | string | Yes | 工作目录 |

**Returns**: Logger instance

**Throws**: Never (errors are logged internally)

### logger.log(level, step, message, data)

记录日志条目。

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| level | string | Yes | 日志级别: INFO, WARN, ERROR, DEBUG |
| step | string | Yes | 步骤标识 |
| message | string | Yes | 日志消息 |
| data | object | No | 附加数据 |

**Returns**: void

### logger.logError(step, message, error)

记录错误日志。

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| step | string | Yes | 步骤标识 |
| message | string | Yes | 错误描述 |
| error | Error | Yes | 错误对象 |

**Returns**: void

### logger.logStep(step, message, data, startTime)

记录步骤完成日志（含耗时）。

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| step | string | Yes | 步骤标识 |
| message | string | Yes | 日志消息 |
| data | object | No | 附加数据 |
| startTime | number | No | 步骤开始时间戳 (Date.now()) |

**Returns**: void

### logger.getLogPath()

获取日志文件路径。

**Returns**: string - 日志文件绝对路径

## Step Identifiers

| Step | Description |
|------|-------------|
| init | 初始化 |
| read_transcript | 读取 transcript 文件 |
| parse_transcript | 解析 transcript |
| filter_sensitive | 敏感信息过滤 |
| llm_call | LLM API 调用 |
| llm_request | LLM 请求详情 |
| llm_response | LLM 响应详情 |
| generate_skill | 生成 skill 文件 |
| write_skill | 写入 skill 文件 |
| complete | 任务完成 |
| error | 错误发生 |

## Log Format

Each log entry is a single JSON line:

```json
{"ts": "2026-02-12T10:30:00.000Z", "level": "INFO", "step": "step_name", "msg": "message", "data": {}, "duration_ms": 100}
```

## Terminal Output

Console output follows constitution VII (no emoji, ASCII only):

```
[Auto-Learning] INFO: message
[Auto-Learning] ERROR: error message
```

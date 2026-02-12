# Research: 异步自动学习优化

**Feature**: 004-async-auto-learning
**Date**: 2026-02-12

## Research Questions

### 1. Node.js 子进程异步执行最佳实践

**Decision**: 使用 `child_process.spawn` 与 `detached` 选项

**Rationale**:
- `spawn` 比 `exec` 更适合长时间运行的任务
- `detached: true` 使子进程独立于父进程
- `unref()` 允许父进程在不等待子进程的情况下退出

**Alternatives Considered**:
- `child_process.exec`: 不适合，缓冲区有限制
- `child_process.fork`: 需要 Node.js 脚本，与 spawn 类似但更重
- Worker Threads: 不适合，仍在同一进程内

**Implementation Pattern**:
```javascript
const child = spawn(process.execPath, [workerPath, sessionId], {
  detached: true,
  stdio: 'ignore',
  cwd: workDir
});
child.unref();
```

### 2. 日志文件格式选择

**Decision**: JSON Lines (JSONL) 格式

**Rationale**:
- 每行一个 JSON 对象，便于流式写入
- 易于程序解析和人类阅读
- 支持追加写入，不会破坏文件结构

**Alternatives Considered**:
- 纯文本格式: 不易于程序解析
- 完整 JSON 数组: 追加写入需要重写整个文件

**Log Entry Structure**:
```json
{"ts": "2026-02-12T10:30:00.000Z", "level": "INFO", "step": "read_transcript", "msg": "Reading transcript file", "data": {"path": "/path/to/transcript.jsonl"}}
```

### 3. 跨平台路径处理

**Decision**: 使用 `path.join()` 和 `__dirname`

**Rationale**:
- 符合宪章 IV 跨平台兼容性要求
- 自动处理不同操作系统的路径分隔符

**Implementation**:
```javascript
const logDir = path.join(cwd, '.claude', 'logs', 'continuous-learning');
const logFile = path.join(logDir, `learning-${sessionId}.log`);
```

### 4. 错误处理策略

**Decision**: 静默失败 + 详细日志

**Rationale**:
- 子进程错误不应影响主进程
- 日志文件提供完整的错误诊断信息
- 符合现有 auto-learning.js 的错误处理模式

**Error Logging Pattern**:
```json
{"ts": "...", "level": "ERROR", "step": "llm_call", "msg": "API call failed", "error": {"message": "...", "stack": "..."}}
```

### 5. 日志内容规范

**Decision**: 遵循宪章 VII 日志规范

**Requirements**:
- 不包含 emoji 和特殊 Unicode 字符
- 使用 ASCII 字符
- 前缀格式: `[Auto-Learning]`
- 日志级别: INFO, WARN, ERROR, DEBUG

**Terminal Output Format**:
```
[Auto-Learning] INFO: Starting async learning for session abc123
[Auto-Learning] INFO: Log file: .claude/logs/continuous-learning/learning-abc123.log
```

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js child_process | 18+ | 子进程管理 |
| Node.js fs | 18+ | 文件操作 |
| Node.js path | 18+ | 路径处理 |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 子进程启动失败 | 在主进程 try-catch，确保不抛出错误 |
| 日志目录权限问题 | 使用 recursive 选项创建目录 |
| 大文件日志 | 不记录完整内容，只记录摘要 |
| LLM API 超时 | 保持现有的 30s 超时设置 |

## Conclusion

技术方案明确，无阻塞性问题。可以进入 Phase 1 设计阶段。

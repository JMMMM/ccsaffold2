# Contract: Auto-Learning Hook

**Feature**: 004-async-auto-learning
**Module**: hooks/auto-learning.js

## Interface

### stdin Input

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project/path",
  "hook_event_name": "SessionEnd"
}
```

### stdout Output

```
[Auto-Learning] INFO: Starting async learning for session abc123
[Auto-Learning] INFO: Log file: .claude/logs/continuous-learning/learning-abc123.log
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Always (never blocks) |

## Behavior

1. Parse stdin input
2. Verify it's a SessionEnd event
3. Validate required fields
4. Check API availability
5. Spawn worker process with detached mode
6. Return immediately (do not wait for worker)

## Spawning Worker

```javascript
const config = JSON.stringify({
  session_id: input.session_id,
  transcript_path: input.transcript_path,
  cwd: input.cwd
});

const child = spawn(process.execPath, [workerPath, config], {
  detached: true,
  stdio: 'ignore',
  cwd: input.cwd
});

child.unref();
```

## Error Handling

- If spawn fails, log error and continue
- Never throw exceptions
- Always exit with code 0

## Skip Conditions

- Not a SessionEnd event
- Missing required fields (session_id, transcript_path, cwd)
- API key not available (ANTHROPIC_AUTH_TOKEN)

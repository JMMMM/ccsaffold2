# Contract: Auto-Learning Worker

**Feature**: 004-async-auto-learning
**Module**: hooks/auto-learning-worker.js

## Interface

### Command Line Arguments

```bash
node auto-learning-worker.js <config_json>
```

**Arguments**:
| Position | Type | Description |
|----------|------|-------------|
| 1 | string | JSON encoded AsyncTaskConfig |

### Input Format (stdin)

Alternative: Read config from stdin as JSON.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (or graceful failure) |
| 1 | Invalid input |
| 2 | Unexpected error |

## Execution Flow

```
1. Parse config from command line argument
2. Initialize logger
3. Log task start
4. Read and parse transcript file
5. Filter sensitive information
6. Call LLM API for analysis
7. Generate skill files
8. Log task completion
9. Exit with code 0
```

## Error Handling

- All errors are logged to the log file
- Worker never throws uncaught exceptions
- Exit code is always 0 or 1 (never crash)

## Dependencies

- lib/transcript-reader.js
- lib/sensitive-filter.js
- lib/llm-analyzer.js
- lib/skill-generator.js
- lib/learning-logger.js

## Example Usage

```bash
node auto-learning-worker.js '{"session_id":"abc123","transcript_path":"/path/to/transcript.jsonl","cwd":"/project"}'
```

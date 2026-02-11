# Hook stdin 输入格式

## 通用字段

所有 hook 事件都包含以下基础字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话唯一标识 |
| transcript_path | string | 会话记录文件路径 |
| cwd | string | 当前工作目录 |
| hook_event_name | string | 事件类型名称 |

## 处理 stdin 的最佳实践

### Node.js

```javascript
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data || '{}');
    // 处理 input
  } catch (e) {
    // 忽略解析错误
  }
  process.exit(0);  // 必须退出
});
```

### Python

```python
import sys
import json

try:
    data = sys.stdin.read()
    input_data = json.loads(data or '{}')
    # 处理 input_data
except Exception:
    pass
sys.exit(0)  # 必须退出
```

### Bash

```bash
# 读取 stdin
input=$(cat)

# 使用 jq 解析 (需要安装 jq)
event=$(echo "$input" | jq -r '.hook_event_name')

# 必须退出
exit 0
```

## 输出格式

### 普通输出

直接输出到 stdout，会被 Claude Code 记录。

### 拦截/拒绝 (仅 PreToolUse)

```json
{
  "decision": "deny",
  "reason": "拒绝此操作的原因"
}
```

### 修改工具输入 (仅 PreToolUse)

```json
{
  "decision": "approve",
  "modified_input": {
    "command": "修改后的命令"
  }
}
```

## 错误处理

- Hook 脚本必须始终以 `exit 0` 退出
- 非 0 退出码会被视为失败
- stderr 输出会被记录但不会阻断流程
- 未捕获的异常可能导致 hook 失败

## 路径解析

使用脚本所在目录解析相对路径：

```javascript
// Node.js
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'hook.log');

# Python
import os
log_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 'hook.log')
```

避免依赖工作目录 (cwd)，因为工作目录可能变化。

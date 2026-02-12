#!/usr/bin/env node
/**
 * Session Log Hook
 * 在每个 Claude Code hook 节点记录 stdin 原始内容
 *
 * stdin 输入格式:
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "/path/to/.../xxx.jsonl",
 *   "cwd": "/Users/...",
 *   "hook_event_name": "UserPromptSubmit | PreToolUse | PostToolUse | Notification | Stop | SessionEnd",
 *   ... 其他事件特定字段
 * }
 */
const fs = require('fs');
const path = require('path');

// 获取项目根目录
// 当脚本在 .claude/hooks/ 中时，向上两级到项目根
// 当脚本在 feature/hook-session-log/hooks/ 中时，向上三级到项目根
const projectRoot = fs.existsSync(path.join(__dirname, '..', '..', '.claude'))
  ? path.resolve(__dirname, '..', '..')  // 在 .claude/hooks/ 中
  : path.resolve(__dirname, '..', '..', '..');  // 在 feature/*/hooks/ 中
const logDir = path.join(projectRoot, 'doc', 'session_log');

// 生成日期格式的日志文件名
function getLogFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `session_log_${year}${month}${day}.md`;
}

// 生成 ISO 格式时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 格式化日志条目
function formatLogEntry(timestamp, eventName, rawInput) {
  return `## [${timestamp}] ${eventName}

\`\`\`json
${JSON.stringify(rawInput, null, 2)}
\`\`\`

---

`;
}

// 主处理函数
function processLog() {
  let data = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    data += chunk;
  });

  process.stdin.on('end', () => {
    try {
      // 解析 stdin JSON
      const input = data.trim() ? JSON.parse(data) : {};

      // 获取事件名称，默认为 Unknown
      const eventName = input.hook_event_name || 'Unknown';
      const timestamp = getTimestamp();

      // 格式化日志条目
      const logEntry = formatLogEntry(timestamp, eventName, input);

      // 确保日志目录存在
      fs.mkdirSync(logDir, { recursive: true });

      // 写入日志文件
      const logFile = path.join(logDir, getLogFileName());
      fs.appendFileSync(logFile, logEntry, 'utf8');

    } catch (e) {
      // 静默处理错误，不输出任何内容
    }

    // 始终以 exit(0) 退出，避免阻塞 Claude Code
    process.exit(0);
  });
}

// 运行
processLog();

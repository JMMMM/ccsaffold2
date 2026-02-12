#!/usr/bin/env node
/**
 * Session Logger Hook
 * 记录用户输入和工具调用，保存到项目的conversations目录
 *
 * stdin 输入格式:
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "/path/to/.../xxx.jsonl",
 *   "cwd": "/Users/...",
 *   "hook_event_name": "UserPromptSubmit | PostToolUse",
 *   "prompt": "...",               // UserPromptSubmit 时
 *   "tool_name": "Write",           // PostToolUse 时
 *   "tool_input": { ... },          // PostToolUse 时
 *   "tool_response": { ... }        // PostToolUse 时
 * }
 *
 * 输出格式:
 * - UserPromptSubmit>{prompt}
 * - PostToolUse>{"tool_name":"xxx","tool_input":{...},"tool_response":{...}}
 */
const fs = require('fs');
const path = require('path');

// 获取项目目录（从stdin中的cwd字段，或者使用当前工作目录）
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { data += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data || '{}');
    const cwd = input.cwd || process.cwd();
    const sessionId = input.session_id || 'default';
    const logFile = path.join(cwd, '.claude', 'conversations', `conversation-${sessionId}.txt`);
    const eventName = input.hook_event_name;

    let entry = null;
    if (eventName === 'UserPromptSubmit') {
      const prompt = input.prompt || '';
      entry = `UserPromptSubmit>${prompt}`;
    } else if (eventName === 'PostToolUse') {
      const toolLog = {
        tool_name: input.tool_name,
        tool_input: input.tool_input,
        tool_response: input.tool_response
      };
      entry = `PostToolUse>${JSON.stringify(toolLog, null, 2)}`;
    }

    if (entry) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, entry + '\n');
    }
  } catch (e) {}
  process.exit(0);
});

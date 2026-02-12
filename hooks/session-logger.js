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
 *   "tool_name": "Write",           // PostToolUse 时
 *   "tool_input": { ... },          // PostToolUse 时
 *   "tool_response": { ... }        // PostToolUse 时
 * }
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
    const logFile = path.join(cwd, '.claude', 'conversations', 'conversation.txt');
    const eventName = input.hook_event_name;

    let entry = null;
    if (eventName === 'UserPromptSubmit') {
      const prompt = input.prompt || '';
      entry = `user> ${prompt}`;
    } else if (eventName === 'PostToolUse') {
      entry = `Claude> ${JSON.stringify(input)}`;
    }

    if (entry) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, entry + '\n');
    }
  } catch (e) {}
  process.exit(0);
});

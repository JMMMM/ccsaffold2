#!/usr/bin/env node
/**
 * Session Logger Hook
 * 根据 hook_event_name 记录用户输入和工具调用，保存完整内容
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

const logFile = path.join(__dirname, '..', 'conversations', 'conversation.txt');

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { data += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data || '{}');
    const eventName = input.hook_event_name;
    let entry = null;

    if (eventName === 'UserPromptSubmit') {
      entry = formatUserPrompt(input);
    } else if (eventName === 'PostToolUse') {
      entry = formatToolUse(input);
    }

    if (entry) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, entry + '\n');
    }
  } catch (e) {}
  process.exit(0);
});

function formatUserPrompt(input) {
  const prompt = input.prompt || '';
  return `user> ${prompt}`;
}

function formatToolUse(input) {
  // 输出工具调用的原文
  return `Claude> ${JSON.stringify(input)}`;
}

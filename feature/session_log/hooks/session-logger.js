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
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};

  switch (tool) {
    case 'Edit':
      return `claude> [Edit]\n  file: ${ti.file_path || ''}\n  old: ${ti.old_string || ''}\n  new: ${ti.new_string || ''}`;
    case 'Write':
      return `claude> [Write]\n  file: ${ti.file_path || ''}\n  content: ${ti.content || ''}`;
    case 'Bash':
      return `claude> [Bash]\n  command: ${ti.command || ''}`;
    case 'NotebookEdit':
      return `claude> [NotebookEdit]\n  notebook: ${ti.notebook_path || ''}\n  source: ${ti.new_source || ''}`;
    default:
      return `claude> [${tool}]\n  input: ${JSON.stringify(ti)}`;
  }
}

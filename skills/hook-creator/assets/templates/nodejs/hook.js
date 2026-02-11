#!/usr/bin/env node
/**
 * Hook Script Template (Node.js)
 *
 * stdin 输入格式参见 references/input-format.md
 */
const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data || '{}');
    const eventName = input.hook_event_name;

    // 根据事件类型处理
    switch (eventName) {
      case 'UserPromptSubmit':
        handleUserPrompt(input);
        break;
      case 'PreToolUse':
        handlePreToolUse(input);
        break;
      case 'PostToolUse':
        handlePostToolUse(input);
        break;
      case 'Notification':
        handleNotification(input);
        break;
      case 'Stop':
        handleStop(input);
        break;
    }
  } catch (e) {
    // 忽略错误
  }
  process.exit(0);
});

function handleUserPrompt(input) {
  const prompt = input.prompt || '';
  // TODO: 实现你的逻辑
}

function handlePreToolUse(input) {
  const tool = input.tool_name || '';
  const toolInput = input.tool_input || {};
  // TODO: 实现你的逻辑

  // 如需拦截，输出:
  // console.log(JSON.stringify({ decision: 'deny', reason: '拒绝原因' }));
}

function handlePostToolUse(input) {
  const tool = input.tool_name || '';
  const toolInput = input.tool_input || {};
  const toolResponse = input.tool_response || {};
  // TODO: 实现你的逻辑
}

function handleNotification(input) {
  const notification = input.notification || '';
  // TODO: 实现你的逻辑
}

function handleStop(input) {
  // TODO: 清理资源
}

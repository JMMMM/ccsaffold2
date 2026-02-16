#!/usr/bin/env node
/**
 * Conversation Reader Module
 * Reads and parses conversation log files from session-logger
 *
 * File format (each line):
 * - UserPromptSubmit>{prompt}
 * - PostToolUse>{"tool_name":"xxx","tool_input":{...},"tool_response":{...}}
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse a conversation file and return structured data
 * @param {string} filePath - Path to the conversation file
 * @returns {Object|null} Parsed conversation data or null if file not found
 */
function parseFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const userPrompts = [];
    const toolUses = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        continue;
      }

      if (trimmed.startsWith('UserPromptSubmit>')) {
        const prompt = trimmed.substring('UserPromptSubmit>'.length);
        userPrompts.push(prompt);
      } else if (trimmed.startsWith('PostToolUse>')) {
        const jsonStr = trimmed.substring('PostToolUse>'.length);
        try {
          const toolLog = JSON.parse(jsonStr);
          toolUses.push(toolLog);
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    return {
      userPrompts,
      toolUses,
      userPromptCount: userPrompts.length,
      toolUseCount: toolUses.length
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extract conversation as text for LLM analysis
 * 直接读取原始文件内容，不裁剪
 * @param {Object} data - Parsed conversation data from parseFile()
 * @returns {string} Raw conversation text
 */
function extractConversationText(data) {
  if (!data) {
    return '';
  }

  // 直接返回原始文件内容
  return data.rawContent || '';
}

/**
 * Parse a conversation file and return structured data
 * @param {string} filePath - Path to the conversation file
 * @returns {Object|null} Parsed conversation data or null if file not found
 */
function parseFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const userPrompts = [];
    const toolUses = [];
    // 记录所有事件的原始行，用于提取最新N条
    const allEvents = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        continue;
      }

      if (trimmed.startsWith('UserPromptSubmit>')) {
        const prompt = trimmed.substring('UserPromptSubmit>'.length);
        userPrompts.push(prompt);
        allEvents.push({ type: 'user', rawLine: trimmed, prompt });
      } else if (trimmed.startsWith('PostToolUse>')) {
        const jsonStr = trimmed.substring('PostToolUse>'.length);
        try {
          const toolLog = JSON.parse(jsonStr);
          toolUses.push(toolLog);
          allEvents.push({ type: 'tool', rawLine: trimmed, toolLog });
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    return {
      userPrompts,
      toolUses,
      userPromptCount: userPrompts.length,
      toolUseCount: toolUses.length,
      allEvents,
      rawContent: content
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extract conversation as text for LLM analysis
 * 只读取最新的10条内容（UserPromptSubmit + PostToolUse）
 * @param {Object} data - Parsed conversation data from parseFile()
 * @param {number} maxEvents - 最大事件数量，默认10
 * @returns {string} Formatted conversation text
 */
function extractConversationText(data, maxEvents = 10) {
  if (!data || !data.allEvents || data.allEvents.length === 0) {
    return '';
  }

  // 只取最新的 maxEvents 条
  const recentEvents = data.allEvents.slice(-maxEvents);
  const parts = [];

  for (const event of recentEvents) {
    if (event.type === 'user') {
      parts.push(`User: ${event.prompt}`);
    } else if (event.type === 'tool') {
      const toolName = event.toolLog.tool_name || 'unknown';
      // 简化 tool 输出，只保留关键信息
      let toolSummary = `Tool[${toolName}]`;
      if (event.toolLog.tool_input) {
        const inputKeys = Object.keys(event.toolLog.tool_input);
        if (inputKeys.length > 0) {
          toolSummary += ` input: ${inputKeys.slice(0, 5).join(', ')}`;
        }
      }
      parts.push(toolSummary);
    }
  }

  return parts.join('\n\n');
}

/**
 * Read conversation file by session_id
 * @param {string} cwd - Working directory
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Parsed conversation data or null if not found
 */
function readBySessionId(cwd, sessionId) {
  const filePath = path.join(cwd, '.claude', 'conversations', `conversation-${sessionId}.txt`);
  return parseFile(filePath);
}

/**
 * Get conversation file path by session_id
 * @param {string} cwd - Working directory
 * @param {string} sessionId - Session ID
 * @returns {string} Full path to conversation file
 */
function getConversationPath(cwd, sessionId) {
  return path.join(cwd, '.claude', 'conversations', `conversation-${sessionId}.txt`);
}

/**
 * Check if conversation has enough user prompts for learning
 * @param {Object} data - Parsed conversation data
 * @param {number} minCount - Minimum required user prompts (default: 5)
 * @returns {boolean} True if enough prompts
 */
function hasEnoughPrompts(data, minCount = 5) {
  return data && data.userPromptCount >= minCount;
}

module.exports = {
  parseFile,
  extractConversationText,
  readBySessionId,
  getConversationPath,
  hasEnoughPrompts
};

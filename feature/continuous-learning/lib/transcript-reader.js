#!/usr/bin/env node
/**
 * Transcript Reader Module
 * Reads and parses Claude Code transcript files (JSONL format)
 *
 * JSONL format: Each line is a valid JSON object
 * Record types: user, assistant, tool_use
 */

'use strict';

const fs = require('fs');
const readline = require('readline');

/**
 * Parse a JSONL file and return array of records
 * @param {string} filePath - Path to the JSONL file
 * @returns {Object[]|null} Array of parsed records, or null if file not found
 */
function parseFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        continue;
      }

      try {
        const record = JSON.parse(trimmed);
        records.push(record);
      } catch (e) {
        // Skip malformed JSON lines
        continue;
      }
    }

    return records;
  } catch (e) {
    return null;
  }
}

/**
 * Parse a JSONL file asynchronously (streaming for large files)
 * @param {string} filePath - Path to the JSONL file
 * @returns {Promise<Object[]|null>} Promise resolving to array of records
 */
async function parseFileAsync(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      resolve(null);
      return;
    }

    const records = [];
    const stream = fs.createReadStream(filePath, 'utf8');
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed === '') {
        return;
      }

      try {
        const record = JSON.parse(trimmed);
        records.push(record);
      } catch (e) {
        // Skip malformed JSON lines
      }
    });

    rl.on('close', () => {
      resolve(records);
    });

    rl.on('error', () => {
      resolve(records);
    });
  });
}

/**
 * Extract user messages from records
 * @param {Object[]} records - Array of parsed records
 * @returns {string[]} Array of user message contents
 */
function extractUserMessages(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter(r => r.type === 'user' && r.message && r.message.content)
    .map(r => r.message.content);
}

/**
 * Extract assistant messages from records
 * @param {Object[]} records - Array of parsed records
 * @returns {string[]} Array of assistant message contents
 */
function extractAssistantMessages(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter(r => r.type === 'assistant' && r.message && r.message.content)
    .map(r => r.message.content);
}

/**
 * Extract tool use records
 * @param {Object[]} records - Array of parsed records
 * @returns {Object[]} Array of tool_use records
 */
function extractToolUses(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.filter(r => r.type === 'tool_use');
}

/**
 * Extract full conversation as text
 * @param {Object[]} records - Array of parsed records
 * @returns {string} Formatted conversation text
 */
function extractConversationText(records) {
  if (!Array.isArray(records)) {
    return '';
  }

  const parts = [];

  for (const record of records) {
    if (record.type === 'user' && record.message && record.message.content) {
      parts.push(`User: ${record.message.content}`);
    } else if (record.type === 'assistant' && record.message && record.message.content) {
      parts.push(`Assistant: ${record.message.content}`);
    } else if (record.type === 'tool_use') {
      parts.push(`Tool: ${record.tool || 'unknown'}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Convenience method to read and parse a transcript file
 * @param {string} filePath - Path to the JSONL file
 * @returns {Object|null} Object with records and metadata, or null if file not found
 */
function readFile(filePath) {
  const records = parseFile(filePath);
  if (records === null) {
    return null;
  }

  return {
    records,
    userMessages: extractUserMessages(records),
    assistantMessages: extractAssistantMessages(records),
    toolUses: extractToolUses(records),
    conversationText: extractConversationText(records),
    recordCount: records.length
  };
}

/**
 * Get transcript path from sessionEnd hook input
 * @param {Object} hookInput - The hook input object
 * @returns {string|null} Transcript path or null if not found
 */
function getTranscriptPath(hookInput) {
  if (!hookInput || typeof hookInput !== 'object') {
    return null;
  }

  return hookInput.transcript_path || null;
}

/**
 * Get working directory from sessionEnd hook input
 * @param {Object} hookInput - The hook input object
 * @returns {string|null} Working directory or null if not found
 */
function getWorkingDirectory(hookInput) {
  if (!hookInput || typeof hookInput !== 'object') {
    return null;
  }

  return hookInput.cwd || null;
}

module.exports = {
  parseFile,
  parseFileAsync,
  extractUserMessages,
  extractAssistantMessages,
  extractToolUses,
  extractConversationText,
  readFile,
  getTranscriptPath,
  getWorkingDirectory
};

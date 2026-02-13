#!/usr/bin/env node
/**
 * LLM Client Module
 * Calls BigModel API (智谱AI) for learning analysis
 *
 * Output format: JSON with file_path, thinking, file_type
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  timeout: 180000,     // 180 seconds (3 minutes) timeout
  model: 'glm-4.7-flash',
  maxTokens: 65536,
  temperature: 1.0
};

/**
 * Supported file types (extensible)
 */
const FILE_TYPES = {
  SKILL: 'skill',
  DOC: 'doc',
  NONE: 'none'
};

/**
 * Get API key from environment
 * @returns {string|null} API key or null
 */
function getApiKey() {
  return process.env.ANTHROPIC_AUTH_TOKEN || null;
}

/**
 * Check if API is available
 * @returns {boolean} True if API key is configured
 */
function isAvailable() {
  return getApiKey() !== null;
}

/**
 * Check API availability
 * @returns {Promise<Object>} Object with available boolean
 */
async function checkAvailability() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { available: false, reason: 'ANTHROPIC_AUTH_TOKEN not set' };
  }
  return { available: true, model: DEFAULT_CONFIG.model };
}

/**
 * Build the learning prompt for LLM
 * @param {string} cwd - Working directory for file creation
 * @returns {string} The complete prompt
 */
function buildLearningPrompt(cwd) {
  return `分析以下会话内容，判断学习价值并创建相应的知识文件。

## 判断规则

1. **skill**: 当会话显示同一问题经过多次（>=3次）调试/尝试后最终解决
   - 文件路径: \`${cwd}/.claude/skills/{name}/SKILL.md\`
   - 触发词应基于 bug/错误现象

2. **doc**: 当会话涉及功能开发、修改、性能调优、架构变更
   - 文件路径: \`${cwd}/.claude/doc/features/{name}.md\`

3. **none**: 纯问答或内容过少，不做任何操作

## 文件格式

### Skill 格式:
\`\`\`markdown
---
name: skill-name
description: 简短描述（5-200字符）
---

# Skill: skill-name

## Purpose
当用户遇到 [问题描述] 时，[解决方案]。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- 关键词1
- 关键词2

## Instructions
1. 步骤1
2. 步骤2

## Examples
示例1：用户说 "[关键词]" -> AI 引导用户排查
\`\`\`

### Doc 格式:
\`\`\`markdown
# Feature: 功能名称

**Type**: new-feature|modification|optimization|refactor
**Created**: YYYY-MM-DD

## Summary
功能概述

## Design
核心设计说明

## Implementation
- 实现点1
- 实现点2
\`\`\`

## 输出格式要求

完成分析后，必须在最后输出一个纯JSON文本：

\`\`\`json
{
  "file_type": "skill|doc|none",
  "file_path": "相对路径或空",
  "thinking": "分析过程和判断依据",
  "content": "文件内容（如果需要创建文件）"
}
\`\`\`

## 工作目录
${cwd}

## 指令
1. 分析管道传入的会话内容
2. 如果有学习价值，在 content 字段中提供完整的文件内容
3. 如果已有同名文件存在，考虑合并更新
4. 最后必须输出 JSON 格式的分析结果`;
}

/**
 * Parse JSON result from LLM output
 * @param {string} output - The raw output from LLM
 * @returns {Object|null} Parsed result or null
 */
function parseJsonResult(output) {
  if (!output) return null;

  // Try to find JSON block in output
  const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      // Try to find JSON without code block
    }
  }

  // Try to find standalone JSON object
  const jsonObjectMatch = output.match(/\{[\s\S]*?"file_type"[\s\S]*?"thinking"[\s\S]*?\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Write file based on learning result
 * @param {Object} result - The parsed JSON result
 * @param {string} cwd - Working directory
 * @param {Object} logger - Optional logger
 * @returns {boolean} Success status
 */
function writeLearningFile(result, cwd, logger = null) {
  if (!result || !result.file_path || !result.content) {
    return false;
  }

  try {
    const fullPath = path.join(cwd, result.file_path);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, result.content, 'utf8');

    if (logger) {
      logger.log('INFO', 'file-write', 'File created', { path: result.file_path });
    }
    console.log(`[LLM] File created: ${result.file_path}`);

    return true;
  } catch (e) {
    if (logger) {
      logger.log('ERROR', 'file-write', 'Failed to write file', { error: e.message });
    }
    console.error(`[LLM] Failed to write file: ${e.message}`);
    return false;
  }
}

/**
 * Execute learning via BigModel API
 *
 * @param {string} content - The conversation content
 * @param {string} cwd - Working directory
 * @param {Object} options - Optional configuration
 * @param {Object} logger - Optional logger instance
 * @returns {Promise<Object>} Result with success status and message
 */
async function executeLearning(content, cwd, options = {}, logger = null) {
  const log = (level, step, message, data = {}) => {
    if (logger && typeof logger.log === 'function') {
      logger.log(level, step, message, data);
    }
  };

  const apiKey = getApiKey();
  if (!apiKey) {
    log('ERROR', 'api-check', 'API key not configured');
    return { success: false, error: 'ANTHROPIC_AUTH_TOKEN not configured' };
  }

  if (!content || content.trim().length < 50) {
    log('WARN', 'content-check', 'Content too short', { length: content ? content.length : 0 });
    return { success: false, error: 'Content too short for learning' };
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  const prompt = buildLearningPrompt(cwd);
  const startTime = Date.now();

  log('INFO', 'prompt-build', 'Prompt built', {
    contentLength: content.length,
    promptLength: prompt.length,
    model: config.model
  });

  return new Promise((resolve) => {
    const requestBody = JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt + '\n\n## 会话内容\n\n' + content
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    });

    const reqOptions = {
      hostname: 'open.bigmodel.cn',
      port: 443,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: config.timeout
    };

    log('INFO', 'api-start', 'Calling BigModel API', { model: config.model });
    console.log('[LLM] Calling BigModel API...');

    const req = https.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        if (res.statusCode !== 200) {
          log('ERROR', 'api-error', 'API request failed', {
            statusCode: res.statusCode,
            body: data.substring(0, 500)
          });
          console.log(`[LLM] API failed with status: ${res.statusCode}`);
          resolve({
            success: false,
            error: `API returned ${res.statusCode}: ${data.substring(0, 200)}`
          });
          return;
        }

        try {
          const response = JSON.parse(data);
          const output = response.choices && response.choices[0] && response.choices[0].message
            ? response.choices[0].message.content
            : '';

          log('INFO', 'api-response', 'API response received', {
            duration: duration,
            outputLength: output.length
          });

          // Parse JSON result from output
          const jsonResult = parseJsonResult(output);

          if (jsonResult) {
            log('INFO', 'result-type', 'File type determined', { file_type: jsonResult.file_type });
            log('INFO', 'result-path', 'File path', { file_path: jsonResult.file_path || '(none)' });
            log('INFO', 'result-thinking', 'Thinking process', { thinking: jsonResult.thinking });

            // Write file if content provided
            if (jsonResult.file_type !== 'none' && jsonResult.content) {
              writeLearningFile(jsonResult, cwd, logger);
            }
          } else {
            log('WARN', 'result-parse', 'Failed to parse JSON from output');
          }

          log('INFO', 'api-complete', 'Learning completed', {
            duration: duration,
            outputLength: output.length
          });

          console.log('\n[LLM] Learning completed successfully');
          resolve({
            success: true,
            output: output,
            message: 'Learning completed',
            duration: duration,
            result: jsonResult
          });
        } catch (e) {
          log('ERROR', 'parse-error', 'Failed to parse API response', { error: e.message });
          resolve({ success: false, error: `Failed to parse response: ${e.message}` });
        }
      });
    });

    req.on('error', (e) => {
      log('ERROR', 'request-error', 'Request failed', { error: e.message });
      resolve({ success: false, error: e.message });
    });

    req.on('timeout', () => {
      log('ERROR', 'api-timeout', 'API request timed out', { timeout: config.timeout });
      req.destroy();
      resolve({ success: false, error: 'API request timeout' });
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Execute learning with file (reads file and calls API)
 *
 * @param {string} filePath - Path to the conversation file
 * @param {string} cwd - Working directory
 * @param {Object} options - Optional configuration
 * @param {Object} logger - Optional logger instance
 * @returns {Promise<Object>} Result with success status and message
 */
async function executeLearningWithFile(filePath, cwd, options = {}, logger = null) {
  const log = (level, step, message, data = {}) => {
    if (logger && typeof logger.log === 'function') {
      logger.log(level, step, message, data);
    }
  };

  const tailLines = options.tailLines || 5000;

  log('INFO', 'file-read', 'Reading conversation file', {
    filePath: filePath,
    tailLines: tailLines
  });

  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const tailProc = spawn('tail', ['-n', String(tailLines), filePath], {
      timeout: 10000
    });

    let fileContent = '';
    let tailError = '';

    tailProc.stdout.on('data', (data) => {
      fileContent += data.toString();
    });

    tailProc.stderr.on('data', (data) => {
      tailError += data.toString();
    });

    tailProc.on('close', async (tailCode) => {
      if (tailCode !== 0) {
        log('ERROR', 'tail-error', 'Failed to read file', { error: tailError });
        resolve({ success: false, error: `Failed to read file: ${tailError}` });
        return;
      }

      log('INFO', 'file-read-complete', 'File content read', {
        contentLength: fileContent.length
      });

      // Call API with content
      const result = await executeLearning(fileContent, cwd, options, logger);
      resolve(result);
    });

    tailProc.on('error', (e) => {
      log('ERROR', 'tail-error', 'Tail process error', { error: e.message });
      resolve({ success: false, error: e.message });
    });
  });
}

/**
 * Clear cached availability
 */
function clearCache() {
  // No cache for HTTP API
}

module.exports = {
  isAvailable,
  checkAvailability,
  buildLearningPrompt,
  executeLearning,
  executeLearningWithFile,
  parseJsonResult,
  writeLearningFile,
  clearCache,
  DEFAULT_CONFIG,
  FILE_TYPES
};

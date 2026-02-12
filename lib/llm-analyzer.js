#!/usr/bin/env node
/**
 * LLM Analyzer Module
 * Calls LLM API to analyze transcript content and identify learning opportunities
 *
 * Uses Node.js built-in https module for API calls
 * Supports 智谱 AI API (GLM-4)
 */

'use strict';

const https = require('https');

/**
 * Default configuration
 * 使用智谱 AI API
 */
const DEFAULT_CONFIG = {
  model: 'glm-4.7-flash',
  maxTokens: 65536,
  apiHost: 'open.bigmodel.cn',
  apiPath: '/api/paas/v4/chat/completions'
};

/**
 * Build the analysis prompt for LLM
 * @param {string} transcriptContent - The filtered transcript content
 * @returns {string} The complete prompt
 */
function buildPrompt(transcriptContent) {
  return `你是一个专门从对话中提取可复用技能的分析助手。请**仅根据本次会话记录**，识别并总结用户成功解决问题、优化工作流或实现特定目标的模式，并将其转化为结构化的技能文档。

请以 JSON 格式返回：
[
  {
    "name": "skill名称",
    "description": "简短描述",
    "problem": "问题描述",
    "solution": "解决方案",
    "steps": ["步骤1", "步骤2"],
    "keywords": ["关键词1", "关键词2"]
  }
]
如果没有识别到需要学习的内容，返回空数组 []

会话记录：
${transcriptContent}

`;

}

/**
 * Parse LLM response and extract learning results
 * @param {string} response - The raw LLM response
 * @returns {Object[]|null} Array of learning results or null if parsing fails
 */
function parseResponse(response) {
  if (!response || typeof response !== 'string') {
    return null;
  }

  try {
    // Try direct JSON parse first
    return JSON.parse(response);
  } catch (e) {
    // Try to extract JSON from response
    try {
      // Look for JSON in code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Look for array pattern
      const arrayMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      return null;
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Validate a single learning result
 * @param {Object} result - The learning result to validate
 * @returns {boolean} True if valid
 */
function validateResult(result) {
  if (!result || typeof result !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['name', 'description', 'problem', 'solution', 'steps', 'keywords'];
  for (const field of requiredFields) {
    if (!result[field]) {
      return false;
    }
  }

  // Validate name length (2-50 characters)
  if (typeof result.name !== 'string' || result.name.length < 2 || result.name.length > 50) {
    return false;
  }

  // Validate description length (5-200 characters)
  if (typeof result.description !== 'string' || result.description.length < 5 || result.description.length > 200) {
    return false;
  }

  // Validate steps is array with at least 1 item
  if (!Array.isArray(result.steps) || result.steps.length < 1) {
    return false;
  }

  // Validate keywords is array with at least 1 item
  if (!Array.isArray(result.keywords) || result.keywords.length < 1) {
    return false;
  }

  return true;
}

/**
 * Filter and return only valid results
 * @param {Object[]} results - Array of results to filter
 * @returns {Object[]} Array of valid results
 */
function filterValidResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.filter(validateResult);
}

/**
 * Get API key from environment
 * 支持智谱 AI API Key
 * @returns {string|null} The API key or null if not set
 */
function getApiKey() {
  return process.env.ANTHROPIC_AUTH_TOKEN || null;
}

/**
 * Check if API is available (has key)
 * @returns {boolean} True if API can be called
 */
function isApiAvailable() {
  return !!getApiKey();
}

/**
 * Call LLM API with the transcript content
 * 使用智谱 AI API 格式
 * @param {string} transcriptContent - The filtered transcript content
 * @param {string} [apiKey] - Optional API key (uses env var if not provided)
 * @returns {Promise<Object[]|null>} Promise resolving to learning results or null on error
 */
async function analyze(transcriptContent, apiKey) {
  const key = apiKey || getApiKey();
  if (!key) {
    return null;
  }

  const prompt = buildPrompt(transcriptContent);
  const requestBody = JSON.stringify({
    model: DEFAULT_CONFIG.model,
    max_tokens: DEFAULT_CONFIG.maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: DEFAULT_CONFIG.apiHost,
      path: DEFAULT_CONFIG.apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          // 智谱 AI API 响应格式: response.choices[0].message.content
          if (response.choices && response.choices[0] && response.choices[0].message) {
            const content = response.choices[0].message.content;
            const results = parseResponse(content);
            resolve(filterValidResults(results));
          } else if (response.error) {
            console.error('LLM API error:', response.error);
            resolve(null);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error('Failed to parse LLM response:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('LLM API request failed:', e.message);
      resolve(null);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.error('LLM API request timeout');
      resolve(null);
    });

    req.write(requestBody);
    req.end();
  });
}

module.exports = {
  buildPrompt,
  parseResponse,
  validateResult,
  filterValidResults,
  getApiKey,
  isApiAvailable,
  analyze,
  DEFAULT_CONFIG
};

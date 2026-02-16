#!/usr/bin/env node
/**
 * LLM Analyzer Module
 * Calls LLM API to analyze transcript content and identify learning opportunities
 *
 * Uses Node.js built-in https module for API calls
 * Supports 智谱 AI API (GLM-4)
 *
 * Supports two modes:
 * - Idea mode (auto-learning): Analyze for patterns that need accumulation
 * - Skill mode (manual learning): Directly generate skills
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
 * Idea categories for classification
 */
const IDEA_CATEGORIES = [
  { id: 'user-corrections', name: '用户纠正', desc: '用户后续消息纠正 Claude 的操作' },
  { id: 'error-resolutions', name: '错误修复', desc: '错误后紧跟修复操作' },
  { id: 'repeated-workflows', name: '重复工作流', desc: '相同工具序列多次使用' },
  { id: 'tool-preferences', name: '工具偏好', desc: '一致偏好某些工具' },
  { id: 'file-patterns', name: '文件模式', desc: '文件操作模式' }
];

/**
 * Build the analysis prompt for LLM (Idea-based)
 * @param {string} transcriptContent - The filtered transcript content
 * @returns {string} The complete prompt
 */
function buildPrompt(transcriptContent) {
  const categoryDesc = IDEA_CATEGORIES.map(c => `- ${c.id}: ${c.desc}`).join('\n');

  return `分析以下会话记录，识别出可能具有复用价值的行为模式（Idea）。

Idea 是一种需要多次观察才能确认的模式，只有当同一个模式被观察到多次后，才会被提炼成 Skill。

请识别以下类型的模式：

${categoryDesc}

对于每个识别出的 Idea，请提供：
1. title: Idea 标题（简洁描述这个模式）
2. category: 分类 ID（必须是上述之一）
3. trigger: 触发场景（什么情况下会应用这个模式）
4. pattern: 模式描述（这个模式的具体行为）
5. evidence: 本次会话中的具体证据
6. keywords: 相关关键词（用于后续匹配）

会话记录：
${transcriptContent}

请以 JSON 格式返回，输出格式为：
{
  "ideas": [
    {
      "title": "Idea 标题",
      "category": "category-id",
      "trigger": "触发场景描述",
      "pattern": "模式具体行为",
      "evidence": "本次会话中的具体证据",
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}

如果没有识别到有价值的模式，返回：{"ideas": []}

注意：
- 只识别真正有复用价值的模式，不要过度泛化
- 优先识别用户纠正、错误修复这类高价值模式
- keywords 应该是能帮助未来匹配的关键词`;
}

/**
 * Build the legacy skill-based prompt (for manual learning)
 * @param {string} transcriptContent - The filtered transcript content
 * @returns {string} The complete prompt
 */
function buildSkillPrompt(transcriptContent) {
  return `分析以下会话记录，识别出用户需要多次反复沟通才能最终解决的问题。

对于每个识别出的问题，请提供：
1. 问题描述：简要描述遇到的问题
2. 解决方案：最终有效的解决方法
3. 关键步骤：解决问题的主要步骤
4. 触发关键词：用户可能用什么词触发这个场景

会话记录：
${transcriptContent}

请以 JSON 格式返回识别到的问题列表：
[
  {
    "name": "skill名称（中文）",
    "filename": "english-file-name（kebab-case格式，用于生成文件名）",
    "description": "简短描述",
    "problem": "问题描述",
    "solution": "解决方案",
    "steps": ["步骤1", "步骤2"],
    "keywords": ["关键词1", "关键词2"]
  }
]

如果没有识别到需要学习的内容，返回空数组 []`;
}

/**
 * Parse LLM response and extract learning results
 * @param {string} response - The raw LLM response
 * @param {boolean} isIdeaMode - Whether to parse as ideas format
 * @returns {Object|null} Parsed results or null if parsing fails
 */
function parseResponse(response, isIdeaMode = false) {
  if (!response || typeof response !== 'string') {
    return null;
  }

  try {
    // Try direct JSON parse first
    const parsed = JSON.parse(response);

    if (isIdeaMode) {
      // New format: { ideas: [...] }
      if (parsed && Array.isArray(parsed.ideas)) {
        return { ideas: parsed.ideas };
      }
      // Fallback: if it's an array, wrap it
      if (Array.isArray(parsed)) {
        return { ideas: parsed };
      }
      return null;
    } else {
      // Legacy format: [...]
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    }
  } catch (e) {
    // Try to extract JSON from response
    try {
      // Look for JSON in code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (isIdeaMode) {
          if (parsed && Array.isArray(parsed.ideas)) {
            return { ideas: parsed.ideas };
          }
          if (Array.isArray(parsed)) {
            return { ideas: parsed };
          }
        } else {
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }

      if (isIdeaMode) {
        // Look for object pattern with ideas
        const objectMatch = response.match(/\{\s*"ideas"\s*:\s*\[[\s\S]*\]\s*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]);
          return { ideas: parsed.ideas };
        }
      } else {
        // Look for array pattern
        const arrayMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          return JSON.parse(arrayMatch[0]);
        }
      }

      return null;
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Validate a single learning result (legacy skill format)
 * @param {Object} result - The learning result to validate
 * @returns {boolean} True if valid
 */
function validateResult(result) {
  if (!result || typeof result !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['name', 'filename', 'description', 'problem', 'solution', 'steps', 'keywords'];
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
 * Validate a single idea result
 * @param {Object} idea - The idea result to validate
 * @returns {boolean} True if valid
 */
function validateIdea(idea) {
  if (!idea || typeof idea !== 'object') {
    return false;
  }

  // Check required fields
  if (!idea.title || typeof idea.title !== 'string' || idea.title.length < 2) {
    return false;
  }

  // Validate category
  const validCategories = IDEA_CATEGORIES.map(c => c.id);
  if (idea.category && !validCategories.includes(idea.category)) {
    idea.category = 'file-patterns';  // Default to file-patterns
  }

  // Ensure keywords is array
  if (!idea.keywords || !Array.isArray(idea.keywords)) {
    idea.keywords = [];
  }

  // Ensure evidence exists
  if (!idea.evidence) {
    idea.evidence = '';
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
 * Filter and return only valid ideas
 * @param {Object[]} ideas - Array of ideas to filter
 * @returns {Object[]} Array of valid ideas
 */
function filterValidIdeas(ideas) {
  if (!Array.isArray(ideas)) {
    return [];
  }

  return ideas.filter(validateIdea);
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
 * Analyze transcript and return ideas (for auto-learning)
 * @param {string} transcriptContent - The filtered transcript content
 * @param {string} [apiKey] - Optional API key
 * @param {Object} [logger] - Optional logger instance
 * @returns {Promise<Object|null>} Promise resolving to { ideas: [...] } or null
 */
async function analyzeForIdeas(transcriptContent, apiKey, logger) {
  const key = apiKey || getApiKey();
  if (!key) {
    return null;
  }

  const prompt = buildPrompt(transcriptContent);

  if (logger) {
    logger.log('DEBUG', 'idea_analyze', 'Starting LLM analysis for ideas');
  }

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
          if (response.choices && response.choices[0] && response.choices[0].message) {
            const content = response.choices[0].message.content;
            const parsed = parseResponse(content, true);
            if (parsed && Array.isArray(parsed.ideas)) {
              const validIdeas = filterValidIdeas(parsed.ideas);

              if (logger) {
                logger.log('INFO', 'idea_analyze', 'LLM identified ideas from session', {
                  ideas_count: validIdeas.length,
                  ideas: validIdeas.map(i => ({ title: i.title, category: i.category }))
                });
                console.log(`[Auto-Learning] 本次会话识别到 ${validIdeas.length} 个 Idea`);
              }

              resolve({ ideas: validIdeas });
            } else {
              resolve({ ideas: [] });
            }
          } else if (response.error) {
            console.error('LLM API error:', response.error);
            if (logger) {
              logger.logError('idea_analyze', 'LLM API error', response.error);
            }
            resolve(null);
          } else {
            resolve({ ideas: [] });
          }
        } catch (e) {
          console.error('Failed to parse LLM response:', e.message);
          if (logger) {
            logger.logError('idea_analyze', 'Failed to parse LLM response', e);
          }
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('LLM API request failed:', e.message);
      if (logger) {
        logger.logError('idea_analyze', 'LLM API request failed', e);
      }
      resolve(null);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.error('LLM API request timeout');
      if (logger) {
        logger.logError('idea_analyze', 'LLM API request timeout', new Error('Timeout'));
      }
      resolve(null);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Analyze transcript and return skills directly (for manual learning)
 * @param {string} transcriptContent - The filtered transcript content
 * @param {string} [apiKey] - Optional API key
 * @returns {Promise<Object[]|null>} Promise resolving to skills array or null
 */
async function analyzeForSkills(transcriptContent, apiKey) {
  const key = apiKey || getApiKey();
  if (!key) {
    return null;
  }

  const prompt = buildSkillPrompt(transcriptContent);
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
          if (response.choices && response.choices[0] && response.choices[0].message) {
            const content = response.choices[0].message.content;
            const results = parseResponse(content, false);
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

/**
 * Call LLM API with the transcript content (legacy, kept for compatibility)
 * 使用智谱 AI API 格式
 * @param {string} transcriptContent - The filtered transcript content
 * @param {string} [apiKey] - Optional API key (uses env var if not provided)
 * @returns {Promise<Object[]|null>} Promise resolving to learning results or null on error
 */
async function analyze(transcriptContent, apiKey) {
  // Default to skill mode for backward compatibility
  return analyzeForSkills(transcriptContent, apiKey);
}

module.exports = {
  // Prompt builders
  buildPrompt,
  buildSkillPrompt,

  // Parsing
  parseResponse,
  parseIdeasResponse: (response) => parseResponse(response, true),

  // Validation
  validateResult,
  validateIdea,
  filterValidResults,
  filterValidIdeas,

  // API
  getApiKey,
  isApiAvailable,
  analyze,
  analyzeForIdeas,
  analyzeForSkills,

  // Constants
  IDEA_CATEGORIES,
  DEFAULT_CONFIG
};

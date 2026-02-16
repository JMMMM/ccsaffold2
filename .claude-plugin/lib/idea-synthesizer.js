#!/usr/bin/env node
/**
 * Idea Synthesizer Module
 * Synthesizes skills from accumulated ideas
 *
 * When an idea reaches the threshold (5 instances), this module
 * analyzes all instances and generates a refined skill.
 */

'use strict';

const https = require('https');
const skillGenerator = require('./skill-generator');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  model: 'glm-4.7-flash',
  maxTokens: 65536,
  apiHost: 'open.bigmodel.cn',
  apiPath: '/api/paas/v4/chat/completions'
};

/**
 * Get API key from environment
 * @returns {string|null} The API key or null if not set
 */
function getApiKey() {
  return process.env.ANTHROPIC_AUTH_TOKEN || null;
}

/**
 * Build the synthesis prompt for LLM
 * @param {Object} idea - The idea metadata
 * @param {Object[]} instances - Array of idea instances
 * @returns {string} The complete prompt
 */
function buildSynthesisPrompt(idea, instances) {
  // Extract evidence from all instances
  const evidenceList = instances.map((inst, i) => {
    return `实例 ${i + 1}:\n${inst.evidence || '无具体证据'}`;
  }).join('\n\n');

  return `你是一个知识提炼专家。以下是一个被多次观察到的行为模式（Idea），请分析所有实例并提炼出一个通用的 Skill。

## Idea 基本信息
- 标题: ${idea.title}
- 分类: ${idea.category}
- 触发场景: ${idea.trigger || '未指定'}
- 模式描述: ${idea.pattern || '未指定'}
- 关键词: ${(idea.keywords || []).join(', ')}

## 观察到的实例 (${instances.length} 次)
${evidenceList}

## 任务
请基于以上实例，提炼出一个通用的 Skill。输出格式如下：
{
  "name": "Skill 名称（中文，简洁）",
  "filename": "english-file-name（kebab-case格式）",
  "description": "简短描述（10-50字）",
  "problem": "这个 Skill 解决什么问题",
  "solution": "通用的解决方案",
  "steps": ["步骤1", "步骤2", "步骤3"],
  "keywords": ["关键词1", "关键词2"]
}

## 要求
1. steps 应该是通用且可执行的步骤，不要过于具体到某个实例
2. keywords 应该包含能触发这个 Skill 的关键词
3. 从多个实例中提炼共性，而不是简单合并
4. 如果实例之间有差异，选择最通用的做法`;
}

/**
 * Parse synthesis response from LLM
 * @param {string} response - The raw LLM response
 * @returns {Object|null} Parsed skill result or null
 */
function parseSynthesisResponse(response) {
  if (!response || typeof response !== 'string') {
    return null;
  }

  try {
    // Try direct JSON parse
    const parsed = JSON.parse(response);
    if (parsed && parsed.name && parsed.steps) {
      return parsed;
    }
  } catch (e) {
    // Try to extract JSON
    try {
      // Look for JSON in code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && parsed.name && parsed.steps) {
          return parsed;
        }
      }

      // Look for object pattern
      const objectMatch = response.match(/\{[\s\S]*"name"[\s\S]*\}/);
      if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        if (parsed && parsed.name && parsed.steps) {
          return parsed;
        }
      }
    } catch (e2) {
      // Ignore parse errors
    }
  }

  return null;
}

/**
 * Validate skill result
 * @param {Object} skill - The skill result to validate
 * @returns {boolean} True if valid
 */
function validateSkill(skill) {
  if (!skill || typeof skill !== 'object') {
    return false;
  }

  if (!skill.name || typeof skill.name !== 'string') {
    return false;
  }

  if (!skill.steps || !Array.isArray(skill.steps) || skill.steps.length < 1) {
    return false;
  }

  // Set defaults for optional fields
  if (!skill.filename) {
    skill.filename = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  if (!skill.description) {
    skill.description = skill.name;
  }
  if (!skill.problem) {
    skill.problem = skill.name;
  }
  if (!skill.solution) {
    skill.solution = '按照步骤执行';
  }
  if (!skill.keywords) {
    skill.keywords = [];
  }

  return true;
}

/**
 * Call LLM API to synthesize skill
 * @param {Object} idea - The idea metadata
 * @param {Object[]} instances - Array of idea instances
 * @param {string} [apiKey] - Optional API key
 * @returns {Promise<Object|null>} Promise resolving to skill result or null
 */
async function callLLMForSynthesis(idea, instances, apiKey) {
  const key = apiKey || getApiKey();
  if (!key) {
    return null;
  }

  const prompt = buildSynthesisPrompt(idea, instances);
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
            const skill = parseSynthesisResponse(content);
            if (skill && validateSkill(skill)) {
              resolve(skill);
            } else {
              resolve(null);
            }
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
 * Create a default skill from idea (fallback when LLM fails)
 * @param {Object} idea - The idea metadata
 * @returns {Object} Default skill result
 */
function createDefaultSkill(idea) {
  return {
    name: idea.title,
    filename: idea.id,
    description: `${idea.title} - 从多次会话中提炼`,
    problem: idea.trigger || idea.title,
    solution: idea.pattern || '按照最佳实践执行',
    steps: [
      '识别触发场景',
      '应用已验证的模式',
      '验证结果'
    ],
    keywords: idea.keywords || []
  };
}

/**
 * Synthesize a skill from idea and instances
 * @param {Object} idea - The idea metadata
 * @param {Object[]} instances - Array of idea instances
 * @param {string} cwd - Current working directory
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object|null>} Promise resolving to result object
 */
async function synthesizeSkill(idea, instances, cwd, logger) {
  const startTime = Date.now();

  if (logger) {
    logger.log('INFO', 'skill_synthesize', 'Starting skill synthesis', {
      idea_id: idea.id,
      instances_count: instances.length
    });
  }

  // Try LLM synthesis first
  let skill = await callLLMForSynthesis(idea, instances);

  // Fallback to default skill if LLM fails
  if (!skill) {
    if (logger) {
      logger.log('WARN', 'skill_synthesize', 'LLM synthesis failed, using default');
    }
    skill = createDefaultSkill(idea);
  }

  // Use idea ID as filename if not provided
  if (!skill.filename) {
    skill.filename = idea.id;
  }

  // Write skill file
  const skillPath = skillGenerator.writeSkillFile(cwd, skill);
  const duration = Date.now() - startTime;

  if (skillPath) {
    if (logger) {
      logger.logStep('skill_synthesize', 'Synthesizing skill from idea instances', {
        idea_id: idea.id,
        instances_analyzed: instances.length,
        skill_name: skill.name,
        skill_path: skillPath
      }, startTime);
      console.log(`[Auto-Learning] ★ 生成 Skill: ${skill.filename}.md (耗时 ${duration}ms)`);
    }

    return {
      success: true,
      skillPath,
      skill,
      duration
    };
  } else {
    if (logger) {
      logger.logError('skill_synthesize', 'Failed to write skill file', new Error('Write failed'));
    }
    return null;
  }
}

/**
 * Synthesize skills from all ready ideas
 * @param {string} cwd - Current working directory
 * @param {Object} ideaManager - Idea manager module
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Promise resolving to synthesis results
 */
async function synthesizeAllReady(cwd, ideaManager, logger) {
  const readyIdeas = ideaManager.getReadyIdeas(cwd);
  const results = {
    total: readyIdeas.length,
    synthesized: 0,
    failed: 0,
    skills: []
  };

  for (const idea of readyIdeas) {
    const instances = ideaManager.loadIdeaInstances(cwd, idea.id);

    if (instances.length < ideaManager.IDEA_CONFIG.skillThreshold) {
      continue;
    }

    const result = await synthesizeSkill(idea, instances, cwd, logger);

    if (result && result.success) {
      results.synthesized++;
      results.skills.push({
        ideaId: idea.id,
        skillPath: result.skillPath
      });

      // Remove idea after successful synthesis
      ideaManager.removeIdea(cwd, idea.id, logger);
    } else {
      results.failed++;
    }
  }

  return results;
}

module.exports = {
  buildSynthesisPrompt,
  parseSynthesisResponse,
  validateSkill,
  callLLMForSynthesis,
  createDefaultSkill,
  synthesizeSkill,
  synthesizeAllReady,
  getApiKey,
  DEFAULT_CONFIG
};

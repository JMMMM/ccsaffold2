#!/usr/bin/env node
/**
 * Idea Manager Module
 * Manages idea accumulation and skill synthesis
 *
 * Ideas are accumulated across sessions and synthesized into skills
 * when they reach a threshold (default: 5 occurrences)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const skillGenerator = require('./skill-generator.js');

/**
 * Default configuration
 */
const IDEA_CONFIG = {
  skillThreshold: 5,           // 累计次数阈值
  similarityThreshold: 0.65,   // Idea 相似度阈值
  maxIdeas: 100                // 最大 Idea 数量
};

/**
 * Valid idea categories
 */
const IDEA_CATEGORIES = [
  'user-corrections',      // 用户后续消息纠正 Claude 的操作
  'error-resolutions',     // 错误后紧跟修复操作
  'repeated-workflows',    // 相同工具序列多次使用
  'tool-preferences',      // 一致偏好某些工具
  'file-patterns'          // 文件操作模式
];

/**
 * Get the ideas directory path
 * @param {string} cwd - Current working directory
 * @returns {string} Path to ideas directory
 */
function getIdeasDir(cwd) {
  return path.join(cwd, '.claude', 'ideas');
}

/**
 * Get the ideas index file path
 * @param {string} cwd - Current working directory
 * @returns {string} Path to ideas.json
 */
function getIdeasIndexPath(cwd) {
  return path.join(getIdeasDir(cwd), 'ideas.json');
}

/**
 * Load ideas index from file
 * @param {string} cwd - Current working directory
 * @returns {Object} Ideas index object
 */
function loadIdeasIndex(cwd) {
  const indexPath = getIdeasIndexPath(cwd);

  try {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      const index = JSON.parse(content);
      // Ensure version and ideas array exist
      if (!index.version) {
        index.version = '1.0';
      }
      if (!Array.isArray(index.ideas)) {
        index.ideas = [];
      }
      return index;
    }
  } catch (e) {
    console.error('[Idea-Manager] ERROR: Failed to load ideas index:', e.message);
  }

  // Return default index
  return {
    version: '1.0',
    ideas: []
  };
}

/**
 * Save ideas index to file
 * @param {string} cwd - Current working directory
 * @param {Object} index - Ideas index object
 */
function saveIdeasIndex(cwd, index) {
  const ideasDir = getIdeasDir(cwd);
  const indexPath = getIdeasIndexPath(cwd);

  try {
    // Ensure directory exists
    if (!fs.existsSync(ideasDir)) {
      fs.mkdirSync(ideasDir, { recursive: true });
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  } catch (e) {
    console.error('[Idea-Manager] ERROR: Failed to save ideas index:', e.message);
  }
}

/**
 * Generate a unique idea ID from title
 * @param {string} title - Idea title
 * @returns {string} Unique ID (kebab-case)
 */
function generateIdeaId(title) {
  if (!title || typeof title !== 'string') {
    return 'idea-' + Date.now();
  }

  // Convert to kebab-case
  let id = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Limit length
  if (id.length > 50) {
    id = id.substring(0, 50);
  }

  // Ensure not empty
  if (!id) {
    id = 'idea-' + Date.now();
  }

  return id;
}

/**
 * Check if two ideas are the same using similarity matching
 * @param {Object} existing - Existing idea from index
 * @param {Object} newIdea - New idea to check
 * @param {number} [threshold] - Similarity threshold (default: 0.65)
 * @returns {boolean} True if ideas are considered the same
 */
function isSameIdea(existing, newIdea, threshold) {
  const t = threshold !== undefined ? threshold : IDEA_CONFIG.similarityThreshold;

  // Check title similarity
  const titleSimilarity = skillGenerator.calculateSimilarity(
    existing.title || '',
    newIdea.title || ''
  );
  if (titleSimilarity >= t) {
    return true;
  }

  // Check keyword overlap
  if (existing.keywords && newIdea.keywords) {
    const keywords1 = new Set(existing.keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(newIdea.keywords.map(k => k.toLowerCase()));

    let overlap = 0;
    for (const kw of keywords1) {
      if (keywords2.has(kw)) {
        overlap++;
      }
    }

    const keywordSimilarity = overlap / Math.max(keywords1.size, keywords2.size);
    if (keywordSimilarity >= 0.5) {
      return true;
    }
  }

  // Check trigger overlap
  if (existing.trigger && newIdea.trigger) {
    const triggerSimilarity = skillGenerator.calculateSimilarity(
      existing.trigger,
      newIdea.trigger
    );
    if (triggerSimilarity >= t) {
      return true;
    }
  }

  return false;
}

/**
 * Find matching existing idea
 * @param {Object[]} ideas - Array of existing ideas
 * @param {Object} newIdea - New idea to match
 * @param {number} [threshold] - Similarity threshold
 * @returns {Object|null} Matching idea or null
 */
function findMatchingIdea(ideas, newIdea, threshold) {
  for (const idea of ideas) {
    if (isSameIdea(idea, newIdea, threshold)) {
      return idea;
    }
  }
  return null;
}

/**
 * Get idea directory path
 * @param {string} cwd - Current working directory
 * @param {string} ideaId - Idea ID
 * @returns {string} Path to idea directory
 */
function getIdeaDir(cwd, ideaId) {
  return path.join(getIdeasDir(cwd), ideaId);
}

/**
 * Get idea instances directory path
 * @param {string} cwd - Current working directory
 * @param {string} ideaId - Idea ID
 * @returns {string} Path to instances directory
 */
function getInstancesDir(cwd, ideaId) {
  return path.join(getIdeaDir(cwd, ideaId), 'instances');
}

/**
 * Save idea instance to file
 * @param {string} cwd - Current working directory
 * @param {string} ideaId - Idea ID
 * @param {string} sessionId - Session ID
 * @param {Object} evidence - Evidence data
 */
function saveIdeaInstance(cwd, ideaId, sessionId, evidence) {
  const instancesDir = getInstancesDir(cwd, ideaId);

  try {
    // Ensure directory exists
    if (!fs.existsSync(instancesDir)) {
      fs.mkdirSync(instancesDir, { recursive: true });
    }

    // Create instance file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const instanceFile = path.join(instancesDir, `${timestamp}.json`);
    const instanceData = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      evidence: evidence
    };

    fs.writeFileSync(instanceFile, JSON.stringify(instanceData, null, 2), 'utf8');
  } catch (e) {
    console.error('[Idea-Manager] ERROR: Failed to save idea instance:', e.message);
  }
}

/**
 * Load all instances for an idea
 * @param {string} cwd - Current working directory
 * @param {string} ideaId - Idea ID
 * @returns {Object[]} Array of instance objects
 */
function loadIdeaInstances(cwd, ideaId) {
  const instancesDir = getInstancesDir(cwd, ideaId);
  const instances = [];

  try {
    if (!fs.existsSync(instancesDir)) {
      return instances;
    }

    const files = fs.readdirSync(instancesDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(instancesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const instance = JSON.parse(content);
      instances.push(instance);
    }

    // Sort by timestamp
    instances.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (e) {
    console.error('[Idea-Manager] ERROR: Failed to load idea instances:', e.message);
  }

  return instances;
}

/**
 * Check if idea has reached threshold
 * @param {Object} idea - Idea object from index
 * @param {number} [threshold] - Threshold value (default: 5)
 * @returns {boolean} True if threshold reached
 */
function checkThreshold(idea, threshold) {
  const t = threshold !== undefined ? threshold : IDEA_CONFIG.skillThreshold;
  return idea.count >= t;
}

/**
 * Add or update an idea in the index
 * @param {string} cwd - Current working directory
 * @param {Object} newIdea - New idea from LLM analysis
 * @param {string} sessionId - Session ID
 * @param {Object} evidence - Evidence data
 * @param {Object} logger - Logger instance
 * @returns {Object} Result object with idea and threshold status
 */
function addOrUpdateIdea(cwd, newIdea, sessionId, evidence, logger) {
  const index = loadIdeasIndex(cwd);
  const now = new Date().toISOString();

  // Try to find matching existing idea
  const matchedIdea = findMatchingIdea(index.ideas, newIdea);

  let idea;
  let isNew = false;
  let reachedThreshold = false;

  if (matchedIdea) {
    // Log match
    const similarity = calculateIdeaSimilarity(matchedIdea, newIdea);
    if (logger) {
      logger.log('DEBUG', 'idea_match', 'Matching idea against existing ones', {
        new_idea_title: newIdea.title,
        matched_existing: true,
        matched_id: matchedIdea.id,
        similarity_score: similarity
      });
      console.log(`[Auto-Learning] 匹配到现有 Idea: ${matchedIdea.id} (相似度: ${Math.round(similarity * 100)}%)`);
    }

    // Accumulate existing idea
    matchedIdea.count += 1;
    matchedIdea.last_seen = now;

    // Merge keywords
    if (newIdea.keywords && Array.isArray(newIdea.keywords)) {
      const existingKeywords = new Set(matchedIdea.keywords || []);
      for (const kw of newIdea.keywords) {
        existingKeywords.add(kw);
      }
      matchedIdea.keywords = Array.from(existingKeywords);
    }

    idea = matchedIdea;

    // Log accumulation
    if (logger) {
      logger.log('INFO', 'idea_accumulate', 'Accumulated existing idea', {
        id: idea.id,
        title: idea.title,
        count: idea.count,
        threshold: IDEA_CONFIG.skillThreshold,
        remaining: Math.max(0, IDEA_CONFIG.skillThreshold - idea.count)
      });
      console.log(`[Auto-Learning] Idea 累计: ${idea.id} (${idea.count}/${IDEA_CONFIG.skillThreshold}, 还需 ${Math.max(0, IDEA_CONFIG.skillThreshold - idea.count)} 次)`);
    }

    // Check threshold
    if (checkThreshold(idea)) {
      reachedThreshold = true;
      if (logger) {
        logger.log('INFO', 'idea_threshold', 'Threshold reached, ready for skill synthesis', {
          id: idea.id,
          count: idea.count,
          threshold: IDEA_CONFIG.skillThreshold,
          instances_count: idea.count,
          ready: true
        });
        console.log(`[Auto-Learning] ★ Idea 达到阈值: ${idea.id} (${idea.count}/${IDEA_CONFIG.skillThreshold}), 准备提炼 Skill`);
      }
    }
  } else {
    // Create new idea
    isNew = true;
    const ideaId = generateIdeaId(newIdea.title);

    idea = {
      id: ideaId,
      title: newIdea.title,
      category: newIdea.category || 'file-patterns',
      count: 1,
      first_seen: now,
      last_seen: now,
      trigger: newIdea.trigger || '',
      pattern: newIdea.pattern || '',
      keywords: newIdea.keywords || []
    };

    // Add to index
    index.ideas.push(idea);

    // Log creation
    if (logger) {
      logger.log('INFO', 'idea_create', 'Created new idea', {
        id: idea.id,
        title: idea.title,
        category: idea.category,
        initial_count: 1
      });
      console.log(`[Auto-Learning] 创建新 Idea: ${idea.id} [${idea.category}]`);
    }
  }

  // Save instance
  saveIdeaInstance(cwd, idea.id, sessionId, evidence);

  // Save index
  saveIdeasIndex(cwd, index);

  return {
    idea: idea,
    isNew: isNew,
    reachedThreshold: reachedThreshold
  };
}

/**
 * Calculate similarity score between two ideas
 * @param {Object} idea1 - First idea
 * @param {Object} idea2 - Second idea
 * @returns {number} Similarity score (0-1)
 */
function calculateIdeaSimilarity(idea1, idea2) {
  const titleSim = skillGenerator.calculateSimilarity(
    idea1.title || '',
    idea2.title || ''
  );

  const triggerSim = skillGenerator.calculateSimilarity(
    idea1.trigger || '',
    idea2.trigger || ''
  );

  // Weighted average
  return titleSim * 0.7 + triggerSim * 0.3;
}

/**
 * Get ideas ready for skill synthesis
 * @param {string} cwd - Current working directory
 * @returns {Object[]} Array of ideas that have reached threshold
 */
function getReadyIdeas(cwd) {
  const index = loadIdeasIndex(cwd);
  return index.ideas.filter(idea => checkThreshold(idea));
}

/**
 * Remove idea from index after skill synthesis
 * @param {string} cwd - Current working directory
 * @param {string} ideaId - Idea ID to remove
 */
function removeIdea(cwd, ideaId) {
  const index = loadIdeasIndex(cwd);
  index.ideas = index.ideas.filter(idea => idea.id !== ideaId);
  saveIdeasIndex(cwd, index);
}

/**
 * Get idea status summary
 * @param {string} cwd - Current working directory
 * @returns {Object} Status summary
 */
function getIdeaStatus(cwd) {
  const index = loadIdeasIndex(cwd);

  let readyForSkill = 0;
  for (const idea of index.ideas) {
    if (checkThreshold(idea)) {
      readyForSkill++;
    }
  }

  return {
    total: index.ideas.length,
    readyForSkill: readyForSkill
  };
}

module.exports = {
  IDEA_CONFIG,
  IDEA_CATEGORIES,
  loadIdeasIndex,
  saveIdeasIndex,
  isSameIdea,
  findMatchingIdea,
  addOrUpdateIdea,
  checkThreshold,
  loadIdeaInstances,
  getReadyIdeas,
  removeIdea,
  getIdeaStatus,
  generateIdeaId,
  getIdeasDir,
  getIdeaDir,
  getInstancesDir
};

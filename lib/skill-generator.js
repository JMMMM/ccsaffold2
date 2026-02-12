#!/usr/bin/env node
/**
 * Skill Generator Module
 * Generates skill files from learning results following the template format
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Generate YAML frontmatter for skill file
 * @param {Object} result - The learning result
 * @returns {string} YAML frontmatter string
 */
function generateFrontmatter(result) {
  return `---
name: ${escapeYaml(result.name)}
description: ${escapeYaml(result.description)}
---`;
}

/**
 * Escape special characters for YAML
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeYaml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  // If string contains special characters, wrap in quotes
  if (str.includes(':') || str.includes('#') || str.includes('"') || str.includes("'")) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

/**
 * Generate Purpose section content
 * @param {Object} result - The learning result
 * @returns {string} Purpose section content
 */
function generatePurpose(result) {
  const purpose = `当用户遇到 ${result.problem} 时，${result.solution}。`;
  return `## Purpose
${purpose}`;
}

/**
 * Generate Trigger Conditions section content
 * @param {string[]} keywords - Array of trigger keywords
 * @returns {string} Trigger Conditions section content
 */
function generateTriggerConditions(keywords) {
  const keywordList = keywords.map(k => `- ${k}`).join('\n');
  return `## Trigger Conditions
当用户提到以下关键词时会触发此技能：
${keywordList}`;
}

/**
 * Generate Instructions section content
 * @param {string[]} steps - Array of instruction steps
 * @returns {string} Instructions section content
 */
function generateInstructions(steps) {
  const stepList = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `## Instructions
${stepList}`;
}

/**
 * Generate Examples section content
 * @param {Object} result - The learning result
 * @returns {string} Examples section content
 */
function generateExamples(result) {
  // Generate example based on the problem/solution
  const exampleUser = result.keywords[0] || '相关问题';
  return `## Examples
示例1：用户说 "${exampleUser}" -> AI 引导用户按步骤排查问题
示例2：用户描述 "${result.problem}" -> AI 提供 ${result.solution}`;
}

/**
 * Generate complete skill file content
 * @param {Object} result - The learning result
 * @returns {string} Complete skill file content
 */
function generateSkillContent(result) {
  const sections = [
    generateFrontmatter(result),
    '',
    `# Skill: ${result.name}`,
    '',
    generatePurpose(result),
    '',
    generateTriggerConditions(result.keywords),
    '',
    generateInstructions(result.steps),
    '',
    generateExamples(result)
  ];

  return sections.join('\n');
}

/**
 * Generate a safe file name from skill name
 * Converts to kebab-case, removes special characters
 * @param {string} skillName - The skill name
 * @returns {string} Safe file name with .md extension
 */
function generateFileName(skillName) {
  if (!skillName || typeof skillName !== 'string') {
    return 'unnamed-skill.md';
  }

  // Simple transliteration for common Chinese characters
  const pinyinMap = {
    '调': 'diao', '试': 'shi', '配': 'pei', '置': 'zhi',
    '错': 'cuo', '误': 'wu', '问': 'wen', '题': 'ti',
    '解': 'jie', '决': 'jue', '方': 'fang', '法': 'fa',
    '分': 'fen', '析': 'xi', '处': 'chu', '理': 'li',
    '修': 'xiu', '复': 'fu', '安': 'an', '全': 'quan',
    '优': 'you', '化': 'hua', '管': 'guan', '支': 'zhi',
    '持': 'chi', '开': 'kai', '发': 'fa', '部': 'bu',
    '署': 'shu', '测': 'ce', '试': 'shi', '代': 'dai',
    '码': 'ma', '数': 'shu', '据': 'ju', '接': 'jie',
    '口': 'kou', '件': 'jian', '组': 'zu', '冲': 'chong',
    '突': 'tu', '并': 'bing', '合': 'he', '删': 'shan',
    '除': 'chu', '更': 'geng', '新': 'xin', '创': 'chuang',
    '建': 'jian', '搜': 'sou', '索': 'suo', '过': 'guo',
    '滤': 'lv', '验': 'yan', '证': 'zheng', '权': 'quan',
    '限': 'xian', '登': 'deng', '录': 'lu', '注': 'zhu',
    '册': 'ce', '用': 'yong', '户': 'hu', '设': 'she',
    '定': 'ding', '义': 'yi', '自': 'zi', '动': 'dong',
    '手': 'shou', '帮': 'bang', '助': 'zhu', '指': 'zhi',
    '南': 'nan', '文': 'wen', '档': 'dang', '案': 'an',
    '例': 'li', '事': 'shi', '项': 'xiang', '注': 'zhu',
    '意': 'yi', '警': 'jing', '告': 'gao', '提': 'ti',
    '示': 'shi', '信': 'xin', '息': 'xi', '内': 'nei',
    '容': 'rong', '外': 'wai', '上': 'shang', '下': 'xia',
    '左': 'zuo', '右': 'you', '中': 'zhong', '前': 'qian',
    '后': 'hou', '大': 'da', '小': 'xiao', '长': 'chang',
    '短': 'duan', '高': 'gao', '低': 'di', '快': 'kuai',
    '慢': 'man', '好': 'hao', '坏': 'huai', '旧': 'jiu',
    '新': 'xin', '主': 'zhu', '次': 'ci', '要': 'yao',
    '重': 'zhong', '轻': 'qing', '多': 'duo', '少': 'shao',
    '始': 'shi', '终': 'zhong', '初': 'chu', '最': 'zui'
  };

  let converted = skillName;

  // Replace Chinese characters with pinyin
  for (const [char, pinyin] of Object.entries(pinyinMap)) {
    converted = converted.split(char).join(pinyin);
  }

  // Convert to lowercase
  converted = converted.toLowerCase();

  // Replace spaces and special characters with hyphens
  converted = converted.replace(/[^a-z0-9]+/g, '-');

  // Remove leading/trailing hyphens
  converted = converted.replace(/^-+|-+$/g, '');

  // Limit length
  if (converted.length > 50) {
    converted = converted.substring(0, 50);
    // Trim at last hyphen to avoid partial words
    const lastHyphen = converted.lastIndexOf('-');
    if (lastHyphen > 20) {
      converted = converted.substring(0, lastHyphen);
    }
  }

  // Ensure not empty
  if (!converted) {
    converted = 'skill';
  }

  return `${converted}.md`;
}

/**
 * Get the skill directory path
 * @param {string} cwd - Current working directory (project root)
 * @param {string} skillName - The skill name for directory naming
 * @returns {string} Path to skills/{skill-name} directory
 */
function getSkillDirectory(cwd, skillName) {
  const safeName = generateSafeDirName(skillName);
  return path.join(cwd, 'skills', safeName);
}

/**
 * Generate a safe directory name from skill name
 * Converts to kebab-case, removes special characters
 * @param {string} skillName - The skill name
 * @returns {string} Safe directory name
 */
function generateSafeDirName(skillName) {
  if (!skillName || typeof skillName !== 'string') {
    return 'unnamed-skill';
  }
  return generateFileName(skillName).replace(/\.md$/, '');
}

/**
 * Get the full path for a skill file
 * @param {string} cwd - Current working directory
 * @param {string} skillName - The skill name
 * @returns {string} Full path to the skill file (skills/{name}/SKILL.md)
 */
function getSkillPath(cwd, skillName) {
  const skillDir = getSkillDirectory(cwd, skillName);
  return path.join(skillDir, 'SKILL.md');
}

/**
 * Validate skill content format
 * @param {string} content - The skill file content
 * @returns {boolean} True if valid format
 */
function validateSkillContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check for frontmatter
  if (!content.startsWith('---')) {
    return false;
  }

  // Check for required sections
  const requiredSections = [
    '## Purpose',
    '## Trigger Conditions',
    '## Instructions',
    '## Examples'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      return false;
    }
  }

  return true;
}

/**
 * Write skill file to disk
 * @param {string} cwd - Current working directory
 * @param {Object} result - The learning result
 * @returns {string|null} Path to written file or null on error
 */
function writeSkillFile(cwd, result) {
  try {
    const skillDir = getSkillDirectory(cwd, result.name);
    const skillPath = getSkillPath(cwd, result.name);
    const content = generateSkillContent(result);

    // Ensure directory exists
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    fs.writeFileSync(skillPath, content, 'utf8');
    return skillPath;
  } catch (e) {
    console.error('Failed to write skill file:', e.message);
    return null;
  }
}

// ============================================================
// Skill Deduplication Functions
// ============================================================

/**
 * Calculate similarity between two strings using Jaccard similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) {
    return 0;
  }

  // Normalize strings
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) {
    return 1;
  }

  // Split into character bigrams
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  if (bigrams1.size === 0 && bigrams2.size === 0) {
    return 1;
  }

  if (bigrams1.size === 0 || bigrams2.size === 0) {
    return 0;
  }

  // Calculate Jaccard similarity
  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  }

  const union = bigrams1.size + bigrams2.size - intersection;
  return intersection / union;
}

/**
 * Determine if two skills should be merged
 * @param {Object} skill1 - First skill result
 * @param {Object} skill2 - Second skill result
 * @param {number} [threshold=0.6] - Similarity threshold
 * @returns {boolean} True if skills should be merged
 */
function shouldMergeSkills(skill1, skill2, threshold = 0.6) {
  // Check name similarity
  const nameSimilarity = calculateSimilarity(skill1.name, skill2.name);
  if (nameSimilarity >= threshold) {
    return true;
  }

  // Check keyword overlap
  if (skill1.keywords && skill2.keywords) {
    const keywords1 = new Set(skill1.keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(skill2.keywords.map(k => k.toLowerCase()));

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

  return false;
}

/**
 * Merge two skill results
 * @param {Object} existing - Existing skill result
 * @param {Object} newResult - New skill result
 * @returns {Object} Merged skill result
 */
function mergeSkillResults(existing, newResult) {
  // Merge steps (keep unique steps)
  const mergedSteps = [...existing.steps];
  for (const step of newResult.steps) {
    const isDuplicate = mergedSteps.some(
      s => calculateSimilarity(s, step) > 0.8
    );
    if (!isDuplicate) {
      mergedSteps.push(step);
    }
  }

  // Merge keywords (keep unique keywords)
  const mergedKeywords = [...new Set([...existing.keywords, ...newResult.keywords])];

  // Use the more detailed description
  const mergedDescription = newResult.description.length > existing.description.length
    ? newResult.description
    : existing.description;

  // Use the more detailed problem/solution
  const mergedProblem = newResult.problem.length > existing.problem.length
    ? newResult.problem
    : existing.problem;
  const mergedSolution = newResult.solution.length > existing.solution.length
    ? newResult.solution
    : existing.solution;

  return {
    name: existing.name,
    description: mergedDescription,
    problem: mergedProblem,
    solution: mergedSolution,
    steps: mergedSteps,
    keywords: mergedKeywords
  };
}

/**
 * Load existing skills from directory
 * @param {string} cwd - Current working directory
 * @returns {Object[]} Array of existing skill results
 */
function loadExistingSkills(cwd) {
  const skillsBaseDir = path.join(cwd, 'skills');
  const skills = [];

  try {
    if (!fs.existsSync(skillsBaseDir)) {
      return skills;
    }

    // Read all subdirectories in skills/
    const subdirs = fs.readdirSync(skillsBaseDir, { withFileTypes: true });

    for (const dirent of subdirs) {
      if (!dirent.isDirectory()) continue;

      const skillFilePath = path.join(skillsBaseDir, dirent.name, 'SKILL.md');
      if (!fs.existsSync(skillFilePath)) continue;

      const content = fs.readFileSync(skillFilePath, 'utf8');

      // Parse skill content
      const skill = parseSkillContent(content);
      if (skill) {
        skills.push(skill);
      }
    }
  } catch (e) {
    console.error('Failed to load existing skills:', e.message);
  }

  return skills;
}

/**
 * Parse skill content to extract result structure
 * @param {string} content - Skill file content
 * @returns {Object|null} Parsed skill result or null
 */
function parseSkillContent(content) {
  try {
    // Extract frontmatter
    const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);

    if (!nameMatch) {
      return null;
    }

    // Extract sections
    const purposeMatch = content.match(/## Purpose\n([\s\S]*?)(?=\n##)/);
    const triggerMatch = content.match(/## Trigger Conditions\n当用户提到以下关键词时会触发此技能：\n([\s\S]*?)(?=\n##)/);
    const instructionsMatch = content.match(/## Instructions\n([\s\S]*?)(?=\n##)/);

    // Extract keywords
    const keywords = [];
    if (triggerMatch) {
      const keywordLines = triggerMatch[1].trim().split('\n');
      for (const line of keywordLines) {
        const kw = line.replace(/^-\s*/, '').trim();
        if (kw) {
          keywords.push(kw);
        }
      }
    }

    // Extract steps
    const steps = [];
    if (instructionsMatch) {
      const stepLines = instructionsMatch[1].trim().split('\n');
      for (const line of stepLines) {
        const step = line.replace(/^\d+\.\s*/, '').trim();
        if (step) {
          steps.push(step);
        }
      }
    }

    return {
      name: nameMatch[1].trim(),
      description: descMatch ? descMatch[1].trim() : '',
      problem: '',
      solution: '',
      steps: steps,
      keywords: keywords
    };
  } catch (e) {
    return null;
  }
}

/**
 * Find similar existing skill
 * @param {Object[]} existingSkills - Array of existing skills
 * @param {Object} newResult - New skill result to check
 * @param {number} [threshold=0.6] - Similarity threshold
 * @returns {Object|null} Similar skill or null if not found
 */
function findSimilarSkill(existingSkills, newResult, threshold = 0.6) {
  for (const skill of existingSkills) {
    if (shouldMergeSkills(skill, newResult, threshold)) {
      return skill;
    }
  }
  return null;
}

/**
 * Update existing skill file
 * @param {string} cwd - Current working directory
 * @param {Object} result - The updated learning result
 * @returns {string|null} Path to written file or null on error
 */
function updateSkillFile(cwd, result) {
  return writeSkillFile(cwd, result);
}

/**
 * Write skill file with deduplication logic
 * @param {string} cwd - Current working directory
 * @param {Object} result - The learning result
 * @param {boolean} [enableDedup=true] - Enable deduplication
 * @returns {Object} Object with path and action (created/updated)
 */
function writeSkillFileWithDedup(cwd, result, enableDedup = true) {
  if (enableDedup) {
    const existingSkills = loadExistingSkills(cwd);
    const similarSkill = findSimilarSkill(existingSkills, result);

    if (similarSkill) {
      // Merge with existing skill
      const merged = mergeSkillResults(similarSkill, result);
      const skillPath = writeSkillFile(cwd, merged);
      return { path: skillPath, action: 'updated', merged: true };
    }
  }

  // Create new skill
  const skillPath = writeSkillFile(cwd, result);
  return { path: skillPath, action: 'created', merged: false };
}

module.exports = {
  generateFrontmatter,
  generatePurpose,
  generateTriggerConditions,
  generateInstructions,
  generateExamples,
  generateSkillContent,
  generateFileName,
  generateSafeDirName,
  getSkillDirectory,
  getSkillPath,
  validateSkillContent,
  writeSkillFile,
  // Deduplication functions
  calculateSimilarity,
  shouldMergeSkills,
  mergeSkillResults,
  loadExistingSkills,
  parseSkillContent,
  findSimilarSkill,
  updateSkillFile,
  writeSkillFileWithDedup
};

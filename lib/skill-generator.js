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
 * Generate a safe file name from filename field
 * Sanitizes the LLM-provided filename to ensure it's safe for filesystem
 * @param {string} filename - The filename from LLM (kebab-case format)
 * @returns {string} Safe file name with .md extension
 */
function generateFileName(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed-skill.md';
  }

  // Sanitize: only allow lowercase letters, numbers, and hyphens
  let sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
    const lastHyphen = sanitized.lastIndexOf('-');
    if (lastHyphen > 20) {
      sanitized = sanitized.substring(0, lastHyphen);
    }
  }

  // Ensure not empty
  if (!sanitized) {
    sanitized = 'skill';
  }

  return `${sanitized}.md`;
}

/**
 * Get the skill directory path
 * @param {string} cwd - Current working directory (project root)
 * @returns {string} Path to .skills/learn directory
 */
function getSkillDirectory(cwd) {
  return path.join(cwd, '.skills', 'learn');
}

/**
 * Get the full path for a skill file
 * @param {string} cwd - Current working directory
 * @param {Object} result - The learning result (must have filename field)
 * @returns {string} Full path to the skill file
 */
function getSkillPath(cwd, result) {
  const skillDir = getSkillDirectory(cwd);
  const fileName = generateFileName(result.filename || result.name);
  return path.join(skillDir, fileName);
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
    const skillDir = getSkillDirectory(cwd);
    const skillPath = getSkillPath(cwd, result);
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
    filename: existing.filename || newResult.filename,
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
  const skillDir = getSkillDirectory(cwd);
  const skills = [];

  try {
    if (!fs.existsSync(skillDir)) {
      return skills;
    }

    const files = fs.readdirSync(skillDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(skillDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Parse skill content, pass filename (without .md)
      const filename = file.replace(/\.md$/, '');
      const skill = parseSkillContent(content, filename);
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
 * @param {string} [filename] - Optional filename (without .md) for existing skills
 * @returns {Object|null} Parsed skill result or null
 */
function parseSkillContent(content, filename) {
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
      filename: filename || nameMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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

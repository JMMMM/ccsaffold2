/**
 * Cache Matcher for Web Cache Hooks
 *
 * 负责匹配请求 URL 与现有缓存
 * 支持同一域名下的多个页面（使用 URL 路径作为键）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const urlUtils = require('./url-utils');

// 刷新关键词列表
const REFRESH_KEYWORDS = [
  '重新', '刷新', '跳过缓存', '强制刷新',
  'force refresh', 'reload', 'refresh', 'skip cache', 'bypass cache'
];

/**
 * 检查用户输入是否包含刷新关键词
 * @param {string} input - 用户输入文本
 * @returns {boolean} 是否需要刷新缓存
 */
function shouldRefreshCache(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const lowerInput = input.toLowerCase();
  return REFRESH_KEYWORDS.some(keyword =>
    lowerInput.includes(keyword.toLowerCase())
  );
}

/**
 * 从 URL 生成唯一的缓存键
 * 同一域名下不同路径生成不同的键
 * @param {string} urlStr - 请求的 URL
 * @returns {string|null} 缓存键（格式：domain/path-hash）
 */
function generateCacheKey(urlStr) {
  const domain = urlUtils.extractDomain(urlStr);
  if (!domain) {
    return null;
  }

  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
    const urlPath = url.pathname;

    // 如果只是根路径，只用域名
    if (urlPath === '/' || urlPath === '') {
      return domain;
    }

    // 生成路径的短哈希，避免文件名过长
    const pathHash = crypto.createHash('md5').update(urlPath).digest('hex').substring(0, 8);
    // 将路径转换为安全的文件名片段
    const pathSlug = urlPath
      .replace(/^\//, '')
      .replace(/\/$/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    return `${domain}/${pathSlug}-${pathHash}`;
  } catch (error) {
    return domain;
  }
}

/**
 * 查找缓存 skill 文件
 * 支持精确匹配（URL 路径）和域名匹配
 * @param {string} urlStr - 请求的 URL
 * @param {string} skillsDir - skills/learn 目录路径
 * @returns {object|null} 缓存信息或 null
 */
function findCacheSkill(urlStr, skillsDir) {
  const cacheKey = generateCacheKey(urlStr);
  if (!cacheKey) {
    return null;
  }

  // 首先尝试精确匹配（包含路径）
  const exactPath = path.join(skillsDir, cacheKey, 'SKILL.md');
  if (fs.existsSync(exactPath)) {
    return loadCacheSkill(exactPath, cacheKey);
  }

  // 回退到域名匹配
  const domain = urlUtils.extractDomain(urlStr);
  const domainPath = path.join(skillsDir, domain, 'SKILL.md');
  if (fs.existsSync(domainPath)) {
    return loadCacheSkill(domainPath, domain);
  }

  return null;
}

/**
 * 加载缓存 skill 文件
 */
function loadCacheSkill(skillPath, cacheKey) {
  try {
    const content = fs.readFileSync(skillPath, 'utf8');
    const stats = fs.statSync(skillPath);
    const metadata = parseFrontmatter(content);

    return {
      domain: cacheKey,
      path: skillPath,
      content,
      metadata,
      cachedAt: stats.mtime
    };
  } catch (error) {
    return null;
  }
}

/**
 * 解析 YAML frontmatter
 * @param {string} content - SKILL.md 文件内容
 * @returns {object} 解析出的元数据
 */
function parseFrontmatter(content) {
  const metadata = {
    name: '',
    description: '',
    source_url: '',
    cached_at: ''
  };

  if (!content || !content.startsWith('---')) {
    return metadata;
  }

  try {
    // 找到 frontmatter 结束位置
    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) {
      return metadata;
    }

    const frontmatter = content.substring(3, endIndex).trim();
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (key in metadata) {
        metadata[key] = value;
      }
    }
  } catch (error) {
    // 解析失败，返回空元数据
  }

  return metadata;
}

/**
 * 提取 skill 内容（不含 frontmatter）
 * @param {string} content - SKILL.md 完整内容
 * @returns {string} 纯内容部分
 */
function extractSkillContent(content) {
  if (!content) {
    return '';
  }

  // 如果没有 frontmatter，直接返回内容
  if (!content.startsWith('---')) {
    return content;
  }

  // 找到第二个 ---
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return content;
  }

  return content.substring(endIndex + 3).trim();
}

module.exports = {
  shouldRefreshCache,
  findCacheSkill,
  generateCacheKey,
  parseFrontmatter,
  extractSkillContent,
  REFRESH_KEYWORDS
};

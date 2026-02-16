/**
 * URL Utilities for Web Cache Hooks
 *
 * 提供URL解析和域名提取功能
 */

'use strict';

/**
 * 从URL中提取并规范化域名
 * @param {string} urlStr - 原始URL字符串
 * @returns {string|null} 规范化的域名，无效URL返回null
 *
 * @example
 * extractDomain('https://docs.nodejs.org/api/fs.html')
 * // Returns: 'docs.nodejs.org'
 *
 * extractDomain('https://www.example.com/path')
 * // Returns: 'example.com'
 */
function extractDomain(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return null;
  }

  try {
    // 添加协议前缀（如果没有）
    let normalizedUrl = urlStr.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const url = new URL(normalizedUrl);
    let hostname = url.hostname.toLowerCase();

    // 移除 www 前缀
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    return hostname;
  } catch (error) {
    return null;
  }
}

/**
 * 验证URL是否有效
 * @param {string} urlStr - 待验证的URL字符串
 * @returns {boolean} 是否为有效的HTTP/HTTPS URL
 */
function isValidUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return false;
  }

  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * 将域名转换为安全的文件名
 * @param {string} domain - 域名
 * @returns {string} 安全的文件名
 */
function domainToFilename(domain) {
  if (!domain) {
    return '';
  }

  // 替换不安全字符为连字符
  return domain
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200);
}

module.exports = {
  extractDomain,
  isValidUrl,
  domainToFilename
};

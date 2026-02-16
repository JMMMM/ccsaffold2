#!/usr/bin/env node

/**
 * Web Cache Before Hook (PreToolUse)
 *
 * 在调用 web-reader MCP 之前检查是否存在缓存
 * 如果缓存存在且有效，返回缓存内容阻止 MCP 调用
 *
 * Input (stdin): JSON with tool name and parameters
 * Output (stdout): JSON with optional 'block' field to prevent tool execution
 */

'use strict';

const fs = require('fs');
const path = require('path');
const cacheMatcher = require('../lib/cache-matcher');
const urlUtils = require('../lib/url-utils');

// 使用 __dirname 确定路径，避免依赖工作目录
const HOOKS_DIR = __dirname;
const CLAUDE_DIR = path.dirname(HOOKS_DIR);
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills', 'learn');

/**
 * 日志输出（纯 ASCII，无 emoji）
 */
function log(level, message) {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.error(`[Web-Cache] ${level}: ${message}`);
}

/**
 * 读取 stdin 输入
 */
function readInput() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        if (data.trim()) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(new Error(`Failed to parse input JSON: ${error.message}`));
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * 从工具参数中提取 URL
 */
function extractUrlFromParams(params) {
  if (!params) return null;

  // 支持多种参数格式
  if (params.url) return params.url;
  if (params.arguments && params.arguments.url) return params.arguments.url;

  // 尝试从其他可能的字段中提取
  const possibleFields = ['uri', 'link', 'address', 'target'];
  for (const field of possibleFields) {
    if (params[field]) return params[field];
  }

  return null;
}

/**
 * 从会话上下文中获取用户最近的输入
 * 用于检测刷新关键词
 */
function checkRefreshRequest(context) {
  // 检查当前工具调用的上下文
  if (context && context.userMessage) {
    return cacheMatcher.shouldRefreshCache(context.userMessage);
  }
  return false;
}

/**
 * 格式化缓存响应
 */
function formatCacheResponse(cacheInfo) {
  const content = cacheMatcher.extractSkillContent(cacheInfo.content);
  const metadata = cacheInfo.metadata;

  return {
    block: `[Web-Cache] Found cached content for ${cacheInfo.domain} (cached at ${metadata.cached_at || 'unknown'})\n\nSource: ${metadata.source_url || 'N/A'}\n\n---\n\n${content}\n\n---\n[Note: This content is from local cache. Use "refresh" or "reload" to fetch fresh content from the website.]`
  };
}

/**
 * 主处理函数
 */
async function main() {
  try {
    const input = await readInput();

    // 获取工具名称和参数
    const toolName = input.tool || input.name || '';
    const params = input.parameters || input.arguments || input;

    log('INFO', `Processing tool: ${toolName}`);

    // 检查是否是 web-reader MCP 调用
    const isWebReader = toolName.includes('web-reader') ||
                        toolName.includes('web_reader') ||
                        toolName.toLowerCase().includes('webreader');

    if (!isWebReader) {
      // 不是 web-reader，不处理
      process.exit(0);
    }

    // 提取 URL
    const url = extractUrlFromParams(params);

    if (!url) {
      log('WARN', 'No URL found in tool parameters');
      process.exit(0);
    }

    log('INFO', `Checking cache for: ${url}`);

    // 检查是否需要刷新
    if (checkRefreshRequest(input.context)) {
      log('INFO', 'Refresh requested, bypassing cache');
      process.exit(0);
    }

    // 确保 skills 目录存在
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
      log('INFO', `Created skills directory: ${SKILLS_DIR}`);
    }

    // 查找缓存
    const cacheInfo = cacheMatcher.findCacheSkill(url, SKILLS_DIR);

    if (cacheInfo) {
      log('INFO', `Cache HIT for domain: ${cacheInfo.domain}`);

      // 返回缓存内容，阻止 MCP 调用
      const response = formatCacheResponse(cacheInfo);
      console.log(JSON.stringify(response));
    } else {
      log('INFO', `Cache MISS for URL: ${url}`);
      // 不返回 block，允许 MCP 调用继续
    }

    process.exit(0);
  } catch (error) {
    log('ERROR', `Hook execution failed: ${error.message}`);
    // 出错时不阻止工具执行
    process.exit(0);
  }
}

// 执行主函数
main();

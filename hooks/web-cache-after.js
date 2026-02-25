#!/usr/bin/env node

/**
 * Web Cache After Hook (PostToolUse)
 *
 * 在 web-reader MCP 调用成功后自动处理缓存和 skill 生成
 *
 * 功能：
 * 1. 保存原始 markdown 到 doc/{domain}.md（存档）
 * 2. 分析内容是否为文档型网站
 * 3. 如果是文档型网站，自动生成 skills/learn/{domain}/SKILL.md
 * 4. 输出 skill 的触发方式和用法说明
 *
 * Input (stdin): JSON with tool call result
 * Output (stdout): JSON with additionalContext to show to user
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// 使用 __dirname 确定路径
const HOOKS_DIR = __dirname;
const CLAUDE_DIR = path.dirname(HOOKS_DIR);
const DOC_DIR = path.join(CLAUDE_DIR, 'doc');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills', 'learn');

// 缓存目录（与 web-cache-before.js 保持一致）
const DOC_CACHE_DIR = DOC_DIR;

/**
 * 日志输出
 */
function log(level, message) {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.error(`[Web-Cache-After] ${level}: ${message}`);
}

/**
 * 读取 stdin 输入
 */
function readInput() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error(`Failed to parse input JSON: ${error.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * 从 URL 提取域名
 */
function extractDomain(url) {
  try {
    // 如果没有协议，添加 https://
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
}

/**
 * 生成缓存键（与 cache-matcher.js 保持一致）
 */
function generateCacheKey(urlStr) {
  const domain = extractDomain(urlStr);
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

    // 生成路径的短哈希
    const pathHash = crypto.createHash('md5').update(urlPath).digest('hex').substring(0, 8);
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
 * 判断内容是否为文档型网站
 * 检查内容结构和特征
 */
function isDocumentationSite(content, url) {
  const lowerContent = content.toLowerCase();

  // 文档型网站的特征（权重累加）
  let score = 0;

  // 1. URL 特征
  const urlPatterns = [
    /docs?\./i,           // docs.example.com
    /\/docs\//i,           // example.com/docs
    /\/api\//i,            // example.com/api
    /\/guide(s|)?\//i,     // example.com/guide
    /\/reference\//i,      // example.com/reference
    /\/tutorial(s|)?\//i,  // example.com/tutorial
  ];
  for (const pattern of urlPatterns) {
    if (pattern.test(url)) score += 3;
  }

  // 2. 内容结构特征
  const structurePatterns = [
    /##?\s+\w+/m,          // 有标题
    /```[\s\S]*?```/,      // 有代码块
    /\|.*\|.*\|/m,         // 有表格
    /^\s*[-*+]\s+/m,       // 有列表
  ];
  for (const pattern of structurePatterns) {
    if (pattern.test(content)) score += 2;
  }

  // 3. 技术文档关键词
  const techKeywords = [
    'api', 'function', 'class', 'method', 'parameter',
    'example', 'usage', 'syntax', 'return', 'type',
    'interface', 'implementation', 'reference', 'guide',
    'tutorial', 'getting started', 'installation', 'configuration',
    '函数', '方法', '参数', '示例', '用法', '语法', '返回',
    '接口', '实现', '参考', '指南', '教程', '安装', '配置'
  ];
  for (const keyword of techKeywords) {
    if (lowerContent.includes(keyword)) score += 1;
  }

  // 4. 非文档型内容的减分项
  const nonDocPatterns = [
    /<script.*广告/i,
    /subscribe.*newsletter/i,
    /立即购买|buy now|limited offer/i,
  ];
  for (const pattern of nonDocPatterns) {
    if (pattern.test(content)) score -= 5;
  }

  // 5. 内容长度检查（太短不是文档）
  const contentLength = content.replace(/\s/g, '').length;
  if (contentLength < 500) {
    score -= 3;
  }

  log('INFO', `Documentation score: ${score} for ${url}`);

  // 分数阈值：>= 5 认为是文档型网站
  return score >= 5;
}

/**
 * 从内容中提取关键信息用于 skill 生成
 */
function extractKeyInfo(content) {
  const lines = content.split('\n');

  // 提取标题（第一个 # 标题）
  let title = '';
  for (const line of lines) {
    if (line.startsWith('#')) {
      title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  // 提取主要章节（## 标题）
  const sections = [];
  for (const line of lines) {
    if (line.startsWith('##')) {
      const sectionTitle = line.replace(/^##+\s*/, '').trim();
      if (sectionTitle && !sectionTitle.includes('=')) {
        sections.push(sectionTitle);
      }
    }
  }

  // 统计代码块数量
  const codeBlockCount = (content.match(/```[\s\S]*?```/g) || []).length;

  // 统计表格数量
  const tableCount = (content.match(/\|.*\|.*\|/g) || []).length;

  return { title, sections, codeBlockCount, tableCount };
}

/**
 * 生成 skill 的描述
 */
function generateSkillDescription(domain, keyInfo, url) {
  const { title, sections, codeBlockCount, tableCount } = keyInfo;

  let description = `${domain} 文档缓存`;

  if (title) {
    description += ` - ${title}`;
  }

  if (sections.length > 0) {
    description += `\n主要章节: ${sections.slice(0, 5).join(', ')}`;
    if (sections.length > 5) {
      description += ` 等${sections.length}个章节`;
    }
  }

  if (codeBlockCount > 0 || tableCount > 0) {
    description += `\n包含: `;
    const features = [];
    if (codeBlockCount > 0) features.push(`${codeBlockCount}个代码示例`);
    if (tableCount > 0) features.push(`${tableCount}个表格`);
    description += features.join(', ');
  }

  return description;
}

/**
 * 生成 skill 内容
 */
function generateSkillContent(url, domain, cacheKey, content, keyInfo) {
  const now = new Date().toISOString();
  const { title, sections } = keyInfo;

  // 生成精炼的摘要（取内容的前2000字符，保持核心信息）
  let summary = content;

  // 如果内容太长，进行智能截取
  if (summary.length > 10000) {
    // 尝试在第二个三级标题处截断
    const lines = summary.split('\n');
    let cutIndex = lines.length;
    let headingCount = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('###')) {
        headingCount++;
        if (headingCount >= 3) {
          cutIndex = i;
          break;
        }
      }
    }

    summary = lines.slice(0, cutIndex).join('\n') + '\n\n[... 内容已截断，完整内容请查看原始存档 ...]';
  }

  return `---
name: ${cacheKey}
description: ${domain} 网站内容缓存
source_url: ${url}
cached_at: ${now}
---

# Skill: ${domain} 知识缓存

## Purpose

缓存 ${domain} 网站的文档内容，提供快速离线访问。

## Source

- 原始 URL: ${url}
- 缓存时间: ${now}
- 完整存档: \`doc/${cacheKey}.md\`

## Content Summary

${title ? `**主题**: ${title}\n\n` : ''}${sections.length > 0 ? `**主要章节**:\n${sections.slice(0, 10).map(s => `- ${s}`).join('\n')}\n\n` : ''}

## 知识内容

${summary}

---

## 触发方式

当您访问或询问关于 **${domain}** 的内容时，此 skill 会自动提供缓存的文档内容。

### 触发关键词示例

- "访问 ${url}"
- "${domain} 文档"
- "查看 ${title || domain + ' 文档'}"
- 任何包含 ${domain} 域名的 URL 访问请求

### 使用场景

1. **离线查阅**: 无需网络即可查看 ${domain} 文档
2. **快速参考**: 避免重复访问网站，提高响应速度
3. **上下文增强**: AI 可以直接访问缓存的文档内容
`;
}

/**
 * 生成用户友好的输出消息
 */
function generateUserOutput(url, domain, cacheKey, keyInfo, skillPath, docPath) {
  const { title } = keyInfo;

  let output = `## 网站内容已缓存

已成功访问并缓存网站内容。

### 缓存信息
| 项目 | 内容 |
|------|------|
| **域名** | ${domain} |
| **URL** | ${url} |
${title ? '| **标题** | ' + title + ' |' : ''}

### 文档型网站检测

${title ? `**主题**: ${title}\n\n` : ''}`;

  if (isDocumentationSite(keyInfo.content || '', url)) {
    output += `该网站符合**文档型网站特征**，已自动生成可复用的 Skill。

---

### 生成的 Skill

**Skill 名称**: \`${cacheKey}\`

**文件位置**: \`${skillPath}\`

#### 触发方式

当您询问以下内容时，此 skill 会自动触发：

- 访问 **${domain}** 的任何 URL
- 询问关于 **${title || domain + ' 文档'}** 的内容
- 任何包含 \`${domain}\` 域名的网站访问请求

#### 功能说明

此 skill 提供以下功能：

1. **快速缓存命中**: 后续访问 ${domain} 相关 URL 时，直接使用本地缓存，无需网络请求
2. **离线访问**: 无需网络连接即可查阅 ${domain} 的文档内容
3. **上下文增强**: AI 可以直接引用缓存的文档内容提供更准确的回答

#### 使用示例

\`\`\`
# 以下方式都会触发此 skill：

用户: 访问 https://${domain}/api
用户: ${domain} 的文档在哪里？
用户: 查看 ${title || domain + ' 的使用方法'}
\`\`\`

---

### 完整存档

原始 markdown 内容已保存至: \`${docPath}\`

`;
  } else {
    output += `该网站**不符合文档型网站特征**，仅保存原始存档，未生成 Skill。

### 原始存档

内容已保存至: \`${docPath}\`

`;
  }

  return output;
}

/**
 * 主处理函数
 */
async function main() {
  try {
    const input = await readInput();

    // 获取工具调用信息
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};
    const toolResponse = input.tool_response || {};

    log('INFO', `Processing tool: ${toolName}`);

    // 检查是否是 web-reader 调用
    const isWebReader = toolName.includes('web-reader') ||
                        toolName.includes('web_reader') ||
                        toolName.toLowerCase().includes('webreader');

    if (!isWebReader) {
      process.exit(0);
    }

    // 获取 URL 和内容
    const url = toolInput.url || toolInput.arguments?.url || '';
    const content = toolResponse.text || toolResponse.content || toolResponse.result || '';

    if (!url || !content) {
      log('WARN', 'Missing URL or content in tool response');
      process.exit(0);
    }

    log('INFO', `Processing URL: ${url}`);
    log('INFO', `Content length: ${content.length} characters`);

    // 生成缓存键
    const cacheKey = generateCacheKey(url);
    if (!cacheKey) {
      log('WARN', `Failed to generate cache key for: ${url}`);
      process.exit(0);
    }

    const domain = extractDomain(url);

    // 确保目录存在
    if (!fs.existsSync(DOC_CACHE_DIR)) {
      fs.mkdirSync(DOC_CACHE_DIR, { recursive: true });
    }
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }

    const now = new Date().toISOString();

    // 1. 保存原始 markdown（存档）
    const docPath = path.join(DOC_CACHE_DIR, `${cacheKey}.md`);
    const docContent = `<!--
Source: ${url}
Fetched: ${now}
-->

${content}`;

    fs.writeFileSync(docPath, docContent, 'utf8');
    log('INFO', `Saved document to: ${docPath}`);

    // 2. 分析是否为文档型网站
    const keyInfo = extractKeyInfo(content);
    keyInfo.content = content; // 保存内容用于分析

    let skillPath = '';
    let userOutput = '';

    if (isDocumentationSite(content, url)) {
      // 3. 生成 skill
      const skillDir = path.join(SKILLS_DIR, cacheKey);
      if (!fs.existsSync(skillDir)) {
        fs.mkdirSync(skillDir, { recursive: true });
      }

      skillPath = path.join(skillDir, 'SKILL.md');
      const skillContent = generateSkillContent(url, domain, cacheKey, content, keyInfo);

      fs.writeFileSync(skillPath, skillContent, 'utf8');
      log('INFO', `Generated skill: ${skillPath}`);
    }

    // 4. 生成用户输出
    userOutput = generateUserOutput(url, domain, cacheKey, keyInfo, skillPath, docPath);

    // 返回给用户
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: userOutput
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    log('ERROR', `Hook execution failed: ${error.message}`);
    log('ERROR', error.stack);
    process.exit(0);
  }
}

// 执行主函数
main();

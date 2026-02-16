#!/usr/bin/env node

/**
 * Web Cache Hooks Installation Script
 *
 * 安装 web-cache-hooks 功能到目标项目
 *
 * Usage:
 *   node install.js [target-dir]
 *
 * If target-dir is not specified, uses current working directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 获取脚本所在目录（feature/web-cache-hooks/scripts/）
const SCRIPT_DIR = __dirname;
const FEATURE_DIR = path.dirname(SCRIPT_DIR);
const HOOKS_SRC = path.join(FEATURE_DIR, 'hooks');
const LIB_SRC = path.join(FEATURE_DIR, 'lib');
const SETTINGS_FRAGMENT = path.join(FEATURE_DIR, 'settings.fragment.json');

// 获取目标目录
const targetDir = process.argv[2] || process.cwd();
const claudeDir = path.join(targetDir, '.claude');
const hooksDest = path.join(claudeDir, 'hooks');
const libDest = path.join(claudeDir, 'lib');
const skillsDir = path.join(claudeDir, 'skills', 'learn');
const docDir = path.join(claudeDir, 'doc');
const settingsFile = path.join(claudeDir, 'settings.json');

/**
 * 日志输出（纯 ASCII，无 emoji）
 */
function log(level, message) {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[Web-Cache-Install] ${level}: ${message}`);
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log('INFO', `Created directory: ${dirPath}`);
  }
}

/**
 * 复制文件
 */
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  log('INFO', `Copied: ${path.basename(src)} -> ${dest}`);
}

/**
 * 复制目录中的所有文件
 */
function copyDirFiles(srcDir, destDir) {
  ensureDir(destDir);

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    if (fs.statSync(srcPath).isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * 合并 settings.json
 */
function mergeSettings() {
  let existingSettings = {};

  // 读取现有配置
  if (fs.existsSync(settingsFile)) {
    try {
      const content = fs.readFileSync(settingsFile, 'utf8');
      existingSettings = JSON.parse(content);
      log('INFO', 'Found existing settings.json');
    } catch (error) {
      log('WARN', `Failed to parse existing settings.json: ${error.message}`);
    }
  }

  // 读取片段配置
  const fragment = JSON.parse(fs.readFileSync(SETTINGS_FRAGMENT, 'utf8'));

  // 合并 hooks 配置
  if (!existingSettings.hooks) {
    existingSettings.hooks = {};
  }

  // 合并 PreToolUse hooks
  if (fragment.hooks.PreToolUse) {
    if (!existingSettings.hooks.PreToolUse) {
      existingSettings.hooks.PreToolUse = [];
    }

    for (const hook of fragment.hooks.PreToolUse) {
      // 检查是否已存在相同 matcher 的 hook
      const exists = existingSettings.hooks.PreToolUse.some(
        h => h.matcher === hook.matcher && h.description === hook.description
      );

      if (!exists) {
        existingSettings.hooks.PreToolUse.push(hook);
        log('INFO', `Added PreToolUse hook: ${hook.description}`);
      } else {
        log('INFO', `PreToolUse hook already exists: ${hook.description}`);
      }
    }
  }

  // 合并 PostToolUse hooks
  if (fragment.hooks.PostToolUse) {
    if (!existingSettings.hooks.PostToolUse) {
      existingSettings.hooks.PostToolUse = [];
    }

    for (const hook of fragment.hooks.PostToolUse) {
      const exists = existingSettings.hooks.PostToolUse.some(
        h => h.matcher === hook.matcher && h.description === hook.description
      );

      if (!exists) {
        existingSettings.hooks.PostToolUse.push(hook);
        log('INFO', `Added PostToolUse hook: ${hook.description}`);
      } else {
        log('INFO', `PostToolUse hook already exists: ${hook.description}`);
      }
    }
  }

  // 写入合并后的配置
  fs.writeFileSync(settingsFile, JSON.stringify(existingSettings, null, 2));
  log('INFO', `Updated settings.json: ${settingsFile}`);
}

/**
 * 主安装流程
 */
function install() {
  log('INFO', 'Starting web-cache-hooks installation...');
  log('INFO', `Target directory: ${targetDir}`);

  // 检查目标目录是否存在
  if (!fs.existsSync(targetDir)) {
    log('ERROR', `Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  // 创建必要的目录结构
  ensureDir(claudeDir);
  ensureDir(hooksDest);
  ensureDir(libDest);
  ensureDir(skillsDir);
  ensureDir(docDir);

  // 复制 hooks 文件
  if (fs.existsSync(HOOKS_SRC)) {
    copyDirFiles(HOOKS_SRC, hooksDest);
  }

  // 复制 lib 文件
  if (fs.existsSync(LIB_SRC)) {
    copyDirFiles(LIB_SRC, libDest);
  }

  // 合并 settings.json
  mergeSettings();

  log('INFO', 'Installation completed successfully!');
  log('INFO', '');
  log('INFO', 'Next steps:');
  log('INFO', '1. Restart Claude Code to load the new hooks');
  log('INFO', '2. Try reading a website to test the cache functionality');
  log('INFO', '3. Cached content will be stored in .claude/skills/learn/ and .claude/doc/');
}

// 执行安装
install();

#!/usr/bin/env node
/**
 * Sync project root to .claude-plugin directory
 * Usage: node scripts/sync-to-plugin.js
 *
 * This script copies hooks/lib/skills/commands from project root
 * to .claude-plugin/ and generates settings.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Project root directory
const projectRoot = path.join(__dirname, '..');
const pluginDir = path.join(projectRoot, '.claude-plugin');

// Source directories at project root
const sourceDirs = {
  hooks: path.join(projectRoot, 'hooks'),
  lib: path.join(projectRoot, 'lib'),
  skills: path.join(projectRoot, 'skills'),
  commands: path.join(projectRoot, 'commands')
};

/**
 * Get all files in a directory (non-recursive)
 */
function getFiles(dir, extensions = []) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      // Filter by extension if specified
      if (extensions.length > 0) {
        const ext = path.extname(entry.name);
        if (!extensions.includes(ext)) continue;
      }
      files.push(entry.name);
    }
  }

  return files;
}

/**
 * Copy directory contents to plugin
 */
function copyToPlugin(sourceDir, pluginSubDir, type) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`  [SKIP] ${type}: source directory not found`);
    return { copied: 0, failed: 0 };
  }

  const targetDir = path.join(pluginDir, pluginSubDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = getFiles(sourceDir);
  let copied = 0;
  let failed = 0;

  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    try {
      fs.copyFileSync(srcPath, targetPath);
      console.log(`  [OK] ${type}/${file}`);
      copied++;
    } catch (e) {
      console.log(`  [FAIL] ${type}/${file}: ${e.message}`);
      failed++;
    }
  }

  return { copied, failed };
}

/**
 * Merge hooks.json into settings.json
 */
function generateSettingsJson() {
  const hooksJsonPath = path.join(sourceDirs.hooks, 'hooks.json');
  const settingsJsonPath = path.join(pluginDir, 'settings.json');

  if (!fs.existsSync(hooksJsonPath)) {
    console.log('  [WARN] hooks/hooks.json not found, skipping settings.json generation');
    return false;
  }

  try {
    const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));

    // The hooks.json already uses ${CLAUDE_PLUGIN_ROOT}, so we can use it directly
    const settings = {
      description: 'ccsaffold plugin hooks',
      ...hooksConfig
    };

    fs.writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2));
    console.log('  [OK] settings.json generated');
    return true;
  } catch (e) {
    console.log(`  [FAIL] settings.json: ${e.message}`);
    return false;
  }
}

/**
 * Update plugin.json
 */
function updatePluginJson() {
  const pluginJsonPath = path.join(pluginDir, 'plugin.json');

  let pluginConfig = {
    name: 'ccsaffold',
    version: '1.0.0',
    description: 'Claude Code scaffold plugin with auto-learning and hook creation capabilities',
    author: 'ming',
    license: 'MIT',
    repository: 'https://github.com/ming/ccsaffold'
  };

  // Read existing if available
  if (fs.existsSync(pluginJsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      pluginConfig = { ...pluginConfig, ...existing };
    } catch (e) {
      // Ignore, use default
    }
  }

  // Add hooks configuration reference
  pluginConfig.hooks = 'settings.json';

  fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginConfig, null, 2));
  console.log('  [OK] plugin.json updated');
  return true;
}

/**
 * Sync all components to plugin directory
 */
function sync() {
  console.log('[Sync] Syncing project root to .claude-plugin/...\n');

  // Ensure plugin directory exists
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
  }

  let totalCopied = 0;
  let totalFailed = 0;

  // Copy hooks (excluding hooks.json which is used for settings.json)
  console.log('[Sync] Copying hooks...');
  const hooksResult = copyToPlugin(sourceDirs.hooks, 'hooks', 'hooks');
  totalCopied += hooksResult.copied;
  totalFailed += hooksResult.failed;

  // Copy lib
  console.log('[Sync] Copying lib...');
  const libResult = copyToPlugin(sourceDirs.lib, 'lib', 'lib');
  totalCopied += libResult.copied;
  totalFailed += libResult.failed;

  // Copy skills
  console.log('[Sync] Copying skills...');
  const skillsResult = copyToPlugin(sourceDirs.skills, 'skills', 'skills');
  totalCopied += skillsResult.copied;
  totalFailed += skillsResult.failed;

  // Copy commands (only .md files)
  console.log('[Sync] Copying commands...');
  const commandsResult = copyToPlugin(sourceDirs.commands, 'commands', 'commands');
  totalCopied += commandsResult.copied;
  totalFailed += commandsResult.failed;

  // Generate settings.json
  console.log('[Sync] Generating settings.json...');
  generateSettingsJson();

  // Update plugin.json
  console.log('[Sync] Updating plugin.json...');
  updatePluginJson();

  console.log(`\n[Sync] Complete: ${totalCopied} copied, ${totalFailed} failed`);
}

// Run sync
sync();

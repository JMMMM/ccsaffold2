#!/usr/bin/env node
/**
 * Sync plugin files to local .claude/ directory
 * Usage: node scripts/sync-to-local.js
 *
 * This script copies files from .claude-plugin/ to the project's .claude/
 * directory so the plugin takes effect immediately in this project.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Project root directory
const projectRoot = path.join(__dirname, '..');
const pluginDir = path.join(projectRoot, '.claude-plugin');
const localClaudeDir = path.join(projectRoot, '.claude');

/**
 * Get all files in a directory (non-recursive)
 */
function getFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  return files;
}

/**
 * Copy directory contents to .claude
 */
function copyToLocal(pluginSubDir, localSubDir, type) {
  const sourceDir = path.join(pluginDir, pluginSubDir);
  const targetDir = path.join(localClaudeDir, localSubDir);

  if (!fs.existsSync(sourceDir)) {
    console.log(`  [SKIP] ${type}: source directory not found`);
    return { copied: 0, failed: 0 };
  }

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
      console.log(`  [OK] ${type}/${file} -> .claude/${localSubDir}/${file}`);
      copied++;
    } catch (e) {
      console.log(`  [FAIL] ${type}/${file}: ${e.message}`);
      failed++;
    }
  }

  return { copied, failed };
}

/**
 * Copy settings.json and convert ${CLAUDE_PLUGIN_ROOT} to relative paths
 */
function copySettingsJson() {
  const settingsPath = path.join(pluginDir, 'settings.json');
  const targetPath = path.join(localClaudeDir, 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    console.log('  [SKIP] settings.json: source not found');
    return false;
  }

  try {
    let settings = fs.readFileSync(settingsPath, 'utf8');

    // Convert ${CLAUDE_PLUGIN_ROOT}/hooks/ to .claude/hooks/
    // This is needed for local .claude/ usage (not plugin-dir usage)
    settings = settings.replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\//g, '.claude/hooks/');
    settings = settings.replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/lib\//g, '.claude/lib/');
    settings = settings.replace(/\$\{CLAUDE_PLUGIN_ROOT\}\/skills\//g, '.claude/skills/');

    fs.writeFileSync(targetPath, settings);
    console.log('  [OK] settings.json -> .claude/settings.json');
    return true;
  } catch (e) {
    console.log(`  [FAIL] settings.json: ${e.message}`);
    return false;
  }
}

function sync() {
  console.log('[Sync] Syncing .claude-plugin/ to .claude/ directory...\n');

  // Ensure local .claude directory exists
  if (!fs.existsSync(localClaudeDir)) {
    fs.mkdirSync(localClaudeDir, { recursive: true });
  }

  let totalCopied = 0;
  let totalFailed = 0;

  // Copy hooks
  console.log('[Sync] Copying hooks...');
  const hooksResult = copyToLocal('hooks', 'hooks', 'hooks');
  totalCopied += hooksResult.copied;
  totalFailed += hooksResult.failed;

  // Copy lib
  console.log('[Sync] Copying lib...');
  const libResult = copyToLocal('lib', 'lib', 'lib');
  totalCopied += libResult.copied;
  totalFailed += libResult.failed;

  // Copy skills
  console.log('[Sync] Copying skills...');
  const skillsResult = copyToLocal('skills', 'skills', 'skills');
  totalCopied += skillsResult.copied;
  totalFailed += skillsResult.failed;

  // Copy commands
  console.log('[Sync] Copying commands...');
  const commandsResult = copyToLocal('commands', 'commands', 'commands');
  totalCopied += commandsResult.copied;
  totalFailed += commandsResult.failed;

  // Copy settings.json with path conversion
  console.log('[Sync] Copying settings.json...');
  copySettingsJson();

  console.log(`\n[Sync] Complete: ${totalCopied} copied, ${totalFailed} failed`);
}

// Run sync
sync();

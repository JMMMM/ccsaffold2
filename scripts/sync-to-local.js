#!/usr/bin/env node
/**
 * Sync plugin files to local .claude/ directory
 * Usage: node scripts/sync-to-local.js
 *
 * This script copies plugin files to the project's .claude/ directory
 * so changes in the plugin take effect immediately.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Plugin root directory
const pluginRoot = path.join(__dirname, '..');
const localClaudeDir = path.join(pluginRoot, '.claude');

// Files to sync: [source, target]
const FILES_TO_SYNC = [
  // Hooks
  ['hooks/session-logger.js', 'hooks/session-logger.js'],
  ['hooks/auto-learning.js', 'hooks/auto-learning.js'],
  ['hooks/auto-learning-worker.js', 'hooks/auto-learning-worker.js'],
  ['hooks/web-cache-before.js', 'hooks/web-cache-before.js'],

  // Lib
  ['lib/llm-analyzer.js', 'lib/llm-analyzer.js'],
  ['lib/skill-generator.js', 'lib/skill-generator.js'],
  ['lib/sensitive-filter.js', 'lib/sensitive-filter.js'],
  ['lib/learning-logger.js', 'lib/learning-logger.js'],
  ['lib/transcript-reader.js', 'lib/transcript-reader.js'],
  ['lib/conversation-reader.js', 'lib/conversation-reader.js'],
  ['lib/cache-matcher.js', 'lib/cache-matcher.js'],
  ['lib/url-utils.js', 'lib/url-utils.js'],
];

function sync() {
  console.log('[Sync] Syncing plugin files to .claude/ directory...\n');

  let synced = 0;
  let failed = 0;

  for (const [src, target] of FILES_TO_SYNC) {
    const srcPath = path.join(pluginRoot, src);
    const targetPath = path.join(localClaudeDir, target);

    try {
      // Check source exists
      if (!fs.existsSync(srcPath)) {
        console.log(`  [SKIP] ${src} (source not found)`);
        continue;
      }

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy file
      fs.copyFileSync(srcPath, targetPath);
      console.log(`  [OK] ${src} -> .claude/${target}`);
      synced++;
    } catch (e) {
      console.log(`  [FAIL] ${src}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n[Sync] Complete: ${synced} synced, ${failed} failed`);
}

// Run sync
sync();

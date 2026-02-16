#!/usr/bin/env node
/**
 * Build plugin from features
 * Usage: node scripts/build.js
 *
 * This script executes the complete build pipeline:
 * 1. sync-from-feature.js - Sync features to project root
 * 2. sync-to-plugin.js - Sync project root to .claude-plugin
 * 3. sync-to-local.js - Sync .claude-plugin to .claude
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Project root directory
const projectRoot = path.join(__dirname, '..');

// Scripts to run in sequence
const buildSteps = [
  { name: 'Sync features to project root', script: 'sync-from-feature.js' },
  { name: 'Sync project root to plugin', script: 'sync-to-plugin.js' },
  { name: 'Sync plugin to local .claude', script: 'sync-to-local.js' }
];

/**
 * Run a script and return the result
 */
function runScript(scriptPath) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    const proc = spawn('node', [scriptPath], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      resolve({ success: code === 0, code });
    });

    proc.on('error', (err) => {
      console.error(`Error running script: ${err.message}`);
      resolve({ success: false, error: err });
    });
  });
}

/**
 * Run all build steps
 */
async function build() {
  console.log('========================================');
  console.log('  Building ccsaffold2 Plugin');
  console.log('========================================\n');

  let allSuccess = true;

  for (let i = 0; i < buildSteps.length; i++) {
    const step = buildSteps[i];
    const stepNum = i + 1;

    console.log(`\n[${stepNum}/${buildSteps.length}] ${step.name}...`);
    console.log('---');

    const scriptPath = path.join(__dirname, step.script);

    if (!fs.existsSync(scriptPath)) {
      console.error(`[ERROR] Script not found: ${step.script}`);
      allSuccess = false;
      continue;
    }

    const result = await runScript(scriptPath);

    if (!result.success) {
      console.error(`\n[ERROR] Step ${stepNum} failed`);
      allSuccess = false;

      if (process.argv.includes('--continue-on-error')) {
        console.log('[INFO] Continuing due to --continue-on-error flag');
        continue;
      } else {
        console.log('[INFO] Stopping build. Use --continue-on-error to continue anyway.');
        break;
      }
    }
  }

  console.log('\n========================================');
  if (allSuccess) {
    console.log('  Build completed successfully!');
    console.log('========================================');
    console.log('\nNext steps:');
    console.log('  - Restart Claude Code to apply changes');
    console.log('  - Or test in another project with: --plugin-dir /Users/ming/Work/ccsaffold2');
  } else {
    console.log('  Build completed with errors!');
    console.log('========================================');
    process.exit(1);
  }
}

// Run build
build().catch((err) => {
  console.error('[FATAL] Build failed:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Sync feature files to project root (hooks/lib/skills)
 * Usage: node scripts/sync-from-feature.js
 *
 * This script reads manifest.json from each feature directory
 * and copies the declared files to the project root directories.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Project root directory
const projectRoot = path.join(__dirname, '..');
const featureDir = path.join(projectRoot, 'feature');

// Target directories at project root
const targetDirs = {
  hooks: path.join(projectRoot, 'hooks'),
  lib: path.join(projectRoot, 'lib'),
  skills: path.join(projectRoot, 'skills')
};

/**
 * Read all feature manifests
 */
function getFeatures() {
  const features = [];

  if (!fs.existsSync(featureDir)) {
    console.log(`[Sync] Feature directory not found: ${featureDir}`);
    return features;
  }

  const entries = fs.readdirSync(featureDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = path.join(featureDir, entry.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log(`[Sync] Skip ${entry.name}: no manifest.json found`);
      continue;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.enabled !== false) {
        features.push({
          name: entry.name,
          dir: path.join(featureDir, entry.name),
          manifest: manifest
        });
      } else {
        console.log(`[Sync] Skip ${entry.name}: disabled`);
      }
    } catch (e) {
      console.log(`[Sync] Skip ${entry.name}: invalid manifest.json - ${e.message}`);
    }
  }

  // Sort by feature name for consistent processing
  features.sort((a, b) => a.name.localeCompare(b.name));
  return features;
}

/**
 * Copy a file from feature to project root
 */
function copyFile(featureDir, relativePath, targetDir, featureName) {
  const srcPath = path.join(featureDir, relativePath);
  const fileName = path.basename(relativePath);
  const targetPath = path.join(targetDir, fileName);

  if (!fs.existsSync(srcPath)) {
    console.log(`  [WARN] ${featureName}/${relativePath}: source not found`);
    return false;
  }

  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(srcPath, targetPath);
    console.log(`  [OK] ${featureName}/${relativePath} -> ${path.basename(targetDir)}/${fileName}`);
    return true;
  } catch (e) {
    console.log(`  [FAIL] ${featureName}/${relativePath}: ${e.message}`);
    return false;
  }
}

/**
 * Sync all features to project root
 */
function sync() {
  console.log('[Sync] Syncing features to project root...\n');

  const features = getFeatures();

  if (features.length === 0) {
    console.log('[Sync] No features to sync');
    return;
  }

  console.log(`[Sync] Found ${features.length} feature(s):\n`);

  let totalCopied = 0;
  let totalFailed = 0;

  for (const feature of features) {
    console.log(`[Sync] Processing: ${feature.name} (${feature.manifest.description || 'no description'})`);

    const files = feature.manifest.files || {};

    // Copy hooks
    if (files.hooks && Array.isArray(files.hooks)) {
      for (const file of files.hooks) {
        if (copyFile(feature.dir, file, targetDirs.hooks, feature.name)) {
          totalCopied++;
        } else {
          totalFailed++;
        }
      }
    }

    // Copy lib
    if (files.lib && Array.isArray(files.lib)) {
      for (const file of files.lib) {
        if (copyFile(feature.dir, file, targetDirs.lib, feature.name)) {
          totalCopied++;
        } else {
          totalFailed++;
        }
      }
    }

    // Copy skills
    if (files.skills && Array.isArray(files.skills)) {
      for (const file of files.skills) {
        if (copyFile(feature.dir, file, targetDirs.skills, feature.name)) {
          totalCopied++;
        } else {
          totalFailed++;
        }
      }
    }

    console.log('');
  }

  console.log(`[Sync] Complete: ${totalCopied} copied, ${totalFailed} failed`);
}

// Run sync
sync();

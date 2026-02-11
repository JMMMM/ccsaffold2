#!/usr/bin/env node
/**
 * Unit tests for manual-learn skill
 * Tests the manual learning skill definition
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('Running manual-learn skill tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

const skillPath = path.join(__dirname, '..', 'skills', 'manual-learn.md');

// Test 1: Skill file exists
test('manual-learn.md should exist', () => {
  assert(fs.existsSync(skillPath), 'Skill file should exist');
});

// Test 2: Skill file has valid format
test('should have valid skill file format', () => {
  const content = fs.readFileSync(skillPath, 'utf8');
  assert(content.startsWith('---'), 'Should start with YAML frontmatter');
  assert(content.includes('name:'), 'Should have name field');
  assert(content.includes('description:'), 'Should have description field');
});

// Test 3: Skill has required sections
test('should have required sections', () => {
  const content = fs.readFileSync(skillPath, 'utf8');
  assert(content.includes('## Purpose'), 'Should have Purpose section');
  assert(content.includes('## Trigger Conditions'), 'Should have Trigger Conditions section');
  assert(content.includes('## Instructions'), 'Should have Instructions section');
  assert(content.includes('## Examples'), 'Should have Examples section');
});

// Test 4: Skill describes manual learning functionality
test('should describe manual learning functionality', () => {
  const content = fs.readFileSync(skillPath, 'utf8');
  assert(content.includes('学习') || content.includes('learn'), 'Should mention learning');
  assert(content.includes('手动') || content.includes('manual'), 'Should mention manual trigger');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);

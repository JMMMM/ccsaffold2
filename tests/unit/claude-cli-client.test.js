#!/usr/bin/env node
/**
 * Claude CLI Client Tests (Simplified)
 */

'use strict';

const assert = require('assert');
const path = require('path');

const claudeCli = require(path.join(__dirname, '..', '..', 'lib', 'claude-cli-client.js'));

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (e) {
    console.log(`[FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

console.log('\n=== Claude CLI Client Tests ===\n');

test('isAvailable returns boolean', () => {
  assert.strictEqual(typeof claudeCli.isAvailable(), 'boolean');
});

test('checkAvailability returns object', async () => {
  const result = await claudeCli.checkAvailability();
  assert.strictEqual(typeof result.available, 'boolean');
});

test('buildLearningPrompt includes cwd and content', () => {
  const prompt = claudeCli.buildLearningPrompt('Test content', '/test/path');
  assert.ok(prompt.includes('/test/path'));
  assert.ok(prompt.includes('Test content'));
  assert.ok(prompt.includes('.claude/skills'));
  assert.ok(prompt.includes('.claude/doc/features'));
});

test('executeLearning handles empty content', async () => {
  const result = await claudeCli.executeLearning('', '/test');
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('short'));
});

test('DEFAULT_CONFIG has expected values', () => {
  assert.strictEqual(claudeCli.DEFAULT_CONFIG.timeout, 60000);
  assert.strictEqual(claudeCli.DEFAULT_CONFIG.maxTurns, 3);
});

test('parseJsonResult extracts JSON from code block', () => {
  const output = 'Some text\n```json\n{"file_type":"skill","file_path":"test.md","thinking":"test"}\n```\nMore text';
  const result = claudeCli.parseJsonResult(output);
  assert.strictEqual(result.file_type, 'skill');
  assert.strictEqual(result.file_path, 'test.md');
  assert.strictEqual(result.thinking, 'test');
});

test('parseJsonResult extracts standalone JSON', () => {
  const output = 'Analysis here\n{"file_type":"doc","file_path":"doc.md","thinking":"feature doc"}';
  const result = claudeCli.parseJsonResult(output);
  assert.strictEqual(result.file_type, 'doc');
  assert.strictEqual(result.file_path, 'doc.md');
});

test('parseJsonResult returns null for invalid input', () => {
  assert.strictEqual(claudeCli.parseJsonResult(null), null);
  assert.strictEqual(claudeCli.parseJsonResult('no json here'), null);
});

test('FILE_TYPES has expected values', () => {
  assert.strictEqual(claudeCli.FILE_TYPES.SKILL, 'skill');
  assert.strictEqual(claudeCli.FILE_TYPES.DOC, 'doc');
  assert.strictEqual(claudeCli.FILE_TYPES.NONE, 'none');
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);

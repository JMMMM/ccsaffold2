#!/usr/bin/env node
/**
 * Unit tests for skill deduplication logic
 * Tests the similarity check and merge/update functionality
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load the module under test
const skillGenerator = require(path.join(__dirname, '..', 'lib', 'skill-generator.js'));

console.log('Running skill-dedup tests...\n');

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

// Test 1: Calculate similarity between skill names
test('should calculate similarity between similar skill names', () => {
  const name1 = 'API 调试配置';
  const name2 = 'API 调试设置';
  const similarity = skillGenerator.calculateSimilarity(name1, name2);

  assert(similarity > 0.5, 'Similar names should have high similarity');
});

// Test 2: Calculate similarity between different skill names
test('should calculate low similarity for different names', () => {
  const name1 = 'API 调试配置';
  const name2 = 'Git 分支管理';
  const similarity = skillGenerator.calculateSimilarity(name1, name2);

  assert(similarity < 0.5, 'Different names should have low similarity');
});

// Test 3: Check if skills are similar enough to merge
test('should detect similar skills for merging', () => {
  const result1 = {
    name: 'API 调试配置',
    keywords: ['API', '调试', '配置']
  };
  const result2 = {
    name: 'API 调试设置',
    keywords: ['API', '调试', '设置']
  };

  const shouldMerge = skillGenerator.shouldMergeSkills(result1, result2);
  assert.strictEqual(shouldMerge, true, 'Similar skills should be merged');
});

// Test 4: Check if skills are different enough
test('should not merge different skills', () => {
  const result1 = {
    name: 'API 调试配置',
    keywords: ['API', '调试', '配置']
  };
  const result2 = {
    name: '数据库优化',
    keywords: ['数据库', '优化', 'SQL']
  };

  const shouldMerge = skillGenerator.shouldMergeSkills(result1, result2);
  assert.strictEqual(shouldMerge, false, 'Different skills should not be merged');
});

// Test 5: Merge skill content
test('should merge skill content correctly', () => {
  const existingResult = {
    name: 'API 调试配置',
    description: '帮助解决 API 配置问题',
    problem: 'API 配置错误',
    solution: '检查配置',
    steps: ['检查 URL', '检查认证'],
    keywords: ['API', '配置']
  };
  const newResult = {
    name: 'API 调试配置',
    description: '帮助解决 API 调用和配置问题',
    problem: 'API 调用失败和配置错误',
    solution: '系统化排查',
    steps: ['检查 URL', '检查认证', '检查请求头'],
    keywords: ['API', '配置', '调试']
  };

  const merged = skillGenerator.mergeSkillResults(existingResult, newResult);

  assert(merged.steps.length >= 3, 'Should include steps from both');
  assert(merged.keywords.includes('调试'), 'Should include new keywords');
});

// Test 6: Find existing similar skill
test('should find existing similar skill', () => {
  const existingSkills = [
    { name: 'Git 提交规范', keywords: ['Git', '提交'] },
    { name: 'API 调试配置', keywords: ['API', '调试'] },
    { name: '数据库优化', keywords: ['数据库'] }
  ];
  const newResult = {
    name: 'API 调试设置',
    keywords: ['API', '调试', '设置']
  };

  const similar = skillGenerator.findSimilarSkill(existingSkills, newResult);
  assert(similar !== null, 'Should find similar skill');
  assert.strictEqual(similar.name, 'API 调试配置', 'Should match correct skill');
});

// Test 7: Return null when no similar skill exists
test('should return null when no similar skill exists', () => {
  const existingSkills = [
    { name: 'Git 提交规范', keywords: ['Git', '提交'] },
    { name: '数据库优化', keywords: ['数据库'] }
  ];
  const newResult = {
    name: 'API 调试配置',
    keywords: ['API', '调试', '配置']
  };

  const similar = skillGenerator.findSimilarSkill(existingSkills, newResult);
  assert.strictEqual(similar, null, 'Should return null for no match');
});

// Test 8: Update existing skill file
test('should update existing skill file', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Create existing skill
  const existingResult = {
    name: 'Test Skill',
    description: 'Original description',
    problem: 'Original problem',
    solution: 'Original solution',
    steps: ['Step 1'],
    keywords: ['keyword1']
  };

  const skillDir = path.join(fixturesDir, '.skills', 'learn');
  const skillPath = skillGenerator.writeSkillFile(fixturesDir, existingResult);

  // Update with new content
  const newResult = {
    name: 'Test Skill',
    description: 'Updated description',
    problem: 'Updated problem',
    solution: 'Updated solution',
    steps: ['Step 1', 'Step 2'],
    keywords: ['keyword1', 'keyword2']
  };

  const updated = skillGenerator.updateSkillFile(fixturesDir, newResult);

  assert(updated !== null, 'Should successfully update');
  const content = fs.readFileSync(updated, 'utf8');
  assert(content.includes('Step 2'), 'Should include new steps');
  assert(content.includes('keyword2'), 'Should include new keywords');

  // Cleanup
  fs.rmSync(path.join(fixturesDir, '.skills'), { recursive: true, force: true });
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);

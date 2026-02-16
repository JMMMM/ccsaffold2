#!/usr/bin/env node
/**
 * Unit tests for skill-generator module
 * Tests skill file generation from learning results
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load the module under test
const skillGenerator = require(path.join(__dirname, '..', 'lib', 'skill-generator.js'));

console.log('Running skill-generator tests...\n');

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

// Test fixtures
const validResult = {
  name: 'API 调试配置',
  description: '帮助用户快速定位和解决 API 调用配置问题',
  problem: '用户遇到 API 调用失败、配置错误等问题',
  solution: '提供系统化的排查和解决方法',
  steps: [
    '确认 API 端点 URL 是否正确',
    '验证认证信息是否有效',
    '检查请求头是否包含必需字段'
  ],
  keywords: ['API 调用失败', 'API 配置错误', '请求超时']
};

// Test 1: Generate skill content
test('should generate skill content from learning result', () => {
  const content = skillGenerator.generateSkillContent(validResult);

  assert(content.includes('---'), 'Should have YAML frontmatter');
  assert(content.includes('name: API 调试配置'), 'Should have skill name');
  assert(content.includes('## Purpose'), 'Should have Purpose section');
  assert(content.includes('## Trigger Conditions'), 'Should have Trigger Conditions section');
  assert(content.includes('## Instructions'), 'Should have Instructions section');
  assert(content.includes('## Examples'), 'Should have Examples section');
});

// Test 2: Generate frontmatter
test('should generate valid YAML frontmatter', () => {
  const frontmatter = skillGenerator.generateFrontmatter(validResult);

  assert(frontmatter.includes('---'), 'Should be wrapped in ---');
  assert(frontmatter.includes('name:'), 'Should have name field');
  assert(frontmatter.includes('description:'), 'Should have description field');
});

// Test 3: Generate trigger conditions section
test('should generate trigger conditions section', () => {
  const section = skillGenerator.generateTriggerConditions(validResult.keywords);

  assert(section.includes('## Trigger Conditions'), 'Should have header');
  assert(section.includes('当用户提到以下关键词时会触发此技能'), 'Should have instruction');
  assert(section.includes('- API 调用失败'), 'Should have keywords as list');
});

// Test 4: Generate instructions section
test('should generate instructions section', () => {
  const section = skillGenerator.generateInstructions(validResult.steps);

  assert(section.includes('## Instructions'), 'Should have header');
  assert(section.includes('1. 确认 API 端点'), 'Should have numbered steps');
});

// Test 5: Generate file name from skill name
test('should generate kebab-case file name', () => {
  const fileName = skillGenerator.generateFileName('API 调试配置');

  assert(fileName.endsWith('.md'), 'Should have .md extension');
  assert(!fileName.includes(' '), 'Should not have spaces');
  assert(fileName.includes('api'), 'Should contain transliterated content');
});

// Test 6: Generate file name with special characters
test('should handle special characters in skill name', () => {
  const fileName = skillGenerator.generateFileName('Git: 分支管理 & 冲突解决!');

  assert(fileName.endsWith('.md'), 'Should have .md extension');
  assert(!fileName.includes(':'), 'Should not have colon');
  assert(!fileName.includes('&'), 'Should not have ampersand');
  assert(!fileName.includes('!'), 'Should not have exclamation');
});

// Test 7: Generate examples section
test('should generate examples section with placeholder', () => {
  const section = skillGenerator.generateExamples(validResult);

  assert(section.includes('## Examples'), 'Should have header');
  assert(section.includes('示例'), 'Should have example markers');
});

// Test 8: Validate skill content
test('should validate generated skill content', () => {
  const content = skillGenerator.generateSkillContent(validResult);
  const isValid = skillGenerator.validateSkillContent(content);

  assert.strictEqual(isValid, true, 'Generated content should be valid');
});

// Test 9: Invalid skill content detection
test('should detect invalid skill content', () => {
  const invalidContent = 'This is not a valid skill file';
  const isValid = skillGenerator.validateSkillContent(invalidContent);

  assert.strictEqual(isValid, false, 'Invalid content should fail validation');
});

// Test 10: Get skill directory path
test('should generate correct skill directory path', () => {
  const cwd = '/Users/test/project';
  const skillDir = skillGenerator.getSkillDirectory(cwd);

  assert(skillDir.includes('.skills'), 'Should contain .skills');
  assert(skillDir.includes('learn'), 'Should contain learn');
});

// Test 11: Full skill generation workflow
test('should complete full skill generation workflow', () => {
  const cwd = '/tmp/test-skills';
  const skillPath = skillGenerator.getSkillPath(cwd, validResult.name);

  assert(skillPath.includes('.skills/learn'), 'Should be in .skills/learn');
  assert(skillPath.endsWith('.md'), 'Should have .md extension');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);

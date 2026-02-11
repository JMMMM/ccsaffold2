#!/usr/bin/env node
/**
 * Unit tests for llm-analyzer module
 * Tests LLM API calls and content analysis for learning
 */

const assert = require('assert');
const path = require('path');

// Load the module under test
const llmAnalyzer = require(path.join(__dirname, '..', 'lib', 'llm-analyzer.js'));

console.log('Running llm-analyzer tests...\n');

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

// Test 1: Build analysis prompt
test('should build analysis prompt from transcript content', () => {
  const content = 'User: How do I fix this bug?\nAssistant: Try this...';
  const prompt = llmAnalyzer.buildPrompt(content);

  assert(prompt.includes('分析以下会话记录'), 'Should contain analysis instruction');
  assert(prompt.includes(content), 'Should contain transcript content');
  assert(prompt.includes('JSON'), 'Should request JSON format');
});

// Test 2: Parse LLM response - valid JSON
test('should parse valid JSON response from LLM', () => {
  const response = JSON.stringify([
    {
      name: 'test-skill',
      description: 'Test skill description',
      problem: 'Test problem',
      solution: 'Test solution',
      steps: ['step1', 'step2'],
      keywords: ['keyword1', 'keyword2']
    }
  ]);

  const results = llmAnalyzer.parseResponse(response);
  assert.strictEqual(results.length, 1, 'Should have 1 result');
  assert.strictEqual(results[0].name, 'test-skill', 'Should have correct name');
});

// Test 3: Parse LLM response - empty array
test('should parse empty array response', () => {
  const response = '[]';
  const results = llmAnalyzer.parseResponse(response);

  assert.strictEqual(results.length, 0, 'Should have 0 results');
});

// Test 4: Parse LLM response - extract JSON from text
test('should extract JSON from response with surrounding text', () => {
  const response = 'Here is the analysis:\n```json\n[{"name": "skill1", "description": "desc", "problem": "prob", "solution": "sol", "steps": [], "keywords": []}]\n```\nEnd of analysis.';
  const results = llmAnalyzer.parseResponse(response);

  assert.strictEqual(results.length, 1, 'Should extract and parse JSON');
});

// Test 5: Parse LLM response - invalid JSON
test('should handle invalid JSON response', () => {
  const response = 'This is not valid JSON';
  const results = llmAnalyzer.parseResponse(response);

  assert.strictEqual(results, null, 'Should return null for invalid JSON');
});

// Test 6: Validate learning result
test('should validate learning result structure', () => {
  const validResult = {
    name: 'valid-skill',
    description: 'A valid description',
    problem: 'A problem description',
    solution: 'A solution description',
    steps: ['step1'],
    keywords: ['keyword1']
  };

  const isValid = llmAnalyzer.validateResult(validResult);
  assert.strictEqual(isValid, true, 'Should be valid');
});

// Test 7: Validate learning result - missing fields
test('should reject result with missing fields', () => {
  const invalidResult = {
    name: 'invalid-skill'
    // missing other fields
  };

  const isValid = llmAnalyzer.validateResult(invalidResult);
  assert.strictEqual(isValid, false, 'Should be invalid');
});

// Test 8: Validate learning result - name too short
test('should reject result with name too short', () => {
  const invalidResult = {
    name: 'a', // too short
    description: 'A valid description',
    problem: 'A problem description',
    solution: 'A solution description',
    steps: ['step1'],
    keywords: ['keyword1']
  };

  const isValid = llmAnalyzer.validateResult(invalidResult);
  assert.strictEqual(isValid, false, 'Should be invalid');
});

// Test 9: Get API key from environment
test('should get API key from environment', () => {
  const originalKey = process.env.ANTHROPIC_AUTH_TOKEN;
  process.env.ANTHROPIC_AUTH_TOKEN = 'test-api-key-12345678';

  const key = llmAnalyzer.getApiKey();
  assert.strictEqual(key, 'test-api-key-12345678', 'Should return API key');

  process.env.ANTHROPIC_AUTH_TOKEN = originalKey;
});

// Test 10: Check API availability
test('should check if API is available', () => {
  const originalKey = process.env.ANTHROPIC_AUTH_TOKEN;

  // With key
  process.env.ANTHROPIC_AUTH_TOKEN = 'test-api-key';
  assert.strictEqual(llmAnalyzer.isApiAvailable(), true, 'Should be available with key');

  // Without key
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  assert.strictEqual(llmAnalyzer.isApiAvailable(), false, 'Should not be available without key');

  process.env.ANTHROPIC_AUTH_TOKEN = originalKey;
});

// Test 11: Filter results - remove invalid
test('should filter out invalid results', () => {
  const results = [
    { name: 'valid', description: 'a valid description', problem: 'prob', solution: 'sol', steps: ['s1'], keywords: ['k1'] },
    { name: 'ab' }, // invalid - missing required fields
    { name: 'valid2', description: 'another valid description', problem: 'prob2', solution: 'sol2', steps: ['s2'], keywords: ['k2'] },
    { name: 'a' }, // invalid - name too short
    { name: 'valid3', description: 'third valid description', problem: 'prob3', solution: 'sol3', steps: ['s3'], keywords: ['k3'] }
  ];

  const filtered = llmAnalyzer.filterValidResults(results);
  assert.strictEqual(filtered.length, 3, 'Should have 3 valid results');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);

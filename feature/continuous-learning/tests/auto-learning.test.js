#!/usr/bin/env node
/**
 * Integration tests for auto-learning hook
 * Tests the complete sessionEnd hook workflow
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load modules
const transcriptReader = require(path.join(__dirname, '..', 'lib', 'transcript-reader.js'));
const sensitiveFilter = require(path.join(__dirname, '..', 'lib', 'sensitive-filter.js'));
const llmAnalyzer = require(path.join(__dirname, '..', 'lib', 'llm-analyzer.js'));
const skillGenerator = require(path.join(__dirname, '..', 'lib', 'skill-generator.js'));

console.log('Running auto-learning integration tests...\n');

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

// Create test fixtures
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Test 1: Complete workflow - parse and filter
test('should parse transcript and filter sensitive content', () => {
  // Create test transcript
  const transcript = [
    { type: 'user', message: { content: 'My API key is sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx' } },
    { type: 'assistant', message: { content: 'I can help you with that' } },
    { type: 'user', message: { content: 'password = "secret123"' } }
  ];

  const transcriptPath = path.join(fixturesDir, 'test-integration.jsonl');
  fs.writeFileSync(transcriptPath, transcript.map(JSON.stringify).join('\n'));

  // Parse and filter
  const records = transcriptReader.parseFile(transcriptPath);
  const text = transcriptReader.extractConversationText(records);
  const filtered = sensitiveFilter.filter(text);

  assert(!filtered.includes('sk-ant-'), 'API key should be filtered');
  assert(!filtered.includes('secret123'), 'Password should be filtered');
  assert(filtered.includes('[REDACTED]'), 'Should contain [REDACTED]');

  fs.unlinkSync(transcriptPath);
});

// Test 2: Workflow with no learnable content
test('should handle transcript with no learnable content', () => {
  const transcript = [
    { type: 'user', message: { content: 'Hello' } },
    { type: 'assistant', message: { content: 'Hi there!' } }
  ];

  const transcriptPath = path.join(fixturesDir, 'test-no-learn.jsonl');
  fs.writeFileSync(transcriptPath, transcript.map(JSON.stringify).join('\n'));

  const records = transcriptReader.parseFile(transcriptPath);
  const text = transcriptReader.extractConversationText(records);

  // This would normally be sent to LLM, but we test the parsing part
  assert(text.includes('Hello'), 'Should contain user message');
  assert(text.includes('Hi there'), 'Should contain assistant message');

  fs.unlinkSync(transcriptPath);
});

// Test 3: Hook input parsing
test('should parse sessionEnd hook input', () => {
  const hookInput = {
    session_id: 'test-session-123',
    transcript_path: '/path/to/transcript.jsonl',
    cwd: '/Users/test/project',
    hook_event_name: 'sessionEnd'
  };

  const transcriptPath = transcriptReader.getTranscriptPath(hookInput);
  const cwd = transcriptReader.getWorkingDirectory(hookInput);

  assert.strictEqual(transcriptPath, '/path/to/transcript.jsonl', 'Should extract transcript path');
  assert.strictEqual(cwd, '/Users/test/project', 'Should extract working directory');
});

// Test 4: Skill path generation
test('should generate correct skill output path', () => {
  const cwd = '/Users/test/project';
  const skillName = 'API Debug Config';
  const skillPath = skillGenerator.getSkillPath(cwd, skillName);

  assert(skillPath.startsWith(cwd), 'Should be under project root');
  assert(skillPath.includes('.skills/learn'), 'Should be in .skills/learn directory');
  assert(skillPath.endsWith('.md'), 'Should have .md extension');
});

// Test 5: End-to-end with mock LLM response
test('should process mock LLM response through skill generation', () => {
  const mockLLMResponse = JSON.stringify([
    {
      name: 'Test Skill',
      description: 'A test skill for integration testing',
      problem: 'Test problem description',
      solution: 'Test solution approach',
      steps: ['Step 1: Do this', 'Step 2: Do that'],
      keywords: ['test', 'integration']
    }
  ]);

  // Parse LLM response
  const results = llmAnalyzer.parseResponse(mockLLMResponse);
  assert.strictEqual(results.length, 1, 'Should parse 1 result');

  // Validate result
  const isValid = llmAnalyzer.validateResult(results[0]);
  assert.strictEqual(isValid, true, 'Result should be valid');

  // Generate skill content
  const skillContent = skillGenerator.generateSkillContent(results[0]);
  assert(skillContent.includes('Test Skill'), 'Should contain skill name');
  assert(skillContent.includes('## Purpose'), 'Should have Purpose section');
});

// Test 6: Error handling - missing transcript
test('should handle missing transcript file gracefully', () => {
  const records = transcriptReader.parseFile('/nonexistent/file.jsonl');
  assert.strictEqual(records, null, 'Should return null for missing file');
});

// Test 7: Multiple skills generation
test('should handle multiple learning results', () => {
  const results = [
    {
      name: 'Skill One',
      description: 'First skill',
      problem: 'Problem 1',
      solution: 'Solution 1',
      steps: ['Step 1'],
      keywords: ['keyword1']
    },
    {
      name: 'Skill Two',
      description: 'Second skill',
      problem: 'Problem 2',
      solution: 'Solution 2',
      steps: ['Step 2'],
      keywords: ['keyword2']
    }
  ];

  const validResults = llmAnalyzer.filterValidResults(results);
  assert.strictEqual(validResults.length, 2, 'Should have 2 valid results');

  // Generate content for each
  for (const result of validResults) {
    const content = skillGenerator.generateSkillContent(result);
    assert(skillGenerator.validateSkillContent(content), 'Each skill should be valid');
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

// Cleanup
try {
  fs.rmdirSync(fixturesDir);
} catch (e) {
  // Ignore
}

process.exit(failed > 0 ? 1 : 0);

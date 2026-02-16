#!/usr/bin/env node
/**
 * Unit tests for transcript-reader module
 * Tests the reading and parsing of Claude Code transcript files (JSONL format)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load the module under test
const transcriptReader = require(path.join(__dirname, '..', 'lib', 'transcript-reader.js'));

console.log('Running transcript-reader tests...\n');

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

// Create test fixtures directory
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Test 1: Parse valid JSONL file
test('should parse valid JSONL file', () => {
  const testFile = path.join(fixturesDir, 'test-valid.jsonl');
  fs.writeFileSync(testFile, JSON.stringify({ type: 'user', message: { content: 'Hello' } }) + '\n' +
                              JSON.stringify({ type: 'assistant', message: { content: 'Hi there' } }) + '\n');

  const records = transcriptReader.parseFile(testFile);
  assert.strictEqual(records.length, 2, 'Should have 2 records');
  assert.strictEqual(records[0].type, 'user', 'First record should be user');
  assert.strictEqual(records[1].type, 'assistant', 'Second record should be assistant');

  fs.unlinkSync(testFile);
});

// Test 2: Handle empty file
test('should handle empty file', () => {
  const testFile = path.join(fixturesDir, 'test-empty.jsonl');
  fs.writeFileSync(testFile, '');

  const records = transcriptReader.parseFile(testFile);
  assert.strictEqual(records.length, 0, 'Empty file should return empty array');

  fs.unlinkSync(testFile);
});

// Test 3: Handle file not found
test('should handle file not found', () => {
  const records = transcriptReader.parseFile('/nonexistent/path/file.jsonl');
  assert.strictEqual(records, null, 'Non-existent file should return null');
});

// Test 4: Extract user messages
test('should extract user messages', () => {
  const testFile = path.join(fixturesDir, 'test-user.jsonl');
  fs.writeFileSync(testFile, JSON.stringify({ type: 'user', message: { content: 'Question 1' } }) + '\n' +
                              JSON.stringify({ type: 'assistant', message: { content: 'Answer 1' } }) + '\n' +
                              JSON.stringify({ type: 'user', message: { content: 'Question 2' } }) + '\n');

  const records = transcriptReader.parseFile(testFile);
  const userMessages = transcriptReader.extractUserMessages(records);

  assert.strictEqual(userMessages.length, 2, 'Should have 2 user messages');
  assert.strictEqual(userMessages[0], 'Question 1', 'First message should be Question 1');
  assert.strictEqual(userMessages[1], 'Question 2', 'Second message should be Question 2');

  fs.unlinkSync(testFile);
});

// Test 5: Extract conversation text
test('should extract full conversation text', () => {
  const testFile = path.join(fixturesDir, 'test-conversation.jsonl');
  fs.writeFileSync(testFile, JSON.stringify({ type: 'user', message: { content: 'Hello' } }) + '\n' +
                              JSON.stringify({ type: 'assistant', message: { content: 'Hi' } }) + '\n');

  const records = transcriptReader.parseFile(testFile);
  const text = transcriptReader.extractConversationText(records);

  assert(text.includes('Hello'), 'Should contain user message');
  assert(text.includes('Hi'), 'Should contain assistant message');

  fs.unlinkSync(testFile);
});

// Test 6: Handle tool_use records
test('should handle tool_use records', () => {
  const testFile = path.join(fixturesDir, 'test-tool.jsonl');
  fs.writeFileSync(testFile, JSON.stringify({ type: 'tool_use', tool: 'Read', input: { file_path: '/test' } }) + '\n');

  const records = transcriptReader.parseFile(testFile);
  assert.strictEqual(records.length, 1, 'Should have 1 record');
  assert.strictEqual(records[0].type, 'tool_use', 'Should be tool_use type');
  assert.strictEqual(records[0].tool, 'Read', 'Tool name should be Read');

  fs.unlinkSync(testFile);
});

// Test 7: Handle malformed JSON lines
test('should skip malformed JSON lines', () => {
  const testFile = path.join(fixturesDir, 'test-malformed.jsonl');
  fs.writeFileSync(testFile, '{"type": "user", "message": {"content": "Valid"}}\n' +
                              'this is not json\n' +
                              '{"type": "assistant", "message": {"content": "Also valid"}}\n');

  const records = transcriptReader.parseFile(testFile);
  assert.strictEqual(records.length, 2, 'Should skip malformed line and return 2 records');

  fs.unlinkSync(testFile);
});

// Test 8: Large file handling (streaming)
test('should handle large files efficiently', () => {
  const testFile = path.join(fixturesDir, 'test-large.jsonl');
  const lines = [];
  for (let i = 0; i < 100; i++) {
    lines.push(JSON.stringify({ type: 'user', message: { content: `Message ${i}` } }));
  }
  fs.writeFileSync(testFile, lines.join('\n'));

  const records = transcriptReader.parseFile(testFile);
  assert.strictEqual(records.length, 100, 'Should parse all 100 records');

  fs.unlinkSync(testFile);
});

// Test 9: readFile convenience method
test('should provide readFile convenience method', () => {
  const testFile = path.join(fixturesDir, 'test-read.jsonl');
  fs.writeFileSync(testFile, JSON.stringify({ type: 'user', message: { content: 'Test' } }) + '\n');

  const result = transcriptReader.readFile(testFile);
  assert(result !== null, 'readFile should return result');
  assert(Array.isArray(result.records), 'Should have records array');
  assert.strictEqual(result.records.length, 1, 'Should have 1 record');

  fs.unlinkSync(testFile);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

// Cleanup fixtures directory if empty
try {
  fs.rmdirSync(fixturesDir);
} catch (e) {
  // Directory not empty or doesn't exist, ignore
}

process.exit(failed > 0 ? 1 : 0);

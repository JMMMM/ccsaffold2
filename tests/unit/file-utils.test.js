/**
 * Unit tests for file-utils module
 * Tests: ensureDirectoryExists, getLogFilePath, appendToFile, readFileLines, writeLinesToFile
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module to test (will fail until implemented)
let fileUtils;
try {
  fileUtils = require('../../src/lib/file-utils');
} catch (e) {
  // Module doesn't exist yet - expected in TDD
}

// Test helpers
const testDir = path.join(os.tmpdir(), 'session-logging-test-' + Date.now());

function cleanup() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

function setup() {
  cleanup();
  fs.mkdirSync(testDir, { recursive: true });
}

// Test cases
const tests = {
  'ensureDirectoryExists: should create directory if not exists': () => {
    setup();
    const targetDir = path.join(testDir, 'subdir', 'nested');

    fileUtils.ensureDirectoryExists(targetDir);

    assert.ok(fs.existsSync(targetDir), 'Directory should be created');
    cleanup();
  },

  'ensureDirectoryExists: should not fail if directory exists': () => {
    setup();
    const targetDir = path.join(testDir, 'existing');
    fs.mkdirSync(targetDir);

    // Should not throw
    fileUtils.ensureDirectoryExists(targetDir);

    assert.ok(fs.existsSync(targetDir), 'Directory should still exist');
    cleanup();
  },

  'getLogFilePath: should return correct path': () => {
    const logPath = fileUtils.getLogFilePath();

    assert.ok(logPath.endsWith('.claude/conversations/conversation.txt'),
      'Path should end with correct relative path');
    assert.ok(path.isAbsolute(logPath), 'Path should be absolute');
  },

  'appendToFile: should append content to file': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');

    fileUtils.appendToFile(testFile, 'line1\n');
    fileUtils.appendToFile(testFile, 'line2\n');

    const content = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(content, 'line1\nline2\n', 'Content should be appended');
    cleanup();
  },

  'appendToFile: should create file if not exists': () => {
    setup();
    const testFile = path.join(testDir, 'new.txt');

    fileUtils.appendToFile(testFile, 'first line\n');

    assert.ok(fs.existsSync(testFile), 'File should be created');
    cleanup();
  },

  'readFileLines: should return array of lines': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'line1\nline2\nline3\n');

    const lines = fileUtils.readFileLines(testFile);

    assert.deepStrictEqual(lines, ['line1', 'line2', 'line3'], 'Should return lines array');
    cleanup();
  },

  'readFileLines: should return empty array for non-existent file': () => {
    setup();
    const testFile = path.join(testDir, 'nonexistent.txt');

    const lines = fileUtils.readFileLines(testFile);

    assert.deepStrictEqual(lines, [], 'Should return empty array');
    cleanup();
  },

  'writeLinesToFile: should write lines to file': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    const lines = ['line1', 'line2', 'line3'];

    fileUtils.writeLinesToFile(testFile, lines);

    const content = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(content, 'line1\nline2\nline3\n', 'Should write lines with newlines');
    cleanup();
  },

  'writeLinesToFile: should overwrite existing file': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'old content\n');

    fileUtils.writeLinesToFile(testFile, ['new line']);

    const content = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(content, 'new line\n', 'Should overwrite file');
    cleanup();
  }
};

// Run tests
function runTests() {
  if (!fileUtils) {
    console.log('❌ file-utils module not implemented yet (expected in TDD)');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const [name, test] of Object.entries(tests)) {
    try {
      test();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

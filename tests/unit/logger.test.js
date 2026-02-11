/**
 * Unit tests for logger module
 * Tests: formatEntry, countUserLines, scrollToLimit
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module to test (will fail until implemented)
let logger;
try {
  logger = require('../../src/lib/logger');
} catch (e) {
  // Module doesn't exist yet - expected in TDD
}

// Test helpers
const testDir = path.join(os.tmpdir(), 'logger-test-' + Date.now());

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
  'formatEntry: should format user entry with user> prefix': () => {
    const entry = logger.formatEntry('user', 'Hello, this is a test');

    assert.strictEqual(entry, 'user> Hello, this is a test', 'Should have user> prefix');
  },

  'formatEntry: should format claude entry with claude> prefix': () => {
    const entry = logger.formatEntry('claude', '[Edit] src/test.js');

    assert.strictEqual(entry, 'claude> [Edit] src/test.js', 'Should have claude> prefix');
  },

  'formatEntry: should escape newlines in content': () => {
    const entry = logger.formatEntry('user', 'line1\nline2');

    assert.ok(!entry.includes('\n'), 'Should not contain raw newline');
    assert.ok(entry.includes('\\n'), 'Should contain escaped newline');
  },

  'formatEntry: should truncate very long content': () => {
    const longContent = 'a'.repeat(20000);
    const entry = logger.formatEntry('user', longContent);

    assert.ok(entry.length < 10500, 'Entry should be truncated');
  },

  'countUserLines: should count lines starting with user>': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'user> line1\nclaude> tool1\nuser> line2\nuser> line3\n');

    const count = logger.countUserLines(testFile);

    assert.strictEqual(count, 3, 'Should count 3 user lines');
    cleanup();
  },

  'countUserLines: should return 0 for empty file': () => {
    setup();
    const testFile = path.join(testDir, 'empty.txt');
    fs.writeFileSync(testFile, '');

    const count = logger.countUserLines(testFile);

    assert.strictEqual(count, 0, 'Should return 0 for empty file');
    cleanup();
  },

  'countUserLines: should return 0 for non-existent file': () => {
    setup();
    const testFile = path.join(testDir, 'nonexistent.txt');

    const count = logger.countUserLines(testFile);

    assert.strictEqual(count, 0, 'Should return 0 for non-existent file');
    cleanup();
  },

  'scrollToLimit: should not modify file if under limit': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    const lines = [];
    for (let i = 0; i < 50; i++) {
      lines.push(`user> prompt ${i}`);
      lines.push(`claude> tool ${i}`);
    }
    fs.writeFileSync(testFile, lines.join('\n') + '\n');
    const originalContent = fs.readFileSync(testFile, 'utf8');

    logger.scrollToLimit(testFile, 100);

    const content = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(content, originalContent, 'File should not be modified');
    cleanup();
  },

  'scrollToLimit: should remove entries if over limit': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    const lines = [];
    for (let i = 0; i < 120; i++) {
      lines.push(`user> prompt ${i}`);
      lines.push(`claude> tool ${i}`);
    }
    fs.writeFileSync(testFile, lines.join('\n') + '\n');

    logger.scrollToLimit(testFile, 100);

    const content = fs.readFileSync(testFile, 'utf8');
    const userCount = (content.match(/^user>/gm) || []).length;
    assert.ok(userCount <= 100, `User lines should be <= 100, got ${userCount}`);
    assert.ok(userCount > 60, `User lines should be > 60 (removed ~1/3), got ${userCount}`);
    cleanup();
  },

  'scrollToLimit: should preserve entry boundaries': () => {
    setup();
    const testFile = path.join(testDir, 'test.txt');
    const lines = [];
    for (let i = 0; i < 110; i++) {
      lines.push(`user> prompt ${i}`);
      lines.push(`claude> tool ${i}`);
    }
    fs.writeFileSync(testFile, lines.join('\n') + '\n');

    logger.scrollToLimit(testFile, 100);

    const content = fs.readFileSync(testFile, 'utf8');
    // Each line should start with user> or claude>
    const allLines = content.trim().split('\n');
    for (const line of allLines) {
      assert.ok(line.startsWith('user>') || line.startsWith('claude>'),
        `Line should start with prefix: ${line.substring(0, 30)}`);
    }
    cleanup();
  }
};

// Run tests
function runTests() {
  if (!logger) {
    console.log('❌ logger module not implemented yet (expected in TDD)');
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

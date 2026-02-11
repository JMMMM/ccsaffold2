/**
 * Integration test for rolling update functionality
 * Tests the complete flow of logging and scrolling
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Test helpers
const testDir = path.join(os.tmpdir(), 'rolling-update-test-' + Date.now());

function cleanup() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

function setup() {
  cleanup();
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(path.join(testDir, '.claude', 'conversations'), { recursive: true });
}

function getLogFile() {
  return path.join(testDir, '.claude', 'conversations', 'conversation.txt');
}

// Test cases
const tests = {
  'rolling update: should trigger when user lines exceed 100': () => {
    setup();

    const logFile = getLogFile();
    const originalDir = process.cwd();

    // Create 105 user entries (over the limit)
    for (let i = 0; i < 105; i++) {
      const inputFile = path.join(testDir, `input-${i}.json`);
      const inputData = {
        event: 'UserPromptSubmit',
        data: {
          prompt: `Test prompt ${i}`,
          session_id: 'test-session'
        }
      };
      fs.writeFileSync(inputFile, JSON.stringify(inputData));

      process.chdir(testDir);
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      process.chdir(originalDir);
    }

    // Verify user lines are now under 100
    const content = fs.readFileSync(logFile, 'utf8');
    const userLines = (content.match(/^user>/gm) || []).length;

    assert.ok(userLines <= 100, `User lines should be <= 100, got ${userLines}`);
    assert.ok(userLines > 60, `User lines should be > 60, got ${userLines}`);

    cleanup();
  },

  'rolling update: should preserve entry order': () => {
    setup();

    const logFile = getLogFile();
    const originalDir = process.cwd();

    // Create entries and verify order
    for (let i = 0; i < 110; i++) {
      const inputFile = path.join(testDir, `input-${i}.json`);
      const inputData = {
        event: 'UserPromptSubmit',
        data: {
          prompt: `Prompt ${String(i).padStart(3, '0')}`,
          session_id: 'test-session'
        }
      };
      fs.writeFileSync(inputFile, JSON.stringify(inputData));

      process.chdir(testDir);
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      process.chdir(originalDir);
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n');

    // Find the first and last user entry numbers
    const firstUserMatch = lines[0].match(/Prompt (\d+)/);
    const lastUserMatch = lines[lines.length - 1].match(/Prompt (\d+)/);

    assert.ok(firstUserMatch, 'Should find first user entry');
    assert.ok(lastUserMatch, 'Should find last user entry');

    const firstNum = parseInt(firstUserMatch[1]);
    const lastNum = parseInt(lastUserMatch[1]);

    assert.ok(lastNum > firstNum, 'Last entry should have higher number than first');
    assert.ok(firstNum > 30, `First entry should be after removed entries, got ${firstNum}`);

    cleanup();
  },

  'rolling update: should work with mixed user and claude entries': () => {
    setup();

    const logFile = getLogFile();
    const originalDir = process.cwd();

    // Create alternating user and claude entries
    for (let i = 0; i < 60; i++) {
      // User entry
      const userFile = path.join(testDir, `user-${i}.json`);
      fs.writeFileSync(userFile, JSON.stringify({
        event: 'UserPromptSubmit',
        data: { prompt: `User prompt ${i}`, session_id: 'test' }
      }));
      process.chdir(testDir);
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${userFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      process.chdir(originalDir);

      // Claude entry
      const claudeFile = path.join(testDir, `claude-${i}.json`);
      fs.writeFileSync(claudeFile, JSON.stringify({
        event: 'PostToolUse',
        data: { tool: 'Edit', tool_input: { file_path: `/file${i}.js` }, session_id: 'test' }
      }));
      process.chdir(testDir);
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${claudeFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      process.chdir(originalDir);
    }

    // Total 60 user entries, should not trigger scroll
    const content = fs.readFileSync(logFile, 'utf8');
    const userLines = (content.match(/^user>/gm) || []).length;
    const claudeLines = (content.match(/^claude>/gm) || []).length;

    assert.strictEqual(userLines, 60, 'Should have 60 user entries');
    assert.strictEqual(claudeLines, 60, 'Should have 60 claude entries');

    cleanup();
  },

  'rolling update: should handle rapid consecutive writes': () => {
    setup();

    const logFile = getLogFile();
    const originalDir = process.cwd();

    // Rapidly write 120 entries
    for (let i = 0; i < 120; i++) {
      const inputFile = path.join(testDir, `input-${i}.json`);
      fs.writeFileSync(inputFile, JSON.stringify({
        event: 'UserPromptSubmit',
        data: { prompt: `Rapid ${i}`, session_id: 'test' }
      }));
      process.chdir(testDir);
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      process.chdir(originalDir);
    }

    // Verify file is valid and within limits
    const content = fs.readFileSync(logFile, 'utf8');
    const userLines = (content.match(/^user>/gm) || []).length;

    assert.ok(userLines <= 100, `User lines should be <= 100, got ${userLines}`);

    // Verify each line starts with correct prefix
    const lines = content.trim().split('\n');
    for (const line of lines) {
      assert.ok(
        line.startsWith('user>') || line.startsWith('claude>'),
        `Line should start with valid prefix: ${line.substring(0, 20)}`
      );
    }

    cleanup();
  }
};

// Run tests
function runTests() {
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

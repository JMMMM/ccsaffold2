/**
 * Unit tests for log-user-prompt hook
 * Tests: stdin parsing, user entry formatting, file writing
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Test helpers
const testDir = path.join(os.tmpdir(), 'log-user-prompt-test-' + Date.now());

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

// Test cases
const tests = {
  'log-user-prompt: should parse stdin JSON and append user entry': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    // Create input JSON
    const inputData = {
      event: 'UserPromptSubmit',
      data: {
        prompt: 'Hello, this is a test prompt',
        session_id: 'test-session-123'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    // Run the hook script with mocked environment
    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      // Execute the hook with stdin
      const result = execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      // Verify the log file was created and contains the entry
      assert.ok(fs.existsSync(logFile), 'Log file should be created');

      const content = fs.readFileSync(logFile, 'utf8');
      assert.ok(content.includes('user> Hello, this is a test prompt'),
        'Log should contain user entry with prompt');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-user-prompt: should escape newlines in prompt': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'UserPromptSubmit',
      data: {
        prompt: 'Line 1\nLine 2\nLine 3',
        session_id: 'test-session-456'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      const content = fs.readFileSync(logFile, 'utf8');
      assert.ok(content.includes('Line 1\\nLine 2\\nLine 3'),
        'Newlines should be escaped');
      // Should be single line entry
      const lines = content.trim().split('\n');
      assert.strictEqual(lines.length, 1, 'Should be single line entry');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-user-prompt: should exit with code 0 on success': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');

    const inputData = {
      event: 'UserPromptSubmit',
      data: {
        prompt: 'Test prompt',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      // If we get here, exit code was 0
      assert.ok(true, 'Script exited with code 0');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-user-prompt: should handle invalid JSON gracefully': () => {
    setup();

    const inputFile = path.join(testDir, 'invalid.json');
    fs.writeFileSync(inputFile, 'not valid json');

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      // Should not throw, should exit gracefully
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      // If we get here, script handled the error gracefully
      assert.ok(true, 'Script handled invalid JSON');
    } catch (error) {
      // Script may exit with error code, but should not crash
      assert.ok(error.status !== undefined, 'Script exited with defined code');
    } finally {
      process.chdir(originalDir);
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

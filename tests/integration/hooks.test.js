/**
 * Integration test for full hooks workflow
 * Tests the complete UserPromptSubmit -> PostToolUse -> Log workflow
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Test helpers
const testDir = path.join(os.tmpdir(), 'hooks-integration-test-' + Date.now());

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

const originalDir = process.cwd();

function runUserPrompt(prompt) {
  const inputFile = path.join(testDir, 'user-input.json');
  fs.writeFileSync(inputFile, JSON.stringify({
    event: 'UserPromptSubmit',
    data: { prompt, session_id: 'test-session' }
  }));
  process.chdir(testDir);
  execSync(
    `node ${path.join(originalDir, 'src/hooks/log-user-prompt.js')} < ${inputFile}`,
    { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
  );
  process.chdir(originalDir);
}

function runToolUse(tool, toolInput) {
  const inputFile = path.join(testDir, 'tool-input.json');
  fs.writeFileSync(inputFile, JSON.stringify({
    event: 'PostToolUse',
    data: { tool, tool_input: toolInput, session_id: 'test-session' }
  }));
  process.chdir(testDir);
  execSync(
    `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
    { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
  );
  process.chdir(originalDir);
}

// Test cases
const tests = {
  'full workflow: user prompt followed by tool use': () => {
    setup();

    runUserPrompt('Create a new React component');
    runToolUse('Write', { file_path: '/src/components/Button.tsx', content: 'export const Button = () => {}' });

    const content = fs.readFileSync(getLogFile(), 'utf8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 2, 'Should have 2 entries');
    assert.ok(lines[0].startsWith('user>'), 'First line should be user entry');
    assert.ok(lines[1].startsWith('claude>'), 'Second line should be claude entry');
    assert.ok(lines[1].includes('[Write]'), 'Should show Write tool');

    cleanup();
  },

  'full workflow: multiple prompts and tools': () => {
    setup();

    runUserPrompt('Fix the bug in app.js');
    runToolUse('Edit', { file_path: '/src/app.js', old_string: 'bug', new_string: 'fix' });
    runUserPrompt('Run the tests');
    runToolUse('Bash', { command: 'npm test', description: 'Run tests' });

    const content = fs.readFileSync(getLogFile(), 'utf8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 4, 'Should have 4 entries');
    assert.ok(lines[0].startsWith('user>'), 'Entry 1 should be user');
    assert.ok(lines[1].startsWith('claude>'), 'Entry 2 should be claude');
    assert.ok(lines[2].startsWith('user>'), 'Entry 3 should be user');
    assert.ok(lines[3].startsWith('claude>'), 'Entry 4 should be claude');

    cleanup();
  },

  'full workflow: excluded tools are not logged': () => {
    setup();

    runUserPrompt('Search for TODO comments');
    runToolUse('Grep', { pattern: 'TODO', path: '/src' }); // Should not be logged
    runUserPrompt('What files do we have?');
    runToolUse('Glob', { pattern: '**/*.js' }); // Should not be logged
    runToolUse('Bash', { command: 'ls -la' }); // Should be logged

    const content = fs.readFileSync(getLogFile(), 'utf8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 3, 'Should have 3 entries (2 user + 1 bash)');
    assert.ok(!content.includes('Grep'), 'Should not contain Grep');
    assert.ok(!content.includes('Glob'), 'Should not contain Glob');
    assert.ok(content.includes('Bash'), 'Should contain Bash');

    cleanup();
  },

  'full workflow: rolling update triggers correctly': () => {
    setup();

    // Add 105 user prompts to trigger rolling
    for (let i = 0; i < 105; i++) {
      runUserPrompt(`Prompt ${i}`);
    }

    const content = fs.readFileSync(getLogFile(), 'utf8');
    const userLines = (content.match(/^user>/gm) || []).length;

    assert.ok(userLines <= 100, `User lines should be <= 100 after scroll, got ${userLines}`);

    cleanup();
  },

  'full workflow: special characters are handled': () => {
    setup();

    runUserPrompt('Test with "quotes" and \'apostrophes\'');
    runUserPrompt('Test with\nnewlines\nand\ttabs');
    runToolUse('Bash', { command: 'echo "hello world"' });

    const content = fs.readFileSync(getLogFile(), 'utf8');

    // Verify no raw newlines in entries (should be escaped)
    const lines = content.trim().split('\n');
    assert.ok(lines.length === 3, 'Should have 3 lines');

    // Verify escaped newlines
    assert.ok(content.includes('\\n'), 'Newlines should be escaped');

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

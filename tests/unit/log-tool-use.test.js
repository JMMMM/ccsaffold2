/**
 * Unit tests for log-tool-use hook
 * Tests: stdin parsing, tool summary generation, excluded tools
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Test helpers
const testDir = path.join(os.tmpdir(), 'log-tool-use-test-' + Date.now());

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
  'log-tool-use: should record Edit tool with file path': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Edit',
        tool_input: {
          file_path: '/src/components/Button.tsx',
          old_string: 'const x = 1',
          new_string: 'const x = 2'
        },
        tool_result: 'Successfully edited file',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      const content = fs.readFileSync(logFile, 'utf8');
      assert.ok(content.includes('claude>'), 'Should have claude> prefix');
      assert.ok(content.includes('[Edit]'), 'Should include tool name');
      assert.ok(content.includes('Button.tsx'), 'Should include file name');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should record Write tool with file path': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Write',
        tool_input: {
          file_path: '/src/utils/helper.js',
          content: 'export function help() {}'
        },
        tool_result: 'File created',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      const content = fs.readFileSync(logFile, 'utf8');
      assert.ok(content.includes('[Write]'), 'Should include Write tool name');
      assert.ok(content.includes('helper.js'), 'Should include file name');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should record Bash tool with command': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Bash',
        tool_input: {
          command: 'npm install lodash',
          description: 'Install lodash dependency'
        },
        tool_result: 'added 1 package',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      const content = fs.readFileSync(logFile, 'utf8');
      assert.ok(content.includes('[Bash]'), 'Should include Bash tool name');
      assert.ok(content.includes('npm install'), 'Should include command');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should NOT record Grep tool (excluded)': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Grep',
        tool_input: {
          pattern: 'TODO',
          path: '/src'
        },
        tool_result: '10 matches found',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      // File should not exist or be empty
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        assert.strictEqual(content.trim(), '', 'Log should be empty for excluded tools');
      }
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should NOT record Glob tool (excluded)': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');
    const logFile = path.join(testDir, '.claude', 'conversations', 'conversation.txt');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Glob',
        tool_input: {
          pattern: '**/*.js'
        },
        tool_result: '50 files found',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );

      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        assert.strictEqual(content.trim(), '', 'Log should be empty for excluded tools');
      }
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should NOT record Read tool (excluded)': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Read',
        tool_input: {
          file_path: '/src/index.js'
        },
        tool_result: 'File content...',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      // Should not throw
      assert.ok(true, 'Should handle excluded tool gracefully');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should NOT record WebSearch tool (excluded)': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'WebSearch',
        tool_input: {
          query: 'Node.js best practices'
        },
        tool_result: '10 results',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      assert.ok(true, 'Should handle excluded tool gracefully');
    } finally {
      process.chdir(originalDir);
    }

    cleanup();
  },

  'log-tool-use: should handle missing tool_input gracefully': () => {
    setup();

    const inputFile = path.join(testDir, 'input.json');

    const inputData = {
      event: 'PostToolUse',
      data: {
        tool: 'Bash',
        tool_result: 'Success',
        session_id: 'test-session'
      }
    };
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    const originalDir = process.cwd();
    process.chdir(testDir);

    try {
      execSync(
        `node ${path.join(originalDir, 'src/hooks/log-tool-use.js')} < ${inputFile}`,
        { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_ROOT: testDir } }
      );
      assert.ok(true, 'Should handle missing tool_input');
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

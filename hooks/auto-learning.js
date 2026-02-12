#!/usr/bin/env node
/**
 * Auto-Learning Hook (Async Dispatcher)
 * Triggered on sessionEnd event to spawn async learning worker
 *
 * This hook returns immediately and spawns a detached child process
 * to perform the actual learning analysis.
 *
 * stdin input format:
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "/path/to/transcript.jsonl",
 *   "cwd": "/Users/...",
 *   "hook_event_name": "sessionEnd"
 * }
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Load llm-analyzer for API check
const libDir = path.join(__dirname, '..', 'lib');
const llmAnalyzer = require(path.join(libDir, 'llm-analyzer.js'));

// Path to worker script
const workerPath = path.join(__dirname, 'auto-learning-worker.js');

/**
 * Main hook handler - returns immediately (T001, FR-001)
 */
function main() {
  let data = '';

  // Read stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    data += chunk;
  });

  process.stdin.on('end', () => {
    try {
      processHook(data);
    } catch (e) {
      // Silent failure - don't block session end (T021)
      console.error('[Auto-Learning] ERROR:', e.message);
    }
    // Always exit 0 immediately (T001, FR-001)
    process.exit(0);
  });
}

/**
 * Process the hook input and spawn worker (T017)
 * @param {string} inputData - Raw stdin data
 */
function processHook(inputData) {
  // Parse hook input
  const input = parseInput(inputData);
  if (!input) {
    return;
  }

  // Verify it's a SessionEnd event
  if (input.hook_event_name !== 'SessionEnd') {
    return;
  }

  // Get required fields
  const sessionId = input.session_id;
  const transcriptPath = input.transcript_path;
  const cwd = input.cwd;

  if (!sessionId || !transcriptPath || !cwd) {
    return;
  }

  // Check if API is available
  if (!llmAnalyzer.isApiAvailable()) {
    console.log('[Auto-Learning] INFO: ANTHROPIC_AUTH_TOKEN not set, skipping');
    return;
  }

  // Spawn async worker (T018, T019, T020)
  spawnWorker(sessionId, transcriptPath, cwd);
}

/**
 * Spawn the worker process in detached mode (T018, T019)
 * @param {string} sessionId - Session ID
 * @param {string} transcriptPath - Path to transcript file
 * @param {string} cwd - Working directory
 */
function spawnWorker(sessionId, transcriptPath, cwd) {
  // Build config for worker
  const config = JSON.stringify({
    session_id: sessionId,
    transcript_path: transcriptPath,
    cwd: cwd
  });

  // Build log path for terminal output
  const logPath = path.join('.claude', 'logs', 'continuous-learning', `learning-${sessionId}.log`);

  try {
    // Spawn detached child process (T018)
    const child = spawn(process.execPath, [workerPath, config], {
      detached: true,        // Child runs independently
      stdio: 'ignore',       // Don't pipe stdio
      cwd: cwd               // Set working directory
    });

    // Allow parent to exit independently (T019)
    child.unref();

    // Terminal output (T020)
    console.log(`[Auto-Learning] INFO: Starting async learning for session ${sessionId}`);
    console.log(`[Auto-Learning] INFO: Log file: ${logPath}`);

  } catch (e) {
    // Fallback handling (T021)
    console.error('[Auto-Learning] ERROR: Failed to spawn worker:', e.message);
  }
}

/**
 * Parse hook input from stdin
 * @param {string} data - Raw input data
 * @returns {Object|null} Parsed input or null
 */
function parseInput(data) {
  if (!data || typeof data !== 'string') {
    return null;
  }

  try {
    return JSON.parse(data.trim());
  } catch (e) {
    return null;
  }
}

// Run the hook
main();

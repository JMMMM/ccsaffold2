#!/usr/bin/env node
/**
 * Auto-Learning Hook
 * Triggered on sessionEnd event to analyze transcript and generate skills
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

const path = require('path');

// Load lib modules using __dirname for cross-platform compatibility
const libDir = path.join(__dirname, '..', 'lib');
const transcriptReader = require(path.join(libDir, 'transcript-reader.js'));
const sensitiveFilter = require(path.join(libDir, 'sensitive-filter.js'));
const llmAnalyzer = require(path.join(libDir, 'llm-analyzer.js'));
const skillGenerator = require(path.join(libDir, 'skill-generator.js'));

/**
 * Main hook handler
 */
async function main() {
  let data = '';

  // Read stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    data += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      await processHook(data);
    } catch (e) {
      // Silent failure - don't block session end
      console.error('Auto-learning error:', e.message);
    }
    // Always exit 0 to avoid blocking Claude Code
    process.exit(0);
  });
}

/**
 * Process the hook input
 * @param {string} inputData - Raw stdin data
 */
async function processHook(inputData) {
  // Parse hook input
  const input = parseInput(inputData);
  if (!input) {
    return;
  }

  // Verify it's a SessionEnd event
  if (input.hook_event_name !== 'SessionEnd') {
    return;
  }

  // Get transcript path and working directory
  const transcriptPath = input.transcript_path;
  const cwd = input.cwd;

  if (!transcriptPath || !cwd) {
    return;
  }

  // Check if API is available
  if (!llmAnalyzer.isApiAvailable()) {
    console.log('Auto-learning: ANTHROPIC_AUTH_TOKEN not set, skipping');
    return;
  }

  // Read transcript
  const records = transcriptReader.parseFile(transcriptPath);
  if (!records || records.length === 0) {
    console.log('Auto-learning: No transcript records found');
    return;
  }

  // Extract conversation text
  const conversationText = transcriptReader.extractConversationText(records);

  // Filter sensitive information
  const filteredText = sensitiveFilter.filter(conversationText);

  // Analyze with LLM
  console.log('Auto-learning: Analyzing session for learning opportunities...');
  const results = await llmAnalyzer.analyze(filteredText);

  if (!results || results.length === 0) {
    console.log('Auto-learning: No learnable content found');
    return;
  }

  // Generate skills with deduplication
  console.log(`Auto-learning: Found ${results.length} learning opportunity(es)`);
  for (const result of results) {
    const writeResult = skillGenerator.writeSkillFileWithDedup(cwd, result, true);
    if (writeResult.path) {
      if (writeResult.merged) {
        console.log(`Auto-learning: Updated existing skill: ${writeResult.path}`);
      } else {
        console.log(`Auto-learning: Created new skill: ${writeResult.path}`);
      }
    }
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

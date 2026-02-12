#!/usr/bin/env node
/**
 * Auto-Learning Worker Process
 * Runs asynchronously to analyze transcript and generate skills
 *
 * Command line: node auto-learning-worker.js '<json_config>'
 *
 * Config format:
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "/path/to/transcript.jsonl",
 *   "cwd": "/Users/..."
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
const learningLogger = require(path.join(libDir, 'learning-logger.js'));

/**
 * Main worker entry point
 */
async function main() {
  let logger = null;

  try {
    // Parse config from command line argument (T013)
    const config = parseConfig();
    if (!config) {
      process.exit(1);
    }

    const { session_id, transcript_path, cwd } = config;

    // Create logger instance (T005)
    logger = learningLogger.createLogger(session_id, cwd);

    // Log initialization (T015)
    logger.log('INFO', 'init', 'Starting async learning', { session_id });

    // Run the learning process
    await runLearningProcess(transcript_path, cwd, logger);

    // Log completion (T030)
    logger.log('INFO', 'complete', 'Async learning completed');

    process.exit(0);
  } catch (e) {
    // Log error (T016)
    if (logger) {
      logger.logError('error', 'Worker failed', e);
    } else {
      console.error('[Auto-Learning] ERROR:', e.message);
    }
    // Exit gracefully (T016 - don't crash)
    process.exit(0);
  }
}

/**
 * Parse configuration from command line
 * @returns {Object|null} Parsed config or null
 */
function parseConfig() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('[Auto-Learning] ERROR: No config provided');
    return null;
  }

  try {
    return JSON.parse(args[0]);
  } catch (e) {
    console.error('[Auto-Learning] ERROR: Invalid JSON config');
    return null;
  }
}

/**
 * Run the learning process (T014)
 * @param {string} transcriptPath - Path to transcript file
 * @param {string} cwd - Working directory
 * @param {Object} logger - Logger instance
 */
async function runLearningProcess(transcriptPath, cwd, logger) {
  // Check if API is available (T037)
  if (!llmAnalyzer.isApiAvailable()) {
    logger.log('WARN', 'init', 'ANTHROPIC_AUTH_TOKEN not set, skipping');
    return;
  }

  // Read transcript (T022)
  const readStart = Date.now();
  const records = transcriptReader.parseFile(transcriptPath);
  logger.logStep('read_transcript', 'Transcript loaded', {
    path: transcriptPath,
    record_count: records ? records.length : 0
  }, readStart);

  // Check records (T036)
  if (!records || records.length === 0) {
    logger.log('WARN', 'read_transcript', 'No transcript records found', {
      path: transcriptPath
    });
    return;
  }

  // Parse transcript (T023)
  const parseStart = Date.now();
  const conversationText = transcriptReader.extractConversationText(records);
  logger.logStep('parse_transcript', 'Conversation text extracted', {
    text_length: conversationText ? conversationText.length : 0
  }, parseStart);

  // Filter sensitive information (T024)
  const filterStart = Date.now();
  const originalLength = conversationText ? conversationText.length : 0;
  const filteredText = sensitiveFilter.filter(conversationText);
  const filteredLength = filteredText ? filteredText.length : 0;
  logger.logStep('filter_sensitive', 'Sensitive information filtered', {
    original_length: originalLength,
    filtered_length: filteredLength
  }, filterStart);

  // Analyze with LLM
  const llmStart = Date.now();
  logger.log('INFO', 'llm_call', 'Starting LLM analysis');

  // Log request details (T025)
  logger.log('DEBUG', 'llm_request', 'Sending request to LLM', {
    text_preview: filteredText ? filteredText.substring(0, 200) + '...' : null
  });

  const results = await llmAnalyzer.analyze(filteredText);

  // Log response details (T026)
  logger.log('DEBUG', 'llm_response', 'LLM response received', {
    has_reasoning: results && !!results.reasoning,
    skills_count: results && results.skills ? results.skills.length : 0
  });

  // Log thinking process (深度思考过程)
  if (results && results.reasoning) {
    logger.log('INFO', 'llm_thinking', 'Deep thinking process', {
      reasoning: results.reasoning
    });
    // 同时输出到终端
    console.log('[Think] 深度思考过程:');
    console.log(results.reasoning);
  }

  logger.logStep('llm_call', 'LLM analysis completed', {
    skills_count: results && results.skills ? results.skills.length : 0
  }, llmStart);

  // Check results
  if (!results || !results.skills || results.skills.length === 0) {
    logger.log('INFO', 'generate_skill', 'No learnable content found, but thinking process logged');
    return;
  }

  // Generate skills (T027, T028)
  const skillStart = Date.now();
  logger.log('INFO', 'generate_skill', 'Generating skill files', {
    count: results.skills.length
  });

  const skillPaths = [];
  for (const result of results.skills) {
    const writeStart = Date.now();
    const writeResult = skillGenerator.writeSkillFileWithDedup(cwd, result, true);
    if (writeResult.path) {
      skillPaths.push(writeResult.path);
      logger.logStep('write_skill', writeResult.merged ? 'Updated existing skill' : 'Created new skill', {
        path: writeResult.path,
        merged: writeResult.merged || false
      }, writeStart);
    }
  }

  logger.logStep('generate_skill', 'Skill generation completed', {
    skills_generated: skillPaths.length,
    paths: skillPaths
  }, skillStart);
}

// Run the worker
main();

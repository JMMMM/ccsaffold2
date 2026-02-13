#!/usr/bin/env node
/**
 * Auto-Learning Worker Process (Simplified)
 *
 * Flow:
 * 1. Get conversation file path
 * 2. Call Claude CLI via tail | claude pipe
 * 3. Claude CLI analyzes + creates files directly
 *
 * That's it! No complex dispatchers.
 */

'use strict';

const path = require('path');

// Load lib modules
const libDir = path.join(__dirname, '..', 'lib');
const conversationReader = require(path.join(libDir, 'conversation-reader.js'));
const claudeCli = require(path.join(libDir, 'claude-cli-client.js'));
const learningLogger = require(path.join(libDir, 'learning-logger.js'));

/**
 * Main worker entry point
 */
async function main() {
  let logger = null;

  try {
    // Parse config
    const config = parseConfig();
    if (!config) {
      process.exit(1);
    }

    const { session_id, cwd } = config;

    // Create logger
    logger = learningLogger.createLogger(session_id, cwd);
    logger.log('INFO', 'init', 'Starting simplified learning', { session_id });

    // Run learning
    await runLearning(session_id, cwd, logger);

    logger.log('INFO', 'complete', 'Learning completed');
    process.exit(0);
  } catch (e) {
    if (logger) {
      logger.logError('error', 'Worker failed', e);
    } else {
      console.error('[Auto-Learning] ERROR:', e.message);
    }
    process.exit(0);
  }
}

/**
 * Parse configuration from command line
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
 * Run the learning process - uses tail | claude pipe
 */
async function runLearning(sessionId, cwd, logger) {
  // Step 1: Check Claude CLI availability
  if (!claudeCli.isAvailable()) {
    logger.log('WARN', 'init', 'Claude CLI not available, skipping');
    console.log('[Auto-Learning] WARN: Claude CLI not available');
    return;
  }

  const availability = await claudeCli.checkAvailability();
  logger.log('INFO', 'init', 'Claude CLI ready', { version: availability.version });

  // Step 2: Get conversation file path
  const conversationPath = conversationReader.getConversationPath(cwd, sessionId);

  // Check if file exists and has enough content
  const conversationData = conversationReader.readBySessionId(cwd, sessionId);
  if (!conversationData) {
    logger.log('WARN', 'read', 'No conversation found', { path: conversationPath });
    return;
  }

  // Check minimum prompts (3)
  const MIN_PROMPTS = 3;
  if (!conversationReader.hasEnoughPrompts(conversationData, MIN_PROMPTS)) {
    logger.log('INFO', 'check', 'Not enough prompts', {
      count: conversationData.userPromptCount,
      min: MIN_PROMPTS
    });
    console.log(`[Auto-Learning] Skipping - only ${conversationData.userPromptCount} prompts`);
    return;
  }

  logger.log('INFO', 'content', 'Conversation file ready', {
    path: conversationPath,
    promptCount: conversationData.userPromptCount
  });

  // Step 3: Call Claude CLI via tail | claude pipe
  console.log('[Auto-Learning] Calling Claude CLI for analysis and file creation...');
  logger.log('INFO', 'llm', 'Starting Claude CLI with tail pipe');

  const result = await claudeCli.executeLearningWithFile(conversationPath, cwd, {}, logger);

  if (result.success) {
    logger.log('INFO', 'complete', 'Claude CLI completed successfully');
    console.log('[Auto-Learning] Learning completed successfully');
  } else {
    logger.log('WARN', 'complete', 'Claude CLI completed with issues', {
      error: result.error
    });
    console.log('[Auto-Learning] Learning completed with issues:', result.error);
  }
}

// Run
main();

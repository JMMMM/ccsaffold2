#!/usr/bin/env node
/**
 * Auto-Learning Worker Process
 * Runs asynchronously to analyze conversation and accumulate ideas
 *
 * When ideas reach threshold (5 occurrences), they are synthesized into skills
 *
 * Command line: node auto-learning-worker.js '<json_config>'
 *
 * Config format:
 * {
 *   "session_id": "abc123",
 *   "cwd": "/Users/..."
 * }
 */

'use strict';

const path = require('path');

// Load lib modules using __dirname for cross-platform compatibility
const libDir = path.join(__dirname, '..', 'lib');
const conversationReader = require(path.join(libDir, 'conversation-reader.js'));
const sensitiveFilter = require(path.join(libDir, 'sensitive-filter.js'));
const llmAnalyzer = require(path.join(libDir, 'llm-analyzer.js'));
const skillGenerator = require(path.join(libDir, 'skill-generator.js'));
const learningLogger = require(path.join(libDir, 'learning-logger.js'));
const ideaManager = require(path.join(libDir, 'idea-manager.js'));
const ideaSynthesizer = require(path.join(libDir, 'idea-synthesizer.js'));

/**
 * Main worker entry point
 */
async function main() {
  let logger = null;

  try {
    // Parse config from command line argument
    const config = parseConfig();
    if (!config) {
      process.exit(1);
    }

    const { session_id, cwd } = config;

    // Create logger instance
    logger = learningLogger.createLogger(session_id, cwd);

    // Log initialization
    logger.log('INFO', 'init', 'Starting async learning (Idea-based)', { session_id });

    // Run the learning process
    await runLearningProcess(session_id, cwd, logger);

    // Log completion
    logger.log('INFO', 'complete', 'Async learning completed');

    process.exit(0);
  } catch (e) {
    // Log error
    if (logger) {
      logger.logError('error', 'Worker failed', e);
    } else {
      console.error('[Auto-Learning] ERROR:', e.message);
    }
    // Exit gracefully
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
 * Run the learning process with Idea accumulation
 * @param {string} sessionId - Session ID
 * @param {string} cwd - Working directory
 * @param {Object} logger - Logger instance
 */
async function runLearningProcess(sessionId, cwd, logger) {
  // Check if API is available
  if (!llmAnalyzer.isApiAvailable()) {
    logger.log('WARN', 'init', 'ANTHROPIC_AUTH_TOKEN not set, skipping');
    return;
  }

  // Read conversation file
  const readStart = Date.now();
  const conversationData = conversationReader.readBySessionId(cwd, sessionId);
  const conversationPath = conversationReader.getConversationPath(cwd, sessionId);
  logger.logStep('read_conversation', 'Conversation loaded', {
    path: conversationPath,
    user_prompt_count: conversationData ? conversationData.userPromptCount : 0,
    tool_use_count: conversationData ? conversationData.toolUseCount : 0
  }, readStart);

  // Check conversation data
  if (!conversationData) {
    logger.log('WARN', 'read_conversation', 'No conversation file found', {
      path: conversationPath
    });
    return;
  }

  // Check UserPromptSubmit count (skip if less than 5)
  if (!conversationReader.hasEnoughPrompts(conversationData, 5)) {
    logger.log('INFO', 'check_prompts', 'Skipping learning - not enough user prompts', {
      user_prompt_count: conversationData.userPromptCount,
      min_required: 5
    });
    console.log(`[Auto-Learning] INFO: Skipping - only ${conversationData.userPromptCount} user prompts (min: 5)`);
    return;
  }

  // Extract conversation text
  const parseStart = Date.now();
  const conversationText = conversationReader.extractConversationText(conversationData);
  logger.logStep('parse_conversation', 'Conversation text extracted', {
    text_length: conversationText ? conversationText.length : 0
  }, parseStart);

  // Filter sensitive information
  const filterStart = Date.now();
  const originalLength = conversationText ? conversationText.length : 0;
  const filteredText = sensitiveFilter.filter(conversationText);
  const filteredLength = filteredText ? filteredText.length : 0;
  logger.logStep('filter_sensitive', 'Sensitive information filtered', {
    original_length: originalLength,
    filtered_length: filteredLength
  }, filterStart);

  // Analyze with LLM for Ideas
  const llmStart = Date.now();
  logger.log('INFO', 'llm_call', 'Starting LLM analysis for ideas');

  const fullPrompt = llmAnalyzer.buildPrompt(filteredText);
  logger.log('DEBUG', 'llm_request', 'Full prompt to LLM', {
    prompt_length: fullPrompt.length,
    conversation_text_length: filteredText ? filteredText.length : 0
  });

  const analysisResult = await llmAnalyzer.analyzeForIdeas(filteredText);

  logger.logStep('llm_call', 'LLM analysis completed', {
    ideas_count: analysisResult && analysisResult.ideas ? analysisResult.ideas.length : 0
  }, llmStart);

  // Check results
  if (!analysisResult || !analysisResult.ideas || analysisResult.ideas.length === 0) {
    logger.log('INFO', 'idea_analyze', 'No ideas identified from this session');
    console.log('[Auto-Learning] 本次会话未识别到 Idea');

    // Still log status summary
    logIdeaStatusSummary(cwd, logger, 0, 0, 0, 0);
    return;
  }

  // Log identified ideas
  logger.log('INFO', 'idea_analyze', 'LLM identified ideas from session', {
    ideas_count: analysisResult.ideas.length,
    ideas: analysisResult.ideas.map(i => ({ title: i.title, category: i.category }))
  });
  console.log(`[Auto-Learning] 本次会话识别到 ${analysisResult.ideas.length} 个 Idea`);

  // Process each idea
  const processStart = Date.now();
  let newCount = 0;
  let accumulatedCount = 0;
  let convertedCount = 0;
  const skillsToSynthesize = [];

  for (const idea of analysisResult.ideas) {
    // Build evidence from this session
    const evidence = {
      title: idea.title,
      category: idea.category,
      trigger: idea.trigger,
      pattern: idea.pattern,
      evidence: idea.evidence,
      keywords: idea.keywords,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };

    // Add or update idea
    const result = ideaManager.addOrUpdateIdea(cwd, idea, sessionId, evidence, logger);

    if (!result.success) {
      continue;
    }

    if (result.action === 'created') {
      newCount++;
    } else if (result.action === 'accumulated') {
      accumulatedCount++;
    }

    // Check if threshold reached and collect for synthesis
    if (result.thresholdReached) {
      // Load all instances for this idea
      const instances = ideaManager.loadIdeaInstances(cwd, result.idea.id);
      skillsToSynthesize.push({
        idea: result.idea,
        instances: instances
      });
    }
  }

  // Synthesize skills for ideas that reached threshold
  for (const { idea, instances } of skillsToSynthesize) {
    const skillResult = await ideaSynthesizer.synthesizeSkill(idea, instances, cwd, logger);
    if (skillResult && skillResult.success) {
      convertedCount++;
      // Remove idea after successful synthesis
      ideaManager.removeIdea(cwd, idea.id, logger);
      logger.log('INFO', 'idea_status', 'Idea converted to skill and removed', {
        idea_id: idea.id,
        skill_path: skillResult.skillPath
      });
    }
  }

  logger.logStep('idea_process', 'Idea processing completed', {
    new_ideas: newCount,
    accumulated_ideas: accumulatedCount,
    converted_skills: convertedCount
  }, processStart);

  // Log status summary
  const status = ideaManager.getIdeaStatus(cwd);
  logIdeaStatusSummary(cwd, logger, newCount, accumulatedCount, convertedCount, status.readyForSkill);
}

/**
 * Log idea status summary at the end of session
 * @param {string} cwd - Working directory
 * @param {Object} logger - Logger instance
 * @param {number} newThisSession - New ideas this session
 * @param {number} accumulatedThisSession - Accumulated ideas this session
 * @param {number} convertedThisSession - Skills converted this session
 * @param {number} readyForSkill - Ideas ready for skill synthesis
 */
function logIdeaStatusSummary(cwd, logger, newThisSession, accumulatedThisSession, convertedThisSession, readyForSkill) {
  const status = ideaManager.getIdeaStatus(cwd);

  logger.log('INFO', 'idea_status', 'Idea accumulation summary', {
    total_ideas: status.total,
    new_this_session: newThisSession,
    accumulated_this_session: accumulatedThisSession,
    ready_for_skill: readyForSkill,
    converted_this_session: convertedThisSession
  });

  // Console output
  console.log('[Auto-Learning] ===== Idea 状态汇总 =====');
  console.log(`[Auto-Learning] 总计: ${status.total} 个 Idea`);
  console.log(`[Auto-Learning] 本次新增: ${newThisSession} | 本次累计: ${accumulatedThisSession} | 本次转化: ${convertedThisSession}`);
  console.log(`[Auto-Learning] 待转化 (>=5次): ${readyForSkill} 个`);
  console.log('[Auto-Learning] ============================');
}

// Run the worker
main();

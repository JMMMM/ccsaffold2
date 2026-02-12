#!/usr/bin/env node
/**
 * Learning Logger Module
 * Provides structured logging for the async auto-learning feature
 *
 * Log format: JSON Lines (one JSON object per line)
 * Log location: {cwd}/.claude/logs/continuous-learning/learning-{session_id}.log
 *
 * Follows constitution VII: No emoji, ASCII only
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Valid log levels
 */
const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

/**
 * Valid step identifiers
 */
const VALID_STEPS = [
  'init',
  'read_transcript',
  'parse_transcript',
  'filter_sensitive',
  'llm_call',
  'llm_request',
  'llm_response',
  'generate_skill',
  'write_skill',
  'complete',
  'error'
];

/**
 * Create a logger instance for a learning session
 * @param {string} sessionId - The session ID
 * @param {string} cwd - The working directory
 * @returns {Object} Logger instance
 */
function createLogger(sessionId, cwd) {
  // Build log directory path
  const logDir = path.join(cwd, '.claude', 'logs', 'continuous-learning');
  const logFile = path.join(logDir, `learning-${sessionId}.log`);

  // Ensure directory exists (T010)
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    // Silent failure - log to console
    console.error('[Auto-Learning] ERROR: Failed to create log directory:', e.message);
  }

  /**
   * Format timestamp as ISO 8601
   * @returns {string} ISO timestamp
   */
  function getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Write a log entry to file
   * @param {Object} entry - The log entry object
   */
  function writeEntry(entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(logFile, line, 'utf8');
    } catch (e) {
      console.error('[Auto-Learning] ERROR: Failed to write log:', e.message);
    }
  }

  /**
   * Log a message (T006)
   * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
   * @param {string} step - Step identifier
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   */
  function log(level, step, message, data) {
    // Validate level
    const upperLevel = (level || 'INFO').toUpperCase();
    if (!LOG_LEVELS.includes(upperLevel)) {
      console.warn(`[Auto-Learning] WARN: Invalid log level: ${level}, using INFO`);
    }

    // Build entry (T011: JSON Lines format, no emoji)
    const entry = {
      ts: getTimestamp(),
      level: upperLevel,
      step: step,
      msg: message
    };

    if (data !== undefined && data !== null) {
      entry.data = data;
    }

    // Write to file
    writeEntry(entry);

    // Also output to console (T011: ASCII only, no emoji)
    console.log(`[Auto-Learning] ${upperLevel}: ${message}`);
  }

  /**
   * Log an error (T007)
   * @param {string} step - Step identifier
   * @param {string} message - Error description
   * @param {Error|Object} error - Error object
   */
  function logError(step, message, error) {
    const entry = {
      ts: getTimestamp(),
      level: 'ERROR',
      step: step,
      msg: message,
      error: {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : undefined
      }
    };

    // Remove undefined fields
    if (!entry.error.stack) {
      delete entry.error.stack;
    }

    writeEntry(entry);

    // Console output (ASCII only)
    console.error(`[Auto-Learning] ERROR: ${message} - ${entry.error.message}`);
  }

  /**
   * Log a step completion with duration (T008)
   * @param {string} step - Step identifier
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   * @param {number} [startTime] - Start timestamp from Date.now()
   */
  function logStep(step, message, data, startTime) {
    const entry = {
      ts: getTimestamp(),
      level: 'INFO',
      step: step,
      msg: message
    };

    if (data !== undefined && data !== null) {
      entry.data = data;
    }

    // Calculate duration if startTime provided
    if (startTime !== undefined && startTime !== null) {
      entry.duration_ms = Date.now() - startTime;
    }

    writeEntry(entry);

    // Console output
    const durationStr = entry.duration_ms !== undefined ? ` (${entry.duration_ms}ms)` : '';
    console.log(`[Auto-Learning] INFO: ${message}${durationStr}`);
  }

  /**
   * Get the log file path (T009)
   * @returns {string} Absolute path to log file
   */
  function getLogPath() {
    return logFile;
  }

  // Return logger interface
  return {
    log,
    logError,
    logStep,
    getLogPath
  };
}

module.exports = {
  createLogger,
  LOG_LEVELS,
  VALID_STEPS
};

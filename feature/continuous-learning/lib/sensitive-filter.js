#!/usr/bin/env node
/**
 * Sensitive Filter Module
 * Filters sensitive information from text using regex patterns
 *
 * Filters: API keys, passwords, tokens, private keys, etc.
 */

'use strict';

/**
 * Regex patterns for sensitive information
 */
const SENSITIVE_PATTERNS = [
  // API Keys - Anthropic style
  /sk-ant-api03-[a-zA-Z0-9_-]{20,}/g,
  // API Keys - Generic sk- prefix
  /sk-[a-zA-Z0-9]{20,}/g,
  // API Keys - Long alphanumeric strings (32+ chars that look like keys)
  /\b[a-zA-Z0-9]{32,}\b/g,
  // Passwords with various formats
  /password["']?\s*[:=]\s*["'][^"']+["']/gi,
  /password\s*=\s*["'][^"']+["']/gi,
  // Tokens
  /token["']?\s*[:=]\s*["'][^"']+["']/gi,
  /\btoken\s*=\s*["'][^"']+["']/gi,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_-]+/gi,
  // Private key blocks
  /-----BEGIN\s+[A-Z]+\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+[A-Z]+\s+PRIVATE\s+KEY-----/g,
  // AWS Access Keys
  /AKIA[A-Z0-9]{16}/g,
  // GitHub tokens
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /ghu_[a-zA-Z0-9]{36}/g,
  /ghs_[a-zA-Z0-9]{36}/g,
  /ghr_[a-zA-Z0-9]{36}/g,
];

/**
 * Filter sensitive information from text
 * @param {string} text - Input text to filter
 * @returns {string} Filtered text with sensitive info replaced by [REDACTED]
 */
function filter(text) {
  // Handle null/undefined
  if (text == null) {
    return '';
  }

  // Ensure text is a string
  if (typeof text !== 'string') {
    text = String(text);
  }

  let filtered = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    filtered = filtered.replace(pattern, '[REDACTED]');
  }

  return filtered;
}

/**
 * Get all filter patterns (for testing/debugging)
 * @returns {RegExp[]} Array of regex patterns
 */
function getPatterns() {
  return SENSITIVE_PATTERNS.map(p => new RegExp(p.source, p.flags));
}

/**
 * Check if text contains sensitive information
 * @param {string} text - Text to check
 * @returns {boolean} True if sensitive info detected
 */
function hasSensitive(text) {
  if (text == null || typeof text !== 'string') {
    return false;
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  filter,
  getPatterns,
  hasSensitive,
  SENSITIVE_PATTERNS
};

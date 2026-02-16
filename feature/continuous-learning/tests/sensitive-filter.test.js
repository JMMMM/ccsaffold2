#!/usr/bin/env node
/**
 * Unit tests for sensitive-filter module
 * Tests the filtering of sensitive information like API keys, passwords, tokens
 */

const assert = require('assert');
const path = require('path');

// Load the module under test
const sensitiveFilter = require(path.join(__dirname, '..', 'lib', 'sensitive-filter.js'));

console.log('Running sensitive-filter tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

// Test 1: Filter API keys (sk- prefix)
test('should filter Anthropic API keys (sk-ant-)', () => {
  const input = 'My API key is sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('sk-ant-'), 'API key should be filtered');
  assert(result.includes('[REDACTED]'), 'Should contain [REDACTED]');
});

// Test 2: Filter generic API keys
test('should filter generic API keys (sk- prefix)', () => {
  const input = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxx';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('sk-'), 'API key should be filtered');
});

// Test 3: Filter passwords in various formats
test('should filter password assignments', () => {
  const input = 'password = "mysecretpassword"';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('mysecretpassword'), 'Password should be filtered');
});

test('should filter password with colon', () => {
  const input = '"password": "secret123"';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('secret123'), 'Password should be filtered');
});

// Test 4: Filter tokens
test('should filter token assignments', () => {
  const input = 'token: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('ghp_'), 'Token should be filtered');
});

// Test 5: Filter private keys
test('should filter private key blocks', () => {
  const input = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('PRIVATE KEY'), 'Private key should be filtered');
  assert(result.includes('[REDACTED]'), 'Should contain [REDACTED]');
});

// Test 6: Preserve normal text
test('should preserve normal text without sensitive info', () => {
  const input = 'This is a normal message without any sensitive data.';
  const result = sensitiveFilter.filter(input);
  assert.strictEqual(result, input, 'Normal text should not be modified');
});

// Test 7: Handle empty input
test('should handle empty string', () => {
  const result = sensitiveFilter.filter('');
  assert.strictEqual(result, '', 'Empty string should remain empty');
});

// Test 8: Handle null/undefined
test('should handle null input', () => {
  const result = sensitiveFilter.filter(null);
  assert.strictEqual(result, '', 'Null should return empty string');
});

test('should handle undefined input', () => {
  const result = sensitiveFilter.filter(undefined);
  assert.strictEqual(result, '', 'Undefined should return empty string');
});

// Test 9: Multiple sensitive items in one text
test('should filter multiple sensitive items', () => {
  const input = 'API key: sk-abcdefghijklmnopqrstuvwxyz and password: "secret123" and token: "abc123token"';
  const result = sensitiveFilter.filter(input);
  assert(!result.includes('sk-abcdefghijklmnopqrstuvwxyz'), 'API key should be filtered');
  assert(!result.includes('secret123'), 'Password should be filtered');
  assert(result.includes('[REDACTED]'), 'Should contain [REDACTED]');
});

// Test 10: getPatterns function
test('should return array of patterns', () => {
  const patterns = sensitiveFilter.getPatterns();
  assert(Array.isArray(patterns), 'getPatterns should return an array');
  assert(patterns.length > 0, 'Should have at least one pattern');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);

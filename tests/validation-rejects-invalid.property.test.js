// Feature: fuel-stop-landing-page, Property 2: Validation rejects all invalid Social_Media_Link entries

/**
 * Property 2: Validation rejects all invalid Social_Media_Link entries
 *
 * For any input where `name` is empty or longer than 100 characters, OR where
 * `url` is empty, longer than 2048 characters, or does not begin with
 * `http://` or `https://`, calling `validateSocialForm()` SHALL return
 * `valid: false` and SHALL NOT write to localStorage.
 *
 * Validates: Requirements 7.6, 7.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { validateSocialForm } from '../js/social-core.js';

// ── localStorage spy setup ─────────────────────────────────────────────────

/**
 * We spy on localStorage.setItem to verify validateSocialForm() itself
 * never writes to storage (it is a pure validation function — storage is
 * only touched by saveSocialLink, which is called AFTER validation).
 *
 * Since jsdom provides localStorage, we just spy on it.
 */
beforeEach(() => {
  vi.spyOn(localStorage, 'setItem');
  // Clear any calls accumulated before the test
  localStorage.setItem.mockClear();
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * assertInvalidAndNoStorage(name, url) — shared assertion helper.
 * Checks that validateSocialForm returns valid:false AND setItem was not called.
 */
function assertInvalidAndNoStorage(name, url) {
  const result = validateSocialForm({ name, url });

  // 1. Must return valid: false
  expect(result.valid, `Expected valid:false for name=${JSON.stringify(name)}, url=${JSON.stringify(url)}`).toBe(false);

  // 2. Must have an errors object
  expect(result).toHaveProperty('errors');

  // 3. localStorage.setItem must NOT have been called during validateSocialForm
  expect(localStorage.setItem).not.toHaveBeenCalled();
}

// ── Generators ────────────────────────────────────────────────────────────

/**
 * validName — 1–100 character non-empty string (used as a "good" name
 * so that URL-related invalid inputs isolate the URL path of the validation).
 */
const validName = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * validUrl — starts with http:// or https://, total ≤ 2048 chars.
 */
const validUrl = fc.tuple(
  fc.constantFrom('http://', 'https://'),
  fc.string({ minLength: 1, maxLength: 2040 }).map(s => s.replace(/^\s+/, 'x') || 'x')
).map(([prefix, suffix]) => prefix + suffix)
  .filter(url => url.length <= 2048);

// ── Invalid name generators ───────────────────────────────────────────────

/** Empty string — violates Requirement 7.6 (name must be non-empty after trim) */
const emptyName = fc.constantFrom('', '   ', '\t', '\n', '  \t  ');

/**
 * Whitespace-only string — also violates the non-empty-after-trim rule.
 * Use fc.stringOf(fc.constantFrom(' ', '\t', '\n')) with minLength:1.
 */
const whitespaceName = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n'),
  { minLength: 1, maxLength: 50 }
);

/**
 * Name longer than 100 characters — violates Requirement 7.6.
 * We build a string of 101–200 chars to ensure it exceeds the limit.
 * (After trim it must remain > 100 chars, so we use non-whitespace chars.)
 */
const tooLongName = fc.string({ minLength: 101, maxLength: 200 }).map(s => {
  // Pad with 'x' if trim would make it ≤ 100
  const trimmed = s.trim();
  if (trimmed.length > 100) return s;
  // Ensure no leading/trailing whitespace hides the length
  return 'x'.repeat(101);
});

// ── Invalid URL generators ────────────────────────────────────────────────

/** Empty URL — violates Requirement 7.7 */
const emptyUrl = fc.constantFrom('');

/** URL longer than 2048 characters — violates Requirement 7.7 */
const tooLongUrl = fc.string({ minLength: 2049, maxLength: 3000 }).map(s =>
  // Make sure it's at least 2049 chars (padding if needed)
  s.length >= 2049 ? s : s + 'x'.repeat(2049 - s.length)
);

/**
 * URL without http:// or https:// — violates Requirement 7.7.
 * Covers:
 *   - ftp:// prefix
 *   - www. prefix (no protocol)
 *   - bare domain (e.g. "example.com")
 *   - malformed protocols: "htp://", "htps://", "http:/", "https:/"
 */
const urlWithoutValidProtocol = fc.oneof(
  // ftp:// and other schemes
  fc.constantFrom(
    'ftp://example.com',
    'ftps://example.com',
    'sftp://example.com',
    'ssh://example.com',
    'ws://example.com',
    'wss://example.com',
    'file:///etc/passwd',
    'mailto:user@example.com',
    'data:text/plain,hello'
  ),
  // www. prefix with no scheme
  fc.string({ minLength: 1, maxLength: 200 }).map(s => 'www.' + s),
  // bare domain / path (no scheme at all)
  // Filter after trim to match how validateSocialForm handles the URL
  fc.string({ minLength: 1, maxLength: 200 }).filter(
    s => {
      const t = s.trim();
      return t.length > 0 && !t.startsWith('http://') && !t.startsWith('https://');
    }
  ),
  // Malformed http/https — none of these should pass trim-then-prefix check
  fc.constantFrom(
    'htp://example.com',
    'htps://example.com',
    'http:/example.com',
    'https:/example.com',
    'http//example.com',
    'https//example.com',
    'ht tp://example.com',
    'HTTP://example.com',    // wrong case
    'HTTPS://example.com'    // wrong case
  )
).filter(
  // Guard: none of these should accidentally start with http:// or https://
  // (after trim, to match how validateSocialForm treats the URL)
  s => {
    const t = s.trim();
    return !t.startsWith('http://') && !t.startsWith('https://');
  }
);

// ── Property 2 Test Suite ─────────────────────────────────────────────────

describe('Property 2: Validation rejects all invalid Social_Media_Link entries', () => {

  /**
   * 2a — empty name (empty string or whitespace-only)
   * Validates: Requirement 7.6
   */
  it(
    'returns valid:false and never writes storage when name is empty string',
    () => {
      fc.assert(
        fc.property(emptyName, validUrl, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  it(
    'returns valid:false and never writes storage when name is whitespace-only',
    () => {
      fc.assert(
        fc.property(whitespaceName, validUrl, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2b — name longer than 100 characters
   * Validates: Requirement 7.6
   */
  it(
    'returns valid:false and never writes storage when name exceeds 100 characters',
    () => {
      fc.assert(
        fc.property(tooLongName, validUrl, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2c — empty URL
   * Validates: Requirement 7.7
   */
  it(
    'returns valid:false and never writes storage when URL is empty',
    () => {
      fc.assert(
        fc.property(validName, emptyUrl, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2d — URL longer than 2048 characters
   * Validates: Requirement 7.7
   */
  it(
    'returns valid:false and never writes storage when URL exceeds 2048 characters',
    () => {
      fc.assert(
        fc.property(validName, tooLongUrl, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2e — URL without valid http:// or https:// protocol
   * Covers: ftp://, www., bare domain, malformed protocol (htp://, htps://)
   * Validates: Requirement 7.7
   */
  it(
    'returns valid:false and never writes storage when URL lacks http:// or https:// protocol',
    () => {
      fc.assert(
        fc.property(validName, urlWithoutValidProtocol, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2f — Combined: both name AND url are invalid simultaneously
   * Validates: Requirements 7.6, 7.7
   */
  it(
    'returns valid:false with errors for both fields when both name and url are invalid',
    () => {
      const invalidNameArb = fc.oneof(emptyName, whitespaceName, tooLongName);
      const invalidUrlArb  = fc.oneof(emptyUrl, tooLongUrl, urlWithoutValidProtocol);

      fc.assert(
        fc.property(invalidNameArb, invalidUrlArb, (name, url) => {
          localStorage.setItem.mockClear();

          const result = validateSocialForm({ name, url });

          // Must be invalid
          expect(result.valid).toBe(false);
          expect(result).toHaveProperty('errors');

          // Both error keys should be present
          expect(result.errors).toHaveProperty('name');
          expect(result.errors).toHaveProperty('url');

          // Must not touch localStorage
          expect(localStorage.setItem).not.toHaveBeenCalled();
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  /**
   * 2g — Exhaustive spot-checks with fc.constantFrom for the exact invalid
   *      cases specified in the task description.
   * Validates: Requirements 7.6, 7.7
   */
  it(
    'rejects all specified invalid categories with a valid name counterpart',
    () => {
      const specifiedInvalidUrls = fc.constantFrom(
        '',                        // empty URL
        'ftp://example.com',       // wrong scheme
        'www.example.com',         // www. without scheme
        'example.com',             // bare domain
        'htp://example.com',       // typo — htp
        'htps://example.com',      // typo — htps
        'http:/example.com',       // single slash
        'https:/example.com'       // single slash
      );

      fc.assert(
        fc.property(validName, specifiedInvalidUrls, (name, url) => {
          localStorage.setItem.mockClear();
          assertInvalidAndNoStorage(name, url);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );
});

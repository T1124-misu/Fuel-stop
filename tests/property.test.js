// Feature: fuel-stop-landing-page, Property 1: Social link round-trip persistence

/**
 * Property 1: Social link round-trip persistence
 *
 * For any valid Social_Media_Link object (name 1–100 chars, URL starting with
 * http:// or https:// and ≤ 2048 chars, any icon string), adding it via
 * saveSocialLink(entry, -1) and then reading back the fuelstop_social_links
 * key from localStorage SHALL yield an array that contains an entry with
 * identical name, url, and icon values.
 *
 * Validates: Requirements 7.3, 6.3
 */

import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createHarness, createLocalStorageStub, STORAGE_KEY } from './social-links-harness.js';

// ── Arbitraries ────────────────────────────────────────────────────────────

/**
 * validName — non-empty string, 1–100 characters.
 * Uses printable ASCII to stay predictable; the requirement only constrains
 * length, not character set.
 */
const validName = fc.string({ minLength: 1, maxLength: 100 });

/**
 * validUrl — starts with http:// or https://, total length ≤ 2048 chars.
 *
 * Strategy:
 *   prefix  : "http://" (7) or "https://" (8)
 *   suffix  : a string that fills the remaining budget (1–2040 chars)
 *   total   : 8–2048 chars
 *
 * We use fc.webUrl() where possible; however to guarantee protocol prefix
 * and length control we build it manually.
 */
const validUrl = fc.tuple(
  fc.constantFrom('http://', 'https://'),
  // host + path portion: at least 1 char, at most 2048 - len(prefix) chars
  fc.string({ minLength: 1, maxLength: 2040 }).map(s =>
    // Ensure it never starts with whitespace (makes it a well-formed URL path)
    s.replace(/^\s+/, 'x') || 'x'
  )
).map(([prefix, suffix]) => prefix + suffix)
  .filter(url => url.length <= 2048);

/**
 * validIcon — any string (including empty), per design doc field spec.
 */
const validIcon = fc.string({ minLength: 0, maxLength: 200 });

/**
 * validSocialLink — arbitrary valid Social_Media_Link object.
 */
const validSocialLink = fc.record({
  name: validName,
  url:  validUrl,
  icon: validIcon
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Property 1: Social link round-trip persistence', () => {
  let stub;
  let harness;

  beforeEach(() => {
    stub    = createLocalStorageStub();
    harness = createHarness(stub);
  });

  it('saveSocialLink(entry, -1) stores the entry with identical field values (100 iterations)', () => {
    fc.assert(
      fc.property(validSocialLink, (entry) => {
        // Reset storage for each generated example to ensure isolation
        stub.clear();

        // Act: add the entry in add mode (index = -1)
        harness.saveSocialLink(entry, -1);

        // Assert: read back the stored array and find the entry
        const raw = stub.getItem(STORAGE_KEY);
        if (!raw) return false;   // nothing was stored → fail

        const stored = JSON.parse(raw);
        if (!Array.isArray(stored)) return false;  // not an array → fail

        // The stored array must contain an object with identical name / url / icon
        const found = stored.some(
          (item) =>
            item.name === entry.name &&
            item.url  === entry.url  &&
            item.icon === entry.icon
        );

        return found;
      }),
      { numRuns: 100, verbose: true }
    );
  });

  it('saveSocialLink appends to an existing array without losing prior entries', () => {
    fc.assert(
      fc.property(
        fc.array(validSocialLink, { minLength: 1, maxLength: 10 }),
        validSocialLink,
        (existing, newEntry) => {
          // Seed the storage with the existing array
          stub.clear();
          stub.setItem(STORAGE_KEY, JSON.stringify(existing));

          const previousLength = existing.length;

          // Add a new entry
          harness.saveSocialLink(newEntry, -1);

          const raw = stub.getItem(STORAGE_KEY);
          if (!raw) return false;

          const stored = JSON.parse(raw);
          if (!Array.isArray(stored)) return false;

          // Length must have grown by exactly 1
          if (stored.length !== previousLength + 1) return false;

          // The new entry must be at the end and match exactly
          const last = stored[stored.length - 1];
          return (
            last.name === newEntry.name &&
            last.url  === newEntry.url  &&
            last.icon === newEntry.icon
          );
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});

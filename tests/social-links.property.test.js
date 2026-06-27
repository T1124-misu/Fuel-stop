/**
 * Property-based tests for Social Media Links — Fuel Stop Landing Page
 *
 * Testing framework : Vitest
 * PBT library       : fast-check
 *
 * localStorage stub is reset before each test so tests are fully isolated.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  STORAGE_KEY,
  DEFAULT_LINKS,
  initSocialLinks,
  readLinks,
  saveSocialLink,
  deleteSocialLink,
} from '../js/social-core.js';

// ── Minimal localStorage stub ─────────────────────────────────────────────

/**
 * createStorageStub() — returns a fresh in-memory object that satisfies
 * the Storage interface used by social-core.js (getItem / setItem / clear).
 */
function createStorageStub() {
  var store = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      for (var k in store) {
        delete store[k];
      }
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

// ── Shared stub instance (reset per test) ─────────────────────────────────

var storage;

beforeEach(() => {
  storage = createStorageStub();
});

// ── Generators ────────────────────────────────────────────────────────────

/** Valid platform name: 1–100 non-empty characters */
var arbName = fc.stringOf(fc.char(), { minLength: 1, maxLength: 100 });

/** Valid URL: starts with https://, total length 1–2048 */
var arbUrl = fc.stringOf(fc.char(), { minLength: 1, maxLength: 2040 })
  .map(suffix => 'https://' + suffix);

/** Any icon string (may be empty) */
var arbIcon = fc.string();

/** Arbitrary valid Social_Media_Link object */
var arbLink = fc.record({ name: arbName, url: arbUrl, icon: arbIcon });

// ── Property 1: Social link round-trip persistence ────────────────────────
// Feature: fuel-stop-landing-page, Property 1: Social link round-trip persistence
describe('Property 1: Social link round-trip persistence', () => {
  it(
    'adding a valid entry and reading back localStorage yields an array containing that entry',
    () => {
      // Validates: Requirements 7.3, 6.3
      fc.assert(
        fc.property(arbLink, (entry) => {
          storage.clear();
          saveSocialLink(entry, -1, storage);

          var stored = readLinks(storage);
          expect(stored).not.toBeNull();
          expect(stored.length).toBeGreaterThanOrEqual(1);

          var found = stored.find(
            (e) => e.name === entry.name && e.url === entry.url && e.icon === entry.icon
          );
          expect(found).toBeDefined();
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 5: Default seed is written exactly once ──────────────────────
// Feature: fuel-stop-landing-page, Property 5: Default seed is written exactly once
describe('Property 5: Default seed is written exactly once', () => {
  /**
   * Validates: Requirements 6.3
   *
   * Scenario:
   *   1. Reset the localStorage stub (no existing key).
   *   2. Call initSocialLinks() a FIRST time → must write the 2 default entries.
   *   3. Call initSocialLinks() a SECOND time → must NOT overwrite or duplicate.
   *   4. The stored array must still have exactly 2 entries after both calls.
   */
  it(
    'writes the two default entries on first call and does not duplicate on second call',
    () => {
      // ── Step 1: stub is already empty (reset by beforeEach) ──────────────

      // ── Step 2: first call ───────────────────────────────────────────────
      initSocialLinks(storage);

      var afterFirstCall = readLinks(storage);
      expect(afterFirstCall).not.toBeNull();
      expect(afterFirstCall).toHaveLength(DEFAULT_LINKS.length); // exactly 2

      // Verify the default entries are the Instagram and GoFood seed
      expect(afterFirstCall[0]).toEqual(DEFAULT_LINKS[0]);
      expect(afterFirstCall[1]).toEqual(DEFAULT_LINKS[1]);

      // ── Step 3: second call ──────────────────────────────────────────────
      initSocialLinks(storage);

      var afterSecondCall = readLinks(storage);
      expect(afterSecondCall).not.toBeNull();

      // ── Step 4: still exactly 2 entries — no overwrite, no duplication ───
      expect(afterSecondCall).toHaveLength(DEFAULT_LINKS.length); // still exactly 2

      // Entries are identical to after the first call
      expect(afterSecondCall).toEqual(afterFirstCall);
    }
  );

  it(
    'does not write defaults when storage already has entries',
    () => {
      // Pre-populate with a custom entry
      var existing = [{ name: 'Twitter', url: 'https://twitter.com/fuelstop', icon: 'twitter' }];
      storage.setItem(STORAGE_KEY, JSON.stringify(existing));

      initSocialLinks(storage);

      var result = readLinks(storage);
      // Must preserve the pre-existing entry, not replace with defaults
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(existing[0]);
    }
  );
});

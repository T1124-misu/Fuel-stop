/**
 * Property-based tests for Social_Media_Link storage functions.
 *
 * Test runner : Vitest (jsdom environment)
 * Generator   : fast-check
 *
 * Feature: fuel-stop-landing-page, Property 4: Edit preserves all other entries
 */

import { describe, it, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  STORAGE_KEY,
  readLinks,
  writeLinks,
  saveSocialLink,
} from './social-links-core.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wipe the localStorage key before each test to avoid state bleed. */
function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * arb_name — non-empty string up to 100 characters (trimmed length ≥ 1).
 * We start with at least 1 printable character so trimming never empties it.
 */
const arb_name = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * arb_url — string starting with 'http://' or 'https://', up to 2048 chars total.
 */
const arb_url = fc.oneof(
  fc.string({ minLength: 0, maxLength: 2041 }).map((s) => 'http://' + s),
  fc.string({ minLength: 0, maxLength: 2040 }).map((s) => 'https://' + s),
);

/**
 * arb_icon — any string (including empty), representing the icon filename stem.
 */
const arb_icon = fc.string({ minLength: 0, maxLength: 50 });

/**
 * arb_link — an arbitrary valid Social_Media_Link entry.
 */
const arb_link = fc.record({
  name: arb_name,
  url:  arb_url,
  icon: arb_icon,
});

/**
 * arb_links_and_index
 * Generates:
 *   - arr   : array of 1–20 valid Social_Media_Link entries
 *   - index : valid index into that array (0 to arr.length - 1)
 */
const arb_links_and_index = fc
  .array(arb_link, { minLength: 1, maxLength: 20 })
  .chain((arr) =>
    fc
      .integer({ min: 0, max: arr.length - 1 })
      .map((index) => ({ arr, index })),
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 4: Edit preserves all other entries', () => {
  beforeEach(resetStorage);

  /**
   * Validates: Requirements 7.4
   *
   * For any array of n Social_Media_Link entries and any valid index i,
   * calling saveSocialLink(newEntry, i) SHALL:
   *   1. Keep the array length at exactly n (unchanged).
   *   2. Store newEntry at index i (the replaced entry reflects new values).
   *   3. Leave every entry at j ≠ i identical to the original (deep equal).
   *
   * // Feature: fuel-stop-landing-page, Property 4: Edit preserves all other entries
   */
  it(
    'saveSocialLink(newEntry, i) leaves array length unchanged and preserves all j ≠ i entries',
    () => {
      fc.assert(
        fc.property(
          arb_links_and_index,
          arb_link,
          ({ arr, index }, newEntry) => {
            // Arrange — seed localStorage with the generated array
            writeLinks(arr);

            const n = arr.length;

            // Act — perform the edit
            saveSocialLink(newEntry, index);

            // Assert — read back the persisted state
            const stored = readLinks();

            // 1. Array length must be unchanged
            expect(stored).toHaveLength(n);

            // 2. Entry at index i must equal newEntry (deep)
            expect(stored[index]).toEqual(newEntry);

            // 3. Every entry at j ≠ i must be identical to the original
            for (let j = 0; j < n; j++) {
              if (j !== index) {
                expect(stored[j]).toEqual(arr[j]);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

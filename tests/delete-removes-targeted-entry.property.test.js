// Feature: fuel-stop-landing-page, Property 3: Delete removes exactly the targeted entry

/**
 * Property 3: Delete removes exactly the targeted entry
 *
 * For any localStorage array of n Social_Media_Link entries (n ≥ 1),
 * calling deleteSocialLink(i) for any valid index i SHALL result in an
 * array of n − 1 entries where every remaining entry is identical to the
 * original array minus the element at index i.
 *
 * Validates: Requirements 7.5, 6.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  STORAGE_KEY,
  readLinks,
  writeLinks,
  deleteSocialLink,
} from '../js/social-core.js';

// ── localStorage stub ─────────────────────────────────────────────────────

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

// ── Arbitraries ───────────────────────────────────────────────────────────

/**
 * arb_name — non-empty string, 1–100 characters (trimmed length ≥ 1).
 * Starts with at least 1 printable character so trimming never empties it.
 */
const arb_name = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * arb_url — starts with 'http://' or 'https://', total length ≤ 2048 chars.
 */
const arb_url = fc.oneof(
  fc.string({ minLength: 0, maxLength: 2041 }).map((s) => 'http://' + s),
  fc.string({ minLength: 0, maxLength: 2040 }).map((s) => 'https://' + s)
).filter((url) => url.length <= 2048);

/**
 * arb_icon — any string (including empty), representing the icon filename stem.
 */
const arb_icon = fc.string({ minLength: 0, maxLength: 50 });

/**
 * arb_link — arbitrary valid Social_Media_Link entry.
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
 *   - index : a valid index into that array (0 to arr.length - 1)
 *
 * Uses .chain() so the index domain is always constrained to the
 * actual length of the generated array.
 */
const arb_links_and_index = fc
  .array(arb_link, { minLength: 1, maxLength: 20 })
  .chain((arr) =>
    fc
      .integer({ min: 0, max: arr.length - 1 })
      .map((index) => ({ arr, index }))
  );

// ── Property 3 Tests ──────────────────────────────────────────────────────

describe('Property 3: Delete removes exactly the targeted entry', () => {
  /**
   * Validates: Requirements 7.5, 6.5
   *
   * For any array of n entries and any valid index i:
   *   1. The resulting array has exactly n − 1 entries.
   *   2. Every entry that preceded index i is unchanged (deep equal).
   *   3. Every entry that followed index i is shifted left by one but otherwise unchanged.
   *   4. The deleted entry is no longer present at its original position.
   */
  it(
    'deleteSocialLink(i) yields n-1 entries and all remaining entries are unchanged (100 iterations)',
    () => {
      fc.assert(
        fc.property(arb_links_and_index, ({ arr, index }) => {
          const n = arr.length;

          // Arrange — seed the storage stub with the generated array
          writeLinks(arr, storage);

          // Act — delete the entry at the generated index
          deleteSocialLink(index, storage);

          // Assert — read back the persisted state
          const stored = readLinks(storage);

          // 1. Array length must be n − 1
          expect(stored).not.toBeNull();
          expect(stored).toHaveLength(n - 1);

          // 2 & 3. Build the expected array (original minus element at index)
          //   Elements before index: indices 0 .. index-1   → stored[0 .. index-1]
          //   Elements after index:  indices index+1 .. n-1 → stored[index .. n-2]
          const expected = [
            ...arr.slice(0, index),
            ...arr.slice(index + 1),
          ];

          expect(stored).toEqual(expected);

          // 4. The entry originally at index i is not present at that slot
          //    (already covered by the deep-equal check above, but make it explicit)
          if (n > 1) {
            // After deletion the entry at stored[index] (if it exists) must
            // equal arr[index + 1], not arr[index] — already asserted by
            // the toEqual above; this extra guard makes the intent explicit.
            if (index < stored.length) {
              expect(stored[index]).toEqual(arr[index + 1]);
            }
          }
        }),
        { numRuns: 100, verbose: true }
      );
    }
  );

  it(
    'deleteSocialLink on a single-entry array produces an empty array',
    () => {
      fc.assert(
        fc.property(arb_link, (entry) => {
          storage.clear();
          writeLinks([entry], storage);

          deleteSocialLink(0, storage);

          const stored = readLinks(storage);
          expect(stored).toEqual([]);
        }),
        { numRuns: 100, verbose: false }
      );
    }
  );

  it(
    'deleteSocialLink on the first element shifts all other entries left by one',
    () => {
      fc.assert(
        fc.property(
          fc.array(arb_link, { minLength: 2, maxLength: 20 }),
          (arr) => {
            storage.clear();
            writeLinks(arr, storage);

            deleteSocialLink(0, storage);

            const stored = readLinks(storage);
            expect(stored).toHaveLength(arr.length - 1);
            // All original entries from index 1 onward must now be at index 0 onward
            expect(stored).toEqual(arr.slice(1));
          }
        ),
        { numRuns: 100, verbose: false }
      );
    }
  );

  it(
    'deleteSocialLink on the last element does not affect any preceding entry',
    () => {
      fc.assert(
        fc.property(
          fc.array(arb_link, { minLength: 2, maxLength: 20 }),
          (arr) => {
            storage.clear();
            writeLinks(arr, storage);

            deleteSocialLink(arr.length - 1, storage);

            const stored = readLinks(storage);
            expect(stored).toHaveLength(arr.length - 1);
            // All original entries except the last must be untouched
            expect(stored).toEqual(arr.slice(0, arr.length - 1));
          }
        ),
        { numRuns: 100, verbose: false }
      );
    }
  );

  it(
    'deleteSocialLink on a middle element preserves prefix and suffix unchanged',
    () => {
      fc.assert(
        fc.property(
          fc.array(arb_link, { minLength: 3, maxLength: 20 }).chain((arr) =>
            // Pick only a strictly interior index (not first, not last)
            fc
              .integer({ min: 1, max: arr.length - 2 })
              .map((index) => ({ arr, index }))
          ),
          ({ arr, index }) => {
            storage.clear();
            writeLinks(arr, storage);

            deleteSocialLink(index, storage);

            const stored = readLinks(storage);
            expect(stored).toHaveLength(arr.length - 1);

            // Prefix (indices 0 .. index-1) must be unchanged
            for (let j = 0; j < index; j++) {
              expect(stored[j]).toEqual(arr[j]);
            }

            // Suffix (original indices index+1 .. n-1) must shift to stored[index..]
            for (let j = index + 1; j < arr.length; j++) {
              expect(stored[j - 1]).toEqual(arr[j]);
            }
          }
        ),
        { numRuns: 100, verbose: false }
      );
    }
  );
});

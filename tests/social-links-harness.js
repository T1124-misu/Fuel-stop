/**
 * social-links-harness.js
 *
 * Browser-agnostic test harness that exposes the pure storage functions
 * from js/main.js for testing without a browser or IIFE wrapping.
 *
 * The logic here is intentionally kept identical to the corresponding
 * functions in js/main.js (readLinks, writeLinks, saveSocialLink,
 * deleteSocialLink, initSocialLinks) so that property tests exercise
 * the real implementation logic.
 */

export const STORAGE_KEY = 'fuelstop_social_links';

export const DEFAULT_LINKS = [
  { name: 'Instagram', url: 'https://instagram.com/fuelstop.smoothies/', icon: 'instagram' },
  { name: 'GoFood',    url: 'https://gofood.co.id/',          icon: 'gofood'    }
];

/**
 * createHarness(storage)
 *
 * Returns an object with all testable functions bound to the provided
 * storage object (must implement getItem / setItem / removeItem).
 *
 * @param {Storage | { getItem, setItem, removeItem, clear }} storage
 */
export function createHarness(storage) {
  // In-memory fallback mirrors _socialLinksMemory in main.js
  let _memory = null;

  function readLinks() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return _memory;
    }
  }

  function writeLinks(arr) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      _memory = arr;
    }
  }

  /**
   * saveSocialLink(entry, index)
   * index === -1  → add (append)
   * index >= 0    → edit (replace at index)
   */
  function saveSocialLink(entry, index) {
    const links = readLinks() || [];

    if (index === -1) {
      links.push(entry);
    } else {
      links[index] = entry;
    }

    writeLinks(links);

    // Return the written links array for test assertions
    return links;
  }

  /**
   * deleteSocialLink(index)
   * Removes the entry at the given index and persists the result.
   */
  function deleteSocialLink(index) {
    const links = readLinks() || [];
    links.splice(index, 1);
    writeLinks(links);
    return links;
  }

  /**
   * initSocialLinks()
   * Seeds the default entries when the key is absent.
   */
  function initSocialLinks() {
    let links = readLinks();
    if (!links) {
      links = DEFAULT_LINKS.slice();
      writeLinks(links);
    }
    return links;
  }

  return { readLinks, writeLinks, saveSocialLink, deleteSocialLink, initSocialLinks };
}

/**
 * createLocalStorageStub()
 * Returns a minimal in-memory localStorage stub suitable for Node testing.
 */
export function createLocalStorageStub() {
  let store = Object.create(null);
  return {
    getItem(key)        { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key)     { delete store[key]; },
    clear()             { store = Object.create(null); }
  };
}

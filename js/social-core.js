/**
 * social-core.js
 * ES-module version of the social-link functions from main.js.
 * Exported so that Vitest + fast-check property tests can import and
 * exercise the pure logic without a browser environment.
 *
 * The localStorage dependency is injected via the `storage` parameter on
 * each function so tests can supply a stub without touching globalThis.
 */

'use strict';

// ── Design constants ──────────────────────────────────────────────────────
export var STORAGE_KEY = 'fuelstop_social_links';

export var DEFAULT_LINKS = [
  { name: 'Instagram', url: 'https://instagram.com/fuelstop.smoothies/', icon: 'instagram' },
  { name: 'GoFood',    url: 'https://gofood.co.id/',          icon: 'gofood'    }
];

// ── Storage helpers ───────────────────────────────────────────────────────

/**
 * readLinks(storage) — read Social_Media_Link array from the provided
 * storage object (localStorage or a stub). Returns the parsed array, or
 * null if the key does not exist.
 *
 * @param {Storage} storage
 * @returns {Array|null}
 */
export function readLinks(storage) {
  try {
    var raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * writeLinks(arr, storage) — persist the full array to the provided
 * storage object.
 *
 * @param {Array} arr
 * @param {Storage} storage
 */
export function writeLinks(arr, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // Silently swallow write errors in module form (tests won't trigger this)
  }
}

/**
 * initSocialLinks(storage) — bootstrap: if no data exists in the
 * provided storage, write the default seed exactly once.
 * Returns the current links array (useful for assertions in tests).
 *
 * Requirements: 6.3
 *
 * @param {Storage} storage
 * @returns {Array}
 */
export function initSocialLinks(storage) {
  var links = readLinks(storage);
  if (!links) {
    // First visit — write the default seed exactly once
    links = DEFAULT_LINKS.slice();
    writeLinks(links, storage);
  }
  return links;
}

/**
 * validateSocialForm({ name, url })
 * Pure validation — identical logic to main.js.
 * Requirements: 7.6, 7.7
 *
 * @param {{ name: string, url: string }} param0
 * @returns {{ valid: true } | { valid: false, errors: { name?: string, url?: string } }}
 */
export function validateSocialForm(_ref) {
  var name = _ref.name;
  var url  = _ref.url;

  var errors = {};

  var trimmedName = (name || '').trim();
  if (trimmedName.length === 0) {
    errors.name = 'Nama platform tidak boleh kosong.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Nama platform tidak boleh lebih dari 100 karakter.';
  }

  var trimmedUrl = (url || '').trim();
  if (trimmedUrl.length === 0) {
    errors.url = 'URL tidak boleh kosong.';
  } else if (trimmedUrl.length > 2048) {
    errors.url = 'URL tidak boleh lebih dari 2048 karakter.';
  } else if (
    trimmedUrl.indexOf('http://') !== 0 &&
    trimmedUrl.indexOf('https://') !== 0
  ) {
    errors.url = 'URL harus dimulai dengan http:// atau https://.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors: errors };
  }

  return { valid: true };
}

/**
 * saveSocialLink(entry, index, storage) — add or edit an entry.
 * index === -1 → append; index >= 0 → replace at that position.
 * Requirements: 7.3, 7.4
 *
 * @param {{ name: string, url: string, icon: string }} entry
 * @param {number} index
 * @param {Storage} storage
 */
export function saveSocialLink(entry, index, storage) {
  var links = readLinks(storage) || [];

  if (index === -1) {
    links.push(entry);
  } else {
    links[index] = entry;
  }

  writeLinks(links, storage);
  return links;
}

/**
 * deleteSocialLink(index, storage) — remove entry at index.
 * Requirements: 7.5
 *
 * @param {number} index
 * @param {Storage} storage
 * @returns {Array}
 */
export function deleteSocialLink(index, storage) {
  var links = readLinks(storage) || [];
  links.splice(index, 1);
  writeLinks(links, storage);
  return links;
}

/**
 * social-links-core.js
 * Exportable ES-module version of the Social_Media_Link storage and
 * validation logic from main.js.  Imported by Vitest property-based tests
 * so the real implementation can be exercised without a browser IIFE wrapper.
 */

'use strict';

export var STORAGE_KEY = 'fuelstop_social_links';

export var DEFAULT_LINKS = [
  { name: 'Instagram', url: 'https://instagram.com/fuelstop.smoothies/', icon: 'instagram' },
  { name: 'GoFood',    url: 'https://gofood.co.id/',          icon: 'gofood'    },
];

// In-memory fallback when localStorage is unavailable
var _socialLinksMemory = null;

/**
 * readLinks — read Social_Media_Link array from localStorage (or memory).
 * Returns the parsed array, or null if the key does not exist.
 */
export function readLinks() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return _socialLinksMemory;
  }
}

/**
 * writeLinks — persist the full array to localStorage (or memory).
 */
export function writeLinks(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('[FuelStop] localStorage unavailable — using in-memory fallback.', e);
    _socialLinksMemory = arr;
  }
}

/**
 * validateSocialForm({ name, url })
 * Pure validation function — identical to the one in main.js.
 * Requirements: 7.6, 7.7
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
 * saveSocialLink(entry, index)
 * - Add mode   (index === -1): appends entry to the end of the array.
 * - Edit mode  (index >= 0):   replaces the element at that index.
 * Persists the updated array to localStorage.
 * Requirements: 7.3, 7.4, 6.5
 */
export function saveSocialLink(entry, index) {
  var links = readLinks() || [];

  if (index === -1) {
    links.push(entry);
  } else {
    links[index] = entry;
  }

  writeLinks(links);
}

/**
 * deleteSocialLink(index)
 * Removes the entry at the given index and persists the updated array.
 * Requirements: 7.5, 6.5
 */
export function deleteSocialLink(index) {
  var links = readLinks() || [];
  links.splice(index, 1);
  writeLinks(links);
}

/**
 * initSocialLinks
 * Writes the default seed if localStorage has no data, then returns links.
 * Requirements: 6.3
 */
export function initSocialLinks() {
  var links = readLinks();
  if (!links) {
    links = DEFAULT_LINKS.slice();
    writeLinks(links);
  }
  return links;
}

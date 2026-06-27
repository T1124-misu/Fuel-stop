# Implementation Plan: Fuel Stop Landing Page

## Overview

Build a self-contained, static landing page for Fuel Stop using pure HTML, CSS, and Vanilla JavaScript. The implementation follows a mobile-first approach, with no build tools, no package manager, and no backend server. All sections are coded in a single `index.html`, styled via `css/style.css`, and wired via `js/main.js`.

## Tasks

- [x] 1. Set up project structure and design tokens
  - Create `index.html`, `css/style.css`, and `js/main.js` at the root
  - Create `assets/` directory for stock photos and `assets/icons/` for SVG social icons
  - Scaffold the HTML `<head>` with viewport meta, charset, stylesheet link, and deferred script tag
  - Define all CSS custom properties (`:root` design tokens): brand gradient, accent colour, footer background, typography scale, spacing, and grid-column variables
  - Add CSS reset (`box-sizing: border-box`, margin/padding zero, `scroll-behavior: smooth`)
  - Add `.container` utility class (max-width 1280 px, centred, horizontal padding)
  - _Requirements: 1.4, 1.5, 1.6, 8.1, 8.4_

- [x] 2. Implement sticky navigation bar
  - [x] 2.1 Build the navbar HTML structure
    - Add `<nav id="navbar">` with brand link, hamburger `<button>`, and `<ul id="navbar-menu">` with five `<li><a class="nav-link">` items (Home, Products, Vision & Mission, Team, Contact)
    - _Requirements: 9.1, 9.2_
  - [x] 2.2 Style the navbar with mobile-first CSS
    - `position: sticky; top: 0; z-index: 100` for the navbar
    - On `< 768px`: hide `.navbar__menu` by default; `.navbar__menu--open` sets `display: flex; flex-direction: column`; hamburger button visible
    - On `≥ 768px`: `.navbar__menu` is `display: flex; flex-direction: row`; hamburger button `display: none`
    - Apply `nav-link--active` highlight style
    - Apply 44×44 px minimum tap target for nav links on `< 768px`
    - _Requirements: 9.4, 1.7_
  - [x] 2.3 Implement hamburger menu JS (`initHamburger`)
    - Toggle `.navbar__menu--open` on hamburger click; update `aria-expanded`
    - Collapse menu when any `.nav-link` inside the menu is clicked
    - _Requirements: 9.5, 9.6_
  - [x] 2.4 Implement resize handler JS (`initResizeHandler`)
    - Remove `.navbar__menu--open` when viewport width reaches ≥ 768 px
    - _Requirements: 9.8_
  - [x] 2.5 Implement smooth-scroll JS (`initSmoothScroll`)
    - Intercept all `<a href="#...">` clicks and call `scrollIntoView({ behavior: 'smooth' })`
    - _Requirements: 9.3, 9.7_
  - [x] 2.6 Implement scrollspy JS (`initScrollspy`)
    - Create `IntersectionObserver` watching each `<section>` with `rootMargin: "-40% 0px -55% 0px"`
    - Add `nav-link--active` to the matching link; remove from all others
    - _Requirements: 9.9_

- [x] 3. Implement hero section
  - [x] 3.1 Build hero HTML and CSS
    - Add `<section id="hero">` with `<h1>Fuel Stop</h1>`, tagline `<p>`, CTA `<a class="btn btn--primary" href="#products">Lihat Produk</a>`, and hero `<img class="stock-photo">`
    - Style as single-column on mobile; two-column grid (content + image) at `≥ 768px`
    - Style `.btn--primary` with brand gradient background; minimum 44×44 px tap target on mobile
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - [x] 3.2 Implement image fallback for hero photo (`initImageFallbacks`)
    - Attach `onerror` handler: set `style.background = '#F8F6F0'` and remove `src` attribute
    - _Requirements: 2.4_

- [x] 4. Implement vision & mission section
  - [x] 4.1 Build vision & mission HTML and CSS
    - Add `<section id="vision-mission">` with two child divs: `.vm__visi` (heading "Visi" + paragraph) and `.vm__misi` (heading "Misi" + `<ul>` with all five mission statements)
    - Grid: `1fr` on mobile; `1fr 1fr` at `≥ 768px`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement product section
  - [x] 5.1 Build product grid HTML and CSS
    - Add `<section id="products">` with `<h2>Produk Kami</h2>` and `.products__grid` containing 3–12 `<article class="product-card">` elements
    - Each card: `<img loading="lazy" onerror="...">`, `<h3>` product name (≤ 50 chars), `<p>` description (≤ 150 chars)
    - Apply `--product-cols` CSS custom property grid: 1 col mobile, 2 col tablet (≥ 768 px), 3 col desktop (≥ 1024 px)
    - Apply `loading="lazy"` to all product images that are below the fold
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 8.5_
  - [x] 5.2 Implement product image fallbacks
    - `onerror` sets `style.background = '#F8F6F0'`; `alt` attribute already contains product name
    - _Requirements: 4.4_

- [x] 6. Implement team section
  - [x] 6.1 Build team grid HTML and CSS
    - Add `<section id="team">` with `.team__grid` containing exactly five `<article class="team-card">` elements for each named team member and role
    - Each card: `<img loading="lazy" onerror="..." style="min-width:100px;min-height:100px">`, `<h3>` full name, `<p>` role
    - Apply `--team-cols` CSS custom property grid: 1 col mobile, 2 col tablet (≥ 768 px), 3 col desktop (≥ 1024 px)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  - [x] 6.2 Implement team image fallbacks
    - `onerror` sets `style.background = '#F8F6F0'`
    - _Requirements: 5.4_

- [ ] 7. Checkpoint — Ensure layout and static sections are correct
  - Verify no horizontal scroll on 320 px viewport
  - Verify single-column layout on < 768 px and multi-column on ≥ 768 px for hero, vision-mission, products, and team
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement social media links with localStorage
  - [x] 8.1 Implement `initSocialLinks()` and default seed
    - On page load, check `localStorage` for `fuelstop_social_links` key; if absent, write the two default entries (Instagram, GoFood) and render
    - Wrap `localStorage` access in `try/catch`; fall back to in-memory array and log a console warning on failure
    - _Requirements: 6.3_
  - [x] 8.2 Implement `renderSocialButtons(container, links)`
    - Clear the target container, then build one `<a class="social-btn" target="_blank" rel="noopener noreferrer">` per entry with an `<img>` icon; `onerror` replaces broken icon `<img>` with a `TextNode` of the platform name
    - Call with both `#social-buttons` and `#footer-social-buttons`
    - _Requirements: 6.1, 6.2, 6.4, 10.2_
  - [ ] 8.3 Write property test for Property 1: Social link round-trip persistence
    - **Property 1: Social link round-trip persistence**
    - Use fast-check to generate arbitrary valid `{name, url, icon}` objects; call `saveSocialLink()` and assert the stored array contains the entry with identical field values
    - **Validates: Requirements 7.3, 6.3**
  - [ ] 8.4 Write property test for Property 5: Default seed is written exactly once
    - **Property 5: Default seed is written exactly once**
    - Reset the localStorage stub; call `initSocialLinks()` twice; assert the stored array has exactly 2 entries after both calls
    - **Validates: Requirements 6.3**
  - [ ] 8.5 Write property test for Property 6: Social section re-renders for every mutation
    - **Property 6: Social section re-renders for every mutation**
    - Use fast-check to generate arbitrary sequences of add/edit/delete operations; after each operation assert that DOM content of `#social-buttons` and `#footer-social-buttons` exactly matches localStorage
    - **Validates: Requirements 6.1, 6.5, 7.3, 7.4, 7.5, 10.2**

- [ ] 9. Implement social media validation and operator panel
  - [x] 9.1 Implement `validateSocialForm({ name, url })`
    - Return `{ valid: false, errors }` when name is empty or > 100 chars, or when URL is empty, > 2048 chars, or does not start with `http://` or `https://`
    - Return `{ valid: true }` for all valid inputs
    - _Requirements: 7.6, 7.7_
  - [ ] 9.2 Write property test for Property 2: Validation rejects all invalid entries
    - **Property 2: Validation rejects all invalid Social_Media_Link entries**
    - Use fast-check to generate invalid inputs (empty name, name > 100 chars, empty URL, URL > 2048 chars, URL without protocol, malformed protocol); assert `validateSocialForm()` always returns `valid: false` and never writes to localStorage
    - **Validates: Requirements 7.6, 7.7**
  - [x] 9.3 Implement `saveSocialLink(entry, index)` and `deleteSocialLink(index)`
    - Add mode (`index = -1`): append entry to array; persist full array to localStorage; call `renderSocialButtons()`
    - Edit mode (`index ≥ 0`): replace element at that index; persist; call `renderSocialButtons()`
    - Delete: splice out element at index; persist; call `renderSocialButtons()`
    - Wrap writes in `try/catch`; show inline error in operator panel on failure
    - _Requirements: 7.3, 7.4, 7.5, 6.5_
  - [ ] 9.4 Write property test for Property 3: Delete removes exactly the targeted entry
    - **Property 3: Delete removes exactly the targeted entry**
    - Use fast-check to generate arrays of 1–20 entries and arbitrary valid indices; call `deleteSocialLink(i)`; assert resulting array has `n-1` entries and all remaining entries are unchanged
    - **Validates: Requirements 7.5, 6.5**
  - [ ] 9.5 Write property test for Property 4: Edit preserves all other entries
    - **Property 4: Edit preserves all other entries**
    - Use fast-check to generate arrays and valid index/replacement pairs; call `saveSocialLink(newEntry, i)`; assert array length unchanged and all entries at `j ≠ i` are identical to originals
    - **Validates: Requirements 7.4**
  - [x] 9.6 Build operator panel HTML and CSS
    - Add `<dialog id="operator-panel">` with entry list `<ul id="op-link-list">`, form (`op-name`, `op-url`, `op-icon`, `op-index` hidden field), aria-live error spans, Save/Cancel buttons, and close button
    - Feature-detect `HTMLDialogElement`; fall back to `<div role="dialog">` with CSS class toggle
    - Style panel with form layout and `.field-error` error state
    - _Requirements: 7.1, 7.2_
  - [ ] 9.7 Implement `initOperatorPanel()`
    - Register `keydown` listener for `Shift+Alt+A` → `dialog.showModal()`
    - Wire close button and Cancel button → `dialog.close()`; `Escape` handled natively by `<dialog>`
    - On form submit: call `validateSocialForm()`; if errors inject into aria-live spans and abort; otherwise call `saveSocialLink()` and close panel
    - Populate `#op-link-list` with Edit/Delete controls for each stored entry; clicking Edit fills the form fields and sets `op-index`; clicking Delete calls `deleteSocialLink()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 10. Checkpoint — Ensure social links and operator panel work end-to-end
  - Verify default seed appears on first load with no existing localStorage key
  - Verify add/edit/delete all update the social section within 500 ms
  - Verify validation errors are displayed and save is blocked for invalid inputs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement footer
  - [x] 11.1 Build footer HTML and CSS
    - Add `<footer id="footer">` with brand name paragraph, `<div id="footer-social-buttons" role="list">` (populated by `renderSocialButtons()`), and copyright paragraph with `<span id="footer-year">`
    - Set footer background to `#00a560` (contrast ≥ 3:1 against `#F8F6F0` body sections)
    - Populate `#footer-year` with `new Date().getFullYear()` in `main.js`
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 12. Wire everything together and apply global layout rules
  - [ ] 12.1 Add `<section id="social">` HTML and confirm render call
    - Add `<section id="social" class="social">` with heading and `<div id="social-buttons" role="list">`
    - Ensure `initSocialLinks()` calls `renderSocialButtons()` for both `#social-buttons` and `#footer-social-buttons`
    - _Requirements: 6.1_
  - [ ] 12.2 Wire all init functions in the main IIFE
    - Call `initSocialLinks()`, `initOperatorPanel()`, `initScrollspy()`, `initHamburger()`, `initResizeHandler()`, `initSmoothScroll()`, `initImageFallbacks()` inside a single IIFE in `main.js`
    - Ensure `DOMContentLoaded` or deferred script execution order
    - _Requirements: 8.1, 8.3, 8.4_
  - [ ] 12.3 Apply global responsive and accessibility rules
    - Confirm no horizontal overflow on 320–2560 px viewports (test with CSS `overflow-x: hidden` on `body` as guard)
    - Confirm minimum font size 14 px and line-height 1.4 across all viewports
    - Confirm `loading="lazy"` is applied to all below-the-fold images
    - _Requirements: 1.1, 1.6, 8.5_

- [ ] 13. Write unit tests for pure JS functions
  - [ ] 13.1 Write unit tests for `validateSocialForm`
    - Test valid entries, empty name, name > 100 chars, empty URL, URL > 2048 chars, URL without protocol, malformed protocol
    - _Requirements: 7.6, 7.7_
  - [ ] 13.2 Write unit tests for `saveSocialLink` and `deleteSocialLink`
    - Add mode (`index = -1`) and edit mode; first/middle/last element deletion
    - _Requirements: 7.3, 7.4, 7.5_
  - [ ] 13.3 Write unit tests for `renderSocialButtons`
    - Verify correct `<a>` count, `href` values, `target="_blank"`, and text-label fallback when icon is missing
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Run full test suite (unit tests + property tests)
  - Verify no uncaught JavaScript errors in browser console on Chrome, Firefox, Edge, and Safari
  - Verify above-the-fold render on 360×640 viewport at simulated 20 Mbps
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural breaks in the work
- Property tests use **fast-check** and validate universal correctness properties (Properties 1–6)
- Unit tests use **Vitest** (or plain Node `assert`) with a `localStorage` stub for browser-agnostic testing
- Property 7 (responsive column count invariant) is a pure CSS rule — it is covered by the responsive CSS implementation in tasks 2.2, 5.1, and 6.1 and verified at the checkpoints; no separate JS property test task is needed
- All stock photos are referenced only by `src` attribute; swapping an image requires no code change beyond the `src` string
- The operator panel uses the native `<dialog>` element with a fallback for unsupported browsers

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "5.2", "6.2", "8.1", "9.6", "11.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.5", "2.6", "8.2", "9.1", "9.3"] },
    { "id": 4, "tasks": ["8.3", "8.4", "9.2", "9.4", "9.5", "9.7", "12.1"] },
    { "id": 5, "tasks": ["8.5", "12.2"] },
    { "id": 6, "tasks": ["12.3"] },
    { "id": 7, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```

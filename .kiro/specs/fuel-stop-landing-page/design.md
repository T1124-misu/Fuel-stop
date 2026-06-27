# Design Document — Fuel Stop Landing Page

## Overview

The Fuel Stop landing page is a self-contained, static web application built with pure HTML, CSS, and Vanilla JavaScript. There is no build step, no package manager, and no server-side rendering. The page can be opened directly from the filesystem (`file://`) or served from any static host, and it can be packaged as a browser extension.

The primary design goals are:

- **Mobile-first**: default styles target 320 px viewports; enhancements are applied progressively via `min-width` media queries at 768 px and 1024 px.
- **Zero-dependency**: all behaviour is implemented with browser-native APIs (CSS Grid/Flexbox, Intersection Observer, Local Storage, `scroll-behavior: smooth`).
- **Operator-editable social links**: social media data lives in `localStorage` and is managed through a hidden overlay activated by `Shift+Alt+A`.
- **Fast above-the-fold render**: only the navbar and hero section require network resources in the critical path; everything below the fold uses `loading="lazy"`.

Key technologies used:

| Concern | Approach |
|---|---|
| Responsive layout | CSS Grid + Flexbox, custom properties for column counts |
| Active-nav scrollspy | `IntersectionObserver` with `rootMargin` bias |
| Hamburger menu | CSS checkbox hack + JS class toggle (no inline style) |
| Social link persistence | `localStorage` JSON array |
| Operator UI | Hidden `<dialog>` element |
| Image fallbacks | `onerror` handler sets `style.background` to `#F8F6F0` |
| Lazy images | Native `loading="lazy"` attribute |

---

## Architecture

### File Structure

```
Fuel-stop/
├── index.html          ← single HTML file; all sections inline
├── css/
│   └── style.css       ← all styles; mobile-first, custom properties
└── js/
    └── main.js         ← all behaviour; module-pattern IIFEs
```

No other files are required to run the page. Stock photos are referenced by `src` attributes in `index.html`; swapping an image requires only changing the `src` string.

### High-Level Component Map

```
index.html
├── <head>
│   ├── <meta viewport>
│   ├── <link rel="stylesheet" href="css/style.css">
│   └── <script defer src="js/main.js">
└── <body>
    ├── <nav id="navbar">          ← sticky, scrollspy, hamburger
    ├── <main>
    │   ├── <section id="hero">
    │   ├── <section id="vision-mission">
    │   ├── <section id="products">
    │   ├── <section id="team">
    │   └── <section id="social">
    ├── <footer id="footer">
    └── <dialog id="operator-panel">  ← hidden operator UI
```

### Module Responsibilities (js/main.js)

The JavaScript file is structured as a single IIFE containing named sub-functions. No ES modules syntax is used (for maximum compatibility without a build step).

```
main.js
├── initSocialLinks()        — bootstrap localStorage; render Social_Section
├── renderSocialButtons()    — generate <a> tags from stored JSON; called on every mutation
├── initOperatorPanel()      — register Shift+Alt+A listener; wire form submit/close/delete
├── validateSocialForm()     — pure validation function; returns {valid, errors}
├── saveSocialLink()         — add / update entry in localStorage, call renderSocialButtons()
├── deleteSocialLink()       — remove entry by index, call renderSocialButtons()
├── initScrollspy()          — IntersectionObserver; toggle .nav-link--active class
├── initHamburger()          — toggle .navbar__menu--open on hamburger click/tap
├── initResizeHandler()      — collapse hamburger when viewport ≥ 768 px
├── initSmoothScroll()       — intercept anchor clicks; call scrollIntoView({behavior:'smooth'})
└── initImageFallbacks()     — attach onerror handlers to all Stock_Photo <img> elements
```

---

## Components and Interfaces

### 2.1 Sticky Navbar

**HTML structure:**

```html
<nav id="navbar" class="navbar" aria-label="Main navigation">
  <a class="navbar__brand" href="#hero">Fuel Stop</a>
  <button class="navbar__hamburger" aria-label="Toggle menu" aria-expanded="false">
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
  </button>
  <ul class="navbar__menu" id="navbar-menu" role="list">
    <li><a class="nav-link" href="#hero">Home</a></li>
    <li><a class="nav-link" href="#products">Products</a></li>
    <li><a class="nav-link" href="#vision-mission">Vision &amp; Mission</a></li>
    <li><a class="nav-link" href="#team">Team</a></li>
    <li><a class="nav-link" href="#social">Contact</a></li>
  </ul>
</nav>
```

**CSS behaviour:**
- `position: sticky; top: 0; z-index: 100`
- On `< 768px`: `.navbar__menu` is `display: none` by default; class `.navbar__menu--open` sets `display: flex; flex-direction: column`
- On `≥ 768px`: `.navbar__menu` is `display: flex; flex-direction: row` unconditionally; hamburger button is `display: none`

**JS behaviour (`initScrollspy`):**
An `IntersectionObserver` watches each `<section>` with `rootMargin: "-40% 0px -55% 0px"` so that the section "in the middle third" of the viewport is considered active. When an entry becomes intersecting, the corresponding `.nav-link` receives class `nav-link--active`; all other links lose it.

**JS behaviour (`initHamburger`):**
Clicking the hamburger button toggles `.navbar__menu--open` on `#navbar-menu` and updates `aria-expanded` on the button. A click on any `.nav-link` inside the menu also collapses it.

**JS behaviour (`initResizeHandler`):**
A `ResizeObserver` (or `window.addEventListener('resize', ...)` with debounce) removes `.navbar__menu--open` when the viewport is ≥ 768 px.

---

### 2.2 Hero Section

```html
<section id="hero" class="hero">
  <div class="hero__content">
    <h1 class="hero__title">Fuel Stop</h1>
    <p class="hero__tagline">Jus &amp; Smoothies Segar, Praktis, Easy-to-Go</p>
    <a class="btn btn--primary" href="#products">Lihat Produk</a>
  </div>
  <div class="hero__image-wrap">
    <img class="hero__img stock-photo"
         src="assets/hero.jpg"
         alt="Fuel Stop hero image"
         onerror="this.style.background='#F8F6F0';this.removeAttribute('src')">
  </div>
</section>
```

The CTA button `href="#products"` is intercepted by `initSmoothScroll()` so the page animates rather than jumping.

---

### 2.3 Vision & Mission Section

```html
<section id="vision-mission" class="vision-mission">
  <div class="vm__visi">
    <h2>Visi</h2>
    <p>Menjadi produk smoothies meal replacement …</p>
  </div>
  <div class="vm__misi">
    <h2>Misi</h2>
    <ul>
      <li>Menghasilkan produk berbahan alami …</li>
      <!-- 4 more items -->
    </ul>
  </div>
</section>
```

Grid: `grid-template-columns: 1fr` on mobile; `grid-template-columns: 1fr 1fr` at `≥ 768px`.

---

### 2.4 Product Section

```html
<section id="products" class="products">
  <h2 class="section-title">Produk Kami</h2>
  <div class="products__grid">
    <!-- 3–12 cards -->
    <article class="product-card">
      <img class="product-card__img stock-photo"
           src="assets/product-1.jpg"
           alt="Nama Produk"
           loading="lazy"
           onerror="this.style.background='#F8F6F0'">
      <div class="product-card__body">
        <h3 class="product-card__name">Nama Produk</h3>
        <p class="product-card__desc">Deskripsi singkat ≤ 150 karakter</p>
      </div>
    </article>
  </div>
</section>
```

Grid responsive rule (CSS custom property approach):

```css
.products__grid {
  display: grid;
  gap: var(--grid-gap, 1.5rem);
  grid-template-columns: repeat(var(--product-cols, 1), 1fr);
}

@media (min-width: 768px) {
  .products__grid { --product-cols: 2; }
}
@media (min-width: 1024px) {
  .products__grid { --product-cols: 3; }
}
```

---

### 2.5 Team Section

Structure mirrors the product section. Five member cards are hard-coded in HTML. Each card:

```html
<article class="team-card">
  <img class="team-card__photo stock-photo"
       src="assets/team-rafi.jpg"
       alt="Muhammad Rafi Kanza"
       loading="lazy"
       onerror="this.style.background='#F8F6F0'">
  <h3 class="team-card__name">Muhammad Rafi Kanza</h3>
  <p class="team-card__role">CEO</p>
</article>
```

Same `--team-cols` custom property pattern: 1 → 2 → 3 columns across breakpoints.

---

### 2.6 Social Section

```html
<section id="social" class="social">
  <h2 class="section-title">Ikuti Kami</h2>
  <div class="social__buttons" id="social-buttons" role="list">
    <!-- Populated entirely by renderSocialButtons() from localStorage -->
  </div>
</section>
```

`renderSocialButtons()` reads the JSON array from `localStorage`, clears `#social-buttons`, then builds one `<a>` element per entry:

```html
<a class="social-btn"
   href="{url}"
   target="_blank"
   rel="noopener noreferrer"
   role="listitem"
   aria-label="{name}">
  <img class="social-btn__icon"
       src="assets/icons/{icon}.svg"
       alt="{name}"
       onerror="this.replaceWith(document.createTextNode('{name}'))">
</a>
```

The footer's social buttons share the same render function — `renderSocialButtons()` accepts a DOM container argument and is called with both `#social-buttons` and `#footer-social-buttons`.

---

### 2.7 Operator Panel

```html
<dialog id="operator-panel" class="operator-panel" aria-labelledby="op-title">
  <h2 id="op-title">Kelola Tautan Media Sosial</h2>
  <ul id="op-link-list"><!-- existing entries listed here --></ul>
  <form id="op-form" novalidate>
    <input id="op-name"  type="text"  placeholder="Nama platform" maxlength="100">
    <span  id="op-name-error"  class="field-error" aria-live="polite"></span>
    <input id="op-url"   type="url"   placeholder="https://…" maxlength="2048">
    <span  id="op-url-error"   class="field-error" aria-live="polite"></span>
    <input id="op-icon"  type="text"  placeholder="Nama file ikon (tanpa ekstensi)">
    <input id="op-index" type="hidden" value="-1">
    <button type="submit">Simpan</button>
    <button type="button" id="op-cancel">Batal</button>
  </form>
  <button id="op-close" aria-label="Tutup panel">✕</button>
</dialog>
```

The `<dialog>` element is used natively (`dialog.showModal()` / `dialog.close()`). The keyboard shortcut `Shift+Alt+A` calls `dialog.showModal()`. Pressing `Escape` closes it via the browser's built-in dialog cancel behaviour; the close button and `op-cancel` button also call `dialog.close()`.

`op-index` hidden field is `-1` for new entries, or the array index for edits. On submit, `validateSocialForm()` is called; if it returns errors, they are injected into the `aria-live` error spans and the save is aborted.

---

### 2.8 Footer

```html
<footer id="footer" class="footer">
  <p class="footer__brand">Fuel Stop</p>
  <div class="footer__social" id="footer-social-buttons" role="list"></div>
  <p class="footer__copy">&copy; <span id="footer-year"></span> Fuel Stop. All rights reserved.</p>
</footer>
```

`<span id="footer-year">` is populated by `new Date().getFullYear()` in `main.js`. The footer background uses `#00a560` (the dark end of the brand gradient) to satisfy the ≥ 3:1 contrast ratio against the `#F8F6F0` light accent body sections.

---

## Data Models

### Social_Media_Link (localStorage)

**Key:** `fuelstop_social_links`  
**Type:** JSON-serialised array

```json
[
  {
    "name": "Instagram",
    "url": "https://instagram.com/fuelstop",
    "icon": "instagram"
  },
  {
    "name": "GoFood",
    "url": "https://gofood.co.id/...",
    "icon": "gofood"
  }
]
```

| Field | Type | Constraints |
|---|---|---|
| `name` | `string` | 1–100 characters (non-empty after trim) |
| `url` | `string` | 1–2048 characters; must start with `http://` or `https://` |
| `icon` | `string` | Filename stem of SVG in `assets/icons/`; may be empty string (falls back to text label) |

**Array index** is the record's implicit ID. Edits replace the element at the stored index; deletes splice it out. The full array is re-serialised and written back on every mutation.

**Default seed** (written once when the key is absent):

```js
const DEFAULT_LINKS = [
  { name: "Instagram", url: "https://instagram.com/fuelstop", icon: "instagram" },
  { name: "GoFood",    url: "https://gofood.co.id/",          icon: "gofood"    }
];
```

### CSS Custom Properties (design tokens)

```css
:root {
  /* Brand colours */
  --color-grad-start:  #c1ff72;
  --color-grad-end:    #00a560;
  --color-accent:      #F8F6F0;
  --color-footer-bg:   #00a560;

  /* Gradient utility */
  --brand-gradient: linear-gradient(90deg, var(--color-grad-start), var(--color-grad-end));

  /* Typography */
  --font-size-base:    16px;
  --font-size-min:     14px;
  --line-height-base:  1.5;
  --line-height-min:   1.4;

  /* Spacing */
  --section-padding:   4rem 1rem;
  --grid-gap:          1.5rem;

  /* Grid columns (overridden at each breakpoint) */
  --product-cols: 1;
  --team-cols:    1;
}
```

---

## CSS Architecture

The single `css/style.css` file is organised in layer order:

1. **Reset / base** — `box-sizing: border-box`, `margin: 0`, font defaults, `scroll-behavior: smooth`
2. **Design tokens** — `:root` custom properties (see above)
3. **Typography** — heading scale, body text, minimum sizes
4. **Layout utilities** — `.container` (max-width 1280 px, centred, horizontal padding)
5. **Navbar** — sticky, hamburger states, active link style
6. **Hero** — two-column grid on tablet+, full-height on mobile
7. **Vision & Mission** — two-column grid on tablet+
8. **Products grid** — `--product-cols` custom property pattern
9. **Team grid** — `--team-cols` custom property pattern
10. **Social section** — flex-wrap row of icon buttons
11. **Operator panel** — `<dialog>` styles, form layout, error states
12. **Footer** — background colour, flex layout, contrast
13. **Utilities** — `.btn`, `.section-title`, `.field-error`, `.sr-only`

**Responsive strategy:** All base styles are written for `min-width: 320px`. Media queries use `min-width: 768px` (tablet) and `min-width: 1024px` (desktop). No `max-width` queries are used, avoiding overlap conflicts.

**Tap target compliance:** on `< 768px`, all `<a>`, `<button>` elements in interactive contexts receive:

```css
@media (max-width: 767px) {
  .nav-link, .btn, .social-btn, .hamburger-btn {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Social link round-trip persistence

*For any* valid `Social_Media_Link` object (name 1–100 chars, URL starting with `http://` or `https://` and ≤ 2048 chars, any icon string), adding it via `saveSocialLink()` and then reading back the `fuelstop_social_links` key from `localStorage` SHALL yield an array that contains an entry with identical `name`, `url`, and `icon` values.

**Validates: Requirements 7.3, 6.3**

---

### Property 2: Validation rejects all invalid Social_Media_Link entries

*For any* input where `name` is empty or longer than 100 characters, OR where `url` is empty, longer than 2048 characters, or does not begin with `http://` or `https://`, calling `validateSocialForm()` SHALL return `valid: false` and SHALL NOT write to `localStorage`.

**Validates: Requirements 7.6, 7.7**

---

### Property 3: Delete removes exactly the targeted entry

*For any* `localStorage` array of `n` Social_Media_Link entries (n ≥ 1), calling `deleteSocialLink(i)` for any valid index `i` SHALL result in an array of `n − 1` entries where every remaining entry is identical to the original array minus the element at index `i`.

**Validates: Requirements 7.5, 6.5**

---

### Property 4: Edit preserves all other entries

*For any* `localStorage` array of `n` Social_Media_Link entries (n ≥ 1) and any valid index `i`, calling `saveSocialLink(newEntry, i)` with a valid `newEntry` SHALL result in an array of still `n` entries where every entry at index `j ≠ i` is unchanged and the entry at index `i` reflects the new values.

**Validates: Requirements 7.4**

---

### Property 5: Default seed is written exactly once

*For any* browser session where `localStorage` does not contain the `fuelstop_social_links` key, calling `initSocialLinks()` SHALL write the two default entries. Calling `initSocialLinks()` a second time when the key is already present SHALL NOT overwrite or duplicate the existing data.

**Validates: Requirements 6.3**

---

### Property 6: Social section re-renders for every mutation

*For any* sequence of add / edit / delete operations on the Social_Media_Link array, after each operation the DOM content of `#social-buttons` and `#footer-social-buttons` SHALL match exactly the entries currently stored in `localStorage` — no stale or phantom buttons.

**Validates: Requirements 6.1, 6.5, 7.3, 7.4, 7.5, 10.2**

---

### Property 7: Responsive column count invariant

*For any* viewport width `w`, the product grid and team grid SHALL display the correct number of columns: 1 column when `w ≤ 767px`, 2 columns when `768px ≤ w ≤ 1023px`, and ≥ 3 columns when `w ≥ 1024px`. No two column rules SHALL be simultaneously active for the same grid at the same viewport width.

**Validates: Requirements 1.2, 1.3, 4.3, 5.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Hero image fails to load | `onerror`: sets `style.background = '#F8F6F0'` and removes the broken `src` |
| Product / team image fails | Same `onerror` pattern; `alt` text remains visible |
| Social icon SVG fails | `onerror` on `<img>` replaces the element with a `TextNode` of the platform name |
| `localStorage` read throws (e.g. private mode quota) | `try/catch` in `initSocialLinks()`; falls back to in-memory array and logs a console warning |
| `localStorage` write throws | `try/catch` in `saveSocialLink()` / `deleteSocialLink()`; shows an inline error message in the operator panel |
| Operator saves invalid form | `validateSocialForm()` returns errors; injected into `aria-live` spans; save is blocked |
| `<dialog>` not supported | Feature-detect `typeof HTMLDialogElement !== 'undefined'`; if missing, operator panel falls back to a `<div>` with `role="dialog"` toggled via CSS class |

---

## Testing Strategy

### Unit / Example-Based Tests

Use a browser-agnostic test runner (e.g. **Vitest** or plain Node `assert`) with a `localStorage` stub. Test the pure functions in isolation:

- `validateSocialForm({ name, url })` — test valid entries, empty name, name > 100 chars, empty URL, URL > 2048 chars, URL without protocol, malformed protocol.
- `saveSocialLink(entry, index)` — add mode (`index = -1`) and edit mode.
- `deleteSocialLink(index)` — middle, first, and last element.
- `renderSocialButtons(container, links)` — verify correct `<a>` count, `href`, `target="_blank"`, text fallback on missing icon.

### Property-Based Tests

Use **fast-check** (runs in Node without a browser). Each test runs a minimum of **100 iterations**.

| Property | Generator inputs |
|---|---|
| Property 1: round-trip persistence | Arbitrary valid `{name, url, icon}` objects |
| Property 2: validation rejects invalid | Arbitrary strings including empty, > 100 chars, missing protocol |
| Property 3: delete removes exactly one | Arbitrary arrays of length 1–20, arbitrary target index |
| Property 4: edit preserves others | Arbitrary arrays, arbitrary target index, arbitrary valid replacement |
| Property 5: default seed written once | No generator needed; stateful test with localStorage stub reset |
| Property 6: DOM matches storage after mutation | Arbitrary sequences of add/edit/delete operations |

Tag format for each property test:
`// Feature: fuel-stop-landing-page, Property {N}: {property text}`

### Integration / Browser Tests

Use **Playwright** (or manual checklist) for scenarios that require a real browser environment:

- Sticky navbar remains fixed while scrolling through all sections.
- `IntersectionObserver` highlights the correct nav link at each section.
- Hamburger menu opens, closes, and auto-collapses on resize.
- `Shift+Alt+A` opens the operator panel; `Escape` closes it.
- `loading="lazy"` images below the fold are not fetched until scrolled into view.
- Above-the-fold render within 3 s on simulated 20 Mbps throttle, 360×640 viewport.
- No console errors on Chrome, Firefox, Edge, and Safari.

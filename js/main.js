(function () {
  'use strict';

  // ── Design constants ──────────────────────────────────────────────────────
  var STORAGE_KEY = 'fuelstop_social_links';

  var DEFAULT_LINKS = [
    { name: 'Instagram', url: 'https://instagram.com/fuelstop.smoothies/', icon: 'instagram' },
    { name: 'GoFood',    url: 'https://gofood.co.id/',          icon: 'gofood'    }
  ];

  // In-memory fallback when localStorage is unavailable
  var _socialLinksMemory = null;

  // ── Storage helpers ───────────────────────────────────────────────────────

  /**
   * readLinks — read Social_Media_Link array from localStorage (or memory).
   * Returns the parsed array, or null if the key does not exist.
   */
  function readLinks() {
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
  function writeLinks(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('[FuelStop] localStorage unavailable — using in-memory fallback.', e);
      _socialLinksMemory = arr;
    }
  }

  // ── validateSocialForm ───────────────────────────────────────────────────

  /**
   * validateSocialForm({ name, url })
   * Pure validation function for the operator panel social link form.
   *
   * Validation rules:
   *   name  — must be non-empty (after trim) and ≤ 100 characters
   *   url   — must be non-empty, ≤ 2048 characters, and start with
   *            "http://" or "https://"
   *
   * Returns:
   *   { valid: true }                          — all fields are valid
   *   { valid: false, errors: { name?, url? }} — one or both fields invalid;
   *                                              each error key holds a human-
   *                                              readable message string
   *
   * Requirements: 7.6, 7.7
   *
   * @param {{ name: string, url: string }} param0
   * @returns {{ valid: true } | { valid: false, errors: { name?: string, url?: string } }}
   */
  function validateSocialForm(_ref) {
    var name = _ref.name;
    var url  = _ref.url;

    var errors = {};

    // ── name validation (Requirement 7.6) ──────────────────────────────────
    var trimmedName = (name || '').trim();
    if (trimmedName.length === 0) {
      errors.name = 'Nama platform tidak boleh kosong.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Nama platform tidak boleh lebih dari 100 karakter.';
    }

    // ── url validation (Requirement 7.7) ───────────────────────────────────
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

  // ── renderSocialButtons ───────────────────────────────────────────────────

  /**
   * renderSocialButtons(container, links)
   * Clears the target container and builds one <a class="social-btn"> per
   * Social_Media_Link entry. Each anchor contains an <img> for the platform
   * icon; if the icon fails to load the <img> is replaced with a TextNode
   * showing the platform name.
   *
   * Generated anchor structure per entry:
   *   <a class="social-btn" href="{url}" target="_blank"
   *      rel="noopener noreferrer" role="listitem" aria-label="{name}">
   *     <img class="social-btn__icon" src="assets/icons/{icon}.svg"
   *          alt="{name}">   ← onerror replaces with TextNode
   *   </a>
   *
   * Requirements: 6.1, 6.2, 6.4, 10.2
   *
   * @param {Element} container - DOM element to render into
   * @param {Array<{name: string, url: string, icon: string}>} links
   */
  function renderSocialButtons(container, links) {
    if (!container) return;

    // Clear existing content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    links.forEach(function (link) {
      var name = link.name || '';
      var url  = link.url  || '#';
      var icon = link.icon || '';

      // Build the anchor element
      var a = document.createElement('a');
      a.className            = 'social-btn';
      a.href                 = url;
      a.target               = '_blank';
      a.rel                  = 'noopener noreferrer';
      a.setAttribute('role',       'listitem');
      a.setAttribute('aria-label', name);

      // Build the icon <img>
      var img = document.createElement('img');
      img.className = 'social-btn__icon';
      img.src       = 'assets/icons/' + icon + '.svg';
      img.alt       = name;

      // When the icon SVG fails to load, replace the <img> with a plain
      // text node containing the platform name (Requirement 6.4)
      img.onerror = function () {
        this.replaceWith(document.createTextNode(name));
      };

      a.appendChild(img);
      container.appendChild(a);
    });
  }

  // ── saveSocialLink ────────────────────────────────────────────────────────

  /**
   * saveSocialLink(entry, index)
   * Persists a Social_Media_Link entry to localStorage and re-renders both
   * social button containers.
   *
   * - Add mode   (index === -1): appends entry to the end of the array.
   * - Edit mode  (index >= 0):   replaces the element at that index.
   *
   * Wraps the localStorage write in a try/catch; on failure the error
   * message is shown inline in #op-url-error (the last field-error span in
   * the operator panel that is always visible regardless of which field
   * caused the problem).
   *
   * Requirements: 7.3, 7.4, 6.5
   *
   * @param {{ name: string, url: string, icon: string }} entry
   * @param {number} index  -1 for add, ≥ 0 for edit
   */
  function saveSocialLink(entry, index) {
    var links = readLinks() || [];

    if (index === -1) {
      // Add mode — append
      links.push(entry);
    } else {
      // Edit mode — replace in place
      links[index] = entry;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (e) {
      // Persist failed — update in-memory fallback and surface error to operator
      _socialLinksMemory = links;
      var errorEl = document.getElementById('op-url-error');
      if (errorEl) {
        errorEl.textContent = 'Gagal menyimpan ke localStorage: ' + (e.message || e);
      }
      console.warn('[FuelStop] localStorage write failed in saveSocialLink.', e);
    }

    // Re-render both social containers regardless of storage outcome
    renderSocialButtons(document.getElementById('social-buttons'), links);
    renderSocialButtons(document.getElementById('footer-social-buttons'), links);
  }

  // ── deleteSocialLink ──────────────────────────────────────────────────────

  /**
   * deleteSocialLink(index)
   * Removes the Social_Media_Link at the given index, persists the updated
   * array to localStorage, and re-renders both social button containers.
   *
   * Wraps the localStorage write in a try/catch; on failure the error is
   * surfaced in #op-url-error and kept in the in-memory fallback.
   *
   * Requirements: 7.5, 6.5
   *
   * @param {number} index  Array index of the entry to remove (0-based)
   */
  function deleteSocialLink(index) {
    var links = readLinks() || [];

    links.splice(index, 1);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (e) {
      // Persist failed — update in-memory fallback and surface error to operator
      _socialLinksMemory = links;
      var errorEl = document.getElementById('op-url-error');
      if (errorEl) {
        errorEl.textContent = 'Gagal menyimpan ke localStorage: ' + (e.message || e);
      }
      console.warn('[FuelStop] localStorage write failed in deleteSocialLink.', e);
    }

    // Re-render both social containers regardless of storage outcome
    renderSocialButtons(document.getElementById('social-buttons'), links);
    renderSocialButtons(document.getElementById('footer-social-buttons'), links);
  }

  // ── initSocialLinks ───────────────────────────────────────────────────────

  /**
   * initSocialLinks
   * Bootstrap: if no data exists in localStorage, write the default seed.
   * Then trigger a render of both social containers.
   * Requirements: 6.3
   */
  function initSocialLinks() {
    var links = readLinks();
    if (!links) {
      // First visit — write the default seed exactly once
      links = DEFAULT_LINKS.slice();
      writeLinks(links);
    }

    // Render social buttons in both containers (Requirements: 6.1, 10.2)
    renderSocialButtons(document.getElementById('social-buttons'), links);
    renderSocialButtons(document.getElementById('footer-social-buttons'), links);
  }

  // ── initHamburger ─────────────────────────────────────────────────────────

  /**
   * initHamburger
   * Wires up the mobile hamburger menu toggle behaviour.
   *
   * - Hamburger click: toggles `.navbar__menu--open` on the menu and updates
   *   `aria-expanded` on the button to reflect the open/closed state.
   * - Nav-link click (inside the menu): collapses the menu and resets
   *   `aria-expanded` to "false".
   *
   * Requirements: 9.5, 9.6
   */
  function initHamburger() {
    var btn  = document.querySelector('.navbar__hamburger');
    var menu = document.getElementById('navbar-menu');

    if (!btn || !menu) return;

    // Toggle menu open/closed when the hamburger button is clicked
    btn.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('navbar__menu--open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Collapse menu when any nav-link inside it is tapped/clicked
    var navLinks = menu.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('navbar__menu--open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── initImageFallbacks ────────────────────────────────────────────────────

  /**
   * initImageFallbacks
   * Attaches onerror handlers to all .stock-photo elements.
   * Falls back to #F8F6F0 background when the image fails to load.
   */
  function initImageFallbacks() {
    var images = document.querySelectorAll('img.stock-photo');
    images.forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.background = '#F8F6F0';
        img.removeAttribute('src');
      });
    });
  }

  // ── initResizeHandler ─────────────────────────────────────────────────────

  /**
   * initResizeHandler
   * Collapses the mobile hamburger menu when the viewport is resized to
   * ≥ 768 px (the desktop breakpoint), preventing an open mobile menu from
   * persisting after the user widens the browser window.
   *
   * Uses a debounced resize listener (16 ms — roughly one animation frame)
   * to avoid triggering layout work on every pixel of resize.
   *
   * Requirements: 9.8
   */
  function initResizeHandler() {
    var btn  = document.querySelector('.navbar__hamburger');
    var menu = document.getElementById('navbar-menu');

    if (!btn || !menu) return;

    var _resizeTimer = null;

    window.addEventListener('resize', function () {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(function () {
        if (window.innerWidth >= 768) {
          menu.classList.remove('navbar__menu--open');
          btn.setAttribute('aria-expanded', 'false');
        }
      }, 16);
    });
  }

  // ── initScrollspy ────────────────────────────────────────────────────────

  /**
   * initScrollspy
   * Uses an IntersectionObserver to track which <section> is currently in
   * the "middle third" of the viewport. When a section crosses into that
   * zone the matching .nav-link receives the `nav-link--active` class;
   * all other nav links lose it.
   *
   * rootMargin "-40% 0px -55% 0px" means the active trigger band starts
   * 40% from the top and ends 55% from the bottom, leaving a ~5% window
   * around the midpoint of the viewport.
   *
   * Requirements: 9.9
   */
  function initScrollspy() {
    var sections = document.querySelectorAll('main section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    // Build a lookup map: section id → matching nav link element
    var linkMap = {};
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href'); // e.g. "#hero"
      if (href && href.startsWith('#')) {
        linkMap[href.slice(1)] = link;      // e.g. "hero" → <a>
      }
    });

    /**
     * setActive — removes nav-link--active from every nav link, then
     * adds it only to the link that corresponds to the given section id.
     */
    function setActive(id) {
      navLinks.forEach(function (link) {
        link.classList.remove('nav-link--active');
      });
      var activeLink = linkMap[id];
      if (activeLink) {
        activeLink.classList.add('nav-link--active');
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px'
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // ── initSmoothScroll ──────────────────────────────────────────────────────

  /**
   * initSmoothScroll
   * Intercepts clicks on all in-page anchor links (`<a href="#...">`) and
   * scrolls to the target section with a smooth animation instead of the
   * browser's default instant jump.
   *
   * Works for nav links, the hamburger menu links, and the CTA button
   * (href="#products") in the hero section.
   *
   * Requirements: 9.3, 9.7
   */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      // Walk up from the event target to find the nearest <a> element
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      var hash = anchor.getAttribute('href');
      // Guard: must be a non-empty hash pointing to an in-page element
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  initSocialLinks();
  initImageFallbacks();
  initHamburger();
  initResizeHandler();
  initSmoothScroll();
  initScrollspy();

  // ── Footer year ───────────────────────────────────────────────────────────
  var footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

})();

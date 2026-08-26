/**
 * SYPerformance header behaviour.
 *
 * Horizon's own components (cart drawer, search modal, cart icon) are
 * triggered declaratively from the markup, so nothing here duplicates theme
 * machinery — this file only owns the three things that are ours: the mega
 * panels, the mobile drawer, and the condense-on-scroll state.
 *
 * The one theme import is deliberate. Horizon does not scroll the document on
 * desktop: at 990px and up `html`/`body` are locked to 100dvh and
 * `.page-wrapper` becomes the scroll container. A `window`-scroll listener
 * therefore never fires above 990px, which is exactly where the condensed
 * header matters. scroll-container.js owns that breakpoint, so we ask it
 * rather than hard-coding the same 990 in a second place.
 *
 * Re-runs safely: the theme editor re-renders the section on every setting
 * change, so setup is idempotent and keyed off the header element.
 */

import { getScrollEventTarget, getScrollTop, scrollContainerMediaQuery } from '@theme/scroll-container';

/** @param {HTMLElement} header */
function setupPanels(header) {
  /** @type {HTMLButtonElement[]} */
  const triggers = Array.from(header.querySelectorAll('[data-syp-panel-trigger]'));
  if (!triggers.length) return;

  /** @param {HTMLElement | null} except */
  const closeAll = (except) => {
    for (const trigger of triggers) {
      if (trigger === except) continue;
      const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
      trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    }
  };

  /**
   * @param {HTMLElement} trigger
   * @param {boolean} open
   */
  const setOpen = (trigger, open) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    if (!panel) return;
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) closeAll(trigger);
  };

  for (const trigger of triggers) {
    const item = trigger.closest('.syp-header__nav-item');
    if (!item) continue;

    trigger.addEventListener('click', () => {
      setOpen(trigger, trigger.getAttribute('aria-expanded') !== 'true');
    });

    // Hover opens on pointer devices only. Touch reports as a click, and a
    // hover-open panel on touch swallows the first tap.
    item.addEventListener('pointerenter', (event) => {
      if (/** @type {PointerEvent} */ (event).pointerType !== 'mouse') return;
      setOpen(trigger, true);
    });

    item.addEventListener('pointerleave', (event) => {
      if (/** @type {PointerEvent} */ (event).pointerType !== 'mouse') return;
      setOpen(trigger, false);
    });

    // Tabbing out of the panel closes it, so keyboard order stays linear.
    item.addEventListener('focusout', (event) => {
      const next = /** @type {FocusEvent} */ (event).relatedTarget;
      if (next instanceof Node && item.contains(next)) return;
      setOpen(trigger, false);
    });
  }

  header.addEventListener('keydown', (event) => {
    if (/** @type {KeyboardEvent} */ (event).key !== 'Escape') return;
    const open = triggers.find((trigger) => trigger.getAttribute('aria-expanded') === 'true');
    if (!open) return;
    closeAll(null);
    open.focus();
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Node && header.contains(target)) return;
    closeAll(null);
  });
}

/** @param {HTMLElement} header */
function setupDrawer(header) {
  const drawer = /** @type {HTMLDialogElement | null} */ (document.getElementById('syp-nav-drawer'));
  if (!drawer) return;

  const openButton = header.querySelector('[data-syp-drawer-open]');
  openButton?.addEventListener('click', () => drawer.showModal());

  drawer.querySelector('[data-syp-drawer-close]')?.addEventListener('click', () => drawer.close());

  // Clicking the backdrop closes it. The dialog fills its own box, so a click
  // landing on the dialog element itself is a backdrop click.
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) drawer.close();
  });

  // Following a link should not leave the drawer open behind the new page in
  // browsers that restore from bfcache.
  drawer.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('a')) drawer.close();
  });
}

/** @param {HTMLElement} header */
function setupCondense(header) {
  if (header.dataset.condense !== 'true') return;

  let ticking = false;
  let target = getScrollEventTarget();

  const apply = () => {
    header.dataset.scrolled = getScrollTop() > 24 ? 'true' : 'false';
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  };

  const listen = () => {
    target.addEventListener('scroll', onScroll, { passive: true });
  };

  apply();
  listen();

  // Crossing the 990px breakpoint moves the scroll container between
  // .page-wrapper and the document, so the listener has to move with it.
  scrollContainerMediaQuery.addEventListener('change', () => {
    target.removeEventListener('scroll', onScroll);
    target = getScrollEventTarget();
    listen();
    apply();
  });
}

/**
 * Fitment entry point.
 *
 * The header owns the control; syp-fitment.js owns the state, the label and the
 * dialog. This only dispatches the request — if nothing is listening, the
 * control falls back to its href, and if that is blank it does nothing rather
 * than opening something half-built.
 *
 * @param {HTMLElement} header
 */
function setupFitment(header) {
  const control = /** @type {HTMLElement | null} */ (header.querySelector('[data-syp-fitment]'));
  if (!control) return;

  control.addEventListener('click', (event) => {
    const request = new CustomEvent('syp:fitment:open', { bubbles: true, cancelable: true });
    const handled = !control.dispatchEvent(request);
    if (handled) event.preventDefault();
  });
}

function init() {
  const header = /** @type {HTMLElement | null} */ (document.getElementById('header-component'));
  if (!header || header.dataset.sypReady === 'true') return;
  header.dataset.sypReady = 'true';

  setupPanels(header);
  setupDrawer(header);
  setupCondense(header);
  setupFitment(header);
}

init();

// The theme editor swaps the section's markup in place; re-initialise against
// the new element.
document.addEventListener('shopify:section:load', init);

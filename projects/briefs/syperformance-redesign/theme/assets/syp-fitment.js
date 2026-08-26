/**
 * SYPerformance fitment selector.
 *
 * The site has never had a year/make/model filter and every competitor beating
 * it does. This is that feature.
 *
 * Three parts, one state:
 *
 *   1. A dialog that picks platform, then chassis, then drivetrain.
 *   2. A dismissible bar that says what is currently selected, sitewide.
 *   3. A fits / does not fit verdict on product pages.
 *
 * State lives in localStorage under `syp:fitment` and is broadcast as a
 * `syp:fitment:change` event so anything on the page can react without this
 * file knowing about it.
 *
 * Deliberately not a Shopify app and deliberately not server-side: the whole
 * thing is one small file, no monthly bill, no third-party script, and no
 * page-speed tax. The trade is that filtering a collection down to what fits
 * happens in the browser against what is on the page — see syp-fitment-filter
 * below for exactly what that does and does not do.
 *
 * Storage can throw outright (private mode, blocked site data), so every read
 * and write is guarded and the feature degrades to "no vehicle selected".
 */

const KEY = 'syp:fitment';
const CHANGE = 'syp:fitment:change';

/** @returns {{platform?: string, chassis?: string, drivetrain?: string} | null} */
export function getFitment() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.platform ? parsed : null;
  } catch {
    return null;
  }
}

function setFitment(value) {
  try {
    if (value) window.localStorage.setItem(KEY, JSON.stringify(value));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — the selection just will not persist. The event still
    // fires so the current page reflects the choice.
  }
  document.dispatchEvent(new CustomEvent(CHANGE, { detail: value }));
}

export function fitmentLabel(f) {
  if (!f) return null;
  return [f.platform, f.chassis, f.drivetrain].filter(Boolean).join(' / ');
}

/**
 * Does a product fit the current selection?
 *
 * Returns 'fits' | 'no' | 'unknown'. `unknown` matters as much as the other
 * two: most of the catalogue has no chassis data yet, and claiming a part does
 * not fit because we have not tagged it would send a customer away from
 * something they need. Absence of data is never a negative verdict.
 *
 * @param {{platform?: string[], chassis?: string[], drivetrain?: string}} product
 * @param {{platform?: string, chassis?: string, drivetrain?: string}} f
 */
export function verdict(product, f) {
  if (!f || !f.platform) return 'unknown';

  const platforms = product.platform ?? [];
  if (!platforms.length) return 'unknown';

  // Universal parts fit everything by definition.
  if (platforms.includes('Universal')) return 'fits';
  if (!platforms.includes(f.platform)) return 'no';

  // Platform matches. Narrow on drivetrain only when both sides know it.
  if (f.drivetrain && product.drivetrain && product.drivetrain !== f.drivetrain) return 'no';

  // Chassis is the weakest signal — almost nothing is tagged yet, so a mismatch
  // is only a negative when the product actually lists chassis codes.
  const chassis = product.chassis ?? [];
  if (f.chassis && chassis.length && !chassis.includes(f.chassis)) return 'no';

  return 'fits';
}

/** Read the fitment data a section rendered into a `data-syp-fit` attribute. */
export function readProductFit(el) {
  try {
    return JSON.parse(el.getAttribute('data-syp-fit') || '{}');
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// The picker dialog
// ---------------------------------------------------------------------------

function setupDialog() {
  const dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById('syp-fitment-dialog'));
  if (!dialog || dialog.dataset.sypReady === 'true') return;
  dialog.dataset.sypReady = 'true';

  const form = dialog.querySelector('form');
  const platformSel = dialog.querySelector('[data-fit-platform]');
  const chassisSel = dialog.querySelector('[data-fit-chassis]');
  const drivetrainSel = dialog.querySelector('[data-fit-drivetrain]');

  /** Chassis options depend on the platform, so rebuild them on every change. */
  const syncChassis = () => {
    if (!chassisSel || !platformSel) return;
    const chosen = platformSel.value;
    let any = false;
    for (const opt of chassisSel.options) {
      if (!opt.value) continue;
      const forPlatform = opt.dataset.platform;
      const show = !forPlatform || forPlatform === chosen;
      opt.hidden = !show;
      if (show) any = true;
    }
    if (chassisSel.selectedOptions[0]?.hidden) chassisSel.value = '';
    chassisSel.disabled = !chosen || !any;
  };

  platformSel?.addEventListener('change', syncChassis);
  syncChassis();

  // Prefill from the saved selection so "change" is an edit, not a restart.
  const current = getFitment();
  if (current) {
    if (platformSel) platformSel.value = current.platform ?? '';
    syncChassis();
    if (chassisSel) chassisSel.value = current.chassis ?? '';
    if (drivetrainSel) drivetrainSel.value = current.drivetrain ?? '';
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const platform = platformSel?.value;
    if (!platform) return;
    setFitment({
      platform,
      chassis: chassisSel?.value || undefined,
      drivetrain: drivetrainSel?.value || undefined,
    });
    dialog.close();
  });

  dialog.querySelector('[data-fit-clear]')?.addEventListener('click', () => {
    setFitment(null);
    dialog.close();
  });

  dialog.querySelector('[data-fit-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // The header entry point asks for this; opening in place beats a page load.
  document.addEventListener('syp:fitment:open', (event) => {
    event.preventDefault();
    dialog.showModal();
  });
}

// ---------------------------------------------------------------------------
// The sitewide bar
// ---------------------------------------------------------------------------

function setupBar() {
  const bar = document.querySelector('[data-syp-fitment-bar]');
  if (!bar || bar.dataset.sypReady === 'true') return;
  bar.dataset.sypReady = 'true';

  const label = bar.querySelector('[data-fit-bar-label]');

  const render = () => {
    const f = getFitment();
    bar.hidden = !f;
    if (f && label) label.textContent = fitmentLabel(f);
  };

  bar.querySelector('[data-fit-bar-change]')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('syp:fitment:open', { cancelable: true }));
  });

  bar.querySelector('[data-fit-bar-clear]')?.addEventListener('click', () => setFitment(null));

  document.addEventListener(CHANGE, render);
  render();
}

// ---------------------------------------------------------------------------
// The header control
// ---------------------------------------------------------------------------

function setupHeaderLabel() {
  const control = document.querySelector('[data-syp-fitment]');
  if (!control) return;
  const label = control.querySelector('[data-syp-fitment-label]');
  const original = label?.textContent?.trim();

  const render = () => {
    const f = getFitment();
    if (!label) return;
    if (f) {
      label.textContent = fitmentLabel(f);
      control.dataset.sypFitmentSet = 'true';
    } else {
      label.textContent = original ?? 'Select vehicle';
      delete control.dataset.sypFitmentSet;
    }
  };

  document.addEventListener(CHANGE, render);
  render();
}

// ---------------------------------------------------------------------------
// Product page verdict
// ---------------------------------------------------------------------------

function setupVerdict() {
  const el = document.querySelector('[data-syp-fitment-verdict]');
  if (!el) return;
  const product = readProductFit(el);
  const fallback = el.textContent.trim();

  const render = () => {
    const f = getFitment();
    const v = verdict(product, f);

    el.dataset.verdict = v;
    if (!f) {
      el.textContent = fallback;
      return;
    }
    const label = fitmentLabel(f);
    if (v === 'fits') el.textContent = `Fits your ${label}.`;
    else if (v === 'no') el.textContent = `Does not fit your ${label}.`;
    else el.textContent = `We have not confirmed this against ${label} — check before ordering.`;
  };

  document.addEventListener(CHANGE, render);
  render();
}

// ---------------------------------------------------------------------------
// Collection refinement
//
// Honest about its limits: this hides cards that do not fit, on the page the
// customer is looking at. It is not a server-side filter, so it does not change
// pagination or result counts, and page two is filtered only once it loads.
// True native filtering needs Shopify's Search & Discovery app and the
// metafields exposed as storefront filters — flagged for Spencer rather than
// installed unasked.
// ---------------------------------------------------------------------------

function setupRefine() {
  const toggle = document.querySelector('[data-syp-fit-refine]');
  const grid = document.querySelector('[data-syp-fit-grid]');
  if (!toggle || !grid) return;

  const count = toggle.querySelector('[data-fit-refine-count]');

  const render = () => {
    const f = getFitment();
    const cards = [...grid.querySelectorAll('[data-syp-fit]')];
    const on = toggle.querySelector('input')?.checked && f;

    let hidden = 0;
    for (const card of cards) {
      const v = verdict(readProductFit(card), f);
      const hide = Boolean(on) && v === 'no';
      card.hidden = hide;
      if (hide) hidden++;
    }

    toggle.hidden = !f;
    if (count) count.textContent = hidden ? `${cards.length - hidden} of ${cards.length} on this page` : '';
  };

  toggle.querySelector('input')?.addEventListener('change', render);
  document.addEventListener(CHANGE, render);
  render();
}

function init() {
  setupDialog();
  setupBar();
  setupHeaderLabel();
  setupVerdict();
  setupRefine();
}

init();
document.addEventListener('shopify:section:load', init);

/**
 * One tracking seam for the whole site. Framework free, no build step, no dependencies.
 *
 * Every funnel step calls track() with a snake_case event name. The call fans out to
 * whatever is present on the page:
 *   - Google Tag Manager and GA4, via dataLayer.push({ event, ...props })
 *   - Microsoft Clarity, via clarity("event", name), so the step becomes a Smart Event
 *     and can be dropped straight into a Clarity funnel
 *
 * Nothing here blocks rendering and nothing throws if a vendor is absent or blocked.
 *
 * Rules that keep this honest:
 *   1. Nothing outside this file calls dataLayer or clarity directly.
 *   2. EVENTS below is the tracking plan. Adding an event means editing the plan.
 *   3. Never pass personal data in a name, a prop or a tag.
 *
 * Include with <script src="/js/track.js"></script> before any script that calls track().
 */
(function (global) {
  'use strict';

  /**
   * The funnel spine. Replace the example names with the site's real ones, keeping the
   * shape: page -> engage -> start -> step_n -> lead -> conversion.
   */
  var EVENTS = [
    'cta_click',          // engage
    'form_started',       // start
    'form_step_completed',// step_n, carries { index: n }
    'lead_captured',      // lead
    'booking_submitted'   // conversion
  ];

  function isKnown(name) {
    return EVENTS.indexOf(name) !== -1;
  }

  /**
   * Fire a funnel event.
   * @param {string} name  snake_case event name from EVENTS
   * @param {Object} [props]  fixed-vocabulary parameters, never free text or personal data
   */
  function track(name, props) {
    if (typeof global === 'undefined' || typeof document === 'undefined') return;

    if (!isKnown(name) && global.console && global.console.warn) {
      global.console.warn('[track] event not in the plan: ' + name);
    }

    var payload = { event: name };
    if (props) {
      for (var key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) payload[key] = props[key];
      }
    }

    try {
      global.dataLayer = global.dataLayer || [];
      global.dataLayer.push(payload);
    } catch (e) { /* ignore */ }

    try {
      if (global.clarity) global.clarity('event', name);
    } catch (e) { /* ignore */ }
  }

  /**
   * Attach a filterable tag to the Clarity session and mirror it to the dataLayer.
   * Use for the cut, not the step: segment, tier, variant, page_type.
   * Clarity limits: 255 characters per key and value, 128 tags per page.
   */
  function tag(key, value) {
    if (typeof global === 'undefined') return;
    try {
      if (global.clarity) global.clarity('set', key, value);
    } catch (e) { /* ignore */ }
    try {
      global.dataLayer = global.dataLayer || [];
      var payload = {};
      payload[key] = value;
      global.dataLayer.push(payload);
    } catch (e) { /* ignore */ }
  }

  /**
   * Join a session to an internal record. Pass an OPAQUE reference, never an email
   * address. Clarity hashes the id on the client, but an opaque reference is safer.
   * Call on every page for reliable joining.
   */
  function identify(opaqueRef, sessionRef, pageRef, friendlyName) {
    if (typeof global === 'undefined' || !opaqueRef) return;
    try {
      if (global.clarity) {
        global.clarity('identify', opaqueRef, sessionRef, pageRef, friendlyName);
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Protect a session from Clarity's daily recording sampling, which starts above
   * 100,000 sessions per project per day. Use sparingly, on the sessions that matter.
   */
  function prioritise(reason) {
    if (typeof global === 'undefined') return;
    try {
      if (global.clarity) global.clarity('upgrade', reason);
    } catch (e) { /* ignore */ }
  }

  global.track = track;
  global.trackTag = tag;
  global.trackIdentify = identify;
  global.trackPrioritise = prioritise;
})(typeof window !== 'undefined' ? window : this);

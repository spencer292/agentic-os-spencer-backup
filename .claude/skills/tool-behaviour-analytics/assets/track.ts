"use client";

/**
 * One tracking seam for the whole funnel, typed.
 *
 * Every funnel step calls track() with a snake_case event name. The call fans out to
 * whatever is present on the page:
 *   - Google Tag Manager and GA4, via dataLayer.push({ event, ...props })
 *   - Microsoft Clarity, via clarity("event", name), so the step becomes a Smart Event
 *     and can be dropped straight into a Clarity funnel. clarity("set") attaches
 *     filterable tags to the session.
 *
 * Nothing here blocks rendering and nothing throws if a vendor is absent or blocked.
 *
 * Rules that keep this honest:
 *   1. Nothing outside this file calls dataLayer or clarity directly.
 *   2. FunnelEvent IS the tracking plan. Adding an event means editing the plan.
 *   3. Never pass personal data in a name, a prop or a tag.
 *
 * Replace the event names below with the site's real ones, keeping the spine:
 *   page -> engage -> start -> step_n -> lead -> conversion
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    clarity?: (
      command: "event" | "set" | "identify" | "consent" | "consentv2" | "upgrade" | "metadata",
      ...args: unknown[]
    ) => void;
  }
}

export type FunnelEvent =
  | "quiz_start_click"
  | "sector_selected"
  | "question_answered"
  | "quiz_completed"
  | "lead_captured"
  | "results_viewed"
  | "book_cta_click"
  | "booking_submitted";

/** Parameter values come from a fixed vocabulary. Never free text a user typed. */
export type EventProps = Record<string, string | number | boolean>;

export function track(event: FunnelEvent, props: EventProps = {}): void {
  if (typeof window === "undefined") return;

  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...props });
  } catch {
    /* ignore */
  }

  try {
    window.clarity?.("event", event);
  } catch {
    /* ignore */
  }
}

/**
 * Attach a searchable key/value tag to the current Clarity session, and mirror it to
 * the dataLayer so GA4 can use the same cut. Use for the cut, not the step:
 * segment, tier, variant, page_type.
 *
 * Clarity limits: 255 characters per key and per value, 128 tags per page.
 */
export function tag(key: string, value: string | string[]): void {
  if (typeof window === "undefined") return;

  try {
    window.clarity?.("set", key, value);
  } catch {
    /* ignore */
  }

  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ [key]: value });
  } catch {
    /* ignore */
  }
}

/**
 * Join a Clarity session to an internal record. Pass an OPAQUE reference, never an
 * email address. Clarity hashes the id on the client, but an opaque reference is safer.
 * Call on every page for reliable joining.
 */
export function identify(
  opaqueRef: string,
  sessionRef?: string,
  pageRef?: string,
  friendlyName?: string,
): void {
  if (typeof window === "undefined" || !opaqueRef) return;
  try {
    window.clarity?.("identify", opaqueRef, sessionRef, pageRef, friendlyName);
  } catch {
    /* ignore */
  }
}

/**
 * Protect a session from Clarity's daily recording sampling, which starts above
 * 100,000 sessions per project per day. Use sparingly, on sessions that matter.
 */
export function prioritise(reason: string): void {
  if (typeof window === "undefined") return;
  try {
    window.clarity?.("upgrade", reason);
  } catch {
    /* ignore */
  }
}

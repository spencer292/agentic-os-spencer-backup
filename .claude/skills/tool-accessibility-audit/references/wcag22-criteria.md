# WCAG 2.2 Level A and AA, and what automation can see

Sources checked September 2026. Cited at the foot of this file.

WCAG 2.2 is a W3C Recommendation, published 5 October 2023 and republished 12 December 2024. Level AA conformance means meeting all 31 Level A and all 25 Level AA success criteria, 56 in total. Conformance is per page and all-or-nothing. One failing criterion on one page means that page does not conform.

## What changed from WCAG 2.1

Six criteria were added at Level A or AA. Three more were added at AAA and are out of scope for an AA audit. One criterion was removed.

| Criterion | Level | What it requires | New in 2.2 |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | When a component takes keyboard focus, author-created content must not hide it entirely. Sticky headers, cookie bars and chat widgets are the usual culprits. | Yes |
| 2.5.7 Dragging Movements | AA | Anything operated by dragging needs a single-pointer alternative, unless dragging is essential. Sliders, sortable lists, map panning, drag-to-upload. | Yes |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least 24 by 24 CSS pixels, or spaced so a 24 px circle centred on each does not overlap another. Exceptions: inline targets in a sentence, targets whose size is browser-determined, an equivalent target elsewhere on the page, and where presentation is essential. | Yes |
| 3.2.6 Consistent Help | A | If help is offered (contact details, human contact, self-help, an automated mechanism), it appears in the same relative order on every page that has it. | Yes |
| 3.3.7 Redundant Entry | A | Information already entered in a process is auto-populated or available to select, rather than re-typed. Password re-entry and security-essential re-entry are exempt. | Yes |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function test (remembering a password, solving a puzzle, transcribing a code) unless there is an alternative, or a mechanism to assist. Password managers, copy and paste, and passkeys must not be blocked. Object recognition and personal-content recognition are permitted. | Yes |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Nothing obscures the focused component at all. | Yes, AAA |
| 2.4.13 Focus Appearance | AAA | Minimum area and contrast for the focus indicator. | Yes, AAA |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | As 3.3.8 but object recognition and personal content are also disallowed. | Yes, AAA |
| 4.1.1 Parsing | removed | Was Level A in 2.0 and 2.1. Removed in 2.2 as obsolete. Sites reporting against 2.0 or 2.1 for policy reasons may still need to report it. | Removed |

Note on 2.4.13 Focus Appearance. It is AAA, so it is not part of an AA claim. 2.4.7 Focus Visible (AA) still applies, and it only requires a visible indicator, not a minimum size or contrast. Aiming at the 2.4.13 numbers anyway is good practice, but do not report a 2.4.13 failure as an AA failure.

## The full Level A and AA list

Marks in the automation column: **auto** means a tool such as axe-core can decide it reliably, **partial** means a tool flags candidates but a person confirms, **manual** means only a person can decide.

### Perceivable

| Criterion | Level | Automation |
|---|---|---|
| 1.1.1 Non-text Content | A | partial. Presence of alt is automated. Whether the alt is accurate or the image is decorative is manual. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | manual |
| 1.2.2 Captions (Prerecorded) | A | partial. A caption track can be detected. Caption accuracy is manual. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | manual |
| 1.2.4 Captions (Live) | AA | manual |
| 1.2.5 Audio Description (Prerecorded) | AA | manual |
| 1.3.1 Info and Relationships | A | partial. Table headers, list markup, label association are automated. Whether the visual structure matches the code is manual. |
| 1.3.2 Meaningful Sequence | A | manual |
| 1.3.3 Sensory Characteristics | A | manual |
| 1.3.4 Orientation | AA | partial |
| 1.3.5 Identify Input Purpose | AA | partial. Presence and validity of autocomplete is automated. Whether it is the right token is manual. |
| 1.4.1 Use of Color | A | manual |
| 1.4.2 Audio Control | A | manual |
| 1.4.3 Contrast (Minimum) | AA | auto, with gaps. Text over images, gradients and video returns "incomplete" and needs a person. |
| 1.4.4 Resize Text | AA | manual |
| 1.4.5 Images of Text | AA | manual |
| 1.4.10 Reflow | AA | partial. Horizontal scrolling at 320 CSS px is detectable. Loss of content or function is manual. |
| 1.4.11 Non-text Contrast | AA | partial |
| 1.4.12 Text Spacing | AA | partial |
| 1.4.13 Content on Hover or Focus | AA | manual |

### Operable

| Criterion | Level | Automation |
|---|---|---|
| 2.1.1 Keyboard | A | manual |
| 2.1.2 No Keyboard Trap | A | manual |
| 2.1.4 Character Key Shortcuts | A | manual |
| 2.2.1 Timing Adjustable | A | manual |
| 2.2.2 Pause, Stop, Hide | A | manual |
| 2.3.1 Three Flashes or Below Threshold | A | manual |
| 2.4.1 Bypass Blocks | A | partial. A skip link or landmark structure is detectable. Whether it works is manual. |
| 2.4.2 Page Titled | A | partial. Presence is automated. Whether the title describes the page is manual. |
| 2.4.3 Focus Order | A | manual |
| 2.4.4 Link Purpose (In Context) | A | partial. Empty links are automated. "Read more" in context is manual. |
| 2.4.5 Multiple Ways | AA | manual |
| 2.4.6 Headings and Labels | AA | partial. Presence is automated. Descriptiveness is manual. |
| 2.4.7 Focus Visible | AA | manual |
| 2.4.11 Focus Not Obscured (Minimum) | AA | manual |
| 2.5.1 Pointer Gestures | A | manual |
| 2.5.2 Pointer Cancellation | A | manual |
| 2.5.3 Label in Name | A | auto, mostly |
| 2.5.4 Motion Actuation | A | manual |
| 2.5.7 Dragging Movements | AA | manual |
| 2.5.8 Target Size (Minimum) | AA | partial. Bounding boxes are measurable. The four exceptions need a person. |

### Understandable

| Criterion | Level | Automation |
|---|---|---|
| 3.1.1 Language of Page | A | auto |
| 3.1.2 Language of Parts | AA | manual |
| 3.2.1 On Focus | A | manual |
| 3.2.2 On Input | A | manual |
| 3.2.3 Consistent Navigation | AA | manual |
| 3.2.4 Consistent Identification | AA | manual |
| 3.2.5 Change on Request | AA | manual |
| 3.2.6 Consistent Help | A | manual |
| 3.3.1 Error Identification | A | manual |
| 3.3.2 Labels or Instructions | A | partial |
| 3.3.3 Error Suggestion | AA | manual |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | manual |
| 3.3.7 Redundant Entry | A | manual |
| 3.3.8 Accessible Authentication (Minimum) | AA | manual |

### Robust

| Criterion | Level | Automation |
|---|---|---|
| 4.1.2 Name, Role, Value | A | auto, mostly |
| 4.1.3 Status Messages | AA | partial |

## How much automation actually covers

Two figures circulate and they measure different things.

Deque publishes that axe-core finds on average 57 percent of **issues** in a typical page, because the mechanical failures that automation catches are also the most repeated ones. The broader industry figure, and the one to quote to a client, is that automated tools decide roughly 30 to 40 percent of the **success criteria**. Counting the table above, 4 of 56 criteria are fully automatable and about 16 more are partially automatable.

Both are true. Say it plainly: automation clears the repeated mechanical failures and decides about a third of the criteria. It cannot decide whether alt text is accurate, whether focus order matches reading order, whether captions match the audio, or whether an error message helps. Never present a clean axe run as conformance.

axe-core also returns an **incomplete** set: checks it started and could not finish, most often contrast over an image or a gradient. Those are not passes. Work through them by hand.

## Sources

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation. https://www.w3.org/TR/WCAG22/ — checked September 2026
- W3C, What's New in WCAG 2.2. https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ — checked September 2026
- Deque, The Automated Accessibility Coverage Report. https://www.deque.com/automated-accessibility-coverage-report/ — checked September 2026
- dequelabs/axe-core, rule descriptions and tags. https://github.com/dequelabs/axe-core — checked September 2026

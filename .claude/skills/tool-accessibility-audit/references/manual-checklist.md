# Manual accessibility checklist

The checks automation cannot make. Work through these on a representative page set: the home page, one page per template, the main conversion form, the search or listing page, and any page behind authentication. Record a pass, a fail, or not-applicable against each, with the criterion number. Those records become the evidence behind the accessibility statement.

Nothing here is optional. Roughly two thirds of the WCAG 2.2 AA criteria can only be decided by a person.

---

## 1. Keyboard-only walk

Unplug the mouse. Use Tab, Shift-Tab, Enter, Space, arrow keys and Escape only. Do the whole primary journey, from landing to conversion.

| Check | Criterion | What a failure looks like |
|---|---|---|
| Every interactive element is reachable by Tab | 2.1.1 Keyboard (A) | A div with a click handler and no tabindex. A custom dropdown that only opens on mouseover. |
| Every element that can be reached can be operated | 2.1.1 Keyboard (A) | A slider that only responds to drag. A card that opens on click but not Enter. |
| Focus can always leave a component | 2.1.2 No Keyboard Trap (A) | A modal, video player, date picker or embedded iframe that swallows Tab. |
| Escape closes modals, menus and overlays, and returns focus to the trigger | 2.1.2 (A), 2.4.3 (A) | Focus lands back at the top of the document after closing a dialog. |
| A skip link reaches the main content, and it is the first thing Tab lands on | 2.4.1 Bypass Blocks (A) | No skip link. A skip link that is present but does not move focus. |
| No single-character key shortcuts, or they can be turned off or remapped | 2.1.4 Character Key Shortcuts (A) | Pressing "s" opens search while typing in a text field. |
| Dragging has a single-pointer alternative | 2.5.7 Dragging Movements (AA) | A reorderable list, image comparison slider, map pan, or drag-to-upload with no button or field equivalent. |
| Actions fire on key-up or pointer-up, not down, and can be aborted | 2.5.2 Pointer Cancellation (A) | A button that submits on mousedown. |

## 2. Focus order and focus visibility

| Check | Criterion | What a failure looks like |
|---|---|---|
| Tab order follows reading order | 2.4.3 Focus Order (A) | A sidebar reached before the main heading. CSS order or flex-direction reversing the visual order without changing the DOM. |
| Focus is always visible | 2.4.7 Focus Visible (AA) | A global `outline: none` with no replacement. An indicator only visible on one background. |
| The focused element is never fully hidden by other content | 2.4.11 Focus Not Obscured (Minimum) (AA) | A sticky header covering the field you just tabbed to. A cookie banner or chat bubble sitting over the last form field. This is a new WCAG 2.2 criterion and it fails often. Scroll to the middle of a long form and keep tabbing. |
| Focus moves into a dialog when it opens and is confined to it while open | 2.4.3 (A), 4.1.2 (A) | Tab moves behind the modal to the page underneath. |
| Newly revealed content receives focus or is announced | 4.1.3 Status Messages (AA) | An error summary appears at the top of the form and focus stays on the submit button. |

## 3. Screen-reader pass

Use NVDA with Firefox or Chrome on Windows, or VoiceOver with Safari on macOS and iOS. One combination is the minimum. Two is better, because bugs differ between them.

Turn the screen off, or use NVDA's speech viewer with the monitor covered, for at least one run. Reading the screen while listening hides most of the problems.

| Check | Criterion | What a failure looks like |
|---|---|---|
| The page title announced on load identifies the page and the site | 2.4.2 Page Titled (A) | Every page announced as the brand name. A stale title left over from a previous route in a single-page app. |
| Heading navigation (H in NVDA, rotor in VoiceOver) gives a usable outline | 1.3.1 (A), 2.4.6 (AA) | One h1 missing, or six h1s. Levels skipped. Headings used for visual size only. |
| Landmark navigation reaches banner, navigation, main, contentinfo | 1.3.1 (A), 2.4.1 (A) | No `main`. Three `nav` elements with no accessible names to tell them apart. |
| Every image is announced usefully, and decorative images are silent | 1.1.1 Non-text Content (A) | Alt text reading "image", the filename, or a keyword list. A meaningful chart with empty alt. A decorative divider announced. |
| Link text makes sense out of context | 2.4.4 Link Purpose (A) | Twenty links all announced as "read more". |
| The visible label is contained in the accessible name | 2.5.3 Label in Name (A) | A button reading "Get started" whose aria-label is "Sign up". Speech-input users say what they see and nothing happens. |
| Custom components announce name, role and state | 4.1.2 Name, Role, Value (A) | A toggle announced as "button" with no on or off state. A tab set with no selected state. |
| Live regions announce updates without stealing focus | 4.1.3 Status Messages (AA) | A "saved" toast, a cart count, a filter result count, or a validation error that is silent. |
| Tables are announced with their headers | 1.3.1 (A) | A layout table announced as data. A data table with no `th` or `scope`. |
| Content in another language is announced in that language | 3.1.2 Language of Parts (AA) | A French quotation read with an English voice. |
| Reading order matches visual order | 1.3.2 Meaningful Sequence (A) | A two-column layout read as one column interleaved. |

## 4. Reflow, zoom and text spacing

| Check | Criterion | Method |
|---|---|---|
| No horizontal scrolling at 320 CSS px width | 1.4.10 Reflow (AA) | Set the browser to 1280 px and zoom to 400 percent, or set a 320 px viewport. Automated in the script, but confirm nothing is clipped or lost, not just that scrollbars are absent. |
| No content or function lost at 320 px | 1.4.10 (AA) | Data tables, carousels, sticky bars and multi-column footers are the usual losses. Tables may scroll in two dimensions and still pass. |
| Text scales to 200 percent with no loss of content or function | 1.4.4 Resize Text (AA) | Browser zoom to 200 percent at 1280 px. Then test text-only zoom where the browser supports it. Watch for fixed-height containers clipping text. |
| Content survives increased text spacing | 1.4.12 Text Spacing (AA) | Apply a bookmarklet setting line-height 1.5 times font size, paragraph spacing 2 times, letter spacing 0.12 em, word spacing 0.16 em. Nothing should overlap or be cut off. |
| Content works in both orientations | 1.3.4 Orientation (AA) | Rotate a phone and a tablet. A hard lock to portrait or landscape fails unless the orientation is essential. |
| Zoom works on mobile | 1.4.4 (AA) | Check the viewport meta tag does not carry `user-scalable=no` or `maximum-scale=1`. |

## 5. Colour and contrast

| Check | Criterion | Method |
|---|---|---|
| Body text at 4.5 to 1, large text at 3 to 1 | 1.4.3 Contrast (Minimum) (AA) | Automated for solid backgrounds. Check by hand every case the tool marked incomplete: text over photos, gradients, video, and semi-transparent overlays. Large text is 18 pt, or 14 pt bold, which is roughly 24 px and 18.66 px. |
| Interface components and meaningful graphics at 3 to 1 | 1.4.11 Non-text Contrast (AA) | Input borders, focus indicators, icon buttons, chart lines, toggle states, the unselected state of a control. |
| Colour is never the only carrier of meaning | 1.4.1 Use of Color (A) | Required fields marked only in red. A chart legend distinguished only by hue. Links inside body text with no underline and under 3 to 1 contrast against surrounding text. A status column that is only a coloured dot. Test by taking a greyscale screenshot. |
| Text over images stays legible across every image that can appear there | 1.4.3 (AA) | Check the worst-case image, not the one in the design file. |
| Design does not rely on images of text | 1.4.5 Images of Text (AA) | Logos and branding are exempt. Headings baked into a JPEG are not. |

## 6. Motion, animation and timing

| Check | Criterion | Method |
|---|---|---|
| Anything moving, blinking or auto-updating for more than five seconds can be paused, stopped or hidden | 2.2.2 Pause, Stop, Hide (A) | Carousels, tickers, background video, animated stats counters, live feeds. |
| Nothing flashes more than three times a second | 2.3.1 Three Flashes (A) | Check video content, animated GIFs and loading states. |
| prefers-reduced-motion is respected | 2.3.3 Animation from Interactions (AAA), and good practice | Turn on the OS reduced-motion setting and reload. Parallax, scroll-triggered reveals, autoplay video and large transitions should stop or shorten. The script reports whether the query exists at all. Confirm by hand that it actually changes behaviour. |
| Time limits can be turned off, adjusted or extended | 2.2.1 Timing Adjustable (A) | Session timeouts, checkout holds, one-time-code windows, quiz timers. |
| Audio that plays automatically for more than three seconds can be stopped | 1.4.2 Audio Control (A) | Background music, autoplay video with sound. |

## 7. Forms, labels and errors

| Check | Criterion | What a failure looks like |
|---|---|---|
| Every field has a persistent visible label programmatically tied to it | 1.3.1 (A), 3.3.2 Labels or Instructions (A) | Placeholder used as the label, which disappears on typing. A label sitting next to an input with no `for` and `id`. |
| Required fields and format rules are stated before the user types | 3.3.2 (A) | A password rule revealed only after a failed submit. |
| Errors are identified in text, not colour or an icon alone | 3.3.1 Error Identification (A) | A red border and nothing else. |
| Errors say how to fix the problem | 3.3.3 Error Suggestion (AA) | "Invalid input" instead of "Enter a date as DD/MM/YYYY". |
| Errors are announced and reachable | 4.1.3 (AA), 3.3.1 (A) | An error summary that is not focused and not in a live region. |
| Fields collecting the user's own data carry the right autocomplete token | 1.3.5 Identify Input Purpose (AA) | `autocomplete="off"` on name, email, phone and address fields. The wrong token, for example `name` where `given-name` is meant. |
| Submissions that are legal, financial or that modify data are reversible, checked, or confirmed | 3.3.4 Error Prevention (AA) | A one-click irreversible delete. An order placed with no review step. |
| Information already given is not asked for twice in the same process | 3.3.7 Redundant Entry (A) | A checkout that asks for the delivery address again on the billing step with no "same as delivery" option. |
| Authentication needs no cognitive function test, or offers an alternative | 3.3.8 Accessible Authentication (Minimum) (AA) | Blocking paste into a password or one-time-code field. A puzzle CAPTCHA with no alternative. A memory-based security question with no other route. |
| Help is in the same relative place on every page that offers it | 3.2.6 Consistent Help (A) | A contact link in the header on some pages and buried in the footer on others. |
| Nothing changes context on focus or on input without warning | 3.2.1 (A), 3.2.2 (A) | A select that navigates on change. A form that submits when the last field is filled. |

## 8. Target size and pointer input

| Check | Criterion | Method |
|---|---|---|
| Targets are 24 by 24 CSS px, or spaced so 24 px circles do not overlap | 2.5.8 Target Size (Minimum) (AA) | The script measures and lists failures. Then apply the exceptions by hand: inline links in a sentence, browser-default controls, an equivalent target elsewhere on the page, and essential presentation. 44 by 44 is the AAA target and the better design default. |
| Multi-point and path-based gestures have a single-pointer alternative | 2.5.1 Pointer Gestures (A) | Pinch-to-zoom only. A swipe-only carousel. Signature capture with no typed alternative. |
| Device-motion actuation can be turned off and has a UI alternative | 2.5.4 Motion Actuation (A) | Shake to undo with no undo button. |
| Content shown on hover or focus can be dismissed, hovered, and stays visible | 1.4.13 Content on Hover or Focus (AA) | A tooltip that vanishes when you move the pointer towards it. A dropdown that closes before you reach it. |

## 9. Media

| Check | Criterion | Method |
|---|---|---|
| Prerecorded video with audio has captions, and they are accurate | 1.2.2 Captions (Prerecorded) (A) | Auto-captions are a starting point, not a pass. Check speaker changes, names, technical terms and punctuation. |
| Prerecorded video has audio description or a full media alternative | 1.2.3 (A), 1.2.5 Audio Description (AA) | On-screen text, charts or demonstrations never spoken in the audio. |
| Prerecorded audio-only has a transcript, and video-only has a transcript or description | 1.2.1 (A) | A podcast page with no transcript. |
| Live video with audio has live captions | 1.2.4 Captions (Live) (AA) | Webinars and live streams. |
| The player itself is keyboard operable and its controls have names | 2.1.1 (A), 4.1.2 (A) | A custom player whose play button is an unlabelled div. |

## 10. PDFs and other documents

Documents published on the site are in scope. A perfectly accessible page linking an inaccessible PDF still fails.

| Check | Criterion | Method |
|---|---|---|
| The PDF is tagged | 1.3.1 (A) | Open in Acrobat and check the tags tree exists. An untagged PDF is a scan or an image to a screen reader. |
| Reading order in the tags tree matches the visual order | 1.3.2 (A) | Use the Reading Order tool. |
| Every image has alt text, decorative images are artifacts | 1.1.1 (A) | |
| Headings are real heading tags, not bold large text | 1.3.1 (A), 2.4.6 (AA) | |
| Tables have header rows marked as such | 1.3.1 (A) | |
| The document has a title in its properties and a language set | 2.4.2 (A), 3.1.1 (A) | Set Initial View to show the document title, not the filename. |
| Contrast meets the same thresholds as the web page | 1.4.3 (AA) | |
| Forms in the PDF have labelled fields and a logical tab order | 1.3.1 (A), 3.3.2 (A) | |
| Acrobat's Accessibility Check passes, and the manual items are worked through | | The automated check is as partial here as it is on the web. |

Where a PDF cannot be fixed, publish the same content as an accessible HTML page and link both. Under the UK regulations, some documents published before 23 September 2018 are out of scope, but anything still actively used is not.

## 11. Third-party and embedded content

Embedded widgets are the most common source of failures nobody owns. Chat bubbles, cookie banners, booking widgets, maps, video players, review carousels and payment iframes.

- Tab into each embed and back out again. Confirm no trap.
- Check the cookie banner is reachable, dismissible by keyboard, and does not obscure focus once dismissed. It is usually the first thing a keyboard user meets and it fails constantly.
- Check any embed does not force a focus steal on load.
- List every third-party component that fails and who owns it. Under the UK regulations, third-party content you neither fund nor develop nor control is out of scope for the statement, but you must say so and say what it is. Anything you paid for and configured is yours.

## 12. Recording the result

For each criterion record: pass, fail, or not applicable, plus the page and the evidence. Keep it. Three things depend on it.

1. The accessibility statement has to list every known failure and the criterion it fails.
2. Retesting after fixes needs a baseline.
3. If a regulator asks, the record is the answer.

Never sign off a conformance claim from an automated run alone.

## Sources

- W3C, WCAG 2.2. https://www.w3.org/TR/WCAG22/ — checked September 2026
- W3C WAI, Easy Checks and Evaluating Web Accessibility. https://www.w3.org/WAI/test-evaluate/ — checked September 2026
- GOV.UK, Understanding accessibility requirements for public sector bodies. https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps — checked September 2026
- Deque, The Automated Accessibility Coverage Report. https://www.deque.com/automated-accessibility-coverage-report/ — checked September 2026

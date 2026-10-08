# Modern frontend redesign

Date: 8 October 2026. This change refreshes POPP’IN’s presentation across the shared platform. It keeps the one-user account workflow, optional organizer capability, direct event applications, existing event content and server-owned processing.

## Visual system

The user selected a five-color palette with dark green, moss, beige, rosy brown and midnight green. Shared theme tokens give public, account and organizer screens the same palette.

| Color          | Value     |
| -------------- | --------- |
| Dark green     | `#0A3323` |
| Moss           | `#839958` |
| Beige          | `#F7F4D5` |
| Rosy brown     | `#D3968C` |
| Midnight green | `#105666` |

Headings use **Space Grotesk**; body text and controls use **DM Sans**. Both variable fonts are hosted locally with `font-display: swap`. Their official Google Fonts binaries and SIL Open Font License files are in `client/public/fonts/`; previous Paytone One files remain available. Binary checks confirmed valid SFNT tables and variable axes: Space Grotesk weights 300–700; DM Sans weights 100–1000 and optical sizes 9–40.

The final refinement uses **beige/cream `#F7F4D5` as the page base throughout**, including the footer, authentication and profile pages. Dark green supplies headings and primary controls; moss, rosy brown and midnight green provide restrained accents. Buttons use rounded rectangles with 12px corners, consistent field spacing, subtle borders/shadows and shared status treatments.

Home features a manually controlled spotlight of up to three existing event posters, with Previous/Next controls, a visible counter and accessible event announcements. Empty and single-poster states are supported. Editorial cards and the Weekend Edit continue the same hierarchy across public, profile, application and management views.

## Interaction refinement — October 8, 2026

The latest pass adds a layered poster fan with direct event selection, pointer tilt, word-by-word title entrances, a sliding active-navigation pill, and subtle pointer-following highlights on shared cards. Poster frames, community cards, page-heading emblems and button depth use the existing cream, green and rose tokens. Shared components carry the treatment through Discover, event details, profiles, recruitment and forms.

Interaction references are React Bits' [Spotlight Card](https://reactbits.dev/components/spotlight-card), [Tilted Card](https://reactbits.dev/components/tilted-card), [Split Text](https://reactbits.dev/text-animations/split-text) and [Pill Nav](https://reactbits.dev/components/pill-nav). POPP'IN uses original React/CSS implementations of these interaction ideas; no React Bits source or animation dependency was installed.

Reusable implementations live in `useSurfaceMotion.ts`, `TextReveal.tsx` and `PillNavigation.tsx`, with styling in `experience.css`. Pointer updates use animation frames without per-move React renders. Touch devices keep posters still; reduced-motion preferences disable title entrances, tilt and pointer highlights. Posters are manually selected with named buttons, pressed states and live announcements. The existing SPA links, form validation and confirmation dialogs remain in place.

The production build and lint passed. The [interaction audit](experience-ui-audit.json) records **50 passing checks** and **23 page/viewport combinations across ten routes**, including Home at 1440, 1024, 768, 375 and 320 pixels. Additional checks cover the organizer navigation at 1024/1280 pixels, pointer reset, live reduced-motion changes, touch behavior, keyboard poster controls, SPA navigation, mobile-menu dismissal, poster loading/error/retry/empty states and recruitment read-more/edit/delete cancellation. Contained, horizontally scrollable tab lists were distinguished from page overflow. No page overflow, uncaught application errors or attempted database writes were observed.

These checks used browser-only fixtures: event content came from the existing poster manifest; account and recruitment records were synthetic QA data. **Live API/database behavior was not verified.** No fixture data or QA script is bundled with the app, and no repository test suite was added.

Latest previews: [Home desktop](screenshots/experience-home-1440.png), [Home mobile](screenshots/experience-home-375.png), [full Home](screenshots/experience-home-full.png), [Discover](screenshots/experience-discover-1440.png), and [mobile recruitment](screenshots/experience-recruitment-375.png).

## Home Weekend Edit

The former Home calendar has been replaced by the reusable [WeekendEdit.tsx](../client/src/components/home/WeekendEdit.tsx) component and [weekendSelection.ts](../client/src/components/home/weekendSelection.ts) helper. A cream editorial introduction sits beside a list of poster tickets. **This weekend**, **Next weekend** and **Coming up** buttons choose the period, expose the selected state with `aria-pressed` and announce updated dates and counts.

The section uses existing published event data, previews at most three matches and displays the full matching total. Its Discover link carries the corresponding `from` and, for weekend ranges, `to` filters. Selection uses Manila-local calendar dates and inclusive overlap for multiday events; ongoing events remain eligible, while events ending before the selected current/future window are excluded. No backend or stored-data changes were made.

The frontend [discoveryQuery.ts](../client/src/utils/discoveryQuery.ts) helper expands date-only filters only when Discover constructs its API request: `from` becomes the start of the Manila day and `to` becomes its final millisecond, both with the `+08:00` offset. This matches the existing backend timestamp comparisons and includes events later on the final selected day. Browser URLs and date inputs retain their readable `YYYY-MM-DD` values.

Shared loading, error/retry and empty states remain available, including an action from an empty weekend to upcoming events. Poster images retain their fallback, and ticket animation respects reduced motion. Entry animation uses backwards fill so its transform does not override the ticket's hover lift after the animation ends.

## Page coverage

| Area             | Screens and modes                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Public browsing  | Home, Discover and filters, event details, event updates/feed, vendor opportunities, not-found page               |
| Accounts         | Login, registration with Confirm Password, My Profile, personal profile editing, optional organizer setup/editing |
| Public profiles  | Organizer page with owner actions; retained legacy vendor-profile view                                            |
| Event management | My Events, create/edit event, event updates, recruitment management                                               |
| Applications     | Direct vendor application, My Applications, incoming application review/details, confirmed events                 |
| Catalogue        | Existing venue/category management                                                                                |

No separate organizer or vendor application shell was introduced. Existing route protection and conditional management actions remain in place. The redesign changes presentation rather than the account or database model.

## Reusable components and accessibility

Shared Button/IconButton, Card, FormField, Input/Textarea/Select/Checkbox, ImageUploader, Modal, ConfirmDialog, Alert/Toast, StatusBadge, Tabs, DropdownMenu and loading/error/empty components continue to serve the pages.

- Native dialogs retain background inertness, keyboard focus containment, Escape/backdrop dismissal where allowed, safe cancellation focus and focus restoration.
- Tabs retain roving focus, arrow/Home/End keys and linked accessible tab/panel labels. Menus retain keyboard movement, Escape and outside-click dismissal.
- Form labels, per-field errors, `aria-invalid` and hint/error descriptions remain connected. RHF and external Zod schemas remain the validation layer.
- Alerts and loading states retain accessible live-region behavior. Toasts pause while hovered or focused and remain dismissible.
- Focus indicators, the skip link, usable control sizes, mobile reflow and reduced-motion styles are retained in the shared presentation layer.

Dialogs and toasts render outside the page shell through portals, so global control/theme rules also style these overlays. Existing confirmation steps remain before destructive actions.

## Rubric mapping

The supplied CTADWEBL rubric requires a landing page, at least ten routed pages, a single axios instance, loading/error/empty/success feedback, RHF plus external Zod validation, confirmation before deletion and responsive use at **375px** and desktop without horizontal scrolling.

This frontend work targets the design and responsiveness criteria: deliberate Tailwind tokens, clear hierarchy, aligned spacing, consistent corners/shadows and shared controls across all page families. The existing data-processing UI continues to display server-derived event timing, recruitment availability, application statuses and organizer summaries. These computations and permissions were not moved into styling or duplicated in a new backend.

## Preservation

A before/after hash comparison covered **64 files**: every one of the **45 backend files**, including environment configuration, plus **19 client hooks, schemas, API, authentication and type files**. All matched at the recorded check. The [preservation audit](modern-preservation-audit.json) contains paths and unchanged flags; it contains no environment values or hash values.

No new dependency or backend/data-model change is needed for the redesign. Changes remain in fonts and frontend presentation, including the Discover date-query conversion described above. Existing account handling, the shared axios client, Zod schemas and backend processing rules remain in place.

The unused `VendorCTA` component and obsolete scrapbook stylesheet were removed after their active replacements were integrated. No backend or account-processing module was removed.

## Verification and current limitation

The final `npm run build` passed after the Weekend Edit and Discover date-boundary corrections, including TypeScript project compilation and Vite’s 2,130-module production build. `npm run lint` also passed.

Temporary scripts outside the repository passed **93 helper assertions**: 41 for weekend selection and 52 for Discover query conversion. These include 15 preview/backend timestamp-parity scenarios spanning Thursday, Friday, Sunday and Manila midnight across all periods. The [Weekend Edit browser audit](weekend-edit-audit.json) records **52 passing checks**, including responsive checks at **1440, 768, 375 and 320 pixels**, using browser-only fixtures from the existing poster manifest. Checks cover period selection and keyboard operation, event totals and the three-ticket preview, date-filter navigation, responsive layout, loading/error/retry/empty feedback, poster fallback and reduced motion.

Six final targeted browser checks also verified a synthetic Sunday timestamp event in both the preview and Discover, complete Manila-day request bounds, unchanged calendar-date URLs/inputs, SPA navigation and hover lift with normal motion. This additional boundary event was a browser-only QA fixture, explicitly identified in the audit; it was not added to project data or MongoDB. These checks do not verify the live API.

Current section screenshots: [desktop at 1440px](screenshots/weekend-edit-1440.png), [tablet at 768px](screenshots/weekend-edit-768.png) and [mobile at 375px](screenshots/weekend-edit-375.png).

The earlier [cream refinement browser audit](cream-ui-audit.json) records **112 passing checks**, including **69 views across 23 routes at 1440, 768 and 375 pixels**. Every audited page used the cream body background; the five selected palette tokens remain unchanged. There were no horizontal-overflow findings, unhandled JavaScript errors or broken images in those views.

Interaction checks covered spotlight navigation, wrapping, keyboard activation and zero/single/three-poster states; search/filter and empty results; error/retry feedback; registration validation; the shared account shell; owner pages; mobile navigation and private-route guards; and reduced motion. They also checked event-form validation before requests, image-removal confirmation with Escape/focus return, delete-confirmation cancellation/focus containment and application-details dialogs on mobile. The ?Start something local? button retained a 7.41:1 text contrast ratio on hover. A final targeted Discover rerun covered all three widths, expanded mobile date fields, combined date/city/timing submission and clearing filters. Advanced filters collapse when unused and use full-width fields on small screens.

Representative screenshots from the earlier cream refinement, before the Home calendar replacement:

- [Full Home page](screenshots/cream-home-full.png) and [Home at 375px](screenshots/cream-home-375.png).
- [Event details at 1440px](screenshots/cream-event-1440.png).
- [My Events at 375px](screenshots/cream-my-events-375.png).
- [Application details dialog at 375px](screenshots/cream-application-details-375.png).
- [Discover at 375px](screenshots/cream-discover-375.png) and [expanded mobile filters](screenshots/cream-discover-filters-375.png).

There are 36 retained screenshots from this pass, captured with reduced motion after page content and fonts settled. The full Home screenshot also follows a complete lazy-image scroll pass. Their account/application data is temporary presentation data, as described below.

The live API could not reach MongoDB during the initial visual-verification setup. Temporary browser-only response fixtures were prepared outside the repository from the existing `server/data/poster-events.json` manifest. Event titles, descriptions, dates, organizers, venues, categories and poster filenames came from existing project data; synthetic account/application records are explicitly QA presentation fixtures.

These fixtures are not part of the frontend bundle and were not inserted into MongoDB. Intercepted-browser results can demonstrate layout and interaction rendering; they cannot establish that live authentication, database writes, uploads or capacity processing succeeded during this redesign.

Live connectivity did **not** recover during the earlier cream-refinement verification: the MongoDB Atlas TLS alert 80 remained unresolved, and its final live events request timed out after five seconds. The latest Weekend Edit checks used browser fixtures and did not verify live connectivity. No successful live authentication, database write or image upload is claimed by these UI audits; they explicitly record `liveApiVerified: false`.

After the Weekend Edit checks, its isolated QA browser was closed and the verified temporary directory was removed. The earlier cream-refinement and modern-redesign QA sessions and temporary files were also cleaned up, including fixture modules, harnesses and browser profiles. Only screenshots and sanitized audit reports remain in the repository. No commit or push was performed.

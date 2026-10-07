# POPP’IN reference-inspired UI refresh

Completed October 7, 2026. This follow-up uses the supplied references for composition, layering and visual rhythm, while retaining the existing POPP’IN identity.

## Design changes

| Reference detail                     | POPP’IN implementation                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fanned poster arrangements           | Home now displays three real event posters with overlapping paper frames and tape. Each poster keeps its original event link. Croissant, bilao and shoes remain the hero cutouts.                                                    |
| Folder cards with images behind them | Standard and featured EventCards use a tilted poster sheet, a category tab and a folder front. Reserved padding keeps the full poster visible above the front. Cream, the existing olive wash and pink wash alternate through lists. |
| Graph paper and prominent headings   | Home, featured page headings, the auth story panel and footer use a faint grid derived from the existing brown. Paytone One headings have more prominence and clearer word spacing.                                                  |
| Scrapbook labels and paper layers    | Management headings, profiles, forms, sidebars and event summaries share folder edges, restrained tape accents and offset shadows. Form sections have small numbered labels.                                                         |
| Social/editorial rhythm              | Feed event entries put poster and information side by side on desktop; mobile uses one column. Existing posts retain their social identity and actions.                                                                              |
| Large footer signature               | The footer adds a working Discover invitation and a larger version of the existing olive POPP’IN wordmark. Existing role-aware footer links remain.                                                                                  |
| Playful but usable controls          | Shared buttons, selected tabs and cards use matching outlines and paper shadows. Existing dialog, keyboard, validation and reduced-motion behavior remain.                                                                           |

The palette remains olive `#bab565`, cream `#fefef2`, pink `#f1b4af` and brown `#5f4e34`. Fonts remain Paytone One and Trebuchet MS. No images, watercolor illustrations, logo assets, grass files, packages, API behavior or backend source were replaced. The existing `public.css` theme is unchanged; the new stylesheet derives its values from that theme.

On mobile, large heading illustrations move to a corner so they do not squeeze the text. The hero folder is shorter, and the original grass divider remains visible immediately. Poster fans follow below the grass on narrow screens. Functional buttons, forms and metadata stay upright.

## Files

New: `client/src/styles/scrapbook.css`, this report, `reference-ui-audit.json`, `reference-ui-preservation.json`, `reference-ui-cleanup.json`, and screenshots under `docs/screenshots/reference-*`.

Changed: `client/src/index.css`; `components/layout/Page.tsx`; `components/home/EventPresentation.tsx`; `components/shared/ProfileHeader.tsx`; `components/events/EventHeader.tsx`; `components/public/PublicFooter.tsx`; `pages/public/HomePage.tsx` and `DiscoverPage.tsx`; `pages/social/FeedPage.tsx` and `OpportunitiesPage.tsx`. Component/page paths are relative to `client/src/`. Documentation links are updated in the root README and previous refinement report. No files were removed.

## Validation

- Production build and ESLint pass. No dependencies were installed.
- [120 responsive page views and 27 UI checks passed](reference-ui-audit.json): public, client, organizer and vendor pages at 1440, 1024, 768, 430 and 390 px; no horizontal document overflow, unexpected page alerts or runtime exceptions.
- UI checks cover the actual poster-to-event link, search/empty/clear-filter behavior, registration for all three roles, form validation/labels, mobile navigation, Escape/focus restoration and logout.
- Immediate grass visibility was checked at 1440×720, 1024×600, 768×600, 430×800, 390×844, 390×667 and 320×568.
- [Preservation hashes match](reference-ui-preservation.json) for all 44 backend files, 37 public assets, the existing theme stylesheet and client manifests.
- [Cleanup removed all five temporary test accounts and their profiles](reference-ui-cleanup.json). All 16 original event records remain, including the 13 published events. No event, application or upload records were created for this pass.

Preview examples: [Home](screenshots/reference-public-home-1440.png), [folder cards](screenshots/reference-folder-cards-1440.png), [Feed](screenshots/reference-public-feed-1440.png), [mobile Discover](screenshots/reference-public-discover-390.png), [event details](screenshots/reference-public-event-1440.png) and [footer](screenshots/reference-footer-1440.png). Authenticated screenshots show temporary QA profiles, which have now been removed.

Review the layouts with your own content and preferred browser, particularly long event/business names, different poster proportions and narrow form fields. The earlier [shared component report](FRONTEND_REFINEMENT_REPORT.md) documents the retained UI architecture and full workflow checks.

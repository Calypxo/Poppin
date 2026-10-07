# POPP’IN one-account simplification report

Maintenance update, 8 October 2026: the project README files, backend unit-test file and API check script were removed at the user's request, together with the `test` and `check:api` npm commands. The verification results and file inventory below record the completed simplification before that cleanup.

Date: 7 October 2026. This report covers the requested account/workflow simplification. Earlier account reports and screenshots document historical implementations and should not be read as the current registration or application specification.

The current model is one normal User, an optional owned Organizer profile, and vendor applications submitted directly for individual events. The same User can organize and apply. The existing visual identity and shared application shell remain in use.

Verified: 151 API checks, six backend unit tests, 23 browser flow checks and 24 responsive views passed. Client lint and production build completed successfully. Evidence and exact cleanup are linked below.

## 1. Files changed

This inventory covers the account simplification, including the immediately preceding unfinished account transition. It does not treat earlier design work as newly implemented here.

| Area                                      | Files                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account/application models                | `server/models/User.js`, `server/models/VendorApplication.js`                                                                                                                                                                                                                                            |
| API startup, authentication and ownership | `server/app.js`, `server/middleware/auth.js`, `server/utils/access.js`, `server/routes/auth.js`                                                                                                                                                                                                          |
| Profiles and event access                 | `server/routes/profiles.js`, `server/routes/events.js`, `server/routes/announcements.js`, `server/routes/vendors.js`                                                                                                                                                                                     |
| Recruitment/application authorization     | `server/routes/vendorCalls.js`, `server/routes/vendorApplications.js`                                                                                                                                                                                                                                    |
| Catalogue creator ownership               | `server/routes/categories.js`, `server/routes/venues.js`                                                                                                                                                                                                                                                 |
| Development and verification scripts      | `server/scripts/check-api.js`, `server/scripts/migrate-accounts.js`, `server/scripts/import-poster-events.js`, `server/seeds/seed.js`, `server/tests/processing.test.js`                                                                                                                                 |
| Client authentication and shared routes   | `client/src/auth/ProtectedRoute.tsx`, `client/src/router/AppRouter.tsx`, `client/src/components/shared/navigation.ts`, `client/src/schemas/authSchema.ts`, `client/src/pages/account/AuthPage.tsx`                                                                                                       |
| Client data types                         | `client/src/types/account.ts`, `client/src/types/event.ts`, `client/src/types/vendorApplication.ts`                                                                                                                                                                                                      |
| Account/organizer setup                   | `client/src/schemas/profileSchema.ts`, `client/src/pages/account/ProfilePage.tsx`, `client/src/pages/account/EditProfilePage.tsx`                                                                                                                                                                        |
| Application forms and lists               | `client/src/pages/public/VendorApplicationPage.tsx`, `client/src/pages/account/ApplicationsPage.tsx`, `client/src/components/vendors/VendorApplicationCard.tsx`, `client/src/pages/account/ConfirmedEventsPage.tsx`                                                                                      |
| Discovery, events and contextual actions  | `client/src/pages/social/FeedPage.tsx`, `client/src/pages/social/OpportunitiesPage.tsx`, `client/src/pages/public/EventDetailsPage.tsx`, `client/src/pages/account/MyEventsPage.tsx`, `client/src/pages/organizer/OrganizerEventFormPage.tsx`, `client/src/pages/organizer/OrganizerVendorCallsPage.tsx` |
| Opportunity and lineup components         | `client/src/components/vendors/VendorOpportunityCard.tsx`, `client/src/components/vendors/VendorLineup.tsx`, `client/src/components/shared/VendorCard.tsx`                                                                                                                                               |
| Shared layout styling                     | `client/src/styles/app.css`, `client/src/styles/ui.css`                                                                                                                                                                                                                                                  |
| Documentation                             | `README.md`, `docs/API.md`, `docs/MIGRATION.md`                                                                                                                                                                                                                                                          |

## 2. Files created

- `server/utils/applicationAccess.js`: shared direct-user and explicit legacy-relationship ownership queries.
- `server/scripts/migrate-application-indexes.js`: preview-first application-index update without document changes.
- `client/src/schemas/applicationSchema.ts`: validates the direct business/contact application form.
- `client/src/components/profiles/ProfileSetupPrompt.tsx`: shared optional profile setup prompt.
- `docs/SIMPLIFICATION_REPORT.md`: this 20-item report.
- Verification evidence: `docs/simplification-api-audit.json`, `docs/simplification-ui-audit.json`, `docs/simplification-preservation.json`, `docs/simplification-index-migration.json`, `docs/simplification-cleanup.json`.
- Current screenshots: `docs/screenshots/simplified-profile-1440.png`, `simplified-profile-390.png`, `simplified-applications-1440.png`, `simplified-applications-390.png`, `simplified-register-390.png` in the same screenshot directory.

## 3. Files removed

`client/src/schemas/applicationNotesSchema.ts` was removed. The direct application form now uses `applicationSchema.ts` for business and contact information as well as optional notes.

No model was removed. Administrator files had been removed in earlier work and are not counted as deletions from this simplification.

## 4. Models changed

- **User:** registration no longer requires or stores a permanent client/vendor/organizer role. Identity remains name, email, passwordHash, optional avatar/bio/location/contact information, activity and timestamps.
- **VendorApplication:** new applications carry direct `user` and `event` relationships, submitted business/contact/product details, optional description/social/notes and a server-controlled initial pending state. A partial unique user/event index prevents duplicate event applications. Explicit old vendor links remain compatible.
- **Organizer:** the existing model supplies the optional organizer capability through its unique user link. The storage name remains Organizer; a duplicate OrganizerProfile collection is unnecessary.
- **Event, Announcement and VendorCall:** existing records and models continue to supply events, simple updates and recruitment. Timing, summaries and availability are derived rather than stored as new counters.

## 5. Models removed

None. VendorProfile remains for explicit old links, public legacy profile URLs and optional compatibility profile endpoints. `POST/PATCH /profiles/vendor` remains callable for compatibility; the normal registration/application flow never calls it. Normal signup and vendor applications do not create one or require a vendor account. VendorCall is retained because its existing references and capacity transaction are already established. No Admin, VendorLineup or replacement OrganizerProfile collection is introduced.

## 6. API endpoints changed

Full payloads and permissions are in [API.md](API.md).

- `POST /auth/register`: accepts normal identity credentials, creates only User and returns no role-based account selection.
- `GET/PATCH /profiles/me`: read the account and optional linked profiles; edit personal fields independently.
- `POST/PATCH /profiles/organizer`: create or edit the authenticated user’s optional organizer profile.
- Event, post and recruitment writes: use authentication and ownership/capability checks. Catalogue writes require authentication and creator ownership for edits/deletes.
- `POST /vendor-applications`: accepts business, category, products and contact information directly; derives user and event on the server.
- `GET /vendor-applications`: explicit outgoing/incoming views, optionally narrowed to an event or recruitment call.
- Application detail/notes/withdraw/delete/review endpoints: distinguish applicant ownership from event-owner review permission.
- `GET /events/:id/vendors`: projects only accepted applications into a public lineup.
- `GET /events/mine`: includes application and capacity summaries derived for owned events.
- `GET /vendors/me/confirmed-events`: works for any authenticated user with accepted applications.

## 7. Old role logic removed

Registration no longer asks Client, Organizer or Vendor, or requests a business name. The client no longer determines navigation, event permissions or applications from `user.role`. Server access is based on authenticated User and owned records. My Profile remains the account hub and My Applications is available to every user.

An existing stored role value has no authorization effect. Legacy vendor paths may redirect into the same application; they do not establish a second account type or dashboard. Malicious role values in API tests are test inputs, not supported account roles.

## 8. Admin logic removed

The active workflow has no administrator role, organizer verification or pending-admin event review. Event owners publish directly. Stored publication states are draft, published and cancelled. Compatibility normalization may translate old pending/rejected event states to draft; it does not restore an approval workflow.

No new admin module is added. Administrator approval had already been removed in earlier work; this change preserves that behavior.

## 9. Organizer capability implementation

My Profile offers **Become an Organizer** when no linked organizer exists. The form saves an owned Organizer record and refreshes the existing authenticated session. The account remains the same User. My Events and Create Event appear contextually, and the public organizer page gains owner actions.

The server permits at most one linked organizer per user. New setup cannot claim a pre-existing organizer from its public name or email. Only that profile’s owner can manage its events, updates, recruitment and incoming applications. `/organizer/profile/edit` leads to the shared profile editor’s organizer section.

## 10. Vendor application implementation

Any signed-in user can follow **Apply as Vendor** from a recruiting event to `/vendor-application/:vendorCallId`. The form collects business name, category, products, contact number and email, with optional business description, social page and notes. No VendorProfile setup occurs.

The API assigns the authenticated User, the call’s Event, representative name, application code and pending status. It validates recruitment and category eligibility, then prevents another application by the same User for that Event. `/my-applications` shows the applicant’s own event, business, application date and status. Event owners use the shared application components in an incoming review view.

Pending applications may be accepted, rejected or withdrawn. Rejection requires an explanation. Accepted and rejected history cannot be rewritten by an applicant. Only the applicant can edit notes or withdraw an eligible submission; the event owner can review it.

## 11. Vendor capacity calculation

```text
acceptedVendorCount = count(accepted applications for the recruitment call)
remainingSlots = totalSlots - acceptedVendorCount
```

Legacy approved values count as accepted until normalized. Remaining slots are derived; no independent remaining-slot field is stored. Event-management summaries aggregate application counts and recruitment capacity from existing records.

Acceptance writes the shared VendorCall inside a MongoDB transaction, then rechecks availability. Competing requests for the last slot therefore cannot both succeed. The server also prevents lowering capacity below already accepted vendors. Event publication, recruitment state, opening date, deadline, event dates and capacity govern eligibility.

## 12. Vendor lineup derivation

`GET /events/:id/vendors` derives the lineup from accepted applications for the event, with legacy accepted-state compatibility. Each public item contains business name, category, products, description and social media; any old logo/profile link comes only from an explicitly linked legacy profile.

Pending, rejected and withdrawn applications remain absent. Account IDs, contact emails/numbers, application notes and review details are not leaked by the public lineup response. Acceptance updates the source application, so no extra lineup record or synchronization step is needed.

## 13. Event date-state logic

Publication is stored as draft, published or cancelled. Timing is independently derived from event calendar dates in Asia/Manila: before start is upcoming, within the start/end range is ongoing, and after end is completed. Days until start are derived as well. An event’s date-state is not manually maintained by the owner.

Recruitment dates and deadlines are checked server-side when applying and accepting. The UI displays the returned availability rather than relying on button visibility alone.

## 14. Discover/filter processing

Published event discovery combines text search, location/city, category, date bounds, event timing state and the existing featured filter. The existing persisted chronological feed remains a simple event/update/recruitment list. No social-network engagement or recommendation system is introduced.

## 15. Reusable frontend components preserved/refactored

The application retains one shared shell and navigation, Button/IconButton, Card, Modal, ConfirmDialog, Alert/Toast, StatusBadge, Tabs, DropdownMenu, common form controls, ImageUploader and shared loading/error/empty states. EventCard, EventHeader, profile headers, application cards and VendorLineup remain shared components with contextual props and actions.

Registration adds Confirm Password within the same form system. Organizer setup, direct vendor application, incoming review and outgoing status pages use the established form validation and feedback patterns. Normal flows use reusable confirmations and toasts rather than browser alert/confirm dialogs.

The existing olive `#bab565`, cream `#fefef2`, pink `#f1b4af`, brown `#5f4e34`, Paytone One headings, Trebuchet MS body text, logo, posters, watercolor stickers and grass/botanical dividers remain the design baseline.

## 16. Cloudinary status

The signed-in multipart image-upload flow and ImageUploader remain in place. The account changes do not require changing the Cloudinary implementation or exposing its credentials. Existing event posters, organizer logos and personal avatar uploads continue to use the shared service and secure image URLs.

A live authenticated upload through the browser succeeded. The exact temporary Cloudinary image was then deleted, with the remote destroy result recorded as `ok` in [simplification-cleanup.json](simplification-cleanup.json). Hash comparison confirms the existing Cloudinary configuration and upload route were preserved in [simplification-preservation.json](simplification-preservation.json).

## 17. Authentication status

Email/password authentication continues to use bcrypt and JWT. Login and registration enter the same shared application; `/auth/me` restores identity and optional profile IDs. Server-side ownership checks protect events, posts, profiles and application data. Registering or submitting a body with a role/user/owner field cannot grant permission over another account.

The final running API passed **151 checks with zero failures**, and backend unit tests passed **6/6**. Coverage includes normal registration/login/current user, optional organizer setup, direct application without VendorProfile, same contact email across different users, concurrent duplicate submissions across calls, applicant/event-owner boundaries, the final-slot acceptance race, closed/deadline/upcoming/full recruitment, private-field exclusion from lineups, legacy explicit links, cancelled confirmed bookings and derived management summaries. See [simplification-api-audit.json](simplification-api-audit.json).

Browser verification passed **23 flow checks** and **24 responsive views** at 1440, 768 and 390 pixels, with **zero JavaScript runtime errors**. This includes the shared account flow, contextual organizer actions, application submission/review and live upload. See [simplification-ui-audit.json](simplification-ui-audit.json). These results belong to this simplification, not the earlier account reports.

## 18. npm run build result

- `client`: `npm run build` passed with exit code 0 after final code changes.
- `client`: `npm run lint` passed with exit code 0.
- `server`: `npm test` passed all six unit tests.
- `server`: `npm run check:api -- --write-fixtures` passed 151 checks with zero failures against the final runtime; all exact API QA records were cleaned up.

The final API and unit results are recorded in [simplification-api-audit.json](simplification-api-audit.json).

## 19. Environment variable changes

The design requires no new environment variable. It continues to use the existing server MongoDB/JWT/origin/Cloudinary variables and frontend `VITE_API_URL`.

No environment file or dependency was changed for this task. The [45-file preservation check](simplification-preservation.json) confirms package manifests/lockfiles, the environment example, Cloudinary sources, `public.css`, fonts, logos, event posters and watercolor assets retained their original hashes. Shared account-layout styles changed without replacing the established color/font/assets baseline.

## 20. Manual MongoDB migration or cleanup

**No manual migration step is needed for the currently connected workspace database.** The narrow application-index script was previewed and applied. It created/verified the partial unique user/event constraint, then removed only the observed obsolete unique `vendorCall_1_email_1` index. This allows separate users to share a public business contact email. It updated and deleted zero documents; both original applications remained. See [simplification-index-migration.json](simplification-index-migration.json).

For another database with the older application indexes:

```powershell
cd server
node scripts/migrate-application-indexes.js
# After reviewing that database's preview and backup:
node scripts/migrate-application-indexes.js --apply
```

The separate, broader `migrate-accounts.js --apply` operation was **not run**. Its optional state-normalization and explicit organizer-linking instructions remain in [MIGRATION.md](MIGRATION.md). Historical User role values can remain ignored. Records are not assigned to accounts by public email or name.

All exact API fixture records were removed; [simplification-api-audit.json](simplification-api-audit.json) reports zero remaining QA accounts, events, calls, applications, catalogue items or profiles. Browser cleanup removed its two temporary users, two organizers, two events, two calls and two applications, plus the single exact temporary Cloudinary asset. No vendor profiles were created by the browser's normal application flow. See [simplification-cleanup.json](simplification-cleanup.json).

The isolated QA browser was closed, and its exact temporary profile, scripts and credentials directory was removed. The discarded intermediate failure screenshot was removed as well. Local and remote QA cleanup is complete.

Final checks preserved **16 original events, 13 published events and two original applications**. No seed or broad destructive migration was run. Existing organizer, recruitment, profile and application records remain available under the compatibility rules; linking a verified real owner to an unclaimed organizer is an optional explicit operation.

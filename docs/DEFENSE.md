# POPP’IN demo and defense preparation

Use a development/demo database and the shared application. Do not show environment secret values.

1. Show Home, the original palette, font, watercolor artwork, real posters and compact Manila calendar.
2. Open Feed. Explain that events, posts and recruitment are persisted records ordered on the server, with no fake frontend feed array.
3. Open Discover; combine city/category/search/date/state, show an empty result and clear filters.
4. Open the shared event page, organizer profile, updates and accepted vendor lineup while logged out.
5. Register or log in as a client; explain session restoration and the personal profile.
6. Log in as an organizer. Complete the profile, create a draft and publish. The event is immediately public; editing keeps it published. There is no admin review step.
7. Post a reminder or schedule update with an optional image; show it on the feed and event page. Open recruitment with an application window, fee, categories and slot count.
8. Log in as a vendor. Complete the business profile once, apply with a note and show the pending application. Business identity comes from the authenticated profile.
9. Return as the event owner and accept a vendor. Show the vendor in the public lineup and the event in that vendor’s confirmed list. Explain the transaction that protects the final slot against concurrent acceptance.
10. Show rejection notes, pending withdrawal, past-event grouping and cancellation. A cancelled event leaves public discovery; its confirmed vendors retain authenticated read access.
11. Show the models, ownership middleware, external Zod schemas, shared components and verification records. Explain that each business is an account inside one platform.

## Questions to prepare

- Why keep Organizer and Announcement collections? Reuse IDs, records and working relationships without duplicate collections.
- What is stored versus calculated? Publication/application state is stored; calendar state, availability, feed order, lineup and confirmed event relationships are derived.
- How do you prevent another organizer editing an event? JWT identifies the active User; the server follows Event → Organizer → User and checks the account, irrespective of the body.
- Why can’t a public email claim an organizer? Contact information is public and may be dummy data. Linking existing ownership is an explicit database operation.
- Why use transactions? Registration must not leave an orphan User/profile; two competing acceptances must not both take the last slot.
- Where are secrets? Server-only environment values. JWT_SECRET and Cloudinary secrets never enter VITE variables or responses.
- How are images handled? Authenticated multipart upload, MIME/size limits, Cloudinary secure URLs, preview/change/remove controls.
- How do you validate the UI? External Zod + RHF, field labels/errors, shared loading/retry/empty states, current theme tokens, reduced motion, five viewport sizes and real interaction checks.

Demonstrate genuine contributions. Each member should understand their actual work and commit under their own account. Repository sharing, remaining member details and external submission still need to be completed by the group.

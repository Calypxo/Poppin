# API reference

All routes are under `/api`. Protected requests send `Authorization: Bearer <token>` from the shared axios client. There is one User account type. Permissions follow authenticated identity, optional organizer ownership and event ownership; a submitted role or owner ID never grants access.

## Accounts and profiles

| Method | Endpoint                       | Access / response                                                                                            |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| GET    | `/health`                      | Public database/API health                                                                                   |
| POST   | `/auth/register`               | Name, email and password; 201 `{token,user}`. Creates a User only                                            |
| POST   | `/auth/login`                  | Email/password; 200 `{token,user}`                                                                           |
| GET    | `/auth/me`                     | Signed in; safe current user and linked profile IDs                                                          |
| GET    | `/profiles/me`                 | Signed in; `{user,organizer,vendor}`. `vendor` is a retained legacy profile, not an application prerequisite |
| PATCH  | `/profiles/me`                 | Signed in; personal name, avatarUrl, bio, city and contactNumber only                                        |
| POST   | `/profiles/organizer`          | Signed in; creates the current user’s optional organizer profile; duplicate setup returns 409                |
| PATCH  | `/profiles/organizer`          | Signed in; edits only the current user’s organizer profile                                                   |
| GET    | `/organizers`                  | Public active organizer list                                                                                 |
| GET    | `/organizers/:id`              | Public `{profile,events,posts}`; published events/posts only                                                 |
| GET    | `/vendors/:id`                 | Compatibility endpoint for an existing legacy vendor profile                                                 |
| GET    | `/vendors/me/confirmed-events` | Signed in; the user’s accepted events, including past/cancelled bookings                                     |

Registration example:

```json
{
  "name": "Example User",
  "email": "person@example.invalid",
  "password": "use-your-own-password"
}
```

The registration form also checks Confirm Password before submitting. It asks no account type or business name. The API validates names, unique email and passwords of at least 8 characters and at most 72 UTF-8 bytes. Passwords are hashed with bcrypt; the response never contains the hash. Login and registration return the same user shape.

Organizer setup example:

```json
{
  "businessName": "Example Market",
  "description": "Weekend markets for local makers and small businesses.",
  "logoUrl": "",
  "city": "Angeles City",
  "contactNumber": "09170000000",
  "email": "market@example.invalid",
  "socialMedia": ""
}
```

The existing Organizer model stores the submitted business name as `name`. Its `user` link is assigned by the server, and a unique ownership index limits each user to one profile. Organizer contact email is a public business contact, separate from private account identity. Creating a profile never claims an existing organizer by its name or public email.

Legacy vendor-profile endpoints are compatibility only. New applications contain their own business details and do not create or require a VendorProfile.

## Feed and events

| Method | Endpoint              | Access / response                                                                                                    |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/feed?page=1`        | Public; `{items,page,hasMore,count}`, newest persisted events/posts/recruitment first, 20 items per page             |
| GET    | `/events/discover`    | Public published events; `{count,filters,events}`                                                                    |
| GET    | `/events`             | Public published events only                                                                                         |
| GET    | `/events/mine`        | Signed in; own organizer events, with derived managementStats                                                        |
| GET    | `/events/public/:id`  | Published event only                                                                                                 |
| GET    | `/events/:id`         | Published for visitors; drafts for owner; cancelled also readable by accepted applicants                             |
| GET    | `/events/:id/vendors` | Accepted-application lineup; private event access follows the same ownership/confirmed-booking rules                 |
| POST   | `/events`             | Requires an owned organizer profile; creates own draft; submitted organizer/status cannot grant ownership or publish |
| PATCH  | `/events/:id`         | Event owner; edits preserve publication; cancelled events cannot be edited                                           |
| PATCH  | `/events/:id/status`  | Event owner; draft → published or published → cancelled                                                              |
| DELETE | `/events/:id`         | Event owner; refuses events with posts or vendor calls                                                               |

Discovery combines `search`, `city`, `category`, `featured=true`, `from`, `to` and `state=upcoming|ongoing|completed`. Example: `/events/discover?city=Angeles&from=2026-10-01&to=2026-10-31&state=upcoming`.

Create-event example:

```json
{
  "title": "Local weekend market",
  "description": "Local products and creative businesses.",
  "venue": "<venue-id>",
  "categories": ["<category-id>"],
  "startDate": "2026-10-17",
  "endDate": "2026-10-17",
  "startTime": "10:00",
  "endTime": "19:00",
  "posterUrl": ""
}
```

Publish with `{"status":"published"}`. The result is `{message,event}`. There is no administrator approval or verification step. Stored publication status is separate from upcoming/ongoing/completed, which are derived from Asia/Manila calendar dates. My Events statistics include `totalApplications`, `pendingApplications`, `acceptedVendors`, `totalSlots` and `remainingSlots`, calculated from recruitment/application records.

## Event updates

`/posts` and the compatibility alias `/announcements` use the same router and existing Announcement collection.

| Method | Endpoint                | Access / response                                                                                                       |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts`                | Public published posts whose parent event is published                                                                  |
| GET    | `/posts/mine`           | Signed in; posts on the user’s own organizer events, including drafts                                                   |
| GET    | `/posts/event/:eventId` | Public published posts; owner can also see drafts; accepted applicants can read published updates on cancelled bookings |
| GET    | `/posts/:id`            | Published/public parent or authorized owner/confirmed relationship                                                      |
| POST   | `/posts`                | Event owner; event, title, content, type, optional imageUrl and isPublished                                             |
| PATCH  | `/posts/:id`            | Event owner; cannot move a post to another event                                                                        |
| DELETE | `/posts/:id`            | Event owner                                                                                                             |

Types: `announcement`, `schedule_update`, `vendor_call`, `reminder`, `lineup`; legacy `general`/`important` values remain readable. The event must be published before a post can be published. Publishing timestamps are assigned by the server.

```json
{
  "event": "<own-event-id>",
  "title": "Meet us this Saturday",
  "content": "The market opens at 10 AM. See you there!",
  "type": "reminder",
  "imageUrl": "",
  "isPublished": true
}
```

## Recruitment and applications

Recruitment remains in VendorCall because the existing records, routes and capacity transactions already depend on it. It is an event-owned setting in the shared UI, not an account type or separate dashboard.

| Method | Endpoint                             | Access / response                                                                               |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| GET    | `/vendor-calls`                      | Public active open calls for published events, each with derived availability                   |
| GET    | `/vendor-calls/mine`                 | Signed in; recruitment for the user’s organizer events, including drafts                        |
| GET    | `/vendor-calls/event/:eventId`       | Latest active open call for a published event, or 200 `null`                                    |
| GET    | `/vendor-calls/:id`                  | Public visible call or event owner                                                              |
| GET    | `/vendor-calls/:id/availability`     | Derived statistics and availability, including accepted count, remaining slots and canApply     |
| POST   | `/vendor-calls`                      | Parent event owner; valid dates/categories; opening requires a published event                  |
| PATCH  | `/vendor-calls/:id`                  | Event owner; cannot move parent or reduce total slots below accepted vendors                    |
| DELETE | `/vendor-calls/:id`                  | Event owner; blocked when applications exist; close recruitment instead                         |
| GET    | `/vendor-applications`               | Signed in; defaults to the current user’s outgoing applications                                 |
| GET    | `/vendor-applications?view=incoming` | Signed in; only applications for the user’s organizer-owned events                              |
| GET    | `/vendor-applications/:id`           | Applicant or parent event owner                                                                 |
| POST   | `/vendor-applications`               | Any signed-in user; submits per-event business/contact details; no vendor profile required      |
| PATCH  | `/vendor-applications/:id`           | Applicant only, pending only; edit notes or submit `{"status":"withdrawn"}`                     |
| PATCH  | `/vendor-applications/:id/status`    | Event owner only, pending only; accept/reject with review note and transactional capacity check |
| DELETE | `/vendor-applications/:id`           | Applicant only; pending/withdrawn only; reviewed history preserved                              |

`view=outgoing|incoming` is explicit: a user with an organizer profile can use both views. Optional `event` and `vendorCall` filters narrow the permitted records; they cannot broaden access to another account’s applications.

Recruitment example:

```json
{
  "event": "<own-published-event-id>",
  "title": "Local vendors wanted",
  "description": "Bring your local products to our market.",
  "applicationStartDate": "2026-10-07T00:00:00+08:00",
  "applicationDeadline": "2026-10-15T23:59:59+08:00",
  "totalSlots": 20,
  "boothFee": 500,
  "boothSize": "2m × 2m",
  "requirements": ["Product list"],
  "acceptedCategories": ["<category-id>"],
  "status": "open",
  "isActive": true
}
```

Application example:

```json
{
  "vendorCall": "<call-id>",
  "businessName": "Example Handmade Goods",
  "category": "<category-id>",
  "products": "Handmade bags and accessories",
  "businessDescription": "Small-batch local handmade goods.",
  "contactNumber": "09170000000",
  "email": "business@example.invalid",
  "socialMedia": "",
  "notes": "We will bring a small tabletop display."
}
```

Required fields are `vendorCall`, `businessName` (≤150 characters), `category`, `products` (≤2,000), `contactNumber` (≤50) and `email` (≤254, valid address). `businessDescription` (≤5,000), `socialMedia` (≤500) and `notes` (≤2,000) are optional.

The server derives the application’s User, Event, representative name and initial `pending` state. It validates the submitted business details, category, event publication, recruitment window and remaining capacity. A user may submit only one application per event, including across multiple recruitment calls. Organizer capability is not a prerequisite for applying.

Application transitions are `pending → accepted`, `pending → rejected` and `pending → withdrawn`. Accept with `{"status":"accepted","organizerRemarks":"Welcome to the market!"}`. Rejection requires a nonempty review note. Only the applicant can edit notes, withdraw or delete their own eligible application; event ownership grants review rights.

Remaining slots are derived as `totalSlots - acceptedApplications` and are never stored as an independent counter. Acceptance locks the recruitment record inside a MongoDB transaction and rechecks eligibility, so concurrent acceptance requests cannot overbook the final slot. Applications and acceptances close when the recruitment deadline or capacity is reached.

The public lineup is projected from accepted application business name, category, products, description and social media. `_id` identifies the application. Optional legacy vendorId/logoUrl values come from an explicit existing profile link. Pending, rejected and withdrawn applications do not appear. Private contact fields, user IDs, notes and review details are excluded. No VendorLineup collection is created.

## Shared catalogue and uploads

| Method       | Endpoint                         | Access                                                                                    |
| ------------ | -------------------------------- | ----------------------------------------------------------------------------------------- |
| GET          | `/venues`, `/venues/:id`         | Public catalogue                                                                          |
| POST         | `/venues`                        | Signed in; creator derived from the account                                               |
| PATCH/DELETE | `/venues/:id`                    | Creating account only; deletion checks event references                                   |
| GET          | `/categories`, `/categories/:id` | Public catalogue                                                                          |
| POST         | `/categories`                    | Signed in; creator derived from the account                                               |
| PATCH/DELETE | `/categories/:id`                | Creating account only; deletion checks existing references                                |
| POST         | `/uploads/image`                 | Signed in; multipart image, JPG/PNG/WEBP, ≤5 MB; 201 secureUrl/publicId/dimensions/format |

Legacy catalogue items without a creator remain reusable and read-only. Organizer verification, administrator event approval, `/analytics/overview` and anonymous application-code/email tracking are not active workflows.

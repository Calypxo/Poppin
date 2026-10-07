# One-account compatibility and migration

The simplification reuses the existing User, Organizer, Event, Announcement, VendorCall and VendorApplication collections. The optional organizer capability is still stored in `organizers`; no replacement OrganizerProfile collection is needed. Existing poster/event IDs and uploaded image URLs remain valid.

Normal registration now creates a User only. An old stored `User.role` value has no authorization meaning and is neither required nor used by the active account workflow. Deleting those historical fields is not required to use the application.

## Recruitment and application compatibility

VendorCall is retained because existing event recruitment, routes, application references and transactional capacity checks depend on it. Moving its fields into Event would require rewriting those records without simplifying the user flow. There is no collection to duplicate vendor lineups.

New applications store their authenticated `user` and selected call’s `event` directly, together with the submitted business and contact details. They do not require or create a VendorProfile. A partial unique `user + event` index prevents a user from applying twice to the same event, including through different calls.

Existing vendorprofiles and application `vendor` links are preserved as compatibility data. Old application ownership is recognized through an explicit linked VendorProfile’s `user`; it is never inferred from a business name or public contact email. Accepted historical applications still contribute to capacity and can supply lineup business details from their stored application. An unlinked historical application does not become somebody’s private application merely because they register with a matching email.

## Application indexes for the simplified workflow

The connected workspace database has already completed the narrow application-index migration. No manual migration step is needed for that database. The [migration result](simplification-index-migration.json) records the verified partial unique `user_1_event_1` index and removal of the obsolete unique `vendorCall_1_email_1` index. Both original applications were retained; zero documents were updated or deleted.

For another database still using the old indexes, preview the narrow change first:

```powershell
cd server
node scripts/migrate-application-indexes.js
```

After reviewing the preview and backing up that target database, apply the index-only change:

```powershell
node scripts/migrate-application-indexes.js --apply
```

The script checks for conflicting user/event applications, creates the current application indexes and verifies the partial unique user/event constraint before removing only exact obsolete unique vendorCall/email indexes. It does not alter or delete application documents. This permits two different users to use the same public business contact email while still preventing duplicate submissions by one user to an event. An optional `--report <path>` records the result.

## Optional broader legacy normalization

The broader `migrate-accounts.js --apply` operation was **not run** for this simplification. It is separate from the completed index-only update and is not required merely to register or apply with the new workflow.

Back up the target database and review the preview before applying the migration. Stop application writes while updating indexes or explicitly linking a profile.

```powershell
cd server
node scripts/migrate-accounts.js
```

The script is read-only unless `--apply` is supplied. To apply the reviewed state/index changes:

```powershell
node scripts/migrate-accounts.js --apply
```

The explicit migration:

- Normalizes legacy event `pending`/`rejected` to `draft`.
- Normalizes application `approved` to `accepted`.
- Removes obsolete organizer verification/rejection fields.
- Creates User email, profile ownership and application identity indexes, including the new partial user/event uniqueness constraint.
- Replaces the old public-email/call uniqueness rule with identity-based application indexes. Public business contact email is not an account identifier.

It does not seed or erase the dataset, claim organizers, assign users to historical applications or match records by email. It retains the legacy vendor/call index for explicitly linked old applications. If existing direct user/event records conflict with the new unique index, resolve the exact conflicting records before applying it; the migration does not silently merge or delete them.

The API reads legacy event states as drafts and legacy approved applications as accepted while records are normalized. The compatibility rules let old and new records coexist without a bulk ownership rewrite.

The completed index-only update, verification and exact QA cleanup are recorded in [SIMPLIFICATION_REPORT.md](SIMPLIFICATION_REPORT.md). The original 16 events, including 13 published events, and two existing applications were preserved.

## Link an existing organizer to a real user

Public sample organizers are intentionally unclaimed. Linking a real owner is an explicit database-operator task, not an automatic registration feature.

1. Register a normal User with the person’s actual account email. Creating a new organizer profile first is not required.
2. Identify the exact existing Organizer ID and User ID. Verify ownership outside the app.
3. Preview the intended link:

   ```powershell
   node scripts/migrate-accounts.js --link-organizer <existing-organizer-id> --user <user-id>
   ```

4. Review the IDs and any unused linked profile the preview proposes replacing. Apply that exact target:

   ```powershell
   node scripts/migrate-accounts.js --link-organizer <existing-organizer-id> --user <user-id> --apply
   ```

5. Refresh the authenticated session through `/auth/me`, or log out and in. My Profile and navigation now expose management actions for the existing organizer and its events.

The link refuses an organizer already owned by another account. It also refuses to replace a current profile containing events, a description, logo, city, phone or social details. When replacement is permitted, the transaction removes only that explicitly identified unused profile and keeps the target business record, events and posts. Profiles containing actual work require a deliberate merge.

## Legacy application ownership

No automatic application reassignment is required. If a historical record needs to be linked to a real applicant, verify the exact business, event and User outside the app before a database operator makes that explicit relationship. Preserve its status and review history, and check the user/event uniqueness constraint. Never bulk-match email strings or delete accepted records to make a new account appear in the lineup.

New users simply apply through the event’s current recruitment form. The application holds their business details for that event; there is no vendor-account conversion or vendor-profile setup step.

## Optional seed and poster import

`npm run seed` is for a separate empty database. It requires `DEMO_PASSWORD` (at least 8 characters and at most 72 UTF-8 bytes), hashes demo account passwords and refuses a nonempty application database. Existing poster data does not need reseeding.

`node scripts/import-poster-events.js` requires `POSTER_IMPORT_TOKEN` for a signed-in user with the owning organizer profile. Only manifest entries matching that organizer are eligible. Imports use existing ownership checks and direct publishing. An existing unclaimed poster organizer must be explicitly linked before importing its entries.

## Environment

No role or account-type environment variable is needed. Existing backend configuration remains `MONGO_URI`, `JWT_SECRET`, API/origin settings and Cloudinary credentials. The frontend uses `VITE_API_URL`. Each environment supplies its own server-only signing secret; rotating that secret requires users to log in again. Never put server secrets in `VITE_` variables or documentation.

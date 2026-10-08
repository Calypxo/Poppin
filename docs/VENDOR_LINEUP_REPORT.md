# Vendor lineup seed and UI verification

Completed on the `hannah` branch, October 9, 2026 (Asia/Manila).

## What was added

The live MongoDB demo database received **44 normal User accounts**, **6 VendorCalls**, and **63 VendorApplications**: **57 accepted**, **4 pending**, and **2 rejected**. There are 38 distinct accepted businesses, with six additional fictional applicants for review demonstrations. Repeated businesses share one User ID across events. No Vendor role or VendorProfile was created, and no lineup was embedded in an Event document.

The six existing event records were matched by title, organizer and venue. “Likhang Lokal” from the request maps to the existing **Likha Lokal** event. Kulitan maps to **Kulitan Flea Market: Angeles City Youthfest**, at Nepomuceno Street Market, rather than the separate October Edition at Plaza Anghel.

All vendor/event associations are conservatively marked as school-project demo data in the seed source and private application notes; they are not asserted to be verified historical merchant lists. Product descriptions are illustrative. Contacts use `*.demo@example.invalid` and the non-routable placeholder `00000000000`. No invented social-media handles were added. Public lineup responses exclude emails, phone numbers and private notes.

## Seed files

- [Existing seed entry point](../server/seeds/seed.js): retains the empty-database guard for the default full seed; adds the explicit `--vendor-lineups` mode for an existing demo database.
- [Vendor data manifest](../server/data/vendor-lineups.js): reusable business identities, product descriptions, event associations, statuses and capacities.
- [Lineup seed helper](../server/seeds/vendorLineups.js): transactional insertion of missing users, categories, recruitment calls and applications. New empty-database seeds also use the existing poster manifest to create these six events.

The additive mode never clears collections, replaces event data, resets passwords or overwrites subsequent organizer review decisions. Missing/ambiguous events, multiple recruitment calls, incompatible categories or insufficient existing capacity stop the transaction. The new fixture calls have adequate capacity; existing calls are not silently enlarged. Production models and capacity rules were not changed.

`DEMO_PASSWORD`, when provided, is hashed with bcrypt using cost 12, as in the existing seed. Because it was unset for this run, new lineup accounts received an unrecorded random password, hashed with bcrypt; no plaintext password was stored or printed. Existing users' credentials were preserved. Set `DEMO_PASSWORD` before first seeding a fresh demo database if its newly created accounts need a known demonstration login. Rerunning the additive seed does not reset their passwords.

## Counts and capacities

| Event | Accepted | Pending | Rejected | Total applications | Capacity | Remaining |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Kulitan Youthfest | 8 | 2 | 1 | 11 | 15 | 7 |
| Masquerade of Smiles | 6 | 1 | 1 | 8 | 12 | 6 |
| Wheels & Deals | 6 | 0 | 0 | 6 | 10 | 4 |
| Likha Lokal | 8 | 0 | 0 | 8 | 15 | 7 |
| Feria Mabalacat | 22 | 0 | 0 | 22 | 30 | 8 |
| The Matcha Club | 7 | 1 | 0 | 8 | 12 | 5 |
| **Total** | **57** | **4** | **2** | **63** | **94** | **37** |

Remaining spaces are calculated from capacity minus **accepted** applications. Pending and rejected applications do not occupy spaces.

## Accepted businesses by event

**Kulitan Flea Market: Angeles City Youthfest** — Dunks Hot Chicken; Smashed Burger; Churro Grande; Sweet Escapes; Jungle Base Coffee; alCrafts; Jhong.JPG Stickers n’ Prints; JAJAJA!.

**Masquerade of Smiles** — Dunks Hot Chicken; Hot Wheels Kitchen; Paul & Nigel Coffee; Yuni; OVRA; Pug & Pour.

**Wheels & Deals** — Dunks Hot Chicken; Hot Wheels Kitchen; Paul & Nigel Coffee; OVRA; Smashed Burger; Jungle Base Coffee.

**Likha Lokal** — alCrafts; Jhong.JPG Stickers n’ Prints; JAJAJA!; KraftiePop; CAB Prints and Crafts; Warawara.ph; Sophisticated_Girl PH; New Beginnings Club Photobooth.

**Feria Mabalacat** — Nicole Anne Canizares; Art Sumalde; InTriKet; Diana Mae Gatbonton; Warawara.ph; KraftiePop; Sophisticated_Girl PH; CAB Prints and Crafts; New Beginnings Club Photobooth; Hot Chicks; Apung Lolie’s Kakanin; Atheenas Ilocos Empanada; D’Tamales / Bobotu; CinnaMada Special; The Baker Grace; Spuds Potato & Co.; Uncle B Burger; Ate Brenda’s Okoy; Eve’s Kitchen; Johannes Michi; Chino Elemos; Mabalacat City College.

**The Matcha Club** — Yuni; Pug & Pour; Kismet; Ikigai; Mitate; Paul & Nigel Coffee; OVRA.

## Applicants for review

| Event | Pending | Rejected |
| --- | --- | --- |
| Kulitan Youthfest | Paper Moon Trinkets; Crumb Corner Bakes | Copper Cart Snacks |
| Masquerade of Smiles | Sunday Thread Finds | Ribbon Room Goods |
| The Matcha Club | Mellow Whisk Studio | None |

The other three seeded events have no pending/rejected fixtures. These six fictional businesses are excluded from public lineups.

## UI improvements

The existing VendorLineup/VendorCard/shared Card components now offer category groups, searchable business names/products/descriptions, category counts and clear-filter controls. Category headings come from application category data. Small groups sit side by side on desktop; larger groups receive a full row. Cards use readable initials, products and short descriptions. Loading, errors and empty results retain the shared state components.

Organizer applications show six metrics: total, pending, accepted, rejected, total spaces and remaining spaces. Capacity comes from the existing `/events/mine` server summary. Completing a review refreshes both applications and capacity. Outgoing applications keep their existing summary layout.

The palette remains dark green `#0A3323`, moss `#839958`, cream `#F7F4D5`, rose `#D3968C` and midnight green `#105666`. Cream remains the base; Space Grotesk and DM Sans, existing event images and SPA navigation are preserved.

## Verification

- First live additive seed: **44 users, 6 calls, 63 applications added**.
- Second live additive seed: **0 users, 0 calls, 0 applications added**.
- All six public API lineups returned exactly the expected accepted business names, excluding pending/rejected applicants and private contact fields.
- All six remaining-space calculations matched the table above.
- Each repeated business used one User ID. All 44 new users had bcrypt hashes and no `role` field.
- An actual duplicate insert was rejected by MongoDB's compound `user + event` unique index. The probe transaction was aborted; no probe application remained.
- **53 browser checks passed**, including all six live lineups at 1440, 768 and 375 pixels, an additional 320px check, search/category combinations, no-results feedback, keyboard reset, palette values and shared Home/Discover/Opportunities checks. No page overflow or uncaught application error was observed.
- Organizer UI checks used an isolated browser-only login and copies of demo applications. Review requests were intercepted; the simulated acceptance changed the displayed figures from 8 accepted/7 spaces to 9 accepted/6 spaces without changing MongoDB. This verifies the UI refresh, not a live organizer review operation.
- `npm run build` and `npm run lint` both passed. No permanent test suite or additional dependency was added.

Evidence: [database/API checks](vendor-lineup-verification.json), [browser checks](vendor-lineup-ui-audit.json), [desktop lineup](screenshots/vendor-lineup-1440.png), [mobile lineup](screenshots/vendor-lineup-375.png), [mobile organizer summary](screenshots/vendor-applications-375.png).

## Rerun command

From the project root, using the existing server MongoDB configuration:

```powershell
cd server
npm run seed -- --vendor-lineups
```

This mode adds missing lineup fixtures to the six matching events. It is safe to rerun and preserves subsequent review decisions. The ordinary `npm run seed` command remains an empty-database-only full seed and requires `DEMO_PASSWORD`.

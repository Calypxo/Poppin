# Requirements and submission checklist

Updated October 7, 2026 for the user’s new centralized account/event platform. The original assignment’s general technical requirements are retained; the latest user request replaces the earlier admin-dependent concept.

| Requirement | Current evidence |
| --- | --- |
| One repository, client/server separation | Root README; user explicitly confirmed this format |
| React + Vite + TypeScript, React Router, axios | Existing frontend retained; shared layout and guarded routes |
| RHF, external Zod, inferred types, field errors | Event/call/catalogue/auth/profile/post/application-note schemas and forms |
| MongoDB/Mongoose relationships and processing | Nine collections, populated references, filtered discovery, date states, feed, availability, accepted lineups and confirmed events |
| Express routers and appropriate status codes | Auth/profile/event/post/call/application/catalogue/upload routers; JSON error handling |
| CRUD for several resources | Owned events, posts, calls, applications and creator-owned catalogue entries |
| Security and ownership | Password hashing/JWT; role/owner checks; scoped reads; transaction race/rollback tests |
| Reusable components/hooks | Shared event/profile/post/vendor/form/status/resource UI and useResource |
| Loading, errors, retry, empty/success states, confirmations | Shared states plus reused RHF forms and confirmation actions |
| Responsive original visual identity | Unchanged palette/fonts/Home assets; 140 views across five viewport widths; final navigation checks |
| Image upload | Real authenticated Cloudinary upload/preview/removal checked |
| Documentation | README, API, migrations, 22-point report, defense guide and verification artifacts |
| Environment/dependency/build files ignored | Root/server ignore rules; real environments and dependencies excluded |
| Build/tests | Build and lint pass; five processing tests; 94 API checks; browser/form evidence |

## Remaining human requirements

- Complete the project owner’s full name and the two teammates’ GitHub usernames.
- Share the repository with Jolane Mamangun and Hannah Mae Moran and record their actual contributions.
- Ensure genuine group-member commits; do not invent authorship or assign completed work that did not occur.
- Commit/push the reviewed project and verify instructor repository access.
- Submit the required repository link and contribution details through the instructed channel and complete the defense. A local audit does not complete those external steps.

The section is ITE-402 and the owner’s GitHub username is Calypxo. The original rubric’s submission/defense dates remain external course requirements; this refactor does not change them or claim the project was submitted.

Earlier audit screenshots and JSON files remain historical evidence for the prior version. Use the `account-*.json` audits and `accounts-*` screenshots for the current shared-role platform. The app has no active admin verification, event approval, anonymous application tracking or separate role-specific application shell.

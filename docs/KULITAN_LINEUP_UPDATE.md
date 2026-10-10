The Kulitan Youthfest update uses the supplied caption and eight original merchant-lineup images. The source files are in `client/public/event-gallery/kulitan-lineup`; their order and descriptions are recorded in `server/data/kulitan-lineup-update.json`.

Run `node server/scripts/import-kulitan-lineup.js` from the project root to add the update to the existing, published Kulitan Flea Market: Angeles City Youthfest event for October 9–12, 2026. The script reads the project's configured MongoDB and Cloudinary credentials from `server/.env`, uploads the images, and creates one published lineup post. It retains upload receipts locally to resume interrupted imports. Running it again leaves the existing update intact.

The import does not create or replace accounts, organizers, events, vendor profiles, or applications. The merchant names and photographs belong to the supplied organizer artwork; this update does not create vendor application records.

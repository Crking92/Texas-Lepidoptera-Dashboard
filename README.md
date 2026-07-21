# Texas Butterflies, Moths & Host Plants

A beginner-friendly, plant-first dashboard for exploring UDELep host relationships among Lepidoptera whose source range includes Texas.

## Public release

- Dashboard version: **1.0.0**
- Final review: **July 21, 2026**
- UDELep source snapshot used: **August 26, 2025**
- Scope: **statewide Texas range fields**, not county-, city-, ZIP-, park-, or property-level occurrence data

## Main features

- Plant-first search with featured Texas-native plant groups
- Reusable CC0/CC BY iNaturalist thumbnails and credited detail photos
- Beginner view with optional scientific filters and full source wording
- My Garden with locally saved plants and a deduplicated insect list
- Plant comparison tools
- Separate exploration of fungi, algae, lichens, detritus, bryophytes, and animal resources
- Responsive mobile cards, light/dark mode, CSV exports, keyboard navigation, and print support
- Installable PWA controls, native sharing where supported, and offline access to the embedded core records

## GitHub Pages deployment

Upload **all files and the `icons` folder from this folder** to the publishing root of the repository. `index.html` and `.nojekyll` must remain at the top level. Then choose **Settings → Pages → Deploy from a branch → main → /(root)**.

Do not upload only the ZIP file; GitHub does not extract it automatically.

## Data interpretation

A listed insect has a UDELep range field that includes Texas, or is retained separately as a stray/fugitive Texas record. A host relationship may have been documented elsewhere in the insect's range. The dashboard does not claim that every relationship occurs in Texas or at a particular property.

The source is a dated snapshot. University of Delaware may publish later UDELep revisions with different taxonomy, ranges, host records, and totals.

## Privacy and external services

My Garden, comparison choices, theme, and display settings are stored only in the visitor's browser. The service worker stores the app shell and embedded core records in the browser cache for offline use. There is no account system, analytics tracker, or location request. When photos or live checklist badges load, the browser contacts iNaturalist for the displayed taxon name.

## Credits and licensing

See `CREDITS_AND_LICENSES.txt`. The cleaned Texas derivative data are provided in `texas_lepidoptera_records.csv` for transparency and ODbL compliance.

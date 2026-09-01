# Texas Butterflies, Moths & Host Plants

A beginner-friendly, plant-first dashboard for exploring UDELep host relationships among Lepidoptera whose source range includes Texas.

## Public release

- Dashboard version: **1.3.0**
- Local-scan build review: **August 21, 2026**
- UDELep source snapshot used: **August 26, 2025**
- Scope: **statewide Texas UDELep range fields** plus a live iNaturalist site scanner with two deliberately separate layers: plant-based host potential and documented Lepidoptera occurrence. Neither layer is a complete site survey.

## Main features

- Prominent opening host-plant search with accessible autocomplete, common/scientific-name matching, alternate-name aliases, and typo tolerance, plus a clearly labeled link to the separate camera/photo plant-identification scanner; followed by a fully wrapping navigation panel with no horizontal scroller and then the matching plant-results panel
- Plant-first exploration with featured Texas-native plant groups
- Reusable CC0/CC BY iNaturalist thumbnails and credited detail photos, prioritized from Central Texas and then Texas
- Beginner view with optional scientific filters and full source wording
- My Garden with locally saved plants and a deduplicated insect list
- **Check your area** live iNaturalist scan with an interactive map: search a manual address/place, use device location, zoom/pan, draw a circle or polygon, search an iNaturalist named place, or enter coordinates
- **Plant-first host potential (v1.3.0):** scan iNaturalist plants in the selected area, deduplicate plant taxa and genera, match observed genera to the UDELep host-genus index, and union the unique Texas-range Lepidoptera taxa linked to those genera. This is potential support, not confirmed occurrence
- **Separate Lepidoptera occurrence layer:** independently report species actually submitted to iNaturalist inside the exact area and, for drawn shapes, within the optional nearby context buffer
- Plant scans can include both wild and cultivated/planted public observations (recommended for designed parks and yards) or be restricted to wild/verifiable plants
- The site-potential audit lists every scanned plant taxon once and every UDELep host genus used once, so viewers can see exactly what created the potential count
- Local inventory defaults are now **all years + verifiable observations (Research Grade + Needs ID)** to avoid making small areas look artificially empty; Research Grade-only remains available
- Named iNaturalist places are explicitly labeled as **exact boundaries** and can be switched to the selected **vicinity radius** around the place center when coordinates are available
- Local results now include a transparent, deduplicated audit view showing **every returned Lepidoptera row**, whether it matched UDELep, and **each unique host genus once**, with the scanned taxa that support that host connection
- Plant comparison tools
- Separate exploration of fungi, algae, lichens, detritus, bryophytes, and animal resources
- Responsive mobile cards, light/dark mode, CSV exports, keyboard navigation, and print support
- Installable PWA controls, native sharing where supported, and offline access to the embedded core records
- iOS home-screen standalone mode with black-translucent status bar metadata and the repository Apple touch icon

## Why a tiny park polygon can show only 2–3 Lepidoptera observations

The older local-scan builds asked a single occurrence question: “Which Lepidoptera have public iNaturalist records inside this exact shape?” For a small park, that number is driven heavily by observer effort and can remain very low even when the habitat contains many host plants. It is therefore not a fauna estimate.

Version 1.3.0 separates two questions:

1. **Host-supported potential:** Which plant taxa have been documented in the selected area, which of their genera occur in UDELep host records, and how many unique Texas-range Lepidoptera taxa are linked to those host genera?
2. **Occurrence evidence:** Which Lepidoptera have actually been submitted to iNaturalist in the exact selected area or nearby context?

If the iNaturalist plant scan itself contains far fewer plant taxa than a known municipal inventory, the potential layer will still be an underestimate. iNaturalist is an observation database, not the City’s authoritative planting/floristic inventory.

## GitHub Pages deployment

Upload **all files and the `icons` folder from this folder** to the publishing root of the repository. `index.html` and `.nojekyll` must remain at the top level. Then choose **Settings → Pages → Deploy from a branch → main → /(root)**.

Do not upload only the ZIP file; GitHub does not extract it automatically.

## Data interpretation

A listed insect has a UDELep range field that includes Texas, or is retained separately as a stray/fugitive Texas record. A host relationship may have been documented elsewhere in the insect's range. The dashboard does not claim that every relationship occurs in Texas or at a particular property.

The source is a dated snapshot. University of Delaware may publish later UDELep revisions with different taxonomy, ranges, host records, and totals.

## Privacy and external services

My Garden, comparison choices, theme, and display settings are stored only in the visitor's browser. The service worker stores the app shell and embedded core records in the browser cache for offline use. There is no account system or analytics tracker. The **Check your area** feature requests device location only after the visitor explicitly presses **Use my location**. A manual address/place lookup is sent to OpenStreetMap Nominatim only after the visitor presses **Find on map**; there is no address autocomplete. Address results, coordinates, and drawn shapes are kept only in page memory and are not written to local storage. Circle and coordinate scans send center/radius information to iNaturalist. Polygon scans request observations from the polygon bounding box and then filter returned coordinates inside the drawn polygon in the browser. Named-place scans send an iNaturalist place ID. No garden list is sent. The interactive basemap loads standard OpenStreetMap tiles when the local map is visible. When photos or live checklist badges load, the browser contacts iNaturalist for the displayed taxon name and fixed regional filters. Photo searches prioritize a Central Texas bounding box, then Texas, and use a labeled worldwide fallback only when regional open-license results are unavailable. The optional **Identify this plant** button opens `https://plant-host-scanner.pages.dev` in a new tab; that separate scanner handles any camera or uploaded-photo interaction under its own page behavior. This dashboard does not receive the visitor's photo.

## Credits and licensing

See `CREDITS_AND_LICENSES.txt`. The cleaned Texas derivative data are provided in `texas_lepidoptera_records.csv` for transparency and ODbL compliance.

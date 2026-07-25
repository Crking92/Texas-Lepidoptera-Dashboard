# Texas Butterflies, Moths & Host Plants

A plant-first dashboard for exploring UDELep host relationships among Lepidoptera whose source range includes Texas, with an optional county relevance layer based on Research Grade iNaturalist observations.

## Public release

- Dashboard version: **1.1.2**
- Final review: **July 24, 2026**
- UDELep source snapshot: **August 26, 2025**
- Statewide relationship layer: dated UDELep Texas range and host fields
- County occurrence layer: Research Grade iNaturalist species observations inside the selected standard county place
- Important limitation: county occurrence does not prove residency, breeding, abundance, current presence, or local use of a listed host plant

## Main features

- Searchable alphabetical selector covering all **254 Texas counties**
- No preferred county grouping
- Reliable county-place resolution using iNaturalist internal place IDs, including a verified Hays County fallback
- Compact optional county controls directly below the main plant search
- Two county views:
  - **UDELep totals + county observations (default):** keep statewide UDELep totals primary and show the county-observed subset separately
  - **County-observed insects only:** optionally narrow the insect list without changing the displayed UDELep potential total
- Accepted-name and listed-synonym crosswalking
- County selection adds separate observation-subset counts to plant summaries, search suggestions, My Garden, comparisons, recommendations, charts, and CSV exports
- County observation counts and a direct link to review source observations
- Thirty-day browser caching with a manual refresh control and stale-cache fallback when the network is unavailable
- Embedded statewide core data, responsive mobile cards, dark mode, printing, and installable PWA support

## GitHub Pages deployment

Upload **every file and folder in this release folder** to the publishing root of the repository. Keep these at the top level:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `.nojekyll`
- `favicon.svg`
- `texas_lepidoptera_records.csv`
- the `assets` and `icons` folders

Then choose **Settings → Pages → Deploy from a branch → main → /(root)**.

Do not upload only the ZIP file; GitHub does not extract it automatically.

## Data interpretation

A listed insect has a UDELep range field that includes Texas, or is retained separately as a stray/fugitive Texas record. A host relationship may have been documented elsewhere in the insect's range.

When a county is selected, the dashboard compares accepted iNaturalist scientific names with dashboard scientific names and listed synonyms. The overall UDELep Texas-range host total remains unchanged, while a second number reports the matched county-observed subset. Choosing the strict county-only display narrows the insect list, but does not redefine the UDELep host-potential total. This is geographic observation context, not a local interaction claim. A missing county match can reflect survey effort, difficult identification, taxonomy, obscured records, or an incomplete crosswalk; it must not be presented as proof of absence.

County occurrence, plant occurrence, and documented local host use remain three separate facts.

## Privacy and external services

The page never requests the visitor's physical location. My Garden, comparison choices, theme, display settings, and selected county are stored in the visitor's browser. First-time county retrieval and live photo retrieval contact iNaturalist. Loaded county snapshots are cached in browser Cache Storage for 30 days and can be manually refreshed.

## Method, credits, and licensing

- County method: `COUNTY_OCCURRENCE_METHOD.md`
- Interpretation and future upgrades: `COUNTY_FILTER_NOTES.md`
- Credits and licensing: `CREDITS_AND_LICENSES.txt`
- Cleaned derivative data: `texas_lepidoptera_records.csv`

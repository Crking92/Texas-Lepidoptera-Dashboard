# County quick-reference: Texas host totals alongside local observation evidence

The **Explore by county** dropdown below the plant search is a lightweight evidence overlay on the plant cards. It does not open the map, change the statewide UDELep count, or run a polygon scan.

**Each plant card shows:**
- **Texas-wide host taxa:** original established Texas-range UDELep butterfly/moth associations.
- **County observed:** distinct UDELep-linked butterfly/moth taxa also represented by Research Grade iNaturalist species records in the chosen county. These are **county occurrence records, not confirmed local feeding or breeding records**. A zero means no matched observations in the retrieved snapshot, not ecological absence.

Selection defaults to **All of Texas**. Current quick choices cover 26 Central Texas and adjoining western counties. Full county coverage can be added once those iNaturalist place IDs are validated. The separate **Check My Area** tool retains its interactive map, freehand polygon/circle drawing, named-place scans, and other spatial tools.

The app resolves the county iNaturalist place; Hays County uses existing place ID 326. It reads Research Grade species counts for Lepidoptera (taxon 47157), pages through the entire response, normalizes scientific binomials and listed synonyms, and cross-references those names with established/both UDELep records. It deduplicates by source record ID and counts per host genus using the original host associations. A failed or incomplete county scan produces an unavailable marker, not a fabricated zero. County matches are cached per county and UDELep source snapshot for up to 30 days. Loading a county can take time because all local moth and butterfly taxa are scanned, but multiple plants reuse the same county scan.

**Limitations:** iNaturalist has observer and identification bias. Rare, obscure, difficult-to-identify, or under-recorded moths may be absent from the Research Grade subset. Synonyms may not always resolve. An observed insect has not necessarily fed on any particular host in that county, and a genus may contain both native and introduced plant species. The Texas count remains a host-database relationship total, not a prediction of insect abundance or local ecological benefit.

## Regression check

`node tests/combined-smoke.cjs` covers selection of Hays County, side-by-side counts, preservation of the Texas total, resetting to statewide mode, and ensuring the map view is not opened by county selection. This test requires Playwright and Chromium; the existence of the test file is not proof it has run successfully.

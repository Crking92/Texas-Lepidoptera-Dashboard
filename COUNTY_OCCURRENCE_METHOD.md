# County quick-reference: Texas host totals alongside local observation evidence

The **Explore by county** dropdown below the plant search is a lightweight evidence overlay on the plant cards. It does not open the map, change the statewide UDELep count, or run a polygon scan.

**Each plant card shows:**
- **Texas-wide host taxa:** original established Texas-range UDELep butterfly/moth associations.
- **County observed:** distinct UDELep-linked butterfly/moth taxa also represented by verifiable iNaturalist (Research Grade + Needs ID) species records in the chosen county. These are **county occurrence records, not confirmed local feeding or breeding records**. A zero means no matched observations in the retrieved snapshot, not ecological absence.

Selection defaults to **All of Texas**. The county dropdown includes all **254 Texas counties**: 26 Central Texas and adjoining western counties appear first, followed by 228 other Texas counties. Counties outside the quick-choice group are resolved against iNaturalist when selected; a failed lookup is shown as unavailable, not zero. The separate **Check My Area** tool retains its interactive map, freehand polygon/circle drawing, named-place scans, and other spatial tools.

The app resolves the county iNaturalist place; Hays County uses existing place ID 326. It reads verifiable species counts (Research Grade + Needs ID, excluding Casual) for Lepidoptera (taxon 47157), pages through the entire response, normalizes scientific binomials and listed synonyms, and cross-references those names with established/both UDELep records. It deduplicates by source record ID and counts per host genus using the original host associations. A failed or incomplete county scan produces an unavailable marker, not a fabricated zero. County matches are cached per county and UDELep source snapshot for up to 30 days. Loading a county can take time because all local moth and butterfly taxa are scanned, but multiple plants reuse the same county scan.

**Limitations:** iNaturalist has observer and identification bias. Rare, obscure, difficult-to-identify, or under-recorded moths may be absent from the verifiable subset. Synonyms may not always resolve. An observed insect has not necessarily fed on any particular host in that county, and a genus may contain both native and introduced plant species. The Texas count remains a host-database relationship total, not a prediction of insect abundance or local ecological benefit.

## Broader county observation filter (November 19, 2026)

Both butterfly/moth and bee county overlays now query iNaturalist's `observations/species_counts` with `verifiable=true`, which includes **Research Grade and Needs ID** records and excludes **Casual** records. Species still must have a scientific binomial matching one of the published source-listed insects. County observations count **regardless of the plant or activity observed**, and are not proof of local feeding or pollen use. A Needs ID observation may be a single, unconfirmed species identification, so the county total is **provisional occurrence evidence**, not a fully verified county species inventory.

This is a policy change from the previous Research Grade-only filter. Both browser local-storage cache keys were changed (Lepidoptera v4-verifiable, bees v2-verifiable) so users don't see stale 30-day county counts after the update. This change does not incorporate the separately audited museum specimens from GBIF or the FWS Bee Tool.

## County specialist-bee observation overlay

The same **Explore by county** selection also displays a **county-observed bee subset** beneath the original Texas-listed Fowler pollen-specialist bee total for each plant genus. The Texas source relationships are unchanged. iNaturalist verifiable bee species counts (Research Grade + Needs ID, excluding Casual) are fetched for the selected county using Anthophila (iNaturalist taxon ID 630955), and scientific binomials are intersected with the species names in the unqualified genus-level Fowler index. Each bee species is counted once per plant genus. Source names that do not match iNaturalist's current taxonomy are not silently inferred as sightings.

County bee results are a **separate occurrence-evidence layer, not county pollen specialization records**. They do not demonstrate that a specific bee collected pollen on any linked genus in that county, that every species of that genus supports it, or that unobserved bees are absent. A genuine zero means no source-listed bees matched the retrieved verifiable county species list; missing source genus data remains a dash, and failed/incomplete scans display an unavailable marker instead of zero. Bee and Lepidoptera lookups and caches are separate; failure of one does not change the other. County results are cached locally for up to 30 days and require internet to refresh.

## Regression check

`node tests/combined-smoke.cjs` covers selection of Hays County, side-by-side counts, preservation of the Texas total, resetting to statewide mode, and ensuring the map view is not opened by county selection. This test requires Playwright and Chromium; the existence of the test file is not proof it has run successfully.

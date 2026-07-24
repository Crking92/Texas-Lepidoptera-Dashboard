# County occurrence filter methodology

## Purpose

The county selector narrows the statewide UDELep host-association dashboard to Lepidoptera that also have documented Research Grade iNaturalist observations in a selected Texas county.

All 254 Texas counties are presented alphabetically. No preferred-county or project-area grouping is applied.

## County lookup

- Hays County uses the verified iNaturalist place ID `326` as a direct fallback.
- Other counties are resolved by their iNaturalist place name and validated as Texas county-level places before the ID is used.
- Resolved place IDs are stored locally so the lookup does not need to be repeated every visit.

## Automated workflow

1. Resolve the selected county to its iNaturalist place ID.
2. Request Research Grade species counts under Lepidoptera (`taxon_id=47157`) for that place.
3. Retrieve the species list in pages of 200 records, with a one-second pause between additional pages.
4. Normalize each returned taxon's scientific binomial.
5. Match it to the dashboard scientific name or a listed synonym.
6. Build a set of matched dashboard record IDs.
7. Recalculate insect results, plant host totals, search suggestions, My Garden, comparisons, charts, recommendations, detail panels, other-resource records, and exports from that matched set.
8. Cache the county snapshot in the browser for 30 days. A manual refresh replaces it; if a refresh fails, an older cached copy may be used and is labeled as such.

## Evidence meaning

The filter answers:

> Has this dashboard taxon been documented by a Research Grade iNaturalist observation in the selected county?

It does not answer:

- whether the species is a permanent resident or breeds there;
- whether it is common, currently present, or evenly distributed;
- whether the caterpillar-host relationship was observed in that county;
- whether a taxon with no matched record is absent;
- whether every difficult moth identification is represented among Research Grade observations.

County occurrence, plant occurrence, and local plant use are separate facts. Public wording should keep them separate.

## Reproducibility

County totals are live when first requested or manually refreshed, so they can change as observations and identifications change. The interface displays the snapshot date and provides a direct link to review the selected county observation set.

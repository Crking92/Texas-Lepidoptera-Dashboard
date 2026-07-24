# Texas county occurrence filter

## What it does

The county selector combines two separate layers:

- the existing UDELep host-association records; and
- Research Grade iNaturalist observations used only as county occurrence evidence.

The selector contains all 254 Texas counties in a single alphabetical list. There is no preferred county group. Scientific names and listed synonyms are crosswalked to the selected county species list.

County context is applied throughout the dashboard, including plant browsing, open plant summaries, search suggestions, insect results, My Garden, comparisons, recommendations, other-resource records, details, charts, and exports.

## Display modes

- **Recorded in selected county only** filters the insect list and plant calculations to matched county records.
- **Show all Texas-range taxa with county labels** keeps the statewide insect list visible while marking county matches and nonmatches. Plant support totals remain based on the county-matched set so the ecological comparison does not revert to statewide counts.

## County place lookup

The dashboard uses iNaturalist's internal numeric place IDs. It first checks a locally cached ID, then searches the iNaturalist v1 place autocomplete endpoint using the county's actual place name, validates that the result is a Texas county, and finally tries the official Texas county index endpoint as a fallback. Hays County has a verified fallback place ID of 326.

## What it does not prove

- A county observation does not prove the insect used the selected plant in that county.
- A county observation does not by itself prove a resident or breeding population.
- No matched county record does not prove absence.
- Survey effort, identification difficulty, taxonomic changes, private or obscured observations, and name-crosswalk gaps can affect results.

## API endpoints used

- `GET /v1/places/autocomplete` to resolve a standard county place ID
- `GET /places.json` with Texas as the ancestor and County as the place type as a fallback
- `GET /v1/observations/species_counts` with Lepidoptera, Research Grade, verifiable, and species-rank filters

## Caching

County snapshots are stored separately from the PWA app-shell cache. Updating the dashboard removes only obsolete app-shell caches and preserves county snapshots. The dashboard reuses a fresh snapshot for 30 days, offers a manual refresh button, and can label an older cached copy when the live service is unavailable.

## Recommended future upgrade

Generate versioned static county JSON snapshots during releases and supplement the occurrence layer with carefully deduplicated BAMONA and GBIF/specimen records. Static files would make every county immediately available offline and create a fixed audit date while preserving live source-review links.

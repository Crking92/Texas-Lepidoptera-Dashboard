# Hays County specialist bee occurrence audit — November 18, 2026

> **Policy update, November 19, 2026:** The live county bee and Lepidoptera overlays now include iNaturalist Research Grade **and Needs ID** observations (`verifiable=true`, excluding Casual). The 4-Research-Grade figure below is retained as the historical strict-filter baseline; the 5-verifiable observation result is the comparison reported by this audit. Museum evidence is still separate and has not been folded into the live badge. This document records the original audit, not the current filter setting.


## Scientific question

For each bee species listed by Jarrod Fowler as associated with a plant genus, **has that same bee species been documented anywhere in Hays County, Texas?** Its activity and the plant on which it was seen are irrelevant. A sighting or labeled museum specimen is evidence of geographic occurrence, **not** confirmation of pollen collection on the source-linked plant.

## Helianthus worked example

- **Texas-listed source relationships:** 72 distinct bee species associated with `Helianthus` in the Fowler compilation (2026-10-07 dashboard snapshot).
- **iNaturalist Research Grade, Hays place 326:** 4 exact, normalized species matches: `Diadasia enavata`, `Megachile fortis`, `Megachile inimica`, `Megachile parallela`.
- **iNaturalist verifiable (Research Grade + Needs ID):** 5 matches, adding `Dianthidium curvatum`; its additional evidence is **not** Research Grade.
- **Additional GBIF preserved specimens with explicit Hays County, Texas labels and coordinates inside the broad Hays-area audit rectangle:** 3 more distinct source-listed bee species, detailed below.
- **Combined provisional documented species:** **7** (4 Research Grade iNaturalist + 3 different museum-backed species). **8** if the Needs ID `Dianthidium curvatum` evidence is also included as a clearly separate, lower-confidence layer. These figures are not current abundance, proof of current persistence, or a complete Hays fauna list.

## GBIF Hays County voucher records requiring record-level QA before publication

| Fowler source name | Current iNaturalist accepted name (2026-11-18 autocomplete) | Collection / date | GBIF record |
|---|---|---|---|
| *Pseudopanurgus aethiops* | *Protandrena aethiops* | UTIC, 1989-09-30, catalog 290701 | https://www.gbif.org/occurrence/3750967447 |
| *Pseudopanurgus albitarsis* | *Protandrena albitarsis* | University of Kansas Snow Entomological Museum, 1953-04-16, catalog 404114 | https://www.gbif.org/occurrence/657720237 |
| *Svastra petulca* | *Epimelissodes petulcus* | UTIC, 2006-05-03, catalog 299999 | https://www.gbif.org/occurrence/3864672422 |
| *Svastra petulca* (second voucher, same species) | *Epimelissodes petulcus* | UTIC, 2006-05-03, catalog 299998 | https://www.gbif.org/occurrence/3864672443 |

These GBIF records have `basisOfRecord=PRESERVED_SPECIMEN`, `countryCode=US`, `stateProvince=Texas`, and `county=Hays` or `Hays County`. No automatic adoption into the dashboard count has occurred. Validate any nomenclatural changes, identification uncertainties, GBIF occurrence issues, and locality accuracy before promotion.

## Name reconciliation results

iNaturalist autocomplete returned 11 candidate renamed taxa among the 72 Fowler sunflower bees. None of the 11 accepted names matched the current iNaturalist Research Grade Hays species list. Examples: `Pseudopanurgus aethiops` → `Protandrena aethiops`; `Pseudopanurgus albitarsis` → `Protandrena albitarsis`; `Svastra petulca` → `Epimelissodes petulcus`. Treat these as taxon-concept links requiring review, never as additional species.

## Scope and method limitations

- iNaturalist queries used `/v1/observations/species_counts` with `place_id=326`, `taxon_id=630955` (Anthophila) and Research Grade vs. `verifiable=true`. Species names were compared as normalized scientific binomials.
- The GBIF `/occurrence/search` endpoint did **not** limit results when passed a textual county parameter. The completed supplemental audit instead applied a broad geographic rectangle (longitude −98.65 to −97.55, latitude 29.60 to 30.50), verified the **individual record's** Hays County/Texas/US fields, and retained preserved specimens. That approach may miss records without geocoordinates; it is not a complete all-Hays specimen inventory.
- The museum sources were checked only against the 72 sunflower-linked bee names for this audit, **not** against every genus in the dashboard.
- Historical collection records establish historical occurrence, not necessarily current residency. iNaturalist Research Grade and Needs ID are separate confidence classes.
- iNaturalist records syndicated into GBIF must not be counted twice. Keep source-record provenance with any eventual combined species-level tally.
- Missing records cannot be interpreted as absence.
- The live **county bee badge currently counts Research Grade iNaturalist matches only**, so its `4` remains accurate for that narrow definition. It has **not** been changed to `7`.

## Reproducible audit logs

- Original Research Grade / verifiable iNaturalist verification: https://github.com/Crking92/Texas-Lepidoptera-Dashboard/actions/runs/44396809261
- Expanded synonym / GBIF voucher audit: https://github.com/Crking92/Texas-Lepidoptera-Dashboard/actions/runs/44431698067
- Audit source: `tests/bee-county-audit.cjs` and `tests/bee-county-expanded-audit.cjs`

## Next steps

1. Review the voucher determinations, coordinates and GBIF data-quality flags; preserve the evidence links and source-identification names.
2. Produce a reviewed genus-agnostic bee-name crosswalk so the same species is counted once across older and accepted names.
3. Assess a county-wide or statewide voucher data pipeline with consistent coverage; the U.S. Fish & Wildlife Service's North American Bee Distribution Tool (https://www.fws.gov/beetool) is a valuable cross-check based on GBIF and additional bee datasets.
4. If added to the public UI, display separately labeled **iNaturalist Research Grade**, **museum-documented** and optional **Needs ID** evidence so the selected county number is not silently redefined.

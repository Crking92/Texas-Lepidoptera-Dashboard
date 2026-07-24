# County occurrence filter

Version 1.1.0 adds a searchable list of all 254 Texas counties. When a county is selected, the dashboard requests research-grade Lepidoptera species counts from iNaturalist and matches accepted scientific names and listed synonyms against the embedded UDELep-derived Texas dashboard records.

## Public interpretation

- **Recorded in county** means a dashboard taxon matched at least one research-grade iNaturalist observation assigned to the selected county.
- It does **not** prove a breeding population, local larval host use, or absence when no record is returned.
- Host relationships remain literature-derived and may have been documented outside the selected county or outside Texas.
- Observation effort, identification difficulty, taxonomy changes, and data quality vary among counties and taxa.

County responses are cached locally for 30 days, with up to six recent county snapshots retained for offline reuse. The statewide embedded dashboard remains available offline.

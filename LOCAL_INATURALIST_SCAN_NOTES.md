# Check your area — local iNaturalist scan

Expanded in dashboard version 1.2.2 (August 20, 2026).

## Purpose

The statewide UDELep records answer: **Which Lepidoptera whose source range includes Texas have published host relationships?**

The local layer asks a different question: **Which Lepidoptera have people actually reported inside or near a selected area on iNaturalist?**

The dashboard joins those two evidence layers by scientific name and UDELep synonym strings. The join does not claim that a published host interaction happened at the scanned location.

## Location and map modes

1. **Manual address/place search** — a deliberate one-shot lookup sent to OpenStreetMap Nominatim after the visitor presses **Find on map**. There is no autocomplete. Selecting a result centers the map and creates a point/radius scan location.
2. **Use my location** — the browser requests geolocation permission only after a button press and centers the map on that point.
3. **Draw a circle** — the visitor zooms/pans the map and draws a circle. The circle center and drawn radius are sent directly to iNaturalist.
4. **Draw a polygon** — the visitor draws a custom polygon. iNaturalist is queried using the polygon bounding box; returned observations are filtered to points inside the polygon in the browser.
5. **iNaturalist named place** — the scan sends the selected iNaturalist place ID and is explicitly treated as the exact iNaturalist boundary. When the place result provides a center point, the interface offers a one-click switch to the selected vicinity radius around that center.
6. **Manual coordinates** — latitude/longitude plus the selected 1, 3, 10, 25, or 50 km radius.

The map is rendered with Leaflet 1.9.4 and Leaflet.draw 1.0.4 using standard OpenStreetMap tiles.

## Observation filters

- Last 12 months, last 5 years, or all years
- Research grade only
- Research grade + Needs ID (verifiable; **default for inventory scans**)
- All public observations

The default time window is now **all years**. This makes the local tool answer “what has been documented here?” more reliably. Visitors can still narrow to 1 or 5 years for recent activity.

Circle, point/radius, and named-place scans use iNaturalist's public `GET /v1/observations/species_counts` endpoint under Order Lepidoptera. Version 1.2.2 uses the species high-rank rollup (`hrank=species`) rather than the exact `rank=species` filter, pages through up to 2,000 returned species rows, and rolls iNaturalist observation counts into the scan inventory. The current iNaturalist Lepidoptera taxon is resolved dynamically with a confirmed fallback ID of 47157.

Polygon scans use `GET /v1/observations` with the polygon bounding box and georeferenced observations. The browser performs a point-in-polygon test and aggregates the observations to species-like bins for matching against the embedded dashboard. To avoid excessive API requests and poor browser performance, one polygon scan inspects at most the newest 2,000 candidate observations from its bounding box. The interface warns when that limit is reached and recommends drawing a smaller polygon.

## Results

The local panel reports:

- iNaturalist species returned by the scan
- species matched to the embedded Texas UDELep dashboard
- matched butterflies + skippers
- matched local taxa with at least one saved My Garden host genus
- top host genera connected to locally observed matched taxa
- per-species iNaturalist observation counts
- parsed UDELep host genera
- My Garden overlap
- direct links to the corresponding iNaturalist geographic search
- locally observed taxa that did not match the dashboard
- a deduplicated scan audit listing every returned Lepidoptera row with observation count and match status
- a deduplicated host-genus inventory where each host genus appears once and can be expanded to show the scanned Lepidoptera that support that relationship

## Privacy

The feature has no background location tracking. Addresses, coordinates, and drawn shapes are kept only in page memory and are not written to local storage. Address lookup text is sent to OpenStreetMap Nominatim only after a deliberate search. Standard map tiles are requested from OpenStreetMap as the visitor pans and zooms. Geographic scan parameters are sent directly from the browser to iNaturalist. My Garden is not sent.

Do not enter confidential or sensitive addresses into a public geocoding service.

## Interpretation limits

A nearby iNaturalist record is evidence that the organism was reported in the selected area. It is not proof that the species occurs on the exact property. Failure to return a species is not proof of absence. iNaturalist sampling intensity varies among places, seasons, observers, and taxonomic groups.

Some iNaturalist locations are intentionally obscured for privacy or conservation. Polygon-edge inclusion can therefore be approximate for those records.

A UDELep host relationship is literature evidence from somewhere in the compiled range. Matching a locally observed insect to a host genus does not prove that the interaction occurred locally.

## Deployment

The feature is client-side and requires no private server or API key. Deploy the package to GitHub Pages as before. Device geolocation requires a secure context such as HTTPS. The live map, geocoder, and iNaturalist scan require internet access; the embedded UDELep records still work offline.


## Exact-shape versus nearby-context behavior (v1.2.2)

A very small polygon can legitimately return only a handful of iNaturalist records because iNaturalist represents submitted observations, not a complete biological survey. Version 1.2.2 therefore keeps two zones separate:

- **Exact shape:** polygon mode requests candidate observations from the polygon bounding box, then performs the point-in-polygon test against public coordinates in the browser. Only these records feed the exact-shape species and host-plant inventory. Counted polygon observations are plotted as map points for auditability.
- **Nearby context:** when enabled, the browser runs a separate species-count request in a circle large enough to cover the drawn shape plus the selected buffer. This is a nearby documented species pool, not evidence that every species occurred inside the selected park or yard.

The host-plant lists remain deduplicated by scientific host genus. Exact-shape host evidence and nearby-context host evidence are presented separately so the geographic evidence is not mixed.


## Plant-first host-potential redesign (v1.3.0)

The repeated 2–3-species result in small park polygons was not a defensible proxy for biological richness. The exact polygon count was only the number of qualifying Lepidoptera observations submitted to iNaturalist with public coordinates inside that small geometry.

Version 1.3.0 adds a separate plant-first workflow:

1. Request Plantae (`taxon_id=47126`) for the selected geography.
2. For polygons, request the bounding box and perform point-in-polygon filtering in the browser.
3. Deduplicate returned plant taxa and derive scientific genera.
4. Intersect those genera with the embedded UDELep host-genus index.
5. Union (deduplicate) Texas-range UDELep Lepidoptera records associated with those matched plant genera.
6. Present that union as **host-supported potential**, not confirmed occurrence.
7. Run the Lepidoptera iNaturalist query independently and label it **documented occurrence evidence**.

For managed parks and yards, the plant scan defaults to `quality_grade=any&verifiable=any&captive=any` so deliberately planted/cultivated host plants are not automatically discarded. Users can switch to wild/verifiable plants only.

The audit interface lists scanned plant taxa once, matched host genera once, and the unique UDELep Lepidoptera union. If the plant scan is much smaller than a known park inventory, the limiting factor is iNaturalist plant sampling; the dashboard does not infer unobserved plants.

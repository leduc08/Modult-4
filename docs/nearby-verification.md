# Nearby pre-fetch verification

Date: 2026-09-22

Continues `implementation_plan.md` and `task.md` from Antigravity task
`78dbca92-246f-4fea-a8dc-5694e2a98460`.

## Completed tasks

- [x] Fetch real data for Da Nang and validate the generated JSON.
- [x] Run the development server and verify NearbyPage.
- [x] Verify desktop (1440x1000) and mobile (390x844) screenshots.
- [x] Verify category, radius, search, city switching, load more, and map recentering.
- [x] Verify automatic sample fallback for a city without a JSON file.
- [x] Verify that an existing empty JSON displays the empty-data state.
- [x] Verify that detail views preserve unknown rating and price values.
- [x] Verify that placeholder photos remain labelled in list, map, and detail views.
- [x] Observe zero Places/Overpass API requests during the static-data workflow.
- [x] Check merge conflicts with automated regression tests.
- [x] Run TypeScript checking and production build.

## Data snapshot before the 2026-09-24 quality filter

The current Da Nang file contains 1199 places after the filter described in
`nearby-hanoi-hcm-verification.md` removed 1778 businesses without an address,
phone, or website. The figures below document the original fetch.

`frontend/src/data/places/da-nang.json` contains:

| Metric | Count |
| --- | ---: |
| Foursquare input | 95 |
| OSM input | 2889 |
| Output places | 2977 |
| Foursquare only | 88 |
| OSM only | 2882 |
| Merged | 7 |
| Records requiring review | 34 |

Review counts refer to records, not conflict pairs. Conflicting source records
are retained separately. Name candidates beyond 1 km are treated as different
branches; within that range, differences above 100 m are flagged. Matches from
50 to 100 m remain separate. At the time of this snapshot, the remaining nine
city files had not been fetched. All ten configured cities now have JSON files;
see `nearby-ten-cities-verification.md` for the current state.

## Corrections made during verification

- Use `fsq_category_ids` and current Foursquare category IDs in the CLI.
- Preserve existing JSON and return a nonzero exit status when a source fails,
  times out, or Overpass reports incomplete results.
- Keep missing rating, review count, price, and opening status unknown.
- Filter loaded city data when the center or filters change.
- Keep the static source selected during per-city fallback, so returning to a
  downloaded city restores its JSON automatically.
- Render list results in batches of 50. Use Leaflet canvas dots for dense maps;
  the selected place retains a named marker.
- Fix mobile map sizing and avoid animated map flights while its container is hidden.
- Remove a nonexistent wishlist-service import and repair the root TypeScript
  configuration so `npm run lint` checks source files directly, including scripts.

## Source attribution

The CLI uses **Foursquare Places API**, not a downloaded Open Source Places
release. Its output therefore identifies that actual source without asserting
an Apache 2.0 license for API responses. An OSP-release import would need separate
provenance and the release's license/notice files.

- [Foursquare Place Search API](https://docs.foursquare.com/fsq-developers-places/reference/place-search)
- [Foursquare Open Source Places access](https://docs.foursquare.com/data-products/docs/access-fsq-os-places)
- [OpenStreetMap attribution and ODbL information](https://www.openstreetmap.org/copyright)

## Reproduction

```sh
npm run fetch-places -- da-nang
node --test scripts/mergeEngine.test.ts
npm run lint
npm run build
npm run dev
```

The fetcher accepts `FOURSQUARE_API_KEY` or the existing
`VITE_FOURSQUARE_API_KEY`. Without either key, it fetches OSM only.

Local Playwright verification is in `tools/inspect-nearby.mjs`. It uses an
installed Chrome browser and a temporary `playwright-core` installation; neither
the package manifest nor lockfile was changed for this test dependency. The
existing repository ignores `tools/`.

Screenshots: `tools/nearby-desktop.png`, `tools/nearby-mobile-map.png`, and
`tools/nearby-mobile-list.png`.

The production build reports a bundle-size warning, including the dynamically
loaded city dataset. This does not prevent building or loading the application.

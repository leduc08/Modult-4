# Nearby data for all ten configured destinations

Date: 2026-09-24

The seven remaining city files were fetched from Foursquare Places API and
OpenStreetMap Overpass. The existing quality rule removes food, cafe, and
shopping records that lack an address, phone, and website, plus names that
explicitly say the place is closed. The fetcher also excludes OSM records
explicitly tagged inactive or vacant. This rule improves the small project's
dataset but does not establish whether every retained business is open.

| City | Places after filtering | Foursquare input | OSM input | Needs review |
| --- | ---: | ---: | ---: | ---: |
| Da Nang | 1199 | 95 | 2889 | 27 |
| Ha Noi | 4763 | 91 | 7383 | 41 |
| Ho Chi Minh City | 4478 | 95 | 7557 | 30 |
| Hoi An | 751 | 95 | 1458 | 33 |
| Da Lat | 542 | 92 | 1100 | 8 |
| Sa Pa | 207 | 82 | 365 | 19 |
| Phu Quoc | 158 | 81 | 382 | 7 |
| Hue | 608 | 96 | 973 | 30 |
| Ninh Binh | 252 | 83 | 447 | 6 |
| Nha Trang | 508 | 88 | 1056 | 18 |
| **Total** | **13466** | | | |

All ten JSON files have unique place IDs, names, finite coordinates, and
consistent merge statistics. Each file includes data from both sources and
contains no food, cafe, or shopping record missing all three identifying
details. The fetcher searches within 10 km of each configured destination
center; these files do not cover entire administrative regions or islands.

The primary Overpass server intermittently returned HTTP 504. The fetcher now
tries a [second public Overpass instance](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)
and can split a failed area into smaller requests. A city JSON file is written
only after both Foursquare and OSM succeed.

Validation: `npm run lint`, the eight merge and quality tests, and `npm run
build` passed. A mobile browser check switched through all ten city choices,
loaded each city's list and Leaflet map, and observed no runtime Places or
Overpass requests or page errors. Phu Quoc initially showed ten cards within
the default 5 km list filter; the city file contains 158 places across the
10 km fetched area.

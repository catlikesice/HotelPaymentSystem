# Hotel search SQL

`GET /api/search` reads this schema (`routes/search.js`, `lib/search-db.js`). The results page uses that response. If the API cannot be reached, `assets/search.js` falls back to `window.SEARCH_CATALOG`. The homepage datalist uses `GET /api/search/destinations` the same way.

The statements live in [`hotel-search.sql`](hotel-search.sql). Dialect is SQLite 3. `instr()` is the substring test; on PostgreSQL use `strpos(haystack, needle) > 0` in its place. `lib/search-db.js` loads that file, the same way `lib/city-pages.js` loads `city-pages.sql`.

The static catalog is 73 cities and 202 hotels. `lib/places-without-pages.js` adds Nida, Barentsburg, Pyramiden, and further towns in Scotland, Lithuania, Finland, Sweden, the Faroe Islands, Svalbard, and the Åland Islands. Those places have no city HTML file. Every hotel has its own HTML page, with the shared navbar mounted at the top. The SQL file contains every catalog row and then those pageless places (103 cities, 232 hotels), so `sqlite3` can search the same list the API returns. `lib/search-sql.js` rebuilds the file from those two sources.

Šiauliai, the Odense hotels, and Hotel d’Angleterre are in the static catalog rather than the pageless list. The Šiauliai city listing is `šiauliai.htm`. The Odense city listing is `odense.html`. Hotel d’Angleterre uses `hotel-dangleterre-copenhagen.html`. Bauska, Latvia is bookable from `bauska.html`. Hotel Bauska (`hotel-bauska.html`) and Bauska Castle Hotel (`bauska-castle-hotel.html`) continue to checkout. The same listing documents are stored in `city-pages.sql`.

Abisko, Lillehammer, Portree, Oban, Fort William, Stornoway, and Lerwick are catalog cities. Their listing files are `abisko.html`, `lillehammer.html`, `portree.html`, `oban.html`, `fort-william.html`, `stornoway.html`, and `lerwick.html`, and the same documents are stored in `city-pages.sql`.

Keflavík, Ísafjörður, Vestmannaeyjar, and Sauðárkrókur are catalog cities. Their listing files are `keflavík.html`, `ísafjörður.html`, `vestmannaeyjar.html`, and `sauðárkrókur.html`, and the same documents are stored in `city-pages.sql`.

Ullapool, St Andrews, Aviemore, and Pitlochry are catalog cities. Their listing files are `ullapool.html`, `st-andrews.html`, `aviemore.html`, and `pitlochry.html`, and the same documents are stored in `city-pages.sql`.

Loch Lomond National Park is a catalog destination. Its listing file is `loch-lomond.html`, and the same document is stored in `city-pages.sql`.

## What a search is

Two different lookups share the catalog:

| Surface | Input | Match |
| --- | --- | --- |
| Results page (`search.html`, `GET /api/search?q=`) | Free text | Every whitespace-separated token is a substring of the city or hotel haystack |
| Homepage bar (`index.html`) | One destination | First city or hotel in catalog order, using the priority list below |

`checkIn`, `checkOut`, `adults`, and `children` travel with both forms. They are stay details for pricing and booking. They do not filter these queries.

A blank `q` returns no rows. `search.js` treats an empty query as `{ "cities": [], "hotels": [] }` and does not scan the catalog.

## Tables

`cities` is one row per destination. A destination does not need an HTML file.

| Column | Catalog field | Notes |
| --- | --- | --- |
| `name` | `name` and `city` | Same string on a city row |
| `country` | `country` | Denmark, Estonia, Finland, Iceland, Latvia, Lithuania, Norway, Scotland, Sweden, Northeast England, Åland Islands, Greenland, Faroe Islands, Svalbard |
| `page_url` | `url` | Includes `.html`, for example `aarhus.html`. That document is a file in the repository root, and the same document is stored in `city-pages.sql`. NULL when the place has no city page |
| `description` | `description` | |
| `sort_order` | array order | `Array.filter` keeps catalog order; `ORDER BY sort_order` does the same |
| `name_key` | | Homepage compare key. See normalization |
| `search_text` | | Results haystack |

`hotels` is one row per hotel card. `city_id` references `cities`. `page_url` is that hotel's HTML page, for example `grand-hotel-kempinski-riga.html` or `cabinn-city.html`. It is separate from the city's `page_url`. `(city_id, name)` is unique.

| Column | Catalog field | Notes |
| --- | --- | --- |
| `name` | `name` | |
| `page_url` | `url` | The hotel's HTML page. The JSON also includes `cityUrl`, the city's `page_url`, which is NULL when that place has no city page |
| `image_url` | `image` | Null when the card has no photo |
| `price_label` | `price` | Exact display string, such as `0.08 ETH / night` or `0.10 ETH / night` |
| `price_eth` | `priceEth` | Nightly ETH number. Stored for the JSON field. Search does not filter on it |
| `description` | `description` | |
| `name_key` | | Normalized hotel name |
| `label_key` | | Normalized `name + " — " + city` (em dash, U+2014) |
| `search_text` | | Results haystack |

City listing pages also show BTC and USDT amounts, hotel chains, booking links, and translated placeholder copy. Those facts are columns in [`city-pages.sql`](city-pages.sql) (`city_page_hotels`, `city_page_strings`). They are not columns in this search schema. The city HTML files are in the repository at `page_url`. `lib/city-pages.js` loads `city-pages.sql`, and the server answers `page_url` from the HTML file.

## Normalization

SQLite has no `unaccent`, and `lower()` only folds `A`–`Z`. `fold_map` is one row per character that folding changes. A query walks that table with `replace()`, so a raw string can be searched without a JavaScript normalizer. The stored `search_text`, `name_key`, and `label_key` columns are the same fold, kept so each search does not walk the map once per row.

Letters Unicode does not decompose are mapped on purpose: `ø`→`o`, `æ`→`ae`, `ð`→`d`, `þ`→`th`. Apostrophes (`'`, `’`, `ʼ`) are removed. `hafnarfjordur` matches Hafnarfjörður, `reykjanesbaer` matches Reykjanesbær, and `d'Angleterre` matches Hotel d’Angleterre.

The browser fallback (`assets/search.js`) uses the same character rules:

```js
function normalizeResults(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/['’ʼ]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function searchText(item) {
  return normalizeResults([
    item.name,
    item.city,
    item.country,
    item.description,
    item.price,
    item.type
  ].join(' '));
}
```

`Array.join` turns a missing `price` into an empty string, so a city haystack has two spaces before the word `city`. Hotel haystacks include the price label and the word `hotel`. Matching is a substring test, the same as `indexOf`, not a whole word. The token `hotel` matches the city description `Browse hotels`, and the token `rig` matches `Riga`.

Homepage keys (`assets/hero-search.js`) use the same folding, then collapse whitespace and trim:

```js
function normalizeHero(text) {
  return normalizeResults(text).replace(/\s+/g, ' ').trim();
}
```

Examples:

| Source | Key |
| --- | --- |
| `Reykjavík` | `reykjavik` |
| `Tromsø` | `tromso` |
| `Hafnarfjörður` | `hafnarfjordur` |
| `Reykjanesbær` | `reykjanesbaer` |
| `Hotel Føroyar` | `hotel foroyar` |
| `Hotel d’Angleterre` | `hotel dangleterre` |
| `Grand Hotel Kempinski — Riga` | `grand hotel kempinski — riga` |

## Results query

`GET /api/search?q=royal%20aarhus`

1. Trim `q`. If it is empty, respond `{ "cities": [], "hotels": [] }` and stop.
2. Fold `q` with `fold_map`, treat `—` and `–` as spaces, and split on whitespace. Drop empty tokens. The em dash is the separator in a homepage label such as `Hotel Nida Marina — Nida`. The SQL file does this in `raw_query_tokens`. The route uses the same map through `foldText` and binds the tokens. Do not paste the typed text into the statement.
3. Run the city `SELECT` and the hotel `SELECT`. A row matches when every token is found with `instr(search_text, token) > 0`.
4. Return both lists in `sort_order`.

`instr` treats `%` and `_` as ordinary characters. `LIKE` would not.

An empty `query_tokens` table makes the count comparison true for every row. That is why a blank query must return before the statement runs.

Response shape, one object per row, same keys the cards already read:

```json
{
  "cities": [
    {
      "type": "city",
      "name": "Aarhus",
      "city": "Aarhus",
      "country": "Denmark",
      "url": "aarhus.html",
      "description": "Browse hotels in Aarhus, Denmark."
    }
  ],
  "hotels": [
    {
      "type": "hotel",
      "name": "Hotel Royal Aarhus",
      "city": "Aarhus",
      "country": "Denmark",
      "url": "aarhus.html",
      "cityUrl": "aarhus.html",
      "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80",
      "price": "0.08 ETH / night",
      "priceEth": 0.08,
      "description": "Luxury hotel in the heart of Aarhus, featuring elegant rooms, gourmet restaurant, and spa services."
    }
  ]
}
```

`search.html` reads `name`, `city`, `country`, `description`, `url`, and for hotels also `image`, `price`, and `cityUrl`. A null `url` still renders the card.

The worked example folds the typed text `Royal Aarhus`. Both tokens have to match, so the city query returns nothing and the hotel query returns Hotel Royal Aarhus. A single token `aarhus` returns the Aarhus city row plus Comwell Aarhus, Hotel Royal Aarhus, and Scandic Aarhus City.

Other checks against the full catalog:

| `q` | Cities | Hotels |
| --- | --- | --- |
| `reykjavik` | Reykjavík | Hótel Hafnarfjörður, Hotel Vellir, Canopy by Hilton Reykjavik City Centre, Center Hotels Plaza, Hotel Borg |
| `hafnarfjordur` | Hafnarfjörður | Helguhús Guesthouse, Hótel Hafnarfjörður, Hotel Viking |
| `reykjanesbaer` | Reykjanesbær | Airport Hotel Aurora Star, Hotel Keflavik, Hotel Keilir |
| `d'Angleterre` | none | Hotel d’Angleterre |
| `kempinski` | none | Grand Hotel Kempinski |
| `torshavn` | Tórshavn | Hotel Føroyar, Hotel Hafnia, Hotel Streym, Nólsoy Harbour House, Streymoy Valley Inn |
| `0.10` | none | Kimpton Blythswood Square, Arctic Light Hotel, Hotel Føroyar, Clarion Hotel The Edge, Radisson Blu Marina Palace |
| `nida` | Nida (`url` null) | Hotel Nida Marina (`url` and `cityUrl` null) |
| *(empty)* | none | none |

Hótel Hafnarfjörður is in the `reykjavik` hotel list because its description mentions the Reykjavík bus routes. Nólsoy Harbour House and Streymoy Valley Inn match `torshavn` the same way. The script itself prints the `Royal Aarhus`, `Nida`, and `Reykjavík` examples, not every row in this table.

## Places without an HTML page

A row is searchable when `page_url` is NULL. Search does not check that a file exists on disk.

Hotels that only appear on a city page are the other case. They have a `page_url`, and it is the city file (`copenhagen.html` for CABINN City), not a page of their own. Those rows are already in the static catalog and stay in the SQL results.

`lib/places-without-pages.js` adds destinations that have no file at all:

| Place | Country | Hotel |
| --- | --- | --- |
| Nida | Lithuania | Hotel Nida Marina |
| Palanga | Lithuania | Palanga Dune Hotel |
| Druskininkai | Lithuania | Druskininkai Spa House |
| Trakai | Lithuania | Trakai Lake House |
| Barentsburg | Svalbard | Barentsburg Guesthouse |
| Pyramiden | Svalbard | Pyramiden Harbour House |
| Porvoo | Finland | Porvoo Old Town Hotel |
| Kuopio | Finland | Kuopio Lakefront Hotel |
| Savonlinna | Finland | Savonlinna Castle Hotel |
| Jukkasjärvi | Sweden | Icehotel Jukkasjärvi |
| Gjógv | Faroe Islands | Gjógv Guesthouse |
| Saksun | Faroe Islands | Saksun Turf House |
| Mykines | Faroe Islands | Mykines Puffin Lodge |
| Nólsoy | Faroe Islands | Nólsoy Harbour House |
| Vágar | Faroe Islands | Vágar Cliff Hotel |
| Streymoy | Faroe Islands | Streymoy Valley Inn |
| Eysturoy | Faroe Islands | Eysturoy Sound Hotel |
| Ny-Ålesund | Svalbard | Ny-Ålesund Polar Lodge |
| Kastelholm | Åland Islands | Kastelholm Castle Inn |
| Bomarsund | Åland Islands | Bomarsund Fortress House |
| Isle of Skye | Scotland | Skye Cuillin Hotel |
| Kirkwall | Scotland | Kirkwall Harbour Hotel |
| Tobermory | Scotland | Tobermory Waterfront Hotel |
| Uist | Scotland | Uist Machair House |
| Tarbert (Harris) | Scotland | Tarbert Harris Hotel |
| Uig | Scotland | Uig Bay Hotel |
| Dunvegan | Scotland | Dunvegan Castle Hotel |
| Broadford | Scotland | Broadford Bay Hotel |
| Armadale | Scotland | Armadale Pier Hotel |
| Lochmaddy | Scotland | Lochmaddy Harbour Hotel |

The results card still renders. When `url` is null and the hotel's `cityUrl` is also null, the card says the place has no separate page. When the hotel has no page but the city does, the card links to `cityUrl`.

The homepage opens a page only when the matched catalog row has a `url`. A place with no page is submitted to `search.html?q=...`, which loads it from `GET /api/search`. `GET /api/search/destinations` adds those names to the homepage datalist.

## Homepage destination query

The homepage does not list every match. It picks one destination and opens that page.

Fold the typed destination with `fold_map`, then collapse whitespace and trim (`folded_key` in the SQL file, `normalizeHero` in the browser). If the result is empty, do not query.

Then take the first row of the union in `hotel-search.sql`, ordered by priority and `sort_order`:

1. `cities.name_key` equals the needle.
2. `hotels.name_key` or `hotels.label_key` equals the needle. The label is what the homepage datalist shows: `Grand Hotel Kempinski — Riga`.
3. The city key starts with the needle, or the needle starts with the city key.
4. The hotel key contains the needle.

The statement at the bottom of `hotel-search.sql` folds the typed needle `Reykjavík` and returns the Reykjavík city row. `kempinski` returns Grand Hotel Kempinski. `tromso` returns the Tromsø city row (priority 1) rather than Clarion Hotel The Edge. `nida` returns the Nida city row with a null `page_url`. The homepage should not navigate when that value is null.

## Stay fields

The homepage and the results form also send:

| Parameter | Rule in the page scripts | SQL |
| --- | --- | --- |
| `checkIn`, `checkOut` | `YYYY-MM-DD`. Nights count only when check-out is after check-in | Not used |
| `adults` | Integer from 1 to 20, default 2 | Not used |
| `children` | Integer from 0 to 10, default 0 | Not used |

Keep accepting them on `GET /api/search` if the route is added later, and ignore them in the `WHERE` clause. The results page still shows the stay beside the matches and stores it for the booking flow.

## Running the example

```bash
sqlite3 :memory: < docs/sql/hotel-search.sql
```

The script prints five result sets: cities for `Royal Aarhus` (none), hotels for `Royal Aarhus` (Hotel Royal Aarhus), cities and hotels for `Nida` (null `url`), then the homepage match for `Reykjavík`. To try another raw string, change the `fold_input` value and refill `query_tokens` from `raw_query_tokens`.

Full-text indexes such as FTS5 split on words and do not reproduce these substring matches. `instr` over the folded `search_text` is the query to keep.

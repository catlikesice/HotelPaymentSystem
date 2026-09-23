# Hotel search SQL

`GET /api/search` reads this schema (`routes/search.js`, `lib/search-db.js`). The results page uses that response. If the API cannot be reached, `assets/search.js` falls back to `window.SEARCH_CATALOG`. The homepage datalist uses `GET /api/search/destinations` the same way.

The statements live in [`hotel-search.sql`](hotel-search.sql). Dialect is SQLite 3. `instr()` is the substring test; on PostgreSQL use `strpos(haystack, needle) > 0` in its place. Fold accents in application code before the query. SQLite has no `unaccent`.

The static catalog is 55 cities and 146 hotels. The server also loads `lib/places-without-pages.js`: Nida, Barentsburg, Pyramiden, Abisko, and further towns in Scotland, Lithuania, and Finland. Those places have no HTML file. The SQL file loads a six-place example, including Nida, so the queries can be run as written. A loader should copy every catalog row, then the pageless places, into the same columns.

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
| `page_url` | `url` | Includes `.html`, for example `aarhus.html`. NULL when the place has no HTML page |
| `description` | `description` | |
| `sort_order` | array order | `Array.filter` keeps catalog order; `ORDER BY sort_order` does the same |
| `name_key` | | Homepage compare key. See normalization |
| `search_text` | | Results haystack |

`hotels` is one row per hotel card. `city_id` references `cities`. `page_url` is usually the city page. A few hotels have their own page (`grand-hotel-kempinski-riga.html`, `wellton-riverside-riga.html`). `page_url` is NULL when the hotel has no HTML page. `(city_id, name)` is unique. `page_url` is not unique, because several hotels share a city page, and more than one row may be NULL.

| Column | Catalog field | Notes |
| --- | --- | --- |
| `name` | `name` | |
| `page_url` | `url` | NULL when the hotel has no HTML page. The JSON also includes `cityUrl`, the city's `page_url`, so a hotel without its own page can still link to the city page |
| `image_url` | `image` | Null when the card has no photo |
| `price_label` | `price` | Exact display string, such as `0.08 ETH / night` or `0.10 ETH / night` |
| `price_eth` | `priceEth` | Nightly ETH number. Stored for the JSON field. Search does not filter on it |
| `description` | `description` | |
| `name_key` | | Normalized hotel name |
| `label_key` | | Normalized `name + " — " + city` (em dash, U+2014) |
| `search_text` | | Results haystack |

City listing pages also show BTC and USDT amounts in the HTML (`data-btc`, `data-usdt`). Those amounts are not in `SEARCH_CATALOG` and are not columns here.

## Normalization

Build keys in JavaScript and store them. Do not re-fold text in SQL.

Results haystack (`assets/search.js`):

```js
function normalizeResults(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ø/g, 'o')
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
| `Hotel Føroyar` | `hotel foroyar` |
| `Grand Hotel Kempinski — Riga` | `grand hotel kempinski — riga` |

## Results query

`GET /api/search?q=royal%20aarhus`

1. Trim `q`. If it is empty, respond `{ "cities": [], "hotels": [] }` and stop.
2. Run `normalizeResults` on `q`, treat `—` and `–` as spaces, and split on whitespace. Drop empty tokens. The em dash is the separator in a homepage label such as `Hotel Nida Marina — Nida`.
3. Insert each token into `query_tokens` (see the SQL file). Bind the token values. Do not paste the typed text into the statement.
4. Run the city `SELECT` and the hotel `SELECT`. A row matches when every token is found with `instr(search_text, token) > 0`.
5. Return both lists in `sort_order`.

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

The worked example in `hotel-search.sql` is loaded with tokens `royal` and `aarhus`. Both tokens have to match, so the city query returns nothing and the hotel query returns Hotel Royal Aarhus. A single token `aarhus` returns the Aarhus city row and that hotel.

Other checks against that sample:

| `q` | Cities | Hotels |
| --- | --- | --- |
| `reykjavik` | Reykjavík | none |
| `kempinski` | none | Grand Hotel Kempinski |
| `torshavn` | Tórshavn | Hotel Føroyar |
| `0.10` | none | Hotel Føroyar, Clarion Hotel The Edge |
| `nida` | Nida (`url` null) | Hotel Nida Marina (`url` and `cityUrl` null) |
| *(empty)* | none | none |

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
| Abisko | Sweden | Abisko Mountain Lodge |
| St Andrews | Scotland | St Andrews Harbour Hotel |
| Fort William | Scotland | Ben Nevis Lodge |
| Oban | Scotland | Oban Bay Hotel |
| Porvoo | Finland | Porvoo Old Town Hotel |
| Kuopio | Finland | Kuopio Lakefront Hotel |
| Savonlinna | Finland | Savonlinna Castle Hotel |

The results card still renders. When `url` is null and the hotel's `cityUrl` is also null, the card says the place has no separate page. When the hotel has no page but the city does, the card links to `cityUrl`.

The homepage opens a page only when the matched catalog row has a `url`. A place with no page is submitted to `search.html?q=...`, which loads it from `GET /api/search`. `GET /api/search/destinations` adds those names to the homepage datalist.

## Homepage destination query

The homepage does not list every match. It picks one destination and opens that page.

Normalize the typed destination with `normalizeHero`. If the result is empty, do not query.

Then take the first row of the union in `hotel-search.sql`, ordered by priority and `sort_order`:

1. `cities.name_key` equals the needle.
2. `hotels.name_key` or `hotels.label_key` equals the needle. The label is what the homepage datalist shows: `Grand Hotel Kempinski — Riga`.
3. The city key starts with the needle, or the needle starts with the city key.
4. The hotel key contains the needle.

The sample statement uses the literal needle `reykjavik` and returns the Reykjavík city row. `kempinski` returns Grand Hotel Kempinski. `tromso` returns the Tromsø city row (priority 1) rather than Clarion Hotel The Edge. `nida` returns the Nida city row with a null `page_url`. The homepage should not navigate when that value is null.

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

The script prints five result sets: cities for `royal aarhus`, hotels for `royal aarhus`, cities and hotels for `nida`, then the homepage match for `reykjavik`. The Nida rows have a null `url`.

Full-text indexes such as FTS5 split on words and do not reproduce these substring matches. The catalog is small enough that `instr` over `search_text` is the query to keep.

# Hotel search SQL

Search on the site still filters `window.SEARCH_CATALOG` in the browser (`assets/search.js`, `assets/search-catalog.js`, `assets/hero-search.js`). This document is the SQL contract for that same behavior, so `GET /api/search` can replace the static catalog without changing the pages.

The statements live in [`hotel-search.sql`](hotel-search.sql). Dialect is SQLite 3. `instr()` is the substring test; on PostgreSQL use `strpos(haystack, needle) > 0` in its place. Fold accents in application code before the query. SQLite has no `unaccent`.

The catalog today is 55 cities and 146 hotels. The SQL file loads a five-city example so the queries can be run as written. A loader should copy every catalog row into the same columns.

## What a search is

Two different lookups share the catalog:

| Surface | Input | Match |
| --- | --- | --- |
| Results page (`search.html`, `GET /api/search?q=`) | Free text | Every whitespace-separated token is a substring of the city or hotel haystack |
| Homepage bar (`index.html`) | One destination | First city or hotel in catalog order, using the priority list below |

`checkIn`, `checkOut`, `adults`, and `children` travel with both forms. They are stay details for pricing and booking. They do not filter these queries.

A blank `q` returns no rows. `search.js` treats an empty query as `{ "cities": [], "hotels": [] }` and does not scan the catalog.

## Tables

`cities` is one row per destination page.

| Column | Catalog field | Notes |
| --- | --- | --- |
| `name` | `name` and `city` | Same string on a city row |
| `country` | `country` | Denmark, Estonia, Finland, Iceland, Latvia, Lithuania, Norway, Scotland, Sweden, Northeast England, Åland Islands, Greenland, Faroe Islands, Svalbard |
| `page_url` | `url` | Includes `.html`, for example `aarhus.html` |
| `description` | `description` | |
| `sort_order` | array order | `Array.filter` keeps catalog order; `ORDER BY sort_order` does the same |
| `name_key` | | Homepage compare key. See normalization |
| `search_text` | | Results haystack |

`hotels` is one row per hotel card. `city_id` references `cities`. `page_url` is usually the city page. A few hotels have their own page (`grand-hotel-kempinski-riga.html`, `wellton-riverside-riga.html`). `(city_id, name)` is unique. `page_url` is not unique, because several hotels share a city page.

| Column | Catalog field | Notes |
| --- | --- | --- |
| `name` | `name` | |
| `page_url` | `url` | |
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
2. Run `normalizeResults` on `q` and split on whitespace. Drop empty tokens.
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
      "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80",
      "price": "0.08 ETH / night",
      "priceEth": 0.08,
      "description": "Luxury hotel in the heart of Aarhus, featuring elegant rooms, gourmet restaurant, and spa services."
    }
  ]
}
```

`search.html` reads `name`, `city`, `country`, `description`, `url`, and for hotels also `image` and `price`.

The worked example in `hotel-search.sql` is loaded with tokens `royal` and `aarhus`. Both tokens have to match, so the city query returns nothing and the hotel query returns Hotel Royal Aarhus. A single token `aarhus` returns the Aarhus city row and that hotel.

Other checks against that sample:

| `q` | Cities | Hotels |
| --- | --- | --- |
| `reykjavik` | Reykjavík | none |
| `kempinski` | none | Grand Hotel Kempinski |
| `torshavn` | Tórshavn | Hotel Føroyar |
| `0.10` | none | Hotel Føroyar, Clarion Hotel The Edge |
| *(empty)* | none | none |

## Homepage destination query

The homepage does not list every match. It picks one destination and opens that page.

Normalize the typed destination with `normalizeHero`. If the result is empty, do not query.

Then take the first row of the union in `hotel-search.sql`, ordered by priority and `sort_order`:

1. `cities.name_key` equals the needle.
2. `hotels.name_key` or `hotels.label_key` equals the needle. The label is what the homepage datalist shows: `Grand Hotel Kempinski — Riga`.
3. The city key starts with the needle, or the needle starts with the city key.
4. The hotel key contains the needle.

The sample statement uses the literal needle `reykjavik` and returns the Reykjavík city row. `kempinski` returns Grand Hotel Kempinski. `tromso` returns the Tromsø city row (priority 1) rather than Clarion Hotel The Edge.

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

The script prints three result sets: cities for `royal aarhus`, hotels for `royal aarhus`, and the homepage match for `reykjavik`.

Full-text indexes such as FTS5 split on words and do not reproduce these substring matches. The catalog is small enough that `instr` over `search_text` is the query to keep.

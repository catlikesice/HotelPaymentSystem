# Hotel add-on SQL

Optional extras offered when a guest selects a hotel are stored as one row each. A hotel row (breakfast, spa, late checkout) is shown only for that property. A city row (a museum ticket, a guided walk, a transfer) is shown for every hotel in that city, so the stay and the extras can be paid together.

The statements live in [`hotel-addons.sql`](hotel-addons.sql). Dialect is SQLite 3. `lib/hotel-addons.js` loads the file. The trip page (`trip.html`) calls `GET /api/hotel-addons/trip`. A property page calls `GET /api/hotel-addons` and adds any extra that is not already in its inline list.

`price_eth` is the amount in ETH. Per-night rows are multiplied by the number of nights. Per-stay rows are charged once. The trip page shows GBP with the same rates as `assets/payment-currencies.js` (1 USDT = 0.00035 ETH = 0.76 GBP). At that rate, Maritime Museum admission (`0.015657894736842103` ETH) is £34.

## Tables

`hotel_addons` is one row per extra.

| Column | Notes |
| --- | --- |
| `id` | Primary key, unique across the catalog |
| `addon_id` | Id stored on the booking. Unique per city and hotel, not globally |
| `scope` | `hotel` or `city` |
| `hotel_name` | Required for `hotel`. Empty for `city` |
| `city_name` | Catalog city name, for example `Esbjerg` or `Reykjavík` |
| `category` | `stay`, `experience`, or `transport` |
| `detail_line` | Short line under the label. The trip page fills in the adult-ticket count from the guest number when the line says `adult tickets` |
| `price_eth` | ETH amount, greater than 0 |
| `billing` | `per-night` or `per-stay` |
| `icon` | `museum`, `waves`, `bus`, `utensils`, `spa`, `hotel`, `walk`, or `ticket` |
| `sort_order` | Stay rows first, then experiences, then transport |

## What the guest sees

Choosing a hotel on a city page, or **Select stay** on a search result that has no property page of its own, opens `trip.html`. The page lists the hotels in that city, then the stay extras for the selected hotel, then the city experiences and transport. The summary is one checkout: the room plus each added extra.

A property page such as `funken-lodge.html` keeps the extras written in the page and appends catalog rows whose `addon_id` is not already there. Funken Lodge therefore still shows the lodge spa, and also the Longyearbyen dog-sled outing.

## Queries

Extras for Hotel Britannia, including Esbjerg experiences and the station transfer:

```sql
SELECT addon_id, scope, category, label, price_eth, billing
FROM hotel_addons
WHERE city_name = 'Esbjerg'
  AND (scope = 'city' OR hotel_name = 'Hotel Britannia')
ORDER BY sort_order, label;
```

```bash
sqlite3 :memory: < docs/sql/hotel-addons.sql
```

The script creates the table and inserts the catalog. The two `SELECT` statements above are not part of the file, so loading it from `lib/hotel-addons.js` does not print a result set.

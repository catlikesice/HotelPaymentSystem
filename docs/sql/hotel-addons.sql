-- Hotel add-on upsells for Boreal Horizons.
--
-- Dialect: SQLite 3.
-- Companion notes: docs/sql/hotel-addons.md
--
-- One row is one optional extra offered when a guest selects a hotel.
-- scope 'hotel' is offered only for that property (breakfast, spa, late checkout).
-- scope 'city' is offered for every hotel in that city (experiences and transport).
-- price_eth is the amount in ETH. The trip page converts it to GBP with the
-- same rates as assets/payment-currencies.js.
--
-- lib/hotel-addons.js loads this file. The trip page reads it through
-- GET /api/hotel-addons/trip. A property page reads GET /api/hotel-addons.

PRAGMA foreign_keys = ON;

CREATE TABLE hotel_addons (
  -- Globally unique. addon_id is the id the booking UI stores, and it only
  -- has to be unique among the extras shown for one selected hotel.
  id            TEXT    PRIMARY KEY,
  addon_id      TEXT    NOT NULL CHECK (length(addon_id) BETWEEN 2 AND 80),
  scope         TEXT    NOT NULL CHECK (scope IN ('hotel', 'city')),
  -- Empty when scope is 'city'. Required when scope is 'hotel'.
  hotel_name    TEXT    NOT NULL DEFAULT '' CHECK (hotel_name = trim(hotel_name)),
  city_name     TEXT    NOT NULL CHECK (length(city_name) > 0),
  country       TEXT    NOT NULL DEFAULT '',
  page_url      TEXT,
  category      TEXT    NOT NULL CHECK (category IN ('stay', 'experience', 'transport')),
  label         TEXT    NOT NULL CHECK (length(label) > 0),
  description   TEXT    NOT NULL DEFAULT '',
  -- Short line under the label, such as "Flexible entry · adult tickets".
  detail_line   TEXT    NOT NULL DEFAULT '',
  price_eth     REAL    NOT NULL CHECK (price_eth > 0),
  billing       TEXT    NOT NULL CHECK (billing IN ('per-night', 'per-stay')),
  icon          TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL,
  CHECK (
    (scope = 'hotel' AND length(hotel_name) > 0)
    OR (scope = 'city' AND hotel_name = '')
  ),
  UNIQUE (city_name, hotel_name, addon_id)
);

CREATE INDEX hotel_addons_city ON hotel_addons (city_name, scope, sort_order);

-- ---------------------------------------------------------------------------
-- Esbjerg. The trip page offers these when Hotel Britannia, Scandic Olympic,
-- or Hotel Ansgar is selected.
-- GBP equivalents at the site rate (1 USDT = 0.00035 ETH = 0.76 GBP):
--   0.015657894736842103 ETH = £34
--   0.022105263157894735 ETH = £48
--   0.01013157894736842  ETH = £22
--   0.008289473684210525 ETH = £18
--   0.00736842105263158  ETH = £16
-- ---------------------------------------------------------------------------

INSERT INTO hotel_addons (
  id, addon_id, scope, hotel_name, city_name, country, page_url,
  category, label, description, detail_line, price_eth, billing, icon, sort_order
) VALUES
  (
    'esbjerg:hotel-britannia:breakfast', 'breakfast', 'hotel', 'Hotel Britannia', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'stay', 'Breakfast for two',
    'Hot breakfast for two in the hotel restaurant each morning of the stay.',
    'Served each morning',
    0.008289473684210525, 'per-night', 'utensils', 10
  ),
  (
    'esbjerg:hotel-britannia:late-checkout', 'late-checkout', 'hotel', 'Hotel Britannia', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'stay', 'Late checkout',
    'Keep the room until 15:00 on departure day.',
    'Until 15:00',
    0.00736842105263158, 'per-stay', 'hotel', 20
  ),
  (
    'esbjerg:scandic-olympic:breakfast', 'breakfast', 'hotel', 'Scandic Olympic', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'stay', 'Breakfast buffet',
    'Breakfast buffet each morning of the stay.',
    'Served each morning',
    0.008289473684210525, 'per-night', 'utensils', 10
  ),
  (
    'esbjerg:hotel-ansgar:breakfast', 'breakfast', 'hotel', 'Hotel Ansgar', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'stay', 'Harbour breakfast',
    'Breakfast with a harbour view each morning of the stay.',
    'Served each morning',
    0.00736842105263158, 'per-night', 'utensils', 10
  ),
  (
    'esbjerg:city:maritime-museum', 'maritime-museum', 'city', '', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'experience', 'Maritime Museum admission',
    'Admission to the Fisheries and Maritime Museum beside the Esbjerg harbour, with ships and North Sea galleries.',
    'Flexible entry · adult tickets',
    0.015657894736842103, 'per-stay', 'museum', 100
  ),
  (
    'esbjerg:city:wadden-walk', 'wadden-walk', 'city', '', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'experience', 'Wadden Sea guided walk',
    'Guided walk on the UNESCO Wadden Sea mudflats with a local nature guide.',
    '3 hours · English-language guide',
    0.022105263157894735, 'per-stay', 'waves', 110
  ),
  (
    'esbjerg:city:station-transfer', 'station-transfer', 'city', '', 'Esbjerg', 'Denmark', 'esbjerg.html',
    'transport', 'Esbjerg station transfer',
    'Private car between Esbjerg station and the hotel, timed to the train.',
    'One way · private car',
    0.01013157894736842, 'per-stay', 'bus', 200
  );

-- ---------------------------------------------------------------------------
-- Property pages that already listed extras in their HTML. The same ids are
-- kept so a page does not show the extra twice. City rows are added on top.
-- ---------------------------------------------------------------------------

INSERT INTO hotel_addons (
  id, addon_id, scope, hotel_name, city_name, country, page_url,
  category, label, description, detail_line, price_eth, billing, icon, sort_order
) VALUES
  (
    'longyearbyen:funken-lodge:spa-access', 'spa-access', 'hotel', 'Funken Lodge', 'Longyearbyen', 'Svalbard', 'funken-lodge.html',
    'stay', 'Lodge spa evening',
    'Sauna and relaxation room after glacier hikes or snowmobile days.',
    'Each evening of the stay',
    0.012, 'per-night', 'spa', 10
  ),
  (
    'longyearbyen:funken-lodge:funken-dinner', 'funken-dinner', 'hotel', 'Funken Lodge', 'Longyearbyen', 'Svalbard', 'funken-lodge.html',
    'stay', 'Funken set dinner',
    'Three-course polar dinner with wine pairing in the lodge restaurant.',
    'Each evening of the stay',
    0.03, 'per-night', 'utensils', 20
  ),
  (
    'longyearbyen:funken-lodge:snowmobile', 'snowmobile', 'hotel', 'Funken Lodge', 'Longyearbyen', 'Svalbard', 'funken-lodge.html',
    'experience', 'Guided snowmobile day trip',
    'Full-day outing across the plateau with a certified guide, thermal suit, and hot lunch in the field.',
    'Full day · guide and thermal suit',
    0.08, 'per-stay', 'ticket', 100
  ),
  (
    'longyearbyen:basecamp-hotel:packed-lunch', 'packed-lunch', 'hotel', 'Basecamp Hotel', 'Longyearbyen', 'Svalbard', 'basecamp-hotel-svalbard.html',
    'stay', 'Expedition packed lunch',
    'Thermos coffee and trail lunch packed each morning for glacier walks or town rambles.',
    'Packed each morning',
    0.01, 'per-night', 'utensils', 10
  ),
  (
    'longyearbyen:basecamp-hotel:boat-safari', 'boat-safari', 'hotel', 'Basecamp Hotel', 'Longyearbyen', 'Svalbard', 'basecamp-hotel-svalbard.html',
    'experience', 'Isfjorden boat safari',
    'Half-day cruise among glaciers and bird cliffs, with a chance to spot seals, whales, and Arctic wildlife.',
    'Half day · glacier route',
    0.055, 'per-stay', 'waves', 100
  ),
  (
    'longyearbyen:basecamp-hotel:museum-pass', 'museum-pass', 'hotel', 'Basecamp Hotel', 'Longyearbyen', 'Svalbard', 'basecamp-hotel-svalbard.html',
    'experience', 'Svalbard Museum visit',
    'Admission to the Svalbard Museum, covering mining history, polar exploration, and High Arctic nature.',
    'Flexible entry',
    0.008, 'per-stay', 'museum', 110
  ),
  (
    'longyearbyen:radisson-blu:arctic-tasting', 'arctic-tasting', 'hotel', 'Radisson Blu Polar Hotel Spitsbergen', 'Longyearbyen', 'Svalbard', 'radisson-blu-polar-spitsbergen.html',
    'stay', 'Arctic tasting menu',
    'Seasonal Svalbard menu with locally landed fish, cloudberries, and polar-night desserts.',
    'Each evening of the stay',
    0.035, 'per-night', 'utensils', 10
  ),
  (
    'longyearbyen:radisson-blu:aurora-tour', 'aurora-tour', 'hotel', 'Radisson Blu Polar Hotel Spitsbergen', 'Longyearbyen', 'Svalbard', 'radisson-blu-polar-spitsbergen.html',
    'experience', 'Northern lights minibus tour',
    'Evening outing with a local guide to dark-sky valleys around Longyearbyen, with hot drinks and photo stops.',
    'Evening · guide and hot drinks',
    0.04, 'per-stay', 'ticket', 100
  ),
  (
    'longyearbyen:radisson-blu:airport-transfer', 'airport-transfer', 'hotel', 'Radisson Blu Polar Hotel Spitsbergen', 'Longyearbyen', 'Svalbard', 'radisson-blu-polar-spitsbergen.html',
    'transport', 'Svalbard Airport transfer',
    'Shared shuttle from LYR into Longyearbyen and back on departure day.',
    'Arrival and departure',
    0.03, 'per-stay', 'bus', 200
  ),
  (
    'longyearbyen:city:dogsled', 'dogsled', 'city', '', 'Longyearbyen', 'Svalbard', 'longyearbyen.html',
    'experience', 'Dog-sled outing',
    'Short dog-sled run on the edge of town with a musher and a thermal suit.',
    '2 hours · thermal suit included',
    0.02763157894736842, 'per-stay', 'ticket', 120
  ),
  (
    'riga:wellton:thermal-spa', 'thermal-spa', 'hotel', 'Wellton Riverside Riga', 'Riga', 'Latvia', 'wellton-riverside-riga.html',
    'stay', 'Spa & Thermal zone access',
    'Unlimited use of saunas, steam room, and hydrotherapy pool throughout the stay.',
    'Each day of the stay',
    0.008, 'per-night', 'spa', 10
  ),
  (
    'riga:wellton:wine-tasting', 'wine-tasting', 'hotel', 'Wellton Riverside Riga', 'Riga', 'Latvia', 'wellton-riverside-riga.html',
    'stay', 'Latvian wine tasting flight',
    'Sommelier-guided tasting of boutique Latvian wines served in the Sky Bar.',
    'One sitting',
    0.02, 'per-night', 'utensils', 20
  ),
  (
    'riga:wellton:river-cruise', 'river-cruise', 'hotel', 'Wellton Riverside Riga', 'Riga', 'Latvia', 'wellton-riverside-riga.html',
    'experience', 'Daugava evening river cruise',
    'Private two-hour sunset cruise with sommelier-selected wines and a local mezze platter.',
    '2 hours · evening departure',
    0.04, 'per-stay', 'waves', 100
  ),
  (
    'riga:kempinski:spa-access', 'spa-access', 'hotel', 'Grand Hotel Kempinski Riga', 'Riga', 'Latvia', 'grand-hotel-kempinski-riga.html',
    'stay', 'Kempinski The Spa access',
    'Unlimited daily access to thermal suites, saunas, and the relaxation pool for registered guests.',
    'Each day of the stay',
    0.01, 'per-night', 'spa', 10
  ),
  (
    'riga:kempinski:rooftop-tasting', 'rooftop-tasting', 'hotel', 'Grand Hotel Kempinski Riga', 'Riga', 'Latvia', 'grand-hotel-kempinski-riga.html',
    'stay', 'Rooftop tasting menu',
    'Five-course tasting menu with wine pairings on the Skyline Terrace each night of the stay.',
    'Each evening of the stay',
    0.03, 'per-night', 'utensils', 20
  ),
  (
    'riga:kempinski:airport-transfer', 'airport-transfer', 'hotel', 'Grand Hotel Kempinski Riga', 'Riga', 'Latvia', 'grand-hotel-kempinski-riga.html',
    'transport', 'Private airport transfer',
    'Chauffeured pick-up and drop-off with refreshments and concierge check-in.',
    'Arrival and departure',
    0.05, 'per-stay', 'bus', 200
  ),
  (
    'riga:city:art-nouveau', 'art-nouveau', 'city', '', 'Riga', 'Latvia', 'riga.html',
    'experience', 'Art Nouveau walking tour',
    'Guided walk through the Alberta iela district and the Art Nouveau museum quarter.',
    '2 hours · English-language guide',
    0.012894736842105264, 'per-stay', 'walk', 100
  ),
  (
    'bauska:hotel-bauska:breakfast', 'breakfast', 'hotel', 'Hotel Bauska', 'Bauska', 'Latvia', 'hotel-bauska.html',
    'stay', 'Breakfast for two',
    'Hot breakfast in the hotel restaurant each morning of the stay.',
    'Served each morning',
    0.008, 'per-night', 'utensils', 10
  ),
  (
    'bauska:hotel-bauska:castle-tour', 'castle-tour', 'hotel', 'Hotel Bauska', 'Bauska', 'Latvia', 'hotel-bauska.html',
    'experience', 'Bauska Castle tour',
    'Guided visit to the castle museum and the tower over the Mūsa and Mēmele.',
    'Guided visit',
    0.02, 'per-stay', 'museum', 100
  ),
  (
    'bauska:castle-hotel:breakfast', 'breakfast', 'hotel', 'Bauska Castle Hotel', 'Bauska', 'Latvia', 'bauska-castle-hotel.html',
    'stay', 'Breakfast for two',
    'Breakfast beside the river each morning of the stay.',
    'Served each morning',
    0.008, 'per-night', 'utensils', 10
  ),
  (
    'bauska:castle-hotel:castle-tour', 'castle-tour', 'hotel', 'Bauska Castle Hotel', 'Bauska', 'Latvia', 'bauska-castle-hotel.html',
    'experience', 'Bauska Castle tour',
    'Guided visit to the Livonian castle and the later palace wing.',
    'Guided visit',
    0.02, 'per-stay', 'museum', 100
  );

-- ---------------------------------------------------------------------------
-- City experiences and transfers offered with any hotel in that destination.
-- ---------------------------------------------------------------------------

INSERT INTO hotel_addons (
  id, addon_id, scope, hotel_name, city_name, country, page_url,
  category, label, description, detail_line, price_eth, billing, icon, sort_order
) VALUES
  (
    'copenhagen:city:canal-tour', 'canal-tour', 'city', '', 'Copenhagen', 'Denmark', 'copenhagen.html',
    'experience', 'Harbour canal tour',
    'Boat tour through the inner harbour and Christianshavn canals.',
    '1 hour · live commentary',
    0.01657894736842105, 'per-stay', 'waves', 100
  ),
  (
    'copenhagen:city:airport-transfer', 'airport-transfer', 'city', '', 'Copenhagen', 'Denmark', 'copenhagen.html',
    'transport', 'Copenhagen airport transfer',
    'Private car from CPH to the hotel.',
    'One way · private car',
    0.019342105263157893, 'per-stay', 'bus', 200
  ),
  (
    'reykjavik:city:whale-watching', 'whale-watching', 'city', '', 'Reykjavík', 'Iceland', 'reykjavík.html',
    'experience', 'Faxaflói whale watching',
    'Boat trip from the old harbour for whales and seabirds.',
    '3 hours · departs from the old harbour',
    0.02532894736842105, 'per-stay', 'waves', 100
  ),
  (
    'stockholm:city:vasa', 'vasa', 'city', '', 'Stockholm', 'Sweden', 'stockholm.html',
    'experience', 'Vasa Museum admission',
    'Entry to the Vasa warship on Djurgården.',
    'Flexible entry · adult tickets',
    0.008749999999999999, 'per-stay', 'museum', 100
  ),
  (
    'edinburgh:city:castle', 'castle', 'city', '', 'Edinburgh', 'Scotland', 'edinburgh.html',
    'experience', 'Edinburgh Castle entry',
    'Timed entry to Edinburgh Castle, above the Royal Mile.',
    'Timed entry · adult tickets',
    0.011052631578947368, 'per-stay', 'museum', 100
  ),
  (
    'bergen:city:floibanen', 'floibanen', 'city', '', 'Bergen', 'Norway', 'bergen.html',
    'experience', 'Fløibanen funicular',
    'Return ride from the city centre to Mount Fløyen.',
    'Return ticket',
    0.00736842105263158, 'per-stay', 'ticket', 100
  ),
  (
    'bergen:city:fjord', 'fjord', 'city', '', 'Bergen', 'Norway', 'bergen.html',
    'experience', 'Bergen fjord cruise',
    'Cruise from the Bryggen quay into the outer fjord.',
    '3 hours · outer fjord',
    0.020723684210526314, 'per-stay', 'waves', 110
  ),
  (
    'helsinki:city:suomenlinna', 'suomenlinna', 'city', '', 'Helsinki', 'Finland', 'helsinki.html',
    'experience', 'Suomenlinna ferry and fortress',
    'Return ferry to the sea fortress and time on the ramparts.',
    'Return ferry · fortress grounds',
    0.008289473684210525, 'per-stay', 'waves', 100
  ),
  (
    'tallinn:city:old-town', 'old-town', 'city', '', 'Tallinn', 'Estonia', 'tallinn.html',
    'experience', 'Old Town walking tour',
    'Guided walk on Toompea and through the lower old town.',
    '2 hours · English-language guide',
    0.012434210526315789, 'per-stay', 'walk', 100
  ),
  (
    'oslo:city:fjord', 'fjord', 'city', '', 'Oslo', 'Norway', 'oslo.html',
    'experience', 'Oslo fjord sightseeing',
    'Boat trip along the islands, departing from Aker Brygge.',
    '2 hours · departs from Aker Brygge',
    0.018421052631578946, 'per-stay', 'waves', 100
  ),
  (
    'tromso:city:fjord', 'fjord', 'city', '', 'Tromsø', 'Norway', 'tromso.html',
    'experience', 'Tromsø fjord cruise',
    'Cruise from the harbour with an Arctic wildlife route.',
    '3 hours · Arctic wildlife route',
    0.022105263157894735, 'per-stay', 'waves', 100
  ),
  (
    'aarhus:city:aros', 'aros', 'city', '', 'Aarhus', 'Denmark', 'aarhus.html',
    'experience', 'ARoS art museum admission',
    'Entry to ARoS, including the rooftop walk.',
    'Flexible entry · adult tickets',
    0.01013157894736842, 'per-stay', 'museum', 100
  );

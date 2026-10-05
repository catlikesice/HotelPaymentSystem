-- Hotel search schema, catalog, and queries for Boreal Horizons.
--
-- Dialect: SQLite 3.
-- Companion notes: docs/sql/hotel-search.md
--
-- This file is the search database. lib/search-db.js loads it, the same
-- way lib/city-pages.js loads city-pages.sql. It lists every catalog city
-- and hotel, plus places that have no city HTML page.
--
-- search_text, name_key, and label_key are already folded. A raw query is
-- folded with fold_map below, so sqlite3 can search without JavaScript.
-- Regenerated from assets/search-catalog.js and lib/places-without-pages.js
-- by lib/search-sql.js.

PRAGMA foreign_keys = ON;

CREATE TABLE cities (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  country       TEXT    NOT NULL,
  page_url      TEXT    UNIQUE,
  description   TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL UNIQUE,
  name_key      TEXT    NOT NULL,
  search_text   TEXT    NOT NULL
);

CREATE TABLE hotels (
  id            INTEGER PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id),
  name          TEXT    NOT NULL,
  page_url      TEXT,
  image_url     TEXT,
  price_label   TEXT    NOT NULL,
  price_eth     REAL    NOT NULL CHECK (price_eth >= 0),
  description   TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL UNIQUE,
  name_key      TEXT    NOT NULL,
  label_key     TEXT    NOT NULL,
  search_text   TEXT    NOT NULL,
  UNIQUE (city_id, name)
);

CREATE INDEX hotels_city_id ON hotels (city_id);
CREATE INDEX hotels_name_key ON hotels (name_key);
CREATE INDEX cities_name_key ON cities (name_key);

-- One row per character that folding changes. SQLite lower() is ASCII-only
-- and there is no unaccent, so queries walk this table with replace().
CREATE TABLE fold_map (
  src TEXT PRIMARY KEY,
  dst TEXT NOT NULL
);

INSERT INTO fold_map (src, dst) VALUES
  ('''', ''),
  ('A', 'a'),
  ('B', 'b'),
  ('C', 'c'),
  ('D', 'd'),
  ('E', 'e'),
  ('F', 'f'),
  ('G', 'g'),
  ('H', 'h'),
  ('I', 'i'),
  ('J', 'j'),
  ('K', 'k'),
  ('L', 'l'),
  ('M', 'm'),
  ('N', 'n'),
  ('O', 'o'),
  ('P', 'p'),
  ('Q', 'q'),
  ('R', 'r'),
  ('S', 's'),
  ('T', 't'),
  ('U', 'u'),
  ('V', 'v'),
  ('W', 'w'),
  ('X', 'x'),
  ('Y', 'y'),
  ('Z', 'z'),
  ('À', 'a'),
  ('Á', 'a'),
  ('Â', 'a'),
  ('Ã', 'a'),
  ('Ä', 'a'),
  ('Å', 'a'),
  ('Æ', 'ae'),
  ('Ç', 'c'),
  ('È', 'e'),
  ('É', 'e'),
  ('Ê', 'e'),
  ('Ë', 'e'),
  ('Ì', 'i'),
  ('Í', 'i'),
  ('Î', 'i'),
  ('Ï', 'i'),
  ('Ð', 'd'),
  ('Ñ', 'n'),
  ('Ò', 'o'),
  ('Ó', 'o'),
  ('Ô', 'o'),
  ('Õ', 'o'),
  ('Ö', 'o'),
  ('Ø', 'o'),
  ('Ù', 'u'),
  ('Ú', 'u'),
  ('Û', 'u'),
  ('Ü', 'u'),
  ('Ý', 'y'),
  ('Þ', 'th'),
  ('à', 'a'),
  ('á', 'a'),
  ('â', 'a'),
  ('ã', 'a'),
  ('ä', 'a'),
  ('å', 'a'),
  ('æ', 'ae'),
  ('ç', 'c'),
  ('è', 'e'),
  ('é', 'e'),
  ('ê', 'e'),
  ('ë', 'e'),
  ('ì', 'i'),
  ('í', 'i'),
  ('î', 'i'),
  ('ï', 'i'),
  ('ð', 'd'),
  ('ñ', 'n'),
  ('ò', 'o'),
  ('ó', 'o'),
  ('ô', 'o'),
  ('õ', 'o'),
  ('ö', 'o'),
  ('ø', 'o'),
  ('ù', 'u'),
  ('ú', 'u'),
  ('û', 'u'),
  ('ü', 'u'),
  ('ý', 'y'),
  ('þ', 'th'),
  ('ÿ', 'y'),
  ('Ā', 'a'),
  ('ā', 'a'),
  ('Ă', 'a'),
  ('ă', 'a'),
  ('Ą', 'a'),
  ('ą', 'a'),
  ('Ć', 'c'),
  ('ć', 'c'),
  ('Ĉ', 'c'),
  ('ĉ', 'c'),
  ('Ċ', 'c'),
  ('ċ', 'c'),
  ('Č', 'c'),
  ('č', 'c'),
  ('Ď', 'd'),
  ('ď', 'd'),
  ('Đ', 'đ'),
  ('Ē', 'e'),
  ('ē', 'e'),
  ('Ĕ', 'e'),
  ('ĕ', 'e'),
  ('Ė', 'e'),
  ('ė', 'e'),
  ('Ę', 'e'),
  ('ę', 'e'),
  ('Ě', 'e'),
  ('ě', 'e'),
  ('Ĝ', 'g'),
  ('ĝ', 'g'),
  ('Ğ', 'g'),
  ('ğ', 'g'),
  ('Ġ', 'g'),
  ('ġ', 'g'),
  ('Ģ', 'g'),
  ('ģ', 'g'),
  ('Ĥ', 'h'),
  ('ĥ', 'h'),
  ('Ħ', 'ħ'),
  ('Ĩ', 'i'),
  ('ĩ', 'i'),
  ('Ī', 'i'),
  ('ī', 'i'),
  ('Ĭ', 'i'),
  ('ĭ', 'i'),
  ('Į', 'i'),
  ('į', 'i'),
  ('İ', 'i'),
  ('Ĳ', 'ĳ'),
  ('Ĵ', 'j'),
  ('ĵ', 'j'),
  ('Ķ', 'k'),
  ('ķ', 'k'),
  ('Ĺ', 'l'),
  ('ĺ', 'l'),
  ('Ļ', 'l'),
  ('ļ', 'l'),
  ('Ľ', 'l'),
  ('ľ', 'l'),
  ('Ŀ', 'ŀ'),
  ('Ł', 'ł'),
  ('Ń', 'n'),
  ('ń', 'n'),
  ('Ņ', 'n'),
  ('ņ', 'n'),
  ('Ň', 'n'),
  ('ň', 'n'),
  ('Ŋ', 'ŋ'),
  ('Ō', 'o'),
  ('ō', 'o'),
  ('Ŏ', 'o'),
  ('ŏ', 'o'),
  ('Ő', 'o'),
  ('ő', 'o'),
  ('Œ', 'œ'),
  ('Ŕ', 'r'),
  ('ŕ', 'r'),
  ('Ŗ', 'r'),
  ('ŗ', 'r'),
  ('Ř', 'r'),
  ('ř', 'r'),
  ('Ś', 's'),
  ('ś', 's'),
  ('Ŝ', 's'),
  ('ŝ', 's'),
  ('Ş', 's'),
  ('ş', 's'),
  ('Š', 's'),
  ('š', 's'),
  ('Ţ', 't'),
  ('ţ', 't'),
  ('Ť', 't'),
  ('ť', 't'),
  ('Ŧ', 'ŧ'),
  ('Ũ', 'u'),
  ('ũ', 'u'),
  ('Ū', 'u'),
  ('ū', 'u'),
  ('Ŭ', 'u'),
  ('ŭ', 'u'),
  ('Ů', 'u'),
  ('ů', 'u'),
  ('Ű', 'u'),
  ('ű', 'u'),
  ('Ų', 'u'),
  ('ų', 'u'),
  ('Ŵ', 'w'),
  ('ŵ', 'w'),
  ('Ŷ', 'y'),
  ('ŷ', 'y'),
  ('Ÿ', 'y'),
  ('Ź', 'z'),
  ('ź', 'z'),
  ('Ż', 'z'),
  ('ż', 'z'),
  ('Ž', 'z'),
  ('ž', 'z'),
  ('Ɓ', 'ɓ'),
  ('Ƃ', 'ƃ'),
  ('Ƅ', 'ƅ'),
  ('Ɔ', 'ɔ'),
  ('Ƈ', 'ƈ'),
  ('Ɖ', 'ɖ'),
  ('Ɗ', 'ɗ'),
  ('Ƌ', 'ƌ'),
  ('Ǝ', 'ǝ'),
  ('Ə', 'ə'),
  ('Ɛ', 'ɛ'),
  ('Ƒ', 'ƒ'),
  ('Ɠ', 'ɠ'),
  ('Ɣ', 'ɣ'),
  ('Ɩ', 'ɩ'),
  ('Ɨ', 'ɨ'),
  ('Ƙ', 'ƙ'),
  ('Ɯ', 'ɯ'),
  ('Ɲ', 'ɲ'),
  ('Ɵ', 'ɵ'),
  ('Ơ', 'o'),
  ('ơ', 'o'),
  ('Ƣ', 'ƣ'),
  ('Ƥ', 'ƥ'),
  ('Ʀ', 'ʀ'),
  ('Ƨ', 'ƨ'),
  ('Ʃ', 'ʃ'),
  ('Ƭ', 'ƭ'),
  ('Ʈ', 'ʈ'),
  ('Ư', 'u'),
  ('ư', 'u'),
  ('Ʊ', 'ʊ'),
  ('Ʋ', 'ʋ'),
  ('Ƴ', 'ƴ'),
  ('Ƶ', 'ƶ'),
  ('Ʒ', 'ʒ'),
  ('Ƹ', 'ƹ'),
  ('Ƽ', 'ƽ'),
  ('Ǆ', 'ǆ'),
  ('ǅ', 'ǆ'),
  ('Ǉ', 'ǉ'),
  ('ǈ', 'ǉ'),
  ('Ǌ', 'ǌ'),
  ('ǋ', 'ǌ'),
  ('Ǎ', 'a'),
  ('ǎ', 'a'),
  ('Ǐ', 'i'),
  ('ǐ', 'i'),
  ('Ǒ', 'o'),
  ('ǒ', 'o'),
  ('Ǔ', 'u'),
  ('ǔ', 'u'),
  ('Ǖ', 'u'),
  ('ǖ', 'u'),
  ('Ǘ', 'u'),
  ('ǘ', 'u'),
  ('Ǚ', 'u'),
  ('ǚ', 'u'),
  ('Ǜ', 'u'),
  ('ǜ', 'u'),
  ('Ǟ', 'a'),
  ('ǟ', 'a'),
  ('Ǡ', 'a'),
  ('ǡ', 'a'),
  ('Ǣ', 'æ'),
  ('ǣ', 'æ'),
  ('Ǥ', 'ǥ'),
  ('Ǧ', 'g'),
  ('ǧ', 'g'),
  ('Ǩ', 'k'),
  ('ǩ', 'k'),
  ('Ǫ', 'o'),
  ('ǫ', 'o'),
  ('Ǭ', 'o'),
  ('ǭ', 'o'),
  ('Ǯ', 'ʒ'),
  ('ǯ', 'ʒ'),
  ('ǰ', 'j'),
  ('Ǳ', 'ǳ'),
  ('ǲ', 'ǳ'),
  ('Ǵ', 'g'),
  ('ǵ', 'g'),
  ('Ƕ', 'ƕ'),
  ('Ƿ', 'ƿ'),
  ('Ǹ', 'n'),
  ('ǹ', 'n'),
  ('Ǻ', 'a'),
  ('ǻ', 'a'),
  ('Ǽ', 'æ'),
  ('ǽ', 'æ'),
  ('Ǿ', 'ø'),
  ('ǿ', 'ø'),
  ('Ȁ', 'a'),
  ('ȁ', 'a'),
  ('Ȃ', 'a'),
  ('ȃ', 'a'),
  ('Ȅ', 'e'),
  ('ȅ', 'e'),
  ('Ȇ', 'e'),
  ('ȇ', 'e'),
  ('Ȉ', 'i'),
  ('ȉ', 'i'),
  ('Ȋ', 'i'),
  ('ȋ', 'i'),
  ('Ȍ', 'o'),
  ('ȍ', 'o'),
  ('Ȏ', 'o'),
  ('ȏ', 'o'),
  ('Ȑ', 'r'),
  ('ȑ', 'r'),
  ('Ȓ', 'r'),
  ('ȓ', 'r'),
  ('Ȕ', 'u'),
  ('ȕ', 'u'),
  ('Ȗ', 'u'),
  ('ȗ', 'u'),
  ('Ș', 's'),
  ('ș', 's'),
  ('Ț', 't'),
  ('ț', 't'),
  ('Ȝ', 'ȝ'),
  ('Ȟ', 'h'),
  ('ȟ', 'h'),
  ('Ƞ', 'ƞ'),
  ('Ȣ', 'ȣ'),
  ('Ȥ', 'ȥ'),
  ('Ȧ', 'a'),
  ('ȧ', 'a'),
  ('Ȩ', 'e'),
  ('ȩ', 'e'),
  ('Ȫ', 'o'),
  ('ȫ', 'o'),
  ('Ȭ', 'o'),
  ('ȭ', 'o'),
  ('Ȯ', 'o'),
  ('ȯ', 'o'),
  ('Ȱ', 'o'),
  ('ȱ', 'o'),
  ('Ȳ', 'y'),
  ('ȳ', 'y'),
  ('Ⱥ', 'ⱥ'),
  ('Ȼ', 'ȼ'),
  ('Ƚ', 'ƚ'),
  ('Ⱦ', 'ⱦ'),
  ('Ɂ', 'ɂ'),
  ('Ƀ', 'ƀ'),
  ('Ʉ', 'ʉ'),
  ('Ʌ', 'ʌ'),
  ('Ɇ', 'ɇ'),
  ('Ɉ', 'ɉ'),
  ('Ɋ', 'ɋ'),
  ('Ɍ', 'ɍ'),
  ('Ɏ', 'ɏ'),
  ('’', ''),
  ('ʼ', '');

BEGIN;
INSERT INTO cities (id, name, country, page_url, description, sort_order, name_key, search_text) VALUES
  (1, 'Aalborg', 'Denmark', 'aalborg.html', 'Browse hotels in Aalborg, Denmark.', 1, 'aalborg', 'aalborg aalborg denmark browse hotels in aalborg, denmark.  city'),
  (2, 'Aarhus', 'Denmark', 'aarhus.html', 'Browse hotels in Aarhus, Denmark.', 2, 'aarhus', 'aarhus aarhus denmark browse hotels in aarhus, denmark.  city'),
  (3, 'Aberdeen', 'Scotland', 'aberdeen.html', 'Browse hotels in Aberdeen, Scotland.', 3, 'aberdeen', 'aberdeen aberdeen scotland browse hotels in aberdeen, scotland.  city'),
  (4, 'Abisko', 'Sweden', 'abisko.html', 'Browse hotels in Abisko, Sweden.', 4, 'abisko', 'abisko abisko sweden browse hotels in abisko, sweden.  city'),
  (5, 'Akureyri', 'Iceland', 'akureyri.html', 'Browse hotels in Akureyri, Iceland.', 5, 'akureyri', 'akureyri akureyri iceland browse hotels in akureyri, iceland.  city'),
  (6, 'Aviemore', 'Scotland', 'aviemore.html', 'Browse hotels in Aviemore, Scotland.', 6, 'aviemore', 'aviemore aviemore scotland browse hotels in aviemore, scotland.  city'),
  (7, 'Bauska', 'Latvia', 'bauska.html', 'Browse hotels in Bauska, Latvia.', 7, 'bauska', 'bauska bauska latvia browse hotels in bauska, latvia.  city'),
  (8, 'Bergen', 'Norway', 'bergen.html', 'Browse hotels in Bergen, Norway.', 8, 'bergen', 'bergen bergen norway browse hotels in bergen, norway.  city'),
  (9, 'Berwick-upon-Tweed', 'Northeast England', 'berwick-upon-tweed.html', 'Browse hotels in Berwick-upon-Tweed, Northeast England.', 9, 'berwick-upon-tweed', 'berwick-upon-tweed berwick-upon-tweed northeast england browse hotels in berwick-upon-tweed, northeast england.  city'),
  (10, 'Copenhagen', 'Denmark', 'copenhagen.html', 'Browse hotels in Copenhagen, Denmark.', 10, 'copenhagen', 'copenhagen copenhagen denmark browse hotels in copenhagen, denmark.  city'),
  (11, 'Daugavpils', 'Latvia', 'daugavpils.html', 'Browse hotels in Daugavpils, Latvia.', 11, 'daugavpils', 'daugavpils daugavpils latvia browse hotels in daugavpils, latvia.  city'),
  (12, 'Dundee', 'Scotland', 'dundee.html', 'Browse hotels in Dundee, Scotland.', 12, 'dundee', 'dundee dundee scotland browse hotels in dundee, scotland.  city'),
  (13, 'Edinburgh', 'Scotland', 'edinburgh.html', 'Browse hotels in Edinburgh, Scotland.', 13, 'edinburgh', 'edinburgh edinburgh scotland browse hotels in edinburgh, scotland.  city'),
  (14, 'Esbjerg', 'Denmark', 'esbjerg.html', 'Browse hotels in Esbjerg, Denmark.', 14, 'esbjerg', 'esbjerg esbjerg denmark browse hotels in esbjerg, denmark.  city'),
  (15, 'Espoo', 'Finland', 'espoo.html', 'Browse hotels in Espoo, Finland.', 15, 'espoo', 'espoo espoo finland browse hotels in espoo, finland.  city'),
  (16, 'Fort William', 'Scotland', 'fort-william.html', 'Browse hotels in Fort William, Scotland.', 16, 'fort william', 'fort william fort william scotland browse hotels in fort william, scotland.  city'),
  (17, 'Glasgow', 'Scotland', 'glasgow.html', 'Browse hotels in Glasgow, Scotland.', 17, 'glasgow', 'glasgow glasgow scotland browse hotels in glasgow, scotland.  city'),
  (18, 'Gothenburg', 'Sweden', 'gothenburg.html', 'Browse hotels in Gothenburg, Sweden.', 18, 'gothenburg', 'gothenburg gothenburg sweden browse hotels in gothenburg, sweden.  city'),
  (19, 'Hafnarfjörður', 'Iceland', 'hafnarfjörður.html', 'Browse hotels in Hafnarfjörður, Iceland.', 19, 'hafnarfjordur', 'hafnarfjordur hafnarfjordur iceland browse hotels in hafnarfjordur, iceland.  city'),
  (20, 'Helsinki', 'Finland', 'helsinki.html', 'Browse hotels in Helsinki, Finland.', 20, 'helsinki', 'helsinki helsinki finland browse hotels in helsinki, finland.  city'),
  (21, 'Ilulissat', 'Greenland', 'ilulissat.html', 'Browse hotels in Ilulissat, Greenland.', 21, 'ilulissat', 'ilulissat ilulissat greenland browse hotels in ilulissat, greenland.  city'),
  (22, 'Inverness', 'Scotland', 'inverness.html', 'Browse hotels in Inverness, Scotland.', 22, 'inverness', 'inverness inverness scotland browse hotels in inverness, scotland.  city'),
  (23, 'Ísafjörður', 'Iceland', 'ísafjörður.html', 'Browse hotels in Ísafjörður, Iceland.', 23, 'isafjordur', 'isafjordur isafjordur iceland browse hotels in isafjordur, iceland.  city'),
  (24, 'Jelgava', 'Latvia', 'jelgava.html', 'Browse hotels in Jelgava, Latvia.', 24, 'jelgava', 'jelgava jelgava latvia browse hotels in jelgava, latvia.  city'),
  (25, 'Jūrmala', 'Latvia', 'jurmala.html', 'Browse hotels in Jūrmala, Latvia.', 25, 'jurmala', 'jurmala jurmala latvia browse hotels in jurmala, latvia.  city'),
  (26, 'Kaunas', 'Lithuania', 'kaunas.html', 'Browse hotels in Kaunas, Lithuania.', 26, 'kaunas', 'kaunas kaunas lithuania browse hotels in kaunas, lithuania.  city'),
  (27, 'Keflavík', 'Iceland', 'keflavík.html', 'Browse hotels in Keflavík, Iceland.', 27, 'keflavik', 'keflavik keflavik iceland browse hotels in keflavik, iceland.  city'),
  (28, 'Kiruna', 'Sweden', 'kiruna.html', 'Browse hotels in Kiruna, Sweden.', 28, 'kiruna', 'kiruna kiruna sweden browse hotels in kiruna, sweden.  city'),
  (29, 'Klaipėda', 'Lithuania', 'klaipeda.html', 'Browse hotels in Klaipėda, Lithuania.', 29, 'klaipeda', 'klaipeda klaipeda lithuania browse hotels in klaipeda, lithuania.  city'),
  (30, 'Kópavogur', 'Iceland', 'kópavogur.html', 'Browse hotels in Kópavogur, Iceland.', 30, 'kopavogur', 'kopavogur kopavogur iceland browse hotels in kopavogur, iceland.  city'),
  (31, 'Kristiansand', 'Norway', 'kristiansand.html', 'Browse hotels in Kristiansand, Norway.', 31, 'kristiansand', 'kristiansand kristiansand norway browse hotels in kristiansand, norway.  city'),
  (32, 'Lerwick', 'Scotland', 'lerwick.html', 'Browse hotels in Lerwick, Scotland.', 32, 'lerwick', 'lerwick lerwick scotland browse hotels in lerwick, scotland.  city'),
  (33, 'Liepāja', 'Latvia', 'liepaja.html', 'Browse hotels in Liepāja, Latvia.', 33, 'liepaja', 'liepaja liepaja latvia browse hotels in liepaja, latvia.  city'),
  (34, 'Lillehammer', 'Norway', 'lillehammer.html', 'Browse hotels in Lillehammer, Norway.', 34, 'lillehammer', 'lillehammer lillehammer norway browse hotels in lillehammer, norway.  city'),
  (35, 'Linköping', 'Sweden', 'linköping.html', 'Browse hotels in Linköping, Sweden.', 35, 'linkoping', 'linkoping linkoping sweden browse hotels in linkoping, sweden.  city'),
  (36, 'Loch Lomond National Park', 'Scotland', 'loch-lomond.html', 'Browse hotels in Loch Lomond National Park, Scotland.', 36, 'loch lomond national park', 'loch lomond national park loch lomond national park scotland browse hotels in loch lomond national park, scotland.  city'),
  (37, 'Longyearbyen', 'Svalbard', 'longyearbyen.html', 'Browse hotels in Longyearbyen, Svalbard.', 37, 'longyearbyen', 'longyearbyen longyearbyen svalbard browse hotels in longyearbyen, svalbard.  city'),
  (38, 'Malmö', 'Sweden', 'malmö.html', 'Browse hotels in Malmö, Sweden.', 38, 'malmo', 'malmo malmo sweden browse hotels in malmo, sweden.  city'),
  (39, 'Mariehamn', 'Åland Islands', 'mariehamn.html', 'Browse hotels in Mariehamn, Åland Islands.', 39, 'mariehamn', 'mariehamn mariehamn aland islands browse hotels in mariehamn, aland islands.  city'),
  (40, 'Narva', 'Estonia', 'narva.html', 'Browse hotels in Narva, Estonia.', 40, 'narva', 'narva narva estonia browse hotels in narva, estonia.  city'),
  (41, 'Newcastle', 'Northeast England', 'newcastle.html', 'Browse hotels in Newcastle upon Tyne, Northeast England.', 41, 'newcastle', 'newcastle newcastle northeast england browse hotels in newcastle upon tyne, northeast england.  city'),
  (42, 'Nuuk', 'Greenland', 'nuuk.html', 'Browse hotels in Nuuk, Greenland.', 42, 'nuuk', 'nuuk nuuk greenland browse hotels in nuuk, greenland.  city'),
  (43, 'Oban', 'Scotland', 'oban.html', 'Browse hotels in Oban, Scotland.', 43, 'oban', 'oban oban scotland browse hotels in oban, scotland.  city'),
  (44, 'Odense', 'Denmark', 'odense.html', 'Browse hotels in Odense, Denmark.', 44, 'odense', 'odense odense denmark browse hotels in odense, denmark.  city'),
  (45, 'Oslo', 'Norway', 'oslo.html', 'Browse hotels in Oslo, Norway.', 45, 'oslo', 'oslo oslo norway browse hotels in oslo, norway.  city'),
  (46, 'Oulu', 'Finland', 'oulu.html', 'Browse hotels in Oulu, Finland.', 46, 'oulu', 'oulu oulu finland browse hotels in oulu, finland.  city'),
  (47, 'Panevėžys', 'Lithuania', 'panevėžys.html', 'Browse hotels in Panevėžys, Lithuania.', 47, 'panevezys', 'panevezys panevezys lithuania browse hotels in panevezys, lithuania.  city'),
  (48, 'Pärnu', 'Estonia', 'pärnu.html', 'Browse hotels in Pärnu, Estonia.', 48, 'parnu', 'parnu parnu estonia browse hotels in parnu, estonia.  city'),
  (49, 'Pitlochry', 'Scotland', 'pitlochry.html', 'Browse hotels in Pitlochry, Scotland.', 49, 'pitlochry', 'pitlochry pitlochry scotland browse hotels in pitlochry, scotland.  city'),
  (50, 'Portree', 'Scotland', 'portree.html', 'Browse hotels in Portree, Scotland.', 50, 'portree', 'portree portree scotland browse hotels in portree, scotland.  city'),
  (51, 'Reykjanesbær', 'Iceland', 'reykjanesbær.html', 'Browse hotels in Reykjanesbær, Iceland.', 51, 'reykjanesbaer', 'reykjanesbaer reykjanesbaer iceland browse hotels in reykjanesbaer, iceland.  city'),
  (52, 'Reykjavík', 'Iceland', 'reykjavík.html', 'Browse hotels in Reykjavík, Iceland.', 52, 'reykjavik', 'reykjavik reykjavik iceland browse hotels in reykjavik, iceland.  city'),
  (53, 'Riga', 'Latvia', 'riga.html', 'Browse hotels in Riga, Latvia.', 53, 'riga', 'riga riga latvia browse hotels in riga, latvia.  city'),
  (54, 'Rovaniemi', 'Finland', 'rovaniemi.html', 'Browse hotels in Rovaniemi, Finland.', 54, 'rovaniemi', 'rovaniemi rovaniemi finland browse hotels in rovaniemi, finland.  city'),
  (55, 'Sauðárkrókur', 'Iceland', 'sauðárkrókur.html', 'Browse hotels in Sauðárkrókur, Iceland.', 55, 'saudarkrokur', 'saudarkrokur saudarkrokur iceland browse hotels in saudarkrokur, iceland.  city'),
  (56, 'Šiauliai', 'Lithuania', 'šiauliai.htm', 'Browse hotels in Šiauliai, Lithuania.', 56, 'siauliai', 'siauliai siauliai lithuania browse hotels in siauliai, lithuania.  city'),
  (57, 'St Andrews', 'Scotland', 'st-andrews.html', 'Browse hotels in St Andrews, Scotland.', 57, 'st andrews', 'st andrews st andrews scotland browse hotels in st andrews, scotland.  city'),
  (58, 'Stavanger', 'Norway', 'stavanger.html', 'Browse hotels in Stavanger, Norway.', 58, 'stavanger', 'stavanger stavanger norway browse hotels in stavanger, norway.  city'),
  (59, 'Stirling', 'Scotland', 'stirling.html', 'Browse hotels in Stirling, Scotland.', 59, 'stirling', 'stirling stirling scotland browse hotels in stirling, scotland.  city'),
  (60, 'Stockholm', 'Sweden', 'stockholm.html', 'Browse hotels in Stockholm, Sweden.', 60, 'stockholm', 'stockholm stockholm sweden browse hotels in stockholm, sweden.  city'),
  (61, 'Stornoway', 'Scotland', 'stornoway.html', 'Browse hotels in Stornoway, Scotland.', 61, 'stornoway', 'stornoway stornoway scotland browse hotels in stornoway, scotland.  city'),
  (62, 'Tallinn', 'Estonia', 'tallinn.html', 'Browse hotels in Tallinn, Estonia.', 62, 'tallinn', 'tallinn tallinn estonia browse hotels in tallinn, estonia.  city'),
  (63, 'Tampere', 'Finland', 'tampere.html', 'Browse hotels in Tampere, Finland.', 63, 'tampere', 'tampere tampere finland browse hotels in tampere, finland.  city'),
  (64, 'Tartu', 'Estonia', 'tartu.html', 'Browse hotels in Tartu, Estonia.', 64, 'tartu', 'tartu tartu estonia browse hotels in tartu, estonia.  city'),
  (65, 'Tórshavn', 'Faroe Islands', 'tórshavn.html', 'Browse hotels in Tórshavn, Faroe Islands.', 65, 'torshavn', 'torshavn torshavn faroe islands browse hotels in torshavn, faroe islands.  city'),
  (66, 'Tromsø', 'Norway', 'tromso.html', 'Browse hotels in Tromsø, Norway.', 66, 'tromso', 'tromso tromso norway browse hotels in tromso, norway.  city'),
  (67, 'Trondheim', 'Norway', 'trondheim.html', 'Browse hotels in Trondheim, Norway.', 67, 'trondheim', 'trondheim trondheim norway browse hotels in trondheim, norway.  city'),
  (68, 'Turku', 'Finland', 'turku.html', 'Browse hotels in Turku, Finland.', 68, 'turku', 'turku turku finland browse hotels in turku, finland.  city'),
  (69, 'Ullapool', 'Scotland', 'ullapool.html', 'Browse hotels in Ullapool, Scotland.', 69, 'ullapool', 'ullapool ullapool scotland browse hotels in ullapool, scotland.  city'),
  (70, 'Uppsala', 'Sweden', 'uppsala.html', 'Browse hotels in Uppsala, Sweden.', 70, 'uppsala', 'uppsala uppsala sweden browse hotels in uppsala, sweden.  city'),
  (71, 'Vestmannaeyjar', 'Iceland', 'vestmannaeyjar.html', 'Browse hotels in Vestmannaeyjar, Iceland.', 71, 'vestmannaeyjar', 'vestmannaeyjar vestmannaeyjar iceland browse hotels in vestmannaeyjar, iceland.  city'),
  (72, 'Viljandi', 'Estonia', 'viljandi.html', 'Browse hotels in Viljandi, Estonia.', 72, 'viljandi', 'viljandi viljandi estonia browse hotels in viljandi, estonia.  city'),
  (73, 'Vilnius', 'Lithuania', 'vilnius.html', 'Browse hotels in Vilnius, Lithuania.', 73, 'vilnius', 'vilnius vilnius lithuania browse hotels in vilnius, lithuania.  city'),
  (74, 'Nida', 'Lithuania', NULL, 'Browse hotels in Nida, Lithuania.', 74, 'nida', 'nida nida lithuania browse hotels in nida, lithuania.  city'),
  (75, 'Barentsburg', 'Svalbard', NULL, 'Browse hotels in Barentsburg, Svalbard.', 75, 'barentsburg', 'barentsburg barentsburg svalbard browse hotels in barentsburg, svalbard.  city'),
  (76, 'Pyramiden', 'Svalbard', NULL, 'Browse hotels in Pyramiden, Svalbard.', 76, 'pyramiden', 'pyramiden pyramiden svalbard browse hotels in pyramiden, svalbard.  city'),
  (77, 'Palanga', 'Lithuania', NULL, 'Browse hotels in Palanga, Lithuania.', 77, 'palanga', 'palanga palanga lithuania browse hotels in palanga, lithuania.  city'),
  (78, 'Druskininkai', 'Lithuania', NULL, 'Browse hotels in Druskininkai, Lithuania.', 78, 'druskininkai', 'druskininkai druskininkai lithuania browse hotels in druskininkai, lithuania.  city'),
  (79, 'Trakai', 'Lithuania', NULL, 'Browse hotels in Trakai, Lithuania.', 79, 'trakai', 'trakai trakai lithuania browse hotels in trakai, lithuania.  city'),
  (80, 'Porvoo', 'Finland', NULL, 'Browse hotels in Porvoo, Finland.', 80, 'porvoo', 'porvoo porvoo finland browse hotels in porvoo, finland.  city'),
  (81, 'Kuopio', 'Finland', NULL, 'Browse hotels in Kuopio, Finland.', 81, 'kuopio', 'kuopio kuopio finland browse hotels in kuopio, finland.  city'),
  (82, 'Savonlinna', 'Finland', NULL, 'Browse hotels in Savonlinna, Finland.', 82, 'savonlinna', 'savonlinna savonlinna finland browse hotels in savonlinna, finland.  city'),
  (83, 'Jukkasjärvi', 'Sweden', NULL, 'Browse hotels in Jukkasjärvi, Sweden.', 83, 'jukkasjarvi', 'jukkasjarvi jukkasjarvi sweden browse hotels in jukkasjarvi, sweden.  city'),
  (84, 'Gjógv', 'Faroe Islands', NULL, 'Browse hotels in Gjógv, Faroe Islands.', 84, 'gjogv', 'gjogv gjogv faroe islands browse hotels in gjogv, faroe islands.  city'),
  (85, 'Saksun', 'Faroe Islands', NULL, 'Browse hotels in Saksun, Faroe Islands.', 85, 'saksun', 'saksun saksun faroe islands browse hotels in saksun, faroe islands.  city'),
  (86, 'Mykines', 'Faroe Islands', NULL, 'Browse hotels in Mykines, Faroe Islands.', 86, 'mykines', 'mykines mykines faroe islands browse hotels in mykines, faroe islands.  city'),
  (87, 'Nólsoy', 'Faroe Islands', NULL, 'Browse hotels in Nólsoy, Faroe Islands.', 87, 'nolsoy', 'nolsoy nolsoy faroe islands browse hotels in nolsoy, faroe islands.  city'),
  (88, 'Vágar', 'Faroe Islands', NULL, 'Browse hotels in Vágar, Faroe Islands.', 88, 'vagar', 'vagar vagar faroe islands browse hotels in vagar, faroe islands.  city'),
  (89, 'Streymoy', 'Faroe Islands', NULL, 'Browse hotels in Streymoy, Faroe Islands.', 89, 'streymoy', 'streymoy streymoy faroe islands browse hotels in streymoy, faroe islands.  city'),
  (90, 'Eysturoy', 'Faroe Islands', NULL, 'Browse hotels in Eysturoy, Faroe Islands.', 90, 'eysturoy', 'eysturoy eysturoy faroe islands browse hotels in eysturoy, faroe islands.  city'),
  (91, 'Ny-Ålesund', 'Svalbard', NULL, 'Browse hotels in Ny-Ålesund, Svalbard.', 91, 'ny-alesund', 'ny-alesund ny-alesund svalbard browse hotels in ny-alesund, svalbard.  city'),
  (92, 'Kastelholm', 'Åland Islands', NULL, 'Browse hotels in Kastelholm, Åland Islands.', 92, 'kastelholm', 'kastelholm kastelholm aland islands browse hotels in kastelholm, aland islands.  city'),
  (93, 'Bomarsund', 'Åland Islands', NULL, 'Browse hotels in Bomarsund, Åland Islands.', 93, 'bomarsund', 'bomarsund bomarsund aland islands browse hotels in bomarsund, aland islands.  city'),
  (94, 'Isle of Skye', 'Scotland', NULL, 'Browse hotels in Isle of Skye, Scotland.', 94, 'isle of skye', 'isle of skye isle of skye scotland browse hotels in isle of skye, scotland.  city'),
  (95, 'Kirkwall', 'Scotland', NULL, 'Browse hotels in Kirkwall, Scotland.', 95, 'kirkwall', 'kirkwall kirkwall scotland browse hotels in kirkwall, scotland.  city'),
  (96, 'Tobermory', 'Scotland', NULL, 'Browse hotels in Tobermory, Scotland.', 96, 'tobermory', 'tobermory tobermory scotland browse hotels in tobermory, scotland.  city'),
  (97, 'Uist', 'Scotland', NULL, 'Browse hotels in Uist, Scotland.', 97, 'uist', 'uist uist scotland browse hotels in uist, scotland.  city'),
  (98, 'Tarbert (Harris)', 'Scotland', NULL, 'Browse hotels in Tarbert (Harris), Scotland.', 98, 'tarbert (harris)', 'tarbert (harris) tarbert (harris) scotland browse hotels in tarbert (harris), scotland.  city'),
  (99, 'Uig', 'Scotland', NULL, 'Browse hotels in Uig, Scotland.', 99, 'uig', 'uig uig scotland browse hotels in uig, scotland.  city'),
  (100, 'Dunvegan', 'Scotland', NULL, 'Browse hotels in Dunvegan, Scotland.', 100, 'dunvegan', 'dunvegan dunvegan scotland browse hotels in dunvegan, scotland.  city'),
  (101, 'Broadford', 'Scotland', NULL, 'Browse hotels in Broadford, Scotland.', 101, 'broadford', 'broadford broadford scotland browse hotels in broadford, scotland.  city'),
  (102, 'Armadale', 'Scotland', NULL, 'Browse hotels in Armadale, Scotland.', 102, 'armadale', 'armadale armadale scotland browse hotels in armadale, scotland.  city'),
  (103, 'Lochmaddy', 'Scotland', NULL, 'Browse hotels in Lochmaddy, Scotland.', 103, 'lochmaddy', 'lochmaddy lochmaddy scotland browse hotels in lochmaddy, scotland.  city');

INSERT INTO hotels (
  id, city_id, name, page_url, image_url, price_label, price_eth, description,
  sort_order, name_key, label_key, search_text
) VALUES
  (1, 2, 'Comwell Aarhus', 'comwell-aarhus.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Contemporary comfort with panoramic city views, perfect for business or leisure travelers.', 1, 'comwell aarhus', 'comwell aarhus — aarhus', 'comwell aarhus aarhus denmark contemporary comfort with panoramic city views, perfect for business or leisure travelers. 0.06 eth / night hotel'),
  (2, 2, 'Hotel Royal Aarhus', 'hotel-royal-aarhus.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Luxury hotel in the heart of Aarhus, featuring elegant rooms, gourmet restaurant, and spa services.', 2, 'hotel royal aarhus', 'hotel royal aarhus — aarhus', 'hotel royal aarhus aarhus denmark luxury hotel in the heart of aarhus, featuring elegant rooms, gourmet restaurant, and spa services. 0.08 eth / night hotel'),
  (3, 2, 'Scandic Aarhus City', 'scandic-aarhus-city.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Modern amenities and eco-friendly design, located in the vibrant city center with easy access to attractions.', 3, 'scandic aarhus city', 'scandic aarhus city — aarhus', 'scandic aarhus city aarhus denmark modern amenities and eco-friendly design, located in the vibrant city center with easy access to attractions. 0.05 eth / night hotel'),
  (4, 3, 'Mercure Aberdeen Caledonian', 'mercure-aberdeen-caledonian.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Classic city-centre hotel close to Union Street and the harbour.', 4, 'mercure aberdeen caledonian', 'mercure aberdeen caledonian — aberdeen', 'mercure aberdeen caledonian aberdeen scotland classic city-centre hotel close to union street and the harbour. 0.05 eth / night hotel'),
  (5, 3, 'Sandman Signature Aberdeen', 'sandman-signature-aberdeen.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern hotel near the beach and Aberdeen’s exhibition centre.', 5, 'sandman signature aberdeen', 'sandman signature aberdeen — aberdeen', 'sandman signature aberdeen aberdeen scotland modern hotel near the beach and aberdeens exhibition centre. 0.06 eth / night hotel'),
  (6, 3, 'The Marcliffe Hotel and Spa', 'the-marcliffe-hotel-and-spa.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Country-house luxury on the edge of Aberdeen with gardens and spa.', 6, 'the marcliffe hotel and spa', 'the marcliffe hotel and spa — aberdeen', 'the marcliffe hotel and spa aberdeen scotland country-house luxury on the edge of aberdeen with gardens and spa. 0.09 eth / night hotel'),
  (7, 4, 'Abisko Mountain Lodge', 'abisko-mountain-lodge.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Trailside lodge in Abisko, a base for the Kungsleden and clear winter nights.', 7, 'abisko mountain lodge', 'abisko mountain lodge — abisko', 'abisko mountain lodge abisko sweden trailside lodge in abisko, a base for the kungsleden and clear winter nights. 0.08 eth / night hotel'),
  (8, 4, 'Björkliden Mountain Lodge', 'bjorkliden-mountain-lodge.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Ski lodge at Björkliden, on the railway between Abisko and the Norwegian border.', 8, 'bjorkliden mountain lodge', 'bjorkliden mountain lodge — abisko', 'bjorkliden mountain lodge abisko sweden ski lodge at bjorkliden, on the railway between abisko and the norwegian border. 0.09 eth / night hotel'),
  (9, 4, 'STF Abisko Turiststation', 'stf-abisko-turiststation.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Mountain station where the Kungsleden begins, above the Abisko river and the lake.', 9, 'stf abisko turiststation', 'stf abisko turiststation — abisko', 'stf abisko turiststation abisko sweden mountain station where the kungsleden begins, above the abisko river and the lake. 0.07 eth / night hotel'),
  (10, 5, 'Hotel Kea', 'hotel-kea.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Long-standing harbour hotel facing the fjord, steps from the church and downtown cafés.', 10, 'hotel kea', 'hotel kea — akureyri', 'hotel kea akureyri iceland long-standing harbour hotel facing the fjord, steps from the church and downtown cafes. 0.09 eth / night hotel'),
  (11, 5, 'Hotel Nordurland', 'hotel-nordurland.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Compact central hotel on Hafnarstræti, a practical base for north-Iceland day trips.', 11, 'hotel nordurland', 'hotel nordurland — akureyri', 'hotel nordurland akureyri iceland compact central hotel on hafnarstraeti, a practical base for north-iceland day trips. 0.05 eth / night hotel'),
  (12, 7, 'Hotel Bauska', 'hotel-bauska.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Town-centre hotel a short walk from Bauska Castle and the Mēmele river promenade.', 12, 'hotel bauska', 'hotel bauska — bauska', 'hotel bauska bauska latvia town-centre hotel a short walk from bauska castle and the memele river promenade. 0.05 eth / night hotel'),
  (13, 7, 'Bauska Castle Hotel', 'bauska-castle-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stay beside the castle ruins, with views over the Mūsa and Mēmele confluence.', 13, 'bauska castle hotel', 'bauska castle hotel — bauska', 'bauska castle hotel bauska latvia stay beside the castle ruins, with views over the musa and memele confluence. 0.06 eth / night hotel'),
  (14, 5, 'Icelandair Hotel Akureyri', 'icelandair-hotel-akureyri.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.075 ETH / night', 0.075, 'Contemporary hotel near the botanical garden, with views toward the ski slopes.', 14, 'icelandair hotel akureyri', 'icelandair hotel akureyri — akureyri', 'icelandair hotel akureyri akureyri iceland contemporary hotel near the botanical garden, with views toward the ski slopes. 0.075 eth / night hotel'),
  (15, 6, 'Cairngorm Hotel', 'cairngorm-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'High Street hotel in Aviemore, a base for the Cairngorm plateau.', 15, 'cairngorm hotel', 'cairngorm hotel — aviemore', 'cairngorm hotel aviemore scotland high street hotel in aviemore, a base for the cairngorm plateau. 0.08 eth / night hotel'),
  (16, 6, 'Rothiemurchus Lodge', 'rothiemurchus-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Forest lodge on the edge of Aviemore, beside the Rothiemurchus pines.', 16, 'rothiemurchus lodge', 'rothiemurchus lodge — aviemore', 'rothiemurchus lodge aviemore scotland forest lodge on the edge of aviemore, beside the rothiemurchus pines. 0.07 eth / night hotel'),
  (17, 6, 'Spey Valley Hotel', 'spey-valley-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Riverside hotel in Aviemore, looking toward the Spey and the mountain railway.', 17, 'spey valley hotel', 'spey valley hotel — aviemore', 'spey valley hotel aviemore scotland riverside hotel in aviemore, looking toward the spey and the mountain railway. 0.06 eth / night hotel'),
  (18, 8, 'Clarion Hotel Admiral', 'clarion-hotel-admiral.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel facing Bryggen, with harbour-view rooms and a rooftop restaurant.', 18, 'clarion hotel admiral', 'clarion hotel admiral — bergen', 'clarion hotel admiral bergen norway waterfront hotel facing bryggen, with harbour-view rooms and a rooftop restaurant. 0.09 eth / night hotel'),
  (19, 8, 'Hotel Norge by Scandic', 'hotel-norge-by-scandic.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.1 ETH / night', 0.1, 'Rebuilt city-centre icon on Ole Bulls plass, a short walk from the fish market.', 19, 'hotel norge by scandic', 'hotel norge by scandic — bergen', 'hotel norge by scandic bergen norway rebuilt city-centre icon on ole bulls plass, a short walk from the fish market. 0.1 eth / night hotel'),
  (20, 8, 'Steens Hotel', 'steens-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Intimate Swiss-chalet style guesthouse near Nygårdsparken, handy for the funicular.', 20, 'steens hotel', 'steens hotel — bergen', 'steens hotel bergen norway intimate swiss-chalet style guesthouse near nygardsparken, handy for the funicular. 0.06 eth / night hotel'),
  (21, 9, 'Marshall Meadows Country House', 'marshall-meadows-country-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Georgian country house on the coast just north of town, with sea views and period rooms.', 21, 'marshall meadows country house', 'marshall meadows country house — berwick-upon-tweed', 'marshall meadows country house berwick-upon-tweed northeast england georgian country house on the coast just north of town, with sea views and period rooms. 0.05 eth / night hotel'),
  (22, 9, 'The King’s Arms Hotel', 'the-kings-arms-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Historic coaching inn in the town centre, a short walk from the Elizabethan walls.', 22, 'the kings arms hotel', 'the kings arms hotel — berwick-upon-tweed', 'the kings arms hotel berwick-upon-tweed northeast england historic coaching inn in the town centre, a short walk from the elizabethan walls. 0.04 eth / night hotel'),
  (23, 9, 'The Walls Guest House', 'the-walls-guest-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Friendly townhouse stay beside Berwick’s ramparts, close to the Tweed estuary.', 23, 'the walls guest house', 'the walls guest house — berwick-upon-tweed', 'the walls guest house berwick-upon-tweed northeast england friendly townhouse stay beside berwicks ramparts, close to the tweed estuary. 0.03 eth / night hotel'),
  (24, 10, 'CABINN City', 'cabinn-city.html', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80', '0.021 ETH / night', 0.021, '', 24, 'cabinn city', 'cabinn city — copenhagen', 'cabinn city copenhagen denmark  0.021 eth / night hotel'),
  (25, 10, 'Comwell Copenhagen Portside', 'comwell-copenhagen-portside.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80', '0.038 ETH / night', 0.038, '', 25, 'comwell copenhagen portside', 'comwell copenhagen portside — copenhagen', 'comwell copenhagen portside copenhagen denmark  0.038 eth / night hotel'),
  (26, 10, 'First Hotel Kong Frederik', 'first-hotel-kong-frederik.html', 'https://images.unsplash.com/photo-1504609813445-554e64a8f005?auto=format&fit=crop&w=600&q=80', '0.033 ETH / night', 0.033, 'Back to Booking', 26, 'first hotel kong frederik', 'first hotel kong frederik — copenhagen', 'first hotel kong frederik copenhagen denmark back to booking 0.033 eth / night hotel'),
  (27, 10, 'Imperial Hotel', 'imperial-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80', '0.045 ETH / night', 0.045, '', 27, 'imperial hotel', 'imperial hotel — copenhagen', 'imperial hotel copenhagen denmark  0.045 eth / night hotel'),
  (28, 10, 'Scandic Palace Hotel', 'scandic-copenhagen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', '0.042 ETH / night', 0.042, '', 28, 'scandic palace hotel', 'scandic palace hotel — copenhagen', 'scandic palace hotel copenhagen denmark  0.042 eth / night hotel'),
  (29, 10, 'Zleep Hotel Copenhagen City', 'zleep-hotel-copenhagen-city.html', 'https://images.unsplash.com/photo-1454023492550-5696f8ff10e1?auto=format&fit=crop&w=600&q=80', '0.027 ETH / night', 0.027, '', 29, 'zleep hotel copenhagen city', 'zleep hotel copenhagen city — copenhagen', 'zleep hotel copenhagen city copenhagen denmark  0.027 eth / night hotel'),
  (30, 10, 'Hotel d’Angleterre', 'hotel-dangleterre-copenhagen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=600&q=80', '0.12 ETH / night', 0.12, 'Historic five-star hotel on Kongens Nytorv, with luxury amenities and fine dining.', 30, 'hotel dangleterre', 'hotel dangleterre — copenhagen', 'hotel dangleterre copenhagen denmark historic five-star hotel on kongens nytorv, with luxury amenities and fine dining. 0.12 eth / night hotel'),
  (31, 11, 'Biplan Hotel', 'biplan-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.025 ETH / night', 0.025, 'Budget-friendly hotel with cozy rooms and a convenient location.', 31, 'biplan hotel', 'biplan hotel — daugavpils', 'biplan hotel daugavpils latvia budget-friendly hotel with cozy rooms and a convenient location. 0.025 eth / night hotel'),
  (32, 11, 'Hotel Dinaburg', 'hotel-dinaburg.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Comfortable rooms, restaurant, and wellness area close to Daugavpils fortress.', 32, 'hotel dinaburg', 'hotel dinaburg — daugavpils', 'hotel dinaburg daugavpils latvia comfortable rooms, restaurant, and wellness area close to daugavpils fortress. 0.03 eth / night hotel'),
  (33, 11, 'Park Hotel Latgola', 'park-hotel-latgola.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Modern hotel in the city center with panoramic views and conference facilities.', 33, 'park hotel latgola', 'park hotel latgola — daugavpils', 'park hotel latgola daugavpils latvia modern hotel in the city center with panoramic views and conference facilities. 0.04 eth / night hotel'),
  (34, 12, 'Apex City Quay Hotel & Spa', 'apex-city-quay-hotel-and-spa.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel on Dundee’s City Quay with spa and easy access to the V&A.', 34, 'apex city quay hotel & spa', 'apex city quay hotel & spa — dundee', 'apex city quay hotel & spa dundee scotland waterfront hotel on dundees city quay with spa and easy access to the v&a. 0.07 eth / night hotel'),
  (35, 12, 'Hotel Indigo Dundee', 'hotel-indigo-dundee.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Design hotel in a historic jute mill near Dundee city centre.', 35, 'hotel indigo dundee', 'hotel indigo dundee — dundee', 'hotel indigo dundee dundee scotland design hotel in a historic jute mill near dundee city centre. 0.055 eth / night hotel'),
  (36, 12, 'Malmaison Dundee', 'malmaison-dundee.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Characterful hotel in a converted church, walking distance from the waterfront.', 36, 'malmaison dundee', 'malmaison dundee — dundee', 'malmaison dundee dundee scotland characterful hotel in a converted church, walking distance from the waterfront. 0.06 eth / night hotel'),
  (37, 13, 'Hotel du Vin Edinburgh', 'hotel-du-vin-edinburgh.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Boutique townhouse hotel in the Old Town, close to the Royal Mile.', 37, 'hotel du vin edinburgh', 'hotel du vin edinburgh — edinburgh', 'hotel du vin edinburgh edinburgh scotland boutique townhouse hotel in the old town, close to the royal mile. 0.08 eth / night hotel'),
  (38, 13, 'The Balmoral', 'the-balmoral.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Historic luxury hotel on Princes Street, steps from Waverley Station and Edinburgh Castle.', 38, 'the balmoral', 'the balmoral — edinburgh', 'the balmoral edinburgh scotland historic luxury hotel on princes street, steps from waverley station and edinburgh castle. 0.14 eth / night hotel'),
  (39, 13, 'Waldorf Astoria Edinburgh', 'waldorf-astoria-edinburgh.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Grand landmark hotel at the west end of Princes Street with spa and castle views.', 39, 'waldorf astoria edinburgh', 'waldorf astoria edinburgh — edinburgh', 'waldorf astoria edinburgh edinburgh scotland grand landmark hotel at the west end of princes street with spa and castle views. 0.12 eth / night hotel'),
  (40, 14, 'Hotel Ansgar', 'hotel-ansgar.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80', '0.025 ETH / night', 0, 'Back to Booking', 40, 'hotel ansgar', 'hotel ansgar — esbjerg', 'hotel ansgar esbjerg denmark back to booking 0.025 eth / night hotel'),
  (41, 14, 'Hotel Britannia', 'hotel-britannia.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', '0.035 ETH / night', 0, '', 41, 'hotel britannia', 'hotel britannia — esbjerg', 'hotel britannia esbjerg denmark  0.035 eth / night hotel'),
  (42, 14, 'Scandic Olympic', 'scandic-olympic.html', 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80', '0.029 ETH / night', 0, '', 42, 'scandic olympic', 'scandic olympic — esbjerg', 'scandic olympic esbjerg denmark  0.029 eth / night hotel'),
  (43, 15, 'Glo Hotel Sello', 'glo-hotel-sello.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary hotel next to Sello shopping center, great for families and business.', 43, 'glo hotel sello', 'glo hotel sello — espoo', 'glo hotel sello espoo finland contemporary hotel next to sello shopping center, great for families and business. 0.08 eth / night hotel'),
  (44, 15, 'Hotel Matts', 'hotel-matts.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern hotel in Espoo offering stylish rooms and apartments.', 44, 'hotel matts', 'hotel matts — espoo', 'hotel matts espoo finland modern hotel in espoo offering stylish rooms and apartments. 0.07 eth / night hotel'),
  (45, 15, 'Radisson Blu Hotel Espoo', 'radisson-blu-hotel-espoo.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel with excellent meeting facilities and nature access.', 45, 'radisson blu hotel espoo', 'radisson blu hotel espoo — espoo', 'radisson blu hotel espoo espoo finland waterfront hotel with excellent meeting facilities and nature access. 0.09 eth / night hotel'),
  (46, 16, 'Alexandra Hotel', 'alexandra-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'High Street hotel in Fort William, facing the parade toward Loch Linnhe.', 46, 'alexandra hotel', 'alexandra hotel — fort william', 'alexandra hotel fort william scotland high street hotel in fort william, facing the parade toward loch linnhe. 0.06 eth / night hotel'),
  (47, 16, 'Ben Nevis Lodge', 'ben-nevis-lodge.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Highland lodge in Fort William, with glen views and a path toward Ben Nevis.', 47, 'ben nevis lodge', 'ben nevis lodge — fort william', 'ben nevis lodge fort william scotland highland lodge in fort william, with glen views and a path toward ben nevis. 0.07 eth / night hotel'),
  (48, 16, 'The Lime Tree Hotel', 'the-lime-tree-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town-centre hotel in Fort William, a short walk from the High Street and the loch.', 48, 'the lime tree hotel', 'the lime tree hotel — fort william', 'the lime tree hotel fort william scotland town-centre hotel in fort william, a short walk from the high street and the loch. 0.08 eth / night hotel'),
  (49, 17, 'Kimpton Blythswood Square', 'kimpton-blythswood-square.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Elegant Georgian square hotel with spa in the heart of Glasgow.', 49, 'kimpton blythswood square', 'kimpton blythswood square — glasgow', 'kimpton blythswood square glasgow scotland elegant georgian square hotel with spa in the heart of glasgow. 0.10 eth / night hotel'),
  (50, 17, 'Motel One Glasgow', 'motel-one-glasgow.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Stylish budget-friendly stay on Argyle Street near the River Clyde.', 50, 'motel one glasgow', 'motel one glasgow — glasgow', 'motel one glasgow glasgow scotland stylish budget-friendly stay on argyle street near the river clyde. 0.04 eth / night hotel'),
  (51, 17, 'Radisson Blu Hotel, Glasgow', 'radisson-blu-hotel-glasgow.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Contemporary hotel beside Glasgow Central Station, ideal for exploring the city.', 51, 'radisson blu hotel, glasgow', 'radisson blu hotel, glasgow — glasgow', 'radisson blu hotel, glasgow glasgow scotland contemporary hotel beside glasgow central station, ideal for exploring the city. 0.07 eth / night hotel'),
  (52, 18, 'Clarion Hotel Post', 'clarion-hotel-post.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Converted central post office with a rooftop pool, next to Drottningtorget and the station.', 52, 'clarion hotel post', 'clarion hotel post — gothenburg', 'clarion hotel post gothenburg sweden converted central post office with a rooftop pool, next to drottningtorget and the station. 0.08 eth / night hotel'),
  (53, 18, 'Hotel Eggers', 'hotel-eggers.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Classic 19th-century hotel by the railway station, close to Avenyn and the opera.', 53, 'hotel eggers', 'hotel eggers — gothenburg', 'hotel eggers gothenburg sweden classic 19th-century hotel by the railway station, close to avenyn and the opera. 0.06 eth / night hotel'),
  (54, 18, 'Upper House', 'upper-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Design hotel high above Liseberg with a spa, skyline views, and Nordic cuisine.', 54, 'upper house', 'upper house — gothenburg', 'upper house gothenburg sweden design hotel high above liseberg with a spa, skyline views, and nordic cuisine. 0.12 eth / night hotel'),
  (55, 19, 'Helguhús Guesthouse', 'helguhus-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Homely guesthouse in a quiet neighbourhood, a short drive from the capital.', 55, 'helguhus guesthouse', 'helguhus guesthouse — hafnarfjordur', 'helguhus guesthouse hafnarfjordur iceland homely guesthouse in a quiet neighbourhood, a short drive from the capital. 0.035 eth / night hotel'),
  (56, 19, 'Hótel Hafnarfjörður', 'hotel-hafnarfjordur.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Straightforward town hotel close to the lava fields, harbour, and Reykjavík bus routes.', 56, 'hotel hafnarfjordur', 'hotel hafnarfjordur — hafnarfjordur', 'hotel hafnarfjordur hafnarfjordur iceland straightforward town hotel close to the lava fields, harbour, and reykjavik bus routes. 0.05 eth / night hotel'),
  (57, 19, 'Hotel Viking', 'hotel-viking.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.065 ETH / night', 0.065, 'Characterful harbour hotel with Norse-inspired interiors and a popular restaurant.', 57, 'hotel viking', 'hotel viking — hafnarfjordur', 'hotel viking hafnarfjordur iceland characterful harbour hotel with norse-inspired interiors and a popular restaurant. 0.065 eth / night hotel'),
  (58, 20, 'Hotel Helka', 'hotel-helka-helsinki.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stylish boutique hotel with Finnish design and cozy atmosphere.', 58, 'hotel helka', 'hotel helka — helsinki', 'hotel helka helsinki finland stylish boutique hotel with finnish design and cozy atmosphere. 0.06 eth / night hotel'),
  (59, 20, 'Hotel Kämp', 'hotel-kamp-helsinki.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Historic luxury hotel in the heart of Helsinki with elegant rooms and spa.', 59, 'hotel kamp', 'hotel kamp — helsinki', 'hotel kamp helsinki finland historic luxury hotel in the heart of helsinki with elegant rooms and spa. 0.13 eth / night hotel'),
  (60, 20, 'Scandic Grand Central', 'scandic-grand-central-helsinki.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary hotel next to Helsinki Central Station, great for exploring the city.', 60, 'scandic grand central', 'scandic grand central — helsinki', 'scandic grand central helsinki finland contemporary hotel next to helsinki central station, great for exploring the city. 0.08 eth / night hotel'),
  (61, 22, 'Glen Mhor Hotel', 'glen-mhor-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Riverside hotel with restaurant, close to Inverness Castle.', 61, 'glen mhor hotel', 'glen mhor hotel — inverness', 'glen mhor hotel inverness scotland riverside hotel with restaurant, close to inverness castle. 0.05 eth / night hotel'),
  (62, 22, 'Kingsmills Hotel', 'kingsmills-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Highland hotel with gardens and golf, a short walk from Inverness city centre.', 62, 'kingsmills hotel', 'kingsmills hotel — inverness', 'kingsmills hotel inverness scotland highland hotel with gardens and golf, a short walk from inverness city centre. 0.08 eth / night hotel'),
  (63, 22, 'Rocpool Reserve Hotel', 'rocpool-reserve-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Boutique luxury stay overlooking the River Ness.', 63, 'rocpool reserve hotel', 'rocpool reserve hotel — inverness', 'rocpool reserve hotel inverness scotland boutique luxury stay overlooking the river ness. 0.09 eth / night hotel'),
  (64, 21, 'Hotel Arctic', 'hotel-arctic.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Clifftop hotel above the UNESCO icefjord, with midnight-sun terraces and views of drifting icebergs.', 64, 'hotel arctic', 'hotel arctic — ilulissat', 'hotel arctic ilulissat greenland clifftop hotel above the unesco icefjord, with midnight-sun terraces and views of drifting icebergs. 0.14 eth / night hotel'),
  (65, 21, 'Hotel Icefiord', 'hotel-icefiord.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Harbour hotel facing Disko Bay, steps from boat departures into the icefjord.', 65, 'hotel icefiord', 'hotel icefiord — ilulissat', 'hotel icefiord ilulissat greenland harbour hotel facing disko bay, steps from boat departures into the icefjord. 0.12 eth / night hotel'),
  (66, 21, 'Hotel Hvide Falk', 'hotel-hvide-falk.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Town-centre base for dogsled trips, whale watching, and walks to the Sermermiut valley.', 66, 'hotel hvide falk', 'hotel hvide falk — ilulissat', 'hotel hvide falk ilulissat greenland town-centre base for dogsled trips, whale watching, and walks to the sermermiut valley. 0.09 eth / night hotel'),
  (67, 23, 'Hótel Ísafjörður', 'hotel-isafjordur.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Ísafjörður, on the Skutulsfjörður waterfront.', 67, 'hotel isafjordur', 'hotel isafjordur — isafjordur', 'hotel isafjordur isafjordur iceland harbour hotel in isafjordur, on the skutulsfjordur waterfront. 0.08 eth / night hotel'),
  (68, 23, 'Hótel Horn', 'hotel-horn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Ísafjörður, a practical base for the Westfjords.', 68, 'hotel horn', 'hotel horn — isafjordur', 'hotel horn isafjordur iceland town hotel in isafjordur, a practical base for the westfjords. 0.07 eth / night hotel'),
  (69, 23, 'Gamla Guesthouse', 'gamla-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Timber guesthouse in the old town of Ísafjörður, a short walk from the harbour.', 69, 'gamla guesthouse', 'gamla guesthouse — isafjordur', 'gamla guesthouse isafjordur iceland timber guesthouse in the old town of isafjordur, a short walk from the harbour. 0.055 eth / night hotel'),
  (70, 24, 'Jelgava Hotel', 'jelgava-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Modern hotel in the city center with comfortable rooms and restaurant.', 70, 'jelgava hotel', 'jelgava hotel — jelgava', 'jelgava hotel jelgava latvia modern hotel in the city center with comfortable rooms and restaurant. 0.04 eth / night hotel'),
  (71, 25, 'Baltic Beach Hotel', 'baltic-beach-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Luxury spa hotel on the beach with beautiful sea views and upscale amenities.', 71, 'baltic beach hotel', 'baltic beach hotel — jurmala', 'baltic beach hotel jurmala latvia luxury spa hotel on the beach with beautiful sea views and upscale amenities. 0.055 eth / night hotel'),
  (72, 25, 'Hotel Jurmala Spa', 'hotel-jurmala-spa.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Modern spa hotel with pools, saunas, and wellness treatments in Jurmala center.', 72, 'hotel jurmala spa', 'hotel jurmala spa — jurmala', 'hotel jurmala spa jurmala latvia modern spa hotel with pools, saunas, and wellness treatments in jurmala center. 0.045 eth / night hotel'),
  (73, 25, 'Villa Joma', 'villa-joma.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Charming boutique hotel near the sea, ideal for a relaxing getaway.', 73, 'villa joma', 'villa joma — jurmala', 'villa joma jurmala latvia charming boutique hotel near the sea, ideal for a relaxing getaway. 0.035 eth / night hotel'),
  (74, 26, 'Hotel Kaunas City', 'hotel-kaunas-city.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.06 ETH / night', 0.06, 'Comfortable city-centre hotel with modern rooms and easy access to Kaunas Old Town and cultural sights.', 74, 'hotel kaunas city', 'hotel kaunas city — kaunas', 'hotel kaunas city kaunas lithuania comfortable city-centre hotel with modern rooms and easy access to kaunas old town and cultural sights. 0.06 eth / night hotel'),
  (75, 26, 'Magnolia Boutique', 'magnolia-boutique.html', 'https://images.unsplash.com/photo-1501118572072-7c5d7d3d47e6?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.05 ETH / night', 0.05, 'Cozy boutique hotel offering an intimate atmosphere, complimentary breakfast and friendly service close to the river.', 75, 'magnolia boutique', 'magnolia boutique — kaunas', 'magnolia boutique kaunas lithuania cozy boutique hotel offering an intimate atmosphere, complimentary breakfast and friendly service close to the river. 0.05 eth / night hotel'),
  (76, 27, 'Hótel Berg', 'hotel-berg.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Keflavík, a short walk from the waterfront and the Viking World museum.', 76, 'hotel berg', 'hotel berg — keflavik', 'hotel berg keflavik iceland harbour hotel in keflavik, a short walk from the waterfront and the viking world museum. 0.07 eth / night hotel'),
  (77, 27, 'Guesthouse 1x6', 'guesthouse-1x6.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse in Keflavík, close to the harbour and the road out to the airport.', 77, 'guesthouse 1x6', 'guesthouse 1x6 — keflavik', 'guesthouse 1x6 keflavik iceland small guesthouse in keflavik, close to the harbour and the road out to the airport. 0.055 eth / night hotel'),
  (78, 27, 'Courtyard by Marriott Reykjavik Keflavik Airport', 'courtyard-by-marriott-reykjavik-keflavik-airport.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Airport hotel beside Keflavík International Airport, convenient for early flights and the Reykjanes coast.', 78, 'courtyard by marriott reykjavik keflavik airport', 'courtyard by marriott reykjavik keflavik airport — keflavik', 'courtyard by marriott reykjavik keflavik airport keflavik iceland airport hotel beside keflavik international airport, convenient for early flights and the reykjanes coast. 0.08 eth / night hotel'),
  (79, 28, 'Camp Ripan', 'camp-ripan.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Arctic spa hotel on the edge of Kiruna, with northern lights views and a base for Kebnekaise trails.', 79, 'camp ripan', 'camp ripan — kiruna', 'camp ripan kiruna sweden arctic spa hotel on the edge of kiruna, with northern lights views and a base for kebnekaise trails. 0.09 eth / night hotel'),
  (80, 28, 'Hotel Arctic Eden', 'hotel-arctic-eden.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lapland-inspired rooms in the town centre, close to Kiruna’s relocated church and new city district.', 80, 'hotel arctic eden', 'hotel arctic eden — kiruna', 'hotel arctic eden kiruna sweden lapland-inspired rooms in the town centre, close to kirunas relocated church and new city district. 0.07 eth / night hotel'),
  (81, 28, 'Scandic Kiruna', 'scandic-kiruna.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Modern hotel near the town centre, handy for aurora trips, Abisko, and the Icehotel in Jukkasjärvi.', 81, 'scandic kiruna', 'scandic kiruna — kiruna', 'scandic kiruna kiruna sweden modern hotel near the town centre, handy for aurora trips, abisko, and the icehotel in jukkasjarvi. 0.08 eth / night hotel'),
  (82, 29, 'Portside Boutique', 'portside-boutique.html', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.05 ETH / night', 0.05, 'Charming boutique hotel in the city centre, close to restaurants, theatres and the Old Town promenade.', 82, 'portside boutique', 'portside boutique — klaipeda', 'portside boutique klaipeda lithuania charming boutique hotel in the city centre, close to restaurants, theatres and the old town promenade. 0.05 eth / night hotel'),
  (83, 29, 'Seaside Harbour Hotel', 'seaside-harbour-hotel.html', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.07 ETH / night', 0.07, 'Seafront hotel with beautiful views of the Baltic Sea, fresh seafood nearby and easy access to the ferry terminal.', 83, 'seaside harbour hotel', 'seaside harbour hotel — klaipeda', 'seaside harbour hotel klaipeda lithuania seafront hotel with beautiful views of the baltic sea, fresh seafood nearby and easy access to the ferry terminal. 0.07 eth / night hotel'),
  (84, 30, 'Hótel Smárinn', 'hotel-smarinn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Practical stay near Smáralind shopping centre, useful for families and longer visits.', 84, 'hotel smarinn', 'hotel smarinn — kopavogur', 'hotel smarinn kopavogur iceland practical stay near smaralind shopping centre, useful for families and longer visits. 0.055 eth / night hotel'),
  (85, 30, 'Hotel Vellir', 'hotel-vellir.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Contemporary hotel in Kópavogur with spacious rooms and quick links into Reykjavík.', 85, 'hotel vellir', 'hotel vellir — kopavogur', 'hotel vellir kopavogur iceland contemporary hotel in kopavogur with spacious rooms and quick links into reykjavik. 0.07 eth / night hotel'),
  (86, 30, 'Kórinn Guesthouse', 'korinn-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Quiet guesthouse-style rooms with easy access to local pools and coastal paths.', 86, 'korinn guesthouse', 'korinn guesthouse — kopavogur', 'korinn guesthouse kopavogur iceland quiet guesthouse-style rooms with easy access to local pools and coastal paths. 0.04 eth / night hotel'),
  (87, 31, 'Clarion Hotel Ernst', 'clarion-hotel-ernst.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Landmark hotel on the main square, a short stroll from the cathedral and fish market.', 87, 'clarion hotel ernst', 'clarion hotel ernst — kristiansand', 'clarion hotel ernst kristiansand norway landmark hotel on the main square, a short stroll from the cathedral and fish market. 0.08 eth / night hotel'),
  (88, 31, 'Scandic Kristiansand Bystranda', 'scandic-kristiansand-bystranda.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Beachfront hotel on Bystranda with a pool, close to the boardwalk and Kilden.', 88, 'scandic kristiansand bystranda', 'scandic kristiansand bystranda — kristiansand', 'scandic kristiansand bystranda kristiansand norway beachfront hotel on bystranda with a pool, close to the boardwalk and kilden. 0.07 eth / night hotel'),
  (89, 31, 'Thon Hotel Wergeland', 'thon-hotel-wergeland.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Compact city hotel beside Wergeland’s park, handy for the Posebyen old town.', 89, 'thon hotel wergeland', 'thon hotel wergeland — kristiansand', 'thon hotel wergeland kristiansand norway compact city hotel beside wergelands park, handy for the posebyen old town. 0.05 eth / night hotel'),
  (90, 32, 'Grand Hotel Lerwick', 'grand-hotel-lerwick.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel beside the harbour, a short walk from Commercial Street.', 90, 'grand hotel lerwick', 'grand hotel lerwick — lerwick', 'grand hotel lerwick lerwick scotland town hotel beside the harbour, a short walk from commercial street. 0.07 eth / night hotel'),
  (91, 32, 'Lerwick Harbour House', 'lerwick-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Waterfront house in Lerwick, close to the lanes and the lodberries.', 91, 'lerwick harbour house', 'lerwick harbour house — lerwick', 'lerwick harbour house lerwick scotland waterfront house in lerwick, close to the lanes and the lodberries. 0.06 eth / night hotel'),
  (92, 32, 'Shetland Hotel', 'shetland-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Lerwick, overlooking the sound and the ferry to Bressay.', 92, 'shetland hotel', 'shetland hotel — lerwick', 'shetland hotel lerwick scotland harbour hotel in lerwick, overlooking the sound and the ferry to bressay. 0.08 eth / night hotel'),
  (93, 33, 'Hotel Kolumbs', 'hotel-kolumbs.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Elegant hotel with spa facilities near the sea and city center.', 93, 'hotel kolumbs', 'hotel kolumbs — liepaja', 'hotel kolumbs liepaja latvia elegant hotel with spa facilities near the sea and city center. 0.035 eth / night hotel'),
  (94, 33, 'Liva Hotel', 'liva-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.025 ETH / night', 0.025, 'Central, affordable hotel ideal for business or leisure travelers.', 94, 'liva hotel', 'liva hotel — liepaja', 'liva hotel liepaja latvia central, affordable hotel ideal for business or leisure travelers. 0.025 eth / night hotel'),
  (95, 33, 'Promenade Hotel', 'promenade-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Luxury hotel set in a historic warehouse with art gallery and gourmet restaurant.', 95, 'promenade hotel', 'promenade hotel — liepaja', 'promenade hotel liepaja latvia luxury hotel set in a historic warehouse with art gallery and gourmet restaurant. 0.05 eth / night hotel'),
  (96, 34, 'Mølla Hotell', 'molla-hotell.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Riverside hotel in a former mill on the Mesna, in the centre of Lillehammer.', 96, 'molla hotell', 'molla hotell — lillehammer', 'molla hotell lillehammer norway riverside hotel in a former mill on the mesna, in the centre of lillehammer. 0.08 eth / night hotel'),
  (97, 34, 'Radisson Blu Lillehammer Hotel', 'radisson-blu-lillehammer-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Lakeside hotel in Lillehammer, below the ski jump and the Olympic park.', 97, 'radisson blu lillehammer hotel', 'radisson blu lillehammer hotel — lillehammer', 'radisson blu lillehammer hotel lillehammer norway lakeside hotel in lillehammer, below the ski jump and the olympic park. 0.09 eth / night hotel'),
  (98, 34, 'Scandic Lillehammer', 'scandic-lillehammer.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Lillehammer, a short walk from the pedestrian street and the station.', 98, 'scandic lillehammer', 'scandic lillehammer — lillehammer', 'scandic lillehammer lillehammer norway town hotel in lillehammer, a short walk from the pedestrian street and the station. 0.07 eth / night hotel'),
  (99, 35, 'Quality Hotel Ekoxen', 'quality-hotel-ekoxen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Well-equipped city hotel with a pool and spa, close to Linköping’s main square.', 99, 'quality hotel ekoxen', 'quality hotel ekoxen — linkoping', 'quality hotel ekoxen linkoping sweden well-equipped city hotel with a pool and spa, close to linkopings main square. 0.06 eth / night hotel'),
  (100, 35, 'Scandic Frimurarehotellet', 'scandic-frimurarehotellet.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Landmark hotel in the city centre with easy access to the cathedral and old town.', 100, 'scandic frimurarehotellet', 'scandic frimurarehotellet — linkoping', 'scandic frimurarehotellet linkoping sweden landmark hotel in the city centre with easy access to the cathedral and old town. 0.05 eth / night hotel'),
  (101, 35, 'Stora Hotellet Linköping', 'stora-hotellet-linkoping.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Classic independent hotel with a restaurant, a short walk from the railway station.', 101, 'stora hotellet linkoping', 'stora hotellet linkoping — linkoping', 'stora hotellet linkoping linkoping sweden classic independent hotel with a restaurant, a short walk from the railway station. 0.045 eth / night hotel'),
  (102, 36, 'The Lodge on Loch Lomond', 'the-lodge-on-loch-lomond.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel in Luss, looking across the loch toward the national park hills.', 102, 'the lodge on loch lomond', 'the lodge on loch lomond — loch lomond national park', 'the lodge on loch lomond loch lomond national park scotland waterfront hotel in luss, looking across the loch toward the national park hills. 0.09 eth / night hotel'),
  (103, 36, 'Cameron House', 'cameron-house.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Lochside resort near Balloch, at the southern gate of Loch Lomond National Park.', 103, 'cameron house', 'cameron house — loch lomond national park', 'cameron house loch lomond national park scotland lochside resort near balloch, at the southern gate of loch lomond national park. 0.12 eth / night hotel'),
  (104, 36, 'Oak Tree Inn', 'oak-tree-inn.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Village inn in Balmaha, where the West Highland Way meets the east shore of the loch.', 104, 'oak tree inn', 'oak tree inn — loch lomond national park', 'oak tree inn loch lomond national park scotland village inn in balmaha, where the west highland way meets the east shore of the loch. 0.07 eth / night hotel'),
  (105, 37, 'Basecamp Hotel', 'basecamp-hotel-svalbard.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Trapper-style rooms in the centre of Longyearbyen, a practical base for snowmobile trips, boat tours, and Arctic day hikes.', 105, 'basecamp hotel', 'basecamp hotel — longyearbyen', 'basecamp hotel longyearbyen svalbard trapper-style rooms in the centre of longyearbyen, a practical base for snowmobile trips, boat tours, and arctic day hikes. 0.09 eth / night hotel'),
  (106, 37, 'Funken Lodge', 'funken-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Historic mining-era lodge in Nybyen with a restaurant and spa, looking over Adventfjorden and the surrounding peaks.', 106, 'funken lodge', 'funken lodge — longyearbyen', 'funken lodge longyearbyen svalbard historic mining-era lodge in nybyen with a restaurant and spa, looking over adventfjorden and the surrounding peaks. 0.11 eth / night hotel'),
  (107, 37, 'Radisson Blu Polar Hotel Spitsbergen', 'radisson-blu-polar-spitsbergen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Landmark hotel in Longyearbyen with polar views, a short walk from the harbour, Svalbard Museum, and northern lights tours.', 107, 'radisson blu polar hotel spitsbergen', 'radisson blu polar hotel spitsbergen — longyearbyen', 'radisson blu polar hotel spitsbergen longyearbyen svalbard landmark hotel in longyearbyen with polar views, a short walk from the harbour, svalbard museum, and northern lights tours. 0.13 eth / night hotel'),
  (108, 38, 'Clarion Hotel Malmö Live', 'clarion-hotel-malmo-live.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'High-rise waterfront hotel with a sky bar and concert hall next door.', 108, 'clarion hotel malmo live', 'clarion hotel malmo live — malmo', 'clarion hotel malmo live malmo sweden high-rise waterfront hotel with a sky bar and concert hall next door. 0.09 eth / night hotel'),
  (109, 38, 'Hotel Savoy Malmö', 'hotel-savoy-malmo.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historic city hotel opposite the central station, a short hop from the Turning Torso.', 109, 'hotel savoy malmo', 'hotel savoy malmo — malmo', 'hotel savoy malmo malmo sweden historic city hotel opposite the central station, a short hop from the turning torso. 0.07 eth / night hotel'),
  (110, 38, 'Scandic Triangeln', 'scandic-triangeln.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Modern tower hotel above Triangeln station, handy for Möllevången and shopping.', 110, 'scandic triangeln', 'scandic triangeln — malmo', 'scandic triangeln malmo sweden modern tower hotel above triangeln station, handy for mollevangen and shopping. 0.055 eth / night hotel'),
  (111, 39, 'Hotel Arkipelag', 'hotel-arkipelag.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel by Mariehamn’s western harbour, a short walk from shops, ferries, and the maritime quarter.', 111, 'hotel arkipelag', 'hotel arkipelag — mariehamn', 'hotel arkipelag mariehamn aland islands waterfront hotel by mariehamns western harbour, a short walk from shops, ferries, and the maritime quarter. 0.07 eth / night hotel'),
  (112, 39, 'Hotel Pommern', 'hotel-pommern.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Relaxed hotel near the Åland Maritime Museum and the historic four-masted barque Pommern.', 112, 'hotel pommern', 'hotel pommern — mariehamn', 'hotel pommern mariehamn aland islands relaxed hotel near the aland maritime museum and the historic four-masted barque pommern. 0.055 eth / night hotel'),
  (113, 39, 'Park Alandia Hotel', 'park-alandia-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Central Åland stay beside the town park, handy for the sailing harbour and the road to Kastelholm.', 113, 'park alandia hotel', 'park alandia hotel — mariehamn', 'park alandia hotel mariehamn aland islands central aland stay beside the town park, handy for the sailing harbour and the road to kastelholm. 0.05 eth / night hotel'),
  (114, 40, 'Narva City Hotel', 'narva-city-hotel.html', 'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Conveniently located in Narva city center, close to the river and historical sites.', 114, 'narva city hotel', 'narva city hotel — narva', 'narva city hotel narva estonia conveniently located in narva city center, close to the river and historical sites. 0.035 eth / night hotel'),
  (115, 40, 'Narva-Jõesuu Seaside Hotel', 'narva-joesuu-seaside-hotel.html', 'https://images.unsplash.com/photo-1505691723518-36a1ddb1b3b6?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Seaside hotel near Narva with easy access to sandy beaches and coastal walks.', 115, 'narva-joesuu seaside hotel', 'narva-joesuu seaside hotel — narva', 'narva-joesuu seaside hotel narva estonia seaside hotel near narva with easy access to sandy beaches and coastal walks. 0.03 eth / night hotel'),
  (116, 41, 'Crowne Plaza Newcastle', 'crowne-plaza-newcastle.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Modern city hotel near St James’ Park, well placed for business and match-day stays.', 116, 'crowne plaza newcastle', 'crowne plaza newcastle — newcastle', 'crowne plaza newcastle newcastle northeast england modern city hotel near st james park, well placed for business and match-day stays. 0.055 eth / night hotel'),
  (117, 41, 'Hotel du Vin Newcastle', 'hotel-du-vin-newcastle.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Boutique hotel in a converted warehouse beside the Quayside, with a bistro and wine cellar.', 117, 'hotel du vin newcastle', 'hotel du vin newcastle — newcastle', 'hotel du vin newcastle newcastle northeast england boutique hotel in a converted warehouse beside the quayside, with a bistro and wine cellar. 0.08 eth / night hotel'),
  (118, 41, 'Malmaison Newcastle', 'malmaison-newcastle.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Stylish waterfront stay on the Tyne with contemporary rooms and easy access to the bridges.', 118, 'malmaison newcastle', 'malmaison newcastle — newcastle', 'malmaison newcastle newcastle northeast england stylish waterfront stay on the tyne with contemporary rooms and easy access to the bridges. 0.07 eth / night hotel'),
  (119, 42, 'Hotel Hans Egede', 'hotel-hans-egede.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Landmark hotel on Aqqusinersuaq, with fjord views and a base for exploring Greenland’s capital.', 119, 'hotel hans egede', 'hotel hans egede — nuuk', 'hotel hans egede nuuk greenland landmark hotel on aqqusinersuaq, with fjord views and a base for exploring greenlands capital. 0.11 eth / night hotel'),
  (120, 42, 'Hotel Nuuk', 'hotel-nuuk.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.075 ETH / night', 0.075, 'Hillside stay overlooking Nuuk Fjord, a quiet launch point for boat trips and city walks.', 120, 'hotel nuuk', 'hotel nuuk — nuuk', 'hotel nuuk nuuk greenland hillside stay overlooking nuuk fjord, a quiet launch point for boat trips and city walks. 0.075 eth / night hotel'),
  (121, 42, 'Inuit Hotel', 'inuit-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary rooms near the colonial harbour, close to Katuaq and the waterfront boardwalk.', 121, 'inuit hotel', 'inuit hotel — nuuk', 'inuit hotel nuuk greenland contemporary rooms near the colonial harbour, close to katuaq and the waterfront boardwalk. 0.08 eth / night hotel'),
  (122, 43, 'Manor House Hotel', 'manor-house-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour house on the south shore of Oban, a short walk from the railway pier.', 122, 'manor house hotel', 'manor house hotel — oban', 'manor house hotel oban scotland harbour house on the south shore of oban, a short walk from the railway pier. 0.07 eth / night hotel'),
  (123, 43, 'Oban Bay Hotel', 'oban-bay-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Bayfront hotel in Oban, beside the ferry pier for the Hebridean islands.', 123, 'oban bay hotel', 'oban bay hotel — oban', 'oban bay hotel oban scotland bayfront hotel in oban, beside the ferry pier for the hebridean islands. 0.06 eth / night hotel'),
  (124, 43, 'Perle Oban Hotel', 'perle-oban-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Seafront hotel on Oban Bay, looking across the water to Kerrera.', 124, 'perle oban hotel', 'perle oban hotel — oban', 'perle oban hotel oban scotland seafront hotel on oban bay, looking across the water to kerrera. 0.08 eth / night hotel'),
  (125, 44, 'Hotel Odeon', 'hotel-odeon.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern hotel close to Odense railway station.', 125, 'hotel odeon', 'hotel odeon — odense', 'hotel odeon odense denmark modern hotel close to odense railway station. 0.06 eth / night hotel'),
  (126, 44, 'First Hotel Grand', 'first-hotel-grand.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historical charm in central Odense.', 126, 'first hotel grand', 'first hotel grand — odense', 'first hotel grand odense denmark historical charm in central odense. 0.07 eth / night hotel'),
  (127, 44, 'Comwell H.C. Andersen Odense', 'comwell-h-c-andersen-odense.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Comfort and convenience for leisure or business.', 127, 'comwell h.c. andersen odense', 'comwell h.c. andersen odense — odense', 'comwell h.c. andersen odense odense denmark comfort and convenience for leisure or business. 0.08 eth / night hotel'),
  (128, 45, 'Grand Hotel Oslo', 'grand-hotel-oslo.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.15 ETH / night', 0.15, 'Historic hotel on Karl Johans gate, facing the Storting and a stroll from the palace.', 128, 'grand hotel oslo', 'grand hotel oslo — oslo', 'grand hotel oslo oslo norway historic hotel on karl johans gate, facing the storting and a stroll from the palace. 0.15 eth / night hotel'),
  (129, 45, 'Hotel Continental', 'hotel-continental.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Family-run landmark beside Nationaltheatret, known for Theatercaféen and city views.', 129, 'hotel continental', 'hotel continental — oslo', 'hotel continental oslo norway family-run landmark beside nationaltheatret, known for theatercafeen and city views. 0.11 eth / night hotel'),
  (130, 45, 'The Thief', 'the-thief.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Design hotel on Tjuvholmen with contemporary art, harbour views, and a spa.', 130, 'the thief', 'the thief — oslo', 'the thief oslo norway design hotel on tjuvholmen with contemporary art, harbour views, and a spa. 0.13 eth / night hotel'),
  (131, 46, 'Lapland Hotels Oulu', 'lapland-hotels-oulu.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Lapland-inspired hotel near Oulu Cathedral, cozy and unique.', 131, 'lapland hotels oulu', 'lapland hotels oulu — oulu', 'lapland hotels oulu oulu finland lapland-inspired hotel near oulu cathedral, cozy and unique. 0.08 eth / night hotel'),
  (132, 46, 'Radisson Blu Hotel Oulu', 'radisson-blu-hotel-oulu.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Riverside hotel with beautiful views and modern amenities.', 132, 'radisson blu hotel oulu', 'radisson blu hotel oulu — oulu', 'radisson blu hotel oulu oulu finland riverside hotel with beautiful views and modern amenities. 0.09 eth / night hotel'),
  (133, 46, 'Scandic Oulu Station', 'scandic-oulu-station.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Comfortable rooms close to Oulu railway station and city center.', 133, 'scandic oulu station', 'scandic oulu station — oulu', 'scandic oulu station oulu finland comfortable rooms close to oulu railway station and city center. 0.07 eth / night hotel'),
  (134, 47, 'Boutique Riverside', 'boutique-riverside.html', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.045 ETH / night', 0.045, 'Small riverside hotel offering peaceful rooms and personalized service — a great base for exploring the region.', 134, 'boutique riverside', 'boutique riverside — panevezys', 'boutique riverside panevezys lithuania small riverside hotel offering peaceful rooms and personalized service — a great base for exploring the region. 0.045 eth / night hotel'),
  (135, 47, 'Central Park Hotel', 'central-park-hotel.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.04 ETH / night', 0.04, 'Modern hotel near the city park offering comfortable rooms and easy access to local attractions and concert venues.', 135, 'central park hotel', 'central park hotel — panevezys', 'central park hotel panevezys lithuania modern hotel near the city park offering comfortable rooms and easy access to local attractions and concert venues. 0.04 eth / night hotel'),
  (136, 49, 'Atholl Palace Hotel', 'atholl-palace-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Victorian hotel above Pitlochry, with gardens looking toward Ben Vrackie.', 136, 'atholl palace hotel', 'atholl palace hotel — pitlochry', 'atholl palace hotel pitlochry scotland victorian hotel above pitlochry, with gardens looking toward ben vrackie. 0.09 eth / night hotel'),
  (137, 49, 'Fishers Hotel', 'fishers-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel on Atholl Road in Pitlochry, a short walk from the theatre and the river.', 137, 'fishers hotel', 'fishers hotel — pitlochry', 'fishers hotel pitlochry scotland town hotel on atholl road in pitlochry, a short walk from the theatre and the river. 0.07 eth / night hotel'),
  (138, 49, 'Loch Faskally House', 'loch-faskally-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Shore house on Loch Faskally, beside the dam and the salmon ladder.', 138, 'loch faskally house', 'loch faskally house — pitlochry', 'loch faskally house pitlochry scotland shore house on loch faskally, beside the dam and the salmon ladder. 0.06 eth / night hotel'),
  (139, 50, 'Bosville Hotel', 'bosville-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town hotel above Portree harbour, a short walk from Somerled Square.', 139, 'bosville hotel', 'bosville hotel — portree', 'bosville hotel portree scotland town hotel above portree harbour, a short walk from somerled square. 0.08 eth / night hotel'),
  (140, 50, 'Cuillin Hills Hotel', 'cuillin-hills-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Harbour hotel in Portree, with views across the bay toward the Cuillin on the Isle of Skye.', 140, 'cuillin hills hotel', 'cuillin hills hotel — portree', 'cuillin hills hotel portree scotland harbour hotel in portree, with views across the bay toward the cuillin on the isle of skye. 0.09 eth / night hotel'),
  (141, 50, 'The Royal Hotel', 'the-royal-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Portree, beside the coloured houses and the fishing pier.', 141, 'the royal hotel', 'the royal hotel — portree', 'the royal hotel portree scotland harbour hotel in portree, beside the coloured houses and the fishing pier. 0.07 eth / night hotel'),
  (142, 51, 'Airport Hotel Aurora Star', 'airport-hotel-aurora-star.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Convenient overnight beside Keflavík International Airport with a 24-hour desk.', 142, 'airport hotel aurora star', 'airport hotel aurora star — reykjanesbaer', 'airport hotel aurora star reykjanesbaer iceland convenient overnight beside keflavik international airport with a 24-hour desk. 0.055 eth / night hotel'),
  (143, 51, 'Hotel Keflavik', 'hotel-keflavik.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Well-known airport-town hotel with a restaurant, handy for early flights and the lagoon.', 143, 'hotel keflavik', 'hotel keflavik — reykjanesbaer', 'hotel keflavik reykjanesbaer iceland well-known airport-town hotel with a restaurant, handy for early flights and the lagoon. 0.08 eth / night hotel'),
  (144, 51, 'Hotel Keilir', 'hotel-keilir.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern stay in central Keflavík, close to the waterfront and the Viking World museum.', 144, 'hotel keilir', 'hotel keilir — reykjanesbaer', 'hotel keilir reykjanesbaer iceland modern stay in central keflavik, close to the waterfront and the viking world museum. 0.06 eth / night hotel'),
  (145, 52, 'Canopy by Hilton Reykjavik City Centre', 'canopy-by-hilton-reykjavik-city-centre.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Design-led hotel on Laugavegur with local art, a café, and easy access to nightlife.', 145, 'canopy by hilton reykjavik city centre', 'canopy by hilton reykjavik city centre — reykjavik', 'canopy by hilton reykjavik city centre reykjavik iceland design-led hotel on laugavegur with local art, a cafe, and easy access to nightlife. 0.11 eth / night hotel'),
  (146, 52, 'Center Hotels Plaza', 'center-hotels-plaza.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Practical city-centre stay on Ingólfstorg, close to shops, bars, and the Old Harbour.', 146, 'center hotels plaza', 'center hotels plaza — reykjavik', 'center hotels plaza reykjavik iceland practical city-centre stay on ingolfstorg, close to shops, bars, and the old harbour. 0.08 eth / night hotel'),
  (147, 52, 'Hotel Borg', 'hotel-borg.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Art Deco landmark on Austurvöllur square, steps from the parliament and harbour.', 147, 'hotel borg', 'hotel borg — reykjavik', 'hotel borg reykjavik iceland art deco landmark on austurvollur square, steps from the parliament and harbour. 0.14 eth / night hotel'),
  (148, 53, 'Grand Hotel Kempinski', 'grand-hotel-kempinski-riga.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Luxury stay in the heart of Riga with elegant rooms and spa facilities.', 148, 'grand hotel kempinski', 'grand hotel kempinski — riga', 'grand hotel kempinski riga latvia luxury stay in the heart of riga with elegant rooms and spa facilities. 0.09 eth / night hotel'),
  (149, 53, 'Wellton Riverside', 'wellton-riverside-riga.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern hotel with river views, wellness area and rooftop terrace.', 149, 'wellton riverside', 'wellton riverside — riga', 'wellton riverside riga latvia modern hotel with river views, wellness area and rooftop terrace. 0.06 eth / night hotel'),
  (150, 54, 'Arctic Light Hotel', 'arctic-light-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Boutique hotel in a converted city hall, steps from Rovaniemi’s centre and Santa Claus Village day trips.', 150, 'arctic light hotel', 'arctic light hotel — rovaniemi', 'arctic light hotel rovaniemi finland boutique hotel in a converted city hall, steps from rovaniemis centre and santa claus village day trips. 0.10 eth / night hotel'),
  (151, 54, 'Lapland Hotels Sky Ounasvaara', 'lapland-hotels-sky-ounasvaara.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Hilltop hotel above the Kemijoki, with northern lights views and forest trails just outside town.', 151, 'lapland hotels sky ounasvaara', 'lapland hotels sky ounasvaara — rovaniemi', 'lapland hotels sky ounasvaara rovaniemi finland hilltop hotel above the kemijoki, with northern lights views and forest trails just outside town. 0.09 eth / night hotel'),
  (152, 54, 'Santa''s Hotel Santa Claus', 'santas-hotel-santa-claus.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Central Rovaniemi hotel named for Lapland’s Christmas lore, close to shops, saunas, and the riverfront.', 152, 'santas hotel santa claus', 'santas hotel santa claus — rovaniemi', 'santas hotel santa claus rovaniemi finland central rovaniemi hotel named for laplands christmas lore, close to shops, saunas, and the riverfront. 0.07 eth / night hotel'),
  (153, 55, 'Hótel Tindastóll', 'hotel-tindastoll.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic harbour hotel in Sauðárkrókur, on the Skagafjörður waterfront.', 153, 'hotel tindastoll', 'hotel tindastoll — saudarkrokur', 'hotel tindastoll saudarkrokur iceland historic harbour hotel in saudarkrokur, on the skagafjordur waterfront. 0.08 eth / night hotel'),
  (154, 55, 'Hótel Mikligarður', 'hotel-mikligardur.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Sauðárkrókur, a base for the Skagafjörður valley and the north coast.', 154, 'hotel mikligardur', 'hotel mikligardur — saudarkrokur', 'hotel mikligardur saudarkrokur iceland town hotel in saudarkrokur, a base for the skagafjordur valley and the north coast. 0.07 eth / night hotel'),
  (155, 55, 'Skagafjörður Guesthouse', 'skagafjordur-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse in Sauðárkrókur, a short walk from the harbour and the church.', 155, 'skagafjordur guesthouse', 'skagafjordur guesthouse — saudarkrokur', 'skagafjordur guesthouse saudarkrokur iceland small guesthouse in saudarkrokur, a short walk from the harbour and the church. 0.055 eth / night hotel'),
  (156, 56, 'Park Inn Šiauliai', 'park-inn-siauliai.html', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.045 ETH / night', 0.045, 'Reliable mid-range hotel with clean, comfortable rooms, conference facilities and convenient transport links.', 156, 'park inn siauliai', 'park inn siauliai — siauliai', 'park inn siauliai siauliai lithuania reliable mid-range hotel with clean, comfortable rooms, conference facilities and convenient transport links. 0.045 eth / night hotel'),
  (157, 56, 'Old Town Boutique', 'old-town-boutique.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.04 ETH / night', 0.04, 'Small boutique hotel located a short walk from the Old Town, offering a quiet stay and homemade breakfast.', 157, 'old town boutique', 'old town boutique — siauliai', 'old town boutique siauliai lithuania small boutique hotel located a short walk from the old town, offering a quiet stay and homemade breakfast. 0.04 eth / night hotel'),
  (158, 57, 'Scores Hotel', 'scores-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Hotel on The Scores in St Andrews, looking over the bay and the West Sands.', 158, 'scores hotel', 'scores hotel — st andrews', 'scores hotel st andrews scotland hotel on the scores in st andrews, looking over the bay and the west sands. 0.09 eth / night hotel'),
  (159, 57, 'St Andrews Harbour Hotel', 'st-andrews-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in St Andrews, a short walk from the cathedral ruins and the West Sands.', 159, 'st andrews harbour hotel', 'st andrews harbour hotel — st andrews', 'st andrews harbour hotel st andrews scotland harbour hotel in st andrews, a short walk from the cathedral ruins and the west sands. 0.08 eth / night hotel'),
  (160, 57, 'Cathedral Gate House', 'cathedral-gate-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town house in St Andrews, beside the cathedral ruins and the harbour wall.', 160, 'cathedral gate house', 'cathedral gate house — st andrews', 'cathedral gate house st andrews scotland town house in st andrews, beside the cathedral ruins and the harbour wall. 0.07 eth / night hotel'),
  (161, 58, 'Clarion Hotel Stavanger', 'clarion-hotel-stavanger.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Central high-rise with a rooftop restaurant and views over the harbour and old town.', 161, 'clarion hotel stavanger', 'clarion hotel stavanger — stavanger', 'clarion hotel stavanger stavanger norway central high-rise with a rooftop restaurant and views over the harbour and old town. 0.09 eth / night hotel'),
  (162, 58, 'Hotel Victoria Stavanger', 'hotel-victoria-stavanger.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Historic hotel on Skansegt, close to the cathedral and the ferry to Tau.', 162, 'hotel victoria stavanger', 'hotel victoria stavanger — stavanger', 'hotel victoria stavanger stavanger norway historic hotel on skansegt, close to the cathedral and the ferry to tau. 0.055 eth / night hotel'),
  (163, 58, 'Radisson Blu Atlantic', 'radisson-blu-atlantic.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Waterfront hotel on the lake, walking distance to the petroleum museum and colour houses.', 163, 'radisson blu atlantic', 'radisson blu atlantic — stavanger', 'radisson blu atlantic stavanger norway waterfront hotel on the lake, walking distance to the petroleum museum and colour houses. 0.08 eth / night hotel'),
  (164, 59, 'Golden Lion Hotel', 'golden-lion-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Traditional city-centre inn, a convenient base for exploring Stirling.', 164, 'golden lion hotel', 'golden lion hotel — stirling', 'golden lion hotel stirling scotland traditional city-centre inn, a convenient base for exploring stirling. 0.045 eth / night hotel'),
  (165, 59, 'Hotel Colessio', 'hotel-colessio.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stylish boutique hotel on the edge of Stirling’s old town.', 165, 'hotel colessio', 'hotel colessio — stirling', 'hotel colessio stirling scotland stylish boutique hotel on the edge of stirlings old town. 0.06 eth / night hotel'),
  (166, 59, 'Stirling Highland Hotel', 'stirling-highland-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historic hotel beside Stirling Castle, in a former high school building.', 166, 'stirling highland hotel', 'stirling highland hotel — stirling', 'stirling highland hotel stirling scotland historic hotel beside stirling castle, in a former high school building. 0.07 eth / night hotel'),
  (167, 60, 'Grand Hôtel Stockholm', 'grand-hotel-stockholm.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.16 ETH / night', 0.16, 'Landmark waterfront palace facing the Royal Palace, with a Nordic spa and fine dining.', 167, 'grand hotel stockholm', 'grand hotel stockholm — stockholm', 'grand hotel stockholm stockholm sweden landmark waterfront palace facing the royal palace, with a nordic spa and fine dining. 0.16 eth / night hotel'),
  (168, 60, 'Hotel Diplomat', 'hotel-diplomat.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Elegant Art Nouveau hotel on Strandvägen, steps from Östermalm boutiques and Djurgården.', 168, 'hotel diplomat', 'hotel diplomat — stockholm', 'hotel diplomat stockholm sweden elegant art nouveau hotel on strandvagen, steps from ostermalm boutiques and djurgarden. 0.11 eth / night hotel'),
  (169, 60, 'Scandic Continental', 'scandic-continental.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Central eco-minded hotel beside Stockholm Central Station, ideal for exploring the islands.', 169, 'scandic continental', 'scandic continental — stockholm', 'scandic continental stockholm sweden central eco-minded hotel beside stockholm central station, ideal for exploring the islands. 0.08 eth / night hotel'),
  (170, 61, 'Cabarfeidh Hotel', 'cabarfeidh-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town hotel in Stornoway, a short walk from the harbour and Lews Castle.', 170, 'cabarfeidh hotel', 'cabarfeidh hotel — stornoway', 'cabarfeidh hotel stornoway scotland town hotel in stornoway, a short walk from the harbour and lews castle. 0.08 eth / night hotel'),
  (171, 61, 'Caladh Inn', 'caladh-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Harbour inn in Stornoway, beside the ferry terminal for the mainland.', 171, 'caladh inn', 'caladh inn — stornoway', 'caladh inn stornoway scotland harbour inn in stornoway, beside the ferry terminal for the mainland. 0.06 eth / night hotel'),
  (172, 61, 'Lews Castle Lodge', 'lews-castle-lodge.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Woodland lodge across the harbour from Stornoway, on the grounds of Lews Castle.', 172, 'lews castle lodge', 'lews castle lodge — stornoway', 'lews castle lodge stornoway scotland woodland lodge across the harbour from stornoway, on the grounds of lews castle. 0.07 eth / night hotel'),
  (173, 62, 'Hotel Telegraaf', 'hotel-telegraaf-tallinn.html', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic 5-star hotel in Tallinn Old Town with elegant rooms and a luxury spa.', 173, 'hotel telegraaf', 'hotel telegraaf — tallinn', 'hotel telegraaf tallinn estonia historic 5-star hotel in tallinn old town with elegant rooms and a luxury spa. 0.08 eth / night hotel'),
  (174, 62, 'Swissôtel Tallinn', 'swissotel-tallinn.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b07f9a05?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern high-rise hotel offering panoramic city views, pool and business facilities.', 174, 'swissotel tallinn', 'swissotel tallinn — tallinn', 'swissotel tallinn tallinn estonia modern high-rise hotel offering panoramic city views, pool and business facilities. 0.07 eth / night hotel'),
  (175, 63, 'Lapland Hotels Tampere', 'lapland-hotels-tampere.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Modern comfort with Lapland-inspired decor in central Tampere.', 175, 'lapland hotels tampere', 'lapland hotels tampere — tampere', 'lapland hotels tampere tampere finland modern comfort with lapland-inspired decor in central tampere. 0.09 eth / night hotel'),
  (176, 63, 'Original Sokos Hotel Ilves', 'original-sokos-hotel-ilves.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Iconic riverside hotel offering panoramic city views and dining.', 176, 'original sokos hotel ilves', 'original sokos hotel ilves — tampere', 'original sokos hotel ilves tampere finland iconic riverside hotel offering panoramic city views and dining. 0.08 eth / night hotel'),
  (177, 63, 'Scandic Tampere Station', 'scandic-tampere-station.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Convenient hotel next to the train station, perfect for business and leisure.', 177, 'scandic tampere station', 'scandic tampere station — tampere', 'scandic tampere station tampere finland convenient hotel next to the train station, perfect for business and leisure. 0.07 eth / night hotel'),
  (178, 64, 'Hotel Telegraaf', 'hotel-telegraaf.html', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic 5-star hotel in Tallinn Old Town with elegant rooms and a luxury spa.', 178, 'hotel telegraaf', 'hotel telegraaf — tartu', 'hotel telegraaf tartu estonia historic 5-star hotel in tallinn old town with elegant rooms and a luxury spa. 0.08 eth / night hotel'),
  (179, 64, 'Swissôtel Tallinn', 'swissotel-tallinn-tartu.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b07f9a05?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern high-rise hotel offering panoramic city views, pool and business facilities.', 179, 'swissotel tallinn', 'swissotel tallinn — tartu', 'swissotel tallinn tartu estonia modern high-rise hotel offering panoramic city views, pool and business facilities. 0.07 eth / night hotel'),
  (180, 65, 'Hotel Føroyar', 'hotel-foroyar.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Hillside hotel above the capital, with grass-roof rooms and wide views over Tórshavn and Nólsoy.', 180, 'hotel foroyar', 'hotel foroyar — torshavn', 'hotel foroyar torshavn faroe islands hillside hotel above the capital, with grass-roof rooms and wide views over torshavn and nolsoy. 0.10 eth / night hotel'),
  (181, 65, 'Hotel Hafnia', 'hotel-hafnia.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Classic downtown hotel on Áarvegur, walking distance to Tinganes and the harbour.', 181, 'hotel hafnia', 'hotel hafnia — torshavn', 'hotel hafnia torshavn faroe islands classic downtown hotel on aarvegur, walking distance to tinganes and the harbour. 0.08 eth / night hotel'),
  (182, 65, 'Hotel Streym', 'hotel-streym.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour-side stay near the ferry terminal, a practical base for island-hopping around the Faroes.', 182, 'hotel streym', 'hotel streym — torshavn', 'hotel streym torshavn faroe islands harbour-side stay near the ferry terminal, a practical base for island-hopping around the faroes. 0.07 eth / night hotel'),
  (183, 66, 'Clarion Hotel The Edge', 'clarion-hotel-the-edge.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Waterfront hotel on the Tromsø Sound with harbour views and a short hop to the Arctic Cathedral.', 183, 'clarion hotel the edge', 'clarion hotel the edge — tromso', 'clarion hotel the edge tromso norway waterfront hotel on the tromso sound with harbour views and a short hop to the arctic cathedral. 0.10 eth / night hotel'),
  (184, 66, 'Radisson Blu Hotel Tromsø', 'radisson-blu-hotel-tromso.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Central Arctic-city hotel with a rooftop bar looking over the island and surrounding peaks.', 184, 'radisson blu hotel tromso', 'radisson blu hotel tromso — tromso', 'radisson blu hotel tromso tromso norway central arctic-city hotel with a rooftop bar looking over the island and surrounding peaks. 0.09 eth / night hotel'),
  (185, 66, 'Scandic Ishavshotel', 'scandic-ishavshotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbourfront stay on the quay, a short walk from Tromsø city centre and the polar museum.', 185, 'scandic ishavshotel', 'scandic ishavshotel — tromso', 'scandic ishavshotel tromso norway harbourfront stay on the quay, a short walk from tromso city centre and the polar museum. 0.08 eth / night hotel'),
  (186, 67, 'Britannia Hotel', 'britannia-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Restored palatial hotel with a palm court, spa, and several celebrated restaurants.', 186, 'britannia hotel', 'britannia hotel — trondheim', 'britannia hotel trondheim norway restored palatial hotel with a palm court, spa, and several celebrated restaurants. 0.14 eth / night hotel'),
  (187, 67, 'Clarion Hotel Trondheim', 'clarion-hotel-trondheim.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbourfront hotel on Brattøra, a short walk from the aquarium and city centre.', 187, 'clarion hotel trondheim', 'clarion hotel trondheim — trondheim', 'clarion hotel trondheim trondheim norway harbourfront hotel on brattora, a short walk from the aquarium and city centre. 0.08 eth / night hotel'),
  (188, 67, 'Scandic Nidelven', 'scandic-nidelven.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Riverside hotel famous for its breakfast, next to the Solsiden quarter.', 188, 'scandic nidelven', 'scandic nidelven — trondheim', 'scandic nidelven trondheim norway riverside hotel famous for its breakfast, next to the solsiden quarter. 0.07 eth / night hotel'),
  (189, 68, 'Original Sokos Hotel Wiklund', 'original-sokos-hotel-wiklund.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Central hotel with rooftop bar and easy access to Turku’s sights.', 189, 'original sokos hotel wiklund', 'original sokos hotel wiklund — turku', 'original sokos hotel wiklund turku finland central hotel with rooftop bar and easy access to turkus sights. 0.08 eth / night hotel'),
  (190, 68, 'Radisson Blu Marina Palace', 'radisson-blu-marina-palace.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Riverside hotel with modern rooms and excellent amenities.', 190, 'radisson blu marina palace', 'radisson blu marina palace — turku', 'radisson blu marina palace turku finland riverside hotel with modern rooms and excellent amenities. 0.10 eth / night hotel'),
  (191, 68, 'Scandic Julia', 'scandic-julia.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern comfort in the center of Turku, close to shopping and attractions.', 191, 'scandic julia', 'scandic julia — turku', 'scandic julia turku finland modern comfort in the center of turku, close to shopping and attractions. 0.07 eth / night hotel'),
  (192, 69, 'The Ceilidh Place', 'the-ceilidh-place.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Bookshop hotel on the west shore of Ullapool, above Loch Broom.', 192, 'the ceilidh place', 'the ceilidh place — ullapool', 'the ceilidh place ullapool scotland bookshop hotel on the west shore of ullapool, above loch broom. 0.09 eth / night hotel'),
  (193, 69, 'Broomfield House', 'broomfield-house.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Hillside house above the harbour in Ullapool, looking across Loch Broom.', 193, 'broomfield house', 'broomfield house — ullapool', 'broomfield house ullapool scotland hillside house above the harbour in ullapool, looking across loch broom. 0.06 eth / night hotel'),
  (194, 69, 'Ullapool Ferry Hotel', 'ullapool-ferry-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Ullapool, on Loch Broom beside the ferry to Lewis.', 194, 'ullapool ferry hotel', 'ullapool ferry hotel — ullapool', 'ullapool ferry hotel ullapool scotland harbour hotel in ullapool, on loch broom beside the ferry to lewis. 0.08 eth / night hotel'),
  (195, 70, 'Clarion Hotel Gillet', 'clarion-hotel-gillet.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Central hotel by the river Fyris, walking distance to the cathedral and university.', 195, 'clarion hotel gillet', 'clarion hotel gillet — uppsala', 'clarion hotel gillet uppsala sweden central hotel by the river fyris, walking distance to the cathedral and university. 0.07 eth / night hotel'),
  (196, 70, 'Elite Hotel Academia', 'elite-hotel-academia.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Contemporary stay beside Uppsala Central Station with a restaurant and gym.', 196, 'elite hotel academia', 'elite hotel academia — uppsala', 'elite hotel academia uppsala sweden contemporary stay beside uppsala central station with a restaurant and gym. 0.06 eth / night hotel'),
  (197, 70, 'Grand Hotel Hörnan', 'grand-hotel-hornan.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Boutique hotel in a historic corner building overlooking the river and old town.', 197, 'grand hotel hornan', 'grand hotel hornan — uppsala', 'grand hotel hornan uppsala sweden boutique hotel in a historic corner building overlooking the river and old town. 0.05 eth / night hotel'),
  (198, 71, 'Hotel Vestmannaeyjar', 'hotel-vestmannaeyjar.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel on Heimaey, close to the ferry and the town centre.', 198, 'hotel vestmannaeyjar', 'hotel vestmannaeyjar — vestmannaeyjar', 'hotel vestmannaeyjar vestmannaeyjar iceland harbour hotel on heimaey, close to the ferry and the town centre. 0.07 eth / night hotel'),
  (199, 71, 'Hótel Eyjar', 'hotel-eyjar.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Island hotel in Vestmannaeyjar, with views toward the cliffs and the harbour.', 199, 'hotel eyjar', 'hotel eyjar — vestmannaeyjar', 'hotel eyjar vestmannaeyjar iceland island hotel in vestmannaeyjar, with views toward the cliffs and the harbour. 0.06 eth / night hotel'),
  (200, 71, 'Guesthouse Hamar', 'guesthouse-hamar.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse on Heimaey, a short walk from the puffin cliffs and Eldfell.', 200, 'guesthouse hamar', 'guesthouse hamar — vestmannaeyjar', 'guesthouse hamar vestmannaeyjar iceland small guesthouse on heimaey, a short walk from the puffin cliffs and eldfell. 0.055 eth / night hotel'),
  (201, 73, 'PACAI Hotel', 'pacai-hotel.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b8a6b2d2?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.09 ETH / night', 0.09, 'Luxury boutique hotel in Vilnius Old Town with elegant rooms and a quiet courtyard — perfect for exploring the historic centre.', 201, 'pacai hotel', 'pacai hotel — vilnius', 'pacai hotel vilnius lithuania luxury boutique hotel in vilnius old town with elegant rooms and a quiet courtyard — perfect for exploring the historic centre. 0.09 eth / night hotel'),
  (202, 73, 'Radisson Blu Lietuva', 'radisson-blu-lietuva.html', 'https://images.unsplash.com/photo-1472552949507-78c2d0f1311d?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.07 ETH / night', 0.07, 'Modern riverside hotel offering panoramic city views, an indoor pool and business facilities for business and leisure travellers.', 202, 'radisson blu lietuva', 'radisson blu lietuva — vilnius', 'radisson blu lietuva vilnius lithuania modern riverside hotel offering panoramic city views, an indoor pool and business facilities for business and leisure travellers. 0.07 eth / night hotel'),
  (203, 74, 'Hotel Nida Marina', 'hotel-nida-marina.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lagoon-side hotel in Nida with dune views and a short walk to the fishing harbour.', 203, 'hotel nida marina', 'hotel nida marina — nida', 'hotel nida marina nida lithuania lagoon-side hotel in nida with dune views and a short walk to the fishing harbour. 0.07 eth / night hotel'),
  (204, 75, 'Barentsburg Guesthouse', 'barentsburg-guesthouse.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Compact guesthouse in Barentsburg, above the harbour and the historic mining settlement.', 204, 'barentsburg guesthouse', 'barentsburg guesthouse — barentsburg', 'barentsburg guesthouse barentsburg svalbard compact guesthouse in barentsburg, above the harbour and the historic mining settlement. 0.09 eth / night hotel'),
  (205, 76, 'Pyramiden Harbour House', 'pyramiden-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Simple harbour stay in Pyramiden for guided visits to the preserved mining town.', 205, 'pyramiden harbour house', 'pyramiden harbour house — pyramiden', 'pyramiden harbour house pyramiden svalbard simple harbour stay in pyramiden for guided visits to the preserved mining town. 0.08 eth / night hotel'),
  (206, 77, 'Palanga Dune Hotel', 'palanga-dune-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Pine-backed hotel in Palanga, between the botanical park and the Baltic beach.', 206, 'palanga dune hotel', 'palanga dune hotel — palanga', 'palanga dune hotel palanga lithuania pine-backed hotel in palanga, between the botanical park and the baltic beach. 0.05 eth / night hotel'),
  (207, 78, 'Druskininkai Spa House', 'druskininkai-spa-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Spa house in Druskininkai, near the Nemunas riverside promenade and the mineral springs.', 207, 'druskininkai spa house', 'druskininkai spa house — druskininkai', 'druskininkai spa house druskininkai lithuania spa house in druskininkai, near the nemunas riverside promenade and the mineral springs. 0.06 eth / night hotel'),
  (208, 79, 'Trakai Lake House', 'trakai-lake-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Lakeside house in Trakai, a short walk from the island castle.', 208, 'trakai lake house', 'trakai lake house — trakai', 'trakai lake house trakai lithuania lakeside house in trakai, a short walk from the island castle. 0.05 eth / night hotel'),
  (209, 80, 'Porvoo Old Town Hotel', 'porvoo-old-town-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Old-town hotel in Porvoo, among the red shore warehouses on the Porvoonjoki.', 209, 'porvoo old town hotel', 'porvoo old town hotel — porvoo', 'porvoo old town hotel porvoo finland old-town hotel in porvoo, among the red shore warehouses on the porvoonjoki. 0.07 eth / night hotel'),
  (210, 81, 'Kuopio Lakefront Hotel', 'kuopio-lakefront-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Lakefront hotel in Kuopio, close to the passenger harbour on Kallavesi.', 210, 'kuopio lakefront hotel', 'kuopio lakefront hotel — kuopio', 'kuopio lakefront hotel kuopio finland lakefront hotel in kuopio, close to the passenger harbour on kallavesi. 0.06 eth / night hotel'),
  (211, 82, 'Savonlinna Castle Hotel', 'savonlinna-castle-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Island hotel in Savonlinna, facing Olavinlinna across the strait.', 211, 'savonlinna castle hotel', 'savonlinna castle hotel — savonlinna', 'savonlinna castle hotel savonlinna finland island hotel in savonlinna, facing olavinlinna across the strait. 0.08 eth / night hotel'),
  (212, 83, 'Icehotel Jukkasjärvi', 'icehotel-jukkasjarvi.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Ice rooms and a warm hotel in Jukkasjärvi, on the Torne River north of Kiruna.', 212, 'icehotel jukkasjarvi', 'icehotel jukkasjarvi — jukkasjarvi', 'icehotel jukkasjarvi jukkasjarvi sweden ice rooms and a warm hotel in jukkasjarvi, on the torne river north of kiruna. 0.11 eth / night hotel'),
  (213, 84, 'Gjógv Guesthouse', 'gjogv-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Turf-roof guesthouse in Gjógv, above the sea gorge on the north coast of Eysturoy.', 213, 'gjogv guesthouse', 'gjogv guesthouse — gjogv', 'gjogv guesthouse gjogv faroe islands turf-roof guesthouse in gjogv, above the sea gorge on the north coast of eysturoy. 0.08 eth / night hotel'),
  (214, 85, 'Saksun Turf House', 'saksun-turf-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Turf-roof house in Saksun, beside the lagoon where the stream meets the Atlantic.', 214, 'saksun turf house', 'saksun turf house — saksun', 'saksun turf house saksun faroe islands turf-roof house in saksun, beside the lagoon where the stream meets the atlantic. 0.07 eth / night hotel'),
  (215, 86, 'Mykines Puffin Lodge', 'mykines-puffin-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Cliffside lodge on Mykines, a short walk from the puffin slopes and the lighthouse path.', 215, 'mykines puffin lodge', 'mykines puffin lodge — mykines', 'mykines puffin lodge mykines faroe islands cliffside lodge on mykines, a short walk from the puffin slopes and the lighthouse path. 0.09 eth / night hotel'),
  (216, 87, 'Nólsoy Harbour House', 'nolsoy-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Harbour house on Nólsoy, the island facing Tórshavn across the sound.', 216, 'nolsoy harbour house', 'nolsoy harbour house — nolsoy', 'nolsoy harbour house nolsoy faroe islands harbour house on nolsoy, the island facing torshavn across the sound. 0.06 eth / night hotel'),
  (217, 88, 'Vágar Cliff Hotel', 'vagar-cliff-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Cliff hotel on Vágar, near the airport and the ridge above Sørvágsvatn.', 217, 'vagar cliff hotel', 'vagar cliff hotel — vagar', 'vagar cliff hotel vagar faroe islands cliff hotel on vagar, near the airport and the ridge above sorvagsvatn. 0.08 eth / night hotel'),
  (218, 89, 'Streymoy Valley Inn', 'streymoy-valley-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Valley inn on Streymoy, between the mountain road and the villages west of Tórshavn.', 218, 'streymoy valley inn', 'streymoy valley inn — streymoy', 'streymoy valley inn streymoy faroe islands valley inn on streymoy, between the mountain road and the villages west of torshavn. 0.07 eth / night hotel'),
  (219, 90, 'Eysturoy Sound Hotel', 'eysturoy-sound-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Sound-side hotel on Eysturoy, a base for the villages north of the undersea tunnel.', 219, 'eysturoy sound hotel', 'eysturoy sound hotel — eysturoy', 'eysturoy sound hotel eysturoy faroe islands sound-side hotel on eysturoy, a base for the villages north of the undersea tunnel. 0.07 eth / night hotel'),
  (220, 91, 'Ny-Ålesund Polar Lodge', 'ny-alesund-polar-lodge.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Small lodge in Ny-Ålesund, the research settlement on Kongsfjorden.', 220, 'ny-alesund polar lodge', 'ny-alesund polar lodge — ny-alesund', 'ny-alesund polar lodge ny-alesund svalbard small lodge in ny-alesund, the research settlement on kongsfjorden. 0.12 eth / night hotel'),
  (221, 92, 'Kastelholm Castle Inn', 'kastelholm-castle-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Inn beside Kastelholm Castle, on the inland road from Mariehamn.', 221, 'kastelholm castle inn', 'kastelholm castle inn — kastelholm', 'kastelholm castle inn kastelholm aland islands inn beside kastelholm castle, on the inland road from mariehamn. 0.08 eth / night hotel'),
  (222, 93, 'Bomarsund Fortress House', 'bomarsund-fortress-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Guest house by the Bomarsund fortress ruins, on the Åland shore.', 222, 'bomarsund fortress house', 'bomarsund fortress house — bomarsund', 'bomarsund fortress house bomarsund aland islands guest house by the bomarsund fortress ruins, on the aland shore. 0.06 eth / night hotel'),
  (223, 94, 'Skye Cuillin Hotel', 'skye-cuillin-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Harbour hotel on the Isle of Skye, with views toward the Cuillin ridge and the sea cliffs.', 223, 'skye cuillin hotel', 'skye cuillin hotel — isle of skye', 'skye cuillin hotel isle of skye scotland harbour hotel on the isle of skye, with views toward the cuillin ridge and the sea cliffs. 0.09 eth / night hotel'),
  (224, 95, 'Kirkwall Harbour Hotel', 'kirkwall-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Kirkwall, beside St Magnus Cathedral and the Orkney ferry pier.', 224, 'kirkwall harbour hotel', 'kirkwall harbour hotel — kirkwall', 'kirkwall harbour hotel kirkwall scotland harbour hotel in kirkwall, beside st magnus cathedral and the orkney ferry pier. 0.08 eth / night hotel'),
  (225, 96, 'Tobermory Waterfront Hotel', 'tobermory-waterfront-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel in Tobermory, on the coloured harbour of the Isle of Mull.', 225, 'tobermory waterfront hotel', 'tobermory waterfront hotel — tobermory', 'tobermory waterfront hotel tobermory scotland waterfront hotel in tobermory, on the coloured harbour of the isle of mull. 0.07 eth / night hotel'),
  (226, 97, 'Uist Machair House', 'uist-machair-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Shore house on Uist, between the machair and the Atlantic beaches of the Outer Hebrides.', 226, 'uist machair house', 'uist machair house — uist', 'uist machair house uist scotland shore house on uist, between the machair and the atlantic beaches of the outer hebrides. 0.06 eth / night hotel'),
  (227, 98, 'Tarbert Harris Hotel', 'tarbert-harris-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Pier hotel in Tarbert (Harris), where the ferry meets the Isle of Harris.', 227, 'tarbert harris hotel', 'tarbert harris hotel — tarbert (harris)', 'tarbert harris hotel tarbert (harris) scotland pier hotel in tarbert (harris), where the ferry meets the isle of harris. 0.07 eth / night hotel'),
  (228, 99, 'Uig Bay Hotel', 'uig-bay-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Bay hotel in Uig, at the Skye ferry pier for the Outer Hebrides.', 228, 'uig bay hotel', 'uig bay hotel — uig', 'uig bay hotel uig scotland bay hotel in uig, at the skye ferry pier for the outer hebrides. 0.06 eth / night hotel'),
  (229, 100, 'Dunvegan Castle Hotel', 'dunvegan-castle-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Lochside hotel in Dunvegan, a short walk from Dunvegan Castle on the Isle of Skye.', 229, 'dunvegan castle hotel', 'dunvegan castle hotel — dunvegan', 'dunvegan castle hotel dunvegan scotland lochside hotel in dunvegan, a short walk from dunvegan castle on the isle of skye. 0.09 eth / night hotel'),
  (230, 101, 'Broadford Bay Hotel', 'broadford-bay-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Bay hotel in Broadford, on the south-east shore of the Isle of Skye.', 230, 'broadford bay hotel', 'broadford bay hotel — broadford', 'broadford bay hotel broadford scotland bay hotel in broadford, on the south-east shore of the isle of skye. 0.07 eth / night hotel'),
  (231, 102, 'Armadale Pier Hotel', 'armadale-pier-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Pier hotel in Armadale, where the Mallaig ferry meets the Sleat peninsula.', 231, 'armadale pier hotel', 'armadale pier hotel — armadale', 'armadale pier hotel armadale scotland pier hotel in armadale, where the mallaig ferry meets the sleat peninsula. 0.06 eth / night hotel'),
  (232, 103, 'Lochmaddy Harbour Hotel', 'lochmaddy-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Lochmaddy, the ferry port on North Uist.', 232, 'lochmaddy harbour hotel', 'lochmaddy harbour hotel — lochmaddy', 'lochmaddy harbour hotel lochmaddy scotland harbour hotel in lochmaddy, the ferry port on north uist. 0.07 eth / night hotel');
COMMIT;

-- ---------------------------------------------------------------------------
-- Fold a raw query inside SQL. The caller does not normalize first.
-- Put the typed text in fold_input, then read raw_query_tokens.
-- Em dash and en dash become spaces, matching the homepage label separator.
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE fold_input (
  value TEXT
);

CREATE TEMP VIEW folded_value AS
WITH RECURSIVE
ordered AS (
  SELECT src, dst, row_number() OVER (ORDER BY src) AS n FROM fold_map
),
walk(i, value) AS (
  SELECT 0, coalesce((SELECT value FROM fold_input LIMIT 1), '')
  UNION ALL
  SELECT walk.i + 1, replace(walk.value, ordered.src, ordered.dst)
  FROM walk
  JOIN ordered ON ordered.n = walk.i + 1
)
SELECT value AS folded FROM walk WHERE i = (SELECT count(*) FROM fold_map);

CREATE TEMP VIEW folded_key AS
WITH RECURSIVE
base AS (
  SELECT trim(folded) AS value FROM folded_value
),
squeeze(n, value) AS (
  SELECT 0, value FROM base
  UNION ALL
  SELECT n + 1, replace(value, '  ', ' ')
  FROM squeeze
  WHERE instr(value, '  ') > 0 AND n < 40
)
SELECT value AS key FROM squeeze ORDER BY n DESC LIMIT 1;

CREATE TEMP TABLE query_tokens (
  position INTEGER PRIMARY KEY,
  token    TEXT NOT NULL
);

CREATE TEMP VIEW raw_query_tokens AS
WITH RECURSIVE
prepared AS (
  SELECT trim(replace(replace(folded, '—', ' '), '–', ' ')) AS s
  FROM folded_value
),
parts(position, token, rest) AS (
  SELECT
    1,
    substr(trim(s) || ' ', 1, instr(trim(s) || ' ', ' ') - 1),
    ltrim(substr(trim(s) || ' ', instr(trim(s) || ' ', ' ') + 1))
  FROM prepared
  WHERE trim(s) <> ''
  UNION ALL
  SELECT
    position + 1,
    substr(rest || ' ', 1, instr(rest || ' ', ' ') - 1),
    ltrim(substr(rest || ' ', instr(rest || ' ', ' ') + 1))
  FROM parts
  WHERE rest <> ''
)
SELECT position, token FROM parts WHERE token <> '';

-- Worked example: typed "Royal Aarhus". Folding yields royal and aarhus.
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Royal Aarhus');
DELETE FROM query_tokens;
INSERT INTO query_tokens (position, token)
SELECT position, token FROM raw_query_tokens;

SELECT
  'city'       AS type,
  c.name       AS name,
  c.name       AS city,
  c.country    AS country,
  c.page_url   AS url,
  c.description AS description
FROM cities AS c
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(c.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY c.sort_order;

SELECT
  'hotel'        AS type,
  h.name         AS name,
  c.name         AS city,
  c.country      AS country,
  h.page_url     AS url,
  c.page_url     AS cityUrl,
  h.image_url    AS image,
  h.price_label  AS price,
  h.price_eth    AS priceEth,
  h.description  AS description
FROM hotels AS h
JOIN cities AS c ON c.id = h.city_id
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(h.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY h.sort_order;

-- Worked example: typed "Nida". The city and hotel have no HTML page.
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Nida');
DELETE FROM query_tokens;
INSERT INTO query_tokens (position, token)
SELECT position, token FROM raw_query_tokens;

SELECT
  'city'       AS type,
  c.name       AS name,
  c.name       AS city,
  c.country    AS country,
  c.page_url   AS url,
  c.description AS description
FROM cities AS c
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(c.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY c.sort_order;

SELECT
  'hotel'        AS type,
  h.name         AS name,
  c.name         AS city,
  c.country      AS country,
  h.page_url     AS url,
  c.page_url     AS cityUrl,
  h.image_url    AS image,
  h.price_label  AS price,
  h.price_eth    AS priceEth,
  h.description  AS description
FROM hotels AS h
JOIN cities AS c ON c.id = h.city_id
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(h.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY h.sort_order;

-- Homepage destination. Typed "Reykjavík"; folded_key is reykjavik.
-- Priority matches hero-search.js findDestination(), first hit in catalog order:
--   1. city name equals the needle
--   2. hotel name, or "name — city", equals the needle
--   3. city name starts with the needle, or the needle starts with the city name
--   4. hotel name contains the needle
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Reykjavík');

SELECT kind, city_id, hotel_id, name, page_url
FROM (
  SELECT
    1 AS priority,
    'city' AS kind,
    c.id AS city_id,
    NULL AS hotel_id,
    c.name AS name,
    c.page_url AS page_url,
    c.sort_order AS sort_order
  FROM cities AS c
  WHERE c.name_key = (SELECT key FROM folded_key)

  UNION ALL

  SELECT
    2,
    'hotel',
    h.city_id,
    h.id,
    h.name,
    h.page_url,
    h.sort_order
  FROM hotels AS h
  WHERE h.name_key = (SELECT key FROM folded_key)
     OR h.label_key = (SELECT key FROM folded_key)

  UNION ALL

  SELECT
    3,
    'city',
    c.id,
    NULL,
    c.name,
    c.page_url,
    c.sort_order
  FROM cities AS c
  WHERE instr(c.name_key, (SELECT key FROM folded_key)) = 1
     OR (
       c.name_key <> ''
       AND instr((SELECT key FROM folded_key), c.name_key) = 1
     )

  UNION ALL

  SELECT
    4,
    'hotel',
    h.city_id,
    h.id,
    h.name,
    h.page_url,
    h.sort_order
  FROM hotels AS h
  WHERE instr(h.name_key, (SELECT key FROM folded_key)) > 0
)
ORDER BY priority, sort_order
LIMIT 1;

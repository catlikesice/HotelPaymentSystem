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
  (6, 'Alnwick', 'Northeast England', 'alnwick.html', 'Browse hotels in Alnwick, Northeast England.', 6, 'alnwick', 'alnwick alnwick northeast england browse hotels in alnwick, northeast england.  city'),
  (7, 'Aviemore', 'Scotland', 'aviemore.html', 'Browse hotels in Aviemore, Scotland.', 7, 'aviemore', 'aviemore aviemore scotland browse hotels in aviemore, scotland.  city'),
  (8, 'Bauska', 'Latvia', 'bauska.html', 'Browse hotels in Bauska, Latvia.', 8, 'bauska', 'bauska bauska latvia browse hotels in bauska, latvia.  city'),
  (9, 'Benbecula', 'Scotland', 'benbecula.html', 'Browse hotels in Benbecula, Scotland.', 9, 'benbecula', 'benbecula benbecula scotland browse hotels in benbecula, scotland.  city'),
  (10, 'Bergen', 'Norway', 'bergen.html', 'Browse hotels in Bergen, Norway.', 10, 'bergen', 'bergen bergen norway browse hotels in bergen, norway.  city'),
  (11, 'Berwick-upon-Tweed', 'Northeast England', 'berwick-upon-tweed.html', 'Browse hotels in Berwick-upon-Tweed, Northeast England.', 11, 'berwick-upon-tweed', 'berwick-upon-tweed berwick-upon-tweed northeast england browse hotels in berwick-upon-tweed, northeast england.  city'),
  (12, 'Copenhagen', 'Denmark', 'copenhagen.html', 'Browse hotels in Copenhagen, Denmark.', 12, 'copenhagen', 'copenhagen copenhagen denmark browse hotels in copenhagen, denmark.  city'),
  (13, 'Daugavpils', 'Latvia', 'daugavpils.html', 'Browse hotels in Daugavpils, Latvia.', 13, 'daugavpils', 'daugavpils daugavpils latvia browse hotels in daugavpils, latvia.  city'),
  (14, 'Dundee', 'Scotland', 'dundee.html', 'Browse hotels in Dundee, Scotland.', 14, 'dundee', 'dundee dundee scotland browse hotels in dundee, scotland.  city'),
  (15, 'Edinburgh', 'Scotland', 'edinburgh.html', 'Browse hotels in Edinburgh, Scotland.', 15, 'edinburgh', 'edinburgh edinburgh scotland browse hotels in edinburgh, scotland.  city'),
  (16, 'Esbjerg', 'Denmark', 'esbjerg.html', 'Browse hotels in Esbjerg, Denmark.', 16, 'esbjerg', 'esbjerg esbjerg denmark browse hotels in esbjerg, denmark.  city'),
  (17, 'Espoo', 'Finland', 'espoo.html', 'Browse hotels in Espoo, Finland.', 17, 'espoo', 'espoo espoo finland browse hotels in espoo, finland.  city'),
  (18, 'Fort William', 'Scotland', 'fort-william.html', 'Browse hotels in Fort William, Scotland.', 18, 'fort william', 'fort william fort william scotland browse hotels in fort william, scotland.  city'),
  (19, 'Geilo', 'Norway', 'geilo.html', 'Browse hotels in Geilo, Norway.', 19, 'geilo', 'geilo geilo norway browse hotels in geilo, norway.  city'),
  (20, 'Glasgow', 'Scotland', 'glasgow.html', 'Browse hotels in Glasgow, Scotland.', 20, 'glasgow', 'glasgow glasgow scotland browse hotels in glasgow, scotland.  city'),
  (21, 'Gothenburg', 'Sweden', 'gothenburg.html', 'Browse hotels in Gothenburg, Sweden.', 21, 'gothenburg', 'gothenburg gothenburg sweden browse hotels in gothenburg, sweden.  city'),
  (22, 'Hafnarfjörður', 'Iceland', 'hafnarfjörður.html', 'Browse hotels in Hafnarfjörður, Iceland.', 22, 'hafnarfjordur', 'hafnarfjordur hafnarfjordur iceland browse hotels in hafnarfjordur, iceland.  city'),
  (23, 'Helsinki', 'Finland', 'helsinki.html', 'Browse hotels in Helsinki, Finland.', 23, 'helsinki', 'helsinki helsinki finland browse hotels in helsinki, finland.  city'),
  (24, 'Hemsedal', 'Norway', 'hemsedal.html', 'Browse hotels in Hemsedal, Norway.', 24, 'hemsedal', 'hemsedal hemsedal norway browse hotels in hemsedal, norway.  city'),
  (25, 'Ilulissat', 'Greenland', 'ilulissat.html', 'Browse hotels in Ilulissat, Greenland.', 25, 'ilulissat', 'ilulissat ilulissat greenland browse hotels in ilulissat, greenland.  city'),
  (26, 'Inverness', 'Scotland', 'inverness.html', 'Browse hotels in Inverness, Scotland.', 26, 'inverness', 'inverness inverness scotland browse hotels in inverness, scotland.  city'),
  (27, 'Ísafjörður', 'Iceland', 'ísafjörður.html', 'Browse hotels in Ísafjörður, Iceland.', 27, 'isafjordur', 'isafjordur isafjordur iceland browse hotels in isafjordur, iceland.  city'),
  (28, 'Jelgava', 'Latvia', 'jelgava.html', 'Browse hotels in Jelgava, Latvia.', 28, 'jelgava', 'jelgava jelgava latvia browse hotels in jelgava, latvia.  city'),
  (29, 'Jūrmala', 'Latvia', 'jurmala.html', 'Browse hotels in Jūrmala, Latvia.', 29, 'jurmala', 'jurmala jurmala latvia browse hotels in jurmala, latvia.  city'),
  (30, 'Kaunas', 'Lithuania', 'kaunas.html', 'Browse hotels in Kaunas, Lithuania.', 30, 'kaunas', 'kaunas kaunas lithuania browse hotels in kaunas, lithuania.  city'),
  (31, 'Keflavík', 'Iceland', 'keflavík.html', 'Browse hotels in Keflavík, Iceland.', 31, 'keflavik', 'keflavik keflavik iceland browse hotels in keflavik, iceland.  city'),
  (32, 'Kiruna', 'Sweden', 'kiruna.html', 'Browse hotels in Kiruna, Sweden.', 32, 'kiruna', 'kiruna kiruna sweden browse hotels in kiruna, sweden.  city'),
  (33, 'Klaipėda', 'Lithuania', 'klaipeda.html', 'Browse hotels in Klaipėda, Lithuania.', 33, 'klaipeda', 'klaipeda klaipeda lithuania browse hotels in klaipeda, lithuania.  city'),
  (34, 'Kópavogur', 'Iceland', 'kópavogur.html', 'Browse hotels in Kópavogur, Iceland.', 34, 'kopavogur', 'kopavogur kopavogur iceland browse hotels in kopavogur, iceland.  city'),
  (35, 'Kristiansand', 'Norway', 'kristiansand.html', 'Browse hotels in Kristiansand, Norway.', 35, 'kristiansand', 'kristiansand kristiansand norway browse hotels in kristiansand, norway.  city'),
  (36, 'Lerwick', 'Scotland', 'lerwick.html', 'Browse hotels in Lerwick, Scotland.', 36, 'lerwick', 'lerwick lerwick scotland browse hotels in lerwick, scotland.  city'),
  (37, 'Levi', 'Finland', 'levi.html', 'Browse hotels in Levi, Finland.', 37, 'levi', 'levi levi finland browse hotels in levi, finland.  city'),
  (38, 'Liepāja', 'Latvia', 'liepaja.html', 'Browse hotels in Liepāja, Latvia.', 38, 'liepaja', 'liepaja liepaja latvia browse hotels in liepaja, latvia.  city'),
  (39, 'Lillehammer', 'Norway', 'lillehammer.html', 'Browse hotels in Lillehammer, Norway.', 39, 'lillehammer', 'lillehammer lillehammer norway browse hotels in lillehammer, norway.  city'),
  (40, 'Linköping', 'Sweden', 'linköping.html', 'Browse hotels in Linköping, Sweden.', 40, 'linkoping', 'linkoping linkoping sweden browse hotels in linkoping, sweden.  city'),
  (41, 'Loch Lomond National Park', 'Scotland', 'loch-lomond.html', 'Browse hotels in Loch Lomond National Park, Scotland.', 41, 'loch lomond national park', 'loch lomond national park loch lomond national park scotland browse hotels in loch lomond national park, scotland.  city'),
  (42, 'Longyearbyen', 'Svalbard', 'longyearbyen.html', 'Browse hotels in Longyearbyen, Svalbard.', 42, 'longyearbyen', 'longyearbyen longyearbyen svalbard browse hotels in longyearbyen, svalbard.  city'),
  (43, 'Malmö', 'Sweden', 'malmö.html', 'Browse hotels in Malmö, Sweden.', 43, 'malmo', 'malmo malmo sweden browse hotels in malmo, sweden.  city'),
  (44, 'Mariehamn', 'Åland Islands', 'mariehamn.html', 'Browse hotels in Mariehamn, Åland Islands.', 44, 'mariehamn', 'mariehamn mariehamn aland islands browse hotels in mariehamn, aland islands.  city'),
  (45, 'Narva', 'Estonia', 'narva.html', 'Browse hotels in Narva, Estonia.', 45, 'narva', 'narva narva estonia browse hotels in narva, estonia.  city'),
  (46, 'Newcastle', 'Northeast England', 'newcastle.html', 'Browse hotels in Newcastle upon Tyne, Northeast England.', 46, 'newcastle', 'newcastle newcastle northeast england browse hotels in newcastle upon tyne, northeast england.  city'),
  (47, 'Northumberland National Park', 'Northeast England', 'northumberland-national-park.html', 'Browse hotels in Northumberland National Park, Northeast England.', 47, 'northumberland national park', 'northumberland national park northumberland national park northeast england browse hotels in northumberland national park, northeast england.  city'),
  (48, 'Nuuk', 'Greenland', 'nuuk.html', 'Browse hotels in Nuuk, Greenland.', 48, 'nuuk', 'nuuk nuuk greenland browse hotels in nuuk, greenland.  city'),
  (49, 'Oban', 'Scotland', 'oban.html', 'Browse hotels in Oban, Scotland.', 49, 'oban', 'oban oban scotland browse hotels in oban, scotland.  city'),
  (50, 'Odense', 'Denmark', 'odense.html', 'Browse hotels in Odense, Denmark.', 50, 'odense', 'odense odense denmark browse hotels in odense, denmark.  city'),
  (51, 'Oslo', 'Norway', 'oslo.html', 'Browse hotels in Oslo, Norway.', 51, 'oslo', 'oslo oslo norway browse hotels in oslo, norway.  city'),
  (52, 'Oulu', 'Finland', 'oulu.html', 'Browse hotels in Oulu, Finland.', 52, 'oulu', 'oulu oulu finland browse hotels in oulu, finland.  city'),
  (53, 'Panevėžys', 'Lithuania', 'panevėžys.html', 'Browse hotels in Panevėžys, Lithuania.', 53, 'panevezys', 'panevezys panevezys lithuania browse hotels in panevezys, lithuania.  city'),
  (54, 'Pärnu', 'Estonia', 'pärnu.html', 'Browse hotels in Pärnu, Estonia.', 54, 'parnu', 'parnu parnu estonia browse hotels in parnu, estonia.  city'),
  (55, 'Pitlochry', 'Scotland', 'pitlochry.html', 'Browse hotels in Pitlochry, Scotland.', 55, 'pitlochry', 'pitlochry pitlochry scotland browse hotels in pitlochry, scotland.  city'),
  (56, 'Portree', 'Scotland', 'portree.html', 'Browse hotels in Portree, Scotland.', 56, 'portree', 'portree portree scotland browse hotels in portree, scotland.  city'),
  (57, 'Reykjanesbær', 'Iceland', 'reykjanesbær.html', 'Browse hotels in Reykjanesbær, Iceland.', 57, 'reykjanesbaer', 'reykjanesbaer reykjanesbaer iceland browse hotels in reykjanesbaer, iceland.  city'),
  (58, 'Reykjavík', 'Iceland', 'reykjavík.html', 'Browse hotels in Reykjavík, Iceland.', 58, 'reykjavik', 'reykjavik reykjavik iceland browse hotels in reykjavik, iceland.  city'),
  (59, 'Riga', 'Latvia', 'riga.html', 'Browse hotels in Riga, Latvia.', 59, 'riga', 'riga riga latvia browse hotels in riga, latvia.  city'),
  (60, 'Rovaniemi', 'Finland', 'rovaniemi.html', 'Browse hotels in Rovaniemi, Finland.', 60, 'rovaniemi', 'rovaniemi rovaniemi finland browse hotels in rovaniemi, finland.  city'),
  (61, 'Sälen', 'Sweden', 'salen.html', 'Browse hotels in Sälen, Sweden.', 61, 'salen', 'salen salen sweden browse hotels in salen, sweden.  city'),
  (62, 'Sauðárkrókur', 'Iceland', 'sauðárkrókur.html', 'Browse hotels in Sauðárkrókur, Iceland.', 62, 'saudarkrokur', 'saudarkrokur saudarkrokur iceland browse hotels in saudarkrokur, iceland.  city'),
  (63, 'Šiauliai', 'Lithuania', 'šiauliai.htm', 'Browse hotels in Šiauliai, Lithuania.', 63, 'siauliai', 'siauliai siauliai lithuania browse hotels in siauliai, lithuania.  city'),
  (64, 'Skagen', 'Denmark', 'skagen.html', 'Browse hotels in Skagen, Denmark.', 64, 'skagen', 'skagen skagen denmark browse hotels in skagen, denmark.  city'),
  (65, 'St Andrews', 'Scotland', 'st-andrews.html', 'Browse hotels in St Andrews, Scotland.', 65, 'st andrews', 'st andrews st andrews scotland browse hotels in st andrews, scotland.  city'),
  (66, 'Stavanger', 'Norway', 'stavanger.html', 'Browse hotels in Stavanger, Norway.', 66, 'stavanger', 'stavanger stavanger norway browse hotels in stavanger, norway.  city'),
  (67, 'Stirling', 'Scotland', 'stirling.html', 'Browse hotels in Stirling, Scotland.', 67, 'stirling', 'stirling stirling scotland browse hotels in stirling, scotland.  city'),
  (68, 'Stockholm', 'Sweden', 'stockholm.html', 'Browse hotels in Stockholm, Sweden.', 68, 'stockholm', 'stockholm stockholm sweden browse hotels in stockholm, sweden.  city'),
  (69, 'Stornoway', 'Scotland', 'stornoway.html', 'Browse hotels in Stornoway, Scotland.', 69, 'stornoway', 'stornoway stornoway scotland browse hotels in stornoway, scotland.  city'),
  (70, 'Tallinn', 'Estonia', 'tallinn.html', 'Browse hotels in Tallinn, Estonia.', 70, 'tallinn', 'tallinn tallinn estonia browse hotels in tallinn, estonia.  city'),
  (71, 'Tampere', 'Finland', 'tampere.html', 'Browse hotels in Tampere, Finland.', 71, 'tampere', 'tampere tampere finland browse hotels in tampere, finland.  city'),
  (72, 'Tartu', 'Estonia', 'tartu.html', 'Browse hotels in Tartu, Estonia.', 72, 'tartu', 'tartu tartu estonia browse hotels in tartu, estonia.  city'),
  (73, 'Tórshavn', 'Faroe Islands', 'tórshavn.html', 'Browse hotels in Tórshavn, Faroe Islands.', 73, 'torshavn', 'torshavn torshavn faroe islands browse hotels in torshavn, faroe islands.  city'),
  (74, 'Tromsø', 'Norway', 'tromso.html', 'Browse hotels in Tromsø, Norway.', 74, 'tromso', 'tromso tromso norway browse hotels in tromso, norway.  city'),
  (75, 'Trondheim', 'Norway', 'trondheim.html', 'Browse hotels in Trondheim, Norway.', 75, 'trondheim', 'trondheim trondheim norway browse hotels in trondheim, norway.  city'),
  (76, 'Turku', 'Finland', 'turku.html', 'Browse hotels in Turku, Finland.', 76, 'turku', 'turku turku finland browse hotels in turku, finland.  city'),
  (77, 'Ullapool', 'Scotland', 'ullapool.html', 'Browse hotels in Ullapool, Scotland.', 77, 'ullapool', 'ullapool ullapool scotland browse hotels in ullapool, scotland.  city'),
  (78, 'Uppsala', 'Sweden', 'uppsala.html', 'Browse hotels in Uppsala, Sweden.', 78, 'uppsala', 'uppsala uppsala sweden browse hotels in uppsala, sweden.  city'),
  (79, 'Vestmannaeyjar', 'Iceland', 'vestmannaeyjar.html', 'Browse hotels in Vestmannaeyjar, Iceland.', 79, 'vestmannaeyjar', 'vestmannaeyjar vestmannaeyjar iceland browse hotels in vestmannaeyjar, iceland.  city'),
  (80, 'Viljandi', 'Estonia', 'viljandi.html', 'Browse hotels in Viljandi, Estonia.', 80, 'viljandi', 'viljandi viljandi estonia browse hotels in viljandi, estonia.  city'),
  (81, 'Vilnius', 'Lithuania', 'vilnius.html', 'Browse hotels in Vilnius, Lithuania.', 81, 'vilnius', 'vilnius vilnius lithuania browse hotels in vilnius, lithuania.  city'),
  (82, 'Voss', 'Norway', 'voss.html', 'Browse hotels in Voss, Norway.', 82, 'voss', 'voss voss norway browse hotels in voss, norway.  city'),
  (83, 'Ylläs', 'Finland', 'yllas.html', 'Browse hotels in Ylläs, Finland.', 83, 'yllas', 'yllas yllas finland browse hotels in yllas, finland.  city'),
  (84, 'Nida', 'Lithuania', NULL, 'Browse hotels in Nida, Lithuania.', 84, 'nida', 'nida nida lithuania browse hotels in nida, lithuania.  city'),
  (85, 'Barentsburg', 'Svalbard', NULL, 'Browse hotels in Barentsburg, Svalbard.', 85, 'barentsburg', 'barentsburg barentsburg svalbard browse hotels in barentsburg, svalbard.  city'),
  (86, 'Pyramiden', 'Svalbard', NULL, 'Browse hotels in Pyramiden, Svalbard.', 86, 'pyramiden', 'pyramiden pyramiden svalbard browse hotels in pyramiden, svalbard.  city'),
  (87, 'Palanga', 'Lithuania', NULL, 'Browse hotels in Palanga, Lithuania.', 87, 'palanga', 'palanga palanga lithuania browse hotels in palanga, lithuania.  city'),
  (88, 'Druskininkai', 'Lithuania', NULL, 'Browse hotels in Druskininkai, Lithuania.', 88, 'druskininkai', 'druskininkai druskininkai lithuania browse hotels in druskininkai, lithuania.  city'),
  (89, 'Trakai', 'Lithuania', NULL, 'Browse hotels in Trakai, Lithuania.', 89, 'trakai', 'trakai trakai lithuania browse hotels in trakai, lithuania.  city'),
  (90, 'Porvoo', 'Finland', NULL, 'Browse hotels in Porvoo, Finland.', 90, 'porvoo', 'porvoo porvoo finland browse hotels in porvoo, finland.  city'),
  (91, 'Kuopio', 'Finland', NULL, 'Browse hotels in Kuopio, Finland.', 91, 'kuopio', 'kuopio kuopio finland browse hotels in kuopio, finland.  city'),
  (92, 'Savonlinna', 'Finland', NULL, 'Browse hotels in Savonlinna, Finland.', 92, 'savonlinna', 'savonlinna savonlinna finland browse hotels in savonlinna, finland.  city'),
  (93, 'Jukkasjärvi', 'Sweden', NULL, 'Browse hotels in Jukkasjärvi, Sweden.', 93, 'jukkasjarvi', 'jukkasjarvi jukkasjarvi sweden browse hotels in jukkasjarvi, sweden.  city'),
  (94, 'Gjógv', 'Faroe Islands', NULL, 'Browse hotels in Gjógv, Faroe Islands.', 94, 'gjogv', 'gjogv gjogv faroe islands browse hotels in gjogv, faroe islands.  city'),
  (95, 'Saksun', 'Faroe Islands', NULL, 'Browse hotels in Saksun, Faroe Islands.', 95, 'saksun', 'saksun saksun faroe islands browse hotels in saksun, faroe islands.  city'),
  (96, 'Mykines', 'Faroe Islands', NULL, 'Browse hotels in Mykines, Faroe Islands.', 96, 'mykines', 'mykines mykines faroe islands browse hotels in mykines, faroe islands.  city'),
  (97, 'Nólsoy', 'Faroe Islands', NULL, 'Browse hotels in Nólsoy, Faroe Islands.', 97, 'nolsoy', 'nolsoy nolsoy faroe islands browse hotels in nolsoy, faroe islands.  city'),
  (98, 'Vágar', 'Faroe Islands', NULL, 'Browse hotels in Vágar, Faroe Islands.', 98, 'vagar', 'vagar vagar faroe islands browse hotels in vagar, faroe islands.  city'),
  (99, 'Streymoy', 'Faroe Islands', NULL, 'Browse hotels in Streymoy, Faroe Islands.', 99, 'streymoy', 'streymoy streymoy faroe islands browse hotels in streymoy, faroe islands.  city'),
  (100, 'Eysturoy', 'Faroe Islands', NULL, 'Browse hotels in Eysturoy, Faroe Islands.', 100, 'eysturoy', 'eysturoy eysturoy faroe islands browse hotels in eysturoy, faroe islands.  city'),
  (101, 'Ny-Ålesund', 'Svalbard', NULL, 'Browse hotels in Ny-Ålesund, Svalbard.', 101, 'ny-alesund', 'ny-alesund ny-alesund svalbard browse hotels in ny-alesund, svalbard.  city'),
  (102, 'Kastelholm', 'Åland Islands', NULL, 'Browse hotels in Kastelholm, Åland Islands.', 102, 'kastelholm', 'kastelholm kastelholm aland islands browse hotels in kastelholm, aland islands.  city'),
  (103, 'Bomarsund', 'Åland Islands', NULL, 'Browse hotels in Bomarsund, Åland Islands.', 103, 'bomarsund', 'bomarsund bomarsund aland islands browse hotels in bomarsund, aland islands.  city'),
  (104, 'Isle of Skye', 'Scotland', NULL, 'Browse hotels in Isle of Skye, Scotland.', 104, 'isle of skye', 'isle of skye isle of skye scotland browse hotels in isle of skye, scotland.  city'),
  (105, 'Kirkwall', 'Scotland', NULL, 'Browse hotels in Kirkwall, Scotland.', 105, 'kirkwall', 'kirkwall kirkwall scotland browse hotels in kirkwall, scotland.  city'),
  (106, 'Tobermory', 'Scotland', NULL, 'Browse hotels in Tobermory, Scotland.', 106, 'tobermory', 'tobermory tobermory scotland browse hotels in tobermory, scotland.  city'),
  (107, 'Uist', 'Scotland', NULL, 'Browse hotels in Uist, Scotland.', 107, 'uist', 'uist uist scotland browse hotels in uist, scotland.  city'),
  (108, 'Tarbert (Harris)', 'Scotland', NULL, 'Browse hotels in Tarbert (Harris), Scotland.', 108, 'tarbert (harris)', 'tarbert (harris) tarbert (harris) scotland browse hotels in tarbert (harris), scotland.  city'),
  (109, 'Uig', 'Scotland', NULL, 'Browse hotels in Uig, Scotland.', 109, 'uig', 'uig uig scotland browse hotels in uig, scotland.  city'),
  (110, 'Dunvegan', 'Scotland', NULL, 'Browse hotels in Dunvegan, Scotland.', 110, 'dunvegan', 'dunvegan dunvegan scotland browse hotels in dunvegan, scotland.  city'),
  (111, 'Broadford', 'Scotland', NULL, 'Browse hotels in Broadford, Scotland.', 111, 'broadford', 'broadford broadford scotland browse hotels in broadford, scotland.  city'),
  (112, 'Armadale', 'Scotland', NULL, 'Browse hotels in Armadale, Scotland.', 112, 'armadale', 'armadale armadale scotland browse hotels in armadale, scotland.  city'),
  (113, 'Lochmaddy', 'Scotland', NULL, 'Browse hotels in Lochmaddy, Scotland.', 113, 'lochmaddy', 'lochmaddy lochmaddy scotland browse hotels in lochmaddy, scotland.  city');

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
  (12, 8, 'Hotel Bauska', 'hotel-bauska.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Town-centre hotel a short walk from Bauska Castle and the Mēmele river promenade.', 12, 'hotel bauska', 'hotel bauska — bauska', 'hotel bauska bauska latvia town-centre hotel a short walk from bauska castle and the memele river promenade. 0.05 eth / night hotel'),
  (13, 8, 'Bauska Castle Hotel', 'bauska-castle-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stay beside the castle ruins, with views over the Mūsa and Mēmele confluence.', 13, 'bauska castle hotel', 'bauska castle hotel — bauska', 'bauska castle hotel bauska latvia stay beside the castle ruins, with views over the musa and memele confluence. 0.06 eth / night hotel'),
  (14, 9, 'Dark Island Hotel', 'dark-island-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Roadside hotel in Liniclate on Benbecula, between the machair and the road south.', 14, 'dark island hotel', 'dark island hotel — benbecula', 'dark island hotel benbecula scotland roadside hotel in liniclate on benbecula, between the machair and the road south. 0.08 eth / night hotel'),
  (15, 9, 'Balivanich Airport House', 'balivanich-airport-house.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'House beside Benbecula Airport in Balivanich, a short walk from the shops and the shore.', 15, 'balivanich airport house', 'balivanich airport house — benbecula', 'balivanich airport house benbecula scotland house beside benbecula airport in balivanich, a short walk from the shops and the shore. 0.06 eth / night hotel'),
  (16, 9, 'Culla Bay Hotel', 'culla-bay-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Shore hotel on Benbecula, facing the white sand of Culla Bay.', 16, 'culla bay hotel', 'culla bay hotel — benbecula', 'culla bay hotel benbecula scotland shore hotel on benbecula, facing the white sand of culla bay. 0.07 eth / night hotel'),
  (17, 5, 'Icelandair Hotel Akureyri', 'icelandair-hotel-akureyri.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.075 ETH / night', 0.075, 'Contemporary hotel near the botanical garden, with views toward the ski slopes.', 17, 'icelandair hotel akureyri', 'icelandair hotel akureyri — akureyri', 'icelandair hotel akureyri akureyri iceland contemporary hotel near the botanical garden, with views toward the ski slopes. 0.075 eth / night hotel'),
  (18, 6, 'The Cookie Jar', 'the-cookie-jar.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Boutique rooms in a former convent on Bailiffgate, a short walk from Alnwick Castle.', 18, 'the cookie jar', 'the cookie jar — alnwick', 'the cookie jar alnwick northeast england boutique rooms in a former convent on bailiffgate, a short walk from alnwick castle. 0.07 eth / night hotel'),
  (19, 6, 'The Oaks Hotel', 'the-oaks-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Country hotel on the edge of Alnwick, handy for the castle gardens and the coast.', 19, 'the oaks hotel', 'the oaks hotel — alnwick', 'the oaks hotel alnwick northeast england country hotel on the edge of alnwick, handy for the castle gardens and the coast. 0.06 eth / night hotel'),
  (20, 6, 'White Swan Hotel', 'white-swan-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Coaching inn on Bondgate in the market-town centre, close to the castle gate.', 20, 'white swan hotel', 'white swan hotel — alnwick', 'white swan hotel alnwick northeast england coaching inn on bondgate in the market-town centre, close to the castle gate. 0.05 eth / night hotel'),
  (21, 7, 'Cairngorm Hotel', 'cairngorm-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'High Street hotel in Aviemore, a base for the Cairngorm plateau.', 21, 'cairngorm hotel', 'cairngorm hotel — aviemore', 'cairngorm hotel aviemore scotland high street hotel in aviemore, a base for the cairngorm plateau. 0.08 eth / night hotel'),
  (22, 7, 'Rothiemurchus Lodge', 'rothiemurchus-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Forest lodge on the edge of Aviemore, beside the Rothiemurchus pines.', 22, 'rothiemurchus lodge', 'rothiemurchus lodge — aviemore', 'rothiemurchus lodge aviemore scotland forest lodge on the edge of aviemore, beside the rothiemurchus pines. 0.07 eth / night hotel'),
  (23, 7, 'Spey Valley Hotel', 'spey-valley-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Riverside hotel in Aviemore, looking toward the Spey and the mountain railway.', 23, 'spey valley hotel', 'spey valley hotel — aviemore', 'spey valley hotel aviemore scotland riverside hotel in aviemore, looking toward the spey and the mountain railway. 0.06 eth / night hotel'),
  (24, 10, 'Clarion Hotel Admiral', 'clarion-hotel-admiral.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel facing Bryggen, with harbour-view rooms and a rooftop restaurant.', 24, 'clarion hotel admiral', 'clarion hotel admiral — bergen', 'clarion hotel admiral bergen norway waterfront hotel facing bryggen, with harbour-view rooms and a rooftop restaurant. 0.09 eth / night hotel'),
  (25, 10, 'Hotel Norge by Scandic', 'hotel-norge-by-scandic.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.1 ETH / night', 0.1, 'Rebuilt city-centre icon on Ole Bulls plass, a short walk from the fish market.', 25, 'hotel norge by scandic', 'hotel norge by scandic — bergen', 'hotel norge by scandic bergen norway rebuilt city-centre icon on ole bulls plass, a short walk from the fish market. 0.1 eth / night hotel'),
  (26, 10, 'Steens Hotel', 'steens-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Intimate Swiss-chalet style guesthouse near Nygårdsparken, handy for the funicular.', 26, 'steens hotel', 'steens hotel — bergen', 'steens hotel bergen norway intimate swiss-chalet style guesthouse near nygardsparken, handy for the funicular. 0.06 eth / night hotel'),
  (27, 11, 'Marshall Meadows Country House', 'marshall-meadows-country-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Georgian country house on the coast just north of town, with sea views and period rooms.', 27, 'marshall meadows country house', 'marshall meadows country house — berwick-upon-tweed', 'marshall meadows country house berwick-upon-tweed northeast england georgian country house on the coast just north of town, with sea views and period rooms. 0.05 eth / night hotel'),
  (28, 11, 'The King’s Arms Hotel', 'the-kings-arms-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Historic coaching inn in the town centre, a short walk from the Elizabethan walls.', 28, 'the kings arms hotel', 'the kings arms hotel — berwick-upon-tweed', 'the kings arms hotel berwick-upon-tweed northeast england historic coaching inn in the town centre, a short walk from the elizabethan walls. 0.04 eth / night hotel'),
  (29, 11, 'The Walls Guest House', 'the-walls-guest-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Friendly townhouse stay beside Berwick’s ramparts, close to the Tweed estuary.', 29, 'the walls guest house', 'the walls guest house — berwick-upon-tweed', 'the walls guest house berwick-upon-tweed northeast england friendly townhouse stay beside berwicks ramparts, close to the tweed estuary. 0.03 eth / night hotel'),
  (30, 12, 'CABINN City', 'cabinn-city.html', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80', '0.021 ETH / night', 0.021, '', 30, 'cabinn city', 'cabinn city — copenhagen', 'cabinn city copenhagen denmark  0.021 eth / night hotel'),
  (31, 12, 'Comwell Copenhagen Portside', 'comwell-copenhagen-portside.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80', '0.038 ETH / night', 0.038, '', 31, 'comwell copenhagen portside', 'comwell copenhagen portside — copenhagen', 'comwell copenhagen portside copenhagen denmark  0.038 eth / night hotel'),
  (32, 12, 'First Hotel Kong Frederik', 'first-hotel-kong-frederik.html', 'https://images.unsplash.com/photo-1504609813445-554e64a8f005?auto=format&fit=crop&w=600&q=80', '0.033 ETH / night', 0.033, 'Back to Booking', 32, 'first hotel kong frederik', 'first hotel kong frederik — copenhagen', 'first hotel kong frederik copenhagen denmark back to booking 0.033 eth / night hotel'),
  (33, 12, 'Imperial Hotel', 'imperial-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80', '0.045 ETH / night', 0.045, '', 33, 'imperial hotel', 'imperial hotel — copenhagen', 'imperial hotel copenhagen denmark  0.045 eth / night hotel'),
  (34, 12, 'Scandic Palace Hotel', 'scandic-copenhagen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', '0.042 ETH / night', 0.042, '', 34, 'scandic palace hotel', 'scandic palace hotel — copenhagen', 'scandic palace hotel copenhagen denmark  0.042 eth / night hotel'),
  (35, 12, 'Zleep Hotel Copenhagen City', 'zleep-hotel-copenhagen-city.html', 'https://images.unsplash.com/photo-1454023492550-5696f8ff10e1?auto=format&fit=crop&w=600&q=80', '0.027 ETH / night', 0.027, '', 35, 'zleep hotel copenhagen city', 'zleep hotel copenhagen city — copenhagen', 'zleep hotel copenhagen city copenhagen denmark  0.027 eth / night hotel'),
  (36, 12, 'Hotel d’Angleterre', 'hotel-dangleterre-copenhagen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=600&q=80', '0.12 ETH / night', 0.12, 'Historic five-star hotel on Kongens Nytorv, with luxury amenities and fine dining.', 36, 'hotel dangleterre', 'hotel dangleterre — copenhagen', 'hotel dangleterre copenhagen denmark historic five-star hotel on kongens nytorv, with luxury amenities and fine dining. 0.12 eth / night hotel'),
  (37, 13, 'Biplan Hotel', 'biplan-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.025 ETH / night', 0.025, 'Budget-friendly hotel with cozy rooms and a convenient location.', 37, 'biplan hotel', 'biplan hotel — daugavpils', 'biplan hotel daugavpils latvia budget-friendly hotel with cozy rooms and a convenient location. 0.025 eth / night hotel'),
  (38, 13, 'Hotel Dinaburg', 'hotel-dinaburg.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Comfortable rooms, restaurant, and wellness area close to Daugavpils fortress.', 38, 'hotel dinaburg', 'hotel dinaburg — daugavpils', 'hotel dinaburg daugavpils latvia comfortable rooms, restaurant, and wellness area close to daugavpils fortress. 0.03 eth / night hotel'),
  (39, 13, 'Park Hotel Latgola', 'park-hotel-latgola.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Modern hotel in the city center with panoramic views and conference facilities.', 39, 'park hotel latgola', 'park hotel latgola — daugavpils', 'park hotel latgola daugavpils latvia modern hotel in the city center with panoramic views and conference facilities. 0.04 eth / night hotel'),
  (40, 14, 'Apex City Quay Hotel & Spa', 'apex-city-quay-hotel-and-spa.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel on Dundee’s City Quay with spa and easy access to the V&A.', 40, 'apex city quay hotel & spa', 'apex city quay hotel & spa — dundee', 'apex city quay hotel & spa dundee scotland waterfront hotel on dundees city quay with spa and easy access to the v&a. 0.07 eth / night hotel'),
  (41, 14, 'Hotel Indigo Dundee', 'hotel-indigo-dundee.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Design hotel in a historic jute mill near Dundee city centre.', 41, 'hotel indigo dundee', 'hotel indigo dundee — dundee', 'hotel indigo dundee dundee scotland design hotel in a historic jute mill near dundee city centre. 0.055 eth / night hotel'),
  (42, 14, 'Malmaison Dundee', 'malmaison-dundee.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Characterful hotel in a converted church, walking distance from the waterfront.', 42, 'malmaison dundee', 'malmaison dundee — dundee', 'malmaison dundee dundee scotland characterful hotel in a converted church, walking distance from the waterfront. 0.06 eth / night hotel'),
  (43, 15, 'Hotel du Vin Edinburgh', 'hotel-du-vin-edinburgh.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Boutique townhouse hotel in the Old Town, close to the Royal Mile.', 43, 'hotel du vin edinburgh', 'hotel du vin edinburgh — edinburgh', 'hotel du vin edinburgh edinburgh scotland boutique townhouse hotel in the old town, close to the royal mile. 0.08 eth / night hotel'),
  (44, 15, 'The Balmoral', 'the-balmoral.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Historic luxury hotel on Princes Street, steps from Waverley Station and Edinburgh Castle.', 44, 'the balmoral', 'the balmoral — edinburgh', 'the balmoral edinburgh scotland historic luxury hotel on princes street, steps from waverley station and edinburgh castle. 0.14 eth / night hotel'),
  (45, 15, 'Waldorf Astoria Edinburgh', 'waldorf-astoria-edinburgh.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Grand landmark hotel at the west end of Princes Street with spa and castle views.', 45, 'waldorf astoria edinburgh', 'waldorf astoria edinburgh — edinburgh', 'waldorf astoria edinburgh edinburgh scotland grand landmark hotel at the west end of princes street with spa and castle views. 0.12 eth / night hotel'),
  (46, 16, 'Hotel Ansgar', 'hotel-ansgar.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80', '0.025 ETH / night', 0, 'Back to Booking', 46, 'hotel ansgar', 'hotel ansgar — esbjerg', 'hotel ansgar esbjerg denmark back to booking 0.025 eth / night hotel'),
  (47, 16, 'Hotel Britannia', 'hotel-britannia.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', '0.035 ETH / night', 0, '', 47, 'hotel britannia', 'hotel britannia — esbjerg', 'hotel britannia esbjerg denmark  0.035 eth / night hotel'),
  (48, 16, 'Scandic Olympic', 'scandic-olympic.html', 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80', '0.029 ETH / night', 0, '', 48, 'scandic olympic', 'scandic olympic — esbjerg', 'scandic olympic esbjerg denmark  0.029 eth / night hotel'),
  (49, 17, 'Glo Hotel Sello', 'glo-hotel-sello.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary hotel next to Sello shopping center, great for families and business.', 49, 'glo hotel sello', 'glo hotel sello — espoo', 'glo hotel sello espoo finland contemporary hotel next to sello shopping center, great for families and business. 0.08 eth / night hotel'),
  (50, 17, 'Hotel Matts', 'hotel-matts.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern hotel in Espoo offering stylish rooms and apartments.', 50, 'hotel matts', 'hotel matts — espoo', 'hotel matts espoo finland modern hotel in espoo offering stylish rooms and apartments. 0.07 eth / night hotel'),
  (51, 17, 'Radisson Blu Hotel Espoo', 'radisson-blu-hotel-espoo.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel with excellent meeting facilities and nature access.', 51, 'radisson blu hotel espoo', 'radisson blu hotel espoo — espoo', 'radisson blu hotel espoo espoo finland waterfront hotel with excellent meeting facilities and nature access. 0.09 eth / night hotel'),
  (52, 18, 'Alexandra Hotel', 'alexandra-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'High Street hotel in Fort William, facing the parade toward Loch Linnhe.', 52, 'alexandra hotel', 'alexandra hotel — fort william', 'alexandra hotel fort william scotland high street hotel in fort william, facing the parade toward loch linnhe. 0.06 eth / night hotel'),
  (53, 18, 'Ben Nevis Lodge', 'ben-nevis-lodge.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Highland lodge in Fort William, with glen views and a path toward Ben Nevis.', 53, 'ben nevis lodge', 'ben nevis lodge — fort william', 'ben nevis lodge fort william scotland highland lodge in fort william, with glen views and a path toward ben nevis. 0.07 eth / night hotel'),
  (54, 18, 'The Lime Tree Hotel', 'the-lime-tree-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town-centre hotel in Fort William, a short walk from the High Street and the loch.', 54, 'the lime tree hotel', 'the lime tree hotel — fort william', 'the lime tree hotel fort william scotland town-centre hotel in fort william, a short walk from the high street and the loch. 0.08 eth / night hotel'),
  (55, 19, 'Bardøla Høyfjellshotell', 'bardola-hoyfjellshotell.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Mountain hotel above Geilo, with ski slopes and a path onto the Hardangervidda.', 55, 'bardola hoyfjellshotell', 'bardola hoyfjellshotell — geilo', 'bardola hoyfjellshotell geilo norway mountain hotel above geilo, with ski slopes and a path onto the hardangervidda. 0.09 eth / night hotel'),
  (56, 19, 'Dr. Holms Hotel', 'dr-holms-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historic timber hotel in Geilo, beside the railway and the village centre.', 56, 'dr. holms hotel', 'dr. holms hotel — geilo', 'dr. holms hotel geilo norway historic timber hotel in geilo, beside the railway and the village centre. 0.07 eth / night hotel'),
  (57, 19, 'Hotel Vestlia', 'hotel-vestlia.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Family hotel on the west side of Geilo, close to the cross-country trails.', 57, 'hotel vestlia', 'hotel vestlia — geilo', 'hotel vestlia geilo norway family hotel on the west side of geilo, close to the cross-country trails. 0.08 eth / night hotel'),
  (58, 20, 'Kimpton Blythswood Square', 'kimpton-blythswood-square.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Elegant Georgian square hotel with spa in the heart of Glasgow.', 58, 'kimpton blythswood square', 'kimpton blythswood square — glasgow', 'kimpton blythswood square glasgow scotland elegant georgian square hotel with spa in the heart of glasgow. 0.10 eth / night hotel'),
  (59, 20, 'Motel One Glasgow', 'motel-one-glasgow.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Stylish budget-friendly stay on Argyle Street near the River Clyde.', 59, 'motel one glasgow', 'motel one glasgow — glasgow', 'motel one glasgow glasgow scotland stylish budget-friendly stay on argyle street near the river clyde. 0.04 eth / night hotel'),
  (60, 20, 'Radisson Blu Hotel, Glasgow', 'radisson-blu-hotel-glasgow.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Contemporary hotel beside Glasgow Central Station, ideal for exploring the city.', 60, 'radisson blu hotel, glasgow', 'radisson blu hotel, glasgow — glasgow', 'radisson blu hotel, glasgow glasgow scotland contemporary hotel beside glasgow central station, ideal for exploring the city. 0.07 eth / night hotel'),
  (61, 21, 'Clarion Hotel Post', 'clarion-hotel-post.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Converted central post office with a rooftop pool, next to Drottningtorget and the station.', 61, 'clarion hotel post', 'clarion hotel post — gothenburg', 'clarion hotel post gothenburg sweden converted central post office with a rooftop pool, next to drottningtorget and the station. 0.08 eth / night hotel'),
  (62, 21, 'Hotel Eggers', 'hotel-eggers.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Classic 19th-century hotel by the railway station, close to Avenyn and the opera.', 62, 'hotel eggers', 'hotel eggers — gothenburg', 'hotel eggers gothenburg sweden classic 19th-century hotel by the railway station, close to avenyn and the opera. 0.06 eth / night hotel'),
  (63, 21, 'Upper House', 'upper-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Design hotel high above Liseberg with a spa, skyline views, and Nordic cuisine.', 63, 'upper house', 'upper house — gothenburg', 'upper house gothenburg sweden design hotel high above liseberg with a spa, skyline views, and nordic cuisine. 0.12 eth / night hotel'),
  (64, 22, 'Helguhús Guesthouse', 'helguhus-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Homely guesthouse in a quiet neighbourhood, a short drive from the capital.', 64, 'helguhus guesthouse', 'helguhus guesthouse — hafnarfjordur', 'helguhus guesthouse hafnarfjordur iceland homely guesthouse in a quiet neighbourhood, a short drive from the capital. 0.035 eth / night hotel'),
  (65, 22, 'Hótel Hafnarfjörður', 'hotel-hafnarfjordur.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Straightforward town hotel close to the lava fields, harbour, and Reykjavík bus routes.', 65, 'hotel hafnarfjordur', 'hotel hafnarfjordur — hafnarfjordur', 'hotel hafnarfjordur hafnarfjordur iceland straightforward town hotel close to the lava fields, harbour, and reykjavik bus routes. 0.05 eth / night hotel'),
  (66, 22, 'Hotel Viking', 'hotel-viking.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.065 ETH / night', 0.065, 'Characterful harbour hotel with Norse-inspired interiors and a popular restaurant.', 66, 'hotel viking', 'hotel viking — hafnarfjordur', 'hotel viking hafnarfjordur iceland characterful harbour hotel with norse-inspired interiors and a popular restaurant. 0.065 eth / night hotel'),
  (67, 23, 'Hotel Helka', 'hotel-helka-helsinki.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stylish boutique hotel with Finnish design and cozy atmosphere.', 67, 'hotel helka', 'hotel helka — helsinki', 'hotel helka helsinki finland stylish boutique hotel with finnish design and cozy atmosphere. 0.06 eth / night hotel'),
  (68, 23, 'Hotel Kämp', 'hotel-kamp-helsinki.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Historic luxury hotel in the heart of Helsinki with elegant rooms and spa.', 68, 'hotel kamp', 'hotel kamp — helsinki', 'hotel kamp helsinki finland historic luxury hotel in the heart of helsinki with elegant rooms and spa. 0.13 eth / night hotel'),
  (69, 23, 'Scandic Grand Central', 'scandic-grand-central-helsinki.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary hotel next to Helsinki Central Station, great for exploring the city.', 69, 'scandic grand central', 'scandic grand central — helsinki', 'scandic grand central helsinki finland contemporary hotel next to helsinki central station, great for exploring the city. 0.08 eth / night hotel'),
  (70, 24, 'Harahorn', 'harahorn.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Timber hotel in Hemsedal, set among the valley farms below the alpine slopes.', 70, 'harahorn', 'harahorn — hemsedal', 'harahorn hemsedal norway timber hotel in hemsedal, set among the valley farms below the alpine slopes. 0.09 eth / night hotel'),
  (71, 24, 'Hotel Skogstad', 'hotel-skogstad.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Village hotel in Hemsedal, at the foot of the ski area and the river.', 71, 'hotel skogstad', 'hotel skogstad — hemsedal', 'hotel skogstad hemsedal norway village hotel in hemsedal, at the foot of the ski area and the river. 0.07 eth / night hotel'),
  (72, 24, 'Skarsnuten Hotel', 'skarsnuten-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Mountaintop hotel above Hemsedal, with wide views over the valley.', 72, 'skarsnuten hotel', 'skarsnuten hotel — hemsedal', 'skarsnuten hotel hemsedal norway mountaintop hotel above hemsedal, with wide views over the valley. 0.08 eth / night hotel'),
  (73, 26, 'Glen Mhor Hotel', 'glen-mhor-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Riverside hotel with restaurant, close to Inverness Castle.', 73, 'glen mhor hotel', 'glen mhor hotel — inverness', 'glen mhor hotel inverness scotland riverside hotel with restaurant, close to inverness castle. 0.05 eth / night hotel'),
  (74, 26, 'Kingsmills Hotel', 'kingsmills-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Highland hotel with gardens and golf, a short walk from Inverness city centre.', 74, 'kingsmills hotel', 'kingsmills hotel — inverness', 'kingsmills hotel inverness scotland highland hotel with gardens and golf, a short walk from inverness city centre. 0.08 eth / night hotel'),
  (75, 26, 'Rocpool Reserve Hotel', 'rocpool-reserve-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Boutique luxury stay overlooking the River Ness.', 75, 'rocpool reserve hotel', 'rocpool reserve hotel — inverness', 'rocpool reserve hotel inverness scotland boutique luxury stay overlooking the river ness. 0.09 eth / night hotel'),
  (76, 25, 'Hotel Arctic', 'hotel-arctic.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Clifftop hotel above the UNESCO icefjord, with midnight-sun terraces and views of drifting icebergs.', 76, 'hotel arctic', 'hotel arctic — ilulissat', 'hotel arctic ilulissat greenland clifftop hotel above the unesco icefjord, with midnight-sun terraces and views of drifting icebergs. 0.14 eth / night hotel'),
  (77, 25, 'Hotel Icefiord', 'hotel-icefiord.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Harbour hotel facing Disko Bay, steps from boat departures into the icefjord.', 77, 'hotel icefiord', 'hotel icefiord — ilulissat', 'hotel icefiord ilulissat greenland harbour hotel facing disko bay, steps from boat departures into the icefjord. 0.12 eth / night hotel'),
  (78, 25, 'Hotel Hvide Falk', 'hotel-hvide-falk.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Town-centre base for dogsled trips, whale watching, and walks to the Sermermiut valley.', 78, 'hotel hvide falk', 'hotel hvide falk — ilulissat', 'hotel hvide falk ilulissat greenland town-centre base for dogsled trips, whale watching, and walks to the sermermiut valley. 0.09 eth / night hotel'),
  (79, 27, 'Hótel Ísafjörður', 'hotel-isafjordur.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Ísafjörður, on the Skutulsfjörður waterfront.', 79, 'hotel isafjordur', 'hotel isafjordur — isafjordur', 'hotel isafjordur isafjordur iceland harbour hotel in isafjordur, on the skutulsfjordur waterfront. 0.08 eth / night hotel'),
  (80, 27, 'Hótel Horn', 'hotel-horn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Ísafjörður, a practical base for the Westfjords.', 80, 'hotel horn', 'hotel horn — isafjordur', 'hotel horn isafjordur iceland town hotel in isafjordur, a practical base for the westfjords. 0.07 eth / night hotel'),
  (81, 27, 'Gamla Guesthouse', 'gamla-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Timber guesthouse in the old town of Ísafjörður, a short walk from the harbour.', 81, 'gamla guesthouse', 'gamla guesthouse — isafjordur', 'gamla guesthouse isafjordur iceland timber guesthouse in the old town of isafjordur, a short walk from the harbour. 0.055 eth / night hotel'),
  (82, 28, 'Jelgava Hotel', 'jelgava-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Modern hotel in the city center with comfortable rooms and restaurant.', 82, 'jelgava hotel', 'jelgava hotel — jelgava', 'jelgava hotel jelgava latvia modern hotel in the city center with comfortable rooms and restaurant. 0.04 eth / night hotel'),
  (83, 29, 'Baltic Beach Hotel', 'baltic-beach-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Luxury spa hotel on the beach with beautiful sea views and upscale amenities.', 83, 'baltic beach hotel', 'baltic beach hotel — jurmala', 'baltic beach hotel jurmala latvia luxury spa hotel on the beach with beautiful sea views and upscale amenities. 0.055 eth / night hotel'),
  (84, 29, 'Hotel Jurmala Spa', 'hotel-jurmala-spa.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Modern spa hotel with pools, saunas, and wellness treatments in Jurmala center.', 84, 'hotel jurmala spa', 'hotel jurmala spa — jurmala', 'hotel jurmala spa jurmala latvia modern spa hotel with pools, saunas, and wellness treatments in jurmala center. 0.045 eth / night hotel'),
  (85, 29, 'Villa Joma', 'villa-joma.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Charming boutique hotel near the sea, ideal for a relaxing getaway.', 85, 'villa joma', 'villa joma — jurmala', 'villa joma jurmala latvia charming boutique hotel near the sea, ideal for a relaxing getaway. 0.035 eth / night hotel'),
  (86, 30, 'Hotel Kaunas City', 'hotel-kaunas-city.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.06 ETH / night', 0.06, 'Comfortable city-centre hotel with modern rooms and easy access to Kaunas Old Town and cultural sights.', 86, 'hotel kaunas city', 'hotel kaunas city — kaunas', 'hotel kaunas city kaunas lithuania comfortable city-centre hotel with modern rooms and easy access to kaunas old town and cultural sights. 0.06 eth / night hotel'),
  (87, 30, 'Magnolia Boutique', 'magnolia-boutique.html', 'https://images.unsplash.com/photo-1501118572072-7c5d7d3d47e6?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.05 ETH / night', 0.05, 'Cozy boutique hotel offering an intimate atmosphere, complimentary breakfast and friendly service close to the river.', 87, 'magnolia boutique', 'magnolia boutique — kaunas', 'magnolia boutique kaunas lithuania cozy boutique hotel offering an intimate atmosphere, complimentary breakfast and friendly service close to the river. 0.05 eth / night hotel'),
  (88, 31, 'Hótel Berg', 'hotel-berg.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Keflavík, a short walk from the waterfront and the Viking World museum.', 88, 'hotel berg', 'hotel berg — keflavik', 'hotel berg keflavik iceland harbour hotel in keflavik, a short walk from the waterfront and the viking world museum. 0.07 eth / night hotel'),
  (89, 31, 'Guesthouse 1x6', 'guesthouse-1x6.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse in Keflavík, close to the harbour and the road out to the airport.', 89, 'guesthouse 1x6', 'guesthouse 1x6 — keflavik', 'guesthouse 1x6 keflavik iceland small guesthouse in keflavik, close to the harbour and the road out to the airport. 0.055 eth / night hotel'),
  (90, 31, 'Courtyard by Marriott Reykjavik Keflavik Airport', 'courtyard-by-marriott-reykjavik-keflavik-airport.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Airport hotel beside Keflavík International Airport, convenient for early flights and the Reykjanes coast.', 90, 'courtyard by marriott reykjavik keflavik airport', 'courtyard by marriott reykjavik keflavik airport — keflavik', 'courtyard by marriott reykjavik keflavik airport keflavik iceland airport hotel beside keflavik international airport, convenient for early flights and the reykjanes coast. 0.08 eth / night hotel'),
  (91, 32, 'Camp Ripan', 'camp-ripan.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Arctic spa hotel on the edge of Kiruna, with northern lights views and a base for Kebnekaise trails.', 91, 'camp ripan', 'camp ripan — kiruna', 'camp ripan kiruna sweden arctic spa hotel on the edge of kiruna, with northern lights views and a base for kebnekaise trails. 0.09 eth / night hotel'),
  (92, 32, 'Hotel Arctic Eden', 'hotel-arctic-eden.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lapland-inspired rooms in the town centre, close to Kiruna’s relocated church and new city district.', 92, 'hotel arctic eden', 'hotel arctic eden — kiruna', 'hotel arctic eden kiruna sweden lapland-inspired rooms in the town centre, close to kirunas relocated church and new city district. 0.07 eth / night hotel'),
  (93, 32, 'Scandic Kiruna', 'scandic-kiruna.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Modern hotel near the town centre, handy for aurora trips, Abisko, and the Icehotel in Jukkasjärvi.', 93, 'scandic kiruna', 'scandic kiruna — kiruna', 'scandic kiruna kiruna sweden modern hotel near the town centre, handy for aurora trips, abisko, and the icehotel in jukkasjarvi. 0.08 eth / night hotel'),
  (94, 33, 'Portside Boutique', 'portside-boutique.html', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.05 ETH / night', 0.05, 'Charming boutique hotel in the city centre, close to restaurants, theatres and the Old Town promenade.', 94, 'portside boutique', 'portside boutique — klaipeda', 'portside boutique klaipeda lithuania charming boutique hotel in the city centre, close to restaurants, theatres and the old town promenade. 0.05 eth / night hotel'),
  (95, 33, 'Seaside Harbour Hotel', 'seaside-harbour-hotel.html', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.07 ETH / night', 0.07, 'Seafront hotel with beautiful views of the Baltic Sea, fresh seafood nearby and easy access to the ferry terminal.', 95, 'seaside harbour hotel', 'seaside harbour hotel — klaipeda', 'seaside harbour hotel klaipeda lithuania seafront hotel with beautiful views of the baltic sea, fresh seafood nearby and easy access to the ferry terminal. 0.07 eth / night hotel'),
  (96, 34, 'Hótel Smárinn', 'hotel-smarinn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Practical stay near Smáralind shopping centre, useful for families and longer visits.', 96, 'hotel smarinn', 'hotel smarinn — kopavogur', 'hotel smarinn kopavogur iceland practical stay near smaralind shopping centre, useful for families and longer visits. 0.055 eth / night hotel'),
  (97, 34, 'Hotel Vellir', 'hotel-vellir.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Contemporary hotel in Kópavogur with spacious rooms and quick links into Reykjavík.', 97, 'hotel vellir', 'hotel vellir — kopavogur', 'hotel vellir kopavogur iceland contemporary hotel in kopavogur with spacious rooms and quick links into reykjavik. 0.07 eth / night hotel'),
  (98, 34, 'Kórinn Guesthouse', 'korinn-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.04 ETH / night', 0.04, 'Quiet guesthouse-style rooms with easy access to local pools and coastal paths.', 98, 'korinn guesthouse', 'korinn guesthouse — kopavogur', 'korinn guesthouse kopavogur iceland quiet guesthouse-style rooms with easy access to local pools and coastal paths. 0.04 eth / night hotel'),
  (99, 35, 'Clarion Hotel Ernst', 'clarion-hotel-ernst.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Landmark hotel on the main square, a short stroll from the cathedral and fish market.', 99, 'clarion hotel ernst', 'clarion hotel ernst — kristiansand', 'clarion hotel ernst kristiansand norway landmark hotel on the main square, a short stroll from the cathedral and fish market. 0.08 eth / night hotel'),
  (100, 35, 'Scandic Kristiansand Bystranda', 'scandic-kristiansand-bystranda.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Beachfront hotel on Bystranda with a pool, close to the boardwalk and Kilden.', 100, 'scandic kristiansand bystranda', 'scandic kristiansand bystranda — kristiansand', 'scandic kristiansand bystranda kristiansand norway beachfront hotel on bystranda with a pool, close to the boardwalk and kilden. 0.07 eth / night hotel'),
  (101, 35, 'Thon Hotel Wergeland', 'thon-hotel-wergeland.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Compact city hotel beside Wergeland’s park, handy for the Posebyen old town.', 101, 'thon hotel wergeland', 'thon hotel wergeland — kristiansand', 'thon hotel wergeland kristiansand norway compact city hotel beside wergelands park, handy for the posebyen old town. 0.05 eth / night hotel'),
  (102, 36, 'Grand Hotel Lerwick', 'grand-hotel-lerwick.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel beside the harbour, a short walk from Commercial Street.', 102, 'grand hotel lerwick', 'grand hotel lerwick — lerwick', 'grand hotel lerwick lerwick scotland town hotel beside the harbour, a short walk from commercial street. 0.07 eth / night hotel'),
  (103, 36, 'Lerwick Harbour House', 'lerwick-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Waterfront house in Lerwick, close to the lanes and the lodberries.', 103, 'lerwick harbour house', 'lerwick harbour house — lerwick', 'lerwick harbour house lerwick scotland waterfront house in lerwick, close to the lanes and the lodberries. 0.06 eth / night hotel'),
  (104, 36, 'Shetland Hotel', 'shetland-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Lerwick, overlooking the sound and the ferry to Bressay.', 104, 'shetland hotel', 'shetland hotel — lerwick', 'shetland hotel lerwick scotland harbour hotel in lerwick, overlooking the sound and the ferry to bressay. 0.08 eth / night hotel'),
  (105, 37, 'Hotel K5 Levi', 'hotel-k5-levi.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Slope-side hotel in Levi, beside the gondola and the village centre.', 105, 'hotel k5 levi', 'hotel k5 levi — levi', 'hotel k5 levi levi finland slope-side hotel in levi, beside the gondola and the village centre. 0.09 eth / night hotel'),
  (106, 37, 'Hullu Poro', 'hullu-poro.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lively hotel in Levi, with saunas along the main pedestrian street.', 106, 'hullu poro', 'hullu poro — levi', 'hullu poro levi finland lively hotel in levi, with saunas along the main pedestrian street. 0.07 eth / night hotel'),
  (107, 37, 'Levi Hotel Spa', 'levi-hotel-spa.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Spa hotel in Levi, with pools looking toward the fell.', 107, 'levi hotel spa', 'levi hotel spa — levi', 'levi hotel spa levi finland spa hotel in levi, with pools looking toward the fell. 0.08 eth / night hotel'),
  (108, 38, 'Hotel Kolumbs', 'hotel-kolumbs.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Elegant hotel with spa facilities near the sea and city center.', 108, 'hotel kolumbs', 'hotel kolumbs — liepaja', 'hotel kolumbs liepaja latvia elegant hotel with spa facilities near the sea and city center. 0.035 eth / night hotel'),
  (109, 38, 'Liva Hotel', 'liva-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.025 ETH / night', 0.025, 'Central, affordable hotel ideal for business or leisure travelers.', 109, 'liva hotel', 'liva hotel — liepaja', 'liva hotel liepaja latvia central, affordable hotel ideal for business or leisure travelers. 0.025 eth / night hotel'),
  (110, 38, 'Promenade Hotel', 'promenade-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Luxury hotel set in a historic warehouse with art gallery and gourmet restaurant.', 110, 'promenade hotel', 'promenade hotel — liepaja', 'promenade hotel liepaja latvia luxury hotel set in a historic warehouse with art gallery and gourmet restaurant. 0.05 eth / night hotel'),
  (111, 39, 'Mølla Hotell', 'molla-hotell.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Riverside hotel in a former mill on the Mesna, in the centre of Lillehammer.', 111, 'molla hotell', 'molla hotell — lillehammer', 'molla hotell lillehammer norway riverside hotel in a former mill on the mesna, in the centre of lillehammer. 0.08 eth / night hotel'),
  (112, 39, 'Radisson Blu Lillehammer Hotel', 'radisson-blu-lillehammer-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Lakeside hotel in Lillehammer, below the ski jump and the Olympic park.', 112, 'radisson blu lillehammer hotel', 'radisson blu lillehammer hotel — lillehammer', 'radisson blu lillehammer hotel lillehammer norway lakeside hotel in lillehammer, below the ski jump and the olympic park. 0.09 eth / night hotel'),
  (113, 39, 'Scandic Lillehammer', 'scandic-lillehammer.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Lillehammer, a short walk from the pedestrian street and the station.', 113, 'scandic lillehammer', 'scandic lillehammer — lillehammer', 'scandic lillehammer lillehammer norway town hotel in lillehammer, a short walk from the pedestrian street and the station. 0.07 eth / night hotel'),
  (114, 40, 'Quality Hotel Ekoxen', 'quality-hotel-ekoxen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Well-equipped city hotel with a pool and spa, close to Linköping’s main square.', 114, 'quality hotel ekoxen', 'quality hotel ekoxen — linkoping', 'quality hotel ekoxen linkoping sweden well-equipped city hotel with a pool and spa, close to linkopings main square. 0.06 eth / night hotel'),
  (115, 40, 'Scandic Frimurarehotellet', 'scandic-frimurarehotellet.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Landmark hotel in the city centre with easy access to the cathedral and old town.', 115, 'scandic frimurarehotellet', 'scandic frimurarehotellet — linkoping', 'scandic frimurarehotellet linkoping sweden landmark hotel in the city centre with easy access to the cathedral and old town. 0.05 eth / night hotel'),
  (116, 40, 'Stora Hotellet Linköping', 'stora-hotellet-linkoping.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Classic independent hotel with a restaurant, a short walk from the railway station.', 116, 'stora hotellet linkoping', 'stora hotellet linkoping — linkoping', 'stora hotellet linkoping linkoping sweden classic independent hotel with a restaurant, a short walk from the railway station. 0.045 eth / night hotel'),
  (117, 41, 'The Lodge on Loch Lomond', 'the-lodge-on-loch-lomond.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Waterfront hotel in Luss, looking across the loch toward the national park hills.', 117, 'the lodge on loch lomond', 'the lodge on loch lomond — loch lomond national park', 'the lodge on loch lomond loch lomond national park scotland waterfront hotel in luss, looking across the loch toward the national park hills. 0.09 eth / night hotel'),
  (118, 41, 'Cameron House', 'cameron-house.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Lochside resort near Balloch, at the southern gate of Loch Lomond National Park.', 118, 'cameron house', 'cameron house — loch lomond national park', 'cameron house loch lomond national park scotland lochside resort near balloch, at the southern gate of loch lomond national park. 0.12 eth / night hotel'),
  (119, 41, 'Oak Tree Inn', 'oak-tree-inn.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Village inn in Balmaha, where the West Highland Way meets the east shore of the loch.', 119, 'oak tree inn', 'oak tree inn — loch lomond national park', 'oak tree inn loch lomond national park scotland village inn in balmaha, where the west highland way meets the east shore of the loch. 0.07 eth / night hotel'),
  (120, 42, 'Basecamp Hotel', 'basecamp-hotel-svalbard.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Trapper-style rooms in the centre of Longyearbyen, a practical base for snowmobile trips, boat tours, and Arctic day hikes.', 120, 'basecamp hotel', 'basecamp hotel — longyearbyen', 'basecamp hotel longyearbyen svalbard trapper-style rooms in the centre of longyearbyen, a practical base for snowmobile trips, boat tours, and arctic day hikes. 0.09 eth / night hotel'),
  (121, 42, 'Funken Lodge', 'funken-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Historic mining-era lodge in Nybyen with a restaurant and spa, looking over Adventfjorden and the surrounding peaks.', 121, 'funken lodge', 'funken lodge — longyearbyen', 'funken lodge longyearbyen svalbard historic mining-era lodge in nybyen with a restaurant and spa, looking over adventfjorden and the surrounding peaks. 0.11 eth / night hotel'),
  (122, 42, 'Radisson Blu Polar Hotel Spitsbergen', 'radisson-blu-polar-spitsbergen.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Landmark hotel in Longyearbyen with polar views, a short walk from the harbour, Svalbard Museum, and northern lights tours.', 122, 'radisson blu polar hotel spitsbergen', 'radisson blu polar hotel spitsbergen — longyearbyen', 'radisson blu polar hotel spitsbergen longyearbyen svalbard landmark hotel in longyearbyen with polar views, a short walk from the harbour, svalbard museum, and northern lights tours. 0.13 eth / night hotel'),
  (123, 43, 'Clarion Hotel Malmö Live', 'clarion-hotel-malmo-live.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'High-rise waterfront hotel with a sky bar and concert hall next door.', 123, 'clarion hotel malmo live', 'clarion hotel malmo live — malmo', 'clarion hotel malmo live malmo sweden high-rise waterfront hotel with a sky bar and concert hall next door. 0.09 eth / night hotel'),
  (124, 43, 'Hotel Savoy Malmö', 'hotel-savoy-malmo.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historic city hotel opposite the central station, a short hop from the Turning Torso.', 124, 'hotel savoy malmo', 'hotel savoy malmo — malmo', 'hotel savoy malmo malmo sweden historic city hotel opposite the central station, a short hop from the turning torso. 0.07 eth / night hotel'),
  (125, 43, 'Scandic Triangeln', 'scandic-triangeln.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Modern tower hotel above Triangeln station, handy for Möllevången and shopping.', 125, 'scandic triangeln', 'scandic triangeln — malmo', 'scandic triangeln malmo sweden modern tower hotel above triangeln station, handy for mollevangen and shopping. 0.055 eth / night hotel'),
  (126, 44, 'Hotel Arkipelag', 'hotel-arkipelag.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel by Mariehamn’s western harbour, a short walk from shops, ferries, and the maritime quarter.', 126, 'hotel arkipelag', 'hotel arkipelag — mariehamn', 'hotel arkipelag mariehamn aland islands waterfront hotel by mariehamns western harbour, a short walk from shops, ferries, and the maritime quarter. 0.07 eth / night hotel'),
  (127, 44, 'Hotel Pommern', 'hotel-pommern.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Relaxed hotel near the Åland Maritime Museum and the historic four-masted barque Pommern.', 127, 'hotel pommern', 'hotel pommern — mariehamn', 'hotel pommern mariehamn aland islands relaxed hotel near the aland maritime museum and the historic four-masted barque pommern. 0.055 eth / night hotel'),
  (128, 44, 'Park Alandia Hotel', 'park-alandia-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Central Åland stay beside the town park, handy for the sailing harbour and the road to Kastelholm.', 128, 'park alandia hotel', 'park alandia hotel — mariehamn', 'park alandia hotel mariehamn aland islands central aland stay beside the town park, handy for the sailing harbour and the road to kastelholm. 0.05 eth / night hotel'),
  (129, 45, 'Narva City Hotel', 'narva-city-hotel.html', 'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?fit=crop&w=400&q=80', '0.035 ETH / night', 0.035, 'Conveniently located in Narva city center, close to the river and historical sites.', 129, 'narva city hotel', 'narva city hotel — narva', 'narva city hotel narva estonia conveniently located in narva city center, close to the river and historical sites. 0.035 eth / night hotel'),
  (130, 45, 'Narva-Jõesuu Seaside Hotel', 'narva-joesuu-seaside-hotel.html', 'https://images.unsplash.com/photo-1505691723518-36a1ddb1b3b6?fit=crop&w=400&q=80', '0.03 ETH / night', 0.03, 'Seaside hotel near Narva with easy access to sandy beaches and coastal walks.', 130, 'narva-joesuu seaside hotel', 'narva-joesuu seaside hotel — narva', 'narva-joesuu seaside hotel narva estonia seaside hotel near narva with easy access to sandy beaches and coastal walks. 0.03 eth / night hotel'),
  (131, 46, 'Crowne Plaza Newcastle', 'crowne-plaza-newcastle.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Modern city hotel near St James’ Park, well placed for business and match-day stays.', 131, 'crowne plaza newcastle', 'crowne plaza newcastle — newcastle', 'crowne plaza newcastle newcastle northeast england modern city hotel near st james park, well placed for business and match-day stays. 0.055 eth / night hotel'),
  (132, 46, 'Hotel du Vin Newcastle', 'hotel-du-vin-newcastle.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Boutique hotel in a converted warehouse beside the Quayside, with a bistro and wine cellar.', 132, 'hotel du vin newcastle', 'hotel du vin newcastle — newcastle', 'hotel du vin newcastle newcastle northeast england boutique hotel in a converted warehouse beside the quayside, with a bistro and wine cellar. 0.08 eth / night hotel'),
  (133, 46, 'Malmaison Newcastle', 'malmaison-newcastle.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Stylish waterfront stay on the Tyne with contemporary rooms and easy access to the bridges.', 133, 'malmaison newcastle', 'malmaison newcastle — newcastle', 'malmaison newcastle newcastle northeast england stylish waterfront stay on the tyne with contemporary rooms and easy access to the bridges. 0.07 eth / night hotel'),
  (134, 47, 'Otterburn Castle', 'otterburn-castle.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Stone castle hotel in Redesdale, a base for the park moors and Kielder.', 134, 'otterburn castle', 'otterburn castle — northumberland national park', 'otterburn castle northumberland national park northeast england stone castle hotel in redesdale, a base for the park moors and kielder. 0.08 eth / night hotel'),
  (135, 47, 'The Tankerville Arms', 'the-tankerville-arms.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Market-town inn in Wooler, at the foot of the Cheviot Hills.', 135, 'the tankerville arms', 'the tankerville arms — northumberland national park', 'the tankerville arms northumberland national park northeast england market-town inn in wooler, at the foot of the cheviot hills. 0.05 eth / night hotel'),
  (136, 47, 'Twice Brewed Inn', 'twice-brewed-inn.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Inn beside Hadrian’s Wall at Once Brewed, with walks along the crags.', 136, 'twice brewed inn', 'twice brewed inn — northumberland national park', 'twice brewed inn northumberland national park northeast england inn beside hadrians wall at once brewed, with walks along the crags. 0.06 eth / night hotel'),
  (137, 48, 'Hotel Hans Egede', 'hotel-hans-egede.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Landmark hotel on Aqqusinersuaq, with fjord views and a base for exploring Greenland’s capital.', 137, 'hotel hans egede', 'hotel hans egede — nuuk', 'hotel hans egede nuuk greenland landmark hotel on aqqusinersuaq, with fjord views and a base for exploring greenlands capital. 0.11 eth / night hotel'),
  (138, 48, 'Hotel Nuuk', 'hotel-nuuk.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.075 ETH / night', 0.075, 'Hillside stay overlooking Nuuk Fjord, a quiet launch point for boat trips and city walks.', 138, 'hotel nuuk', 'hotel nuuk — nuuk', 'hotel nuuk nuuk greenland hillside stay overlooking nuuk fjord, a quiet launch point for boat trips and city walks. 0.075 eth / night hotel'),
  (139, 48, 'Inuit Hotel', 'inuit-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Contemporary rooms near the colonial harbour, close to Katuaq and the waterfront boardwalk.', 139, 'inuit hotel', 'inuit hotel — nuuk', 'inuit hotel nuuk greenland contemporary rooms near the colonial harbour, close to katuaq and the waterfront boardwalk. 0.08 eth / night hotel'),
  (140, 49, 'Manor House Hotel', 'manor-house-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour house on the south shore of Oban, a short walk from the railway pier.', 140, 'manor house hotel', 'manor house hotel — oban', 'manor house hotel oban scotland harbour house on the south shore of oban, a short walk from the railway pier. 0.07 eth / night hotel'),
  (141, 49, 'Oban Bay Hotel', 'oban-bay-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Bayfront hotel in Oban, beside the ferry pier for the Hebridean islands.', 141, 'oban bay hotel', 'oban bay hotel — oban', 'oban bay hotel oban scotland bayfront hotel in oban, beside the ferry pier for the hebridean islands. 0.06 eth / night hotel'),
  (142, 49, 'Perle Oban Hotel', 'perle-oban-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Seafront hotel on Oban Bay, looking across the water to Kerrera.', 142, 'perle oban hotel', 'perle oban hotel — oban', 'perle oban hotel oban scotland seafront hotel on oban bay, looking across the water to kerrera. 0.08 eth / night hotel'),
  (143, 50, 'Hotel Odeon', 'hotel-odeon.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern hotel close to Odense railway station.', 143, 'hotel odeon', 'hotel odeon — odense', 'hotel odeon odense denmark modern hotel close to odense railway station. 0.06 eth / night hotel'),
  (144, 50, 'First Hotel Grand', 'first-hotel-grand.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historical charm in central Odense.', 144, 'first hotel grand', 'first hotel grand — odense', 'first hotel grand odense denmark historical charm in central odense. 0.07 eth / night hotel'),
  (145, 50, 'Comwell H.C. Andersen Odense', 'comwell-h-c-andersen-odense.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Comfort and convenience for leisure or business.', 145, 'comwell h.c. andersen odense', 'comwell h.c. andersen odense — odense', 'comwell h.c. andersen odense odense denmark comfort and convenience for leisure or business. 0.08 eth / night hotel'),
  (146, 51, 'Grand Hotel Oslo', 'grand-hotel-oslo.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.15 ETH / night', 0.15, 'Historic hotel on Karl Johans gate, facing the Storting and a stroll from the palace.', 146, 'grand hotel oslo', 'grand hotel oslo — oslo', 'grand hotel oslo oslo norway historic hotel on karl johans gate, facing the storting and a stroll from the palace. 0.15 eth / night hotel'),
  (147, 51, 'Hotel Continental', 'hotel-continental.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Family-run landmark beside Nationaltheatret, known for Theatercaféen and city views.', 147, 'hotel continental', 'hotel continental — oslo', 'hotel continental oslo norway family-run landmark beside nationaltheatret, known for theatercafeen and city views. 0.11 eth / night hotel'),
  (148, 51, 'The Thief', 'the-thief.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.13 ETH / night', 0.13, 'Design hotel on Tjuvholmen with contemporary art, harbour views, and a spa.', 148, 'the thief', 'the thief — oslo', 'the thief oslo norway design hotel on tjuvholmen with contemporary art, harbour views, and a spa. 0.13 eth / night hotel'),
  (149, 52, 'Lapland Hotels Oulu', 'lapland-hotels-oulu.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Lapland-inspired hotel near Oulu Cathedral, cozy and unique.', 149, 'lapland hotels oulu', 'lapland hotels oulu — oulu', 'lapland hotels oulu oulu finland lapland-inspired hotel near oulu cathedral, cozy and unique. 0.08 eth / night hotel'),
  (150, 52, 'Radisson Blu Hotel Oulu', 'radisson-blu-hotel-oulu.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Riverside hotel with beautiful views and modern amenities.', 150, 'radisson blu hotel oulu', 'radisson blu hotel oulu — oulu', 'radisson blu hotel oulu oulu finland riverside hotel with beautiful views and modern amenities. 0.09 eth / night hotel'),
  (151, 52, 'Scandic Oulu Station', 'scandic-oulu-station.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Comfortable rooms close to Oulu railway station and city center.', 151, 'scandic oulu station', 'scandic oulu station — oulu', 'scandic oulu station oulu finland comfortable rooms close to oulu railway station and city center. 0.07 eth / night hotel'),
  (152, 53, 'Boutique Riverside', 'boutique-riverside.html', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.045 ETH / night', 0.045, 'Small riverside hotel offering peaceful rooms and personalized service — a great base for exploring the region.', 152, 'boutique riverside', 'boutique riverside — panevezys', 'boutique riverside panevezys lithuania small riverside hotel offering peaceful rooms and personalized service — a great base for exploring the region. 0.045 eth / night hotel'),
  (153, 53, 'Central Park Hotel', 'central-park-hotel.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.04 ETH / night', 0.04, 'Modern hotel near the city park offering comfortable rooms and easy access to local attractions and concert venues.', 153, 'central park hotel', 'central park hotel — panevezys', 'central park hotel panevezys lithuania modern hotel near the city park offering comfortable rooms and easy access to local attractions and concert venues. 0.04 eth / night hotel'),
  (154, 55, 'Atholl Palace Hotel', 'atholl-palace-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Victorian hotel above Pitlochry, with gardens looking toward Ben Vrackie.', 154, 'atholl palace hotel', 'atholl palace hotel — pitlochry', 'atholl palace hotel pitlochry scotland victorian hotel above pitlochry, with gardens looking toward ben vrackie. 0.09 eth / night hotel'),
  (155, 55, 'Fishers Hotel', 'fishers-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel on Atholl Road in Pitlochry, a short walk from the theatre and the river.', 155, 'fishers hotel', 'fishers hotel — pitlochry', 'fishers hotel pitlochry scotland town hotel on atholl road in pitlochry, a short walk from the theatre and the river. 0.07 eth / night hotel'),
  (156, 55, 'Loch Faskally House', 'loch-faskally-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Shore house on Loch Faskally, beside the dam and the salmon ladder.', 156, 'loch faskally house', 'loch faskally house — pitlochry', 'loch faskally house pitlochry scotland shore house on loch faskally, beside the dam and the salmon ladder. 0.06 eth / night hotel'),
  (157, 56, 'Bosville Hotel', 'bosville-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town hotel above Portree harbour, a short walk from Somerled Square.', 157, 'bosville hotel', 'bosville hotel — portree', 'bosville hotel portree scotland town hotel above portree harbour, a short walk from somerled square. 0.08 eth / night hotel'),
  (158, 56, 'Cuillin Hills Hotel', 'cuillin-hills-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Harbour hotel in Portree, with views across the bay toward the Cuillin on the Isle of Skye.', 158, 'cuillin hills hotel', 'cuillin hills hotel — portree', 'cuillin hills hotel portree scotland harbour hotel in portree, with views across the bay toward the cuillin on the isle of skye. 0.09 eth / night hotel'),
  (159, 56, 'The Royal Hotel', 'the-royal-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Portree, beside the coloured houses and the fishing pier.', 159, 'the royal hotel', 'the royal hotel — portree', 'the royal hotel portree scotland harbour hotel in portree, beside the coloured houses and the fishing pier. 0.07 eth / night hotel'),
  (160, 57, 'Airport Hotel Aurora Star', 'airport-hotel-aurora-star.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Convenient overnight beside Keflavík International Airport with a 24-hour desk.', 160, 'airport hotel aurora star', 'airport hotel aurora star — reykjanesbaer', 'airport hotel aurora star reykjanesbaer iceland convenient overnight beside keflavik international airport with a 24-hour desk. 0.055 eth / night hotel'),
  (161, 57, 'Hotel Keflavik', 'hotel-keflavik.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Well-known airport-town hotel with a restaurant, handy for early flights and the lagoon.', 161, 'hotel keflavik', 'hotel keflavik — reykjanesbaer', 'hotel keflavik reykjanesbaer iceland well-known airport-town hotel with a restaurant, handy for early flights and the lagoon. 0.08 eth / night hotel'),
  (162, 57, 'Hotel Keilir', 'hotel-keilir.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern stay in central Keflavík, close to the waterfront and the Viking World museum.', 162, 'hotel keilir', 'hotel keilir — reykjanesbaer', 'hotel keilir reykjanesbaer iceland modern stay in central keflavik, close to the waterfront and the viking world museum. 0.06 eth / night hotel'),
  (163, 58, 'Canopy by Hilton Reykjavik City Centre', 'canopy-by-hilton-reykjavik-city-centre.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Design-led hotel on Laugavegur with local art, a café, and easy access to nightlife.', 163, 'canopy by hilton reykjavik city centre', 'canopy by hilton reykjavik city centre — reykjavik', 'canopy by hilton reykjavik city centre reykjavik iceland design-led hotel on laugavegur with local art, a cafe, and easy access to nightlife. 0.11 eth / night hotel'),
  (164, 58, 'Center Hotels Plaza', 'center-hotels-plaza.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Practical city-centre stay on Ingólfstorg, close to shops, bars, and the Old Harbour.', 164, 'center hotels plaza', 'center hotels plaza — reykjavik', 'center hotels plaza reykjavik iceland practical city-centre stay on ingolfstorg, close to shops, bars, and the old harbour. 0.08 eth / night hotel'),
  (165, 58, 'Hotel Borg', 'hotel-borg.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Art Deco landmark on Austurvöllur square, steps from the parliament and harbour.', 165, 'hotel borg', 'hotel borg — reykjavik', 'hotel borg reykjavik iceland art deco landmark on austurvollur square, steps from the parliament and harbour. 0.14 eth / night hotel'),
  (166, 59, 'Grand Hotel Kempinski', 'grand-hotel-kempinski-riga.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Luxury stay in the heart of Riga with elegant rooms and spa facilities.', 166, 'grand hotel kempinski', 'grand hotel kempinski — riga', 'grand hotel kempinski riga latvia luxury stay in the heart of riga with elegant rooms and spa facilities. 0.09 eth / night hotel'),
  (167, 59, 'Wellton Riverside', 'wellton-riverside-riga.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Modern hotel with river views, wellness area and rooftop terrace.', 167, 'wellton riverside', 'wellton riverside — riga', 'wellton riverside riga latvia modern hotel with river views, wellness area and rooftop terrace. 0.06 eth / night hotel'),
  (168, 60, 'Arctic Light Hotel', 'arctic-light-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Boutique hotel in a converted city hall, steps from Rovaniemi’s centre and Santa Claus Village day trips.', 168, 'arctic light hotel', 'arctic light hotel — rovaniemi', 'arctic light hotel rovaniemi finland boutique hotel in a converted city hall, steps from rovaniemis centre and santa claus village day trips. 0.10 eth / night hotel'),
  (169, 60, 'Lapland Hotels Sky Ounasvaara', 'lapland-hotels-sky-ounasvaara.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Hilltop hotel above the Kemijoki, with northern lights views and forest trails just outside town.', 169, 'lapland hotels sky ounasvaara', 'lapland hotels sky ounasvaara — rovaniemi', 'lapland hotels sky ounasvaara rovaniemi finland hilltop hotel above the kemijoki, with northern lights views and forest trails just outside town. 0.09 eth / night hotel'),
  (170, 60, 'Santa''s Hotel Santa Claus', 'santas-hotel-santa-claus.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Central Rovaniemi hotel named for Lapland’s Christmas lore, close to shops, saunas, and the riverfront.', 170, 'santas hotel santa claus', 'santas hotel santa claus — rovaniemi', 'santas hotel santa claus rovaniemi finland central rovaniemi hotel named for laplands christmas lore, close to shops, saunas, and the riverfront. 0.07 eth / night hotel'),
  (171, 61, 'Högfjällshotellet', 'hogfjallshotellet.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Ski hotel at Högfjället in Sälen, above the valley and the trail network.', 171, 'hogfjallshotellet', 'hogfjallshotellet — salen', 'hogfjallshotellet salen sweden ski hotel at hogfjallet in salen, above the valley and the trail network. 0.09 eth / night hotel'),
  (172, 61, 'Hundfjällshotellet', 'hundfjallshotellet.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Mountain hotel at Hundfjället in Sälen, close to the lifts and the forest trails.', 172, 'hundfjallshotellet', 'hundfjallshotellet — salen', 'hundfjallshotellet salen sweden mountain hotel at hundfjallet in salen, close to the lifts and the forest trails. 0.07 eth / night hotel'),
  (173, 61, 'Tandådalens Fjällhotell', 'tandadalens-fjallhotell.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Fell hotel in Tandådalen, in the Sälen ski area.', 173, 'tandadalens fjallhotell', 'tandadalens fjallhotell — salen', 'tandadalens fjallhotell salen sweden fell hotel in tandadalen, in the salen ski area. 0.08 eth / night hotel'),
  (174, 62, 'Hótel Tindastóll', 'hotel-tindastoll.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic harbour hotel in Sauðárkrókur, on the Skagafjörður waterfront.', 174, 'hotel tindastoll', 'hotel tindastoll — saudarkrokur', 'hotel tindastoll saudarkrokur iceland historic harbour hotel in saudarkrokur, on the skagafjordur waterfront. 0.08 eth / night hotel'),
  (175, 62, 'Hótel Mikligarður', 'hotel-mikligardur.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town hotel in Sauðárkrókur, a base for the Skagafjörður valley and the north coast.', 175, 'hotel mikligardur', 'hotel mikligardur — saudarkrokur', 'hotel mikligardur saudarkrokur iceland town hotel in saudarkrokur, a base for the skagafjordur valley and the north coast. 0.07 eth / night hotel'),
  (176, 62, 'Skagafjörður Guesthouse', 'skagafjordur-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse in Sauðárkrókur, a short walk from the harbour and the church.', 176, 'skagafjordur guesthouse', 'skagafjordur guesthouse — saudarkrokur', 'skagafjordur guesthouse saudarkrokur iceland small guesthouse in saudarkrokur, a short walk from the harbour and the church. 0.055 eth / night hotel'),
  (177, 63, 'Park Inn Šiauliai', 'park-inn-siauliai.html', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.045 ETH / night', 0.045, 'Reliable mid-range hotel with clean, comfortable rooms, conference facilities and convenient transport links.', 177, 'park inn siauliai', 'park inn siauliai — siauliai', 'park inn siauliai siauliai lithuania reliable mid-range hotel with clean, comfortable rooms, conference facilities and convenient transport links. 0.045 eth / night hotel'),
  (178, 63, 'Old Town Boutique', 'old-town-boutique.html', 'https://images.unsplash.com/photo-1505691723518-36a5a1313f1c?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.04 ETH / night', 0.04, 'Small boutique hotel located a short walk from the Old Town, offering a quiet stay and homemade breakfast.', 178, 'old town boutique', 'old town boutique — siauliai', 'old town boutique siauliai lithuania small boutique hotel located a short walk from the old town, offering a quiet stay and homemade breakfast. 0.04 eth / night hotel'),
  (179, 64, 'Brøndums Hotel', 'brondums-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Historic hotel in Skagen, beside the art museum and the old town lanes.', 179, 'brondums hotel', 'brondums hotel — skagen', 'brondums hotel skagen denmark historic hotel in skagen, beside the art museum and the old town lanes. 0.09 eth / night hotel'),
  (180, 64, 'Color Hotel Skagen', 'color-hotel-skagen.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Skagen, a short walk from the fishing port and the yellow houses.', 180, 'color hotel skagen', 'color hotel skagen — skagen', 'color hotel skagen skagen denmark harbour hotel in skagen, a short walk from the fishing port and the yellow houses. 0.07 eth / night hotel'),
  (181, 64, 'Ruths Hotel', 'ruths-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Seaside hotel in Old Skagen, between the dunes and the beach.', 181, 'ruths hotel', 'ruths hotel — skagen', 'ruths hotel skagen denmark seaside hotel in old skagen, between the dunes and the beach. 0.08 eth / night hotel'),
  (182, 65, 'Scores Hotel', 'scores-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Hotel on The Scores in St Andrews, looking over the bay and the West Sands.', 182, 'scores hotel', 'scores hotel — st andrews', 'scores hotel st andrews scotland hotel on the scores in st andrews, looking over the bay and the west sands. 0.09 eth / night hotel'),
  (183, 65, 'St Andrews Harbour Hotel', 'st-andrews-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in St Andrews, a short walk from the cathedral ruins and the West Sands.', 183, 'st andrews harbour hotel', 'st andrews harbour hotel — st andrews', 'st andrews harbour hotel st andrews scotland harbour hotel in st andrews, a short walk from the cathedral ruins and the west sands. 0.08 eth / night hotel'),
  (184, 65, 'Cathedral Gate House', 'cathedral-gate-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Town house in St Andrews, beside the cathedral ruins and the harbour wall.', 184, 'cathedral gate house', 'cathedral gate house — st andrews', 'cathedral gate house st andrews scotland town house in st andrews, beside the cathedral ruins and the harbour wall. 0.07 eth / night hotel'),
  (185, 66, 'Clarion Hotel Stavanger', 'clarion-hotel-stavanger.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Central high-rise with a rooftop restaurant and views over the harbour and old town.', 185, 'clarion hotel stavanger', 'clarion hotel stavanger — stavanger', 'clarion hotel stavanger stavanger norway central high-rise with a rooftop restaurant and views over the harbour and old town. 0.09 eth / night hotel'),
  (186, 66, 'Hotel Victoria Stavanger', 'hotel-victoria-stavanger.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Historic hotel on Skansegt, close to the cathedral and the ferry to Tau.', 186, 'hotel victoria stavanger', 'hotel victoria stavanger — stavanger', 'hotel victoria stavanger stavanger norway historic hotel on skansegt, close to the cathedral and the ferry to tau. 0.055 eth / night hotel'),
  (187, 66, 'Radisson Blu Atlantic', 'radisson-blu-atlantic.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Waterfront hotel on the lake, walking distance to the petroleum museum and colour houses.', 187, 'radisson blu atlantic', 'radisson blu atlantic — stavanger', 'radisson blu atlantic stavanger norway waterfront hotel on the lake, walking distance to the petroleum museum and colour houses. 0.08 eth / night hotel'),
  (188, 67, 'Golden Lion Hotel', 'golden-lion-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.045 ETH / night', 0.045, 'Traditional city-centre inn, a convenient base for exploring Stirling.', 188, 'golden lion hotel', 'golden lion hotel — stirling', 'golden lion hotel stirling scotland traditional city-centre inn, a convenient base for exploring stirling. 0.045 eth / night hotel'),
  (189, 67, 'Hotel Colessio', 'hotel-colessio.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Stylish boutique hotel on the edge of Stirling’s old town.', 189, 'hotel colessio', 'hotel colessio — stirling', 'hotel colessio stirling scotland stylish boutique hotel on the edge of stirlings old town. 0.06 eth / night hotel'),
  (190, 67, 'Stirling Highland Hotel', 'stirling-highland-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Historic hotel beside Stirling Castle, in a former high school building.', 190, 'stirling highland hotel', 'stirling highland hotel — stirling', 'stirling highland hotel stirling scotland historic hotel beside stirling castle, in a former high school building. 0.07 eth / night hotel'),
  (191, 68, 'Grand Hôtel Stockholm', 'grand-hotel-stockholm.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.16 ETH / night', 0.16, 'Landmark waterfront palace facing the Royal Palace, with a Nordic spa and fine dining.', 191, 'grand hotel stockholm', 'grand hotel stockholm — stockholm', 'grand hotel stockholm stockholm sweden landmark waterfront palace facing the royal palace, with a nordic spa and fine dining. 0.16 eth / night hotel'),
  (192, 68, 'Hotel Diplomat', 'hotel-diplomat.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Elegant Art Nouveau hotel on Strandvägen, steps from Östermalm boutiques and Djurgården.', 192, 'hotel diplomat', 'hotel diplomat — stockholm', 'hotel diplomat stockholm sweden elegant art nouveau hotel on strandvagen, steps from ostermalm boutiques and djurgarden. 0.11 eth / night hotel'),
  (193, 68, 'Scandic Continental', 'scandic-continental.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Central eco-minded hotel beside Stockholm Central Station, ideal for exploring the islands.', 193, 'scandic continental', 'scandic continental — stockholm', 'scandic continental stockholm sweden central eco-minded hotel beside stockholm central station, ideal for exploring the islands. 0.08 eth / night hotel'),
  (194, 69, 'Cabarfeidh Hotel', 'cabarfeidh-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Town hotel in Stornoway, a short walk from the harbour and Lews Castle.', 194, 'cabarfeidh hotel', 'cabarfeidh hotel — stornoway', 'cabarfeidh hotel stornoway scotland town hotel in stornoway, a short walk from the harbour and lews castle. 0.08 eth / night hotel'),
  (195, 69, 'Caladh Inn', 'caladh-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Harbour inn in Stornoway, beside the ferry terminal for the mainland.', 195, 'caladh inn', 'caladh inn — stornoway', 'caladh inn stornoway scotland harbour inn in stornoway, beside the ferry terminal for the mainland. 0.06 eth / night hotel'),
  (196, 69, 'Lews Castle Lodge', 'lews-castle-lodge.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Woodland lodge across the harbour from Stornoway, on the grounds of Lews Castle.', 196, 'lews castle lodge', 'lews castle lodge — stornoway', 'lews castle lodge stornoway scotland woodland lodge across the harbour from stornoway, on the grounds of lews castle. 0.07 eth / night hotel'),
  (197, 70, 'Hotel Telegraaf', 'hotel-telegraaf-tallinn.html', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic 5-star hotel in Tallinn Old Town with elegant rooms and a luxury spa.', 197, 'hotel telegraaf', 'hotel telegraaf — tallinn', 'hotel telegraaf tallinn estonia historic 5-star hotel in tallinn old town with elegant rooms and a luxury spa. 0.08 eth / night hotel'),
  (198, 70, 'Swissôtel Tallinn', 'swissotel-tallinn.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b07f9a05?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern high-rise hotel offering panoramic city views, pool and business facilities.', 198, 'swissotel tallinn', 'swissotel tallinn — tallinn', 'swissotel tallinn tallinn estonia modern high-rise hotel offering panoramic city views, pool and business facilities. 0.07 eth / night hotel'),
  (199, 71, 'Lapland Hotels Tampere', 'lapland-hotels-tampere.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Modern comfort with Lapland-inspired decor in central Tampere.', 199, 'lapland hotels tampere', 'lapland hotels tampere — tampere', 'lapland hotels tampere tampere finland modern comfort with lapland-inspired decor in central tampere. 0.09 eth / night hotel'),
  (200, 71, 'Original Sokos Hotel Ilves', 'original-sokos-hotel-ilves.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Iconic riverside hotel offering panoramic city views and dining.', 200, 'original sokos hotel ilves', 'original sokos hotel ilves — tampere', 'original sokos hotel ilves tampere finland iconic riverside hotel offering panoramic city views and dining. 0.08 eth / night hotel'),
  (201, 71, 'Scandic Tampere Station', 'scandic-tampere-station.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Convenient hotel next to the train station, perfect for business and leisure.', 201, 'scandic tampere station', 'scandic tampere station — tampere', 'scandic tampere station tampere finland convenient hotel next to the train station, perfect for business and leisure. 0.07 eth / night hotel'),
  (202, 72, 'Hotel Telegraaf', 'hotel-telegraaf.html', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Historic 5-star hotel in Tallinn Old Town with elegant rooms and a luxury spa.', 202, 'hotel telegraaf', 'hotel telegraaf — tartu', 'hotel telegraaf tartu estonia historic 5-star hotel in tallinn old town with elegant rooms and a luxury spa. 0.08 eth / night hotel'),
  (203, 72, 'Swissôtel Tallinn', 'swissotel-tallinn-tartu.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b07f9a05?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern high-rise hotel offering panoramic city views, pool and business facilities.', 203, 'swissotel tallinn', 'swissotel tallinn — tartu', 'swissotel tallinn tartu estonia modern high-rise hotel offering panoramic city views, pool and business facilities. 0.07 eth / night hotel'),
  (204, 73, 'Hotel Føroyar', 'hotel-foroyar.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Hillside hotel above the capital, with grass-roof rooms and wide views over Tórshavn and Nólsoy.', 204, 'hotel foroyar', 'hotel foroyar — torshavn', 'hotel foroyar torshavn faroe islands hillside hotel above the capital, with grass-roof rooms and wide views over torshavn and nolsoy. 0.10 eth / night hotel'),
  (205, 73, 'Hotel Hafnia', 'hotel-hafnia.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Classic downtown hotel on Áarvegur, walking distance to Tinganes and the harbour.', 205, 'hotel hafnia', 'hotel hafnia — torshavn', 'hotel hafnia torshavn faroe islands classic downtown hotel on aarvegur, walking distance to tinganes and the harbour. 0.08 eth / night hotel'),
  (206, 73, 'Hotel Streym', 'hotel-streym.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour-side stay near the ferry terminal, a practical base for island-hopping around the Faroes.', 206, 'hotel streym', 'hotel streym — torshavn', 'hotel streym torshavn faroe islands harbour-side stay near the ferry terminal, a practical base for island-hopping around the faroes. 0.07 eth / night hotel'),
  (207, 74, 'Clarion Hotel The Edge', 'clarion-hotel-the-edge.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Waterfront hotel on the Tromsø Sound with harbour views and a short hop to the Arctic Cathedral.', 207, 'clarion hotel the edge', 'clarion hotel the edge — tromso', 'clarion hotel the edge tromso norway waterfront hotel on the tromso sound with harbour views and a short hop to the arctic cathedral. 0.10 eth / night hotel'),
  (208, 74, 'Radisson Blu Hotel Tromsø', 'radisson-blu-hotel-tromso.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Central Arctic-city hotel with a rooftop bar looking over the island and surrounding peaks.', 208, 'radisson blu hotel tromso', 'radisson blu hotel tromso — tromso', 'radisson blu hotel tromso tromso norway central arctic-city hotel with a rooftop bar looking over the island and surrounding peaks. 0.09 eth / night hotel'),
  (209, 74, 'Scandic Ishavshotel', 'scandic-ishavshotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbourfront stay on the quay, a short walk from Tromsø city centre and the polar museum.', 209, 'scandic ishavshotel', 'scandic ishavshotel — tromso', 'scandic ishavshotel tromso norway harbourfront stay on the quay, a short walk from tromso city centre and the polar museum. 0.08 eth / night hotel'),
  (210, 75, 'Britannia Hotel', 'britannia-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.14 ETH / night', 0.14, 'Restored palatial hotel with a palm court, spa, and several celebrated restaurants.', 210, 'britannia hotel', 'britannia hotel — trondheim', 'britannia hotel trondheim norway restored palatial hotel with a palm court, spa, and several celebrated restaurants. 0.14 eth / night hotel'),
  (211, 75, 'Clarion Hotel Trondheim', 'clarion-hotel-trondheim.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbourfront hotel on Brattøra, a short walk from the aquarium and city centre.', 211, 'clarion hotel trondheim', 'clarion hotel trondheim — trondheim', 'clarion hotel trondheim trondheim norway harbourfront hotel on brattora, a short walk from the aquarium and city centre. 0.08 eth / night hotel'),
  (212, 75, 'Scandic Nidelven', 'scandic-nidelven.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Riverside hotel famous for its breakfast, next to the Solsiden quarter.', 212, 'scandic nidelven', 'scandic nidelven — trondheim', 'scandic nidelven trondheim norway riverside hotel famous for its breakfast, next to the solsiden quarter. 0.07 eth / night hotel'),
  (213, 76, 'Original Sokos Hotel Wiklund', 'original-sokos-hotel-wiklund.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Central hotel with rooftop bar and easy access to Turku’s sights.', 213, 'original sokos hotel wiklund', 'original sokos hotel wiklund — turku', 'original sokos hotel wiklund turku finland central hotel with rooftop bar and easy access to turkus sights. 0.08 eth / night hotel'),
  (214, 76, 'Radisson Blu Marina Palace', 'radisson-blu-marina-palace.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.10 ETH / night', 0.1, 'Riverside hotel with modern rooms and excellent amenities.', 214, 'radisson blu marina palace', 'radisson blu marina palace — turku', 'radisson blu marina palace turku finland riverside hotel with modern rooms and excellent amenities. 0.10 eth / night hotel'),
  (215, 76, 'Scandic Julia', 'scandic-julia.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Modern comfort in the center of Turku, close to shopping and attractions.', 215, 'scandic julia', 'scandic julia — turku', 'scandic julia turku finland modern comfort in the center of turku, close to shopping and attractions. 0.07 eth / night hotel'),
  (216, 77, 'The Ceilidh Place', 'the-ceilidh-place.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Bookshop hotel on the west shore of Ullapool, above Loch Broom.', 216, 'the ceilidh place', 'the ceilidh place — ullapool', 'the ceilidh place ullapool scotland bookshop hotel on the west shore of ullapool, above loch broom. 0.09 eth / night hotel'),
  (217, 77, 'Broomfield House', 'broomfield-house.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Hillside house above the harbour in Ullapool, looking across Loch Broom.', 217, 'broomfield house', 'broomfield house — ullapool', 'broomfield house ullapool scotland hillside house above the harbour in ullapool, looking across loch broom. 0.06 eth / night hotel'),
  (218, 77, 'Ullapool Ferry Hotel', 'ullapool-ferry-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Ullapool, on Loch Broom beside the ferry to Lewis.', 218, 'ullapool ferry hotel', 'ullapool ferry hotel — ullapool', 'ullapool ferry hotel ullapool scotland harbour hotel in ullapool, on loch broom beside the ferry to lewis. 0.08 eth / night hotel'),
  (219, 78, 'Clarion Hotel Gillet', 'clarion-hotel-gillet.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Central hotel by the river Fyris, walking distance to the cathedral and university.', 219, 'clarion hotel gillet', 'clarion hotel gillet — uppsala', 'clarion hotel gillet uppsala sweden central hotel by the river fyris, walking distance to the cathedral and university. 0.07 eth / night hotel'),
  (220, 78, 'Elite Hotel Academia', 'elite-hotel-academia.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Contemporary stay beside Uppsala Central Station with a restaurant and gym.', 220, 'elite hotel academia', 'elite hotel academia — uppsala', 'elite hotel academia uppsala sweden contemporary stay beside uppsala central station with a restaurant and gym. 0.06 eth / night hotel'),
  (221, 78, 'Grand Hotel Hörnan', 'grand-hotel-hornan.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Boutique hotel in a historic corner building overlooking the river and old town.', 221, 'grand hotel hornan', 'grand hotel hornan — uppsala', 'grand hotel hornan uppsala sweden boutique hotel in a historic corner building overlooking the river and old town. 0.05 eth / night hotel'),
  (222, 79, 'Hotel Vestmannaeyjar', 'hotel-vestmannaeyjar.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel on Heimaey, close to the ferry and the town centre.', 222, 'hotel vestmannaeyjar', 'hotel vestmannaeyjar — vestmannaeyjar', 'hotel vestmannaeyjar vestmannaeyjar iceland harbour hotel on heimaey, close to the ferry and the town centre. 0.07 eth / night hotel'),
  (223, 79, 'Hótel Eyjar', 'hotel-eyjar.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Island hotel in Vestmannaeyjar, with views toward the cliffs and the harbour.', 223, 'hotel eyjar', 'hotel eyjar — vestmannaeyjar', 'hotel eyjar vestmannaeyjar iceland island hotel in vestmannaeyjar, with views toward the cliffs and the harbour. 0.06 eth / night hotel'),
  (224, 79, 'Guesthouse Hamar', 'guesthouse-hamar.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.055 ETH / night', 0.055, 'Small guesthouse on Heimaey, a short walk from the puffin cliffs and Eldfell.', 224, 'guesthouse hamar', 'guesthouse hamar — vestmannaeyjar', 'guesthouse hamar vestmannaeyjar iceland small guesthouse on heimaey, a short walk from the puffin cliffs and eldfell. 0.055 eth / night hotel'),
  (225, 81, 'PACAI Hotel', 'pacai-hotel.html', 'https://images.unsplash.com/photo-1501117716987-c8e6b8a6b2d2?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.09 ETH / night', 0.09, 'Luxury boutique hotel in Vilnius Old Town with elegant rooms and a quiet courtyard — perfect for exploring the historic centre.', 225, 'pacai hotel', 'pacai hotel — vilnius', 'pacai hotel vilnius lithuania luxury boutique hotel in vilnius old town with elegant rooms and a quiet courtyard — perfect for exploring the historic centre. 0.09 eth / night hotel'),
  (226, 81, 'Radisson Blu Lietuva', 'radisson-blu-lietuva.html', 'https://images.unsplash.com/photo-1472552949507-78c2d0f1311d?q=80&w=1200&auto=format&fit=crop&crop=entropy', '0.07 ETH / night', 0.07, 'Modern riverside hotel offering panoramic city views, an indoor pool and business facilities for business and leisure travellers.', 226, 'radisson blu lietuva', 'radisson blu lietuva — vilnius', 'radisson blu lietuva vilnius lithuania modern riverside hotel offering panoramic city views, an indoor pool and business facilities for business and leisure travellers. 0.07 eth / night hotel'),
  (227, 82, 'Fleischer’s Hotel', 'fleischers-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Historic hotel by Voss station, where the Bergen railway meets the lake.', 227, 'fleischers hotel', 'fleischers hotel — voss', 'fleischers hotel voss norway historic hotel by voss station, where the bergen railway meets the lake. 0.09 eth / night hotel'),
  (228, 82, 'Park Hotel Vossevangen', 'park-hotel-vossevangen.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lakeside hotel in Voss, beside the station and the town park.', 228, 'park hotel vossevangen', 'park hotel vossevangen — voss', 'park hotel vossevangen voss norway lakeside hotel in voss, beside the station and the town park. 0.07 eth / night hotel'),
  (229, 82, 'Scandic Voss', 'scandic-voss.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Modern hotel in Voss, a short walk from the lake and the gondola.', 229, 'scandic voss', 'scandic voss — voss', 'scandic voss voss norway modern hotel in voss, a short walk from the lake and the gondola. 0.08 eth / night hotel'),
  (230, 83, 'Äkäshotelli', 'akashotelli.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Hotel in Äkäslompolo, at the foot of Ylläs fell and the ski trails.', 230, 'akashotelli', 'akashotelli — yllas', 'akashotelli yllas finland hotel in akaslompolo, at the foot of yllas fell and the ski trails. 0.09 eth / night hotel'),
  (231, 83, 'Lapland Hotels Ylläs', 'lapland-hotels-yllas.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Fell hotel in Ylläsjärvi, close to the gondola and the village.', 231, 'lapland hotels yllas', 'lapland hotels yllas — yllas', 'lapland hotels yllas yllas finland fell hotel in yllasjarvi, close to the gondola and the village. 0.07 eth / night hotel'),
  (232, 83, 'Ylläs Saaga', 'yllas-saaga.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Spa hotel in Äkäslompolo, with pools and views toward Ylläs.', 232, 'yllas saaga', 'yllas saaga — yllas', 'yllas saaga yllas finland spa hotel in akaslompolo, with pools and views toward yllas. 0.08 eth / night hotel'),
  (233, 84, 'Hotel Nida Marina', 'hotel-nida-marina.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Lagoon-side hotel in Nida with dune views and a short walk to the fishing harbour.', 233, 'hotel nida marina', 'hotel nida marina — nida', 'hotel nida marina nida lithuania lagoon-side hotel in nida with dune views and a short walk to the fishing harbour. 0.07 eth / night hotel'),
  (234, 85, 'Barentsburg Guesthouse', 'barentsburg-guesthouse.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Compact guesthouse in Barentsburg, above the harbour and the historic mining settlement.', 234, 'barentsburg guesthouse', 'barentsburg guesthouse — barentsburg', 'barentsburg guesthouse barentsburg svalbard compact guesthouse in barentsburg, above the harbour and the historic mining settlement. 0.09 eth / night hotel'),
  (235, 86, 'Pyramiden Harbour House', 'pyramiden-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Simple harbour stay in Pyramiden for guided visits to the preserved mining town.', 235, 'pyramiden harbour house', 'pyramiden harbour house — pyramiden', 'pyramiden harbour house pyramiden svalbard simple harbour stay in pyramiden for guided visits to the preserved mining town. 0.08 eth / night hotel'),
  (236, 87, 'Palanga Dune Hotel', 'palanga-dune-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Pine-backed hotel in Palanga, between the botanical park and the Baltic beach.', 236, 'palanga dune hotel', 'palanga dune hotel — palanga', 'palanga dune hotel palanga lithuania pine-backed hotel in palanga, between the botanical park and the baltic beach. 0.05 eth / night hotel'),
  (237, 88, 'Druskininkai Spa House', 'druskininkai-spa-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Spa house in Druskininkai, near the Nemunas riverside promenade and the mineral springs.', 237, 'druskininkai spa house', 'druskininkai spa house — druskininkai', 'druskininkai spa house druskininkai lithuania spa house in druskininkai, near the nemunas riverside promenade and the mineral springs. 0.06 eth / night hotel'),
  (238, 89, 'Trakai Lake House', 'trakai-lake-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.05 ETH / night', 0.05, 'Lakeside house in Trakai, a short walk from the island castle.', 238, 'trakai lake house', 'trakai lake house — trakai', 'trakai lake house trakai lithuania lakeside house in trakai, a short walk from the island castle. 0.05 eth / night hotel'),
  (239, 90, 'Porvoo Old Town Hotel', 'porvoo-old-town-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Old-town hotel in Porvoo, among the red shore warehouses on the Porvoonjoki.', 239, 'porvoo old town hotel', 'porvoo old town hotel — porvoo', 'porvoo old town hotel porvoo finland old-town hotel in porvoo, among the red shore warehouses on the porvoonjoki. 0.07 eth / night hotel'),
  (240, 91, 'Kuopio Lakefront Hotel', 'kuopio-lakefront-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Lakefront hotel in Kuopio, close to the passenger harbour on Kallavesi.', 240, 'kuopio lakefront hotel', 'kuopio lakefront hotel — kuopio', 'kuopio lakefront hotel kuopio finland lakefront hotel in kuopio, close to the passenger harbour on kallavesi. 0.06 eth / night hotel'),
  (241, 92, 'Savonlinna Castle Hotel', 'savonlinna-castle-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Island hotel in Savonlinna, facing Olavinlinna across the strait.', 241, 'savonlinna castle hotel', 'savonlinna castle hotel — savonlinna', 'savonlinna castle hotel savonlinna finland island hotel in savonlinna, facing olavinlinna across the strait. 0.08 eth / night hotel'),
  (242, 93, 'Icehotel Jukkasjärvi', 'icehotel-jukkasjarvi.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.11 ETH / night', 0.11, 'Ice rooms and a warm hotel in Jukkasjärvi, on the Torne River north of Kiruna.', 242, 'icehotel jukkasjarvi', 'icehotel jukkasjarvi — jukkasjarvi', 'icehotel jukkasjarvi jukkasjarvi sweden ice rooms and a warm hotel in jukkasjarvi, on the torne river north of kiruna. 0.11 eth / night hotel'),
  (243, 94, 'Gjógv Guesthouse', 'gjogv-guesthouse.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Turf-roof guesthouse in Gjógv, above the sea gorge on the north coast of Eysturoy.', 243, 'gjogv guesthouse', 'gjogv guesthouse — gjogv', 'gjogv guesthouse gjogv faroe islands turf-roof guesthouse in gjogv, above the sea gorge on the north coast of eysturoy. 0.08 eth / night hotel'),
  (244, 95, 'Saksun Turf House', 'saksun-turf-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Turf-roof house in Saksun, beside the lagoon where the stream meets the Atlantic.', 244, 'saksun turf house', 'saksun turf house — saksun', 'saksun turf house saksun faroe islands turf-roof house in saksun, beside the lagoon where the stream meets the atlantic. 0.07 eth / night hotel'),
  (245, 96, 'Mykines Puffin Lodge', 'mykines-puffin-lodge.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Cliffside lodge on Mykines, a short walk from the puffin slopes and the lighthouse path.', 245, 'mykines puffin lodge', 'mykines puffin lodge — mykines', 'mykines puffin lodge mykines faroe islands cliffside lodge on mykines, a short walk from the puffin slopes and the lighthouse path. 0.09 eth / night hotel'),
  (246, 97, 'Nólsoy Harbour House', 'nolsoy-harbour-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Harbour house on Nólsoy, the island facing Tórshavn across the sound.', 246, 'nolsoy harbour house', 'nolsoy harbour house — nolsoy', 'nolsoy harbour house nolsoy faroe islands harbour house on nolsoy, the island facing torshavn across the sound. 0.06 eth / night hotel'),
  (247, 98, 'Vágar Cliff Hotel', 'vagar-cliff-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Cliff hotel on Vágar, near the airport and the ridge above Sørvágsvatn.', 247, 'vagar cliff hotel', 'vagar cliff hotel — vagar', 'vagar cliff hotel vagar faroe islands cliff hotel on vagar, near the airport and the ridge above sorvagsvatn. 0.08 eth / night hotel'),
  (248, 99, 'Streymoy Valley Inn', 'streymoy-valley-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Valley inn on Streymoy, between the mountain road and the villages west of Tórshavn.', 248, 'streymoy valley inn', 'streymoy valley inn — streymoy', 'streymoy valley inn streymoy faroe islands valley inn on streymoy, between the mountain road and the villages west of torshavn. 0.07 eth / night hotel'),
  (249, 100, 'Eysturoy Sound Hotel', 'eysturoy-sound-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Sound-side hotel on Eysturoy, a base for the villages north of the undersea tunnel.', 249, 'eysturoy sound hotel', 'eysturoy sound hotel — eysturoy', 'eysturoy sound hotel eysturoy faroe islands sound-side hotel on eysturoy, a base for the villages north of the undersea tunnel. 0.07 eth / night hotel'),
  (250, 101, 'Ny-Ålesund Polar Lodge', 'ny-alesund-polar-lodge.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.12 ETH / night', 0.12, 'Small lodge in Ny-Ålesund, the research settlement on Kongsfjorden.', 250, 'ny-alesund polar lodge', 'ny-alesund polar lodge — ny-alesund', 'ny-alesund polar lodge ny-alesund svalbard small lodge in ny-alesund, the research settlement on kongsfjorden. 0.12 eth / night hotel'),
  (251, 102, 'Kastelholm Castle Inn', 'kastelholm-castle-inn.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Inn beside Kastelholm Castle, on the inland road from Mariehamn.', 251, 'kastelholm castle inn', 'kastelholm castle inn — kastelholm', 'kastelholm castle inn kastelholm aland islands inn beside kastelholm castle, on the inland road from mariehamn. 0.08 eth / night hotel'),
  (252, 103, 'Bomarsund Fortress House', 'bomarsund-fortress-house.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Guest house by the Bomarsund fortress ruins, on the Åland shore.', 252, 'bomarsund fortress house', 'bomarsund fortress house — bomarsund', 'bomarsund fortress house bomarsund aland islands guest house by the bomarsund fortress ruins, on the aland shore. 0.06 eth / night hotel'),
  (253, 104, 'Skye Cuillin Hotel', 'skye-cuillin-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Harbour hotel on the Isle of Skye, with views toward the Cuillin ridge and the sea cliffs.', 253, 'skye cuillin hotel', 'skye cuillin hotel — isle of skye', 'skye cuillin hotel isle of skye scotland harbour hotel on the isle of skye, with views toward the cuillin ridge and the sea cliffs. 0.09 eth / night hotel'),
  (254, 105, 'Kirkwall Harbour Hotel', 'kirkwall-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.08 ETH / night', 0.08, 'Harbour hotel in Kirkwall, beside St Magnus Cathedral and the Orkney ferry pier.', 254, 'kirkwall harbour hotel', 'kirkwall harbour hotel — kirkwall', 'kirkwall harbour hotel kirkwall scotland harbour hotel in kirkwall, beside st magnus cathedral and the orkney ferry pier. 0.08 eth / night hotel'),
  (255, 106, 'Tobermory Waterfront Hotel', 'tobermory-waterfront-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Waterfront hotel in Tobermory, on the coloured harbour of the Isle of Mull.', 255, 'tobermory waterfront hotel', 'tobermory waterfront hotel — tobermory', 'tobermory waterfront hotel tobermory scotland waterfront hotel in tobermory, on the coloured harbour of the isle of mull. 0.07 eth / night hotel'),
  (256, 107, 'Uist Machair House', 'uist-machair-house.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Shore house on Uist, between the machair and the Atlantic beaches of the Outer Hebrides.', 256, 'uist machair house', 'uist machair house — uist', 'uist machair house uist scotland shore house on uist, between the machair and the atlantic beaches of the outer hebrides. 0.06 eth / night hotel'),
  (257, 108, 'Tarbert Harris Hotel', 'tarbert-harris-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Pier hotel in Tarbert (Harris), where the ferry meets the Isle of Harris.', 257, 'tarbert harris hotel', 'tarbert harris hotel — tarbert (harris)', 'tarbert harris hotel tarbert (harris) scotland pier hotel in tarbert (harris), where the ferry meets the isle of harris. 0.07 eth / night hotel'),
  (258, 109, 'Uig Bay Hotel', 'uig-bay-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Bay hotel in Uig, at the Skye ferry pier for the Outer Hebrides.', 258, 'uig bay hotel', 'uig bay hotel — uig', 'uig bay hotel uig scotland bay hotel in uig, at the skye ferry pier for the outer hebrides. 0.06 eth / night hotel'),
  (259, 110, 'Dunvegan Castle Hotel', 'dunvegan-castle-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.09 ETH / night', 0.09, 'Lochside hotel in Dunvegan, a short walk from Dunvegan Castle on the Isle of Skye.', 259, 'dunvegan castle hotel', 'dunvegan castle hotel — dunvegan', 'dunvegan castle hotel dunvegan scotland lochside hotel in dunvegan, a short walk from dunvegan castle on the isle of skye. 0.09 eth / night hotel'),
  (260, 111, 'Broadford Bay Hotel', 'broadford-bay-hotel.html', 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Bay hotel in Broadford, on the south-east shore of the Isle of Skye.', 260, 'broadford bay hotel', 'broadford bay hotel — broadford', 'broadford bay hotel broadford scotland bay hotel in broadford, on the south-east shore of the isle of skye. 0.07 eth / night hotel'),
  (261, 112, 'Armadale Pier Hotel', 'armadale-pier-hotel.html', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80', '0.06 ETH / night', 0.06, 'Pier hotel in Armadale, where the Mallaig ferry meets the Sleat peninsula.', 261, 'armadale pier hotel', 'armadale pier hotel — armadale', 'armadale pier hotel armadale scotland pier hotel in armadale, where the mallaig ferry meets the sleat peninsula. 0.06 eth / night hotel'),
  (262, 113, 'Lochmaddy Harbour Hotel', 'lochmaddy-harbour-hotel.html', 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80', '0.07 ETH / night', 0.07, 'Harbour hotel in Lochmaddy, the ferry port on North Uist.', 262, 'lochmaddy harbour hotel', 'lochmaddy harbour hotel — lochmaddy', 'lochmaddy harbour hotel lochmaddy scotland harbour hotel in lochmaddy, the ferry port on north uist. 0.07 eth / night hotel');
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

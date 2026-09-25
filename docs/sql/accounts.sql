-- Account-holder records for Boreal Horizons.
--
-- Dialect: SQLite 3.
-- Companion notes: docs/sql/accounts.md
--
-- One row in accounts is one person who created an account: a guest
-- (account_type 'customer') or the primary contact on a company account
-- (account_type 'business'). The columns match the user object written by
-- routes/auth.js. The live API still stores that object in data/users.json.
--
-- Passwords are not stored. password_salt and password_hash are the scrypt
-- values the route already computes (16-byte salt, 64-byte hash, both hex).
-- Application code must hash the password before INSERT.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per person who created an account.
CREATE TABLE accounts (
  -- Same id the API stores (UUID, or a local-auth id).
  id                  TEXT PRIMARY KEY CHECK (
                        length(id) BETWEEN 8 AND 64
                        AND id = trim(id)
                        AND id NOT GLOB '* *'
                      ),
  -- publicUser.name. At least 2 characters, already trimmed.
  full_name           TEXT NOT NULL CHECK (
                        length(full_name) >= 2
                        AND full_name = trim(full_name)
                      ),
  -- Stored lowercase, one address per person.
  email               TEXT NOT NULL UNIQUE CHECK (
                        email = lower(email)
                        AND email = trim(email)
                        AND instr(email, '@') > 1
                        AND email GLOB '*@*.*'
                        AND email NOT GLOB '* *'
                        AND email NOT GLOB '*@*@*'
                      ),
  -- 'customer' from personal registration, 'business' from business registration.
  account_type        TEXT NOT NULL CHECK (account_type IN ('customer', 'business')),
  company_name        TEXT NOT NULL DEFAULT '' CHECK (company_name = trim(company_name)),
  -- Form values: independent-hotel, hotel-chain, travel-agency, corporate, other.
  -- Empty for a guest account.
  business_type       TEXT NOT NULL DEFAULT '' CHECK (
                        business_type = ''
                        OR business_type IN (
                          'independent-hotel',
                          'hotel-chain',
                          'travel-agency',
                          'corporate',
                          'other'
                        )
                      ),
  phone               TEXT NOT NULL DEFAULT '' CHECK (phone = trim(phone)),
  vat_id              TEXT NOT NULL DEFAULT '' CHECK (vat_id = trim(vat_id)),
  website             TEXT NOT NULL DEFAULT '' CHECK (
                        website = trim(website)
                        AND (website = '' OR instr(website, '.') > 1)
                      ),
  -- Country / region id from assets/country-address.js. Empty for a guest.
  country             TEXT NOT NULL DEFAULT '' CHECK (
                        country = ''
                        OR country IN (
                          'Åland Islands',
                          'Denmark',
                          'Estonia',
                          'Faroe Islands',
                          'Finland',
                          'Greenland',
                          'Iceland',
                          'Latvia',
                          'Lithuania',
                          'Northeast England',
                          'Norway',
                          'Scotland',
                          'Sweden',
                          'Other'
                        )
                      ),
  -- City copied from the validated address, when there is one.
  city                TEXT NOT NULL DEFAULT '' CHECK (city = trim(city)),
  -- Validated address object. NULL when the person has no postal address.
  -- Keys follow the country schema (streetName, houseNumber, postalCode, …).
  address_json        TEXT CHECK (
                        address_json IS NULL
                        OR (
                          json_valid(address_json)
                          AND json_type(address_json) = 'object'
                        )
                      ),
  -- Postal block from CountryAddress.formatAddress, including the company name.
  address_formatted   TEXT NOT NULL DEFAULT '' CHECK (address_formatted = trim(address_formatted)),
  -- hex(scrypt salt), 16 bytes.
  password_salt       TEXT NOT NULL CHECK (
                        length(password_salt) = 32
                        AND password_salt = lower(password_salt)
                        AND password_salt NOT GLOB '*[^0-9a-f]*'
                      ),
  -- hex(scrypt hash), 64 bytes.
  password_hash       TEXT NOT NULL CHECK (
                        length(password_hash) = 128
                        AND password_hash = lower(password_hash)
                        AND password_hash NOT GLOB '*[^0-9a-f]*'
                      ),
  -- ISO-8601 UTC timestamp from the API (toISOString).
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (
                        created_at GLOB '????-??-??T??:??:??*Z'
                      ),
  -- A company account needs a company, a business type, a country, and an address.
  CHECK (
    account_type = 'customer'
    OR (
      length(company_name) >= 2
      AND business_type <> ''
      AND country <> ''
      AND address_json IS NOT NULL
      AND address_formatted <> ''
    )
  )
);

CREATE INDEX accounts_created_at ON accounts (created_at);
CREATE INDEX accounts_account_type ON accounts (account_type);

-- ---------------------------------------------------------------------------
-- Example rows
-- The salt and hash below are placeholders of the right length. They are not
-- the scrypt output for any password. Replace them with the values from
-- hashPassword() in routes/auth.js when loading a real registration.
-- ---------------------------------------------------------------------------

-- Guest account. personal-register.html sends name, email, and password.
INSERT INTO accounts (
  id, full_name, email, account_type,
  password_salt, password_hash, created_at
) VALUES (
  '6f1c0a2e-7b34-4d11-9c80-1a2b3c4d5e6f',
  'Ada Guest',
  'ada.guest@example.com',
  'customer',
  'a1b2c3d4e5f6789012345678abcdef01',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  '2026-05-10T09:15:00.000Z'
);

-- Company account. business-register.html also sends the company and address.
-- postalCode is the normalized form (LV-1011), the same as validateAddress().
INSERT INTO accounts (
  id, full_name, email, account_type,
  company_name, business_type, phone, vat_id, website,
  country, city, address_json, address_formatted,
  password_salt, password_hash, created_at
) VALUES (
  'b7e2d4c1-8a90-4f55-b612-0c1d2e3f4a5b',
  'Jane Doe',
  'jane.doe@hotels.example',
  'business',
  'Northern Lights Hotels',
  'independent-hotel',
  '+371 2000 0000',
  'LV40003123456',
  'https://www.northernlights.example',
  'Latvia',
  'Rīga',
  json('{"streetName":"Brīvības iela","houseNumber":"76","apartment":"3","postalCode":"LV-1011","city":"Rīga"}'),
  'Northern Lights Hotels' || char(10) ||
    'Brīvības iela 76–3' || char(10) ||
    'LV-1011, Rīga' || char(10) ||
    'Latvia',
  '00112233445566778899aabbccddeeff',
  'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  '2026-05-11T14:30:00.000Z'
);

-- ---------------------------------------------------------------------------
-- Record of people who created an account
--
-- Column names match publicUser() in routes/auth.js. Salt and hash are omitted.
-- ---------------------------------------------------------------------------

SELECT
  id,
  full_name          AS name,
  email,
  account_type       AS accountType,
  company_name       AS companyName,
  business_type      AS businessType,
  phone,
  vat_id             AS vatId,
  website,
  country,
  city,
  address_formatted  AS addressFormatted,
  created_at         AS createdAt
FROM accounts
ORDER BY created_at, email;

-- Company contacts only: people who opened a business account.
SELECT
  full_name     AS name,
  email,
  company_name  AS companyName,
  business_type AS businessType,
  country,
  city,
  created_at    AS createdAt
FROM accounts
WHERE account_type = 'business'
ORDER BY created_at, email;

-- Sign-in lookup. The route compares the submitted password with this salt
-- and hash. Do not return this row to the browser.
-- Worked example: email = 'ada.guest@example.com' (already lowercased).
SELECT
  id,
  password_salt AS passwordSalt,
  password_hash AS passwordHash
FROM accounts
WHERE email = 'ada.guest@example.com';

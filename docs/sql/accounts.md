# Account holder SQL

People who create an account with Boreal Horizons are stored as one row each. A guest registration (`personal-register.html`, `account_type` `customer`) and a company registration (`business-register.html`, `account_type` `business`) use the same table. The business row is still the person: the primary contact, with the company fields filled in.

The statements live in [`accounts.sql`](accounts.sql). Dialect is SQLite 3.

`routes/auth.js` writes the same fields to `data/users.json`. This file is the SQL record of those people. Loading it does not switch the API off the JSON file.

## What is stored

`POST /api/auth/register` validates the body, then keeps the person. The password never lands in the table. The route hashes it with scrypt (`password_salt` is 16 bytes as 32 hex characters, `password_hash` is 64 bytes as 128 hex characters) and inserts those two values.

| Column | JSON field | Notes |
| --- | --- | --- |
| `id` | `id` | UUID from the API, or a `local-` id from `assets/local-auth.js` |
| `full_name` | `name` | At least 2 characters |
| `email` | `email` | Lowercased. One account per email |
| `account_type` | `accountType` | `customer` or `business` |
| `company_name` | `companyName` | Required, at least 2 characters, when `account_type` is `business` |
| `business_type` | `businessType` | `independent-hotel`, `hotel-chain`, `travel-agency`, `corporate`, or `other`. Empty for a guest |
| `phone` | `phone` | Optional |
| `vat_id` | `vatId` | Optional VAT or business id |
| `website` | `website` | Optional. When set, it must contain a dot |
| `country` | `country` | Country or region id from `assets/country-address.js`. Required for a business account |
| `city` | `city` | City taken from the validated address |
| `address_json` | `address` | Object of local address fields. NULL when there is no address |
| `address_formatted` | `addressFormatted` | Postal block, company name on the first line for a business |
| `password_salt` | `passwordSalt` | Not part of `publicUser()` |
| `password_hash` | `passwordHash` | Not part of `publicUser()` |
| `created_at` | `createdAt` | ISO-8601 UTC, for example `2026-05-10T09:15:00.000Z` |

A business row must have a company name, a business type, a country, `address_json`, and `address_formatted`. A guest row may leave the company and address columns empty. `email` is unique, which is the same rule as the 409 response "An account with this email already exists."

`address_json` uses the keys produced by `CountryAddress.validateAddress` for that country (`streetName`, `houseNumber`, `postalCode`, and the optional local fields such as `apartment` or `floor`). Store the normalized postal code, for example `LV-1011`, not the digits the person typed.

## Listing the people

The first `SELECT` in `accounts.sql` is the register of account holders, oldest first. Its column names match `publicUser()` so a reader sees the same fields the account page shows. Salt and hash are not in that result.

The second `SELECT` is only the people who opened a company account.

The third `SELECT` is the sign-in lookup: salt and hash for one email. The browser receives `publicUser()`, not this row.

## Running the example

```bash
sqlite3 :memory: < docs/sql/accounts.sql
```

The script inserts Ada Guest (guest) and Jane Doe (Northern Lights Hotels, Riga), then prints the three result sets above. The salts and hashes in the file are the right length and are not the scrypt digest of any password. A real insert uses the pair from `hashPassword()` in `routes/auth.js`.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const CountryAddress = require('../assets/country-address');

test('country list uses Scotland and Northeast England instead of the United Kingdom', () => {
  const ids = CountryAddress.countries.map((country) => country.id);
  assert.deepEqual(ids.filter((id) => id === 'United Kingdom'), []);
  assert.ok(ids.includes('Scotland'));
  assert.ok(ids.includes('Northeast England'));
});

test('formats a Latvian business address in local order', () => {
  const result = CountryAddress.validateAddress('Latvia', {
    streetName: 'Brīvības iela',
    houseNumber: '76',
    apartment: '3',
    postalCode: '1011',
    city: 'Rīga'
  }, { companyName: 'Northern Lights Hotels' });

  assert.equal(result.ok, true);
  assert.equal(result.values.postalCode, 'LV-1011');
  assert.equal(
    result.formatted,
    [
      'Northern Lights Hotels',
      'Brīvības iela 76–3',
      'LV-1011, Rīga',
      'Latvia'
    ].join('\n')
  );
});

test('formats Danish, Swedish, and Finnish addresses', () => {
  const denmark = CountryAddress.formatAddress('Denmark', {
    streetName: 'Nørregade',
    houseNumber: '12',
    floor: '3. tv',
    postalCode: '1165',
    city: 'København K'
  });
  assert.equal(denmark, 'Nørregade 12, 3. tv\n1165 København K\nDenmark');

  const sweden = CountryAddress.validateAddress('Sweden', {
    streetName: 'Drottninggatan',
    houseNumber: '12',
    postalCode: '11151',
    city: 'Stockholm'
  });
  assert.equal(sweden.ok, true);
  assert.equal(sweden.formatted, 'Drottninggatan 12\n111 51 Stockholm\nSweden');

  const finland = CountryAddress.formatAddress('Finland', {
    streetName: 'Mannerheimintie',
    houseNumber: '12',
    staircase: 'A',
    apartment: '5',
    postalCode: '00100',
    city: 'Helsinki'
  });
  assert.equal(finland, 'Mannerheimintie 12 A 5\n00100 Helsinki\nFinland');
});

test('formats Scotland and Northeast England in Royal Mail order', () => {
  const scotland = CountryAddress.validateAddress('Scotland', {
    subBuilding: 'Flat 2',
    streetNumber: '14',
    streetName: 'Princes Street',
    city: 'Edinburgh',
    postalCode: 'eh22an'
  });
  assert.equal(scotland.ok, true);
  assert.equal(scotland.values.postalCode, 'EH2 2AN');
  assert.equal(
    scotland.formatted,
    'Flat 2\n14 Princes Street\nEdinburgh\nEH2 2AN\nScotland'
  );

  const northeast = CountryAddress.formatAddress('Northeast England', {
    streetNumber: '12',
    streetName: 'Grey Street',
    city: 'Newcastle upon Tyne',
    postalCode: 'NE1 6AE'
  });
  assert.equal(
    northeast,
    '12 Grey Street\nNewcastle upon Tyne\nNE1 6AE\nNortheast England'
  );
});

test('formats remaining Northern European addresses in local order', () => {
  assert.equal(
    CountryAddress.formatAddress('Estonia', {
      streetName: 'Pärnu mnt',
      houseNumber: '12',
      apartment: '5',
      postalCode: '10148',
      city: 'Tallinn'
    }),
    'Pärnu mnt 12-5\n10148 Tallinn\nEstonia'
  );

  assert.equal(
    CountryAddress.formatAddress('Iceland', {
      streetName: 'Laugavegur',
      houseNumber: '11',
      postalCode: '101',
      city: 'Reykjavík'
    }),
    'Laugavegur 11\n101 Reykjavík\nIceland'
  );

  assert.equal(
    CountryAddress.formatAddress('Lithuania', {
      streetName: 'Gedimino pr.',
      houseNumber: '9',
      apartment: '1',
      postalCode: 'LT-01103',
      city: 'Vilnius'
    }),
    'Gedimino pr. 9-1\n01103 Vilnius\nLithuania'
  );

  assert.equal(
    CountryAddress.formatAddress('Norway', {
      streetName: 'Karl Johans gate',
      houseNumber: '15',
      postalCode: '0154',
      city: 'Oslo'
    }),
    'Karl Johans gate 15\n0154 Oslo\nNorway'
  );

  const other = CountryAddress.validateAddress('Other', {
    line1: 'Main Street 1',
    city: 'Tórshavn',
    postalCode: '100',
    countryName: 'Faroe Islands'
  });
  assert.equal(other.ok, true);
  assert.equal(other.formatted, 'Main Street 1\nTórshavn\n100\nFaroe Islands');
});

test('every listed country has a local address schema', () => {
  CountryAddress.countries.forEach(function (country) {
    const schema = CountryAddress.getSchema(country.id);
    assert.ok(schema, country.id + ' is missing an address schema');
    assert.ok(schema.fields.length > 1, country.id + ' should collect more than a city');
    const ids = schema.fields.map((field) => field.id);
    if (country.id !== 'Other') {
      assert.ok(ids.includes('city') || ids.includes('postalCode'));
    }
  });
});

test('rejects incomplete addresses and unknown countries', () => {
  const missingCity = CountryAddress.validateAddress('Norway', {
    streetName: 'Karl Johans gate',
    houseNumber: '15',
    postalCode: '0154'
  });
  assert.equal(missingCity.ok, false);
  assert.match(missingCity.message, /Post town/);

  const badPostcode = CountryAddress.validateAddress('Iceland', {
    streetName: 'Laugavegur',
    houseNumber: '11',
    postalCode: '1014',
    city: 'Reykjavík'
  });
  assert.equal(badPostcode.ok, false);
  assert.match(badPostcode.message, /3 digits/);

  const unitedKingdom = CountryAddress.validateAddress('United Kingdom', {
    city: 'London'
  });
  assert.equal(unitedKingdom.ok, false);
});

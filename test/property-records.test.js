const { test } = require('node:test');
const assert = require('node:assert/strict');
const PropertyRecords = require('../assets/property-records');
const LocalProperties = require('../assets/local-properties');

function memoryStorage() {
  const store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
}

function locationPayload(overrides) {
  return Object.assign({
    name: 'Harbour House',
    propertyType: 'hotel',
    country: 'Latvia',
    address: {
      streetName: 'Brīvības iela',
      houseNumber: '76',
      postalCode: '1011',
      city: 'Rīga'
    },
    directions: 'Entrance on Brīvības iela, beside the riverside park.'
  }, overrides);
}

test('saves a property with a local postal address and location note', () => {
  const record = PropertyRecords.createRecord('biz-1', locationPayload({
    latitude: '56.9496',
    longitude: '24.1052',
    phone: '+371 20000000',
    website: 'harbour.example'
  }));

  assert.equal(record.userId, 'biz-1');
  assert.equal(record.name, 'Harbour House');
  assert.equal(record.propertyType, 'hotel');
  assert.equal(record.city, 'Rīga');
  assert.equal(record.address.postalCode, 'LV-1011');
  assert.match(record.addressFormatted, /Harbour House/);
  assert.match(record.addressFormatted, /Rīga/);
  assert.equal(record.latitude, 56.9496);
  assert.equal(record.longitude, 24.1052);
  assert.equal(record.website, 'harbour.example');
  const published = PropertyRecords.publicProperty(record);
  assert.equal(published.userId, undefined);
  assert.equal(published.directions, record.directions);
});

test('rejects a location without an address, a place note, or a single coordinate', () => {
  assert.throws(
    () => PropertyRecords.createRecord('biz-1', locationPayload({
      country: '',
      address: {}
    })),
    { status: 400 }
  );
  assert.throws(
    () => PropertyRecords.createRecord('biz-1', locationPayload({ directions: 'Here' })),
    { status: 400 }
  );
  assert.throws(
    () => PropertyRecords.createRecord('biz-1', locationPayload({ latitude: '56.9' })),
    { status: 400 }
  );
  assert.throws(
    () => PropertyRecords.createRecord('biz-1', locationPayload({ propertyType: 'resort' })),
    { status: 400 }
  );
});

test('local storage keeps each business account’s locations separate', () => {
  const store = LocalProperties.create({ storage: memoryStorage() });
  const first = store.create('biz-1', locationPayload());
  store.create('biz-2', locationPayload({ name: 'Other House' }));
  const updated = store.update('biz-1', first.id, locationPayload({
    name: 'Harbour House Hotel',
    directions: 'Use the courtyard door on the river side.'
  }));

  assert.equal(updated.name, 'Harbour House Hotel');
  assert.equal(store.list('biz-1').length, 1);
  assert.equal(store.list('biz-2')[0].name, 'Other House');
  assert.throws(
    () => store.update('biz-2', first.id, locationPayload({ name: 'Taken Over' })),
    { status: 404 }
  );
  store.remove('biz-1', first.id);
  assert.deepEqual(store.list('biz-1'), []);
});

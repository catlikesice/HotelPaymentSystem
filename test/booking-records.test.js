const { test } = require('node:test');
const assert = require('node:assert/strict');
const BookingRecords = require('../assets/booking-records');
const LocalBookings = require('../assets/local-bookings');

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

test('creates a stay record with a generated confirmation code', () => {
  const record = BookingRecords.createRecord('user-1', {
    kind: 'stay',
    propertyName: 'Wellton Riverside Riga',
    city: 'Riga',
    country: 'Latvia',
    checkInDate: '2099-05-10',
    checkOutDate: '2099-05-13',
    guests: { adults: 2, children: 0 },
    roomLabel: 'Riverside Deluxe Room',
    amount: 0.18,
    currency: 'ETH'
  });

  assert.equal(record.userId, 'user-1');
  assert.equal(record.kind, 'stay');
  assert.equal(record.nights, 3);
  assert.equal(record.propertyName, 'Wellton Riverside Riga');
  assert.match(record.confirmationCode, /^BH-[A-Z0-9]{6}$/);
  assert.notEqual(record.confirmationCode, 'BH-4821');
  assert.equal(BookingRecords.publicBooking(record).userId, undefined);
});

test('rejects incomplete stays and accepts booked event tickets', () => {
  assert.throws(
    () => BookingRecords.createRecord('user-1', {
      kind: 'stay',
      propertyName: 'Wellton Riverside Riga',
      city: 'Riga',
      checkInDate: '2099-05-13',
      checkOutDate: '2099-05-10',
      amount: 0.1,
      currency: 'ETH'
    }),
    { status: 400 }
  );

  const eventRecord = BookingRecords.createRecord('user-1', {
    kind: 'event',
    eventName: 'Riga Jazz Night',
    eventDate: '2099-05-11',
    city: 'Riga',
    country: 'Latvia',
    amount: 0.01,
    currency: 'ETH'
  });
  assert.equal(eventRecord.kind, 'event');
  assert.equal(eventRecord.eventName, 'Riga Jazz Night');
});

test('local bookings store only returns trips for the signed-in user', () => {
  const store = LocalBookings.create({ storage: memoryStorage() });
  store.create('user-a', {
    kind: 'stay',
    propertyName: 'Scandic Copenhagen',
    city: 'Copenhagen',
    country: 'Denmark',
    checkInDate: '2099-06-01',
    checkOutDate: '2099-06-03',
    amount: 0.14,
    currency: 'ETH'
  });
  store.create('user-b', {
    kind: 'stay',
    propertyName: 'Grand Hotel Kempinski Riga',
    city: 'Riga',
    country: 'Latvia',
    checkInDate: '2099-07-01',
    checkOutDate: '2099-07-04',
    amount: 0.27,
    currency: 'ETH'
  });

  const mine = store.list('user-a');
  assert.equal(mine.length, 1);
  assert.equal(mine[0].propertyName, 'Scandic Copenhagen');
  assert.equal(store.list('user-b')[0].propertyName, 'Grand Hotel Kempinski Riga');
});

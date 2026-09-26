const { test } = require('node:test');
const assert = require('node:assert/strict');
const BookingDates = require('../assets/booking-dates');

test('parses European dd/mm/yyyy as day then month', () => {
  assert.equal(BookingDates.toISO('10/05/2026'), '2026-05-10');
  assert.equal(BookingDates.toISO('13/05/2026'), '2026-05-13');
  assert.equal(BookingDates.toISO('5/3/2026'), '2026-03-05');
  assert.equal(BookingDates.toEuropean('2026-05-10'), '10/05/2026');
});

test('rejects month-first dates that are not valid European dates', () => {
  assert.equal(BookingDates.toISO('05/13/2026'), '');
  assert.equal(BookingDates.toISO('31/02/2026'), '');
  assert.equal(BookingDates.toISO('29/02/2023'), '');
  assert.equal(BookingDates.toISO('29/02/2024'), '2024-02-29');
});

test('accepts a past birth date and rejects future or impossible days', () => {
  assert.deepEqual(BookingDates.validateBirthDate('15/03/1990'), {
    ok: true,
    empty: false,
    iso: '1990-03-15',
    message: ''
  });
  assert.equal(BookingDates.validateBirthDate('1990-03-15').ok, true);
  assert.equal(BookingDates.validateBirthDate('').empty, true);
  assert.equal(BookingDates.validateBirthDate('31/02/1990').ok, false);
  assert.equal(BookingDates.validateBirthDate('01/01/1899').ok, false);
  assert.match(BookingDates.validateBirthDate('01/01/1899').message, /1900/);
  assert.equal(BookingDates.validateBirthDate('01/01/2999').ok, false);
  assert.match(BookingDates.validateBirthDate('01/01/2999').message, /future/);
});

test('masks typed digits into dd/mm/yyyy and keeps explicit slashes', () => {
  assert.equal(BookingDates.maskInput('10052026'), '10/05/2026');
  assert.equal(BookingDates.maskInput('105'), '10/5');
  assert.equal(BookingDates.maskInput('1/5/2026'), '1/5/2026');
  assert.equal(BookingDates.maskInput('2026-05-10'), '10/05/2026');
});

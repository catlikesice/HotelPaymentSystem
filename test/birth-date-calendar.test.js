const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const BirthDateCalendar = require('../assets/birth-date-calendar');

const today = { year: 2026, month: 9, day: 26 };

test('builds a Monday-first month and disables days after today', () => {
  const january = BirthDateCalendar.buildMonth(2024, 1, today, '2024-01-01');
  assert.equal(january.cells[0].type, 'day');
  assert.equal(january.cells[0].day, 1);
  assert.equal(january.cells[0].selected, true);

  const february = BirthDateCalendar.buildMonth(2023, 2, today, '');
  const days = february.cells.filter((cell) => cell.type === 'day');
  assert.equal(days.length, 28);
  assert.equal(BirthDateCalendar.buildMonth(2024, 2, today, '').cells.filter((cell) => cell.type === 'day').length, 29);

  const september = BirthDateCalendar.buildMonth(2026, 9, today, '2026-09-10');
  const septemberDays = september.cells.filter((cell) => cell.type === 'day');
  assert.equal(september.label, 'September 2026');
  assert.equal(septemberDays[9].selected, true);
  assert.equal(septemberDays[25].disabled, false);
  assert.equal(septemberDays[26].disabled, true);
});

test('keeps birth-date navigation inside 1900 through the current month', () => {
  assert.deepEqual(
    BirthDateCalendar.shiftMonth(1900, 1, -1, today),
    { year: 1900, month: 1 }
  );
  assert.deepEqual(
    BirthDateCalendar.shiftMonth(2026, 9, 1, today),
    { year: 2026, month: 9 }
  );
  assert.deepEqual(
    BirthDateCalendar.shiftMonth(1996, 12, 1, today),
    { year: 1997, month: 1 }
  );
  assert.deepEqual(BirthDateCalendar.defaultView(today), { year: 1996, month: 9 });
  assert.deepEqual(BirthDateCalendar.WEEKDAYS, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
});

test('personal registration includes a birth date calendar', () => {
  const root = path.join(__dirname, '..');
  const personal = fs.readFileSync(path.join(root, 'personal-register.html'), 'utf8');
  const business = fs.readFileSync(path.join(root, 'business-register.html'), 'utf8');
  const client = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');

  assert.match(personal, /id="birthDate"/);
  assert.match(personal, /data-birth-calendar/);
  assert.match(personal, /data-birth-calendar-open/);
  assert.match(personal, /data-birth-calendar-dialog/);
  assert.match(personal, /autocomplete="bday"/);
  assert.match(personal, /assets\/birth-date-calendar\.js/);
  assert.match(personal, /assets\/booking-dates\.js/);
  assert.match(client, /validateBirthDate/);
  assert.match(client, /extra\.birthDate/);
  assert.match(client, /data-account-row="birthDate"|setAccountRow\('birthDate'/);
  assert.doesNotMatch(business, /id="birthDate"/);
  assert.doesNotMatch(business, /birth-date-calendar/);
});

'use strict';

const express = require('express');
const { getSearchDatabase, search, destinationLabels } = require('../lib/search-db');
const { searchExperiences, experienceLabels } = require('../lib/hotel-addons');

const router = express.Router();

function wantsTours(query) {
  return String(query && query.what || '').trim().toLowerCase() === 'tours';
}

// Homepage datalist. Accommodation labels include places with no HTML page.
// what=tours lists experiences instead of cities and hotels.
router.get('/destinations', (req, res) => {
  if (wantsTours(req.query)) {
    res.json({ labels: experienceLabels() });
    return;
  }
  res.json({ labels: destinationLabels(getSearchDatabase()) });
});

// Results page. checkIn, checkOut, adults, and children are accepted and ignored.
// what=tours searches experiences only. Any other value stays on accommodation.
router.get('/', (req, res) => {
  const query = String(req.query.q || '').trim();
  if (wantsTours(req.query)) {
    res.json({ tours: searchExperiences(query) });
    return;
  }
  res.json(search(getSearchDatabase(), query));
});

module.exports = router;

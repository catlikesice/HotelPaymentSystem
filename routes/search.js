'use strict';

const express = require('express');
const { getSearchDatabase, search, destinationLabels } = require('../lib/search-db');

const router = express.Router();

// Homepage datalist. Includes places that have no HTML page.
router.get('/destinations', (req, res) => {
  res.json({ labels: destinationLabels(getSearchDatabase()) });
});

// Results page. checkIn, checkOut, adults, and children are accepted and ignored.
router.get('/', (req, res) => {
  const query = String(req.query.q || '').trim();
  res.json(search(getSearchDatabase(), query));
});

module.exports = router;

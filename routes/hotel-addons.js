'use strict';

const express = require('express');
const { listAddons, tripOffer } = require('../lib/hotel-addons');

const router = express.Router();

function sendOffer(loader, req, res) {
  try {
    return res.json(loader(req.query || {}));
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to load add-ons.' });
  }
}

// Hotels in one city, plus every extra that can be added to the selected stay.
router.get('/trip', (req, res) => {
  sendOffer(tripOffer, req, res);
});

// Extras for one hotel: that property's rows, plus the city experiences and transport.
router.get('/', (req, res) => {
  sendOffer(listAddons, req, res);
});

module.exports = router;

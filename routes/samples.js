require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const samplesController = require('../controllers/samplesController');
const pagination = require('../middlewares/pagination');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');

/**
* Get currents defaults samples.
*/
api.get(
  '/defaults',
  (req, res, next) => {
    checkRight.rightMiddleware(['DASHBOARD_DEFAULTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  samplesController.getDefaults
);

/**
* Get currents alerts samples.
*/
api.get(
  '/alertS',
  (req, res, next) => {
    checkRight.rightMiddleware(['DASHBOARD_ALERTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  samplesController.getAlerts
);

/**
* Get selected samples regarding type (default or alert).
*/
api.put(
  '/selected',
  passport.authenticate('jwt', { session: false }),
  samplesController.getSelectedSamples
);

/**
* Get all samples regarding type (default or alert) with pagination and filter.
*/
api.get(
  '/all',
  (req, res, next) => {
    pagination.validator(req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  samplesController.getAllSamples
);

/**
* Get history regarding samples (default or alert).
*/
api.post(
  '/history',
  (req, res, next) => {
    checkRight.rightMiddleware(['ALERTS_HISTORY'], req, res, next);
  },
  (req, res, next) => {
    pagination.validator(req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  samplesController.getHistory
);

/**
* Get details for one sample.
*/
api.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  samplesController.getDetails
);
module.exports = api;

require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const passport = require('passport');
const countersController = require('../controllers/countersController');
const checkRight = require('../middlewares/rightMiddleware');

/**
 * Get all counters.
 */
api
  .route('/')
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_COUNTERS', 'VARIABLES_COUNTERS'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    countersController.getAllCounters
  )
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_COUNTERS_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    countersController.createCounter);

api
  .route('/:id')
  .put(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_COUNTERS_UPDATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    countersController.updateCounter
  )
  .delete(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_COUNTERS_DELETE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    countersController.deleteCounter
  );

api
  .route('/:id/reset')
  .put(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_COUNTERS_RESET'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    countersController.resetCounter
  );
module.exports = api;

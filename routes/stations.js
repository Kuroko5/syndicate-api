require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const stationsController = require('../controllers/stationsController');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');

/* Create a new Station. */
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['HARDWARE_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    stationsController.createStation
  )
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['HARDWARE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    stationsController.all
  );

/**
 * Modidy the position of stations
 */
api.put(
  '/position',
  (req, res, next) => {
    checkRight.rightMiddleware(['HARDWARE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  stationsController.positionStation
);

/**
 * Modify a station
 */
api.put(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['HARDWARE_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  stationsController.putStation
);

/* Delete a Station. */
api.delete(
  '/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['HARDWARE_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  stationsController.deleteStation
);

/* Ping a Station. */
api.post(
  '/ping',
  (req, res, next) => {
    checkRight.rightMiddleware(['HARDWARE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  stationsController.pingStation
);

module.exports = api;

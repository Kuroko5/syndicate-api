require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const conditionsController = require('../controllers/conditionsController');
const passport = require('passport');
/**
 * Get currents conditions.
 */
api.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  conditionsController.getCurrentsConditions
);

/**
 * Get currents conditions.
 */
api.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  conditionsController.getOneCondition
);

/**
 * Get selected conditions.
 */
api
  .route('/selected')
  .put(
    passport.authenticate('jwt', { session: false }),
    conditionsController.getSelectedConditions
  );

module.exports = api;

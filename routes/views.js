require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const passport = require('passport');
const viewController = require('../controllers/viewController');
const checkRight = require('../middlewares/rightMiddleware');

/**
 * Create a new view.
 */
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_VIEWS_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    viewController.createView);

/**
 * Get all views.
 */
api.get('/all',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_VIEWS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  viewController.getAllViews);

/**
 * Modidy the position of views
 */
api.put(
  '/position',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_VIEWS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  viewController.positionView
);

/**
 * Edit a view.
 */
api
  .route('/:id')
  .put(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_VIEWS_UPDATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    viewController.updateView);

/**
 * Delete a view.
 */
api.delete(
  '/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_VIEWS_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  viewController.deleteView
);

module.exports = api;

require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const passport = require('passport');
const userController = require('../controllers/userController');
const checkRight = require('../middlewares/rightMiddleware');

/* Create a new user. */
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_USERS_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    userController.createNewUser
  );

/* Login user. */
api
  .route('/login')
  .post(
    userController.loginUser
  );

/**
 * Get user's rights.
 */
api.get('/right',
  passport.authenticate('jwt', { session: false }),
  userController.getUserRight);

/**
 * Get all user.
 */
api.get('/all',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_USERS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  userController.getAllUsers);

/**
 * edit a user.
 */
api.put(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_USERS_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  userController.updateUser
);

/**
 * Delete a user.
 */
api.delete(
  '/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_USERS_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  userController.deleteUser
);

/**
 * Modidy the position of user's views.
 */
api.put(
  '/views/position',
  (req, res, next) => {
    checkRight.rightMiddleware(['VIEWS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  userController.updateUserviews
);

api
  .route('/views')
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['VIEWS'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    userController.getViewsByUser
  );

/**
 * Get current user's views card info.
 */
api
  .get(
    '/views/card',
    (req, res, next) => {
      checkRight.rightMiddleware(['DASHBOARD_EQUIPMENTS'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    userController.getViewsCardByUser
  );

module.exports = api;

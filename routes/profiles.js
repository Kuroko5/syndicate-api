require('dotenv-safe').config();
const express = require('express');

const api = express.Router({ mergeParams: true });
const passport = require('passport');
const profileController = require('../controllers/profileController');
const checkRight = require('../middlewares/rightMiddleware');

/**
 * Create a profile.
 */
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_PROFILES_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    profileController.createProfile,
  );

/**
 * Get all profiles.
 */
api.get('/all',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_PROFILES'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  profileController.getAllProfiles);

/**
 * Update a profile.
 */
api.put(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_PROFILES_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  profileController.updateProfile,
);

/**
 * Delete a profile.
 */
api
  .route('/:id/delete')
  .delete(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_PROFILES_DELETE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    profileController.deleteProfile,
  );

module.exports = api;

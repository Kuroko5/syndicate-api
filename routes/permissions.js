require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const passport = require('passport');
const permissionsController = require('../controllers/permissionsController');

/**
 * Get all permissions.
 */
api.route('/')
  .get(
    passport.authenticate('jwt', { session: false }),
    permissionsController.getPermissions
    )
  .post(
    passport.authenticate('jwt', { session: false }),
    permissionsController.createPermission
  )


module.exports = api;

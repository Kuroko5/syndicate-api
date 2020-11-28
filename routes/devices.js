require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const passport = require('passport');
const devicesController = require('../controllers/devicesController');
const checkRight = require('../middlewares/rightMiddleware');

/**
 * Get all devices and create one device.
 */
api
  .route('/')
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_DEVICES'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    devicesController.getAllDevices
  )
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_DEVICES_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    devicesController.createDevice
  );

/**
 * Update device
 */
api
  .route('/:id')
  .put(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_DEVICES_UPDATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    devicesController.updateDevice
  );

/**
 * Delete device
 */
api
  .route('/:id/delete')
  .delete(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_DEVICES_DELETE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    devicesController.deleteDevice
  );

/**
 * Get the list of machineId with all equipmentsId.
 */
api
  .route('/machineId')
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_VARIABLES'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    devicesController.getAllMachinesId);
module.exports = api;

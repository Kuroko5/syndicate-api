require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const reportsController = require('../controllers/reportsController');
const reportsConfigsController = require('../controllers/reportsConfigsController');
const passport = require('passport');
const pagination = require('../middlewares/pagination');
const checkRight = require('../middlewares/rightMiddleware');

/* Get all reports. */
api.get(
  '/all',
  (req, res, next) => {
    pagination.validator(req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportsController.getAllReports
);

/* Get currents reports for the dashboard. */
api.get(
  '/currents',
  passport.authenticate('jwt', { session: false }),
  reportsController.getCurrentsReports
);

/* Create a new report. */
api.put(
  '/new',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_CREATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportsController.createReport
);

/* Get all config reports */
api.get(
  '/config',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_REPORTS'], req, res, next);
    pagination.validator(req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportsConfigsController.getAll
);

/* Get one report by id. */
api.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  reportsController.getOneReport
);

/* Update one report by id. */
api.put(
  '/update/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportsController.updateReport
);

/* Delete one report by id. */
api.delete(
  '/delete/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportsController.deleteReport
);

module.exports = api;

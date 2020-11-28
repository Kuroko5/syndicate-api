require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const reportTypesController = require('../controllers/reportTypesController');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');

/* Create a new reportType. */
api.post('/',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_CREATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportTypesController.createReportType
);

/* Get all reportTypes. */
api.get('/',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportTypesController.getAllReportsTypes
);

/* Delete one reportType */
api.delete(
  '/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportTypesController.deleteOneReportType
);

/* Modify a reportType. */
api.put(
  '/:id/update',
  (req, res, next) => {
    checkRight.rightMiddleware(['REPORTS_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  reportTypesController.updateReportType
);

module.exports = api;

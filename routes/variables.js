require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const variablesController = require('../controllers/variablesController');
const pagination = require('../middlewares/pagination');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');

/**
* Get all variables regarding samples with pagination, search and category.
*/
api.get(
  '/all',
  (req, res, next) => {
    pagination.validator(req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.getVariables
);

/**
* Get currents variables regarding samples(dashboard).
*/
api.put(
  '/selected',
  passport.authenticate('jwt', { session: false }),
  variablesController.getSelectedVariables
);

/**
* Post histories variables regarding category.
*/
api.post(
  '/history',
  (req, res, next) => {
    checkRight.rightMiddleware(['VARIABLES_HISTORY'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.getCreateHistory
);

/**
* Get all categories and variables regarding each categories.
*/
api.get(
  '/categories',
  passport.authenticate('jwt', { session: false }),
  variablesController.getEachCategories
);

/**
* Get all categories of variables.
*/
api.get(
  '/categories/all',
  passport.authenticate('jwt', { session: false }),
  variablesController.getCategories
);

/**
* Get details for one variable.
*/
api
  .route('/')
  .get(
    passport.authenticate('jwt', { session: false }),
    variablesController.getDetails
  )
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['CONFIG_VARIABLES_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    variablesController.addVariable
  );

/**
* Update a variable
*/
api.put(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.editVariable
);

/**
* Edit advice of a variable
*/
api.put(
  '/:id/advice',
  (req, res, next) => {
    checkRight.rightMiddleware(['ALERTS_ADVICE_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.editAdvice
);

/**
* Get card equipment.
*/
api.get(
  '/card/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DASHBOARD_MACHINES'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.getCardMachine
);

/**
* Get all devices regarding variables.
*/
api.get(
  '/devices',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.getAllDeviceId
);
/**
* Get all variables for configuration.
*/
api.get(
  '/configuration',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.getAllVariables
);

/**
* Delete a variable
*/
api.delete(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.deleteVariable
);

/**
* Import variable csv file.
*/
api.post(
  '/upload',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES_IMPORT'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.importCSVfile
);

/**
* Export variables to csv
*/
api.get(
  '/export',
  (req, res, next) => {
    checkRight.rightMiddleware(['CONFIG_VARIABLES_EXPORT'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  variablesController.exportVariables
);
module.exports = api;

require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const documentsTypesController = require('../controllers/documentsTypesController');
const passport = require('passport');
const checkRight = require('../middlewares/rightMiddleware');

/* Create a new documentType. */
api.post('/',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_TYPES_CREATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsTypesController.createDocType
);

/* Get the list of all documentsTypes. */
api.get('/',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsTypesController.getAllDocumentTypes
);

/* Get one documentType by Id. */
api.get('/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_TYPES'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsTypesController.getOneDoc
);

/* Modify a documentType. */
api.put(
  '/:id/update',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_TYPES_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsTypesController.updateDocType
);

/* Delete one document type */
api.delete(
  '/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_TYPES_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsTypesController.deleteOneDocType
);
module.exports = api;

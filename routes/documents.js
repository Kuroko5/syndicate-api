require('dotenv-safe').config();
const express = require('express');
const api = express.Router();
const documentsController = require('../controllers/documentsController');
const documentsCategoriesController = require('../controllers/documentsCategoriesController');
const passport = require('passport');
const pagination = require('../middlewares/pagination');
const checkRight = require('../middlewares/rightMiddleware');

/* Add a new document. */
api.post(
  '/upload',
  passport.authenticate('jwt', { session: false }),
  documentsController.addDocument
);

/* Get all documents with pagination and search. */
api.get(
  '/all',
  (req, res, next) => {
    pagination.validator(req, res, next);
  },
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsController.getAllDocuments
);

/* Create a new category. */
api.post('/categories',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_CATEGORIES_CREATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsCategoriesController.createCategory
);

/* Get categories. */
api.get('/categories',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsCategoriesController.getAllCategories
);

/* Delete one document(metadata and file uploaded). */
api.delete(
  '/delete/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsController.deleteOneFile
);

/* Modify the metadata of the document. */
api.post(
  '/update/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsController.updateDocument
);

/* Get one document by id. */
api.get(
  '/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsController.getOneDocument
);

/* Get one file by id. */
api.get(
  '/file/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_READ'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsController.getOneFile
);

/* Modify a category. */
api.put(
  '/categories/:id',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_CATEGORIES_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsCategoriesController.updateCategory
);

/* Delete a category. */
api.put(
  '/categories/:id/delete',
  (req, res, next) => {
    checkRight.rightMiddleware(['DOCUMENTS_CATEGORIES_DELETE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  documentsCategoriesController.deleteCategory
);

module.exports = api;

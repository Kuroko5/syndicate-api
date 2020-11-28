require('dotenv-safe').config();
const express = require('express');
const api = express.Router({ mergeParams: true });
const passport = require('passport');
const cardsController = require('../controllers/cardsController');
const checkRight = require('../middlewares/rightMiddleware');

/**
* Create a new card.
*/
api
  .route('/')
  .post(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_CARDS_CREATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    cardsController.createCard
  )
  .get(
    (req, res, next) => {
      checkRight.rightMiddleware(['DASHBOARD', 'ADMIN_DASHBOARD'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    cardsController.getAllCards
  );

api
  .route('/:id')
  .delete(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_CARDS_DELETE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    cardsController.deleteCard
  );

/**
 * Modidy the position of cards
 */
api.put(
  '/position',
  (req, res, next) => {
    checkRight.rightMiddleware(['ADMIN_CARDS_UPDATE'], req, res, next);
  },
  passport.authenticate('jwt', { session: false }),
  cardsController.positionCards
);

/**
* Update a card.
*/
api
  .route('/:id')
  .put(
    (req, res, next) => {
      checkRight.rightMiddleware(['ADMIN_CARDS_UPDATE'], req, res, next);
    },
    passport.authenticate('jwt', { session: false }),
    cardsController.updateCard);

module.exports = api;

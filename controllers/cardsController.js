require('dotenv-safe').config();
require('../passport-strategy');
const jwtDecode = require('jwt-decode');
const cardsService = require('../services/cardsService');
const constants = require('../utils/constants');
const { ObjectId } = require('mongodb');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');

/**
 * Create a card
 * @param {*} req
 * @param {*} res
 */
const createCard = async (req, res) => {
  const card = req.body;

  // Check if the mandatory data is present.
  if (!card.label || !card.type || !card.column) {
    return res.status(400).send({ code: 400, message: 'Label, type and column are required' });
  }

  // Control type of the card.
  const validType = constants.DASHBOARDCARDS_TYPE.indexOf(card.type);

  if (validType < 0) {
    return res.status(400).send({ code: 400, message: 'Type is not a valid type' });
  }

  // Can not have several cards defauts, alerts, conditions, reports.
  if (card.type !== constants.MACHINE) {
    const getCard = await cardsService.getCardByType(card.type);

    if (getCard && getCard.type) {
      return res.status(400).send({ code: 400, message: 'One card with this type already exists.' });
    }
  }

  // Create Card.
  const createNewCard = await cardsService.createCard(card);

  if (createNewCard instanceof Error) {
    return res.status(400).send({ code: 400, message: createNewCard.message });
  }
  return res.status(200).send({ code: 200, message: 'Card created' });
};

/**
 * Get All cards
 * @param {*} req
 * @param {*} res
 */
const getAllCards = async (req, res) => {
  // Decode the token to get the operator.
  const token = req.headers.authorization;
  const decoded = jwtDecode(token);
  const username = decoded.username;

  // Get All Cards.
  const cards = await cardsService.getCards(username);

  if (cards instanceof Error) {
    return res.status(400).send({ code: 400, message: cards.message });
  }

  return res.status(200).send({ code: 200, data: cards });
};

/**
 * Delete a card
 * @param {*} req
 * @param {*} res
 */
const deleteCard = async (req, res) => {
  const { id } = req.params;

  // Delete Card.
  const deletedCard = await cardsService.delete(id);

  if (deletedCard instanceof Error) {
    return res.status(400).send({ code: 400, message: deletedCard.message });
  }
  return res.status(200).send({ code: 200, message: 'Card deleted' });
};

/**
 * Modify the position of each cards.
 * @param cards
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const positionCards = async (req, res, next) => {
  // Get array of cards ids
  const { cards } = req.body;

  // Check if all required fields are completed.
  if (!cards || !Array.isArray(cards)) {
    return res.status(404).send({ message: 'All fields are required' });
  }

  // Check if all ids cards is a array of Mongo id
  const element = cards.every(i => (ObjectId.isValid(i)));
  if (!element) {
    return res.status(400).send({ code: 400, message: ' The id of a card has a wrong format' });
  }

  // Set the position of each cards
  for (let i = 0; i < cards.length; i++) {
    const result = await cardsService.position(cards[i], i + 1);

    if (!result) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    }
  }
  return res.status(200).send({ code: 200, message: 'Position updated success' });
};

/**
 * Update a card.
 * @param {*} req
 * @param {*} res
 */
const updateCard = async (req, res) => {
  const { id } = req.params;
  const cardToUpdate = req.body;
  // Check if the card already exists.
  const getCard = await serviceUtils.isExist(id, collections.DASHBOARDCARD_COLL);

  if (getCard instanceof Error) {
    return res.status(400).send({ code: 400, message: getCard.message });
  }
  // Check if the mandatory data is present.
  if (!cardToUpdate.label || !cardToUpdate.type || !cardToUpdate.column) {
    return res.status(400).send({ code: 400, message: 'Label, type and column are required' });
  }

  // Control type of the card.
  const validType = constants.DASHBOARDCARDS_TYPE.indexOf(cardToUpdate.type);

  if (validType < 0) {
    return res.status(400).send({ code: 400, message: 'Type is not a valid type' });
  }

  // If type of the card has changed.
  if (cardToUpdate.type !== getCard.type && cardToUpdate.type !== constants.MACHINE) {
    const getCard = await cardsService.getCardByType(cardToUpdate.type);
    if (getCard && getCard.type) {
      return res.status(400).send({ code: 400, message: 'One card with this type already exists.' });
    }
  }

  // Update Card.
  const updateCard = await cardsService.updateOneCard(id, cardToUpdate);

  if (updateCard instanceof Error) {
    return res.status(400).send({ code: 400, message: updateCard.message });
  }
  return res.status(200).send({ code: 200, message: 'Card has been updated' });
};

module.exports = {
  createCard,
  deleteCard,
  getAllCards,
  positionCards,
  updateCard
};

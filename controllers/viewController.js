require('dotenv-safe').config();
require('../passport-strategy');
const viewService = require('../services/viewService');
const constants = require('../utils/constants');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');

/**
 * Get all views.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllViews = async (req, res, next) => {
  try {
    const views = await serviceUtils.getAllResults(req.query, collections.VIEW_COLL);

    if (views instanceof Error) {
      return res.status(404).send({ code: 404, message: views.message });
    }
    return res.status(200).send({ code: 200, data: views });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a view
 * @param {*} req
 * @param {*} res
 */
const updateView = async (req, res) => {
  const { id } = req.params;
  const viewToUpdate = req.body;

  // Check if the mandatory data is present.
  if (!viewToUpdate.label) {
    return res.status(400).send({ code: 400, message: 'Label is required' });
  }

  // Checf if the view already exist.
  const getView = await serviceUtils.isExist(id, collections.VIEW_COLL);

  if (getView instanceof Error) {
    return res.status(400).send({ code: 400, message: getView.message });
  }

  if (!viewToUpdate.cards) {
    return res.status(400).send({ code: 400, message: ' A view must have at least one card' });
  }

  // Control type of card, add default position for each cards and each variables.
  const cards = viewToUpdate.cards;

  for (let i = 0; i < cards.length; i += 1) {
  // Check alls cards.

    if (!cards[i].type || !cards[i].label || !cards[i].variables.length) {
      return res.status(400).send({ code: 400, message: 'Each card must have a type, a label and at least one variable' });
    }

    // Control type of the card.
    const validType = constants.CARDS_TYPE.indexOf(cards[i].type);

    if (validType < 0) {
      return res.status(400).send({ code: 400, message: 'Type is not a valid type' });
    }
  }
  // Update view.
  const result = await viewService.updateView(id, viewToUpdate);

  if (!result) {
    return res.status(400).send({ code: 400, message: 'Can not update this view' });
  }
  return res.status(200).send({ code: 200, message: 'View updated' });
};

/**
 * Create a view
 * @param {*} req
 * @param {*} res
 */
const createView = async (req, res) => {
  const view = req.body;

  // Check if the mandatory data is present.

  if (!view.label) {
    return res.status(400).send({ code: 400, message: 'Label is required' });
  }

  // Checf if the view already exist.
  const isExist = await serviceUtils.isExist(view.label, collections.VIEW_COLL);

  if (isExist && isExist.label) {
    return res.status(400).send({ code: 400, message: 'A view with the same label has already exist' });
  }

  if (!view.cards) {
    return res.status(400).send({ code: 400, message: ' A view must have at least one card' });
  }

  // Control type of card, add default position for each cards and each variables.
  const cards = view.cards;

  for (let i = 0; i < cards.length; i += 1) {
    // Check alls cards.

    if (!cards[i].type || !cards[i].label || !cards[i].variables.length) {
      return res.status(400).send({ code: 400, message: 'Each card must have a type, a label and at least one variable' });
    }

    // Control type of the card.
    const validType = constants.CARDS_TYPE.indexOf(cards[i].type);

    if (validType < 0) {
      return res.status(400).send({ code: 400, message: 'Type is not a valid type' });
    }
    // Assign position for each card.
    const position = i + 1;
    cards[i].position = Number(position);

    // Assign position for each variables.
    const { variables } = cards[i];
    let defaultPosition = 1;

    variables.forEach(element => {
      element.position = Number(defaultPosition);
      defaultPosition += 1;
    });
  }

  // Create a new view.
  const addView = await viewService.createView(view);

  if (!addView) {
    return res.status(400).send({ code: 400, message: 'Can not create this view' });
  }
  return res.status(200).send({ code: 200, message: 'View created' });
};

/**
 * Delete a view
 * @param id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteView = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong format id' });
    }

    const result = await viewService.hardDeleteView(id);

    if (!result) {
      return res.status(400).send({ code: 400, message: 'Can not delete this view' });
    }
    return res.status(200).send({ code: 200, message: 'View deleted' });
  } catch (e) {
    next(e);
  }
};

/**
 * Modify the position of the views.
 * @param views
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const positionView = async (req, res, next) => {
  try {
    // Get array of views id
    const { views } = req.body;

    // Check if all required fields are completed.
    if (!views || !Array.isArray(views)) {
      return res.status(404).send({ message: 'All fields are required' });
    }
    // Check if views is a array of Mongo id
    const element = views.every(i => (typeof i === 'string') && (i.length === 24));
    if (!element) {
      return res.status(404).send('The id of a view has a wrong format');
    }

    // Set the position of each views
    for (let i = 0; i < views.length; i++) {
      const result = await viewService.position(views[i], i + 1);

      if (!result) {
        return res.status(400).send({ code: 400, message: 'A error occured' });
      }
    }

    return res.status(200).send({ code: 200, message: 'Position updated success' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllViews,
  updateView,
  createView,
  deleteView,
  positionView
};

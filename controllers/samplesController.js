const samplesService = require('../services/samplesService');
const variablesService = require('../services/variablesService');
const constants = require('../utils/constants');
/**
 * Get the first 5 currents defaults..
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getDefaults = async (req, res, next) => {
  try {
    const type = constants.DEFAULT;
    const currentsSamples = await samplesService.getCurrentsSamples(type);

    return res.status(200).send({ code: 200, data: currentsSamples });
  } catch (e) {
    next(e);
  }
};

/**
 * Get the first 5 currents alerts.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAlerts = async (req, res, next) => {
  try {
    const type = constants.ALERT;
    const currentsSamples = await samplesService.getCurrentsSamples(type);

    return res.status(200).send({ code: 200, data: currentsSamples });
  } catch (e) {
    next(e);
  }
};

/**
 * Get the selected defaults or alerts.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getSelectedSamples = async (req, res, next) => {
  try {
    const type = req.query.type;
    const { variables } = req.body;

    // Check if all fields are completed.
    if (!variables || !Array.isArray(variables)) {
      return res.status(404).send('All fields are required');
    } else {
      const element = variables.every(i => (typeof i === 'string'));
      if (!element) {
        return res.status(404).send('Wrong format');
      }
    }
    const currentsSamples = await samplesService.getSelectedSamples(type, variables);

    return res.status(200).send({ code: 200, data: currentsSamples });
  } catch (e) {
    next(e);
  }
};

/**
 * Get details for a sample required.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getDetails = async (req, res, next) => {
  try {
    const vId = req.query;
    const sampleProjection = { _id: 0, vId: 1, d: 1, c: 1 };
    const sample = await samplesService.getSample(vId, sampleProjection);
    // Retrieve the details of a variable
    const idVariable = sample.vId;
    const varProjection = { _id: 0, descr: 1, advice: 1, location: 1 };
    const variable = await variablesService.getVariable(idVariable, varProjection);

    // Create an object with all details
    const result = { ...sample, ...variable };
    const description = { code: 200, data: result };
    return res.status(200).send({ description });
  } catch (e) {
    next(e);
  }
};

/**
 * Generic function to recover all samples regarding type (default or alert), sorting by date.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllSamples = async (req, res, next) => {
  try {
    const { type, category, page, limit, sort, column } = req.query;
    const allSamples = await samplesService.getAllCurrentsSamples({
      type,
      category,
      page,
      limit,
      sort,
      column
    });

    return res.status(200).send({ code: 200, data: allSamples });
  } catch (e) {
    next(e);
  }
};

/**
 * Check the data and create history for samples.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getHistory = async (req, res, next) => {
  try {
    const { category, page, limit, column, sort, search } = req.query;
    const dates = req.body.dates;
    const samplesHistory = await samplesService.getSamplesHistory({
      category,
      page,
      limit,
      column,
      sort,
      search,
      dates
    });
    return res.status(200).send({ code: 200, data: samplesHistory });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getDetails,
  getDefaults,
  getAlerts,
  getAllSamples,
  getHistory,
  getSelectedSamples
};

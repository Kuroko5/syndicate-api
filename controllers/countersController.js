require('dotenv-safe').config();
require('../passport-strategy');
const countersService = require('../services/countersService');
const servicesUtils = require('../utils/utils');
const collections = require('../utils/collections');
const variablesService = require('../services/variablesService');
const constants = require('../utils/constants');
const moment = require('moment');

/**
 * Get all counters
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllCounters = async (req, res, next) => {
  try {
    // Get all counters
    const counters = await servicesUtils.getAllResults(req.query, collections.COUNTER_COLL);

    if (counters instanceof Error) {
      return res.status(400).send({ code: 400, message: counters.message });
    }

    const allObjectsCounters = await countersService.getCounters(counters);

    if (allObjectsCounters instanceof Error) {
      return res.status(400).send({ code: 400, message: counters.message });
    }
    return res.status(200).send({ code: 200, data: allObjectsCounters });
  } catch (e) {
    next(e);
  }
};

/**
 * Update counter
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const updateCounter = async (req, res, next) => {
  try {
    const counter = req.body;
    const { id } = req.params;

    const getCounter = await servicesUtils.isExist(id, collections.COUNTER_COLL);

    if (getCounter instanceof Error) {
      return res.status(400).send({ code: 400, message: getCounter.message });
    }

    // Check if the variable exists
    const variable = await variablesService.isVariableExists(counter.vId);

    if (variable instanceof Error) {
      return res.status(404).send({ code: 404, message: variable.message });
    }

    // Set the type according to the format of the variable
    if (constants.VARIABLES_FORMAT.includes(variable.format)) {
      if (variable.format === 'bool') {
        counter.type = constants.COUNTER_TYPE_CUSTOM;
      } else {
        counter.type = constants.COUNTER_TYPE_VARIABLE;
      }
    }

    counter.variable = {
      vId: variable.vId,
      format: variable.format
    };

    delete counter.vId;

    const result = await countersService.update(id, counter);

    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }
    return res.status(200).send({ code: 200, message: 'Counter updated.' });
  } catch (e) {
    next(e);
  }
};

/**
 * Reset counter
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const resetCounter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const getCounter = await servicesUtils.isExist(id, collections.COUNTER_COLL);

    if (getCounter instanceof Error) {
      return res.status(400).send({ code: 400, message: getCounter.message });
    }

    const result = await countersService.reset(id);

    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }
    return res.status(200).send({ code: 200, message: 'Counter reset' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete counter
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteCounter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const getCounter = await servicesUtils.isExist(id, collections.COUNTER_COLL);

    if (getCounter instanceof Error) {
      return res.status(400).send({ code: 400, message: getCounter.message });
    }

    const result = await countersService.delete(id);

    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }
    return res.status(200).send({ code: 200, message: 'Counter deleted' });
  } catch (e) {
    next(e);
  }
};

/**
 * Create a new counter
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createCounter = async (req, res, next) => {
  try {
    const counter = req.body;

    // Check if the variable exists
    const variable = await variablesService.isVariableExists(counter.vId);

    if (variable instanceof Error) {
      return res.status(404).send({ code: 404, message: variable.message });
    }

    // Set the type according to the format of the variable
    if (constants.VARIABLES_FORMAT.includes(variable.format)) {
      if (variable.format === 'bool') {
        counter.type = constants.COUNTER_TYPE_CUSTOM;
      } else {
        counter.type = constants.COUNTER_TYPE_VARIABLE;
      }
    }

    counter.variable = {
      vId: variable.vId,
      format: variable.format
    };

    delete counter.vId;

    // Init date of counter
    counter.date = moment(new Date()).format();

    // Check input data
    const check = await countersService.isCounter(counter);

    if (!check.valid) {
      return res.status(400).send({ code: 400, message: check.error });
    }

    counter.date = new Date(counter.date);

    // Create a new counter
    const result = await countersService.insert(counter);

    if (result instanceof Error) {
      return res.status(400).send({ code: 400, message: result.message });
    }

    return res.status(200).send({ code: 200, message: 'Counter created' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllCounters,
  createCounter,
  updateCounter,
  deleteCounter,
  resetCounter
};

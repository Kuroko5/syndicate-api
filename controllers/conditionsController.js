const conditionsService = require('../services/conditionsService');

/**
 * Get all conditions with or without limit and sorting.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getCurrentsConditions = async (req, res, next) => {
  const { sort, column, limit } = req.query;
  try {
    const [, body] = await conditionsService.checkConditions(limit);
    const data = JSON.parse(body);
    if (sort) {
      // Sort data regarding result or conditions.
      if (sort === '1') {
        data.sort((a, b) => (a[column] > b[column] ? 1 : -1));
      } else {
        data.sort((a, b) => (a[column] > b[column] ? -1 : 1));
      }
    }
    // Fix limit to return numbers of conditions.
    if (limit === '10') {
      const result = data.slice(0, Number(limit));
      return res.status(200).send({ data: result });
    }
    const result = data;
    return res.status(200).send({ data: result });
  } catch (e) {
    next(e);
  }
};

/**
 * Get detail for one condition.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getOneCondition = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [, body] = await conditionsService.getConditionById(id);
    const data = JSON.parse(body);
    return res.status(200).send({ data });
  } catch (e) {
    next(e);
  }
};

/**
 * Get detail for selected condition.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getSelectedConditions = async (req, res, next) => {
  const { conditions } = req.body;
  try {
    const selectedConditions = await conditionsService.getSelectedConditions(conditions);

    if (selectedConditions instanceof Error) {
      return res.status(401).send({ code: 401, message: selectedConditions.message });
    }

    return res.status(200).send({ code: 200, data: selectedConditions });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCurrentsConditions,
  getOneCondition,
  getSelectedConditions
};

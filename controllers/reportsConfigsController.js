const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');

/**
 * Get all config reports
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAll = async (req, res, next) => {
  try {
    const result = await serviceUtils.getAllResults(req.query, collections.REPORTCONFIG_COLL);

    if (result instanceof Error) {
      return res.status(404).send({ code: 404, message: result.message });
    }
    return res.status(200).send({ code: 200, data: result });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAll
};

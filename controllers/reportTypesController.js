const reportTypesService = require('../services/reportTypesService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');

/**
 * Add a new reportType.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createReportType = async (req, res, next) => {
  try {
    const type = req.body;

    // Label is required.
    if (!type.label) {
      return res.status(404).send({ code: 404, message: 'The label is required' });
    }

    // Add language.
    const reportType = {
      ...type,
      language: 'fr-fr'
    };

    const result = await reportTypesService.create(reportType);

    if (!result) {
      return res.status(406).send({ code: 406, message: 'Can not create this reportType' });
    }
    return res.status(200).send({ code: 200, message: 'New report type added' });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all reportTypes.
 * @param {*} req
 * @param {*} res
 * @param {*} res
 */
const getAllReportsTypes = async (req, res, next) => {
  try {
    const allReportTypes = await serviceUtils.getAllResults(req.query, collections.REPORTTYPE_COLL);

    if (allReportTypes instanceof Error) {
      return res.status(404).send({ code: 404, message: allReportTypes.message });
    }
    return res.status(200).send({ code: 200, data: allReportTypes.result });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a reportType.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const updateReportType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong format id' });
    }

    // Before update, check if reportType already exist.
    const isExist = await serviceUtils.isExist(id, collections.REPORTTYPE_COLL);

    if (isExist instanceof Error) {
      return res.status(404).send({ code: 404, message: isExist.message });
    }

    // Check if label is completed.
    if (!label) {
      return res.status(404).send({ message: 'The label is required' });
    }

    const reportType = await reportTypesService.updateOneReportType(id, label);

    if (reportType instanceof Error) {
      return res.status(404).send({ code: 404, message: reportType.message });
    }

    return res.status(200).send({ message: 'ReportType updated with success' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete one reportType.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const deleteOneReportType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: 'Wrong format id' });
    }

    // Before delete, check if reportType already exist.
    const isExist = await serviceUtils.isExist(id, collections.REPORTTYPE_COLL);

    if (isExist instanceof Error) {
      return res.status(404).send({ code: 404, message: isExist.message });
    }
    // Delete reportType
    const result = await reportTypesService.deleteReportType(id);

    if (!result) {
      return res.status(400).send({ code: 400, message: 'Can not delete this reportType' });
    }
    return res.status(200).send({ code: 200, message: 'ReportType deleted with success' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createReportType,
  getAllReportsTypes,
  updateReportType,
  deleteOneReportType
};

const reportsService = require('../services/reportsService');
const serviceUtils = require('../utils/utils');
const collections = require('../utils/collections');

/**
 * Get all reports, search with category or not.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllReports = async (req, res, next) => {
  try {
    const reportArray = await serviceUtils.getAllResults(req.query, collections.REPORT_COLL);

    if (reportArray instanceof Error) {
      return res.status(404).send({ code: 404, message: reportArray.message });
    }
    return res.status(200).send({ code: 200, data: reportArray });
  } catch (e) {
    next(e);
  }
};

/**
 * Get currents reports(dashboard).
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getCurrentsReports = async (req, res, next) => {
  const limit = req.query.limit;

  const reportArray = await reportsService.currentsReports(limit);
  if (!reportArray) {
    return res.status(400).send({ code: 400, message: 'A error occured' });
  }
  return res.status(200).send({ code: 200, data: reportArray });
};

/**
 * Create a new report.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createReport = async (req, res, next) => {
  try {
  // Build objet with informations from body
    const { name, operator, description, reportTypeId } = req.body;

    if (!name || !operator || !description || !reportTypeId) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    // Control if reportType exists with this id.
    const reportType = await serviceUtils.isExist(reportTypeId, collections.REPORTTYPE_COLL);

    if (reportType instanceof Error) {
      return res.status(404).send({ code: 404, message: reportType.message });
    }

    const newReport = {
      name: name.toUpperCase(),
      operator,
      reportType,
      description
    };

    const result = await reportsService.addReport(newReport);

    if (!result) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    };

    return res.status(201).send({ code: 201, message: 'New report created' });
  } catch (e) {
    next(e);
  }
};

/**
 * Get one report.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getOneReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }

    const getReport = await reportsService.getReport(id);
    if (!getReport) {
      return res.status(404).send({ code: 404, message: 'Not Found' });
    }

    return res.status(200).send({ code: 200, data: getReport });
  } catch (e) {
    next(e);
  }
};

/**
 * Update one report.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const updateReport = async (req, res, next) => {
  // Build new report with new data.

  try {
    const { id } = req.params;
    const { name, reportTypeId, operator, description } = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong format id' });
    }

    // Check if all fields are completed.
    if (!name || !reportTypeId || !operator || !description) {
      return res.status(404).send('All fields are required');
    }

    // Control if one report exists with this id.
    const oldReport = await serviceUtils.isExist(id, collections.REPORT_COLL);

    if (oldReport instanceof Error) {
      return res.status(404).send({ code: 404, message: oldReport.message });
    }

    // Control if reportTypeId exist.
    const getReportType = await serviceUtils.isExist(reportTypeId, collections.REPORTTYPE_COLL);

    if (getReportType instanceof Error) {
      return res.status(404).send({ code: 404, message: getReportType.message });
    }

    const report = {
      name: name.toUpperCase(),
      reportType: getReportType,
      operator,
      description
    };

    // Update Report.
    const reportUpdated = await reportsService.modifyReport(id, report);

    if (!reportUpdated) {
      return res.status(406).send({ code: 406, message: 'Can not updated this report' });
    }
    return res.status(200).send({ code: 200, message: 'New report updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete one report.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: ' Wrong id' });
    }

    // Control if one report exists with this id.
    const report = await serviceUtils.isExist(id, collections.REPORT_COLL);

    if (report instanceof Error) {
      return res.status(404).send({ code: 404, message: report.message });
    }

    // Delete Report.
    const reportToDelete = await reportsService.hardDeleteReport(id);

    if (!reportToDelete) {
      return res.status(406).send({ code: 406, message: 'Can not delete this report' });
    }
    return res.status(200).send({ code: 200, message: 'Ok report deleted' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllReports,
  getCurrentsReports,
  createReport,
  getOneReport,
  updateReport,
  deleteReport
};

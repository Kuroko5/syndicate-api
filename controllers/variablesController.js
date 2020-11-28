const variablesService = require('../services/variablesService');
const samplesService = require('../services/samplesService');
const moment = require('moment');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const constants = require('../utils/constants');
const devicesService = require('../services/devicesService');
const { uploadFile } = require('../middlewares/upload');
const path = require('path');
const csv2json = require('csvtojson');
const fs = require('fs-extra');
/**
 * Get all  variables.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getVariables = async (req, res, next) => {
  try {
    const { page, limit, sort, column, search, category } = req.query;
    const currentsVariables = await variablesService.getLatestVarMachineSamples({
      page,
      limit,
      sort,
      column,
      search,
      category
    });

    // loading latest sample for each variable.
    const getSamples = currentsVariables.variables.map(async v => {
      const sample = await samplesService.getLatestVarSample(v._id);
      return sample;
    });
    let result = await Promise.all(getSamples);
    result = [].concat(...result); // flatten array

    // Calculate number of results.
    const count = currentsVariables.countItems;

    // Return currents samples.
    return res.status(200).send({ code: 200, data: { count, result } });
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
    // Get details as vId, date, category from the variable.
    const sampleProjection = { _id: 0, vId: 1, val: 1, d: 1, unit: 1, c: 1 };
    const getOneVariable = await samplesService.getSample(vId, sampleProjection);

    // Retrieve the details of a variable
    const idVariable = getOneVariable.vId;
    const varProjection = { _id: 0, descr: 1, advice: 1, location: 1 };
    const detailVariable = await variablesService.getVariable(idVariable, varProjection);
    // Create an object with all details
    const result = { ...getOneVariable, ...detailVariable };
    const description = { code: 200, data: result };
    return res.status(200).send({ description });
  } catch (e) {
    next(e);
  }
};

/**
 * Get selected variables.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getSelectedVariables = async (req, res, next) => {
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
  try {
    const currentsVariables = await variablesService.getSelectedVariable(variables);

    // loading latest sample for each variable
    const getSamples = currentsVariables.map(async v => {
      const sample = await samplesService.getLatestVarSample(v._id);
      return sample;
    });
    let result = await Promise.all(getSamples);
    result = [].concat(...result); // flatten array

    // Return selected samples.
    return res.status(200).send({ code: 200, data: result });
  } catch (e) {
    next(e);
  }
};

/**
 * Get histories variables regarding category.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getEachCategories = async (req, res, next) => {
  const { category, search, format, type } = req.query;

  try {
    const result = [];

    if (category === 'all') {
      const listCategories = await variablesService.getListCategories();

      // For each categories, search all variables having this category.
      for (let i = 0; i < listCategories.length; i += 1) {
        const currentCatVariables = await variablesService.filterVariables(
          listCategories[i],
          search,
          format,
          type
        );
        if (currentCatVariables.variables.length > 0) {
          result.push(currentCatVariables);
        }
      }
    } else {
    // Just filter for selected category.
      const selectedCatVariables = await variablesService.filterVariables(category, search, format, type);
      if (selectedCatVariables.variables.length > 0) {
        result.push(selectedCatVariables);
      }
    }
    const getChoiceVariables = { code: 200, result };

    return res.status(getChoiceVariables.code).send({ getChoiceVariables });
  } catch (e) {
    next(e);
  }
};

/**
 * Get histories variables regarding category.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const getCreateHistory = async (req, res, next) => {
  const listVariables = req.body.array;
  const dates = req.body.dates;
  try {
    const startDate = moment(dates.min).isValid()
      ? moment.utc(dates.min).toDate()
      : null;
    const endDate = moment(dates.max).isValid()
      ? moment.utc(dates.max).toDate()
      : moment.utc().toDate();
    if (!startDate) {
      throw new Error('bad parameters');
    }

    const jobs = listVariables.map(async vId => {
      const exists = await variablesService.isVariableExists(vId);
      if (exists instanceof Error) {
        return res.status(404).send({ code: 404, message: exists.message });
      }
      return samplesService.getSampleStream(vId, startDate, endDate);
    });
    const data = await Promise.all(jobs);
    const getRequiredVariables = { code: 200, data };
    return res.status(getRequiredVariables.code).send({ getRequiredVariables });
  } catch (e) {
    next(e);
  }
};

/**
 * Edit a advice of a variable.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const editAdvice = async (req, res, next) => {
  try {
    const vId = req.params.id;
    const { advice } = req.body;
    if (advice === null || advice === undefined) {
      return res.status(404).send({ message: 'All fields are required' });
    }
    const variable = await variablesService.modifyAdvice(vId, advice);
    if (!variable) {
      return res.status(404).send({ message: 'Not Found' });
    }
    return res.status(200).send({ message: 'Advice updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Get card equipment.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getCardMachine = async (req, res, next) => {
  const { id } = req.params;

  // Checf if the card equipment exist.
  const cardMachine = await serviceUtils.isExist(id, collections.DASHBOARDCARD_COLL);

  if (cardMachine instanceof Error) {
    return res.status(400).send({ code: 400, message: cardMachine.message });
  }

  // Get all values for each variables and return cardMachine.
  const getAllValues = await variablesService.getVariablesValues(cardMachine);

  if (getAllValues instanceof Error) {
    return res.status(404).send({ message: 'Can not return values of this card' });
  }

  return res.status(200).send({ code: 200, variables: getAllValues });
};

/**
 * Get all deviceId regarding variables.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllDeviceId = async (req, res, next) => {
  // Get all devices.
  const listDeviceIds = await variablesService.findDevices();

  if (listDeviceIds instanceof Error) {
    return res.status(400).send({ code: 400, message: listDeviceIds.message });
  }

  return res.status(200).send({ code: 200, data: listDeviceIds });
};

/**
 * Get all variables(configuration).
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllVariables = async (req, res, next) => {
  try {
    const variables = await serviceUtils.getAllResults(req.query, collections.VARIABLE_COLL);

    if (variables instanceof Error) {
      return res.status(404).send({ code: 404, message: variables.message });
    }

    return res.status(200).send({ code: 200, data: variables });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all categories of variables..
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

const getCategories = async (req, res, next) => {
  try {
    const categories = await variablesService.getListCategories();

    if (categories instanceof Error) {
      return res.status(404).send({ code: 404, message: categories.message });
    }

    return res.status(200).send({ code: 200, data: categories });
  } catch (e) {
    next(e);
  }
};

/**
 * Add new variable.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const addVariable = async (req, res, next) => {
  try {
    const variable = req.body;

    // Check if the mandatory data is present.
    if (!variable.vId || !variable.type || !variable.memorySlot || !variable.unit || !variable.deviceId ||
       !variable.category || !variable.descr || !variable.format || variable.isVisible === undefined || variable.enable === undefined) {
      return res.status(400).send({ code: 400, message: 'Only unit, advice and location field are not required' });
    }

    // Checf if the variable already exist.
    const getVariable = await variablesService.isVariableExists(variable.vId);

    if (getVariable && getVariable.vId) {
      return res.status(400).send({ code: 400, message: 'A variable with the same identifier already exists' });
    }

    // Check type of the variable.
    const checkType = constants.VARIABLES_TYPE.indexOf(variable.type);
    if (checkType < 0) {
      return res.status(400).send({ code: 400, message: 'The type of the variable is not appropriate' });
    }

    // Check format of the variable.
    const checkFormat = constants.VARIABLES_FORMAT.indexOf(variable.format);
    if (checkFormat < 0) {
      return res.status(400).send({ code: 400, message: 'The format of the variable is not appropriate' });
    }

    // Check if the device already exist.
    const isDeviceExist = await devicesService.getDevice(variable.deviceId);

    if (isDeviceExist instanceof Error) {
      return res.status(400).send({ code: 404, message: isDeviceExist.message });
    }

    // Create a new variable.
    const addVariable = await variablesService.createVariable(variable);

    if (addVariable instanceof Error) {
      return res.status(400).send({ code: 400, message: addVariable.message });
    }

    // Send data if device and variable are enable.
    if (isDeviceExist.enable && variable.enable) {
      const response = await devicesService.sendDataToDevice(isDeviceExist._id);

      if (response.body.code !== 200) {
        return res.status(response.body.code).send({ code: response.body.code, message: response.body.message });
      }
    }

    return res.status(200).send({ code: 200, message: 'Variable has been created' });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a variable.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const editVariable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const varToUpdate = req.body;

    // Check if the mandatory data is present.
    if (!varToUpdate.vId || !varToUpdate.type || !varToUpdate.memorySlot || !varToUpdate.unit || !varToUpdate.deviceId ||
       !varToUpdate.category || !varToUpdate.descr || !varToUpdate.format || varToUpdate.isVisible === undefined || varToUpdate.enable === undefined) {
      return res.status(400).send({ code: 400, message: 'Only unit, advice and location fields are not required.' });
    }

    // Check if the variable already exist.
    const isExist = await variablesService.isVariableExists(id);

    if (isExist instanceof Error) {
      return res.status(400).send({ code: 400, message: isExist.message });
    }

    // Identifier of the variable can not be updated.
    if (String(varToUpdate.vId) !== String(isExist.vId)) {
      return res.status(400).send({ code: 400, message: 'Identifier can not be updated.' });
    }

    // Check type of the variable.
    const checkType = constants.VARIABLES_TYPE.indexOf(varToUpdate.type);
    if (checkType < 0) {
      return res.status(400).send({ code: 400, message: 'The type of the variable is not appropriate.' });
    }

    // Check format of the variable.
    const checkFormat = constants.VARIABLES_FORMAT.indexOf(varToUpdate.format);
    if (checkFormat < 0) {
      return res.status(400).send({ code: 400, message: 'The format of the variable is not appropriate.' });
    }

    // Check if the device already exist.
    const isDeviceExist = await devicesService.getDevice(varToUpdate.deviceId);

    if (isDeviceExist instanceof Error) {
      return res.status(400).send({ code: 404, message: isDeviceExist.message });
    }

    // Update variable.
    const addVariable = await variablesService.updateVariable(id, varToUpdate);

    if (addVariable instanceof Error) {
      return res.status(400).send({ code: 400, message: addVariable.message });
    }

    // Send data if device is enable.
    if (isDeviceExist.enable) {
      const response = await devicesService.sendDataToDevice(isDeviceExist._id);

      if (response.body.code !== 200) {
        return res.status(response.body.code).send({ code: response.body.code, message: response.body.message });
      }
    }

    // Changed data in old samples if type , category, unit or deviceId has been changed.
    if (isExist.type !== varToUpdate.type || isExist.category !== varToUpdate.category || isExist.deviceId !== varToUpdate.deviceId || isExist.unit !== varToUpdate.unit) {
      const updateSamples = await variablesService.updateOldSamples(isExist, varToUpdate);
      if (updateSamples instanceof Error) {
        return res.status(400).send({ code: 400, message: updateSamples.message });
      }
    }
    return res.status(200).send({ code: 200, message: 'Variable has been updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a variable if it has no sample (configuration).
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteVariable = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get variable
    const variable = await variablesService.getVariable(id);

    if (!variable) {
      return res.status(404).send({ code: 404, message: 'This variable does not exist' });
    }

    // Check if a sample exists with the variable id
    const sample = await samplesService.isExist(id);

    if (sample) {
      return res.status(409).send({ code: 409, message: 'This variable has samples' });
    }

    const result = await variablesService.delete(id);

    if (result instanceof Error) {
      return res.status(404).send({ code: 404, message: result.message });
    }

    // If the variable was enabled, check if device is
    if (variable.enable) {
      const device = await devicesService.getDevice(variable.deviceId);

      if (device instanceof Error) {
        return res.status(404).send({ code: 404, message: device.message });
      }

      // If device is enable, send data to device
      if (device.enable) {
        const response = await devicesService.sendDataToDevice(device._id);
        if (response.body.code !== 200) {
          return res.status(response.body.code).send({ code: response.body.code, message: response.body.message });
        }
      }
    }

    return res.status(200).send({ code: 200, message: 'Variable deleted' });
  } catch (e) {
    next(e);
  }
};

/**
 * Import variable file.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

const importCSVfile = async (req, res, next) => {
  try {
    console.log('req ', req)
    // Call service to upload file.
    const upload = await uploadFile(req);
    console.log('upload', upload)
    if (upload.code !== 200) {
      // if upload failed.
      return res.status(400).send(upload);
    }

    const { file } = req;
    console.log('file', file)
    if (!file) {
      return res.status(400).send({ code: 400, message: 'Missing file' });
    }
    if (file.mimetype !== 'text/csv') {
      return res.status(400).send({ code: 400, message: 'CSV file is required' });
    }

    // Cast data.
    const variables = await csv2json({ delimiter: [',', ';', '\t'] }).fromFile(path.resolve(req.file.path));

    // Check all properties for each variables regarding schema.
    const validFields = await variablesService.isVariable(variables);

    if (validFields.length > 0) {
      return res.status(400).send({ code: 400, data: validFields });
    }

    // Save all variables.
    const saveVariables = await variablesService.insertVariables(variables);

    if (saveVariables instanceof Error) {
      return res.status(400).send({ code: 400, message: saveVariables.message });
    }
    // Delete file.
    fs.unlink(path.join(file.path));

    return res.status(200).send({ code: 200, data: saveVariables });
  } catch (e) {
    console.log(e)
    next(e);
  }
};

/**
 * Export variables to csv
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const exportVariables = async (req, res, next) => {
  try {
    const variables = await serviceUtils.getAllResults({}, collections.VARIABLE_COLL);

    if (variables instanceof Error) {
      return res.status(404).send({ code: 404, message: variables.message });
    }

    const fields = ['vId', 'deviceId', 'memorySlot', 'unit', 'descr', 'advice', 'format', 'type', 'category', 'location', 'enable', 'isVisible'];

    const csv = await serviceUtils.json2csv(variables.result, fields);
    const filename = 'variables.csv';

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.status(200).send(csv);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getVariables,
  getDetails,
  getEachCategories,
  getCreateHistory,
  getSelectedVariables,
  editAdvice,
  getAllVariables,
  getCardMachine,
  getAllDeviceId,
  addVariable,
  getCategories,
  editVariable,
  deleteVariable,
  exportVariables,
  importCSVfile
};

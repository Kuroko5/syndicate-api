const { Mongo } = require('../app/class/mongo');
const schema = require('../src/collections/schemas/variable.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const samplesServices = require('./samplesService');
const devicesService = require('../services/devicesService');

class Variable {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.variable.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator.and db connection
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.VARIABLE_COLL) {
      throw new Error('Missing env variable');
    }
    Variable.COLLECTION = collections.VARIABLE_COLL;
    Variable.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Variable.validator.init({ schemas: [schema] });

    Variable.db = instance.getDb();
  }

  /**
 * Generic function to recover all variables machines with pagination and sorting by date.
 * @param {*} req
 * @param {*} res
 */
  static async getLatestVarMachineSamples ({
    page,
    limit,
    sort,
    column,
    search,
    category
  }) {
  // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Default values for page & limit
    const currentPage = page || 1;
    const currentLimit = parseInt(limit) || 25;
    const sortValue = parseInt(sort) || 1;

    // Search on the name of the variable.
    const searchQuery = search || '';

    // Preparing query
    const query = { type: 'machine' };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (searchQuery && searchQuery !== '') {
      query.vId = { $regex: searchQuery, $options: 'i' };
    }

    // Preparing sort
    const sortQ = {};
    sortQ[column] = sortValue;

    // Find all variables regarding query.
    const variablesQuery = db
      .collection(Variable.COLLECTION)
      .find(query)
      .sort(sortQ)
      .skip((currentPage - 1) * currentLimit)
      .limit(currentLimit)
      .toArray();
    const countQuery = db.collection(Variable.COLLECTION).find(query).count();
    // getting variables and total count.
    const [variables, countItems] = await Promise.all([
      variablesQuery,
      countQuery
    ]);

    return { variables, countItems };
  };

  /**
  * Get variable from id
  * @param vId
  */
  static async getVariable (vId, projection) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();
    const variable = await db.collection(Variable.COLLECTION).findOne(
      { vId: vId },
      {
        projection: projection
      }
    );
    // If a variable is found.
    if (variable) {
      return variable;
    }
    return null;
  }

  /**
 * Generic function to recover currents variables machines.
 * @param {*} limit number ax of results
 */
  static async getVariables (limit) {
    const currentLimit = parseInt(limit) || 5;
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Get all samples regarding the type sorted by dates.
    const variablesQuery = db
      .collection(Variable.COLLECTION)
      .find({
        type: 'machine'
      })
      .sort({ _id: 1 })
      .limit(currentLimit)
      .toArray();

    const countQuery = db
      .collection(Variable.COLLECTION)
      .find({
        type: 'machine'
      })
      .count();

    const [variables] = await Promise.all([variablesQuery, countQuery]);
    return variables;
  };

  /**
  * Generic function to recover selected variables machines.
  * @param {Array} variables array of variables
  */
  static async getSelectedVariable (variables) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Get all samples regarding the type sorted by dates.
    const variablesQuery = db
      .collection(Variable.COLLECTION)
      .find({
        type: 'machine',
        vId: { $in: variables }
      })
      .sort({ _id: 1 })
      .toArray();

    const countQuery = db
      .collection(Variable.COLLECTION)
      .find({
        type: 'machine',
        vId: { $in: variables }
      })
      .count();

    const [result] = await Promise.all([variablesQuery, countQuery]);
    return result;
  }

  /**
 * Generic function to get variables regarding query (search, category).
 */
  static async filterVariables (category, search, format, type) {
  // Search on the name of the variable.
    const searchQuery = search || '';

    // Preparing query
    const query = {};

    // if type is undefined, set default value with machine.
    if (type && type !== 'undefined') {
      query.type = type;
    } else if (type === 'undefined') {
      query.type = 'machine';
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (format && format !== '' && format !== 'undefined') {
      query.format = format;
    }

    if (searchQuery && searchQuery !== '') {
      query.vId = { $regex: searchQuery, $options: 'i' };
    }

    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Filter variables regarding categories.
    const listAllData = await db
      .collection(Variable.COLLECTION)
      .find(query, { projection: { _id: 0, vId: 1, descr: 1, format: 1, category: 1 } })
      .toArray();
    return { category: category, variables: listAllData };
  };

  /**
 * Modify the advice field of a variable.
 */
  static async modifyAdvice (vId, advice) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Filter variables regarding categories.
    const variable = await db
      .collection(Variable.COLLECTION)
      .updateOne(
        {
          vId: vId
        },
        {
          $set: {
            advice: advice
          }
        }
      );

    if (!variable.matchedCount) {
      return null;
    }

    return variable;
  };

  /**
 * Check if the variable exists and return true, false otherwise
 * @param {String} id
 */
  static async isVariableExists (id) {
    const db = await Mongo.instance().getDb();
    const variable = await db.collection(collections.VARIABLE_COLL).findOne({ vId: String(id) });
    if (!variable) {
      return new Error(`Variable ${id} Not Found`);
    }
    return variable;
  };

  /**
  * Get all values for each variables
  */
  static async getVariablesValues (card) {
    const db = await Mongo.instance().getDb();

    // Valid all variables and get property unit.
    const variableslist = card.variables;

    if (variableslist.length < 0) {
      return new Error('Can not found variables');
    }

    for (let i = 0; i < variableslist.length; i++) {
      // Get all object variable.
      const getVariable = await db.collection(collections.VARIABLE_COLL).findOne({ vId: variableslist[i].vId });

      if (!getVariable) {
        return new Error('Can not found this variable with this id');
      }

      // Get last value for each variable.
      const getLastValues = await samplesServices.getLastValues(variableslist[i].vId);

      const values = variableslist[i].values;

      delete variableslist[i].values;
      variableslist[i].result = {
        value: getLastValues.val,
        format: getVariable.format,
        unit: getVariable.unit
      };

      if (getVariable.format === 'bool') {
        const findGoodObject = values.find((element) => { return String(element.value) === String(getLastValues.val); });
        variableslist[i].result.label = findGoodObject.label;
        variableslist[i].result.color = findGoodObject.color;
      }
    }
    return card.variables;
    // Get all values for each variables and return cardMachine.
  };

  /**
  * Get all devices.
  */
  static async findDevices () {
    const db = await Mongo.instance().getDb();

    const getListDevices = await db.collection(collections.VARIABLE_COLL).distinct('deviceId');

    if (!getListDevices) {
      return new Error('Can not found devices');
    }

    return getListDevices;
  };

  /**
   * Create a new variable.
   */
  static async createVariable (variable) {
    const db = await Mongo.instance().getDb();

    // Affect identifier of the variable.
    variable._id = variable.vId;

    // Create variable.
    const addNewVariable = await db.collection(collections.VARIABLE_COLL).insertOne({
      ...variable,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!addNewVariable) {
      return new Error('Can not create this variable');
    }
    return addNewVariable;
  };

  /**
  * Get list of categories.
  */
  static async getListCategories () {
    const db = await Mongo.instance().getDb();

    const listCategories = await db.collection(collections.VARIABLE_COLL).distinct('category');

    if (!listCategories) {
      return new Error('Can not found any categories');
    }
    listCategories.sort();
    return listCategories;
  };

  /**
  * Update a variable.
  */
  static async updateVariable (id, variable) {
    const db = await Mongo.instance().getDb();

    // Update variable.
    const setVariable = await db.collection(collections.VARIABLE_COLL).updateOne(
      {
        _id: String(id)
      },
      {
        $set: {
          ...variable,
          updatedAt: new Date()
        }
      }
    );

    if (!setVariable) {
      return new Error('Can not update this variable');
    }
    return setVariable;
  };

  /**
  * Update all old samples with new data.
  */
  static async updateOldSamples (oldVariable, variable) {
    const query = {};

    // Find data to update.
    if (oldVariable.type !== variable.type) {
      query.t = variable.type;
    }
    if (oldVariable.category !== variable.category) {
      query.c = variable.category;
    }
    if (oldVariable.deviceId !== variable.deviceId) {
      query.dId = variable.deviceId;
    }
    if (oldVariable.unit !== variable.unit) {
      query.unit = variable.unit;
    }

    const db = await Mongo.instance().getDb();

    // Update samples with new data.
    const setSamples = await db.collection(collections.SAMPLE_COLL).updateMany(
      {
        vId: String(oldVariable.vId),
        d: { $lt: new Date() }
      },
      {
        $set: query
      }
    );

    if (!setSamples) {
      return new Error('Can not update old samples');
    }
  };

  /**
   * Delete one variable
   */
  static async delete (id) {
    const db = await Mongo.instance().getDb();

    const variable = await db.collection(collections.VARIABLE_COLL).deleteOne({ _id: id });
    if (!variable.deletedCount) {
      return new Error('The variable could not be deleted');
    }
    return variable.deletedCount;
  };

  static async isValidVariable (object) {
    return Variable.validator.validate('variable.schema.json', object);
  };

  /**
  * Check if the variable exists.
  * @param {String} id
  */
  static async getOneVariable (id) {
    const db = await Mongo.instance().getDb();
    const variable = await db.collection(collections.VARIABLE_COLL).findOne({ vId: String(id) });
    if (!variable) {
      return null; ;
    }
    return variable;
  };

  /**
  * Check all property before add variables.
  * @param {String} id
  */
  static async isVariable (variables) {
    const allErrors = [];
    let message = '';

    for (let i = 0; i < variables.length; i += 1) {
      const position = i + 1;
      const enable = variables[i].enable.toLowerCase();
      const visibility = variables[i].isVisible.toLowerCase();

      // Convert value boolean.
      variables[i].enable = (enable === 'true');
      variables[i].isVisible = (visibility === 'true');

      const check = await Variable.validator.validate('variable.schema.json', variables[i]);

      if (!check.valid) {
        message = `Line:${position}; Error for variable ${variables[i].vId} property ${check.error[0].path} ${check.error[0].message}`;
        allErrors.push(message);
      }
    };
    if (allErrors.length > 0) {
      return allErrors;
    }
    return [];
  }

  /**
  * upsertVariables all old samples with new data.
  */
  static async insertVariables (variables) {
    const db = await Mongo.instance().getDb();
    const devicesEnable = [];
    const count = {};
    count.countInserted = 0;
    count.countUpdated = 0;
    count.totalCount = 0;

    // For all variables check schema.
    for (let i = 0; i < variables.length; i += 1) {
      // Check if the device already exist.
      const isDeviceExist = await devicesService.getDevice(variables[i].deviceId);

      if (!isDeviceExist) {
        return new Error(`Can not find device :${variables[i].deviceId}`);
      }

      // Check is variable already exist.
      const variableExist = await Variable.getOneVariable(variables[i].vId);

      if (variableExist === null) {
        if (variables[i].enable && isDeviceExist.enable) {
          devicesEnable.push(isDeviceExist._id);
        }

        variables[i]._id = variables[i].vId;
        const insertVariables = await db.collection(collections.VARIABLE_COLL).insertOne({
          ...variables[i],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        if (!insertVariables) {
          return new Error(`Can not insert variable :${variables[i].vId}`);
        }
        count.countInserted++;
      } else {
        if (isDeviceExist.enable) {
          devicesEnable.push(isDeviceExist._id);
        }
        // Update variable.
        const setVariable = await db.collection(collections.VARIABLE_COLL).updateOne(
          {
            _id: String(variables[i].vId)
          },
          {
            $set: {
              ...variables[i],
              updatedAt: new Date()
            }
          }
        );
        if (!setVariable) {
          return new Error(`Can not update variable :${variables[i].vId}`);
        }
        count.countUpdated++;
      }
    }
    // Send data if device is enable.
    const devices = [...new Set(devicesEnable)];

    devices.forEach(async (device) => {
      const response = await devicesService.sendDataToDevice(device);

      if (response.body.code !== 200) {
        return new Error('Can not send data to device.');
      }
    });

    count.totalCount = count.countInserted + count.countUpdated;
    count.message = 'Import success';
    return count;
  }
}
module.exports = Variable;

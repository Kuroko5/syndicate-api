const { Mongo } = require('../app/class/mongo');
const moment = require('moment');
const schema = require('../src/collections/schemas/sample.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');

class Sample {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.sample.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator.and db connection
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.SAMPLE_COLL) {
      throw new Error('Missing env variable');
    }
    Sample.COLLECTION = collections.SAMPLE_COLL;
    Sample.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Sample.validator.init({ schemas: [schema] });

    Sample.db = instance.getDb();
  }

  /**
 * Get the first 5 currents defaults and alerts.
 * @param {*} type
 */
  static async getCurrentsSamples (type) {
    const typeQuery = type;
    // Get instance mongo.
    const db = await Mongo.instance().getDb();
    let latestSamples = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        { $match: { t: typeQuery } },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        }
      ])
      .sort({ d: -1 })
      .toArray();

    latestSamples = latestSamples.filter(s => s.val === true);
    const count = latestSamples.length;
    const result = latestSamples.splice(0, 5);
    // Return currents samples.
    return { count, result };
  };

  /**
 * Get selected defaults or alerts.
 * @param {*} type
 * @param {Array} variables
 */
  static async getSelectedSamples (type, variables) {
    const typeQuery = type;

    // Get instance mongo.
    const db = await Mongo.instance().getDb();
    let latestSamples = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        {
          $match: {
            t: typeQuery,
            vId: { $in: variables }
          }
        },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        }
      ])
      .sort({ d: -1 })
      .toArray();

    latestSamples = latestSamples.filter(s => s.val === true);
    const count = latestSamples.length;
    const result = latestSamples;
    // Return selected samples.
    return { count, result };
  };

  /**
 * Get the lastest samples.
 * @param {*} vIds
 */
  static async getLatestSamples (vIds) {
  // Check if param is in array of vIds.

    if (!Array.isArray(vIds) && vIds.length) {
      throw new Error('variable ids must be an array');
    }
    // Sort currents samples by date.

    const db = await Mongo.instance().getDb();
    const query = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        {
          $match: {
            vId: {
              $in: vIds
            }
          }
        },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        },
        { $limit: vIds.length || 1 }
      ])
      .sort({ d: -1 })
      .toArray();

    if (query) {
      return query;
    }
    return [];
  };

  /**
 * Get details for a sample required.
 * @param vId
 */
  static async getSample (vId, projection) {
  // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Get details as vId, date, category from the sample.
    const getOneSample = await db
      .collection(Sample.COLLECTION)
      .findOne(vId, { projection: projection });

    // If a variable is found.
    if (getOneSample) {
      return getOneSample;
    }
    return null;
  };

  /**
  * Generic function to recover all samples regarding type (default or alert), sorting by date.
  */
  static async getAllCurrentsSamples ({
    type,
    category,
    page,
    limit,
    sort,
    column
  }) {
  // Determinate type (default or alert).

    const typeQuery = type;
    const categoryQuery = category;

    // Prepare query
    const query = {};
    if (type && type !== 'all') {
      query.t = typeQuery;
    }
    if (category && category !== 'all') {
      query.c = categoryQuery;
    }
    // Prepare pagination, sort
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 25;
    const skip = (currentPage - 1) * currentLimit;
    const max = skip + currentLimit;

    let customSort = {};
    if (column) {
      customSort[column] = parseInt(sort);
    } else {
      // default sorting
      customSort = { _id: 1 };
    }

    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const samplesQuery = new Promise((resolve, reject) => {
      let error;
      const result = [];
      let counter = 0;
      const stream = db.collection(Sample.COLLECTION).aggregate([
        { $match: query },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        },
        { $match: { val: true } },
        { $sort: customSort }
      ], {
        cursor: { batchSize: 0 }
      });

      stream.on('data', sample => {
        if (counter >= max) {
          stream.close();
          return;
        }
        if (counter <= max && counter >= skip) {
          result.push(sample);
        }
        counter++;
      });

      stream.on('error', err => {
        error = err;
        reject(err);
      });

      stream.on('close', () => {
        if (error) {
          return;
        }
        resolve(result);
      });
    });
    // Count all results regarding query without filter on category.
    const totalCountQuery = Sample.totalCountAlertDefaultSamples(type);

    // Count currents samples.
    const countQuery = Sample.countAlertDefaultSamples(query);

    const [result, totalCount, count] = await Promise.all([samplesQuery, totalCountQuery, countQuery]);

    // Return result with informations for pagination.
    return { totalCount, count, result };
  };

  /**
  * Count all currents samples regarding type and query without filter on category.
  * @param {*} req
  * @param {*} res
  */
  static async totalCountAlertDefaultSamples (type) {
    const typeQuery = type;
    // Get instance mongo.
    const db = await Mongo.instance().getDb();
    const result = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        { $match: { t: typeQuery } },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        },
        { $match: { val: true } },
        { $count: 'total' }
      ])
      .toArray();

    // Calculate number of pages.
    if (result.length === 0) {
      return 0;
    } else {
      return result[0].total;
    }
  };

  /**
  * Count all currents samples regarding query
  * @param {*} req
  * @param {*} res
  */
  static async countAlertDefaultSamples (query) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();
    const result = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        { $match: query },
        { $sort: { d: -1 } },
        {
          $group: {
            _id: '$vId',
            vId: { $first: '$vId' },
            d: { $first: '$d' },
            val: { $first: '$val' },
            c: { $first: '$c' }
          }
        },
        { $match: { val: true } },
        { $count: 'total' }
      ])
      .toArray();

    // Calculate number of pages
    if (result.length === 0) {
      return 0;
    } else {
      return result[0].total;
    }
  };

  /**
  * Get the history for all samples regarding type (default or alert), sorting by date.
  */
  static async getSamplesHistory ({
    category,
    page,
    limit,
    column,
    sort,
    search,
    dates
  }) {
    // Search on the name of the variable.
    const searchQuery = search || '';

    // Validation startDate and endDate with moment.
    const requiredDateMin =
    dates && dates.min ? moment.utc(dates.min).toDate() : null;
    const requiredDateMax =
    dates && dates.max ? moment.utc(dates.max).toDate() : null;

    // Prepare query
    const query = {
      t: { $in: ['default', 'alert'] },
      vId: { $regex: searchQuery, $options: 'i' }
    };
    if (category && category !== 'all') {
      query.c = category;
    }
    if (requiredDateMin) {
      if (!query.d) {
        query.d = {};
      }
      query.d.$gte = requiredDateMin;
    }
    if (requiredDateMax) {
      if (!query.d) {
        query.d = {};
      }
      query.d.$lte = requiredDateMax;
    }
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Default values for page & limit.
    const currentPage = page || 1;
    const currentLimit = parseInt(limit) || 25;
    const skip = (currentPage - 1) * currentLimit;
    const max = skip + currentLimit;

    // Find all samples regarding the type, search and category.
    const current = {};
    const [result, count] = await new Promise((resolve, reject) => {
      const result = [];
      let error = null;
      let count = 0;
      const stream = db
        .collection(Sample.COLLECTION)
        .find(query, {
          projection: { _id: 0, vId: 1, d: 1, c: 1, val: 1, t: 1 }
        })
        .sort({ d: -1 });
      stream.on('data', sample => {
        if (sample.val === false) {
          current[sample.vId] = {
            vId: sample.vId,
            startDate: null,
            endDate: sample.d,
            type: sample.t,
            category: sample.c
          };
          return;
        }
        if (sample.val === true && current[sample.vId]) {
          current[sample.vId].startDate = sample.d;
          if (count < max && count >= skip) {
            result.push(current[sample.vId]);
          }
          current[sample.vId] = null;
          count++;
        }
      });
      stream.on('error', err => {
        error = err;
        reject(error);
      });
      stream.on('close', () => {
        if (error) {
          return;
        }
        resolve([result, count]);
      });
    });
    // Sort array.
    if (sort === '1') {
      result.sort((a, b) => (a[column] > b[column] ? 1 : -1));
    } else {
      result.sort((a, b) => (a[column] > b[column] ? -1 : 1));
    }
    // Return count of elements and data.
    return { count, result };
  };

  /**
  * Retrieves the latest sample for the given variable id
  * @param {String} vId variable id
  */
  static async getLatestVarSample (vId) {
    const db = await Mongo.instance().getDb();
    const result = await db
      .collection(Sample.COLLECTION)
      .find({ vId: vId })
      .sort({ d: -1 })
      .limit(1)
      .toArray();

    if (result) {
      return result;
    }
    return [];
  };

  /**
  * Get all values for each variables regarding search or and category.
  * @param {String} vId variable id
  * @param {Date} startDate variable id
  * @param {Date} endDate variable id
  */
  static async getSampleStream (vId, startDate, endDate) {
    const db = await Mongo.instance().getDb();
    return new Promise((resolve, reject) => {
      let error;
      const query = {
        vId: vId,
        d: {
          $gte: startDate,
          $lt: endDate
        }
      };
      const object = {
        name: vId,
        series: []
      };
      const stream = db.collection(Sample.COLLECTION).find(query).sort({ d: 1 });

      stream.on('data', sample => {
        object.series.push({
          value: sample.val,
          name: moment.utc(sample.d).format('YYYY-MM-DDTHH:mm:ss')
        });
      });
      stream.on('error', err => {
        error = err;
        reject(error);
      });
      stream.on('close', () => {
        if (error) {
          return;
        }
        resolve(object);
      });
    });
  }

  /**
  * Get the last values of variables.
  * @param {*} type
  */
  static async getLastValues (variable) {
    const db = await Mongo.instance().getDb();
    const latestValuesSamples = await db
      .collection(Sample.COLLECTION)
      .aggregate([
        { $match: { vId: variable } },
        { $sort: { d: -1 } },
        { $project: { vId: 1, val: 1 } }
      ])
      .toArray();
    const value = latestValuesSamples[0];
    // Return currents samples.
    return value;
  };

  /**
   * Retrieves a sample for the given variable id
   * @param {String} vId - the variable id
   */
  static async isExist (vId) {
    const db = await Mongo.instance().getDb();
    return db.collection(Sample.COLLECTION).findOne({ vId: vId });
  };
}

module.exports = Sample;

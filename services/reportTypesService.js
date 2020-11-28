const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/reportType.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');

class ReportType {
  constructor (object) {
    // Check if object is an object
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.reportType.properties) {
      this[i] = object[i];
    }
  }

  /**
  * initializes the schema validator
  * * Must be called before using this class
  */
  static async init () {
    if (!collections.REPORTTYPE_COLL) {
      throw new Error('Missing env variable');
    }

    ReportType.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await ReportType.validator.init({ schemas: [schema] });

    ReportType.db = instance.getDb();
  }

  /**
  * Create a reportType
  */
  static async create (reportType) {
    if (typeof reportType !== 'object') {
      throw new Error('Bad Parameter');
    }

    const db = await Mongo.instance().getDb();

    // Create reportType
    const addNewReportType = await db.collection(collections.REPORTTYPE_COLL).insertOne(
      {
        ...reportType
      }
    );

    if (!addNewReportType) {
      return new Error('Can not create this reportType');
    }

    return addNewReportType;
  }

  /**
   * Update a reportType.
   */
  static async updateOneReportType (id, label) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    const reportType = await db.collection(collections.REPORTTYPE_COLL).updateOne(
      {
        _id: ObjectId(id),
        language: 'fr-fr'
      },
      {
        $set: {
          label: label
        }
      }
    );

    if (!reportType) {
      return new Error('Can not update this reportType');
    }

    return reportType;
  };

  /**
   * Delete one reportType.
   */
  static async deleteReportType (id) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // DeleteOne reportType.
    const result = await db.collection(collections.REPORTTYPE_COLL).deleteOne({
      _id: ObjectId(id)
    });

    if (!result) {
      return new Error('Can not delete this reportType');
    }
    return result;
  };
}
module.exports = ReportType;

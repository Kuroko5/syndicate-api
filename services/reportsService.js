const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/report.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');

class Report {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.report.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.REPORT_COLL) {
      throw new Error('Missing env variable');
    }

    Report.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Report.validator.init({ schemas: [schema] });

    Report.db = instance.getDb();
  }

  /**
 * Create a new report.
 */
  static async addReport (report) {
    const db = await Mongo.instance().getDb();

    if (typeof report !== 'object') {
      throw new Error('Bad Parameter');
    }

    const isValid = await Report.isReport(report);

    if (!isValid.valid) {
      return new Error(' format of the report is not valid');
    }

    const addNewReport = await db.collection(collections.REPORT_COLL).insertOne({
      ...report,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!addNewReport) {
      return new Error('Can not create this new report');
    }
    return addNewReport;
  };

  /**
 * Get currents reports for the dashboard.
 */
  static async currentsReports (limit) {
    const currentLimit = limit || 5;
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Find only the field required.
    const result = await db
      .collection(collections.REPORT_COLL)
      .find(
        {},
        {
          projection: {
            _id: 1,
            name: 1,
            operator: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      )
    // Sorting and Limit the numbers of reports.
      .sort({ createdAt: -1 })
      .limit(currentLimit)
      .toArray();

    return result;
  };

  /**
 * Get one report.
 */
  static async getReport (id) {
  // Retrieve instance of Mongo.
    const db = await Mongo.instance().getDb();

    // Find Report by Id.
    const result = await db.collection(collections.REPORT_COLL).findOne(ObjectId(id));

    // If a report is found.
    if (result) {
      return result;
    }
    return null;
  };

  /**
 * Update one report.
 */
  static async modifyReport (id, report) {
    if (typeof report !== 'object') {
      throw new Error('Bad Parameter');
    }

    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const isValid = await Report.isReport(report);

    if (!isValid.valid) {
      return new Error('Format of the report is not valid');
    }

    // Update the report.
    const updatedReport = await db.collection(collections.REPORT_COLL).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          ...report,
          updatedAt: new Date()
        }
      }
    );

    if (!updatedReport) {
      return new Error('Can not create this new report');
    }
    return updatedReport;
  };

  /**
 * Delete one report.
 */
  static async hardDeleteReport (id) {
  // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // DeleteOne Report
    const deleteReport = await db.collection(collections.REPORT_COLL).deleteOne({
      _id: ObjectId(id)
    });

    if (!deleteReport) {
      return new Error('Can not create this new report');
    }
    return deleteReport;
  }

  /**
 * Check object with schema.
 */
  static async isReport (object) {
    return Report.validator.validate('report.schema.json', object);
  };
}

module.exports = Report;

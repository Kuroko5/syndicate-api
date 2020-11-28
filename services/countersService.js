const { Mongo } = require('../app/class/mongo');
const schema = require('../src/collections/schemas/counter.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const constants = require('../utils/constants');
const samplesServices = require('./samplesService');
const collections = require('../utils/collections');
const { ObjectId } = require('mongodb');
class Counter {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.counter.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator
   * Must be called before using this class
   */
  static async init () {
    Counter.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Counter.validator.init({ schemas: [schema] });

    Counter.db = instance.getDb();
  }

  /**
  * Convert time minutes regarding unit counter.
  */
  static converTime (unit, totalMinutes) {
    let value = 0;
    let days = 0;
    let hours = 0;
    let minutes = 0;

    if (totalMinutes < 0) {
      totalMinutes = 0;
    }
    switch (unit) {
      case 'day':
        days = Math.floor(totalMinutes / 1440);
        value = `${days} j`;
        break;
      case 'hour':
        hours = Math.floor(totalMinutes / 60);
        value = `${hours} h`;
        break;
      case 'minute':
        value = `${totalMinutes} min`;
        break;
      case 'all':
        days = Math.floor(totalMinutes / 1440);
        hours = Math.floor(totalMinutes / 60 % 24);
        minutes = ((totalMinutes % 60) - hours);
        value = `${days}j ${hours}h ${minutes}min`;
        break;
      default:
        value = `${totalMinutes} min`;
    }
    return value;
  }

  /**
   * Get last sample before startDate.
   */
  static async getLastSample (vId, date) {
    const db = await Mongo.instance().getDb();
    const lastSample = await db.collection(collections.SAMPLE_COLL).findOne({
      vId: { $eq: String(vId) },
      d: { $lt: date }
    });

    return lastSample;
  };

  /**
   * Get all samples after startDate.
   */
  static async getSamples (vId, date) {
    const db = await Mongo.instance().getDb();
    const getAllSamples = await db.collection(collections.SAMPLE_COLL)
      .aggregate([
        {
          $match: {
            vId: String(vId),
            d: { $gte: date }
          }
        }
      ])
      .sort({ d: 1 })
      .toArray();

    return getAllSamples;
  };

  /**
  * Get all counters with value.
  */
  static async getCounters (counters) {
    const listCounters = counters.result;

    for (let i = 0; i < listCounters.length; i += 1) {
      const vId = listCounters[i].variable.vId;
      const unit = listCounters[i].unit;
      const initOn = listCounters[i].initOn;

      let totalTime = 0;
      const first = {};
      let index = 0;

      if (listCounters[i].type === constants.COUNTER_TYPE_VARIABLE) {
        const varLastValue = await samplesServices.getLastValues(listCounters[i].variable.vId);
        if (varLastValue !== undefined) {
          // Convert hours/minutes.
          const value = varLastValue.val * 60;
          listCounters[i].value = Counter.converTime(unit, value);
        } else {
          const value = 0;
          listCounters[i].value = Counter.converTime(unit, value);
        }
      } else {
        // Get last sample before startDate.
        const getLastSample = await Counter.getLastSample(vId, listCounters[i].date);

        // Get all samples after startDate.
        const getAllSamples = await Counter.getSamples(vId, listCounters[i].date);

        // If no samples for this variable.
        if (!getAllSamples.length && !getLastSample.vId) {
          const value = 0;
          listCounters[i].value = Counter.converTime(unit, value);
        }

        // If no samples after init counter.
        if (!getAllSamples.length && getLastSample.vId) {
          totalTime = initOn === getLastSample.val ? new Date() - listCounters[i].date : 0;
          totalTime = Math.floor((totalTime / 60000));
          totalTime = Math.abs(totalTime);
          listCounters[i].value = Counter.converTime(unit, totalTime);
        };

        // If no samples before init counter.
        if (getAllSamples.length && !getLastSample.vId) {
          first.start = listCounters[i].date;
          first.val = initOn;
          index = 0;
        };

        // If samples before  or after init counter.
        if (getAllSamples.length && getLastSample.vId) {
          const lastIndex = getLastSample.val;

          if (lastIndex === initOn) {
            first.start = listCounters[i].date;
            first.val = initOn;
          };

          if (lastIndex !== initOn) {
            const getFirstItem = getAllSamples.filter((elem) => { return elem.val === initOn; });
            if (getFirstItem.length) {
            // Initialize first interval.
              first.start = getFirstItem[0].d;
              first.val = getFirstItem[0].val;
              const findIndex = getAllSamples.findIndex((element) => element.d === first.start);
              if (findIndex > 0) {
                index = findIndex;
              }
            }
            totalTime = 0;
          };

          // Get time counter.
          for (index; index < getAllSamples.length; index += 1) {
            if (((getAllSamples[index].val === first.val) && first.val === initOn) || (first.val === initOn && getAllSamples[index].val !== first.val)) {
              const interval = Math.abs(getAllSamples[index].d - first.start);
              totalTime = interval + totalTime;
              first.start = getAllSamples[index].d;
              first.val = getAllSamples[index].val;
            }
            first.start = getAllSamples[index].d;
            first.val = getAllSamples[index].val;
          }

          // Add time if the sample has the same value of initOn.
          const lastsamples = getAllSamples[getAllSamples.length - 1];

          if (lastsamples.val === initOn) {
            const intervalToAdd = Math.abs(new Date() - lastsamples.d);
            totalTime = intervalToAdd + totalTime;
          }

          // Convert totalTime on minutes
          totalTime = Math.floor((totalTime / 60000));
          listCounters[i].value = Counter.converTime(unit, totalTime);
        }
      }
    }
    counters.result = [...listCounters];
    return counters;
  }

  /**
   * Insert a new Counter object
   * @param {Object} object - object to insert
   * @return {number} response - 1 if element has been inserted, else error
   */
  static async insert (object) {
    object = new Counter(object);

    const result = await Counter.db.collection(collections.COUNTER_COLL).insertOne(
      {
        ...object,
        updatedAt: object.date,
        createdAt: object.date
      }
    );

    if (!result.insertedCount) {
      return new Error('The element could not be inserted');
    }
    return result.insertedCount;
  };

  /**
   * Delete  a Counter
   * @param {Object} id - object to delete
   * @return {number} response - 1 if element has been updated, else error
   */
  static async delete (id) {
    const result = await Counter.db.collection(collections.COUNTER_COLL).deleteOne({ _id: ObjectId(id) });

    if (!result) {
      return new Error('The element could not be deleted');
    }
    return result;
  };

  /**
   * Update a Counter
   * @param {dtring} id - id of counter to update
   * @param {Object} data - data for update
   * @return {number} response - 1 if element has been updated, else error
   */
  static async update (id, data) {
    const result = await Counter.db.collection(collections.COUNTER_COLL).update(
      { _id: ObjectId(id) },
      {
        ...data,
        updatedAt: new Date()
      }
    );

    if (!result) {
      return new Error('The element could not be updated');
    }
    return result;
  };

  /**
   * Reset value and date of a Counter
   * @param {string} id - id of counter to reset
   * @return {number} response - 1 if element has been updated, else error
   */
  static async reset (id) {
    const result = await Counter.db.collection(collections.COUNTER_COLL).updateOne(
      { _id: ObjectId(id) },
      {
        $set: {
          date: new Date(),
          value: null
        }
      }
    );

    if (!result) {
      return new Error('The element could not be reset');
    }
    return result;
  };

  /**
   * Check object with schema
   * @param {Object} object - object to check
   * @return {Object} response
   */
  static async isCounter (object) {
    return Counter.validator.validate('counter.schema.json', object);
  };
}
module.exports = Counter;

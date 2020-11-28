const { Mongo } = require('../app/class/mongo');
const { ObjectId } = require('mongodb');
const schema = require('../src/collections/schemas/station.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const debug = require('debug');
const log = {
  info: debug('station:info'),
  error: debug('station:error'),
  debug: debug('station:debug')
};
const ping = require('ping');

class Station {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.station.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator.and db connection
   * * Must be called before using this class
   */
  static async init () {
    if (!collections.STATION_COLL) {
      throw new Error('Missing env variable');
    }
    Station.COLLECTION = collections.STATION_COLL;
    Station.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Station.validator.init({ schemas: [schema] });

    Station.db = instance.getDb();
  }

  /*
   * Create a new station.
   */
  static async addStation (station) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Insert position of the station.
    const countStations = await db.collection(Station.COLLECTION).countDocuments();

    if (countStations === 0) {
      station.position = Number(1);
    }
    station.position = Number(countStations) + 1;
    const isValid = await Station.isValidObject(station);

    // Before creation check if object station is valid.
    if (isValid.valid) {
      // Create a new station
      return db.collection(Station.COLLECTION).insertOne({
        ...station,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      log.debug('Warning - couldn\'t insert station \n', station);
      return null;
    }
  };

  /**
   * Modify a station
   */
  static async modifyStation (id, station) {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const isValid = await Station.isValidObject(station);

    // Before creation check if object station is valid.
    if (isValid.valid) {
      // update a station
      const result = await db.collection(Station.COLLECTION).updateOne(
        {
          _id: ObjectId(id)
        },
        {
          $set: {
            ...station,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      if (!result.matchedCount) {
        return null;
      }

      return result;
    } else {
      log.debug('Warning - couldn\'t modify station \n', station);
      return null;
    }
  };

  /**
   * Control if schema station is valid.
   */
  static async isValidObject (object) {
    return Station.validator.validate('station.schema.json', object);
  }

  /**
   * Get all station with their variables.
   */
  static async allStations () {
    // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const allStations = await db.collection(Station.COLLECTION)
      .find()
      .sort({ position: 1 })
      .toArray();

    if (!allStations) {
      return null;
    }

    return allStations;
  };

  /**
   * Delete one station.
   */
  static async deleteOneStation (id) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Find all object station and get position.
    const findStation = await serviceUtils.isExist(id, Station.COLLECTION);

    if (findStation instanceof Error) {
      return new Error(' Can not found this station');
    }

    // Set position of the station.
    const positionSt = Number(findStation.position);

    // Get all stations with next position.
    const nextStations = await db.collection(Station.COLLECTION)
      .find(
        {},
        { position: { $gt: { positionSt } } }
      )
      .sort({ position: 1 })
      .toArray();

    // First delete selected station and after update position for next stations.
    const result = await db.collection(Station.COLLECTION).deleteOne({ _id: ObjectId(id) });

    if (!result) {
      return null;
    }

    // If station has been deleted, we can update position for all stations.
    for (let i = 0; i < nextStations.length; i += 1) {
      nextStations[i].position = (Number(nextStations[i].position) - 1);
      await db.collection(Station.COLLECTION).updateOne(
        {
          _id: ObjectId(nextStations[i]._id)
        },
        {
          $set: {
            position: nextStations[i].position
          }
        }
      );
    }
    return result;
  };

  /**
   * Ping : send a packet to a host
   */
  static async ping (ip) {
    const result = await ping.promise.probe(ip);
    return result;
  };

  /**
   * Modify the position of a station
   */
  static async position (id, position) {
    // Get instance mongo.
    const db = await Mongo.instance().getDb();

    // Update the position of a station
    const station = await db.collection(Station.COLLECTION).updateOne(
      {
        _id: ObjectId(id)
      },
      {
        $set: {
          position
        }
      }
    );

    if (!station.matchedCount) {
      return null;
    }

    return station;
  };
}

module.exports = Station;

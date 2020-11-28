const { Mongo } = require('../app/class/mongo');
const schema = require('../src/collections/schemas/device.json');
const SchemaValidator = require('../lib/utils/schema-validator');
const collections = require('../utils/collections');
const request = require('request');
class Device {
  constructor (object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Requires an object');
    }
    for (const i in schema.definitions.device.properties) {
      this[i] = object[i];
    }
  }

  /**
   * initializes the schema validator
   * Must be called before using this class
   */
  static async init () {
    Device.validator = new SchemaValidator();
    const instance = Mongo.instance();

    await Device.validator.init({ schemas: [schema] });

    Device.db = instance.getDb();
  }

  /**
  * For filter by machineId, get all machineId.
  */
  static async getMachineId () {
  // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Find list of unique machineId.
    const listAllMachineIdValues = await db.collection(collections.DEVICE_COLL).distinct('machineId');

    if (!listAllMachineIdValues) {
      return new Error('Can not found machineId values');
    }

    const machines = [];
    for (let i = 0; i < listAllMachineIdValues.length; i += 1) {
      const allDevices = await db.collection(collections.DEVICE_COLL)
        .find({
          machineId: listAllMachineIdValues[i]
        })
        .toArray();

      if (allDevices) {
        const machine = {};

        machine._id = listAllMachineIdValues[i];
        machine.level = 1;

        machines.push(machine);

        let equipmentsList = allDevices.map((element) => { return element.equipmentId; });
        equipmentsList = Array.from(new Set(equipmentsList));

        if (equipmentsList.length) {
          equipmentsList.forEach(element => {
            const obj = {};
            obj._id = element;
            machines.push(obj);
          });
        }
      }
    };

    return machines;
  }

  /**
  * Find device by identifier..
  */
  static async getDevice (deviceId) {
  // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    const device = await db.collection(collections.DEVICE_COLL).findOne({ _id: String(deviceId) });

    if (!device) {
      return new Error('Can not found this specific object');
    }
    return device;
  };

  /**
  * Create a device
  */
  static async addDevice (device) {
    // Retrieve instance of Mongo

    const db = await Mongo.instance().getDb();

    // Cast rack, slot, period to number.
    device.period = parseInt(device.period);
    device.rack = parseInt(device.rack);
    device.slot = parseInt(device.slot);

    const deviceToCreate = await db.collection(collections.DEVICE_COLL).insertOne(
      {
        ...device,
        createdAt: new Date()
      }
    );

    if (!deviceToCreate) {
      return new Error('Can not create this device');
    }
    return deviceToCreate;
  };

  /**
  * Update a device
  */
  static async editDevice (id, device) {
    // Retrieve instance of Mongo

    const db = await Mongo.instance().getDb();

    // Cast rack, slot, period to number.
    device.period = parseInt(device.period);
    device.rack = parseInt(device.rack);
    device.slot = parseInt(device.slot);

    const upDevice = await db.collection(collections.DEVICE_COLL).updateOne(
      {
        _id: String(id)
      },
      {
        $set: {
          ...device
        }
      }
    );

    if (!upDevice) {
      return new Error('Can not update this device');
    }
    return upDevice;
  };

  /**
  * Delete a device
  */
  static async deleteOneDevice (id) {
  // Retrieve instance of Mongo
    const db = await Mongo.instance().getDb();

    // Changed state for all variables with the specific device.
    const getAllVariables = await db.collection(collections.VARIABLE_COLL).find({
      deviceId: String(id)
    })
      .toArray();
    for (let i = 0; i < getAllVariables.length; i += 1) {
      const updatedVariables = await db.collection(collections.VARIABLE_COLL)
        .updateOne({ _id: getAllVariables[i].vId },
          {
            $set: {
              enable: false
            }
          }
        );

      if (!updatedVariables) {
        return new Error('Can not update the state of this variable');
      }
    }

    // Delete the device
    const result = await db.collection(collections.DEVICE_COLL).deleteOne({
      _id: String(id)
    });

    if (!result) {
      return new Error('Can not delete this device');
    }
    return result;
  }

  /**
  * Add new queue after create a new device.
  */
  static async createNewQueue (id) {
    const options = {
      method: 'POST',
      url: `${process.env.DATA_ACQUISITION}/api/v0/device`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: { deviceId: id },
      json: true
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response) => {
        // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve(response);
      });
    });
  };

  /**
  * Send data to plugin.
  */
  static async sendDataToDevice (id) {
    const options = {
      method: 'PUT',
      url: `${process.env.DATA_ACQUISITION}/api/v0/device/${id}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response) => {
      // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve(response);
      });
    });
  };

  /**
  * Update queue after delete device.
  */
  static async deleteQueue (id) {
    const options = {
      method: 'DELETE',
      url: `${process.env.DATA_ACQUISITION}/api/v0/device/${id}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response) => {
        // if error
        if (error) {
          return reject(error);
        }
        // if success
        return resolve(response);
      });
    });
  };
}
module.exports = Device;

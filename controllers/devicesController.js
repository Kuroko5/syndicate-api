require('dotenv-safe').config();
require('../passport-strategy');
const serviceUtils = require('../utils/utils');
const collections = require('../utils/collections');
const devicesService = require('../services/devicesService');
const regexIp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
/**
 * Get all devices
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllDevices = async (req, res, next) => {
  try {
    // Get all devices
    const devices = await serviceUtils.getAllResults(req.query, collections.DEVICE_COLL);

    if (devices instanceof Error) {
      return res.status(400).send({ code: 400, message: devices.message });
    }
    return res.status(200).send({ code: 200, data: devices });
  } catch (e) {
    next(e);
  }
};

/**
 * Get all equipmentId regarding machineId
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getAllMachinesId = async (req, res, next) => {
  try {
    // Get all machineId
    const listMachineId = await devicesService.getMachineId();

    if (listMachineId instanceof Error) {
      return res.status(400).send({ code: 400, message: listMachineId.message });
    }
    return res.status(200).send({ code: 200, data: listMachineId });
  } catch (e) {
    next(e);
  }
};
/**
 * Create a new device.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createDevice = async (req, res, next) => {
  try {
    const device = req.body;

    // Control value of rack, slot and period (must be number).
    if (typeof device.rack !== 'number' || device.rack === undefined || device.rack < 0) {
      return res.status(400).send({ code: 400, message: 'Rack is required and must be a number' });
    }

    if (typeof device.slot !== 'number' || device.slot === undefined || device.slot < 0) {
      return res.status(400).send({ code: 400, message: 'Slot is required and must be a number' });
    }

    if (typeof device.period !== 'number' || device.period === undefined || device.period < 0) {
      return res.status(400).send({ code: 400, message: 'Period is required and must be a number' });
    }

    // Check if the mandatory data is present.
    if (!device._id || !device.constructionId || !device.machineId || !device.equipmentId || !device.ip) {
      return res.status(400).send({ code: 400, message: 'All fields are required' });
    }

    // Check ip of the device.
    if (!regexIp.test(device.ip)) {
      return res.status(400).send({ message: 'Format of IP address incorrect' });
    }

    // Check if the device already exist.
    const getDevice = await devicesService.getDevice(device._id);

    if (getDevice._id) {
      return res.status(400).send({ code: 404, message: 'A device with the same identifier already exists' });
    }

    // Create device.
    const addNewDevice = await devicesService.addDevice(device);

    if (addNewDevice instanceof Error) {
      return res.status(400).send({ code: 400, message: addNewDevice.message });
    }
    // Send request to data acquisition to create a new queue.
    const queue = await devicesService.createNewQueue(addNewDevice.insertedId);
    if (queue.body.code !== 200) {
      return res.status(queue.body.code).send({ code: queue.body.code, message: queue.body.message });
    }

    return res.status(200).send({ code: 200, message: 'Device created' });
  } catch (e) {
    next(e);
  }
};

/**
 * Update a device.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deviceToUpdate = req.body;

    // Check if the device already exist.
    const isDeviceExist = await devicesService.getDevice(id);

    if (isDeviceExist instanceof Error) {
      return res.status(400).send({ code: 404, message: isDeviceExist.message });
    }
    // Can not changed the identifier of the plugin.
    if (String(deviceToUpdate._id) !== String(isDeviceExist._id)) {
      return res.status(400).send({ code: 400, message: 'Identifier of the device can not be changed' });
    }

    // Control value of rack, slot and period (must be number).
    if (typeof deviceToUpdate.rack !== 'number' || deviceToUpdate.rack === undefined || deviceToUpdate.rack < 0) {
      return res.status(400).send({ code: 400, message: 'Rack is required and must be a number' });
    }

    if (typeof deviceToUpdate.slot !== 'number' || deviceToUpdate.slot === undefined || deviceToUpdate.slot < 0) {
      return res.status(400).send({ code: 400, message: 'Slot is required and must be a number' });
    }

    if (typeof deviceToUpdate.period !== 'number' || deviceToUpdate.period === undefined || deviceToUpdate.period < 0) {
      return res.status(400).send({ code: 400, message: 'Period is required and must be a number' });
    }

    // Check if the mandatory data is present.
    if (!deviceToUpdate._id || !deviceToUpdate.constructionId || !deviceToUpdate.machineId || !deviceToUpdate.equipmentId ||
       !deviceToUpdate.ip) {
      return res.status(400).send({ code: 400, message: 'All fields are required' });
    }

    // Check ip of the device.
    if (!regexIp.test(deviceToUpdate.ip)) {
      return res.status(400).send({ message: 'Format of IP address incorrect' });
    }

    // Update device.
    const updateOneDevice = await devicesService.editDevice(id, deviceToUpdate);

    if (updateOneDevice instanceof Error) {
      return res.status(400).send({ code: 400, message: updateOneDevice.message });
    }

    // Send request to send data to plugin.
    if (isDeviceExist.enable) {
      const queue = await devicesService.sendDataToDevice(id);
      if (queue.body.code !== 200) {
        return res.status(queue.body.code).send({ code: queue.body.code, message: queue.body.message });
      }
    }

    return res.status(200).send({ code: 200, message: 'Device has been updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a device.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the device already exist.
    const isDeviceExist = await devicesService.getDevice(id);

    if (isDeviceExist instanceof Error) {
      return res.status(400).send({ code: 404, message: isDeviceExist.message });
    }

    // Delete device.
    const killOneDevice = await devicesService.deleteOneDevice(id);

    if (killOneDevice instanceof Error) {
      return res.status(400).send({ code: 400, message: killOneDevice.message });
    }

    // Send request to delete queue (data acquisition).
    const queue = await devicesService.deleteQueue(id);
    if (queue.body.code !== 200) {
      return res.status(queue.body.code).send({ code: queue.body.code, message: queue.body.message });
    }

    return res.status(200).send({ code: 200, message: 'Device has been deleted' });
  } catch (e) {
    next(e);
  }
};
module.exports = {
  getAllDevices,
  getAllMachinesId,
  createDevice,
  updateDevice,
  deleteDevice
};

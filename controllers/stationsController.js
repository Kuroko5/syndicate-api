const stationsService = require('../services/stationsService');
const samplesServices = require('../services/samplesService');
const collections = require('../utils/collections');
const serviceUtils = require('../utils/utils');
const regexIp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Set value of variables and state of Station.
 * @param station - The station to set values
 */
async function setState (station) {
  try {
    // Affect variable communication and last value.
    if (station.vComm) {
      const variableComm = await samplesServices.getLastValues(station.vComm.vId);
      station.vComm.value = variableComm.val;
    } else {
      station.vComm = null;
    }

    // Affect variable material and last value.
    if (station.vMachine) {
      const variableEquipment = await samplesServices.getLastValues(station.vMachine.vId);
      station.vMachine.value = variableEquipment.val;
    } else {
      station.vMachine = null;
    }

    // Add property state for global state of the station
    station.state = true;

    if (station.variables && station.variables.length > 0) {
      for (let i = 0; i < station.variables.length; i += 1) {
        const getValuesVariables = await samplesServices.getLastValues(station.variables[i].vId);
        station.variables[i].value = getValuesVariables.val;
      }
    } else {
      station.variables = [];
    }

    // Set property state for global state of the station
    if ((station.vComm !== null && !station.vComm.value) || (station.vMachine !== null && !station.vMachine.value)) {
      station.state = false;
    }
    if (station.variables && station.variables.length > 0) {
      if (station.variables.find(x => !x.value)) {
        station.state = false;
      }
    }

    return station;
  } catch (e) {
    console.error(e);
  }
}

/**
 * Create a new Station.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const createStation = async (req, res, next) => {
  // Build objet with informations from body
  try {
    let station = req.body;

    // For creation only the name is required.
    if (!station.label || !station.ip) {
      return res.status(404).send({ message: 'Name and IP are required' });
    }

    // Check if station don't already exist.
    const findStation = await serviceUtils.isExist(station.label, collections.STATION_COLL);

    if (findStation && findStation.label) {
      return res.status(404).send({ message: 'This station already exists' });
    }

    // Check ip of the station
    if (!regexIp.test(station.ip)) {
      return res.status(404).send({ message: 'Format of IP address incorrect' });
    }

    // Create new station.
    station = await setState(station);
    if (!station) {
      return res.status(404).send({ message: 'A error occured while setting state' });
    }
    const newStation = await stationsService.addStation(station);

    if (!newStation) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    }
    return res.status(201).send({ code: 201, message: 'New station created' });
  } catch (e) {
    next(e);
  }
};

/**
 * get all Station.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const all = async (req, res, next) => {
  try {
    // Get all station.
    const allStations = await stationsService.allStations();

    const toPromise = await allStations.map(async (station) => {
      const result = setState(station);
      if (!result) {
        return res.status(404).send({ message: 'A error occured while setting state' });
      }
      return result;
    });

    const results = await Promise.all(toPromise);

    if (!allStations) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    }

    return res.status(201).send({ code: 200, data: results });
  } catch (e) {
    next(e);
  }
};

/**
 * Update one station.
 * @param id
 * @param {*} res
 * @param {*} next
 */
const putStation = async (req, res, next) => {
  // Build objet with informations from body
  try {
    const { id } = req.params;
    let station = req.body;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ message: 'Wrong id' });
    }

    // Check if all required fields are completed.
    if (!station.label || !station.ip) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    if (station.vComm) {
      if (!station.vComm.vId || !station.vComm.descr) {
        return res.status(404).send({ message: 'Data do not have the correct format' });
      }
    }

    if (station.vMachine) {
      if (!station.vMachine.vId || !station.vMachine.descr) {
        return res.status(404).send({ message: 'Data do not have the correct format' });
      }
    }

    if (station.variables) {
      if (!Array.isArray(station.variables)) {
        return res.status(404).send({ message: 'Data do not have the correct format' });
      }
      const element = station.variables.every(i => {
        if ((typeof i === 'object') && (i.vId) && (i.descr)) {
          return true;
        }
      });
      if (!element) {
        return res.status(404).send({ message: 'Data do not have the correct format' });
      }
    }

    // Check ip of the station
    if (!regexIp.test(station.ip)) {
      return res.status(404).send({ message: 'Format of IP address incorrect' });
    }

    station = await setState(station);
    if (!station) {
      return res.status(404).send({ message: 'A error occured while setting state' });
    }
    const result = await stationsService.modifyStation(id, station);

    if (!result) {
      return res.status(404).send({ code: 404, message: 'Not Found' });
    }

    return res.status(200).send({ code: 200, message: 'Station updated' });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a selected station.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const deleteStation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the id is valid.
    if (id.length !== 24) {
      return res.status(400).send({ code: 400, message: ' Wrong id' });
    }

    // Delete one station.
    const deleteOneStation = await stationsService.deleteOneStation(id);

    if (!deleteOneStation) {
      return res.status(400).send({ code: 400, message: 'A error occured' });
    }
    return res.status(201).send({ code: 201, message: 'This station has been deleted' });
  } catch (e) {
    next(e);
  }
};

/**
 * Ping a Station.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const pingStation = async (req, res, next) => {
  try {
    const { ip } = req.body;

    // Check if all required fields are completed.
    if (!ip) {
      return res.status(404).send({ message: 'All fields are required' });
    }

    // Check ip of the station
    if (!regexIp.test(ip)) {
      return res.status(404).send({ message: 'Format of IP address incorrect' });
    }

    // Ping a station
    const result = await stationsService.ping(ip);

    if (!result.alive) {
      return res.status(200).send({ message: 'Ping failed', state: result.alive, time: result.time });
    }
    return res.status(200).send({ message: 'Ping successful', state: result.alive, time: result.time });
  } catch (e) {
    next(e);
  }
};

/**
 * Modify the position of the stations.
 * @param stations
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const positionStation = async (req, res, next) => {
  try {
    // Get array of stations id
    const { stations } = req.body;

    // Check if all required fields are completed.
    if (!stations || !Array.isArray(stations)) {
      return res.status(404).send({ message: 'All fields are required' });
    }
    // Check if stations is a array of Mongo id
    const element = stations.every(i => (typeof i === 'string') && (i.length === 24));
    if (!element) {
      return res.status(404).send('Wrong format');
    }

    // Set the position of each stations
    for (let i = 0; i < stations.length; i++) {
      const result = await stationsService.position(stations[i], i + 1);

      if (!result) {
        return res.status(400).send({ code: 400, message: 'A error occured' });
      }
    }

    return res.status(200).send({ code: 200, message: 'Position updated success' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createStation,
  putStation,
  all,
  deleteStation,
  pingStation,
  positionStation
};
